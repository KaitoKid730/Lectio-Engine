import { describe, it, expect } from 'vitest';
import {
  calculateQuizXP,
  gradeQuizSubmission,
  QuizQuestionData,
} from '../../src/services/quizGrading.service';

describe('Quiz Grading & XP Rewards Engine', () => {
  describe('calculateQuizXP', () => {
    it('awards 10 Base XP + 2 per correct + 5 bonus for 100% on First Attempt', () => {
      // 5 questions, all 5 correct -> 10 + (5 * 2) + 5 = 25 XP
      const perfectXP = calculateQuizXP(5, 5, true);
      expect(perfectXP).toBe(25);

      // 5 questions, 3 correct -> 10 + (3 * 2) + 0 = 16 XP
      const partialXP = calculateQuizXP(3, 5, true);
      expect(partialXP).toBe(16);

      // 5 questions, 0 correct -> 10 + (0 * 2) + 0 = 10 XP
      const zeroCorrectXP = calculateQuizXP(0, 5, true);
      expect(zeroCorrectXP).toBe(10);
    });

    it('enforces First-Attempt Rule: 0 XP awarded on second or subsequent attempts', () => {
      const secondAttemptXP = calculateQuizXP(5, 5, false);
      expect(secondAttemptXP).toBe(0);

      const thirdAttemptXP = calculateQuizXP(3, 5, false);
      expect(thirdAttemptXP).toBe(0);
    });
  });

  describe('gradeQuizSubmission', () => {
    const questions: QuizQuestionData[] = [
      { questionIndex: 0, correctAnswerIndex: 1, explanation: 'Fact 1' },
      { questionIndex: 1, correctAnswerIndex: 0, explanation: 'Fact 2' },
      { questionIndex: 2, correctAnswerIndex: 2, explanation: 'Fact 3' },
      { questionIndex: 3, correctAnswerIndex: 3, explanation: 'Fact 4' },
    ];

    it('correctly grades submission and returns 100% score with perfect XP', () => {
      const answers = [
        { questionIndex: 0, selectedOptionIndex: 1 },
        { questionIndex: 1, selectedOptionIndex: 0 },
        { questionIndex: 2, selectedOptionIndex: 2 },
        { questionIndex: 3, selectedOptionIndex: 3 },
      ];

      const result = gradeQuizSubmission(questions, answers, true);

      expect(result.correctCount).toBe(4);
      expect(result.totalQuestions).toBe(4);
      expect(result.scorePercentage).toBe(100);
      expect(result.xpEarned).toBe(23); // 10 base + 8 correct + 5 bonus
      expect(result.gradedAnswers.length).toBe(4);
      expect(result.gradedAnswers[0].isCorrect).toBe(true);
    });

    it('correctly calculates partial score percentage and partial XP', () => {
      const answers = [
        { questionIndex: 0, selectedOptionIndex: 1 }, // Correct
        { questionIndex: 1, selectedOptionIndex: 2 }, // Wrong (correct is 0)
        { questionIndex: 2, selectedOptionIndex: 2 }, // Correct
        { questionIndex: 3, selectedOptionIndex: 0 }, // Wrong (correct is 3)
      ];

      const result = gradeQuizSubmission(questions, answers, true);

      expect(result.correctCount).toBe(2);
      expect(result.scorePercentage).toBe(50);
      expect(result.xpEarned).toBe(14); // 10 base + 4 correct + 0 bonus
    });

    it('awards 0 XP on non-first attempt even with 100% score', () => {
      const answers = [
        { questionIndex: 0, selectedOptionIndex: 1 },
        { questionIndex: 1, selectedOptionIndex: 0 },
        { questionIndex: 2, selectedOptionIndex: 2 },
        { questionIndex: 3, selectedOptionIndex: 3 },
      ];

      const result = gradeQuizSubmission(questions, answers, false);

      expect(result.scorePercentage).toBe(100);
      expect(result.xpEarned).toBe(0);
    });
  });
});
