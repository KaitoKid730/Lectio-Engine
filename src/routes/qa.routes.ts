import { Router } from 'express';
import { createQAAuditController, getQAAuditByIdController, listQAAssessmentsController } from '../controllers/qa.controller';

const qaRouter = Router();

qaRouter.post('/audit', createQAAuditController);
qaRouter.get('/audit/:id', getQAAuditByIdController);
qaRouter.get('/audits', listQAAssessmentsController);
qaRouter.get('/', listQAAssessmentsController);

export default qaRouter;
