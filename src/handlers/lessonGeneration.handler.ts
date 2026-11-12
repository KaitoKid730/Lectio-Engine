import { z } from 'zod';
import { getDbPool } from '../db';
import { executePrompt } from '../services/gemini.service';

const LessonPlanResultSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== 'object') return {};
  const rawObj = Array.isArray(val.learningObjectives) ? val.learningObjectives : (Array.isArray(val.objectives) ? val.objectives : []);
  const rawSteps = Array.isArray(val.timedSteps) ? val.timedSteps : (Array.isArray(val.steps) ? val.steps : []);
  const rawPrompts = Array.isArray(val.discussionPrompts) ? val.discussionPrompts : (Array.isArray(val.prompts) ? val.prompts : []);

  const timedSteps = rawSteps.map((st: any, idx: number) => ({
    stepNumber: typeof st?.stepNumber === 'number' ? st.stepNumber : idx + 1,
    title: String(st?.title || st?.name || `Step ${idx + 1}`),
    durationMinutes: typeof st?.durationMinutes === 'number' ? st.durationMinutes : (typeof st?.duration === 'number' ? st.duration : 10),
    instructions: String(st?.instructions || st?.description || ''),
    teacherNotes: st?.teacherNotes ? String(st.teacherNotes) : undefined,
  }));

  return {
    title: String(val.title || val.lessonTitle || 'Lesson Plan'),
    learningObjectives: rawObj.map((o: any) => String(o)),
    timedSteps,
    discussionPrompts: rawPrompts.map((p: any) => String(p)),
    differentiation: val.differentiation && typeof val.differentiation === 'object' ? {
      ellScaffolds: Array.isArray(val.differentiation.ellScaffolds) ? val.differentiation.ellScaffolds.map(String) : [],
      iepAccommodations: Array.isArray(val.differentiation.iepAccommodations) ? val.differentiation.iepAccommodations.map(String) : [],
      giftedExtensions: Array.isArray(val.differentiation.giftedExtensions) ? val.differentiation.giftedExtensions.map(String) : [],
    } : undefined,
  };
}, z.object({
  title: z.string().default('Lesson Plan'),
  learningObjectives: z.array(z.string()).default([]),
  timedSteps: z.array(
    z.object({
      stepNumber: z.number().default(1),
      title: z.string().default('Step'),
      durationMinutes: z.number().default(10),
      instructions: z.string().default(''),
      teacherNotes: z.string().optional(),
    })
  ).default([]),
  discussionPrompts: z.array(z.string()).default([]),
  differentiation: z
    .object({
      ellScaffolds: z.array(z.string()).optional(),
      iepAccommodations: z.array(z.string()).optional(),
      giftedExtensions: z.array(z.string()).optional(),
    })
    .optional(),
}));

const QuizQuestionsSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== 'object') return { quizQuestions: [] };
  const rawQ = Array.isArray(val.quizQuestions) ? val.quizQuestions : (Array.isArray(val.questions) ? val.questions : []);
  const quizQuestions = rawQ.map((q: any) => {
    let options = Array.isArray(q?.options) ? q.options.map((o: any) => String(o)) : [];
    while (options.length < 4) {
      options.push(`Option ${options.length + 1}`);
    }
    if (options.length > 4) {
      options = options.slice(0, 4);
    }
    const idx = typeof q?.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0;
    const clampedIdx = Math.max(0, Math.min(3, idx));
    return {
      question: String(q?.question || q?.prompt || 'Comprehension question'),
      options,
      correctAnswerIndex: clampedIdx,
      explanation: String(q?.explanation || 'Answer explanation.'),
    };
  });
  return { quizQuestions };
}, z.object({
  quizQuestions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).length(4),
      correctAnswerIndex: z.number().min(0).max(3),
      explanation: z.string(),
    })
  ),
}));

export async function handleLessonGeneration(payload: {
  lessonPlanId: string;
  bookId?: string;
  bookSummary?: string;
  bookTitle?: string;
  targetGradeLevel: string;
  durationMinutes?: number;
}): Promise<any> {
  const { lessonPlanId, bookTitle, bookSummary, targetGradeLevel, durationMinutes = 45 } = payload;
  if (!lessonPlanId) throw new Error('Missing lessonPlanId in payload');

  const pool = getDbPool();

  try {
    // 1. Generate Lesson Plan Structure
    const planSysInst =
      'You are an expert K-12 instructional designer. Create a comprehensive, standards-aligned lesson plan. ' +
      'Include clear learning objectives, timed instructional steps, engaging discussion prompts, and differentiated support.';

    const planPrompt =
      `BOOK TITLE: ${bookTitle || 'Selected Literature'}\n` +
      `BOOK SUMMARY: ${bookSummary || 'General Reading Comprehension'}\n` +
      `TARGET GRADE: ${targetGradeLevel || 'Grade 5'}\n` +
      `LESSON DURATION: ${durationMinutes} minutes`;

    const planData = await executePrompt(
      'lesson.generate.v1',
      'gemini-3.6-flash',
      planSysInst,
      planPrompt,
      LessonPlanResultSchema,
      0.4,
      2048
    );

    // 2. Generate 5-question Multiple Choice Quiz
    const quizSysInst =
      'You are an assessment specialist. Generate 5 high-quality multiple choice comprehension questions based on the lesson content. ' +
      'Each question MUST have exactly 4 option choices and a 0-indexed correctAnswerIndex (0, 1, 2, or 3) and an explanation.';

    const quizData = await executePrompt(
      'lesson.quiz-generate.v1',
      'gemini-3.6-flash',
      quizSysInst,
      `LESSON TITLE: ${planData.title}\nOBJECTIVES: ${planData.learningObjectives.join('; ')}`,
      QuizQuestionsSchema,
      0.3,
      1500
    );

    // Format activities / timed steps for DB & frontend compatibility
    const formattedSteps = planData.timedSteps.map((step, idx) => ({
      step: step.stepNumber || idx + 1,
      title: step.title,
      durationMinutes: step.durationMinutes,
      instructions: step.instructions,
    }));

    const formattedQuiz = quizData.quizQuestions.map((q, idx) => ({
      id: `q_${idx + 1}`,
      question: q.question,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      explanation: q.explanation,
    }));

    // 3. Update Database Record
    await pool.query(
      `
      UPDATE lesson_plans 
      SET 
        title = $1,
        learning_objectives = $2::jsonb,
        timed_steps = $3::jsonb,
        discussion_prompts = $4::jsonb,
        quiz_questions = $5::jsonb,
        differentiation = $6::jsonb,
        status = 'approved',
        updated_at = NOW()
      WHERE id = $7;
    `,
      [
        planData.title,
        JSON.stringify(planData.learningObjectives),
        JSON.stringify(formattedSteps),
        JSON.stringify(planData.discussionPrompts),
        JSON.stringify(formattedQuiz),
        JSON.stringify(planData.differentiation || {}),
        lessonPlanId,
      ]
    );

    console.log(`[Lesson Generation Handler] Lesson ${lessonPlanId} generated successfully.`);
    return { lessonPlanId, status: 'approved', questionsCount: formattedQuiz.length };
  } catch (err: any) {
    console.error(`[Lesson Generation Handler] Error generating lesson ${lessonPlanId}:`, err?.message);
    await pool.query(`UPDATE lesson_plans SET status = 'failed', updated_at = NOW() WHERE id = $1;`, [lessonPlanId]);
    throw err;
  }
}
