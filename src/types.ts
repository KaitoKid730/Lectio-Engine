// Lectio Engine Centralized Domain Types & Interfaces
// MASTER Specification Compliance with Frontend Compatibility

export type UserRole = 'teacher' | 'curriculum_lead' | 'qa_auditor' | 'admin' | 'student';

export type UserStatus = 'invited' | 'active' | 'suspended' | 'deactivated' | 'archived';

export interface User {
  id: string;
  email?: string | null;
  passwordHash?: string | null;
  pinHash?: string | null;
  name: string;
  pseudonymousLabel?: string | null;
  role: UserRole;
  title?: string | null;
  schoolDistrict?: string; // UI compatibility alias
  avatarUrl?: string | null;
  districtId?: string | null;
  status?: UserStatus;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  mustChangePassword?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SchoolDistrict {
  id: string;
  name: string;
  code: string;
  state: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface School {
  id: string;
  districtId: string;
  name: string;
  code: string;
  createdAt?: string | null;
}

export interface Classroom {
  id: string;
  schoolId: string;
  districtId: string;
  name: string;
  gradeLevel: string;
  accessCode: string;
  createdAt?: string | null;
}

export interface StudentEnrollment {
  id: string;
  classroomId: string;
  studentId: string;
  enrolledAt?: string | null;
}

export interface TeacherClassroomAssignment {
  id: string;
  classroomId: string;
  teacherId: string;
  assignedAt?: string | null;
}

export interface Session {
  id: string;
  userId: string;
  role: UserRole;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: string;
  createdAt?: string | null;
}

export interface ConsentRecord {
  id: string;
  studentId: string;
  districtId: string;
  parentGuardianEmailHash: string;
  consentStatus: 'pending' | 'verified' | 'revoked';
  verificationMethod?: 'district_form' | 'email_link' | 'admin_override';
  verifiedAt?: string | null;
}

export interface Chapter {
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
}

export interface VocabularyWord {
  word: string;
  definition: string;
  contextSentence: string;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
}

export type BookStatus = 'draft' | 'processing' | 'processed' | 'needs_review' | 'approved' | 'failed' | 'archived';

export interface Book {
  id: string;
  districtId?: string | null;
  title: string;
  author: string;
  genre?: string;
  targetGrade?: string;
  gradeLevel?: string; // UI compatibility alias
  totalWordCount?: number;
  summary?: string | null;
  chapters: Chapter[];
  vocabulary: VocabularyWord[];
  moralThemes?: string[];
  themes?: string[]; // UI compatibility alias
  status?: BookStatus;
  createdBy?: string | null;
  approvedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface LessonActivity {
  step: number;
  title: string;
  durationMinutes: number;
  instructions: string;
}

export interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correctAnswerIndex?: number;
  explanation?: string;
}

export interface LessonDifferentiation {
  ellScaffolds?: string[];
  iepAccommodations?: string[];
  giftedExtensions?: string[];
}

export type LessonStatus = 'draft' | 'generating' | 'generated' | 'needs_review' | 'approved' | 'published' | 'failed' | 'archived';

export interface LessonPlan {
  id: string;
  sourceBookId?: string | null;
  bookId?: string | null;
  bookTitle?: string | null;
  districtId?: string | null;
  title: string;
  targetGradeLevel?: string;
  targetGrade?: string;
  gradeLevel?: string;
  durationMinutes: number;
  overview?: string;
  agenda?: LessonActivity[];
  learningObjectives: string[];
  timedSteps?: LessonActivity[];
  activities?: LessonActivity[];
  discussionPrompts?: string[];
  discussionQuestions?: string[];
  quizQuestions: QuizQuestion[];
  differentiation?: LessonDifferentiation;
  status?: LessonStatus;
  createdBy?: string | null;
  approvedAt?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TeacherMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  category?: string;
}

export interface QAMetrics {
  vocabularyComplexity: string;
  avgSentenceLength: number;
  bloomsTaxonomyDepth: string;
}

export type QAStatus = 'queued' | 'auditing' | 'passed' | 'failed' | 'needs_review' | 'resolved' | 'archived';

export interface QAAssessment {
  id: string;
  districtId?: string | null;
  targetType: 'book' | 'lesson';
  targetId: string;
  targetTitle?: string;
  targetGrade?: string;
  fleschKincaidScore?: number;
  readabilityScore?: number;
  recommendedGrade: string;
  childSafetyPassed?: boolean;
  safetyPassed?: boolean;
  curriculumAligned?: boolean;
  bloomsTaxonomyDepth?: string;
  metrics: QAMetrics;
  improvementRecommendations?: string[];
  issues?: string[];
  recommendations?: string[];
  safetyFlags?: string[];
  status?: QAStatus;
  auditedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  timestamp?: string;
  complianceScore?: number;
}

export type ImageStatus = 'queued' | 'generating' | 'generated' | 'approved' | 'rejected' | 'failed' | 'archived';

export interface GeneratedImage {
  id: string;
  bookId?: string | null;
  districtId?: string | null;
  prompt: string;
  visualStyle?: 'Watercolor' | '3D Cartoon' | 'Vector Graphic' | string;
  style?: string;
  aspectRatio: '1:1' | '16:9' | '4:3' | string;
  imageUrl: string;
  altText?: string | null;
  status?: ImageStatus;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface QuizAttempt {
  id: string;
  studentId: string;
  lessonId: string;
  attemptNumber: number;
  isFirstAttempt: boolean;
  idempotencyKey?: string | null;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded' | 'failed_validation' | 'completed';
  scorePercentage: number;
  startedAt?: string | null;
  submittedAt?: string | null;
}

export interface StudentQuizResult {
  id: string;
  studentId: string;
  attemptId?: string | null;
  districtId?: string | null;
  studentDisplayName?: string;
  studentName?: string;
  lessonId: string;
  lessonTitle: string;
  scorePercentage?: number;
  score?: number;
  totalQuestions: number;
  correctCount?: number;
  xpEarned?: number;
  submittedAnswers?: number[];
  completedAt?: string | null;
}

export interface XPTransaction {
  id: string;
  studentId: string;
  amount: number;
  reason: string;
  referenceId?: string | null;
  createdAt?: string | null;
}

export interface StreakRecord {
  studentId: string;
  currentStreakDays: number;
  longestStreakDays: number;
  lastActivityDate: string;
  updatedAt?: string | null;
}

export interface ChatConversation {
  id: string;
  teacherId: string;
  contextBookId?: string | null;
  contextLessonId?: string | null;
  title: string;
  createdAt?: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderRole: 'user' | 'assistant';
  content: string;
  createdAt?: string | null;
}

export interface BackgroundJob {
  id: string;
  jobType: 'book_processing' | 'lesson_generation' | 'image_generation' | 'qa_audit' | 'cleanup_maintenance';
  payload: any;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'retrying';
  attempts: number;
  errorMessage?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PromptTemplate {
  promptId: string;
  modelAlias: string;
  systemInstruction: string;
  temperature: number;
  maxTokens: number;
  activeVersion: string;
  createdAt?: string | null;
}

export interface AuditLog {
  id: string;
  actorId?: string | null;
  actorRole: UserRole;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string | null;
  createdAt?: string | null;
}

export interface DocumentationFile {
  id: string;
  title: string;
  layer?: string;
  type?: string;
  description?: string;
  filename?: string;
  path?: string;
  content?: string;
}

export interface SystemStats {
  processedBooks: number;
  generatedLessons: number;
  teacherInteractions?: number;
  qaAuditsPassed: number;
  illustrationsGenerated: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: PaginationMeta;
  timestamp: string;
}
