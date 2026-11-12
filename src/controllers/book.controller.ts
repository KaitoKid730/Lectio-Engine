import { Request, Response } from 'express';
import { z } from 'zod';
import { getDbPool } from '../db';
import { sendResponse } from '../utils/response';
import { calculateFleschKincaid, MAX_MANUSCRIPT_CHARACTERS } from '../services/textChunking.service';
import { executePrompt } from '../services/gemini.service';

const ProcessBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  targetGrade: z.string().default('Grade 5'),
  districtId: z.string().optional(),
  text: z.string().min(1, 'Manuscript text is required'),
});

const ModerationSchema = z.preprocess((val: any) => {
  if (typeof val === 'boolean') {
    return { safe: val, reason: '' };
  }
  if (val && typeof val === 'object') {
    return {
      safe: Boolean(val.safe ?? val.isSafe ?? val.approved ?? !val.flagged ?? true),
      reason: String(val.reason || val.explanation || val.details || ''),
    };
  }
  return { safe: true, reason: '' };
}, z.object({
  safe: z.boolean(),
  reason: z.string().optional(),
}));

const PIIRedactionSchema = z.preprocess((val: any) => {
  if (typeof val === 'string') {
    return { cleanedText: val, piiFound: false };
  }
  if (val && typeof val === 'object') {
    return {
      cleanedText: String(val.cleanedText || val.cleanText || val.sanitizedText || val.text || ''),
      piiFound: Boolean(val.piiFound ?? val.hasPii ?? val.piiDetected ?? false),
    };
  }
  return { cleanedText: '', piiFound: false };
}, z.object({
  cleanedText: z.string(),
  piiFound: z.boolean(),
}));

/**
 * POST /api/books/process
 * 1. Validates input & 500k character limit (HTTP 413 if exceeded)
 * 2. Runs fast synchronous moderation & PII redaction guardrails
 * 3. Inserts book record into DB with status = 'processing'
 * 4. Dispatches job to background_jobs table
 * 5. Returns HTTP 202 immediately with initial book record
 */
export async function processBookController(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = ProcessBookSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendResponse(res, 400, false, undefined, parseResult.error.issues[0].message);
      return;
    }

    const { title, author, targetGrade, districtId, text } = parseResult.data;

    // 1. Strict 500,000 character limit enforcement
    if (text.length > MAX_MANUSCRIPT_CHARACTERS) {
      sendResponse(
        res,
        413,
        false,
        undefined,
        `Manuscript text exceeds maximum character limit of ${MAX_MANUSCRIPT_CHARACTERS.toLocaleString()} characters (received ${text.length.toLocaleString()} chars).`
      );
      return;
    }

    // 2. Synchronous Fast Guardrails (Moderation & PII Redaction)
    let cleanText = text;
    try {
      const modResult = await executePrompt(
        'content.moderation.v1',
        'gemini-3.6-flash',
        'You are a content safety auditor for K-12 educational materials. Evaluate if text is safe for school environments (no hate speech, extreme violence, explicit content).',
        `TEXT SAMPLE: ${text.slice(0, 3000)}`,
        ModerationSchema,
        0.0,
        1000
      );

      if (!modResult.safe) {
        sendResponse(
          res,
          400,
          false,
          undefined,
          `Content safety policy violation: ${modResult.reason || 'Material flagged as inappropriate for K-12 classrooms.'}`
        );
        return;
      }
    } catch (mErr: any) {
      console.warn('[Book Controller] Content moderation bypassed/failed:', mErr?.message);
    }

    try {
      const piiResult = await executePrompt(
        'content.pii-redaction.v1',
        'gemini-3.6-flash',
        'You are a privacy protection bot. Scan the provided manuscript text and sanitize any student PII (student full names, phone numbers, SSNs, personal addresses). Return the cleanedText.',
        `TEXT SAMPLE: ${cleanText.slice(0, 3000)}`,
        PIIRedactionSchema,
        0.0,
        1500
      );

      if (piiResult.piiFound && piiResult.cleanedText) {
        cleanText = piiResult.cleanedText + cleanText.slice(3000);
      }
    } catch (pErr: any) {
      console.warn('[Book Controller] PII Redaction check bypassed/failed:', pErr?.message);
    }

    // 3. Local metrics pre-calculation
    const localMetrics = calculateFleschKincaid(cleanText);

    const pool = getDbPool();
    const userId = (req as any).user?.id || null;
    const effectiveDistrictId = districtId || (req as any).user?.districtId || null;

    const bookId = crypto.randomUUID();
    const jobId = crypto.randomUUID();

    // 4. Create initial book record in 'processing' status
    const bookInsertRes = await pool.query(
      `
      INSERT INTO books (
        id, title, author, target_grade, district_id, total_word_count, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, 'processing', $7)
      RETURNING *;
    `,
      [bookId, title, author, targetGrade, effectiveDistrictId, localMetrics.wordCount, userId]
    );

    const book = bookInsertRes.rows[0];

    // 5. Enqueue background job
    await pool.query(
      `
      INSERT INTO background_jobs (
        id, job_type, payload, status
      ) VALUES ($1, 'book_processing', $2::jsonb, 'queued');
    `,
      [
        jobId,
        JSON.stringify({
          bookId: book.id,
          text: cleanText,
          title,
          author,
          targetGrade,
        }),
      ]
    );

    sendResponse(res, 202, true, {
      id: book.id,
      title: book.title,
      author: book.author,
      targetGrade: book.target_grade,
      totalWordCount: book.total_word_count,
      status: book.status,
      createdAt: book.created_at,
      message: 'Book manuscript accepted and queued for AI chapter/vocab processing.',
    });
  } catch (err: any) {
    console.error('[Process Book Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Internal server error processing book.');
  }
}

/**
 * GET /api/books/:id
 * Fetches a single book details for polling / viewing
 */
export async function getBookByIdController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const pool = getDbPool();

    const bookRes = await pool.query(`SELECT * FROM books WHERE id = $1;`, [id]);
    if (bookRes.rows.length === 0) {
      sendResponse(res, 404, false, undefined, 'Book not found.');
      return;
    }

    const row = bookRes.rows[0];
    sendResponse(res, 200, true, {
      id: row.id,
      districtId: row.district_id,
      title: row.title,
      author: row.author,
      targetGrade: row.target_grade,
      totalWordCount: row.total_word_count,
      summary: row.summary,
      chapters: row.chapters || [],
      vocabulary: row.vocabulary || [],
      moralThemes: row.moral_themes || [],
      status: row.status,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err: any) {
    console.error('[Get Book Controller] Error:', err);
    sendResponse(res, 500, false, undefined, 'Internal server error fetching book.');
  }
}

/**
 * GET /api/books
 * Lists books
 */
export async function listBooksController(req: Request, res: Response): Promise<void> {
  try {
    const pool = getDbPool();
    const result = await pool.query(`SELECT * FROM books ORDER BY created_at DESC LIMIT 50;`);

    const books = result.rows.map((row) => ({
      id: row.id,
      districtId: row.district_id,
      title: row.title,
      author: row.author,
      targetGrade: row.target_grade,
      totalWordCount: row.total_word_count,
      summary: row.summary,
      chapters: row.chapters || [],
      vocabulary: row.vocabulary || [],
      moralThemes: row.moral_themes || [],
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    sendResponse(res, 200, true, books);
  } catch (err: any) {
    console.error('[List Books Controller] Error:', err);
    sendResponse(res, 500, false, undefined, 'Internal server error listing books.');
  }
}
