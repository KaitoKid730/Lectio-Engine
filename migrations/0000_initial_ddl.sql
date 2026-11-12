-- Lectio Engine Full Relational DDL Schema
-- MASTER Specification Section 5

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Automatic Timestamp Update Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. School Districts Table
CREATE TABLE IF NOT EXISTS school_districts (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,
    state VARCHAR(2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_school_districts_updated_at ON school_districts;
CREATE TRIGGER update_school_districts_updated_at BEFORE UPDATE ON school_districts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Schools Table
CREATE TABLE IF NOT EXISTS schools (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    district_id VARCHAR(64) NOT NULL REFERENCES school_districts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Classrooms Table
CREATE TABLE IF NOT EXISTS classrooms (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    school_id VARCHAR(64) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    district_id VARCHAR(64) NOT NULL REFERENCES school_districts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    grade_level VARCHAR(32) NOT NULL CHECK (grade_level IN ('K','1','2','3','4','5','6','7','8')),
    access_code VARCHAR(32) UNIQUE NOT NULL, -- Classroom login access code for students
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Users Table (COPPA Pseudonymous for Students)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) UNIQUE, -- NULL for student accounts (COPPA compliance)
    password_hash VARCHAR(255), -- NULL for student accounts
    pin_hash VARCHAR(255), -- Hashed 4-6 digit PIN for student login authentication
    name VARCHAR(255) NOT NULL,
    pseudonymous_label VARCHAR(128), -- e.g. "Student 101"
    role VARCHAR(32) NOT NULL CHECK (role IN ('teacher', 'curriculum_lead', 'qa_auditor', 'admin', 'student')),
    title VARCHAR(128),
    avatar_url TEXT,
    district_id VARCHAR(64) REFERENCES school_districts(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'deactivated', 'archived')),
    failed_login_attempts INT NOT NULL DEFAULT 0 CHECK (failed_login_attempts >= 0),
    locked_until TIMESTAMP WITH TIME ZONE,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Classroom Enrollments Table
CREATE TABLE IF NOT EXISTS student_enrollments (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    classroom_id VARCHAR(64) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(classroom_id, student_id)
);

-- 6. Teacher Classroom Assignments Table
CREATE TABLE IF NOT EXISTS teacher_classroom_assignments (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    classroom_id VARCHAR(64) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    teacher_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(classroom_id, teacher_id)
);

-- 7. Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Parental Consent Records Table (COPPA Compliance)
CREATE TABLE IF NOT EXISTS consent_records (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    district_id VARCHAR(64) NOT NULL REFERENCES school_districts(id) ON DELETE CASCADE,
    parent_guardian_email_hash VARCHAR(255) NOT NULL,
    consent_status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (consent_status IN ('pending', 'verified', 'revoked')),
    verification_method VARCHAR(64) DEFAULT 'district_form' CHECK (verification_method IN ('district_form', 'email_link', 'admin_override')),
    verified_at TIMESTAMP WITH TIME ZONE
);

-- 10. Books Table
CREATE TABLE IF NOT EXISTS books (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    district_id VARCHAR(64) REFERENCES school_districts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    target_grade VARCHAR(32) NOT NULL CHECK (target_grade IN ('K','1','2','3','4','5','6','7','8')),
    total_word_count INT NOT NULL DEFAULT 0 CHECK (total_word_count >= 0),
    summary TEXT,
    chapters JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(chapters) = 'array'),
    vocabulary JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(vocabulary) = 'array'),
    moral_themes JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(moral_themes) = 'array'),
    status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'processed', 'needs_review', 'approved', 'failed', 'archived')),
    created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Lesson Plans Table
CREATE TABLE IF NOT EXISTS lesson_plans (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    source_book_id VARCHAR(64) REFERENCES books(id) ON DELETE CASCADE,
    district_id VARCHAR(64) REFERENCES school_districts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    target_grade_level VARCHAR(32) NOT NULL CHECK (target_grade_level IN ('K','1','2','3','4','5','6','7','8')),
    duration_minutes INT NOT NULL DEFAULT 45 CHECK (duration_minutes BETWEEN 5 AND 240),
    learning_objectives JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(learning_objectives) = 'array'),
    timed_steps JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(timed_steps) = 'array'),
    discussion_prompts JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(discussion_prompts) = 'array'),
    quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(quiz_questions) = 'array'),
    differentiation JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'generated', 'needs_review', 'approved', 'published', 'failed', 'archived')),
    created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_lesson_plans_updated_at ON lesson_plans;
CREATE TRIGGER update_lesson_plans_updated_at BEFORE UPDATE ON lesson_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. QA Assessments Table
CREATE TABLE IF NOT EXISTS qa_assessments (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    district_id VARCHAR(64) REFERENCES school_districts(id) ON DELETE CASCADE,
    target_type VARCHAR(32) NOT NULL CHECK (target_type IN ('book', 'lesson')),
    target_id VARCHAR(64) NOT NULL,
    flesch_kincaid_score NUMERIC(5,2) NOT NULL CHECK (flesch_kincaid_score >= 0),
    recommended_grade VARCHAR(32) NOT NULL CHECK (recommended_grade IN ('K','1','2','3','4','5','6','7','8')),
    child_safety_passed BOOLEAN NOT NULL DEFAULT TRUE,
    blooms_taxonomy_depth VARCHAR(64) NOT NULL,
    improvement_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(improvement_recommendations) = 'array'),
    status VARCHAR(32) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'auditing', 'passed', 'failed', 'needs_review', 'resolved', 'archived')),
    audited_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_qa_assessments_updated_at ON qa_assessments;
CREATE TRIGGER update_qa_assessments_updated_at BEFORE UPDATE ON qa_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Generated Images Table
CREATE TABLE IF NOT EXISTS generated_images (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    book_id VARCHAR(64) REFERENCES books(id) ON DELETE SET NULL,
    district_id VARCHAR(64) REFERENCES school_districts(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    visual_style VARCHAR(64) NOT NULL CHECK (visual_style IN ('Watercolor', '3D Cartoon', 'Vector Graphic')),
    aspect_ratio VARCHAR(16) NOT NULL CHECK (aspect_ratio IN ('1:1', '16:9', '4:3')),
    image_url TEXT NOT NULL,
    alt_text TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'generating', 'generated', 'approved', 'rejected', 'failed', 'archived')),
    created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_generated_images_updated_at ON generated_images;
CREATE TRIGGER update_generated_images_updated_at BEFORE UPDATE ON generated_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. Student Quiz Attempts Table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id VARCHAR(64) NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
    is_first_attempt BOOLEAN NOT NULL DEFAULT TRUE,
    idempotency_key VARCHAR(128) UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'submitted', 'graded', 'failed_validation', 'completed')),
    score_percentage NUMERIC(5,2) DEFAULT 0.0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP WITH TIME ZONE
);

-- 15. Student Quiz Results Table (COPPA Pseudonymous)
CREATE TABLE IF NOT EXISTS student_quiz_results (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempt_id VARCHAR(64) REFERENCES quiz_attempts(id) ON DELETE SET NULL,
    district_id VARCHAR(64) REFERENCES school_districts(id) ON DELETE CASCADE,
    student_display_name VARCHAR(128) NOT NULL, -- Pseudonymous label "Student 101"
    lesson_id VARCHAR(64) NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
    lesson_title VARCHAR(255) NOT NULL,
    score_percentage NUMERIC(5,2) NOT NULL CHECK (score_percentage BETWEEN 0 AND 100),
    total_questions INT NOT NULL CHECK (total_questions > 0),
    correct_count INT NOT NULL CHECK (correct_count >= 0 AND correct_count <= total_questions),
    xp_earned INT NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
    submitted_answers JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(submitted_answers) = 'array'),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. XP Transactions Ledger Table
CREATE TABLE IF NOT EXISTS xp_transactions (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INT NOT NULL CHECK (amount > 0),
    reason VARCHAR(128) NOT NULL,
    reference_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Student Streak Records Table
CREATE TABLE IF NOT EXISTS streak_records (
    student_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak_days INT NOT NULL DEFAULT 0 CHECK (current_streak_days >= 0),
    longest_streak_days INT NOT NULL DEFAULT 0 CHECK (longest_streak_days >= 0),
    last_activity_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_streak_records_updated_at ON streak_records;
CREATE TRIGGER update_streak_records_updated_at BEFORE UPDATE ON streak_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 18. Teacher Chat Conversations Table
CREATE TABLE IF NOT EXISTS chat_conversations (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    teacher_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    context_book_id VARCHAR(64) REFERENCES books(id) ON DELETE SET NULL,
    context_lesson_id VARCHAR(64) REFERENCES lesson_plans(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Instructional Assistance',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. Teacher Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    conversation_id VARCHAR(64) NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_role VARCHAR(32) NOT NULL CHECK (sender_role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. Background Processing Jobs Table
CREATE TABLE IF NOT EXISTS background_jobs (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    job_type VARCHAR(64) NOT NULL CHECK (job_type IN ('book_processing', 'lesson_generation', 'image_generation', 'qa_audit', 'cleanup_maintenance')),
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'retrying')),
    attempts INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_background_jobs_updated_at ON background_jobs;
CREATE TRIGGER update_background_jobs_updated_at BEFORE UPDATE ON background_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 21. Prompt Templates Table
CREATE TABLE IF NOT EXISTS prompt_templates (
    prompt_id VARCHAR(128) PRIMARY KEY,
    model_alias VARCHAR(64) NOT NULL,
    system_instruction TEXT NOT NULL,
    temperature NUMERIC(3,2) NOT NULL,
    max_tokens INT NOT NULL,
    active_version VARCHAR(32) NOT NULL DEFAULT 'v1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 22. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    actor_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    actor_role VARCHAR(32) NOT NULL,
    action VARCHAR(128) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for High-Performance Queries & Operations
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_district ON users(district_id);
CREATE INDEX IF NOT EXISTS idx_books_district ON books(district_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_book ON lesson_plans(source_book_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_district ON lesson_plans(district_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_status ON lesson_plans(status);
CREATE INDEX IF NOT EXISTS idx_qa_assessments_target ON qa_assessments(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_generated_images_book ON generated_images(book_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_student ON student_quiz_results(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_district ON student_quiz_results(district_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON background_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_teacher ON chat_conversations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_student ON xp_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_lesson ON quiz_attempts(student_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_student ON consent_records(student_id);
