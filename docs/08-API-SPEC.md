---
title: Layer 08 - API Endpoint Specifications
layer: LAYER_08_API
status: APPROVED
version: 2.0.0
last_updated: 2026-08-04
author: API Architecture Group
---

# Layer 08: API Endpoint Specifications

## 1. Overview & General API Standards
This document specifies all REST API endpoints exposed by the Express backend (`server.ts`).

### Universal Response Envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-08-04T12:00:00.000Z"
}
```

---

## 2. System & Telemetry Endpoints

### `GET /api/health`
- **Description**: Returns server execution status, environment mode, and uptime timestamp.
- **Allowed Roles**: All roles / Public.
- **Response**: `{ success: true, data: { status: 'ok', timestamp: string } }`

### `GET /api/stats`
- **Description**: Returns live system telemetry metrics (Total Books, Lessons, QA Audits, Images).
- **Allowed Roles**: `teacher`, `curriculum_lead`, `qa_auditor`, `admin`

---

## 3. Architecture Specification Repository Endpoints

### `GET /api/docs/list`
- **Description**: Returns index of all architecture specification files (`MASTER.md` and `/docs/*.md`).
- **Allowed Roles**: All roles.
- **Response**: Array of `{ id, title, layer, description, filename }`.

### `GET /api/docs/:id`
- **Description**: Fetches raw markdown content for a specified document file.
- **Allowed Roles**: All roles.
- **Response**: `{ id, title, content }`.

---

## 4. Authentication & Identity Endpoints

### `GET /api/auth/me`
- **Description**: Returns active authenticated session user details.
- **Allowed Roles**: All roles.

### `POST /api/auth/login`
- **Description**: Authenticates user or switches role persona.
- **Request Body**: `{ userId?: string, role?: UserRole }`
- **Allowed Roles**: All roles / Public.

### `GET /api/auth/users`
- **Description**: Retrieves system user accounts for district administration.
- **Allowed Roles**: `admin`

### `POST /api/auth/users`
- **Description**: Provisions a new staff account.
- **Request Body**: `{ name: string, email: string, role: UserRole, title?: string, schoolDistrict?: string }`
- **Allowed Roles**: `admin`

---

## 5. Student Portal & Quiz Endpoints

### `GET /api/student/quiz-results`
- **Description**: Fetches historic student quiz performance records.
- **Allowed Roles**: `student`, `teacher`, `admin`

### `POST /api/student/quiz-submit`
- **Description**: Evaluates quiz submission, computes percentage, records attempt, awards XP.
- **Request Body**: `{ lessonId: string, lessonTitle: string, score: number, totalQuestions: number, studentId: string, studentName: string }`
- **Allowed Roles**: `student`, `teacher`, `admin`

---

## 6. Book Processing Engine Endpoints

### `GET /api/books`
- **Description**: Retrieves all processed books from persistent storage.
- **Allowed Roles**: All roles.

### `POST /api/books/process`
- **Description**: Ingests story text and calls Gemini (`gemini-3.6-flash`) to extract chapters, summary, vocabulary, and themes.
- **Request Body**: `{ title: string, author: string, text: string, targetGrade: string }`
- **Allowed Roles**: `curriculum_lead`, `admin`

---

## 7. Lesson Planning Endpoints

### `GET /api/lessons`
- **Description**: Retrieves created lesson plans.
- **Allowed Roles**: All roles.

### `POST /api/lessons/generate`
- **Description**: Generates structured lesson plan and quiz using Gemini (`gemini-3.6-flash`).
- **Request Body**: `{ bookId?: string, topic?: string, gradeLevel: string, durationMinutes: number, focusArea?: string }`
- **Allowed Roles**: `teacher`, `curriculum_lead`, `admin`

---

## 8. Teacher Copilot Endpoints

### `POST /api/teacher/chat`
- **Description**: Submits prompt to Teacher Assistant Copilot.
- **Request Body**: `{ message: string, contextId?: string, history?: Message[] }`
- **Allowed Roles**: `teacher`, `admin`

---

## 9. QA & Safety Audit Endpoints

### `POST /api/qa/audit`
- **Description**: Audits book or lesson for readability, child safety, and Bloom's depth.
- **Request Body**: `{ targetType: 'book' | 'lesson', text: string, targetGrade: string }`
- **Allowed Roles**: `qa_auditor`, `admin`

---

## 10. Image AI Endpoints

### `POST /api/images/generate`
- **Description**: Generates story illustration using Gemini (`gemini-3.1-flash-lite-image`).
- **Request Body**: `{ prompt: string, style: 'Watercolor' | '3D Cartoon' | 'Vector Graphic', aspectRatio: '1:1' | '16:9' | '4:3' }`
- **Allowed Roles**: `teacher`, `curriculum_lead`, `admin`
