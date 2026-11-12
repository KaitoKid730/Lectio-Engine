import { Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { getDbPool } from '../db';
import { sendResponse } from '../utils/response';

// Schemas
const CreateSchoolSchema = z.object({
  districtId: z.string().min(1, 'districtId is required'),
  name: z.string().min(1, 'School name is required'),
  code: z.string().min(1, 'School code is required'),
});

const CreateClassroomSchema = z.object({
  schoolId: z.string().min(1, 'schoolId is required'),
  districtId: z.string().min(1, 'districtId is required'),
  name: z.string().min(1, 'Classroom name is required'),
  gradeLevel: z.string().min(1, 'Grade level is required'),
  accessCode: z.string().min(1, 'Access code is required'),
});

const EnrollStudentSchema = z.object({
  studentId: z.string().min(1, 'studentId is required'),
});

const ConsentSchema = z.object({
  studentId: z.string().min(1, 'studentId is required'),
  districtId: z.string().min(1, 'districtId is required'),
  parentEmail: z.string().email('Valid parent email is required'),
  consentStatus: z.enum(['pending', 'verified', 'revoked']),
  verificationMethod: z.string().optional().default('district_form'),
});

/**
 * POST /api/admin/schools
 * Creates a new school record.
 */
export async function createSchoolController(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = CreateSchoolSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendResponse(res, 400, false, undefined, parseResult.error.issues[0].message);
      return;
    }

    const { districtId, name, code } = parseResult.data;
    const pool = getDbPool();

    const result = await pool.query(
      `INSERT INTO schools (id, district_id, name, code) VALUES ($1, $2, $3, $4) RETURNING *;`,
      [crypto.randomUUID(), districtId, name, code]
    );

    sendResponse(res, 201, true, result.rows[0]);
  } catch (err: any) {
    console.error('[Create School Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Error creating school.');
  }
}

/**
 * GET /api/admin/schools
 * Lists all schools.
 */
export async function listSchoolsController(_req: Request, res: Response): Promise<void> {
  try {
    const pool = getDbPool();
    const result = await pool.query(`SELECT * FROM schools ORDER BY name ASC;`);
    sendResponse(res, 200, true, result.rows);
  } catch (err: any) {
    console.error('[List Schools Controller] Error:', err);
    sendResponse(res, 500, false, undefined, 'Error listing schools.');
  }
}

/**
 * POST /api/admin/classrooms
 * Creates a new classroom.
 */
export async function createClassroomController(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = CreateClassroomSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendResponse(res, 400, false, undefined, parseResult.error.issues[0].message);
      return;
    }

    const { schoolId, districtId, name, gradeLevel, accessCode } = parseResult.data;
    const pool = getDbPool();

    const result = await pool.query(
      `INSERT INTO classrooms (id, school_id, district_id, name, grade_level, access_code)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [crypto.randomUUID(), schoolId, districtId, name, gradeLevel, accessCode]
    );

    sendResponse(res, 201, true, result.rows[0]);
  } catch (err: any) {
    console.error('[Create Classroom Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Error creating classroom.');
  }
}

/**
 * GET /api/admin/classrooms
 * Lists all classrooms.
 */
export async function listClassroomsController(_req: Request, res: Response): Promise<void> {
  try {
    const pool = getDbPool();
    const result = await pool.query(`SELECT * FROM classrooms ORDER BY name ASC;`);
    sendResponse(res, 200, true, result.rows);
  } catch (err: any) {
    console.error('[List Classrooms Controller] Error:', err);
    sendResponse(res, 500, false, undefined, 'Error listing classrooms.');
  }
}

/**
 * POST /api/admin/classrooms/:id/enroll
 * Links a student to a classroom.
 */
export async function enrollStudentController(req: Request, res: Response): Promise<void> {
  try {
    const classroomId = req.params.id;
    const parseResult = EnrollStudentSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendResponse(res, 400, false, undefined, parseResult.error.issues[0].message);
      return;
    }

    const { studentId } = parseResult.data;
    const pool = getDbPool();

    const result = await pool.query(
      `INSERT INTO student_enrollments (id, classroom_id, student_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (classroom_id, student_id) DO NOTHING
       RETURNING *;`,
      [crypto.randomUUID(), classroomId, studentId]
    );

    sendResponse(res, 200, true, result.rows[0] || { classroomId, studentId, enrolled: true });
  } catch (err: any) {
    console.error('[Enroll Student Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Error enrolling student.');
  }
}

/**
 * POST /api/admin/consent
 * Updates or creates parental consent records for COPPA compliance.
 */
export async function updateConsentController(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = ConsentSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendResponse(res, 400, false, undefined, parseResult.error.issues[0].message);
      return;
    }

    const { studentId, districtId, parentEmail, consentStatus, verificationMethod } = parseResult.data;
    const pool = getDbPool();

    // Hash parent email using SHA-256 for privacy
    const parentEmailHash = crypto.createHash('sha256').update(parentEmail.toLowerCase().trim()).digest('hex');
    const verifiedAt = consentStatus === 'verified' ? new Date() : null;

    // Check if consent record exists
    const existing = await pool.query(`SELECT id FROM consent_records WHERE student_id = $1;`, [studentId]);

    let consentRecord;
    if (existing.rows.length > 0) {
      const updateRes = await pool.query(
        `UPDATE consent_records SET
          district_id = $1,
          parent_guardian_email_hash = $2,
          consent_status = $3,
          verification_method = $4,
          verified_at = $5
         WHERE student_id = $6
         RETURNING *;`,
        [districtId, parentEmailHash, consentStatus, verificationMethod, verifiedAt, studentId]
      );
      consentRecord = updateRes.rows[0];
    } else {
      const insertRes = await pool.query(
        `INSERT INTO consent_records (
          id, student_id, district_id, parent_guardian_email_hash, consent_status, verification_method, verified_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;`,
        [crypto.randomUUID(), studentId, districtId, parentEmailHash, consentStatus, verificationMethod, verifiedAt]
      );
      consentRecord = insertRes.rows[0];
    }

    sendResponse(res, 200, true, consentRecord);
  } catch (err: any) {
    console.error('[Update Consent Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Error updating consent record.');
  }
}

/**
 * POST /api/students/:id/anonymize (Right to be Forgotten compliance workflow)
 * Purges active sessions/tokens, anonymizes user PII tombstone, deletes gamification state, and records audit log.
 */
export async function anonymizeStudentController(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.params.id;
    const pool = getDbPool();
    const actorId = (req as any).user?.id || 'admin-actor-id';
    const actorRole = (req as any).user?.role || 'admin';

    // Verify student exists
    const userRes = await pool.query(`SELECT * FROM users WHERE id = $1;`, [studentId]);
    if (userRes.rows.length === 0) {
      sendResponse(res, 404, false, undefined, 'Student user not found.');
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Delete all active sessions and password reset tokens
      await client.query(`DELETE FROM sessions WHERE user_id = $1;`, [studentId]);
      await client.query(`DELETE FROM password_reset_tokens WHERE user_id = $1;`, [studentId]);

      // 2. Anonymize user record in 'users' table (tombstone pattern to preserve FK integrity)
      await client.query(
        `UPDATE users SET
          name = 'Anonymized Student',
          email = NULL,
          pin_hash = NULL,
          pseudonymous_label = NULL,
          status = 'archived',
          updated_at = NOW()
         WHERE id = $1;`,
        [studentId]
      );

      // 3. Delete student's streak records and XP transactions
      await client.query(`DELETE FROM streak_records WHERE student_id = $1;`, [studentId]);
      await client.query(`DELETE FROM xp_transactions WHERE student_id = $1;`, [studentId]);

      // 4. Log compliance action in audit_logs
      await client.query(
        `INSERT INTO audit_logs (
          id, actor_id, actor_role, action, resource_type, resource_id, details
        ) VALUES ($1, $2, $3, 'STUDENT_ANONYMIZED', 'user', $4, $5::jsonb);`,
        [
          crypto.randomUUID(),
          actorId,
          actorRole,
          studentId,
          JSON.stringify({
            anonymizedAt: new Date().toISOString(),
            complianceAction: 'RightToBeForgotten_COPPA_FERPA',
          }),
        ]
      );

      await client.query('COMMIT');

      sendResponse(res, 200, true, {
        studentId,
        status: 'anonymized',
        message: 'Student account PII successfully anonymized and active sessions purged.',
      });
    } catch (txErr: any) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[Anonymize Student Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Error anonymizing student user.');
  }
}

/**
 * GET /api/admin/users
 * Lists all users for administrative directory.
 */
export async function listUsersController(_req: Request, res: Response): Promise<void> {
  try {
    const pool = getDbPool();
    const result = await pool.query(`
      SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.role, 
        u.title, 
        u.district_id as "districtId", 
        d.name as "schoolDistrict", 
        u.created_at as "createdAt"
      FROM users u
      LEFT JOIN school_districts d ON u.district_id = d.id
      ORDER BY u.created_at DESC;
    `);
    sendResponse(res, 200, true, result.rows);
  } catch (err: any) {
    console.error('[List Users Controller] Error:', err);
    sendResponse(res, 500, false, undefined, 'Error listing users.');
  }
}

/**
 * POST /api/admin/users
 * Provisions a new user.
 */
export async function createUserAdminController(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, role, title, district } = req.body;
    if (!name || !email || !role) {
      sendResponse(res, 400, false, undefined, 'Name, email, and role are required.');
      return;
    }
    const pool = getDbPool();
    const newId = crypto.randomUUID();

    let districtId: string | null = null;
    let districtName: string | null = null;

    if (district) {
      const distCheck = await pool.query(
        `SELECT id, name FROM school_districts WHERE id = $1 OR name = $1 LIMIT 1;`,
        [district]
      );
      if (distCheck.rows.length > 0) {
        districtId = distCheck.rows[0].id;
        districtName = distCheck.rows[0].name;
      }
    }

    if (!districtId) {
      const defaultDist = await pool.query(`SELECT id, name FROM school_districts LIMIT 1;`);
      if (defaultDist.rows.length > 0) {
        districtId = defaultDist.rows[0].id;
        districtName = defaultDist.rows[0].name;
      }
    }

    const result = await pool.query(
      `INSERT INTO users (id, name, email, role, title, district_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, name, email, role, title, district_id as "districtId", created_at as "createdAt";`,
      [newId, name, email.toLowerCase().trim(), role, title || 'Educator', districtId]
    );

    const userRecord = {
      ...result.rows[0],
      schoolDistrict: districtName || 'Springfield School District',
    };

    sendResponse(res, 201, true, userRecord);
  } catch (err: any) {
    console.error('[Create User Controller] Error:', err);
    sendResponse(res, 500, false, undefined, err.message || 'Error creating user.');
  }
}
