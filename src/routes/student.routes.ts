import { Router } from 'express';
import {
  startQuizController,
  submitQuizController,
  getStudentMetricsController,
} from '../controllers/student.controller';
import { studentSafeProjection } from '../middleware/studentProjection.middleware';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const studentRouter = Router();

// Apply auth & role enforcement for all student portal endpoints
studentRouter.use(requireAuth, requireRole('student'));

// Attaches studentSafeProjection middleware to strip correctAnswerIndex and explanation before sending quiz content
studentRouter.post('/quiz-start', studentSafeProjection, startQuizController);
studentRouter.post('/quiz-submit', submitQuizController);
studentRouter.get('/metrics', getStudentMetricsController);

export default studentRouter;
