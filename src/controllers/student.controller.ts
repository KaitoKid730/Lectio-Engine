import { Request, Response } from 'express';
import { z } from 'zod';
import { getDbPool } from '../db';
import { sendResponse } from '../utils/response';
import { gradeQuizSubmission, calculateQuizXP } from '../services/quizGrading.service';

const QuizSubmitSchema = z.object({
  lessonId: z.string().min(1, 'lessonId is required'),
  answers: z.array(
    z.object({
      questionIndex: z.number(),
      selectedOptionIndex: z.number(),
    })
  ),
  idempotencyKey: z.string().min(1, 'idempotencyKey is required'),
});

const QuizStartSchema = z.object({
  lessonId: z.string().min(1, 'lessonId is required'),
});

/**
 * POST /api/student/quiz-start
 * Creates a quiz attempt record (status = 'started') and returns quiz questions.
 * Note: studentSafeProjection middleware strips correctAnswerIndex and explanation before sending.
 */
export async function startQuizController(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = QuizStartSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendResponse(res, 400, false, undefined, parseResult.error.issues[0].message);
      return;
    }

    const { lessonId } = parseResult.data;
    const pool = getDbPool();
    const studentId = (req as any).user?.id || 'student-guest-id';

    const lessonRes = await pool.query(`SELECT id, title, quiz_questions FROM lesson_plans WHERE id = $1;`, [lessonId]);
    if (lessonRes.rows.length === 0) {
      sendResponse(res, 404, false, undefined, 'Lesson plan not found.');
      return;
    }

    const lesson = lessonRes.rows[0];
    const quizQuestions = lesson.quiz_questions || [];

    // Count prior attempts to determine attempt number
    const priorAttempts = await pool.query(
      `SELECT COUNT(*)::int as count FROM quiz_attempts WHERE student_id = $1 AND lesson_id = $2;`,
      [studentId, lessonId]
    );
    const attemptNumber = (priorAttempts.rows[0]?.count || 0) + 1;

    // Create new quiz attempt record
    const attemptRes = await pool.query(
      `INSERT INTO quiz_attempts (
        id, student_id, lesson_id, attempt_number, is_first_attempt, status
      ) VALUES ($1, $2, $3, $4, $5, 'started')
      RETURNING id;`,
      [crypto.randomUUID(), studentId, lessonId, attemptNumber, attemptNumber === 1]
    );

    sendResponse(res, 200, true, {
      attemptId: attemptRes.rows[0].id,
      lessonId: lesson.id,
      title: lesson.title,
      quizQuestions,
    });
  } catch (err: any) {
    console.error('[Start Quiz Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Internal server error starting quiz.');
  }
}

/**
 * POST /api/student/quiz-submit
 * Evaluates student quiz answers server-side, applies first-attempt XP rules,
 * enforces idempotency, and updates streak metrics.
 */
export async function submitQuizController(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = QuizSubmitSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendResponse(res, 400, false, undefined, parseResult.error.issues[0].message);
      return;
    }

    const { lessonId, answers, idempotencyKey } = parseResult.data;
    const pool = getDbPool();
    const studentId = (req as any).user?.id || 'student-guest-id';
    const districtId = (req as any).user?.districtId || null;
    const studentName = (req as any).user?.displayName || 'Student User';

    // 1. Idempotency Check: Prevent duplicate grading or XP farming
    const existingAttempt = await pool.query(
      `SELECT * FROM quiz_attempts WHERE idempotency_key = $1;`,
      [idempotencyKey]
    );

    if (existingAttempt.rows.length > 0 && existingAttempt.rows[0].status === 'completed') {
      const existingResult = await pool.query(
        `SELECT * FROM student_quiz_results WHERE attempt_id = $1;`,
        [existingAttempt.rows[0].id]
      );
      
      if (existingResult.rows.length > 0) {
        const row = existingResult.rows[0];
        sendResponse(res, 200, true, {
          id: row.id,
          lessonId: row.lesson_id,
          scorePercentage: Number(row.score_percentage),
          totalQuestions: row.total_questions,
          correctCount: row.correct_count,
          xpEarned: row.xp_earned,
          isFirstAttempt: existingAttempt.rows[0].is_first_attempt,
          duplicateRequest: true,
        }, 'Quiz already submitted (idempotent result).');
        return;
      }
    }

    // 2. Fetch Lesson Plan & Answer Key from Database
    const lessonRes = await pool.query(`SELECT * FROM lesson_plans WHERE id = $1;`, [lessonId]);
    if (lessonRes.rows.length === 0) {
      sendResponse(res, 404, false, undefined, 'Lesson plan not found.');
      return;
    }

    const lesson = lessonRes.rows[0];
    const quizQuestions: Array<{
      questionText?: string;
      question?: string;
      options: string[];
      correctAnswerIndex?: number;
      correctOptionIndex?: number;
      explanation?: string;
    }> = lesson.quiz_questions || [];

    if (quizQuestions.length === 0) {
      sendResponse(res, 400, false, undefined, 'This lesson plan has no quiz questions.');
      return;
    }

    // 4. Determine Attempt Number & First-Attempt Status
    const priorAttempts = await pool.query(
      `SELECT COUNT(*)::int as count FROM quiz_attempts WHERE student_id = $1 AND lesson_id = $2 AND status = 'completed';`,
      [studentId, lessonId]
    );

    const completedPriorCount = priorAttempts.rows[0]?.count || 0;
    const isFirstAttempt = completedPriorCount === 0;

    // 3 & 5. Server-Side Answer Grading & XP Calculation
    const normalizedQuestions = quizQuestions.map((q) => ({
      correctAnswerIndex: q.correctAnswerIndex ?? q.correctOptionIndex ?? 0,
      explanation: q.explanation || '',
    }));

    const { correctCount, totalQuestions, scorePercentage, xpEarned, gradedAnswers } = gradeQuizSubmission(
      normalizedQuestions,
      answers,
      isFirstAttempt
    );

    // 6. Database Transaction: Record Attempt, Results, XP Ledger, and Streak
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create/Update Quiz Attempt Record
      let attemptId: string;
      if (existingAttempt.rows.length > 0) {
        attemptId = existingAttempt.rows[0].id;
        await client.query(
          `UPDATE quiz_attempts SET 
            status = 'completed', 
            score_percentage = $1, 
            is_first_attempt = $2,
            submitted_at = NOW() 
           WHERE id = $3;`,
          [scorePercentage, isFirstAttempt, attemptId]
        );
      } else {
        const attemptInsert = await client.query(
          `INSERT INTO quiz_attempts (
            id, student_id, lesson_id, attempt_number, is_first_attempt, idempotency_key, status, score_percentage, submitted_at
          ) VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7, NOW())
          RETURNING id;`,
          [crypto.randomUUID(), studentId, lessonId, completedPriorCount + 1, isFirstAttempt, idempotencyKey, scorePercentage]
        );
        attemptId = attemptInsert.rows[0].id;
      }

      // Record Student Quiz Result
      const resultInsert = await client.query(
        `INSERT INTO student_quiz_results (
          id, student_id, attempt_id, district_id, student_display_name, lesson_id, lesson_title, score_percentage, total_questions, correct_count, xp_earned, submitted_answers
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
        RETURNING *;`,
        [
          crypto.randomUUID(),
          studentId,
          attemptId,
          districtId,
          studentName,
          lessonId,
          lesson.title,
          scorePercentage,
          totalQuestions,
          correctCount,
          xpEarned,
          JSON.stringify(gradedAnswers),
        ]
      );

      const quizResult = resultInsert.rows[0];

      // Record XP Ledger Transaction
      if (xpEarned > 0) {
        await client.query(
          `INSERT INTO xp_transactions (
            id, student_id, amount, reason, reference_id
          ) VALUES ($1, $2, $3, $4, $5);`,
          [crypto.randomUUID(), studentId, xpEarned, `Quiz Completed: ${lesson.title} (First Attempt)`, quizResult.id]
        );
      }

      // 7. UTC Midnight Streak Reset & Update Calculation
      const todayIso = new Date().toISOString().split('T')[0];
      const yesterdayIso = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      const streakRes = await client.query(`SELECT * FROM streak_records WHERE student_id = $1;`, [studentId]);

      if (streakRes.rows.length === 0) {
        await client.query(
          `INSERT INTO streak_records (student_id, current_streak_days, longest_streak_days, last_activity_date)
           VALUES ($1, 1, 1, $2);`,
          [studentId, todayIso]
        );
      } else {
        const currentStreakRecord = streakRes.rows[0];
        const lastDate = currentStreakRecord.last_activity_date
          ? new Date(currentStreakRecord.last_activity_date).toISOString().split('T')[0]
          : null;

        let newCurrentStreak = currentStreakRecord.current_streak_days;

        if (lastDate === todayIso) {
          // Already active today, streak unchanged
        } else if (lastDate === yesterdayIso) {
          // Active on consecutive day, increment streak
          newCurrentStreak += 1;
        } else {
          // Streak broken (> 1 day gap), reset streak to 1
          newCurrentStreak = 1;
        }

        const newLongestStreak = Math.max(currentStreakRecord.longest_streak_days, newCurrentStreak);

        await client.query(
          `UPDATE streak_records SET 
            current_streak_days = $1, 
            longest_streak_days = $2, 
            last_activity_date = $3, 
            updated_at = NOW() 
           WHERE student_id = $4;`,
          [newCurrentStreak, newLongestStreak, todayIso, studentId]
        );
      }

      await client.query('COMMIT');

      sendResponse(res, 200, true, {
        id: quizResult.id,
        attemptId,
        studentId,
        lessonId,
        lessonTitle: lesson.title,
        scorePercentage,
        totalQuestions,
        correctCount,
        xpEarned,
        isFirstAttempt,
        submittedAnswers: gradedAnswers,
        completedAt: quizResult.completed_at,
      });
    } catch (txErr: any) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[Submit Quiz Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Internal server error submitting quiz.');
  }
}

/**
 * GET /api/student/streak
 * Fetches current student streak and total XP
 */
export async function getStudentMetricsController(req: Request, res: Response): Promise<void> {
  try {
    const pool = getDbPool();
    const studentId = (req as any).user?.id || 'student-guest-id';

    const streakRes = await pool.query(`SELECT * FROM streak_records WHERE student_id = $1;`, [studentId]);
    const xpRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0)::int as total_xp FROM xp_transactions WHERE student_id = $1;`,
      [studentId]
    );

    const streak = streakRes.rows[0] || { current_streak_days: 0, longest_streak_days: 0, last_activity_date: null };

    sendResponse(res, 200, true, {
      studentId,
      totalXP: xpRes.rows[0].total_xp,
      currentStreakDays: streak.current_streak_days,
      longestStreakDays: streak.longest_streak_days,
      lastActivityDate: streak.last_activity_date,
    });
  } catch (err: any) {
    console.error('[Get Student Metrics Controller] Error:', err);
    sendResponse(res, 500, false, undefined, 'Internal server error fetching student metrics.');
  }
}
