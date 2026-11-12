import { Request, Response } from 'express';
import { z } from 'zod';
import { getDbPool } from '../db';
import { executePrompt } from '../services/gemini.service';
import { sendResponse } from '../utils/response';

/**
 * Intelligent context truncation helper (slices text at paragraph or line breaks up to maxChars)
 */
export function truncateContext(text: string, maxChars = 8000): string {
  if (!text || text.length <= maxChars) {
    return text || '';
  }
  const truncated = text.slice(0, maxChars);
  const lastParagraphBreak = truncated.lastIndexOf('\n\n');
  if (lastParagraphBreak > maxChars * 0.7) {
    return truncated.slice(0, lastParagraphBreak) + '\n\n[Context truncated for length]';
  }
  const lastLineBreak = truncated.lastIndexOf('\n');
  if (lastLineBreak > maxChars * 0.7) {
    return truncated.slice(0, lastLineBreak) + '\n[Context truncated for length]';
  }
  return truncated + '\n[Context truncated for length]';
}

const CreateConversationSchema = z.object({
  contextBookId: z.string().optional(),
  contextLessonId: z.string().optional(),
  title: z.string().optional(),
});

const SendChatSchema = z.object({
  conversationId: z.string().min(1, 'conversationId is required'),
  message: z.string().min(1, 'message is required'),
});

const WorksheetRequestSchema = z.object({
  topic: z.string().optional(),
  targetGrade: z.string().optional(),
  questionCount: z.number().optional().default(5),
});

/**
 * POST /api/teacher/conversations
 * Creates a new teacher copilot chat conversation linked to an optional book or lesson context.
 */
export async function createConversationController(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = CreateConversationSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendResponse(res, 400, false, undefined, parseResult.error.issues[0].message);
      return;
    }

    const { contextBookId, contextLessonId, title } = parseResult.data;
    const pool = getDbPool();
    const teacherId = (req as any).user?.id || 'teacher-guest-id';

    const conversationTitle = title || 'Instructional Assistance';

    const result = await pool.query(
      `INSERT INTO chat_conversations (
        id, teacher_id, context_book_id, context_lesson_id, title
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *;`,
      [crypto.randomUUID(), teacherId, contextBookId || null, contextLessonId || null, conversationTitle]
    );

    const conv = result.rows[0];
    sendResponse(res, 201, true, {
      id: conv.id,
      teacherId: conv.teacher_id,
      contextBookId: conv.context_book_id,
      contextLessonId: conv.context_lesson_id,
      title: conv.title,
      createdAt: conv.created_at,
    });
  } catch (err: any) {
    console.error('[Create Conversation Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Internal server error creating conversation.');
  }
}

/**
 * POST /api/teacher/chat
 * Handles multi-turn teacher copilot conversation messages with context truncation & persistent DB history.
 */
export async function sendChatMessageController(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = SendChatSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendResponse(res, 400, false, undefined, parseResult.error.issues[0].message);
      return;
    }

    const { conversationId, message } = parseResult.data;
    const pool = getDbPool();

    // 1. Fetch Conversation
    const convRes = await pool.query(`SELECT * FROM chat_conversations WHERE id = $1;`, [conversationId]);
    if (convRes.rows.length === 0) {
      sendResponse(res, 404, false, undefined, 'Chat conversation not found.');
      return;
    }
    const conversation = convRes.rows[0];

    // 2. Fetch Chat History
    const historyRes = await pool.query(
      `SELECT * FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC;`,
      [conversationId]
    );

    // 3. Fetch Linked Book / Lesson Context & Apply Truncation (8,000 maxChars limit)
    let rawContextText = '';

    if (conversation.context_book_id) {
      const bookRes = await pool.query(`SELECT * FROM books WHERE id = $1;`, [conversation.context_book_id]);
      if (bookRes.rows.length > 0) {
        const b = bookRes.rows[0];
        rawContextText += `BOOK CONTEXT:
Title: ${b.title}
Author: ${b.author}
Target Grade: ${b.target_grade}
Summary: ${b.summary || ''}
Chapters: ${JSON.stringify(b.chapters || [])}
Vocabulary: ${JSON.stringify(b.vocabulary || [])}
Moral Themes: ${JSON.stringify(b.moral_themes || [])}\n\n`;
      }
    }

    if (conversation.context_lesson_id) {
      const lessonRes = await pool.query(`SELECT * FROM lesson_plans WHERE id = $1;`, [conversation.context_lesson_id]);
      if (lessonRes.rows.length > 0) {
        const l = lessonRes.rows[0];
        rawContextText += `LESSON PLAN CONTEXT:
Title: ${l.title}
Grade Level: ${l.target_grade_level}
Duration: ${l.duration_minutes} mins
Objectives: ${JSON.stringify(l.learning_objectives || [])}
Timed Steps: ${JSON.stringify(l.timed_steps || [])}
Discussion Prompts: ${JSON.stringify(l.discussion_prompts || [])}
Quiz Questions: ${JSON.stringify(l.quiz_questions || [])}\n\n`;
      }
    }

    const truncatedContext = truncateContext(rawContextText, 8000);

    // 4. Construct System Instruction & Transcript
    const systemInstruction = `You are an expert K-12 Teacher Copilot and Pedagogical AI Assistant.
Your goal is to assist educators with lesson planning, student differentiation, comprehension strategies, and classroom management.
${truncatedContext ? `\n--- LINKED INSTRUCTIONAL CONTEXT ---\n${truncatedContext}\n-----------------------------------\n` : ''}
Provide direct, actionable, age-appropriate pedagogical advice and instructional material.`;

    // Format chat history transcript for Gemini prompt
    let chatTranscript = '';
    for (const msg of historyRes.rows) {
      const roleLabel = msg.sender_role === 'user' ? 'Teacher' : 'Copilot';
      chatTranscript += `${roleLabel}: ${msg.content}\n\n`;
    }
    chatTranscript += `Teacher: ${message}\n\nCopilot:`;

    // 5. Call Gemini API
    const aiResponseText = await executePrompt(
      'teacher.chat.v1',
      'gemini-3.6-flash',
      systemInstruction,
      chatTranscript,
      undefined,
      0.7
    );

    // 6. Save User Message & AI Response to DB
    await pool.query(
      `INSERT INTO chat_messages (id, conversation_id, sender_role, content) VALUES ($1, $2, 'user', $3);`,
      [crypto.randomUUID(), conversationId, message]
    );

    const aiMsgInsert = await pool.query(
      `INSERT INTO chat_messages (id, conversation_id, sender_role, content) VALUES ($1, $2, 'assistant', $3) RETURNING *;`,
      [crypto.randomUUID(), conversationId, aiResponseText]
    );

    sendResponse(res, 200, true, {
      conversationId,
      userMessage: message,
      aiResponse: aiResponseText,
      messageId: aiMsgInsert.rows[0].id,
      createdAt: aiMsgInsert.rows[0].created_at,
    });
  } catch (err: any) {
    console.error('[Send Chat Message Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Internal server error processing chat message.');
  }
}

const WorksheetOutputSchema = z.object({
  title: z.string(),
  gradeLevel: z.string(),
  instructions: z.string(),
  sections: z.array(
    z.object({
      sectionTitle: z.string(),
      instructions: z.string().optional(),
      questions: z.array(
        z.object({
          questionNumber: z.number(),
          questionText: z.string(),
          questionType: z.enum(['multiple_choice', 'short_answer', 'fill_blank', 'essay']),
          options: z.array(z.string()).optional(),
          answerKey: z.string(),
        })
      ),
    })
  ),
});

/**
 * POST /api/teacher/conversations/:id/worksheet
 * Generates a printable student worksheet based on conversation history and linked context.
 */
export async function generateWorksheetController(req: Request, res: Response): Promise<void> {
  try {
    const conversationId = req.params.id;
    const parseResult = WorksheetRequestSchema.safeParse(req.body);
    const { topic, targetGrade, questionCount } = parseResult.success ? parseResult.data : { questionCount: 5 };

    const pool = getDbPool();

    const convRes = await pool.query(`SELECT * FROM chat_conversations WHERE id = $1;`, [conversationId]);
    if (convRes.rows.length === 0) {
      sendResponse(res, 404, false, undefined, 'Conversation not found.');
      return;
    }
    const conversation = convRes.rows[0];

    let contextText = '';
    if (conversation.context_book_id) {
      const bRes = await pool.query(`SELECT * FROM books WHERE id = $1;`, [conversation.context_book_id]);
      if (bRes.rows.length > 0) {
        contextText += `Book: ${bRes.rows[0].title} (${bRes.rows[0].author}). Summary: ${bRes.rows[0].summary}\n`;
      }
    }
    if (conversation.context_lesson_id) {
      const lRes = await pool.query(`SELECT * FROM lesson_plans WHERE id = $1;`, [conversation.context_lesson_id]);
      if (lRes.rows.length > 0) {
        contextText += `Lesson: ${lRes.rows[0].title}. Objectives: ${JSON.stringify(lRes.rows[0].learning_objectives)}\n`;
      }
    }

    const truncatedContext = truncateContext(contextText, 4000);

    const systemInstruction = `You are an expert curriculum designer. Generate a structured, highly engaging student worksheet.`;
    const prompt = `Generate a printable worksheet with ${questionCount} questions.
Topic/Focus: ${topic || 'Reading Comprehension & Vocabulary'}
Target Grade: ${targetGrade || 'Elementary / Middle School'}
Context: ${truncatedContext || 'General Reading & Critical Thinking'}`;

    const worksheet = await executePrompt(
      'teacher.worksheet.v1',
      'gemini-3.6-flash',
      systemInstruction,
      prompt,
      WorksheetOutputSchema,
      0.5
    );

    // Record worksheet generation message in conversation
    await pool.query(
      `INSERT INTO chat_messages (id, conversation_id, sender_role, content) VALUES ($1, $2, 'assistant', $3);`,
      [crypto.randomUUID(), conversationId, `[Generated Worksheet: ${worksheet.title}]\n\n${JSON.stringify(worksheet, null, 2)}`]
    );

    sendResponse(res, 200, true, worksheet);
  } catch (err: any) {
    console.error('[Generate Worksheet Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Internal server error generating worksheet.');
  }
}

/**
 * GET /api/teacher/conversations
 * Lists all conversations for current teacher.
 */
export async function listConversationsController(req: Request, res: Response): Promise<void> {
  try {
    const pool = getDbPool();
    const teacherId = (req as any).user?.id || 'teacher-guest-id';

    const result = await pool.query(
      `SELECT * FROM chat_conversations WHERE teacher_id = $1 ORDER BY created_at DESC;`,
      [teacherId]
    );

    sendResponse(res, 200, true, result.rows);
  } catch (err: any) {
    console.error('[List Conversations Controller] Error:', err);
    sendResponse(res, 500, false, undefined, 'Internal server error listing conversations.');
  }
}

/**
 * GET /api/teacher/conversations/:id
 * Fetches conversation details and message history.
 */
export async function getConversationByIdController(req: Request, res: Response): Promise<void> {
  try {
    const conversationId = req.params.id;
    const pool = getDbPool();

    const convRes = await pool.query(`SELECT * FROM chat_conversations WHERE id = $1;`, [conversationId]);
    if (convRes.rows.length === 0) {
      sendResponse(res, 404, false, undefined, 'Conversation not found.');
      return;
    }

    const messagesRes = await pool.query(
      `SELECT * FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC;`,
      [conversationId]
    );

    sendResponse(res, 200, true, {
      conversation: convRes.rows[0],
      messages: messagesRes.rows,
    });
  } catch (err: any) {
    console.error('[Get Conversation Controller] Error:', err);
    sendResponse(res, 500, false, undefined, 'Internal server error fetching conversation.');
  }
}
