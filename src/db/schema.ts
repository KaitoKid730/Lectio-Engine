import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  jsonb,
  date,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Helper for default UUID v4 as text
const uuidDefault = sql`gen_random_uuid()::text`;

// 1. School Districts Table
export const schoolDistricts = pgTable('school_districts', {
  id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 32 }).unique().notNull(),
  state: varchar('state', { length: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 2. Schools Table
export const schools = pgTable('schools', {
  id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
  districtId: varchar('district_id', { length: 64 })
    .notNull()
    .references(() => schoolDistricts.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 32 }).unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 3. Classrooms Table
export const classrooms = pgTable('classrooms', {
  id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
  schoolId: varchar('school_id', { length: 64 })
    .notNull()
    .references(() => schools.id, { onDelete: 'cascade' }),
  districtId: varchar('district_id', { length: 64 })
    .notNull()
    .references(() => schoolDistricts.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  gradeLevel: varchar('grade_level', { length: 32 }).notNull(),
  accessCode: varchar('access_code', { length: 32 }).unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 4. Users Table
export const users = pgTable(
  'users',
  {
    id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
    email: varchar('email', { length: 255 }).unique(),
    passwordHash: varchar('password_hash', { length: 255 }),
    pinHash: varchar('pin_hash', { length: 255 }),
    name: varchar('name', { length: 255 }).notNull(),
    pseudonymousLabel: varchar('pseudonymous_label', { length: 128 }),
    role: varchar('role', { length: 32 }).notNull(),
    title: varchar('title', { length: 128 }),
    avatarUrl: text('avatar_url'),
    districtId: varchar('district_id', { length: 64 }).references(() => schoolDistricts.id, { onDelete: 'set null' }),
    status: varchar('status', { length: 32 }).notNull().default('active'),
    failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    mustChangePassword: boolean('must_change_password').notNull().default(false),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
    districtIdx: index('idx_users_district').on(table.districtId),
  })
);

// 5. Classroom Enrollments Table
export const studentEnrollments = pgTable(
  'student_enrollments',
  {
    id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
    classroomId: varchar('classroom_id', { length: 64 })
      .notNull()
      .references(() => classrooms.id, { onDelete: 'cascade' }),
    studentId: varchar('student_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    unq: unique().on(table.classroomId, table.studentId),
  })
);

// 6. Teacher Classroom Assignments Table
export const teacherClassroomAssignments = pgTable(
  'teacher_classroom_assignments',
  {
    id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
    classroomId: varchar('classroom_id', { length: 64 })
      .notNull()
      .references(() => classrooms.id, { onDelete: 'cascade' }),
    teacherId: varchar('teacher_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    unq: unique().on(table.classroomId, table.teacherId),
  })
);

// 7. Sessions Table
export const sessions = pgTable(
  'sessions',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    userId: varchar('user_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 32 }).notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    expiresIdx: index('idx_sessions_expires_at').on(table.expiresAt),
  })
);

// 8. Password Reset Tokens Table
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: varchar('id', { length: 128 }).primaryKey(),
  userId: varchar('user_id', { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 9. Parental Consent Records Table
export const consentRecords = pgTable(
  'consent_records',
  {
    id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
    studentId: varchar('student_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    districtId: varchar('district_id', { length: 64 })
      .notNull()
      .references(() => schoolDistricts.id, { onDelete: 'cascade' }),
    parentGuardianEmailHash: varchar('parent_guardian_email_hash', { length: 255 }).notNull(),
    consentStatus: varchar('consent_status', { length: 32 }).notNull().default('pending'),
    verificationMethod: varchar('verification_method', { length: 64 }).default('district_form'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
  },
  (table) => ({
    studentIdx: index('idx_consent_records_student').on(table.studentId),
  })
);

// 10. Books Table
export const books = pgTable(
  'books',
  {
    id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
    districtId: varchar('district_id', { length: 64 }).references(() => schoolDistricts.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    author: varchar('author', { length: 255 }).notNull(),
    targetGrade: varchar('target_grade', { length: 32 }).notNull(),
    totalWordCount: integer('total_word_count').notNull().default(0),
    summary: text('summary'),
    chapters: jsonb('chapters').notNull().default(sql`'[]'::jsonb`),
    vocabulary: jsonb('vocabulary').notNull().default(sql`'[]'::jsonb`),
    moralThemes: jsonb('moral_themes').notNull().default(sql`'[]'::jsonb`),
    status: varchar('status', { length: 32 }).notNull().default('draft'),
    createdBy: varchar('created_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    districtIdx: index('idx_books_district').on(table.districtId),
    statusIdx: index('idx_books_status').on(table.status),
  })
);

// 11. Lesson Plans Table
export const lessonPlans = pgTable(
  'lesson_plans',
  {
    id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
    sourceBookId: varchar('source_book_id', { length: 64 }).references(() => books.id, { onDelete: 'cascade' }),
    districtId: varchar('district_id', { length: 64 }).references(() => schoolDistricts.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    targetGradeLevel: varchar('target_grade_level', { length: 32 }).notNull(),
    durationMinutes: integer('duration_minutes').notNull().default(45),
    learningObjectives: jsonb('learning_objectives').notNull().default(sql`'[]'::jsonb`),
    timedSteps: jsonb('timed_steps').notNull().default(sql`'[]'::jsonb`),
    discussionPrompts: jsonb('discussion_prompts').notNull().default(sql`'[]'::jsonb`),
    quizQuestions: jsonb('quiz_questions').notNull().default(sql`'[]'::jsonb`),
    differentiation: jsonb('differentiation').default(sql`'{}'::jsonb`),
    status: varchar('status', { length: 32 }).notNull().default('draft'),
    createdBy: varchar('created_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    bookIdx: index('idx_lesson_plans_book').on(table.sourceBookId),
    districtIdx: index('idx_lesson_plans_district').on(table.districtId),
    statusIdx: index('idx_lesson_plans_status').on(table.status),
  })
);

// 12. QA Assessments Table
export const qaAssessments = pgTable(
  'qa_assessments',
  {
    id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
    districtId: varchar('district_id', { length: 64 }).references(() => schoolDistricts.id, { onDelete: 'cascade' }),
    targetType: varchar('target_type', { length: 32 }).notNull(),
    targetId: varchar('target_id', { length: 64 }).notNull(),
    fleschKincaidScore: numeric('flesch_kincaid_score', { precision: 5, scale: 2 }).notNull(),
    recommendedGrade: varchar('recommended_grade', { length: 32 }).notNull(),
    childSafetyPassed: boolean('child_safety_passed').notNull().default(true),
    bloomsTaxonomyDepth: varchar('blooms_taxonomy_depth', { length: 64 }).notNull(),
    improvementRecommendations: jsonb('improvement_recommendations').notNull().default(sql`'[]'::jsonb`),
    status: varchar('status', { length: 32 }).notNull().default('queued'),
    auditedBy: varchar('audited_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    targetIdx: index('idx_qa_assessments_target').on(table.targetId, table.targetType),
  })
);

// 13. Generated Images Table
export const generatedImages = pgTable(
  'generated_images',
  {
    id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
    bookId: varchar('book_id', { length: 64 }).references(() => books.id, { onDelete: 'set null' }),
    districtId: varchar('district_id', { length: 64 }).references(() => schoolDistricts.id, { onDelete: 'cascade' }),
    prompt: text('prompt').notNull(),
    visualStyle: varchar('visual_style', { length: 64 }).notNull(),
    aspectRatio: varchar('aspect_ratio', { length: 16 }).notNull(),
    imageUrl: text('image_url').notNull(),
    altText: text('alt_text'),
    status: varchar('status', { length: 32 }).notNull().default('queued'),
    createdBy: varchar('created_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    bookIdx: index('idx_generated_images_book').on(table.bookId),
  })
);

// 14. Student Quiz Attempts Table
export const quizAttempts = pgTable(
  'quiz_attempts',
  {
    id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
    studentId: varchar('student_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: varchar('lesson_id', { length: 64 })
      .notNull()
      .references(() => lessonPlans.id, { onDelete: 'cascade' }),
    attemptNumber: integer('attempt_number').notNull().default(1),
    isFirstAttempt: boolean('is_first_attempt').notNull().default(true),
    idempotencyKey: varchar('idempotency_key', { length: 128 }).unique(),
    status: varchar('status', { length: 32 }).notNull().default('in_progress'),
    scorePercentage: numeric('score_percentage', { precision: 5, scale: 2 }).default('0.0'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
  },
  (table) => ({
    studentLessonIdx: index('idx_quiz_attempts_student_lesson').on(table.studentId, table.lessonId),
  })
);

// 15. Student Quiz Results Table
export const studentQuizResults = pgTable(
  'student_quiz_results',
  {
    id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
    studentId: varchar('student_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    attemptId: varchar('attempt_id', { length: 64 }).references(() => quizAttempts.id, { onDelete: 'set null' }),
    districtId: varchar('district_id', { length: 64 }).references(() => schoolDistricts.id, { onDelete: 'cascade' }),
    studentDisplayName: varchar('student_display_name', { length: 128 }).notNull(),
    lessonId: varchar('lesson_id', { length: 64 })
      .notNull()
      .references(() => lessonPlans.id, { onDelete: 'cascade' }),
    lessonTitle: varchar('lesson_title', { length: 255 }).notNull(),
    scorePercentage: numeric('score_percentage', { precision: 5, scale: 2 }).notNull(),
    totalQuestions: integer('total_questions').notNull(),
    correctCount: integer('correct_count').notNull(),
    xpEarned: integer('xp_earned').notNull().default(0),
    submittedAnswers: jsonb('submitted_answers').notNull().default(sql`'[]'::jsonb`),
    completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    studentIdx: index('idx_quiz_results_student').on(table.studentId),
    districtIdx: index('idx_quiz_results_district').on(table.districtId),
  })
);

// 16. XP Transactions Ledger Table
export const xpTransactions = pgTable(
  'xp_transactions',
  {
    id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
    studentId: varchar('student_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    reason: varchar('reason', { length: 128 }).notNull(),
    referenceId: varchar('reference_id', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    studentIdx: index('idx_xp_transactions_student').on(table.studentId),
  })
);

// 17. Student Streak Records Table
export const streakRecords = pgTable('streak_records', {
  studentId: varchar('student_id', { length: 64 })
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  currentStreakDays: integer('current_streak_days').notNull().default(0),
  longestStreakDays: integer('longest_streak_days').notNull().default(0),
  lastActivityDate: date('last_activity_date').defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 18. Teacher Chat Conversations Table
export const chatConversations = pgTable(
  'chat_conversations',
  {
    id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
    teacherId: varchar('teacher_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    contextBookId: varchar('context_book_id', { length: 64 }).references(() => books.id, { onDelete: 'set null' }),
    contextLessonId: varchar('context_lesson_id', { length: 64 }).references(() => lessonPlans.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull().default('Instructional Assistance'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    teacherIdx: index('idx_chat_conversations_teacher').on(table.teacherId),
  })
);

// 19. Teacher Chat Messages Table
export const chatMessages = pgTable(
  'chat_messages',
  {
    id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
    conversationId: varchar('conversation_id', { length: 64 })
      .notNull()
      .references(() => chatConversations.id, { onDelete: 'cascade' }),
    senderRole: varchar('sender_role', { length: 32 }).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    conversationIdx: index('idx_chat_messages_conversation').on(table.conversationId),
  })
);

// 20. Background Processing Jobs Table
export const backgroundJobs = pgTable(
  'background_jobs',
  {
    id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
    jobType: varchar('job_type', { length: 64 }).notNull(),
    payload: jsonb('payload').notNull(),
    status: varchar('status', { length: 32 }).notNull().default('queued'),
    attempts: integer('attempts').notNull().default(0),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    statusIdx: index('idx_background_jobs_status').on(table.status),
  })
);

// 21. Prompt Templates Table
export const promptTemplates = pgTable('prompt_templates', {
  promptId: varchar('prompt_id', { length: 128 }).primaryKey(),
  modelAlias: varchar('model_alias', { length: 64 }).notNull(),
  systemInstruction: text('system_instruction').notNull(),
  temperature: numeric('temperature', { precision: 3, scale: 2 }).notNull(),
  maxTokens: integer('max_tokens').notNull(),
  activeVersion: varchar('active_version', { length: 32 }).notNull().default('v1'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 22. Audit Logs Table
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
    actorId: varchar('actor_id', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
    actorRole: varchar('actor_role', { length: 32 }).notNull(),
    action: varchar('action', { length: 128 }).notNull(),
    resourceType: varchar('resource_type', { length: 64 }).notNull(),
    resourceId: varchar('resource_id', { length: 64 }),
    details: jsonb('details').default(sql`'{}'::jsonb`),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    actorIdx: index('idx_audit_logs_actor').on(table.actorId),
    createdAtIdx: index('idx_audit_logs_created_at').on(table.createdAt),
  })
);

// 23. Presentations Table
export const presentations = pgTable(
  'presentations',
  {
    id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
    title: text('title').notNull(),
    sourceBookId: varchar('source_book_id', { length: 64 }).references(() => books.id, { onDelete: 'set null' }),
    sourceLessonId: varchar('source_lesson_id', { length: 64 }).references(() => lessonPlans.id, { onDelete: 'set null' }),
    theme: varchar('theme', { length: 64 }).notNull().default('modern'),
    designBrief: text('design_brief'),
    customPalette: jsonb('custom_palette'),
    designReview: jsonb('design_review'),
    status: varchar('status', { length: 32 }).notNull().default('draft'),
    createdBy: varchar('created_by', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
    districtId: varchar('district_id', { length: 64 }).references(() => schoolDistricts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    districtIdx: index('idx_presentations_district').on(table.districtId),
  })
);

// 24. Slides Table
export const slides = pgTable(
  'slides',
  {
    id: varchar('id', { length: 64 }).primaryKey().default(uuidDefault),
    presentationId: varchar('presentation_id', { length: 64 })
      .notNull()
      .references(() => presentations.id, { onDelete: 'cascade' }),
    slideOrder: integer('slide_order').notNull(),
    layout: varchar('layout', { length: 32 }).notNull(),
    title: text('title'),
    bullets: jsonb('bullets').default(sql`'[]'::jsonb`),
    speakerNotes: text('speaker_notes'),
    imageUrl: text('image_url'),
    activity: jsonb('activity'),
    style: jsonb('style').default(sql`'{}'::jsonb`),
    imageScore: integer('image_score'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    presentationIdx: index('idx_slides_presentation').on(table.presentationId),
  })
);
