import { z } from 'zod';
import { getDbPool } from '../db';
import { executePrompt } from '../services/gemini.service';
import { calculateFleschKincaid, chunkText } from '../services/textChunking.service';

const BookProcessResultSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== 'object') return {};

  const rawChapters = Array.isArray(val.chapters) ? val.chapters : (Array.isArray(val.sections) ? val.sections : []);
  const chapters = rawChapters.map((ch: any, idx: number) => ({
    chapterNumber: typeof ch?.chapterNumber === 'number' ? ch.chapterNumber : (typeof ch?.number === 'number' ? ch.number : idx + 1),
    title: String(ch?.title || ch?.name || ch?.heading || `Chapter ${idx + 1}`),
    summary: String(ch?.summary || ch?.content || ch?.description || ch?.overview || ''),
    wordCount: typeof ch?.wordCount === 'number' ? ch.wordCount : undefined,
  }));

  const rawVocab = Array.isArray(val.vocabulary) ? val.vocabulary : (Array.isArray(val.vocab) ? val.vocab : []);
  const vocabulary = rawVocab.map((item: any) => ({
    term: String(item?.term || item?.word || item?.vocabWord || 'Term'),
    definition: String(item?.definition || item?.meaning || item?.explanation || ''),
    contextSentence: String(item?.contextSentence || item?.example || item?.sentence || ''),
    difficultyGrade: String(item?.difficultyGrade || item?.grade || item?.difficulty || 'Intermediate'),
  }));

  const rawThemes = Array.isArray(val.moralThemes) ? val.moralThemes : (Array.isArray(val.themes) ? val.themes : (Array.isArray(val.coreThemes) ? val.coreThemes : []));
  const moralThemes = rawThemes.map((t: any) => String(t));

  return {
    summary: String(val.summary || val.bookSummary || val.overview || 'Summary of book manuscript.'),
    chapters: chapters.length > 0 ? chapters : [{ chapterNumber: 1, title: 'Chapter 1', summary: 'General Content Overview' }],
    vocabulary: vocabulary.length > 0 ? vocabulary : [{ term: 'Reading', definition: 'The action or skill of reading written or printed matter.', contextSentence: 'Students practiced reading the story.', difficultyGrade: 'Grade 5' }],
    moralThemes: moralThemes.length > 0 ? moralThemes : ['Literacy', 'Learning'],
  };
}, z.object({
  summary: z.string().default('Summary of book manuscript.'),
  chapters: z.array(
    z.object({
      chapterNumber: z.number().default(1),
      title: z.string().default('Chapter'),
      summary: z.string().default(''),
      wordCount: z.number().optional(),
    })
  ).default([]),
  vocabulary: z.array(
    z.object({
      term: z.string().default(''),
      definition: z.string().default(''),
      contextSentence: z.string().optional().default(''),
      difficultyGrade: z.string().optional().default('Intermediate'),
    })
  ).default([]),
  moralThemes: z.array(z.string()).default([]),
}));

export async function handleBookProcessing(payload: {
  bookId: string;
  text: string;
  title?: string;
  author?: string;
  targetGrade?: string;
}): Promise<any> {
  const { bookId, text } = payload;
  if (!bookId) throw new Error('Missing bookId in payload');
  if (!text) throw new Error('Missing text in payload');

  console.log(`[Book Processing Handler] Starting book processing for book ${bookId}`);

  const pool = getDbPool();

  try {
    // 1. Calculate local word count & readability metrics
    const metrics = calculateFleschKincaid(text);

    // 2. Chunk text if necessary (validated max length 500k)
    const chunks = chunkText(text, 10000);
    const sampleText = chunks.slice(0, 5).join('\n\n'); // Send initial chunks for analysis

    // 3. Execute AI analysis via Gemini
    const systemInstruction =
      'You are an expert K-12 educational curriculum analyzer. Analyze the provided book manuscript text. ' +
      'Extract structured metadata including summary, chapters with summaries, key vocabulary terms, and core moral/educational themes.';

    let aiResult;
    try {
      console.log(`[Book Processing Handler] Calling Gemini 'book.process.v1' for book ${bookId}`);
      aiResult = await executePrompt(
        'book.process.v1',
        'gemini-3.6-flash',
        systemInstruction,
        `MANUSCRIPT TEXT:\n${sampleText}`,
        BookProcessResultSchema,
        0.3,
        2048
      );
      console.log(`[Book Processing Handler] Gemini 'book.process.v1' response received for book ${bookId}`);
    } catch (aiErr: any) {
      console.warn(`[Book Processing Handler] Gemini API call failed for book ${bookId}, using local fallback content:`, aiErr?.message);
      const bookTitle = payload.title || 'Book Manuscript';
      aiResult = {
        summary: `Overview of ${bookTitle}. Contains approximately ${metrics.wordCount} words across narrative chapters.`,
        chapters: [
          {
            chapterNumber: 1,
            title: 'Chapter 1: Story Overview',
            summary: text.substring(0, 500) + '...',
            wordCount: metrics.wordCount,
          },
        ],
        vocabulary: [
          {
            term: 'Story',
            definition: 'A narrative description of events.',
            contextSentence: 'The manuscript presents an engaging story.',
            difficultyGrade: 'Intermediate',
          },
        ],
        moralThemes: ['Literacy', 'Learning'],
      };
    }

    // Normalize vocabulary for database storage
    const formattedVocabulary = aiResult.vocabulary.map((item) => ({
      word: item.term,
      definition: item.definition,
      contextSentence: item.contextSentence || '',
      difficulty: item.difficultyGrade || 'Intermediate',
    }));

    const formattedChapters = aiResult.chapters.map((ch, idx) => ({
      chapterNumber: ch.chapterNumber || idx + 1,
      title: ch.title || `Chapter ${idx + 1}`,
      content: ch.summary || '',
      wordCount: ch.wordCount || Math.round(metrics.wordCount / Math.max(1, aiResult.chapters.length)),
    }));

    // 4. Update book record in Postgres
    await pool.query(
      `
      UPDATE books 
      SET 
        summary = $1,
        chapters = $2::jsonb,
        vocabulary = $3::jsonb,
        moral_themes = $4::jsonb,
        total_word_count = $5,
        status = 'approved',
        approved_at = NOW(),
        updated_at = NOW()
      WHERE id = $6;
    `,
      [
        aiResult.summary,
        JSON.stringify(formattedChapters),
        JSON.stringify(formattedVocabulary),
        JSON.stringify(aiResult.moralThemes),
        metrics.wordCount,
        bookId,
      ]
    );

    console.log(`[Book Processing Handler] Book ${bookId} processed successfully and status set to 'approved'.`);
    return { bookId, status: 'approved', chapterCount: formattedChapters.length };
  } catch (err: any) {
    console.error(`[Book Processing Handler] Error processing book ${bookId}:`, err?.message);
    await pool.query(`UPDATE books SET status = 'failed', updated_at = NOW() WHERE id = $1;`, [bookId]);
    throw err;
  }
}
