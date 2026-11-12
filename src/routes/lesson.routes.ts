import { Router } from 'express';
import {
  generateLessonController,
  getLessonByIdController,
  listLessonsController,
} from '../controllers/lesson.controller';

const lessonRouter = Router();

lessonRouter.post('/generate', generateLessonController);
lessonRouter.get('/:id', getLessonByIdController);
lessonRouter.get('/', listLessonsController);

export default lessonRouter;
