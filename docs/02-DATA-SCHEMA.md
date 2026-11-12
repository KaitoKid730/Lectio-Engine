---
title: Layer 02 - Data Architecture & ER Schema
layer: LAYER_02_DATA
status: APPROVED
version: 2.0.0
last_updated: 2026-08-04
author: Data Engineering Lead
---

# Layer 02: Data Architecture & ER Schema

## 1. Overview
This module details the relational data model, domain entity TypeScript declarations (`src/types.ts`), index design, operational state machines, and persistent JSON schemas for storybooks, lesson plans, QA audits, teacher chats, student quiz results, and generated images.

---

## 2. Entity Relationship Diagram (ERD)

```
  +------------------+           +----------------------+          +-----------------------+
  |      USERS       |           |        BOOKS         | 1      * |     LESSON_PLANS      |
  |------------------|           |----------------------|----------|-----------------------|
  | id (PK)          |           | id (PK)              |          | id (PK)               |
  | email            |           | title                |          | book_id (FK)          |
  | name             |           | author               |          | grade_level           |
  | role             |           | target_grade         |          | learning_objectives   |
  | district         |           | chapters (JSON)      |          | timed_steps (JSON)    |
  +------------------+           | vocabulary (JSON)    |          | quiz_questions (JSON) |
           |                     +----------------------+          +-----------------------+
           |                                |                                 |
           | 1                              | 1                               | 1
           |                                |                                 |
           v *                              v *                               v *
  +------------------+           +----------------------+          +-----------------------+
  |  QUIZ_RESULTS    |           |      QA_AUDITS       |          |   GENERATED_IMAGES    |
  |------------------|           |----------------------|          |-----------------------|
  | id (PK)          |           | id (PK)              |          | id (PK)               |
  | student_id (FK)  |           | target_id (FK)       |          | book_id (FK)          |
  | lesson_id (FK)   |           | target_type          |          | prompt                |
  | score_percent    |           | flesh_kincaid_score  |          | visual_style          |
  | xp_earned        |           | safety_passed        |          | aspect_ratio          |
  +------------------+           +----------------------+          +-----------------------+
```

---

## 3. Comprehensive Domain Entities (`src/types.ts`)

### Entity: `User`
```typescript
export type UserRole = 'teacher' | 'curriculum_lead' | 'qa_auditor' | 'admin' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  title?: string;
  schoolDistrict?: string;
  status: 'active' | 'invited' | 'suspended';
}
```

### Entity: `Book`
```typescript
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
  difficulty: 'Elementary' | 'Intermediate' | 'Advanced';
}

export interface Book {
  id: string;
  title: string;
  author: string;
  targetGrade: string;
  totalWordCount: number;
  summary: string;
  chapters: Chapter[];
  vocabulary: VocabularyWord[];
  moralThemes: string[];
  status: 'draft' | 'processing' | 'processed' | 'needs_review' | 'approved';
  createdAt: string;
}
```

### Entity: `LessonPlan`
```typescript
export interface TimedStep {
  stepNumber: number;
  title: string;
  durationMinutes: number;
  instructions: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface LessonPlan {
  id: string;
  sourceBookId: string;
  title: string;
  targetGradeLevel: string;
  durationMinutes: number;
  learningObjectives: string[];
  timedSteps: TimedStep[];
  discussionPrompts: string[];
  quizQuestions: QuizQuestion[];
  status: 'draft' | 'generating' | 'generated' | 'approved' | 'published';
  createdAt: string;
}
```

### Entity: `QAAssessment`
```typescript
export interface QAAssessment {
  id: string;
  targetType: 'book' | 'lesson';
  targetId: string;
  fleschKincaidScore: number;
  recommendedGrade: string;
  childSafetyPassed: boolean;
  bloomsTaxonomyDepth: string;
  improvementRecommendations: string[];
  status: 'queued' | 'auditing' | 'passed' | 'failed';
  createdAt: string;
}
```

### Entity: `GeneratedImage`
```typescript
export interface GeneratedImage {
  id: string;
  prompt: string;
  visualStyle: 'Watercolor' | '3D Cartoon' | 'Vector Graphic';
  aspectRatio: '1:1' | '16:9' | '4:3';
  imageUrl: string;
  status: 'queued' | 'generating' | 'generated' | 'approved';
  createdAt: string;
}
```

### Entity: `StudentQuizResult`
```typescript
export interface StudentQuizResult {
  id: string;
  studentId: string;
  studentName: string;
  lessonId: string;
  lessonTitle: string;
  scorePercentage: number;
  totalQuestions: number;
  correctCount: number;
  xpEarned: number;
  completedAt: string;
}
```

---

## 4. Operational State Machines

```
Book Lifecycle:     [draft] -> [processing] -> [processed] -> [needs_review] -> [approved]
Lesson Lifecycle:   [draft] -> [generating] -> [generated] -> [needs_review] -> [approved] -> [published]
Image Lifecycle:    [queued] -> [generating] -> [generated] -> [approved] / [rejected]
QA Audit Lifecycle: [queued] -> [auditing] -> [passed] / [failed] -> [resolved]
Quiz Lifecycle:     [not_started] -> [in_progress] -> [submitted] -> [graded]
User Lifecycle:     [invited] -> [active] -> [suspended] -> [deactivated]
```

---

## 5. Storage & COPPA/FERPA Data Privacy Rules
- **Data Retention**: Persistent state is maintained in `server.ts` memory store, backed by seed structures and syncable to persistent storage.
- **COPPA Student Privacy**: Student IDs are pseudonymous (`student-101`), zero PII stored for children under 13.
- **FERPA Compliance**: School quiz records are indexed by district and restricted to authorized school staff accounts.
