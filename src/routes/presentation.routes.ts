import { Router } from 'express';
import {
  generatePresentationController,
  listPresentationsController,
  getPresentationController,
  updatePresentationController,
  updateSlideController,
  addSlideController,
  deleteSlideController,
  attachImageToSlideController,
  exportPresentationController,
  exportSelftestController,
  designReviewController,
  visualRefineController,
} from '../controllers/presentation.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const presentationRouter = Router();

// Presentation endpoints
presentationRouter.get('/export-selftest', exportSelftestController);
presentationRouter.post('/generate', requireAuth, requireRole('teacher', 'curriculum_lead', 'admin'), generatePresentationController);
presentationRouter.get('/', requireAuth, listPresentationsController);
presentationRouter.get('/:id', requireAuth, getPresentationController);
presentationRouter.patch('/:id', requireAuth, requireRole('teacher', 'curriculum_lead', 'admin'), updatePresentationController);
presentationRouter.post('/:id/slides', requireAuth, requireRole('teacher', 'curriculum_lead', 'admin'), addSlideController);
presentationRouter.post('/:id/export', requireAuth, exportPresentationController);
presentationRouter.post('/:id/design-review', requireAuth, requireRole('teacher', 'curriculum_lead', 'admin'), designReviewController);
presentationRouter.post('/:id/visual-refine', requireAuth, requireRole('teacher', 'curriculum_lead', 'admin'), visualRefineController);

export const slideRouter = Router();

// Slide endpoints
slideRouter.patch('/:id', requireAuth, requireRole('teacher', 'curriculum_lead', 'admin'), updateSlideController);
slideRouter.delete('/:id', requireAuth, requireRole('teacher', 'curriculum_lead', 'admin'), deleteSlideController);
slideRouter.post('/:id/attach-image', requireAuth, requireRole('teacher', 'curriculum_lead', 'admin'), attachImageToSlideController);

export default presentationRouter;
