import { Request, Response, NextFunction } from 'express';

/**
 * Recursively strips student-sensitive fields ('correctAnswerIndex', 'explanation')
 * from any quizQuestions array or quiz objects embedded in data payloads.
 */
export function sanitizeQuizQuestionsForStudent(data: any): any {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeQuizQuestionsForStudent(item));
  }
  if (typeof data === 'object') {
    const copy: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      if ((key === 'quizQuestions' || key === 'questions') && Array.isArray(data[key])) {
        copy[key] = data[key].map((q: any) => {
          if (q && typeof q === 'object') {
            const { correctAnswerIndex, explanation, ...sanitized } = q;
            return sanitized;
          }
          return q;
        });
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        copy[key] = sanitizeQuizQuestionsForStudent(data[key]);
      } else {
        copy[key] = data[key];
      }
    }
    return copy;
  }
  return data;
}

/**
 * Express middleware intercepting res.json response streams for student accounts
 * to prevent answer leakage.
 */
export const studentSafeProjection = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    if ((!req.user || req.user.role === 'student' || req.user.role !== 'teacher') && body && typeof body === 'object') {
      if (body.data) {
        body.data = sanitizeQuizQuestionsForStudent(body.data);
      } else {
        body = sanitizeQuizQuestionsForStudent(body);
      }
    }
    return originalJson(body);
  };

  next();
};
