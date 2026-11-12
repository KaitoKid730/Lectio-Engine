import { Router } from 'express';
import {
  createConversationController,
  sendChatMessageController,
  generateWorksheetController,
  listConversationsController,
  getConversationByIdController,
} from '../controllers/teacher.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const teacherRouter = Router();

teacherRouter.use(requireAuth, requireRole('teacher', 'admin', 'district_admin'));

teacherRouter.post('/conversations', createConversationController);
teacherRouter.get('/conversations', listConversationsController);
teacherRouter.get('/conversations/:id', getConversationByIdController);
teacherRouter.post('/chat', sendChatMessageController);
teacherRouter.post('/copilot-chat', sendChatMessageController);
teacherRouter.post('/conversations/:id/worksheet', generateWorksheetController);

export default teacherRouter;
