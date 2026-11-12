import { Request, Response } from 'express';
import { z } from 'zod';
import { getDbPool } from '../db';
import { sendResponse } from '../utils/response';

const GenerateLessonSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== 'object') return {};
  const rawTitle = val.title || val.topic || val.bookTitle || val.customTopic || 'Lesson Plan';
  const sourceBookId = val.sourceBookId || val.bookId || undefined;
  const targetGradeLevel = val.targetGradeLevel || val.gradeLevel || val.targetGrade || 'Grade 5';
  const rawDuration = val.durationMinutes ?? val.duration ?? 45;
  const durationMinutes = typeof rawDuration === 'number' ? rawDuration : (parseInt(String(rawDuration), 10) || 45);

  return {
    title: String(rawTitle).trim() || 'Lesson Plan',
    topic: String(rawTitle).trim() || 'Lesson Plan',
    sourceBookId: sourceBookId ? String(sourceBookId) : undefined,
    bookId: sourceBookId ? String(sourceBookId) : undefined,
    targetGradeLevel: String(targetGradeLevel),
    gradeLevel: String(targetGradeLevel),
    durationMinutes,
    districtId: val.districtId ? String(val.districtId) : undefined,
  };
}, z.object({
  title: z.string().min(1, 'Title is required'),
  topic: z.string().optional(),
  sourceBookId: z.string().optional(),
  bookId: z.string().optional(),
  targetGradeLevel: z.string().default('Grade 5'),
  gradeLevel: z.string().optional(),
  durationMinutes: z.number().default(45),
  districtId: z.string().optional(),
}));

/**
 * POST /api/lessons/generate
 */
export async function generateLessonController(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = GenerateLessonSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendResponse(res, 400, false, undefined, parseResult.error.issues[0].message);
      return;
    }

    const { title, sourceBookId, targetGradeLevel, durationMinutes, districtId } = parseResult.data;
    const pool = getDbPool();
    const userId = (req as any).user?.id || null;
    const effectiveDistrictId = districtId || (req as any).user?.districtId || null;

    let bookTitle = title;
    let bookSummary = '';

    if (sourceBookId) {
      const bookRes = await pool.query(`SELECT title, summary FROM books WHERE id = $1;`, [sourceBookId]);
      if (bookRes.rows.length > 0) {
        bookTitle = bookRes.rows[0].title || title;
        bookSummary = bookRes.rows[0].summary || '';
      }
    }

    const lessonPlanId = crypto.randomUUID();
    const jobId = crypto.randomUUID();

    // Insert record in 'generating' status
    const lessonRes = await pool.query(
      `
      INSERT INTO lesson_plans (
        id, source_book_id, district_id, title, target_grade_level, duration_minutes, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, 'generating', $7)
      RETURNING *;
    `,
      [lessonPlanId, sourceBookId || null, effectiveDistrictId, title, targetGradeLevel, durationMinutes, userId]
    );

    const lesson = lessonRes.rows[0];

    // Enqueue background job
    await pool.query(
      `
      INSERT INTO background_jobs (
        id, job_type, payload, status
      ) VALUES ($1, 'lesson_generation', $2::jsonb, 'queued');
    `,
      [
        jobId,
        JSON.stringify({
          lessonPlanId: lesson.id,
          bookId: sourceBookId,
          bookTitle,
          bookSummary,
          targetGradeLevel,
          durationMinutes,
        }),
      ]
    );

    sendResponse(res, 202, true, {
      id: lesson.id,
      sourceBookId: lesson.source_book_id,
      title: lesson.title,
      targetGradeLevel: lesson.target_grade_level,
      durationMinutes: lesson.duration_minutes,
      status: lesson.status,
      createdAt: lesson.created_at,
      message: 'Lesson plan generation queued.',
    });
  } catch (err: any) {
    console.error('[Generate Lesson Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Internal server error generating lesson.');
  }
}

/**
 * GET /api/lessons/:id
 */
export async function getLessonByIdController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const pool = getDbPool();

    const result = await pool.query(`SELECT * FROM lesson_plans WHERE id = $1;`, [id]);
    if (result.rows.length === 0) {
      sendResponse(res, 404, false, undefined, 'Lesson plan not found.');
      return;
    }

    const row = result.rows[0];
    sendResponse(res, 200, true, {
      id: row.id,
      sourceBookId: row.source_book_id,
      districtId: row.district_id,
      title: row.title,
      targetGradeLevel: row.target_grade_level,
      durationMinutes: row.duration_minutes,
      learningObjectives: row.learning_objectives || [],
      timedSteps: row.timed_steps || [],
      discussionPrompts: row.discussion_prompts || [],
      quizQuestions: row.quiz_questions || [],
      differentiation: row.differentiation || {},
      status: row.status,
      createdBy: row.created_by,
      approvedAt: row.approved_at,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err: any) {
    console.error('[Get Lesson Controller] Error:', err);
    sendResponse(res, 500, false, undefined, 'Internal server error fetching lesson plan.');
  }
}

/**
 * GET /api/lessons
 */
export async function listLessonsController(req: Request, res: Response): Promise<void> {
  try {
    const pool = getDbPool();
    const result = await pool.query(`SELECT * FROM lesson_plans ORDER BY created_at DESC LIMIT 50;`);

    const lessons = result.rows.map((row) => ({
      id: row.id,
      sourceBookId: row.source_book_id,
      districtId: row.district_id,
      title: row.title,
      targetGradeLevel: row.target_grade_level,
      durationMinutes: row.duration_minutes,
      learningObjectives: row.learning_objectives || [],
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    sendResponse(res, 200, true, lessons);
  } catch (err: any) {
    console.error('[List Lessons Controller] Error:', err);
    sendResponse(res, 500, false, undefined, 'Internal server error listing lesson plans.');
  }
}
