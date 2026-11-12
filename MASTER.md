---
title: MASTER System Architecture & Master Specification
layer: SYSTEM_MASTER
status: APPROVED
version: 5.2.0
last_updated: 2026-08-04
author: Chief Software Architect & Engineering Lead
---

# MASTER System Architecture & Master Specification — Lectio Engine

## 1. Executive Summary & Core Platform Vision

The **Lectio Engine** is an enterprise-grade, multi-tier AI Educational Platform & Book Processing Engine engineered to ingest storybooks and K-8 educational manuscripts, extract structured pedagogical artifacts, synthesize standards-aligned lesson plans, power an interactive contextual Teacher Copilot, perform automated readability and pedagogical QA auditing, deliver an interactive student learning portal, and synthesize vibrant storybook illustrations using Google Gemini AI models.

This document serves as the **authoritative single source of truth** for the entire platform architecture, subsystem boundaries, coding standards, PostgreSQL DDL schemas, API endpoint contracts, background queue/worker pipelines, AI prompt catalogs, security frameworks, COPPA/FERPA compliance protocols, WCAG 2.1 AA accessibility standards, granular role-based access control (RBAC), operational state machines, UI component/button inventories, testing strategies, CI/CD pipelines, observability frameworks, storage/lifecycle mechanics, business rules, and change governance.

---

## 2. System Goals, Non-Goals, Architectural Principles & Global Forbidden Rules

### 2.1 Core System Goals
- **Automated Manuscript & Book Parsing**: Ingest raw text manuscripts (max 500,000 characters / 2 MB), partition chapters, compute total word counts, evaluate Flesch-Kincaid grade levels, extract grade-appropriate vocabulary items, and synthesize social-emotional learning (SEL) moral themes.
- **Standards-Aligned AI Lesson & Unit Planning**: Synthesize 45-minute lesson plans featuring measurable learning objectives mapped to Bloom's Taxonomy, timed classroom activities, discussion prompts, differentiated learning extensions (ELL/IEP/504/Gifted), and self-grading quizzes with 0-indexed answer keys (`AI-LessonGenerator` serving as the core Planning AI).
- **Contextual Teacher Copilot**: Provide real-time instructional coaching, WIDA-aligned ELL scaffolding, IEP accommodation drafting, parent email updates, and printable homework worksheet generation.
- **Pedagogical QA & Compliance Auditing**: Automatically evaluate text readability metrics, screen for child safety/age appropriateness, and analyze Bloom's cognitive depth.
- **Multimodal Visual Asset Generation**: Synthesize storybook illustrations, flashcard images, and banner visual artwork in multiple artistic styles (Watercolor, 3D Cartoon, Vector Graphic) and aspect ratios (`1:1`, `16:9`, `4:3`) using Gemini image models.
- **Interactive Student Learning Portal**: Deliver an age-appropriate student reader, 3D interactive vocabulary flashcards, and self-paced quizzes with server-graded XP rewards, retake safeguards, and streak tracking.
- **District Administration Console & Roster Management**: Manage staff and student accounts, configure schools/classrooms/enrollments, manage parental consent, inspect RBAC permission matrices, monitor telemetry metrics, and browse architectural specifications.

### 2.2 System Non-Goals
- **No Third-Party Ad Networks or Commercial Trackers**: Zero external advertising, marketing analytics scripts, or commercial student data profiling.
- **No Direct Raw API Access for Students**: Students interact solely through secure, validated backend API endpoints; direct model access is strictly forbidden.
- **No Direct Client-Side API Key Exposure**: Secrets such as `GEMINI_API_KEY` are kept server-side only.

### 2.3 Architectural Principles
1. **Single Container Ingress & Host Binding**: The Node.js Express server binds strictly to `0.0.0.0:3000` (Cloud Run ingress standard).
2. **Unified REST Response Envelope**: All API endpoints return standardized JSON payloads formatted as `{ success: boolean, data: T, error?: string, pagination?: PaginationMeta, timestamp: string }`.
3. **Server-Side Authorization & Validation**: Role-based access controls and payload schema validations are strictly enforced on the server for every endpoint.
4. **Student-Safe API Projections**: Quiz answer keys (`correctAnswerIndex` and `explanation`) are strictly stripped from all student-facing endpoints; explanations are returned only after quiz submission.
5. **Resilient Fallback Infrastructure**: If Gemini image generation quotas are exceeded, high-quality pre-seeded visual assets are rendered seamlessly.

### 2.4 Global Forbidden Rules ("What the System Must Never Do")
1. **NEVER** expose `GEMINI_API_KEY` or secondary API secrets to client-side code, browser bundles, or client network logs.
2. **NEVER** invoke Gemini AI models directly from the browser window or frontend components.
3. **NEVER** trust client-calculated quiz scores or XP values; all grading and reward calculations MUST occur server-side.
4. **NEVER** store raw student Personally Identifiable Information (PII) such as real names, home addresses, phone numbers, or personal email addresses.
5. **NEVER** leak quiz answer keys or explanations in student-facing `GET` responses before quiz submission.
6. **NEVER** allow unauthenticated student access without valid classroom access codes or hashed PIN validation.
7. **NEVER** log unredacted PII or sensitive authentication tokens in server console outputs or telemetry logs.
8. **NEVER** send unredacted student PII to external Gemini AI model prompts.
9. **NEVER** allow student persona roles to access administrative user management, prompt templates, or staff-only views.
10. **NEVER** allow role escalation from client-side request parameters without backend session validation.
11. **NEVER** render raw, unsanitized Markdown strings in the DOM (must sanitize against XSS attacks).
12. **NEVER** allow unvalidated or unmoderated AI output to be directly published to student-facing views.
13. **NEVER** generate visual artwork without passing prompt safety screening (`image.safety-check.v1`).
14. **NEVER** bypass RBAC authorization checks on server API endpoints regardless of client state.
15. **NEVER** allow default admin passwords in production environments without forcing immediate password updates on first login.
16. **NEVER** execute raw SQL queries constructed via string concatenation (must use parameterized queries or ORM models).
17. **NEVER** serve HTTP API responses without the standard response envelope.
18. **NEVER** allow duplicate specification documents across module files; `MASTER.md` remains the supreme single source of truth.
19. **NEVER** allow unhandled promise rejections or uncaught exceptions to crash the Express application container.
20. **NEVER** bypass COPPA parental consent verification protocols for student-facing data operations.
21. **NEVER** transmit unencrypted data over non-TLS connections in staging or production environments.

---

## 3. Coding Standards & Software Engineering Guidelines

To ensure code quality, readability, maintainability, and security across the codebase, all developers and AI agents MUST adhere strictly to the following standards:

### 3.1 TypeScript & Type Safety Standards
- **Strict Mode**: `tsconfig.json` MUST enforce `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`, and `"noUnusedLocals": true`.
- **Top-Level Named Imports**: All `import` statements MUST be placed at the top level of the file. Use explicit named imports.
- **Enum Declarations**: Use standard `enum` declarations for fixed domain types. Do NOT use `const enum`. Never use `import type` to import enum values.
- **Centralized Types**: All domain interfaces and shared types MUST reside in `src/types.ts`.

### 3.2 React & UI Component Guidelines
- **Functional Components**: Write modern React functional components with explicit TypeScript props interfaces (e.g. `interface ComponentProps { ... }`).
- **Hooks Discipline**: Never call hooks conditionally. Ensure `useEffect` dependency arrays include only stable primitive values or memoized references to prevent infinite re-render loops.
- **Single-View Component Architecture**: Keep components modular. Sub-components must reside in `src/components/` (e.g., `Header.tsx`, `StudentPortalView.tsx`, `DocsSpecViewer.tsx`).
- **Lucide Icons**: All visual UI icons MUST be imported directly from `lucide-react`.

### 3.3 Express & API Standards
- **Async Error Handling**: Wrap all async Express route handlers in standard `try/catch` blocks or use an async middleware wrapper (`express-async-handler`).
- **Parameterized Queries**: All database interactions MUST use parameterized SQL or ORM model methods to eliminate SQL injection vulnerabilities.
- **Input Sanitization & Zod Validation**: Validate all request parameters and request bodies using Zod schemas before processing.

---

## 4. Catalog of All 22 Subsystem Modules

| # | Subsystem ID | Module Name | Layer | Primary Scope & Artifact | Inputs | Outputs | Core Business & Validation Rules | Acceptance Criteria |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `CORE-Foundation` | Container Infrastructure & Ingress | Core | `server.ts`, `docs/01-FOUNDATION.md` | Ingress HTTP traffic, process env | Standardized HTTP responses, static assets | Binds strictly to `0.0.0.0:3000`. Serves Vite dev middleware & production CJS bundle. Secret `GEMINI_API_KEY` server-side only. | Server boots on port 3000, responds to `/api/health`, hides API keys. |
| **02** | `CORE-DataSchema` | Relational & Domain Type Schema | Core | `src/types.ts`, `docs/02-DATA-SCHEMA.md` | Domain requirements, DDL specs | SQL DDL schemas, TypeScript interfaces | Defines PostgreSQL tables (`users`, `books`, `lesson_plans`, etc.) and TypeScript domain models. | Zero TypeScript errors (`tsc --noEmit`), valid DDL statements. |
| **03** | `CORE-Auth` | Identity & Session Manager | Core | `/api/auth/*`, `AuthModal.tsx` | Credentials, student PINs, tokens | Authenticated session, user profile | Staff bcrypt auth, student PIN + classroom code auth, 5-attempt lockout, 12h session TTL, force admin password reset. | Staff and student authenticate securely; failed logins lock after 5 attempts. |
| **04** | `CORE-RBAC` | Role-Based Access Control | Core | `docs/10-AUTH-ROLES.md` | User role token, requested action | Permission decision (Allow/Deny) | Enforces 5-persona permission matrix (`teacher`, `curriculum_lead`, `qa_auditor`, `admin`, `student`). Returns HTTP 403 on restriction. | Unauthorized actions blocked on API routes and UI buttons. |
| **05** | `CORE-BookProcessing` | Book Ingestion & Parsing Engine | Core | `/api/books/process`, `docs/03-BOOK-PROCESSING.md` | Story text manuscript (max 500k chars), grade target | Parsed `Book` object with chapters & vocab | Ingests story text, uses `gemini-3.6-flash` (`book.process.v1`), splits chapters, extracts vocabulary & moral SEL themes. | Storybook parsed into structured chapters and vocabulary words. |
| **06** | `CORE-StudentPortal` | Student Reader & Quiz Portal | Core | `/api/student/*`, `StudentPortalView.tsx` | Student ID, story/lesson selection | Interactive reader, flashcards, quiz XP | Student reader with chapter switching, 3D vocabulary cards, self-paced quizzes, student-safe projections (no answer key leaks), XP rewards, streak tracking. | Student reads chapters, flips flashcards, submits quizzes for XP. |
| **07** | `CORE-AdminConsole` | District Staff & Roster Manager | Core | `/api/auth/users`, `/api/admin/*` | Staff/student roster data, consent records | Staff user list, provisioned roster, consent logs | Restricted to `admin`. Manages district accounts, schools, classrooms, enrollments, parental consent status, audit logs, district exports. | Admin provisions staff/students, assigns classrooms, manages parental consent. |
| **08** | `AI-LessonGenerator` | Curricular Lesson & Planning Engine | AI | `/api/lessons/generate`, `docs/04-LESSON-AI.md` | Topic/Book ID, grade level, duration | Structured `LessonPlan` with quiz | Uses `gemini-3.6-flash` (`lesson.generate.v1`). Generates 45-min lesson, timed steps, discussion prompts, 3-5 item quiz. | Generates complete lesson plan with 0-indexed answer key. |
| **09** | `AI-TeacherCopilot` | Contextual Teacher Assistant | AI | `/api/teacher/chat`, `docs/05-TEACHER-AI.md` | Chat message, book/lesson context | Instructional advice, email drafts | Uses `gemini-3.6-flash` (`teacher.chat.v1`). Injects active book/lesson context. Provides ELL scaffolds, IEP support, parent emails, worksheets. | Copilot responds in <1.5s with actionable teaching suggestions. |
| **10** | `AI-ImageGenerator` | Storybook Illustration AI Engine | AI | `/api/images/generate`, `docs/06-IMAGE-AI.md` | Image prompt, style, aspect ratio | Generated illustration image asset | Uses `gemini-3.1-flash-lite-image` (`image.generate.v1`). Supports Watercolor, 3D Cartoon, Vector styles and `1:1`, `16:9`, `4:3` ratios. Automatically runs `image.alt-text.v1`. | Renders story image; falls back gracefully if quota exhausted. |
| **11** | `AI-QAAuditor` | Readability & Pedagogy Auditor | AI | `/api/qa/audit`, `docs/07-QA-AI.md` | Book or Lesson text, grade target | `QAAssessment` report with scores | Uses `gemini-3.6-flash` (`qa.readability-audit.v1`, `qa.lesson-quality-audit.v1`). Computes Flesch-Kincaid grade, screens child safety, checks Bloom's depth. | Audit report generated with pass/fail status and recommendations. |
| **12** | `AI-PromptManager` | Prompt System & Schema Engine | AI | `server.ts`, `@google/genai` | Prompt ID, parameter payload | Structured JSON response | Manages 22 schema-enforced prompt templates, system instructions, temperature, max tokens, response schemas for Gemini models. | All prompt calls return valid JSON adhering to declared schemas. |
| **13** | `PIPE-ImageValidation` | Asset Resolution & Safety Pipeline | Pipeline | `ImageAIView.tsx` | Prompt string, visual parameters | Sanitized prompt, validated style | Verifies visual prompt safety, validates aspect ratio constraints, formats asset URLs, manages pre-seeded fallback assets. | Prompts screened for safety before model invocation. |
| **14** | `PIPE-TextChunking` | Semantic Text Splitter Pipeline | Pipeline | `docs/03-BOOK-PROCESSING.md` | Raw story text string | Paragraph chunks, word counts | Paragraph word analyzer, chapter boundary parser, Flesch-Kincaid formula evaluator. Enforces 500k char max limit. | Calculates exact total word count and sentence statistics. |
| **15** | `PIPE-QuizEvaluator` | Quiz Grading & XP Award Engine | Pipeline | `/api/student/quiz-submit` | Raw student answer choices, attemptId | Score percentage, XP awarded | Server-side evaluation of student quiz answers against stored answer key, calculates score, enforces first-attempt XP rules, records XP, updates streak. | Accurately grades quiz server-side, prevents XP retake farming. |
| **16** | `API-Gateway` | REST Endpoint Router & Validator | Pipeline | `docs/08-API-SPEC.md` | HTTP request headers & body | Standardized JSON envelope | Standardizes HTTP status codes, CORS headers, payload schema validation, student-safe projection middleware, error contracts. | API routes enforce envelope format and error handling. |
| **17** | `UI-HeaderTelemetry` | Global Navigation & Telemetry | UI | `src/components/Header.tsx`, `docs/18-UI-SYSTEM.md` | Navigation tab state, system stats | Tab bar UI, live metric badge | Header tab navigation, system telemetry counters, active session persona badge, audit-logged persona switcher. | Smooth tab switching, real-time telemetry badge updates. |
| **18** | `UI-OverviewDashboard` | System Dashboard & Quick Launch | UI | `OverviewDashboard.tsx`, `docs/18-UI-SYSTEM.md` | System stats, recent entities | Dashboard grid UI, quick launch | Display metric stats cards, quick launch module grid, recent storybooks feed, spec browser link. | Dashboard renders system stats and module launch cards cleanly. |
| **19** | `UI-SpecViewer` | Architecture Spec Browser | UI | `DocsSpecViewer.tsx` | Selected document ID | Rendered spec markdown/raw | Interactive architecture specification browser, formatted vs raw markdown view toggle, copy to clipboard. | Views all spec files, formats markdown, copies content. |
| **20** | `OPS-Verification` | System Health & Telemetry Ops | Ops | `docs/09-CHECKLIST.md`, `/api/health` | Health check requests | System health status, metrics | Telemetry endpoints, system verification matrix, health check handlers. | `/api/health` returns HTTP 200 with timestamp and status. |
| **21** | `OPS-BuildDeploy` | Container Build & Production Bundle | Ops | `package.json`, `dist/server.cjs` | TypeScript source files | Bundled CJS server (`dist/server.cjs`) | Single-command production build (`npm run build`) and start script (`dist/server.cjs`). | Applet builds cleanly and runs in Cloud Run container. |
| **22** | `GOV-ChangeControl` | Governance & Specification Rules | Ops | `MASTER.md`, `TEMPLATE_SUBSYSTEM.md` | Specification modification request | Approved version update | Requirements freeze protocol, single source of truth governance, YAML frontmatter enforcement. | Changes follow formal approval and frontmatter metadata standards. |

---

## 5. Full Relational Database DDL Schema & Strategy (PostgreSQL Specification)

### 5.1 Database Management Strategy
- **ORM / Query Builder**: Use parameterized query libraries or Drizzle ORM to maintain type-safe interaction.
- **Migration Pipeline**: SQL migration files are maintained in `/migrations/` and executed sequentially at application boot.
- **ID Generation**: All primary keys default to UUID v4 strings (`gen_random_uuid()`).
- **District Multi-Tenancy**: Data rows are strictly scoped with `district_id` to enforce FERPA privacy boundaries.

### 5.2 Automatic Triggers & JSON Validation
- **Automated `updated_at` Trigger**: Automatically updates the `updated_at` timestamp on record modification using PostgreSQL trigger function `update_updated_at_column()`.
- **JSONB Schema Validation**: Server-side Zod schemas validate AI JSON payloads before database insertion; SQL `CHECK` constraints verify that `chapters`, `vocabulary`, `quiz_questions`, and `learning_objectives` store valid JSON arrays.

### 5.3 Complete PostgreSQL DDL Table Definitions

```sql
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
CREATE TABLE school_districts (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,
    state VARCHAR(2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER update_school_districts_updated_at BEFORE UPDATE ON school_districts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Schools Table
CREATE TABLE schools (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    district_id VARCHAR(64) NOT NULL REFERENCES school_districts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Classrooms Table
CREATE TABLE classrooms (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    school_id VARCHAR(64) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    district_id VARCHAR(64) NOT NULL REFERENCES school_districts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    grade_level VARCHAR(32) NOT NULL CHECK (grade_level IN ('K','1','2','3','4','5','6','7','8')),
    access_code VARCHAR(32) UNIQUE NOT NULL, -- Classroom login access code for students
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Users Table (COPPA Pseudonymous for Students)
CREATE TABLE users (
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
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Classroom Enrollments Table
CREATE TABLE student_enrollments (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    classroom_id VARCHAR(64) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(classroom_id, student_id)
);

-- 6. Teacher Classroom Assignments Table
CREATE TABLE teacher_classroom_assignments (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    classroom_id VARCHAR(64) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    teacher_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(classroom_id, teacher_id)
);

-- 7. Sessions Table
CREATE TABLE sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Password Reset Tokens Table
CREATE TABLE password_reset_tokens (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Parental Consent Records Table (COPPA Compliance)
CREATE TABLE consent_records (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    district_id VARCHAR(64) NOT NULL REFERENCES school_districts(id) ON DELETE CASCADE,
    parent_guardian_email_hash VARCHAR(255) NOT NULL,
    consent_status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (consent_status IN ('pending', 'verified', 'revoked')),
    verification_method VARCHAR(64) DEFAULT 'district_form' CHECK (verification_method IN ('district_form', 'email_link', 'admin_override')),
    verified_at TIMESTAMP WITH TIME ZONE
);

-- 10. Books Table
CREATE TABLE books (
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
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Lesson Plans Table
CREATE TABLE lesson_plans (
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
CREATE TRIGGER update_lesson_plans_updated_at BEFORE UPDATE ON lesson_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. QA Assessments Table
CREATE TABLE qa_assessments (
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
CREATE TRIGGER update_qa_assessments_updated_at BEFORE UPDATE ON qa_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Generated Images Table
CREATE TABLE generated_images (
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
CREATE TRIGGER update_generated_images_updated_at BEFORE UPDATE ON generated_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. Student Quiz Attempts Table
CREATE TABLE quiz_attempts (
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
CREATE TABLE student_quiz_results (
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
CREATE TABLE xp_transactions (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INT NOT NULL CHECK (amount > 0),
    reason VARCHAR(128) NOT NULL,
    reference_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Student Streak Records Table
CREATE TABLE streak_records (
    student_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak_days INT NOT NULL DEFAULT 0 CHECK (current_streak_days >= 0),
    longest_streak_days INT NOT NULL DEFAULT 0 CHECK (longest_streak_days >= 0),
    last_activity_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER update_streak_records_updated_at BEFORE UPDATE ON streak_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 18. Teacher Chat Conversations Table
CREATE TABLE chat_conversations (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    teacher_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    context_book_id VARCHAR(64) REFERENCES books(id) ON DELETE SET NULL,
    context_lesson_id VARCHAR(64) REFERENCES lesson_plans(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Instructional Assistance',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. Teacher Chat Messages Table
CREATE TABLE chat_messages (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    conversation_id VARCHAR(64) NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_role VARCHAR(32) NOT NULL CHECK (sender_role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. Background Processing Jobs Table
CREATE TABLE background_jobs (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    job_type VARCHAR(64) NOT NULL CHECK (job_type IN ('book_processing', 'lesson_generation', 'image_generation', 'qa_audit', 'cleanup_maintenance')),
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'retrying')),
    attempts INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER update_background_jobs_updated_at BEFORE UPDATE ON background_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 21. Prompt Templates Table
CREATE TABLE prompt_templates (
    prompt_id VARCHAR(128) PRIMARY KEY,
    model_alias VARCHAR(64) NOT NULL,
    system_instruction TEXT NOT NULL,
    temperature NUMERIC(3,2) NOT NULL,
    max_tokens INT NOT NULL,
    active_version VARCHAR(32) NOT NULL DEFAULT 'v1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 22. Audit Logs Table
CREATE TABLE audit_logs (
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
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_district ON users(district_id);
CREATE INDEX idx_books_district ON books(district_id);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_lesson_plans_book ON lesson_plans(source_book_id);
CREATE INDEX idx_lesson_plans_district ON lesson_plans(district_id);
CREATE INDEX idx_lesson_plans_status ON lesson_plans(status);
CREATE INDEX idx_qa_assessments_target ON qa_assessments(target_id, target_type);
CREATE INDEX idx_generated_images_book ON generated_images(book_id);
CREATE INDEX idx_quiz_results_student ON student_quiz_results(student_id);
CREATE INDEX idx_quiz_results_district ON student_quiz_results(district_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_background_jobs_status ON background_jobs(status);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_chat_conversations_teacher ON chat_conversations(teacher_id);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_xp_transactions_student ON xp_transactions(student_id);
CREATE INDEX idx_quiz_attempts_student_lesson ON quiz_attempts(student_id, lesson_id);
CREATE INDEX idx_consent_records_student ON consent_records(student_id);
```

---

## 6. Full API Endpoint Inventory & REST Contracts

Every endpoint responds with the standard envelope: `{ success: boolean, data: T, error?: string, pagination?: PaginationMeta, timestamp: string }`.

### 6.1 Standard Query Parameters & Student-Safe Projections
- **Query Parameters**: `page` (default `1`), `limit` (default `20`, max `100`), `sort`, `order` (`asc`|`desc`), `status`, `search`.
- **Student-Safe Projection Rule**: Endpoints serving content to the student role (`GET /api/student/books`, `GET /api/student/lessons`) MUST strip `correctAnswerIndex` and `explanation` from all embedded `quiz_questions` objects before rendering.
- **Student Book/Image Filter**: `GET /api/student/books` returns ONLY books with `status = 'approved'` matching the student's district. `GET /api/images/:id/file` for student role returns ONLY image assets attached to approved books.

### 6.2 Endpoint Master Inventory

| Method | Endpoint Path | Subsystem | Roles | Payload Schema Summary | Response Data |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | `OPS-Verification` | Public | None | `{ status: 'ok', timestamp: string }` |
| **GET** | `/api/health/dependencies` | `OPS-Verification` | Staff | None | `{ database: 'ok', gemini: 'ok' }` |
| **GET** | `/api/stats` | `UI-HeaderTelemetry` | Staff | None | Telemetry stats summary |
| **GET** | `/api/docs/list` | `UI-SpecViewer` | Staff | None | `DocumentationFile[]` |
| **GET** | `/api/docs/:id` | `UI-SpecViewer` | Staff | None | Spec document object |
| **GET** | `/api/auth/me` | `CORE-Auth` | All | None | Authenticated `User` object |
| **POST** | `/api/auth/login` | `CORE-Auth` | Staff, Admin | `{ email, password }` | Authenticated Staff `User` profile |
| **POST** | `/api/auth/student-login` | `CORE-Auth` | Student | `{ studentId, accessCode, pin }` | Authenticated Student `User` profile |
| **POST** | `/api/auth/logout` | `CORE-Auth` | All | None | `{ loggedOut: true }` |
| **POST** | `/api/auth/switch-persona` | `CORE-Auth` | Staff (Non-Prod) | `{ persona: UserRole }` | Authenticated `User` profile |
| **POST** | `/api/auth/password-reset/request` | `CORE-Auth` | Staff | `{ email: string }` | `{ resetRequested: true }` |
| **POST** | `/api/auth/password-reset/confirm` | `CORE-Auth` | Staff | `{ token: string, newPassword: string }` | `{ passwordUpdated: true }` |
| **GET** | `/api/auth/users` | `CORE-AdminConsole` | Admin | Query: `page, limit, sort, search` | `User[]` + `pagination` |
| **GET** | `/api/auth/users/:id` | `CORE-AdminConsole` | Admin | None | Detailed `User` profile |
| **POST** | `/api/auth/users` | `CORE-AdminConsole` | Admin | `{ name, role, title, districtId, pin? }` | Newly created `User` |
| **PATCH** | `/api/auth/users/:id` | `CORE-AdminConsole` | Admin | `{ status, role }` | Updated `User` |
| **POST** | `/api/admin/schools` | `CORE-AdminConsole` | Admin | `{ name, code, districtId }` | `School` object |
| **GET** | `/api/admin/schools` | `CORE-AdminConsole` | Admin, Staff | Query: `districtId` | `School[]` |
| **POST** | `/api/admin/classrooms` | `CORE-AdminConsole` | Admin, Teacher | `{ name, gradeLevel, schoolId, districtId }` | `Classroom` object with `access_code` |
| **GET** | `/api/admin/classrooms` | `CORE-AdminConsole` | Admin, Staff | Query: `schoolId, teacherId` | `Classroom[]` |
| **POST** | `/api/admin/classrooms/:id/enroll` | `CORE-AdminConsole` | Admin, Teacher | `{ studentId }` | Enrollment record |
| **POST** | `/api/admin/classrooms/:id/assign-teacher` | `CORE-AdminConsole` | Admin | `{ teacherId }` | Assignment record |
| **POST** | `/api/admin/consent` | `CORE-AdminConsole` | Admin, Teacher | `{ studentId, parentEmail, status }` | `consent_records` entry |
| **GET** | `/api/admin/consent/:studentId` | `CORE-AdminConsole` | Admin, Staff | None | `consent_records` entry |
| **GET** | `/api/books` | `CORE-BookProcessing` | Staff | Query: `page, limit, sort, status, search` | `Book[]` + `pagination` |
| **GET** | `/api/books/:id` | `CORE-BookProcessing` | Staff | None | `Book` object |
| **POST** | `/api/books/process` | `CORE-BookProcessing` | Curriculum, Admin | `{ title, author, text, targetGrade }` | Parsed `Book` object |
| **POST** | `/api/books/:id/approve` | `CORE-BookProcessing` | Curriculum, Admin | None | Approved `Book` object |
| **POST** | `/api/books/:id/reject` | `CORE-BookProcessing` | Curriculum, Admin | `{ reason: string }` | Updated `Book` (`failed`) |
| **POST** | `/api/books/:id/reprocess` | `CORE-BookProcessing` | Curriculum, Admin | None | `Book` in `processing` state |
| **POST** | `/api/books/:id/archive` | `CORE-BookProcessing` | Admin | None | Updated `Book` (`archived`) |
| **DELETE** | `/api/books/:id` | `CORE-BookProcessing` | Admin | None | `{ deleted: true }` |
| **GET** | `/api/lessons` | `AI-LessonGenerator` | Staff | Query: `page, limit, sort, status, search` | `LessonPlan[]` + `pagination` |
| **GET** | `/api/lessons/:id` | `AI-LessonGenerator` | Staff | None | `LessonPlan` object |
| **POST** | `/api/lessons/generate` | `AI-LessonGenerator` | Teacher, Curriculum, Admin | `{ bookId?, topic?, gradeLevel, duration }` | Generated `LessonPlan` |
| **PATCH** | `/api/lessons/:id` | `AI-LessonGenerator` | Teacher, Curriculum, Admin | Partial `LessonPlan` payload | Updated `LessonPlan` |
| **POST** | `/api/lessons/:id/approve` | `AI-LessonGenerator` | Curriculum, Admin | None | Approved `LessonPlan` |
| **POST** | `/api/lessons/:id/publish` | `AI-LessonGenerator` | Curriculum, Admin | None | Published `LessonPlan` |
| **POST** | `/api/lessons/:id/regenerate` | `AI-LessonGenerator` | Teacher, Curriculum, Admin | `{ section: 'objectives' | 'steps' | 'prompts' | 'quiz' | 'differentiation' }` | Updated `LessonPlan` |
| **POST** | `/api/lessons/:id/export` | `AI-LessonGenerator` | Staff | `{ format: 'pdf' | 'docx' | 'json' }` | Export payload / binary file |
| **GET** | `/api/teacher/conversations` | `AI-TeacherCopilot` | Teacher, Admin | Query: `page, limit` | `chat_conversations[]` |
| **GET** | `/api/teacher/conversations/:id` | `AI-TeacherCopilot` | Teacher, Admin | None | Conversation + `chat_messages[]` |
| **POST** | `/api/teacher/conversations` | `AI-TeacherCopilot` | Teacher, Admin | `{ bookId?, lessonId? }` | New conversation object |
| **POST** | `/api/teacher/chat` | `AI-TeacherCopilot` | Teacher, Admin | `{ message, conversationId, contextId? }` | `{ reply: string }` |
| **DELETE** | `/api/teacher/conversations/:id` | `AI-TeacherCopilot` | Teacher, Admin | None | `{ cleared: true }` |
| **POST** | `/api/qa/audit` | `AI-QAAuditor` | QA, Admin | `{ targetType, text, targetGrade }` | `QAAssessment` report |
| **GET** | `/api/qa/reports` | `AI-QAAuditor` | QA, Admin | Query: `page, limit, targetType` | `QAAssessment[]` + `pagination` |
| **GET** | `/api/qa/reports/:id` | `AI-QAAuditor` | QA, Admin | None | Detailed `QAAssessment` report |
| **POST** | `/api/qa/reports/:id/resolve` | `AI-QAAuditor` | QA, Admin | `{ notes: string }` | Resolved `QAAssessment` |
| **GET** | `/api/qa/reports/:id/export` | `AI-QAAuditor` | QA, Admin | None | Exported report document |
| **GET** | `/api/images` | `AI-ImageGenerator` | Staff | Query: `page, limit, bookId` | `GeneratedImage[]` + `pagination` |
| **GET** | `/api/images/:id` | `AI-ImageGenerator` | Staff, Student | None | `GeneratedImage` job status |
| **POST** | `/api/images/generate` | `AI-ImageGenerator` | Teacher, Curriculum, Admin | `{ prompt, style, aspectRatio, bookId? }` | `GeneratedImage` object |
| **POST** | `/api/images/:id/approve` | `AI-ImageGenerator` | Curriculum, Admin | None | Approved `GeneratedImage` |
| **POST** | `/api/images/:id/reject` | `AI-ImageGenerator` | Curriculum, Admin | None | Rejected `GeneratedImage` |
| **POST** | `/api/images/:id/regenerate` | `AI-ImageGenerator` | Teacher, Curriculum, Admin | None | Regenerated `GeneratedImage` |
| **GET** | `/api/images/:id/file` | `AI-ImageGenerator` | Staff, Student | None | Image asset file stream |
| **GET** | `/api/student/books` | `CORE-StudentPortal` | Student, Staff | Query: `page, limit, search` | Published storybook list (Stripped keys) |
| **GET** | `/api/student/lessons` | `CORE-StudentPortal` | Student, Staff | Query: `page, limit, search` | Published lesson plan list (Stripped keys) |
| **POST** | `/api/student/quiz-start` | `CORE-StudentPortal` | Student | `{ lessonId }` | `quiz_attempts` record + sanitized questions |
| **POST** | `/api/student/quiz-submit` | `PIPE-QuizEvaluator` | Student | `{ lessonId, attemptId, answers: number[], idempotencyKey }` | Server-graded result + XP + explanations |
| **GET** | `/api/student/quiz-results` | `CORE-StudentPortal` | Student, Staff | Query: `page, limit` | Student quiz performance log |
| **GET** | `/api/student/progress` | `CORE-StudentPortal` | Student, Staff | None | Overall student progress |
| **GET** | `/api/student/xp` | `CORE-StudentPortal` | Student | None | `{ totalXp: number }` |
| **GET** | `/api/student/streaks` | `CORE-StudentPortal` | Student | None | `streak_records` object |
| **POST** | `/api/students/:id/anonymize` | `CORE-AdminConsole` | Admin | None | Anonymization confirmation |
| **GET** | `/api/admin/district-export` | `CORE-AdminConsole` | Admin | None | Encrypted compliance archive |
| **GET** | `/api/admin/audit-logs` | `CORE-AdminConsole` | Admin | Query: `page, limit, action, actorId` | `AuditLog[]` + `pagination` |
| **GET** | `/api/admin/telemetry` | `CORE-AdminConsole` | Admin | None | Detailed telemetry metrics |

---

## 7. Background Queue, Worker Pipeline & Async Processing Architecture

To prevent API timeouts, long-running processes execute asynchronously via background processing queues managed by `background_jobs` table records.

```
                  +----------------------------------------------+
                  |         EXPRESS BACKEND CONTROLLER           |
                  +----------------------------------------------+
                                         │
                   Insert Job Record into `background_jobs`
                                         │
                                         ▼
                  +----------------------------------------------+
                  |           BACKGROUND JOB DISPATCHER          |
                  +----------------------------------------------+
                        │                    │                 │
        +---------------+                    │                 +---------------+
        ▼                                    ▼                                 ▼
+---------------+                    +---------------+                 +---------------+
| BOOK QUEUE    |                    | LESSON QUEUE  |                 | IMAGE QUEUE   |
| Max 5 Workers |                    | Max 5 Workers |                 | Max 3 Workers |
+---------------+                    +---------------+                 +---------------+
        │                                    │                                 │
        ▼                                    ▼                                 ▼
+---------------+                    +---------------+                 +---------------+
| Book Worker   |                    | Lesson Worker |                 | Image Worker  |
| Text Splitter |                    | Unit Planner  |                 | Gemini Art    |
+---------------+                    +---------------+                 +---------------+
```

### 7.1 Queue Concurrency & SQL Row Locking
Workers poll the `background_jobs` table for available tasks using strict PostgreSQL row locking to prevent race conditions across concurrent processes:
```sql
SELECT * FROM background_jobs 
WHERE status = 'queued' 
ORDER BY created_at ASC 
LIMIT 1 
FOR UPDATE SKIP LOCKED;
```

### 7.2 Worker Job Timeouts & Maintenance Tasks
- **Execution Limit**: Every job has a strict **60-second execution timeout**.
- **Watchdog Supervisor**: If a worker hangs for >60 seconds without reporting progress, the watchdog supervisor thread terminates the worker task, updates the job record status to `failed` with `error_message: 'Worker execution timed out after 60s'`, and recycles worker capacity.
- **Cleanup & Maintenance Jobs**: `cleanup_maintenance` background tasks run periodically to purge completed jobs older than 30 days, expired sessions, and audit logs older than 365 days.

### 7.3 Retry, Backoff & Dead Letter Queue (DLQ)
- Up to **3 retries** with exponential backoff (1s, 2s, 4s) for transient model/rate-limit errors.
- Tasks reaching max retries transition to `failed` status in `background_jobs` and dispatch an alert telemetry event.

---

## 8. Gemini AI Prompt Catalog & Governance (22 Schema-Enforced Prompts)

All prompt calls execute server-side using `@google/genai`, enforce strict JSON response schemas, strip student PII, and maintain defined generation parameters.

| Prompt ID | Module | Target Model | Temp | Max Tokens | Purpose & System Instruction | Output Schema |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **`book.process.v1`** | `CORE-BookProcessing` | `gemini-3.6-flash` | 0.2 | 4096 | Extracts summary, grade fit, vocabulary items, and moral themes. | JSON (`summary`, `recommendedGrade`, `chapters`, `vocabulary`, `moralThemes`) |
| **`book.chapter-split.v1`** | `CORE-BookProcessing` | `gemini-3.6-flash` | 0.1 | 4096 | Partitions raw manuscript into numbered chapter objects. | JSON (`chapters: Array<{ chapterNumber, title, content, wordCount }>`) |
| **`book.vocabulary-extract.v1`** | `CORE-BookProcessing` | `gemini-3.6-flash` | 0.2 | 2048 | Extracts 5-10 grade-appropriate vocabulary items with sentences. | JSON (`vocabulary: Array<{ word, definition, contextSentence, difficulty }>`) |
| **`book.theme-extract.v1`** | `CORE-BookProcessing` | `gemini-3.6-flash` | 0.3 | 1024 | Identifies core social-emotional learning (SEL) moral themes. | JSON (`moralThemes: string[]`) |
| **`lesson.generate.v1`** | `AI-LessonGenerator` | `gemini-3.6-flash` | 0.4 | 4096 | Planning AI: Synthesizes 45-min lesson plan with timed steps and objectives. | JSON (`title`, `targetGradeLevel`, `learningObjectives`, `timedSteps`, `discussionPrompts`) |
| **`lesson.quiz-generate.v1`** | `AI-LessonGenerator` | `gemini-3.6-flash` | 0.2 | 2048 | Generates 3-5 item multiple choice quiz with 0-indexed answer keys. | JSON (`quizQuestions: Array<{ id, question, options, correctAnswerIndex, explanation }>`) |
| **`lesson.differentiate.v1`** | `AI-LessonGenerator` | `gemini-3.6-flash` | 0.3 | 2048 | Formulates ELL scaffolds, IEP accommodations, and gifted extensions. | JSON (`ellScaffolds`, `iepAccommodations`, `giftedExtensions`) |
| **`teacher.chat.v1`** | `AI-TeacherCopilot` | `gemini-3.6-flash` | 0.5 | 2048 | Contextual instructional assistant incorporating book/lesson metadata. | JSON (`reply: string`) |
| **`teacher.ell-scaffold.v1`** | `AI-TeacherCopilot` | `gemini-3.6-flash` | 0.3 | 2048 | Drafts explicit WIDA-aligned English Language Learner scaffolds. | JSON (`scaffolds: string[]`, `sentenceFrames: string[]`) |
| **`teacher.iep-accommodation.v1`** | `AI-TeacherCopilot` | `gemini-3.6-flash` | 0.2 | 2048 | Drafts individualized IEP/504 learning accommodations. | JSON (`accommodations: string[]`, `sensoryBreaks: string[]`) |
| **`teacher.parent-email.v1`** | `AI-TeacherCopilot` | `gemini-3.6-flash` | 0.4 | 1024 | Drafts empathetic parent progress updates. | JSON (`subject: string`, `body: string`) |
| **`teacher.worksheet.v1`** | `AI-TeacherCopilot` | `gemini-3.6-flash` | 0.3 | 2048 | Generates printable homework worksheets with exercises. | JSON (`title: string`, `instructions: string`, `questions: string[]`) |
| **`image.prompt-builder.v1`** | `AI-ImageGenerator` | `gemini-3.6-flash` | 0.5 | 1024 | Enhances story excerpts into vivid visual art prompts. | JSON (`enhancedPrompt: string`) |
| **`image.generate.v1`** | `AI-ImageGenerator` | `gemini-3.1-flash-lite-image` | 0.7 | N/A | Renders child-friendly storybook artwork in specified style. | Binary Image Asset Output |
| **`image.safety-check.v1`** | `PIPE-ImageValidation` | `gemini-3.6-flash` | 0.1 | 512 | Audits visual art prompts to guarantee zero inappropriate imagery. | JSON (`passed: boolean`, `reason?: string`) |
| **`image.alt-text.v1`** | `PIPE-ImageValidation` | `gemini-3.6-flash` | 0.2 | 512 | Generates accessible WCAG alt text descriptions for illustrations. | JSON (`altText: string`) |
| **`qa.readability-audit.v1`** | `AI-QAAuditor` | `gemini-3.6-flash` | 0.1 | 1024 | Computes Flesch-Kincaid grade level and sentence metrics. | JSON (`fleschKincaidScore`, `recommendedGrade`, `sentenceLengthAvg`) |
| **`qa.lesson-quality-audit.v1`** | `AI-QAAuditor` | `gemini-3.6-flash` | 0.2 | 1024 | Evaluates lesson plan alignment against state curriculum standards. | JSON (`pedagogicalQualityScore`, `standardsAlignment`) |
| **`qa.age-safety-audit.v1`** | `AI-QAAuditor` | `gemini-3.6-flash` | 0.1 | 1024 | Screens passage text for age safety and child appropriateness. | JSON (`childSafetyPassed: boolean`, `flags: string[]`) |
| **`qa.blooms-depth-audit.v1`** | `AI-QAAuditor` | `gemini-3.6-flash` | 0.2 | 1024 | Evaluates Bloom's Taxonomy cognitive depth. | JSON (`bloomsTaxonomyDepth: string`, `score: number`) |
| **`content.moderation.v1`** | `CORE-Foundation` | `gemini-3.6-flash` | 0.1 | 512 | Universal text upload content moderation guardrail. | JSON (`safe: boolean`, `flaggedCategories: string[]`) |
| **`content.pii-redaction.v1`** | `CORE-Foundation` | `gemini-3.6-flash` | 0.1 | 1024 | Redacts personally identifiable student details prior to model execution. | JSON (`sanitizedText: string`, `redactedItemCount: number`) |

---

## 9. Security, Privacy (COPPA / FERPA), Authentication & WCAG 2.1 AA Accessibility Specification

### 9.1 Authentication Mechanics, Session Security & Credential Rules
- **Staff Authentication**: Password hashing using `bcrypt` (cost factor 12). Staff sessions enforce 12-hour absolute TTL, 30-minute idle timeout, and max 3 active concurrent sessions per user.
- **Student Authentication**: Students log in via `POST /api/auth/student-login` using `studentId + classroom accessCode + hashed 4-6 digit PIN`. No email or raw password required.
- **Account Lockout Protection**: 5 consecutive failed login attempts lock the account for **15 minutes** (`locked_until`).
- **Default Admin Credential Hardening**: Initial admin account `admin@lectio.edu` forces an immediate password change on first login (`must_change_password = true`). Shipping unhardened default passwords in production is strictly forbidden.
- **Session Cookie Security**: Auth cookies enforce `HttpOnly; Secure; SameSite=Strict; Path=/`.
- **CSRF & Payload Protection**: Double-submit CSRF cookie pattern with `X-Requested-With` header verification. Maximum manuscript upload body size is capped at **500,000 characters / 2 MB** (responds with HTTP `413 Payload Too Large` if exceeded).
- **Secrets Management & Rotation**: Secrets (`GEMINI_API_KEY`, `SESSION_SECRET`) are stored in GCP Secret Manager and rotated quarterly.

### 9.2 COPPA Compliance & Parental Consent Workflow
- **Zero Raw PII Storage**: Student accounts store NO real names, personal email addresses, or phone numbers.
- **Pseudonymous Display Labels**: Students use generated pseudonymous labels (e.g., `student-101`, "Student 101").
- **Parental Consent Acquisition Flow**:
  1. District uploads signed parental consent forms or issues hashed-email verification links via `POST /api/admin/consent`.
  2. Consent status evaluates to `verified`, `pending`, or `revoked`.
  3. Students with `pending` or `revoked` consent status are strictly gated and cannot log into or access student portal endpoints.
- **Zero Commercial Tracking**: No third-party ad tags, commercial analytics scripts, or student profiling.

### 9.3 FERPA Compliance & Incident Response
- **Data Encryption**: Encrypted in transit (TLS 1.3) and at rest (AES-256).
- **District Scoping**: Student records and quiz data are strictly isolated by `district_id`.
- **Outbound Email & Communications**: Reset tokens and notifications pass through district-approved SMTP services or direct administrative handoffs; raw emails are never sent without district authorization.
- **Breach Notification Protocol**: Any detected unauthorized access or data exposure triggers an immediate automated alert to district IT security officers within **72 hours** in accordance with FERPA/COPPA requirements.

### 9.4 WCAG 2.1 AA Accessibility Specification
- **Color Contrast**: All text and visual controls maintain at least 4.5:1 contrast against backgrounds.
- **Keyboard Navigation**: Focus rings (`ring-2 ring-indigo-500`) and explicit tab indexes across all views and modals.
- **Screen Reader Support**: Semantic HTML tags with `aria-label`, `aria-expanded`, and `role="dialog"` attributes.
- **Dyslexia & Motion Options**: Supports dyslexia-friendly typography toggles and respects `prefers-reduced-motion` settings. Visual accessibility preferences persist in `localStorage`.

---

## 10. Granular Role-Based Access Control (RBAC Permission Matrix)

| Feature / Screen / API Endpoint | Teacher (`teacher`) | Curriculum Lead (`curriculum_lead`) | QA Auditor (`qa_auditor`) | Admin (`admin`) | Student (`student`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Overview Dashboard (`/`)** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access | ❌ Redirected |
| **Student Reader Portal (`/student`)** | 👁️ Preview | 👁️ Preview | 👁️ Preview | ✅ Full Access | ✅ Interactive Learner |
| **Process Book (`POST /api/books/process`)** | 👁️ Read-Only | ✅ Full Access | 👁️ Read-Only | ✅ Full Access | ❌ Forbidden |
| **Approve Book (`POST /api/books/:id/approve`)** | ❌ Forbidden | ✅ Full Access | ❌ Forbidden | ✅ Full Access | ❌ Forbidden |
| **Generate Lesson (`POST /api/lessons/generate`)** | ✅ Full Access | ✅ Full Access | 👁️ Read-Only | ✅ Full Access | ❌ Forbidden |
| **Approve Lesson (`POST /api/lessons/:id/approve`)**| ❌ Forbidden | ✅ Full Access | ❌ Forbidden | ✅ Full Access | ❌ Forbidden |
| **Publish Lesson (`POST /api/lessons/:id/publish`)**| ❌ Forbidden | ✅ Full Access | ❌ Forbidden | ✅ Full Access | ❌ Forbidden |
| **Teacher Copilot (`POST /api/teacher/chat`)** | ✅ Full Access | 👁️ Limited | ❌ Forbidden | ✅ Full Access | ❌ Forbidden |
| **Run QA Audit (`POST /api/qa/audit`)** | 👁️ Read-Only | 👁️ Read-Only | ✅ Full Audit | ✅ Full Audit | ❌ Forbidden |
| **Generate Artwork (`POST /api/images/generate`)** | ✅ Full Access | ✅ Full Access | 👁️ Read-Only | ✅ Full Access | ❌ Forbidden |
| **Admin Console & Roster (`/api/admin/*`)** | 👁️ Roster Only | ❌ Forbidden | ❌ Forbidden | ✅ Full Management | ❌ Forbidden |
| **Parental Consent Log (`/api/admin/consent`)** | 👁️ Class Only | ❌ Forbidden | ❌ Forbidden | ✅ Full Access | ❌ Forbidden |
| **Audit Logs (`/api/admin/audit-logs`)** | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden | ✅ Full Access | ❌ Forbidden |

---

## 11. Operational Lifecycle State Machines

```
Book Lifecycle:     [DRAFT] -> [PROCESSING] -> [PROCESSED] -> [NEEDS_REVIEW] -> [APPROVED] / [FAILED] / [ARCHIVED]
Lesson Lifecycle:   [DRAFT] -> [GENERATING] -> [GENERATED] -> [NEEDS_REVIEW] -> [APPROVED] -> [PUBLISHED] / [FAILED]
Image Lifecycle:    [QUEUED] -> [GENERATING] -> [GENERATED] -> [APPROVED] / [REJECTED] / [FAILED]
QA Audit Lifecycle: [QUEUED] -> [AUDITING] -> [PASSED] / [FAILED] -> [RESOLVED]
Quiz Attempt:       [NOT_STARTED] -> [IN_PROGRESS] -> [SUBMITTED] -> [GRADED]
User Account:       [INVITED] -> [ACTIVE] -> [SUSPENDED] -> [DEACTIVATED] -> [ARCHIVED]
Parental Consent:   [PENDING] -> [VERIFIED] / [REVOKED]
```

---

## 12. Complete UI Inventory, Component Catalog & Design System

### 12.1 Primary Screens & Route Map (Including Edge & Error Views)
1. **`/` (Overview Dashboard)**: System stats cards, module quick-launch cards, recent storybooks feed, spec browser link.
2. **`/books` (Book Processing)**: Manuscript submission form, chapter reader modal, vocabulary extraction list.
3. **`/lessons` (Lesson Planner)**: Lesson generation form, timed activity steps, discussion prompts, quiz preview.
4. **`/copilot` (Teacher Copilot)**: Context bar, message thread, quick assistant buttons (ELL, IEP, Parent Email, Worksheet).
5. **`/image-ai` (Storybook Artwork AI)**: Art generation form (style, ratio), visual asset gallery, fallback toggles.
6. **`/qa-auditor` (Readability & Pedagogy QA)**: Text input, readability score meters, child safety flags, Bloom's depth chart.
7. **`/student` (Student Reader & Quiz Portal)**: Reader view, 3D vocabulary flashcards, self-paced quiz view, XP counter, streak badge.
8. **`/admin` (District User & Roster Management)**: Staff/student table, classroom enrollment modal, consent tracker, audit log inspector.
9. **`/spec-viewer` (Architecture Document Browser)**: Document selector, formatted markdown vs raw tab toggle, copy button.
10. **`/404` (Not Found View)**: Custom 404 screen with illustration and redirect to Overview Dashboard.
11. **`/403` (Forbidden Access View)**: Role-restriction alert explaining permission requirements.
12. **`/500` (Server Error View)**: Technical error handling view with correlation error ID (`X-Correlation-ID`) and recovery action.
13. **`/session-expired` (Session Expired View)**: Re-authentication prompt modal.

### 12.2 Reusable Component Inventory
- **`BookCard`**: Renders storybook title, grade badge, status indicator, chapter count, and action options.
- **`QuizPanel`**: Interactive quiz interface rendering option radio buttons, instant submission, and server-graded explanations.
- **`FlashcardFlipper`**: 3D perspective flip card displaying vocabulary word on front, definition and context sentence on back.
- **`ScoreMeter`**: Circular SVG progress gauge representing readability scores and quiz performance percentages.
- **`LoadingSkeleton`**: Animated pulses for table rows, cards, and text lines during asynchronous data fetching.
- **`ConfirmDialog`**: Accessibility-compliant modal dialog for confirming high-impact operations (e.g. archiving, deletion).
- **`SpecDocViewer`**: Markdown rendering engine with tabs for formatted text, raw markdown, and copy-to-clipboard control.
- **`AuditFilterBar`**: Multi-select dropdown and search input bar for filtering audit logs and QA assessments.
- **`PersonaSwitcher`**: Non-production persona preview bar for auditing RBAC views.
- **`StatusBadge`**: Color-coded pill badge indicating entity states (`approved` -> green, `processing` -> blue, `failed` -> red).

### 12.3 Mandatory UI Component States
Every screen and data-fetching component MUST implement 4 distinct states:
1. **Loading State**: Displays animated `LoadingSkeleton` or spinner without layout shift.
2. **Empty State**: Displays clear vector artwork, friendly explanation, and primary action button (e.g. "No storybooks found. Submit your first manuscript").
3. **Error State**: Displays high-contrast alert box with diagnostic error message and a "Retry" button.
4. **Success State**: Fully populated, interactive layout with smooth entry animations.

### 12.4 Design System Tokens & Responsive Breakpoints
- **Primary Color Tokens**: `indigo-600` (#4F46E5) primary accent, `slate-900` (#0F172A) headers, `amber-500` (#F59E0B) XP badges.
- **Neutral Canvas Tokens**: `slate-50` (#F8FAFC) main background, `white` (#FFFFFF) card containers, `slate-200` (#E2E8F0) hairline borders.
- **Typography Scale**: Major Second scale (1.125 step ratio). Body text 16px (`text-base`, line-height 1.5–1.7). Display titles 24px–36px.
- **Responsive Breakpoints**:
  - **Mobile (`<640px`)**: Single-column vertical stacking, min touch target 44px, hidden complex table columns.
  - **Tablet (`640px–1024px`)**: 2-column grid arrangements, collapsible sidebar menu.
  - **Desktop (`>1024px`)**: Multi-column bento grids, sticky sidebars, high-density data tables.

---

## 13. End-to-End Workflows & Failure Recovery Strategies

### 13.1 Book Processing & Lesson Generation Flow
```
[User submits manuscript] ──> [Content Moderation & PII Scrubbing] ──> [Enqueued in background_jobs]
                                                                                │
                                                                                ▼
[Lesson Plan Published] <── [Curriculum Approval] <── [Planning AI Generation] <── [Chapter Partitioning]
```

### 13.2 Failure Recovery Protocols
- **Gemini Timeout / Quota Failure**: Retries up to 3 times with backoff. If quota is exhausted, system gracefully serves pre-seeded artwork or fallback templates without crashing.
- **Unsafe Content Detection**: Automatically flags unsafe uploads, halts processing, logs violation in `audit_logs`, and notifies user with guidance.

---

## 14. Configuration Matrix & Safe Defaults

| Variable Name | Required | Default Value | Purpose & Target Scope |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | `development` | Runtime environment (`development` or `production`). |
| `PORT` | Yes | `3000` | Ingress port for Cloud Run container (`0.0.0.0:3000`). |
| `GEMINI_API_KEY` | Yes | Required in `.env` | Server-side Gemini API key (**NEVER** expose to browser). |
| `DATABASE_URL` | Optional | Local in-memory seed | PostgreSQL database connection string. |
| `SESSION_SECRET` | Yes | Required in `.env` | Express session encryption secret token (**Must be provided**). |
| `SESSION_TTL_HOURS` | No | `12` | Session absolute time-to-live in hours. |
| `MAX_MANUSCRIPT_SIZE` | No | `5242880` | Maximum manuscript upload size in bytes (5 MB max payload). |
| `CORS_ALLOWED_ORIGINS` | No | `http://localhost:3000` | Allowed CORS origins for API gateway. |
| `RATE_LIMIT_MAX` | No | `100` | Maximum requests per 15-minute window per IP. |
| `GEMINI_TEXT_MODEL` | No | `gemini-3.6-flash` | Default Gemini text model alias. |
| `GEMINI_IMAGE_MODEL` | No | `gemini-3.1-flash-lite-image` | Default Gemini image synthesis model alias. |

---

## 15. Comprehensive Testing Strategy, CI/CD Pipelines, Backup & Observability

### 15.1 Testing Framework & Gates
1. **Static Type Checking**: `tsc --noEmit` verifies all domain models, component props, and API request/response types.
2. **Linter Compliance**: `npm run lint` enforces zero syntax errors and clean module imports.
3. **Unit Testing**: Unit tests validate text chunking algorithms, Flesch-Kincaid readability formulas, and server-side quiz grading.
4. **Prompt Regression Testing**: Automated test suite asserting that schema-enforced Gemini prompts return strictly valid JSON matching declared output schemas.
5. **API Contract Verification**: Integration tests validating REST endpoint response envelope structures, error HTTP status codes, and student-safe field projection rules.
6. **End-to-End (E2E) Testing**: Automated user flow verification using Playwright covering login, manuscript upload, lesson generation, and quiz submission.
7. **Accessibility Testing**: Automated accessibility auditing using `@axe-core/playwright` ensuring zero WCAG 2.1 AA violations.
8. **Load & Performance Testing**: Automated k6 performance benchmark asserting target p95 latency `< 500ms` under 200 concurrent quiz submission loads.
9. **Vulnerability Scanning**: CI pipeline executes `npm audit` on every build to block known dependency vulnerabilities.

### 15.2 CI/CD Deployment Pipeline & Rollback Strategy
1. **Verification Gate**: Every pull request executes `npm run lint` and `tsc --noEmit`.
2. **Database Migration Execution**: Database migrations execute automatically during deployment setup (`drizzle-kit push` / migration runner).
3. **Production Container Build**:
   - **Build Command**: `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`
   - **Start Command**: `node dist/server.cjs`
4. **Environment Promotion**: Local (`localhost:3000`) ──> Dev (`ais-dev-*`) ──> Staging ──> Production (`Cloud Run`).
5. **Rollback Strategy**: Instant deployment rollback capability via Cloud Run revision traffic management:
   `gcloud run services update-traffic lectio-engine --to-revisions=PREVIOUS=100`

### 15.3 Database Backup & Disaster Recovery (DR) Strategy
- **Snapshot Cadence**: Automated daily PostgreSQL database disk snapshots with 30-day retention.
- **Point-In-Time Recovery (PITR)**: Write-Ahead Logging (WAL) enabled to allow point-in-time recovery up to the past 7 days.
- **Recovery Targets**: Recovery Point Objective (RPO) `< 15 minutes`; Recovery Time Objective (RTO) `< 1 hour`.

### 15.4 Telemetry, Observability & Alerting
- **Endpoints**: `/api/health` (liveness) and `/api/health/dependencies` (readiness).
- **Key System Metrics**:
  - p95 API Latency Target: `< 500ms`.
  - Queue Backlog Depth Target: `< 10 pending jobs`.
  - Gemini API Error Rate Target: `< 1%`.
- **Automated Alerting**: System dispatches urgent alerts to district admins and operational logs if `background_jobs` records fail > 5 times in 10 minutes or if model error rates exceed 5% over a 5-minute window.

---

## 16. Storage, Infrastructure & Data Maintenance Mechanics

### 16.1 Cloud Storage & Asset Serving Strategy
- **Storage Target**: Generated storybook artwork is persisted in Cloud Storage (`gs://lectio-engine-media/`) in production or local static storage (`/public/generated_images/`) in development.
- **Asset Serving & Accessibility**: Images are served via `GET /api/images/:id/file` with public CDN caching headers (`Cache-Control: public, max-age=31536000, immutable`). `image.alt-text.v1` executes automatically upon successful image synthesis to attach WCAG-compliant `alt_text` before asset approval.
- **Pre-Seeded Visual Fallbacks**: Standardized pre-seeded fallback artwork resides in `/public/assets/fallbacks/` mapped explicitly by visual style (`Watercolor`, `3D Cartoon`, `Vector Graphic`) and aspect ratio (`1:1`, `16:9`, `4:3`).

### 16.2 Data Retention & Maintenance Strategy
- **Audit Logs**: Retained for **365 days** before automatic archival.
- **Background Jobs**: Completed and failed job records older than **30 days** are purged automatically by `cleanup_maintenance` background worker jobs.
- **Expired Sessions**: Expired session tokens are deleted after **7 days**.
- **Archived Books & Lessons**: Entities marked `archived` are permanently purged after **180 days**.

### 16.3 Seed Data Strategy
Initial setup automatically seeds:
- **Default School District**: `dist-001` ("Springfield Unified School District").
- **Default School & Classroom**: `school-001` ("Springfield Elementary"), `classroom-001` ("3rd Grade Reading", Access Code: `READ2026`).
- **Default Administrative User**: `admin@lectio.edu` (Role: `admin`, `must_change_password: true`).
- **Fallback Visual Assets**: Pre-seeded fallback illustrations in `/public/assets/fallbacks/` for zero-downtime offline image rendering.

---

## 17. Business Logic, Gamification Rules & Retake Safeguards

### 17.1 Quiz Scoring & XP Formula
Student XP rewards are strictly calculated server-side during quiz submission:
```
Base Completion XP = 10 XP
Correct Answer Bonus = 2 XP per correct answer
Perfect Score Bonus = 5 XP (awarded if correct_count == total_questions)

Total XP Earned = Base Completion XP + (Correct Answers * 2) + Perfect Score Bonus
```

### 17.2 Retake Safeguards & XP Farming Protection
- **Retake Policy**: Students may retake quizzes unlimited times for learning mastery.
- **First-Attempt Rule**: XP is awarded ONLY on the student's first attempt for a given lesson plan (`is_first_attempt == true`). Subsequent retakes update the student's highest score percentage, but award **0 additional XP**.
- **Idempotency**: `POST /api/student/quiz-submit` requires an `idempotencyKey` or `attemptId`; duplicate submissions for the same quiz attempt return the cached result without double-awarding XP.

### 17.3 Streak Calculation Logic
- **Streak Window**: Resets at **00:00 UTC**.
- **Activity Increment**: A student's `current_streak_days` increments by 1 ONLY if `last_activity_date < CURRENT_DATE_UTC`.
- **Streak Reset**: If `CURRENT_DATE_UTC - last_activity_date > 1 day`, `current_streak_days` resets to `1`.
- **Daily Cap**: Multiple quizzes completed on the same UTC day record XP but do NOT increment the streak counter multiple times.

### 17.4 Pedagogical QA Thresholds
- **Flesch-Kincaid Grade Level**: Pass status requires the text score to fall within **±1.0 grade levels** of the target grade.
- **Child Safety Screening**: Must return `childSafetyPassed: true` and zero safety flags.
- **Bloom's Cognitive Depth**: Grade 3+ content must achieve at least the 'Applying' or 'Analyzing' cognitive depth level.

### 17.5 AI Context Window Truncation Rules
- **Manuscript Truncation**: When passing manuscript context to `teacher.chat.v1` or `lesson.generate.v1`, text is truncated to a maximum of **2,000 tokens** (approx. 8,000 characters) using semantic paragraph boundary snapping to prevent model context overflow.

### 17.6 Export Processing Engine
- **PDF Export**: Rendered server-side using HTML-to-PDF generation tools (`puppeteer` or printable HTML canvas layout).
- **DOCX Export**: Synthesized server-side using structured template mapping (`docxtemplater` / `docx`).

---

## 18. Data Privacy & Compliance Workflows (Right to be Forgotten & Data Export)

### 18.1 "Right to be Forgotten" Anonymization Workflow
When a student leaves a district or revokes parental consent, executing `POST /api/students/:id/anonymize`:
1. Purges all active session tokens, password reset tokens, and consent records for the student.
2. Anonymizes the student record in `users` by setting `name = 'Anonymized Student'`, `email = NULL`, `pseudonymous_label = 'Anonymized'`, and `status = 'archived'`. (Preserves tombstone row to maintain non-null FK references in historical quiz reports).
3. Purges student streak records and XP ledger entries.
4. Logs an anonymization audit event in `audit_logs`.

### 18.2 District Data Export Compliance Workflow
District administrators can trigger `GET /api/admin/district-export` to generate an encrypted ZIP archive containing structured JSON manifests of all books, lesson plans, QA audit assessments, and aggregate student usage metrics for compliance reviews.

---

## 19. Complete Subsystem Documentation Index

All 22 subsystem module specification files reside in `/docs/` and adhere strictly to the `TEMPLATE_SUBSYSTEM.md` structure:

1. `docs/01-FOUNDATION.md` — Container Infrastructure & Server Binding
2. `docs/02-DATA-SCHEMA.md` — Relational DDL & TypeScript Data Models
3. `docs/03-BOOK-PROCESSING.md` — Book Parsing & Vocabulary Extraction Engine
4. `docs/04-LESSON-AI.md` — Standards-Aligned AI Lesson Generator
5. `docs/05-TEACHER-AI.md` — Contextual Teacher Copilot Engine
6. `docs/06-IMAGE-AI.md` — Storybook Artwork & Visual Asset Synthesis
7. `docs/07-QA-AI.md` — Readability & Child Safety QA Auditor
8. `docs/08-API-SPEC.md` — REST Endpoint Gateway Contracts & Projections
9. `docs/09-CHECKLIST.md` — Operations & Verification Matrix
10. `docs/10-AUTH-ROLES.md` — RBAC Permission, Student PIN & Identity Specification
11. `docs/11-STUDENT-PORTAL.md` — Student Reader & Quiz Portal Specification
12. `docs/12-ADMIN-CONSOLE.md` — District Administration Console & Roster Specification
13. `docs/13-IMAGE-VALIDATION.md` — Image Safety & Asset Resolution Specification
14. `docs/14-TEXT-CHUNKING.md` — Semantic Text Splitter Specification
15. `docs/15-QUIZ-EVALUATOR.md` — Quiz Grading & XP Engine Specification
16. `docs/16-PROMPT-MANAGER.md` — Prompt Governance & System Instruction Catalog
17. `docs/17-QUEUE-WORKERS.md` — Asynchronous Background Processing Pipeline
18. `docs/18-UI-SYSTEM.md` — Global Design System, Component Inventory & Header Telemetry (Covers Subsystems 17 & 18)
19. `docs/19-SPEC-VIEWER.md` — Architecture Document Browser Specification
20. `docs/20-VERIFICATION-OPS.md` — Telemetry & Observability Matrix
21. `docs/21-BUILD-DEPLOY.md` — CI/CD Pipeline & Cloud Run Deployment Guide
22. `docs/22-CHANGE-GOVERNANCE.md` — Requirements Freeze & Governance Rules

---

## 20. Subsystem Document Template Specification (`TEMPLATE_SUBSYSTEM.md`)

Every module documentation file listed in Section 19 MUST be formatted using the following standardized section structure:

```markdown
# Subsystem Module Specification: [SUBSYSTEM_NAME] ([SUBSYSTEM_ID])

## 1. Purpose & Functional Scope
Detailed explanation of module responsibilities and boundaries.

## 2. Component Architecture & Data Flow
Diagram and step-by-step description of internal data transformations.

## 3. Endpoints Owned & REST Contracts
Master list of API endpoints managed by this module.

## 4. Database Schema & Models Owned
Relational tables, TypeScript types, and JSON schemas owned.

## 5. AI Prompts & Gemini Model Integrations
Prompt IDs, target models, system instructions, and schema definitions.

## 6. Forbidden Actions & Security Constraints
Explicit list of prohibited operations and security rules.

## 7. Acceptance Criteria & Definition of Done
Verifiable test criteria required for module sign-off.
```

---

## 21. Traceability Matrix (Sprints 1–6 to Subsystems, Endpoints, Prompts, UI & Tests)

| Sprint Feature | Primary Subsystem | API Endpoint | AI Prompt ID | UI View Component | Verification Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Book Manuscript Processing** | `CORE-BookProcessing` | `POST /api/books/process` | `book.process.v1` | `BookProcessingView.tsx` | Chapter split & vocab unit test |
| **Curricular Lesson Planning** | `AI-LessonGenerator` | `POST /api/lessons/generate` | `lesson.generate.v1` | `LessonAIView.tsx` | Lesson JSON schema test |
| **Student Authentication** | `CORE-Auth` | `POST /api/auth/student-login` | N/A | `AuthModal.tsx` | PIN & Access code auth test |
| **Classroom Roster & Consent** | `CORE-AdminConsole` | `POST /api/admin/consent` | N/A | `AdminUserManagementView.tsx` | Consent status gate test |
| **Quiz Generation & Grading** | `PIPE-QuizEvaluator` | `POST /api/student/quiz-submit` | `lesson.quiz-generate.v1` | `StudentPortalView.tsx` | Server grading & retake XP test |
| **Teacher Copilot & Worksheets** | `AI-TeacherCopilot` | `POST /api/teacher/chat` | `teacher.chat.v1` | `TeacherCopilotView.tsx` | Context injection test |
| **Storybook Artwork Generation**| `AI-ImageGenerator` | `POST /api/images/generate` | `image.generate.v1` | `ImageAIView.tsx` | Fallback asset render test |
| **Readability & Pedagogy QA** | `AI-QAAuditor` | `POST /api/qa/audit` | `qa.readability-audit.v1` | `QAAuditorView.tsx` | Readability formula test |
| **Student Portal & Gamification**| `CORE-StudentPortal` | `GET /api/student/progress` | N/A | `StudentPortalView.tsx` | XP award & streak ledger test |
| **District User Management** | `CORE-AdminConsole` | `GET /api/auth/users` | N/A | `AdminUserManagementView.tsx` | RBAC route guard test |
| **Student Data Anonymization** | `CORE-AdminConsole` | `POST /api/students/:id/anonymize` | N/A | `AdminUserManagementView.tsx` | Right to be Forgotten workflow test |
| **District Data Compliance Export**| `CORE-AdminConsole` | `GET /api/admin/district-export` | N/A | `AdminUserManagementView.tsx` | Compliance archive export test |

---

## 22. Governance, Change Control Protocol & Definition of Done

1. **Requirements Freeze Protocol**: Sprints 1–6 functional scopes are locked. Scope alterations require formal architectural approval.
2. **Single Source of Truth**: `MASTER.md` is supreme. Subsystem documents MUST NOT contradict `MASTER.md`.
3. **Definition of Done (DoD)**:
   - Code compiles cleanly via `tsc --noEmit`.
   - Linter passes cleanly via `npm run lint`.
   - Automated prompt regression tests and API contract verification tests pass.
   - Accessibility tests confirm zero WCAG 2.1 AA violations.
   - Single-command production build (`npm run build`) generates `dist/server.cjs`.
   - Endpoint responses adhere to the standard JSON envelope format.
   - All API keys remain strictly server-side.
