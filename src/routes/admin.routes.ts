import { Router } from 'express';
import {
  createSchoolController,
  listSchoolsController,
  createClassroomController,
  listClassroomsController,
  enrollStudentController,
  updateConsentController,
  anonymizeStudentController,
  listUsersController,
  createUserAdminController,
} from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('admin', 'district_admin'));

adminRouter.get('/users', listUsersController);
adminRouter.post('/users', createUserAdminController);
adminRouter.post('/schools', createSchoolController);
adminRouter.get('/schools', listSchoolsController);
adminRouter.post('/classrooms', createClassroomController);
adminRouter.get('/classrooms', listClassroomsController);
adminRouter.post('/classrooms/:id/enroll', enrollStudentController);
adminRouter.post('/consent', updateConsentController);
adminRouter.post('/students/:id/anonymize', anonymizeStudentController);

export default adminRouter;
