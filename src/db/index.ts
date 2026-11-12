import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { sql } from 'drizzle-orm';
import * as schema from './schema';
import { env } from '../config/env';

const { Pool } = pg;

let dbInstance: any = null;
let pgliteInstance: PGlite | null = null;
let poolInstance: pg.Pool | null = null;
let isPgliteMode = false;
let pgliteInitPromise: Promise<void> | null = null;

export const initPgliteSchema = async (client: PGlite) => {
  await client.exec(`
    CREATE TABLE IF NOT EXISTS school_districts (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(32) UNIQUE NOT NULL,
      state VARCHAR(2) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS schools (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      district_id VARCHAR(64) NOT NULL REFERENCES school_districts(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(32) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS classrooms (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      school_id VARCHAR(64) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      district_id VARCHAR(64) NOT NULL REFERENCES school_districts(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      grade_level VARCHAR(32) NOT NULL,
      access_code VARCHAR(32) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email VARCHAR(255) UNIQUE,
      password_hash VARCHAR(255),
      pin_hash VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      pseudonymous_label VARCHAR(128),
      role VARCHAR(32) NOT NULL,
      title VARCHAR(128),
      avatar_url TEXT,
      district_id VARCHAR(64) REFERENCES school_districts(id) ON DELETE SET NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'active',
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TIMESTAMPTZ,
      must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS student_enrollments (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      classroom_id VARCHAR(64) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
      student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      enrolled_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT unq_student_enrollments UNIQUE (classroom_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS teacher_classroom_assignments (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      classroom_id VARCHAR(64) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
      teacher_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT unq_teacher_classroom_assignments UNIQUE (classroom_id, teacher_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(128) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(32) NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id VARCHAR(128) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS consent_records (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      district_id VARCHAR(64) NOT NULL REFERENCES school_districts(id) ON DELETE CASCADE,
      parent_guardian_email_hash VARCHAR(255) NOT NULL,
      consent_status VARCHAR(32) NOT NULL DEFAULT 'pending',
      verification_method VARCHAR(64) DEFAULT 'district_form',
      verified_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS books (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      district_id VARCHAR(64) REFERENCES school_districts(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      target_grade VARCHAR(32) NOT NULL,
      total_word_count INTEGER NOT NULL DEFAULT 0,
      summary TEXT,
      chapters JSONB NOT NULL DEFAULT '[]'::jsonb,
      vocabulary JSONB NOT NULL DEFAULT '[]'::jsonb,
      moral_themes JSONB NOT NULL DEFAULT '[]'::jsonb,
      status VARCHAR(32) NOT NULL DEFAULT 'draft',
      created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS lesson_plans (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      source_book_id VARCHAR(64) REFERENCES books(id) ON DELETE CASCADE,
      district_id VARCHAR(64) REFERENCES school_districts(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      target_grade_level VARCHAR(32) NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 45,
      learning_objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
      timed_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
      discussion_prompts JSONB NOT NULL DEFAULT '[]'::jsonb,
      quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
      differentiation JSONB DEFAULT '{}'::jsonb,
      status VARCHAR(32) NOT NULL DEFAULT 'draft',
      created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      approved_at TIMESTAMPTZ,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS qa_assessments (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      district_id VARCHAR(64) REFERENCES school_districts(id) ON DELETE CASCADE,
      target_type VARCHAR(32) NOT NULL,
      target_id VARCHAR(64) NOT NULL,
      flesch_kincaid_score NUMERIC(5, 2) NOT NULL,
      recommended_grade VARCHAR(32) NOT NULL,
      child_safety_passed BOOLEAN NOT NULL DEFAULT TRUE,
      blooms_taxonomy_depth VARCHAR(64) NOT NULL,
      improvement_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
      status VARCHAR(32) NOT NULL DEFAULT 'queued',
      audited_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS generated_images (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      book_id VARCHAR(64) REFERENCES books(id) ON DELETE SET NULL,
      district_id VARCHAR(64) REFERENCES school_districts(id) ON DELETE CASCADE,
      prompt TEXT NOT NULL,
      visual_style VARCHAR(64) NOT NULL,
      aspect_ratio VARCHAR(16) NOT NULL,
      image_url TEXT NOT NULL,
      alt_text TEXT,
      status VARCHAR(32) NOT NULL DEFAULT 'queued',
      created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id VARCHAR(64) NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
      attempt_number INTEGER NOT NULL DEFAULT 1,
      is_first_attempt BOOLEAN NOT NULL DEFAULT TRUE,
      idempotency_key VARCHAR(128) UNIQUE,
      status VARCHAR(32) NOT NULL DEFAULT 'in_progress',
      score_percentage NUMERIC(5, 2) DEFAULT 0.0,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      submitted_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS student_quiz_results (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      attempt_id VARCHAR(64) REFERENCES quiz_attempts(id) ON DELETE SET NULL,
      district_id VARCHAR(64) REFERENCES school_districts(id) ON DELETE CASCADE,
      student_display_name VARCHAR(128) NOT NULL,
      lesson_id VARCHAR(64) NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
      lesson_title VARCHAR(255) NOT NULL,
      score_percentage NUMERIC(5, 2) NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_count INTEGER NOT NULL,
      xp_earned INTEGER NOT NULL DEFAULT 0,
      submitted_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
      completed_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS xp_transactions (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      reason VARCHAR(128) NOT NULL,
      reference_id VARCHAR(64),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS streak_records (
      student_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      current_streak_days INTEGER NOT NULL DEFAULT 0,
      longest_streak_days INTEGER NOT NULL DEFAULT 0,
      last_activity_date DATE DEFAULT CURRENT_DATE,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chat_conversations (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      teacher_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      context_book_id VARCHAR(64) REFERENCES books(id) ON DELETE SET NULL,
      context_lesson_id VARCHAR(64) REFERENCES lesson_plans(id) ON DELETE SET NULL,
      title VARCHAR(255) NOT NULL DEFAULT 'Instructional Assistance',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      conversation_id VARCHAR(64) NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
      sender_role VARCHAR(32) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS background_jobs (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      job_type VARCHAR(64) NOT NULL,
      payload JSONB NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'queued',
      attempts INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS prompt_templates (
      prompt_id VARCHAR(128) PRIMARY KEY,
      model_alias VARCHAR(64) NOT NULL,
      system_instruction TEXT NOT NULL,
      temperature NUMERIC(3, 2) NOT NULL,
      max_tokens INTEGER NOT NULL,
      active_version VARCHAR(32) NOT NULL DEFAULT 'v1',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      actor_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      actor_role VARCHAR(32) NOT NULL,
      action VARCHAR(128) NOT NULL,
      resource_type VARCHAR(64) NOT NULL,
      resource_id VARCHAR(64),
      details JSONB DEFAULT '{}'::jsonb,
      ip_address VARCHAR(45),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS presentations (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      title TEXT NOT NULL,
      source_book_id VARCHAR(64) REFERENCES books(id) ON DELETE SET NULL,
      source_lesson_id VARCHAR(64) REFERENCES lesson_plans(id) ON DELETE SET NULL,
      theme VARCHAR(64) NOT NULL DEFAULT 'modern',
      design_brief TEXT,
      custom_palette JSONB,
      design_review JSONB,
      status VARCHAR(32) NOT NULL DEFAULT 'draft',
      created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      district_id VARCHAR(64) REFERENCES school_districts(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE presentations ADD COLUMN IF NOT EXISTS design_brief TEXT;
    ALTER TABLE presentations ADD COLUMN IF NOT EXISTS custom_palette JSONB;
    ALTER TABLE presentations ADD COLUMN IF NOT EXISTS design_review JSONB;

    CREATE TABLE IF NOT EXISTS slides (
      id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      presentation_id VARCHAR(64) NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
      slide_order INT NOT NULL,
      layout VARCHAR(32) NOT NULL,
      title TEXT,
      bullets JSONB DEFAULT '[]'::jsonb,
      speaker_notes TEXT,
      image_url TEXT,
      activity JSONB,
      style JSONB DEFAULT '{}'::jsonb,
      image_score INT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE slides ADD COLUMN IF NOT EXISTS style JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE slides ADD COLUMN IF NOT EXISTS image_score INT;
  `);
};

export const getPgliteInstance = () => {
  if (!pgliteInstance) {
    pgliteInstance = new PGlite();
    pgliteInitPromise = initPgliteSchema(pgliteInstance).catch((err) => {
      console.warn('PGlite schema initialization error:', err);
    });
  }
  return pgliteInstance;
};

export const ensurePgliteReady = async () => {
  getPgliteInstance();
  if (pgliteInitPromise) {
    await pgliteInitPromise;
  }
};

export const getDbPool = (): any => {
  return hybridPool;
};

class HybridPool {
  private pgPool: pg.Pool | null = null;

  private getPgPool() {
    if (!this.pgPool) {
      this.pgPool = new Pool({
        connectionString: env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 3000,
      });

      this.pgPool.on('error', (err) => {
        console.warn('PostgreSQL Pool unexpected error:', err.message);
      });
    }
    return this.pgPool;
  }

  async query(text: string, params?: any[]): Promise<any> {
    if (isPgliteMode) {
      await ensurePgliteReady();
      return getPgliteInstance().query(text, params);
    }

    try {
      const realPool = this.getPgPool();
      return await realPool.query(text, params);
    } catch (err: any) {
      const isConnError =
        err?.code === 'ECONNREFUSED' ||
        err?.code === 'ENOTFOUND' ||
        err?.code === 'ETIMEDOUT' ||
        err?.message?.includes('connect ECONNREFUSED') ||
        err?.message?.includes('Connection terminated');

      if (isConnError) {
        console.warn('[DB] PostgreSQL connection failed, failing over to PGlite in-memory database:', err.message);
        isPgliteMode = true;
        dbInstance = null;
        await ensurePgliteReady();
        try {
          const { ensureSeedUsersExist } = await import('./seed');
          await ensureSeedUsersExist();
        } catch (_sErr) {}
        return getPgliteInstance().query(text, params);
      }
      throw err;
    }
  }

  async connect(): Promise<any> {
    if (isPgliteMode) {
      await ensurePgliteReady();
      const client = getPgliteInstance();
      return {
        query: (text: string, params?: any[]) => client.query(text, params),
        release: () => {},
      };
    }

    try {
      const realPool = this.getPgPool();
      return await realPool.connect();
    } catch (err: any) {
      const isConnError =
        err?.code === 'ECONNREFUSED' ||
        err?.code === 'ENOTFOUND' ||
        err?.code === 'ETIMEDOUT' ||
        err?.message?.includes('connect ECONNREFUSED') ||
        err?.message?.includes('Connection terminated');

      if (isConnError) {
        console.warn('[DB] PostgreSQL connection failed during connect(), failing over to PGlite:', err.message);
        isPgliteMode = true;
        dbInstance = null;
        await ensurePgliteReady();
        try {
          const { ensureSeedUsersExist } = await import('./seed');
          await ensureSeedUsersExist();
        } catch (_sErr) {}
        const client = getPgliteInstance();
        return {
          query: (text: string, params?: any[]) => client.query(text, params),
          release: () => {},
        };
      }
      throw err;
    }
  }

  on(event: string, listener: (...args: any[]) => void) {
    if (!isPgliteMode) {
      try {
        this.getPgPool().on(event as any, listener);
      } catch (_e) {}
    }
  }
}

const hybridPool = new HybridPool();

export const getDb = () => {
  if (isPgliteMode) {
    if (!dbInstance || !(dbInstance as any)._isPglite) {
      const client = getPgliteInstance();
      dbInstance = drizzlePglite(client, { schema });
      (dbInstance as any)._isPglite = true;
    }
    return dbInstance;
  }

  if (!dbInstance) {
    const pool = getDbPool();
    dbInstance = drizzlePg(pool as any, { schema });
  }
  return dbInstance;
};

export const checkDatabaseHealth = async (): Promise<{ connected: boolean; error?: string; mode?: string }> => {
  try {
    const pool = getDbPool();
    await pool.query('SELECT 1');
    return { connected: true, mode: isPgliteMode ? 'pglite' : 'postgres' };
  } catch (err: any) {
    return { connected: false, error: err?.message || 'Connection failed' };
  }
};

