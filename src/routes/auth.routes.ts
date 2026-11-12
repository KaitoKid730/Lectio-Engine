import { Router, Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { z } from 'zod';
import { getDb } from '../db';
import { users, sessions, classrooms, studentEnrollments, consentRecords, schoolDistricts } from '../db/schema';
import { env } from '../config/env';
import { validateRequest } from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { sendResponse } from '../utils/response';
import { User, UserRole } from '../types';

const router = Router();

// Zod Schemas for Auth Validation
const staffLoginSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(1, 'Password is required'),
});

const studentLoginSchema = z.object({
  accessCode: z.string().min(1, 'Classroom access code is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  pin: z.string().min(4, 'PIN must be at least 4 digits'),
});

// ----------------------------------------------------
// 03-CORE-Auth Routes
// ----------------------------------------------------

/**
 * Staff Login Handler (Bcrypt verification + Session creation + Lockout)
 */
router.post('/login', validateRequest({ body: staffLoginSchema }), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const db = getDb();

    const [userRecord] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);

    if (!userRecord) {
      sendResponse(res, 401, false, undefined, 'Invalid email or password');
      return;
    }

    // Account Lockout check
    if (userRecord.lockedUntil && new Date(userRecord.lockedUntil) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(userRecord.lockedUntil).getTime() - Date.now()) / 60000);
      sendResponse(
        res,
        403,
        false,
        undefined,
        `Account locked due to 5 consecutive failed login attempts. Please try again in ${remainingMinutes} minute(s).`
      );
      return;
    }

    // Verify Password with Bcrypt
    const isPasswordValid = await bcrypt.compare(password, userRecord.passwordHash || '');

    if (!isPasswordValid) {
      const failedAttempts = (userRecord.failedLoginAttempts || 0) + 1;
      let lockedUntilDate: Date | null = null;

      if (failedAttempts >= 5) {
        lockedUntilDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minute lock
      }

      await db
        .update(users)
        .set({
          failedLoginAttempts: failedAttempts,
          lockedUntil: lockedUntilDate,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userRecord.id));

      if (failedAttempts >= 5) {
        sendResponse(
          res,
          403,
          false,
          undefined,
          'Account has been locked for 15 minutes due to 5 consecutive failed login attempts.'
        );
        return;
      }

      sendResponse(res, 401, false, undefined, `Invalid email or password. Attempt ${failedAttempts} of 5.`);
      return;
    }

    // Reset Lockout Counters on successful authentication
    await db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userRecord.id));

    // Create Session in PostgreSQL
    const sessionId = `sess_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 3600 * 1000);

    await db.insert(sessions).values({
      id: sessionId,
      userId: userRecord.id,
      role: userRecord.role,
      ipAddress: req.ip || null,
      userAgent: (req.headers['user-agent'] as string) || null,
      expiresAt,
    });

    // Set Secure HttpOnly Cookie
    res.cookie('lectio_session_id', sessionId, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: env.SESSION_TTL_HOURS * 3600 * 1000,
    });

    const userPayload: User = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role as UserRole,
      title: userRecord.title,
      districtId: userRecord.districtId,
      schoolDistrict: userRecord.districtId || 'Springfield School District',
      status: userRecord.status as any,
      avatarUrl: userRecord.avatarUrl,
      mustChangePassword: userRecord.mustChangePassword,
      lastLoginAt: new Date().toISOString(),
    };

    sendResponse(res, 200, true, { user: userPayload, sessionId });
  } catch (error: any) {
    console.error('Error during staff login:', error);
    sendResponse(res, 500, false, undefined, error.message || 'Authentication error');
  }
});

/**
 * Student Login Handler (Classroom access code + Student ID + Hashed PIN verification)
 */
router.post('/student-login', validateRequest({ body: studentLoginSchema }), async (req: Request, res: Response) => {
  try {
    const { accessCode, studentId, pin } = req.body;
    const db = getDb();

    // 1. Verify Classroom Access Code
    const [classroom] = await db.select().from(classrooms).where(eq(classrooms.accessCode, accessCode)).limit(1);

    if (!classroom) {
      sendResponse(res, 404, false, undefined, 'Invalid classroom access code');
      return;
    }

    // 2. Fetch direct student enrollment by studentId in this classroom
    const [enrollmentRecord] = await db
      .select({ user: users })
      .from(studentEnrollments)
      .innerJoin(users, eq(studentEnrollments.studentId, users.id))
      .where(and(eq(studentEnrollments.classroomId, classroom.id), eq(users.id, studentId)))
      .limit(1);

    if (!enrollmentRecord || !enrollmentRecord.user) {
      sendResponse(res, 401, false, undefined, 'Student not enrolled in this classroom');
      return;
    }

    const targetStudent = enrollmentRecord.user;

    // 3. Account Lockout Check
    if (targetStudent.lockedUntil && new Date(targetStudent.lockedUntil) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(targetStudent.lockedUntil).getTime() - Date.now()) / 60000);
      sendResponse(
        res,
        403,
        false,
        undefined,
        `Student account locked due to repeated failed attempts. Please try again in ${remainingMinutes} minute(s).`
      );
      return;
    }

    // 4. Verify PIN with bcrypt
    const isPinValid = await bcrypt.compare(pin, targetStudent.pinHash || '');

    if (!isPinValid) {
      const failedAttempts = (targetStudent.failedLoginAttempts || 0) + 1;
      let lockedUntilDate: Date | null = null;

      if (failedAttempts >= 5) {
        lockedUntilDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minute lock
      }

      await db
        .update(users)
        .set({
          failedLoginAttempts: failedAttempts,
          lockedUntil: lockedUntilDate,
          updatedAt: new Date(),
        })
        .where(eq(users.id, targetStudent.id));

      if (failedAttempts >= 5) {
        sendResponse(
          res,
          403,
          false,
          undefined,
          'Account has been locked for 15 minutes due to 5 consecutive failed PIN attempts.'
        );
        return;
      }

      sendResponse(res, 401, false, undefined, `Invalid PIN. Attempt ${failedAttempts} of 5.`);
      return;
    }

    // Reset Lockout Counters on successful login
    await db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetStudent.id));

    // 5. COPPA Consent Gate Check
    const [consentRecord] = await db
      .select()
      .from(consentRecords)
      .where(eq(consentRecords.studentId, targetStudent.id))
      .limit(1);

    if (!consentRecord || consentRecord.consentStatus !== 'verified') {
      sendResponse(res, 403, false, undefined, 'Parental consent required.');
      return;
    }

    // Create Student Session in PostgreSQL
    const sessionId = `sess_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 3600 * 1000);

    await db.insert(sessions).values({
      id: sessionId,
      userId: targetStudent.id,
      role: 'student',
      ipAddress: req.ip || null,
      userAgent: (req.headers['user-agent'] as string) || null,
      expiresAt,
    });

    res.cookie('lectio_session_id', sessionId, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: env.SESSION_TTL_HOURS * 3600 * 1000,
    });

    const studentPayload: User = {
      id: targetStudent.id,
      name: targetStudent.name,
      pseudonymousLabel: targetStudent.pseudonymousLabel || targetStudent.name,
      role: 'student',
      title: targetStudent.title,
      districtId: targetStudent.districtId,
      avatarUrl: targetStudent.avatarUrl,
      status: targetStudent.status as any,
      lastLoginAt: new Date().toISOString(),
    };

    sendResponse(res, 200, true, { user: studentPayload, sessionId });
  } catch (error: any) {
    console.error('Error during student login:', error);
    sendResponse(res, 500, false, undefined, error.message || 'Student login failed');
  }
});

/**
 * Logout Handler (Destroy session in PostgreSQL + Clear cookie)
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const sessionId =
      req.cookies?.lectio_session_id ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (sessionId) {
      const db = getDb();
      await db.delete(sessions).where(eq(sessions.id, sessionId));
    }

    res.clearCookie('lectio_session_id');
    sendResponse(res, 200, true, { loggedOut: true });
  } catch (error: any) {
    console.error('Logout error:', error);
    sendResponse(res, 500, false, undefined, 'Error logging out');
  }
});

/**
 * Get Current Authenticated User (`/api/auth/me`)
 */
router.get('/me', requireAuth, (req: Request, res: Response) => {
  sendResponse(res, 200, true, req.user);
});

/**
 * Dev Switch Persona Handler (`/api/auth/switch-persona`)
 */
router.post('/switch-persona', async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const targetRole = role || 'teacher';

    const mockPersonaUsers: Record<string, User> = {
      teacher: {
        id: 'usr_teacher_1',
        name: 'Sara Jenkins, M.Ed.',
        email: 'sara.jenkins@springfield.edu',
        role: 'teacher',
        title: '3rd Grade Lead Educator',
        schoolDistrict: 'Springfield School District',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        districtId: 'dist_springfield_1',
      },
      curriculum_lead: {
        id: 'usr_curriculum_1',
        name: 'Marcus Vance',
        email: 'm.vance@metro-curriculum.org',
        role: 'curriculum_lead',
        title: 'Director of K-8 Literacy & Curriculum',
        schoolDistrict: 'Metropolitan Educational District',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        districtId: 'dist_metro_1',
      },
      qa_auditor: {
        id: 'usr_qa_1',
        name: 'Elena Rostova',
        email: 'e.rostova@education-qa.gov',
        role: 'qa_auditor',
        title: 'Senior Standards & Compliance Auditor',
        schoolDistrict: 'State Department of Education',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        districtId: 'dist_state_1',
      },
      admin: {
        id: 'usr_admin_1',
        name: 'Dr. Arthur Vance',
        email: 'admin@lectio-engine.edu',
        role: 'admin',
        title: 'System Administrator & District Officer',
        schoolDistrict: 'Metropolitan School District',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        districtId: 'dist_metro_1',
      },
      student: {
        id: 'usr_student_1',
        name: 'Alex Rivera',
        pseudonymousLabel: 'Alex R.',
        role: 'student',
        title: 'Elementary Learner (Grade 3)',
        schoolDistrict: 'Springfield Elementary',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        districtId: 'dist_springfield_1',
      },
    };

    const userPayload = mockPersonaUsers[targetRole] || mockPersonaUsers.teacher;

    const db = getDb();

    // 1. Ensure district exists
    if (userPayload.districtId) {
      await db
        .insert(schoolDistricts)
        .values({
          id: userPayload.districtId,
          name: userPayload.schoolDistrict || 'Springfield School District',
          code: `code_${userPayload.districtId}`,
          state: 'CA',
        })
        .onConflictDoNothing();
    }

    // 2. Ensure user exists in users table (required for sessions foreign key constraint)
    await db
      .insert(users)
      .values({
        id: userPayload.id,
        email: userPayload.email || `${userPayload.id}@demo.edu`,
        name: userPayload.name,
        role: userPayload.role,
        title: userPayload.title || null,
        avatarUrl: userPayload.avatarUrl || null,
        districtId: userPayload.districtId || null,
        pseudonymousLabel: userPayload.pseudonymousLabel || null,
        status: 'active',
      })
      .onConflictDoNothing();

    // 3. If student, ensure consent record exists so student endpoints pass COPPA gate
    if (userPayload.role === 'student') {
      await db
        .insert(consentRecords)
        .values({
          studentId: userPayload.id,
          districtId: userPayload.districtId || 'dist_springfield_1',
          parentGuardianEmailHash: 'demo_parent_hash',
          consentStatus: 'verified',
          verificationMethod: 'demo_verified',
          verifiedAt: new Date(),
        })
        .onConflictDoNothing();
    }

    // 4. Insert Session
    const sessionId = `sess_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 3600 * 1000);

    await db.insert(sessions).values({
      id: sessionId,
      userId: userPayload.id,
      role: userPayload.role,
      ipAddress: req.ip || null,
      userAgent: (req.headers['user-agent'] as string) || null,
      expiresAt,
    });

    res.cookie('lectio_session_id', sessionId, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: env.SESSION_TTL_HOURS * 3600 * 1000,
    });

    sendResponse(res, 200, true, { user: userPayload, sessionId });
  } catch (error: any) {
    console.error('Error switching persona:', error);
    sendResponse(res, 500, false, undefined, 'Error switching persona');
  }
});

export default router;
