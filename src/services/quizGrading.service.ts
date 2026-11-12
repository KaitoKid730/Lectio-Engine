/**
 * Quiz Grading and XP Rewards Engine (15-PIPE-QuizGrading)
 */

export interface SubmittedAnswer {
  questionIndex: number;
  selectedOptionIndex: number;
}

export interface QuizQuestionData {
  questionIndex?: number;
  correctAnswerIndex: number;
  explanation?: string;
}

export interface QuizGradingResult {
  correctCount: number;
  totalQuestions: number;
  scorePercentage: number;
  xpEarned: number;
  gradedAnswers: Array<{
    questionIndex: number;
    selectedOptionIndex: number;
    correctAnswerIndex: number;
    isCorrect: boolean;
    explanation: string;
  }>;
}

/**
 * Calculates XP earned for a quiz attempt based on performance and attempt history.
 * Rule:
 * - First Attempt: 10 Base XP + (2 XP * correctCount) + (5 Bonus XP for 100% score)
 * - Subsequent Attempts: 0 XP
 */
export function calculateQuizXP(
  correctCount: number,
  totalQuestions: number,
  isFirstAttempt: boolean
): number {
  if (!isFirstAttempt) {
    return 0;
  }
  if (totalQuestions <= 0) {
    return 0;
  }

  const baseXP = 10;
  const perCorrectXP = correctCount * 2;
  const perfectBonus = correctCount === totalQuestions ? 5 : 0;

  return baseXP + perCorrectXP + perfectBonus;
}

/**
 * Grades student quiz submission and calculates performance metrics and XP.
 */
export function gradeQuizSubmission(
  questions: QuizQuestionData[],
  answers: SubmittedAnswer[],
  isFirstAttempt: boolean
): QuizGradingResult {
  const totalQuestions = questions.length;
  if (totalQuestions === 0) {
    return {
      correctCount: 0,
      totalQuestions: 0,
      scorePercentage: 0,
      xpEarned: 0,
      gradedAnswers: [],
    };
  }

  let correctCount = 0;
  const gradedAnswers = answers.map((ans) => {
    const q = questions[ans.questionIndex] || questions[0];
    const correctAnswerIndex = q ? q.correctAnswerIndex : 0;
    const isCorrect = ans.selectedOptionIndex === correctAnswerIndex;
    if (isCorrect) correctCount++;

    return {
      questionIndex: ans.questionIndex,
      selectedOptionIndex: ans.selectedOptionIndex,
      correctAnswerIndex,
      isCorrect,
      explanation: q ? q.explanation || '' : '',
    };
  });

  const scorePercentage = Math.round((correctCount / totalQuestions) * 100 * 100) / 100;
  const xpEarned = calculateQuizXP(correctCount, totalQuestions, isFirstAttempt);

  return {
    correctCount,
    totalQuestions,
    scorePercentage,
    xpEarned,
    gradedAnswers,
  };
}
