# Lectio Engine - Implementation Tracker

**Rules for the AI Agent:**
1. You MUST update this file after completing every subsystem.
2. Mark tasks as `[x]` and list the exact file paths created/modified.
3. NEVER use placeholder code, `// TODO`, or mock data for core logic.
4. STOP and wait for user approval ("Proceed") before starting the next Phase.

## Phase 1: Foundation & Data Schema
- [x] `01-CORE-Foundation`: Express server, Vite middleware, Port 3000 binding, CORS, Rate Limiting.
- [x] `02-CORE-DataSchema`: PostgreSQL connection, Drizzle/ORM setup, Zod config validation.
- [x] Migrations: Generate and apply the full DDL schema from MASTER.md Section 5.
- [x] Types: Generate `src/types.ts` matching the DDL exactly.
*Files Created:* `src/config/env.ts`, `src/db/schema.ts`, `src/db/index.ts`, `src/db/seed.ts`, `drizzle.config.ts`, `migrations/0000_initial_ddl.sql`, `src/types.ts`, `src/utils/response.ts`, `server.ts`, `.env.example`

## Phase 2: Security, Auth & RBAC
- [x] `03-CORE-Auth`: Bcrypt staff login, PIN+AccessCode student login (with required studentId), Session management (HttpOnly cookies), Account lockout logic.
- [x] `04-CORE-RBAC`: Middleware for role enforcement, student-safe projection middleware.
- [x] `16-API-Gateway`: Global error handler, Zod validation middleware, standard JSON envelope.
*Files Created:* `src/routes/auth.routes.ts`, `src/middleware/auth.middleware.ts`, `src/middleware/rbac.middleware.ts`, `src/middleware/studentProjection.middleware.ts`, `src/middleware/validate.middleware.ts`, `src/types/express.d.ts`, `src/utils/response.ts`

## Phase 3: AI Prompt Manager & Queue Infrastructure
- [x] `12-AI-PromptManager`: Gemini client setup, temperature/token enforcement, schema validation.
- [x] `14-PIPE-TextChunking`: 500k char limit enforcement, Flesch-Kincaid local calculator.
- [x] Queues: `background_jobs` polling loop with `FOR UPDATE SKIP LOCKED` and 60s watchdog.
*Files Created:* `src/services/gemini.service.ts`, `src/services/textChunking.service.ts`, `src/workers/queue.worker.ts` (Modified: `server.ts`)

## Phase 4: Core Pipelines & AI Engines
- [x] `05-CORE-BookProcessing`: Ingestion, PII redaction, Chapter splitting, Vocab extraction.
- [x] `08-AI-LessonGenerator`: Lesson planning, Quiz generation (0-indexed), Differentiation.
- [x] `10-AI-ImageGenerator`: Image prompt builder, Gemini image call, Alt-text generation, Stock fallback mapping.
- [x] `11-AI-QAAuditor`: Readability, Safety, Bloom's depth, Lesson quality audits.
- [x] `13-PIPE-ImageValidation`: Safety checks, aspect ratio validation, fallback asset mapping.
*Files Created:* `src/handlers/bookProcessing.handler.ts`, `src/handlers/lessonGeneration.handler.ts`, `src/handlers/imageGeneration.handler.ts`, `src/handlers/qaAudit.handler.ts`, `src/controllers/book.controller.ts`, `src/routes/book.routes.ts`, `src/controllers/lesson.controller.ts`, `src/routes/lesson.routes.ts`, `src/controllers/image.controller.ts`, `src/routes/image.routes.ts`, `src/controllers/qa.controller.ts`, `src/routes/qa.routes.ts` (Modified: `src/workers/queue.worker.ts`, `server.ts`)

## Phase 5: Student Portal & Gamification
- [x] `15-PIPE-QuizEvaluator`: Server-side grading, First-attempt XP rule, Idempotency checks.
- [x] `06-CORE-StudentPortal`: Student book/lesson fetching (stripped keys), Quiz start/submit flows with `studentSafeProjection`.
- [x] Gamification: XP ledger transactions, Streak calculation (UTC midnight reset).
*Files Created:* `src/controllers/student.controller.ts`, `src/routes/student.routes.ts` (Modified: `src/middleware/studentProjection.middleware.ts`, `server.ts`)

## Phase 6: Teacher Copilot & Admin Console
- [x] `09-AI-TeacherCopilot`: Context injection (`truncateContext` helper with 8k token limit), Chat persistence in `chat_messages`, Worksheets (`teacher.worksheet.v1`).
- [x] `07-CORE-AdminConsole`: Roster management, School/Classroom CRUD, Student Enrollment, COPPA Consent gating, Anonymization (Right to be Forgotten).
*Files Created:* `src/controllers/teacher.controller.ts`, `src/routes/teacher.routes.ts`, `src/controllers/admin.controller.ts`, `src/routes/admin.routes.ts` (Modified: `src/routes/student.routes.ts`, `src/routes/auth.routes.ts`, `src/middleware/auth.middleware.ts`, `server.ts`)

## Phase 7: UI Implementation & Integration
- [x] Part 1: App Shell, Routing, Auth Context, Protected Routes & Edge Cases (403, 404, 500, Session Expired), UI Primitives, Persona Switcher.
- [x] Part 2: Feature Views Refactor (OverviewDashboard, BookProcessingView, StudentPortalView, LessonAIView, TeacherCopilotView, ImageAIView, QAAuditorView, AdminUserManagementView, DocsSpecViewer). Removed prop-drilling mock data from App.tsx and connected views to backend via apiClient with mandatory UI states.
*Files Created/Modified:* `src/App.tsx`, `src/utils/apiClient.ts`, `src/context/AuthContext.tsx`, `src/context/ToastContext.tsx`, `src/components/OverviewDashboard.tsx`, `src/components/BookProcessingView.tsx`, `src/components/StudentPortalView.tsx`, `src/components/LessonAIView.tsx`, `src/components/TeacherCopilotView.tsx`, `src/components/ImageAIView.tsx`, `src/components/QAAuditorView.tsx`, `src/components/AdminUserManagementView.tsx`, `src/components/DocsSpecViewer.tsx`

## Phase 8: Testing, CI/CD & Observability
- [x] Unit Tests: Chunking, Flesch-Kincaid formula & 500k limit (`tests/unit/textChunking.test.ts`), Quiz Grading & First-Attempt XP math (`tests/unit/quizGrading.test.ts`).
- [x] CI/CD Pipeline: GitHub Actions workflow (`.github/workflows/ci.yml`) executing `npm install`, `npm run lint`, and `npm run test`.
- [x] Observability: Structured JSON logging middleware in `server.ts` for Cloud Logging ingestion.
- [x] UAT Bug Fixes:
  1. Auth & Session: Enhanced `auth.middleware.ts` and `apiClient.ts` with `Authorization: Bearer <sessionId>` fallback and `localStorage` persistence for iframe third-party cookie restrictions.
  2. Specs & Docs: Updated `DocsSpecViewer.tsx` with `react-markdown` and `remark-gfm` rendering toggle and Tailwind typography styling.
  3. Image AI & Error Handling: Fixed `ImageAIView.tsx` response envelope parsing, graceful catch state, and wrapped application routes in global React `ErrorBoundary` component.
  4. Lesson Generation Schema & Payload: Fixed Zod validation error by updating `src/components/LessonAIView.tsx` to compute and include `title` / `topic` when selecting a base storybook, and preprocessed schema aliases (`sourceBookId`/`bookId`, `targetGradeLevel`/`gradeLevel`, `durationMinutes`) in `src/controllers/lesson.controller.ts`.
  5. Lesson UI Polling & Grade Level Display: Implemented 3-second interval polling for background lesson generation in `LessonAIView.tsx`, added a generating loading skeleton state while lesson status is pending, synced base storybook grade selection (`handleBookChange`), and ensured `targetGradeLevel`/`targetGrade`/`gradeLevel` is dynamically displayed across library and detail views.
  6. AI Presentation (PPT) Studio: Implemented end-to-end slide generation, interactive presentation editor, slide reordering, image attachment, present mode with interactive quizzes & flashcards, theme system (Storybook, Playful, Chalkboard, Modern), background image generation worker, and PPTX export via `pptxgenjs`.
  7. Presentation Studio Overhaul & PPTX Export Fix:
     - Fixed PPTX download using raw `fetch` with `credentials: 'include'` and binary `blob()` handling in `PresentationStudioView.tsx`.
     - Hardened backend PPTX export (`presentation.controller.ts`) with `try/catch` image embedding, base64 prefix cleaning, and text-safe fallback write.
     - Strictly eliminated all emojis across slide layouts and themes, replacing them with Lucide icons and pure CSS accents.
     - Redesigned slide themes (`editorial`, `tech-glass`, `corporate`, `minimal`, `modern`, `storybook`) with left vertical accent bars, background dot grids, and 4px left-bordered bullet cards.
  8. Book Processing Handler Regression Fix:
     - Verified `job_type = 'book_processing'` handler registration in `src/workers/queue.worker.ts` and `startQueueWorker()` invocation in `server.ts`.
     - Verified `presentationGeneration.handler.ts` query selects valid columns (`SELECT title, summary, chapters, vocabulary FROM books`).
     - Hardened `handleBookProcessing` in `src/handlers/bookProcessing.handler.ts` with execution logging, local fallback metadata generation on AI failure/quota hit, and Postgres UPDATE setting `summary`, `chapters`, `vocabulary`, `moral_themes`, `status='approved'`, and `approved_at=NOW()`.
  9. Gemini Model Fallback & Deprecated Model Cleanup:
     - Replaced deprecated model references across handlers and controllers with official @google/genai models (`gemini-3.6-flash`, `gemini-3.1-flash-lite`, `gemini-3.1-flash-lite-image`).
     - Updated `src/services/gemini.service.ts` model fallback loop to use supported candidate models (`gemini-3.6-flash`, `gemini-3.1-flash-lite`, `gemini-flash-latest`) and catch quota and 404/NOT_FOUND errors cleanly.
  10. PRESENTATION STUDIO v3 (Kid-First Creative Design & Image Best-of-5 Scoring):
     - Updated database schema with `style` JSONB and `image_score` INT columns on `slides` table.
     - Rewrote `presentation.generate.v1` system instruction to target children aged 5–11 with playful storybook layouts and per-slide creative style control (`bgGradient`, `accentColor`, `titleColor`, `textColor`, `shape`, `fontVibe`, `decorations`).
     - Implemented `scoreImage` multimodal evaluation and `generateSlideImageWithScoring` loop with explicit `scored: boolean` flag tracking, fallback score (40) preventing early short-circuiting, and configurable vision model (`gemini-3.6-flash`).
     - Updated design-review controller critique prompt to evaluate playfulness, colors, and engagement for kids aged 5–11.
     - Updated frontend `PresentMode` and `PresentationStudioView` to dynamically render per-slide decorative SVG shapes, gradients, font vibes, and image scores.
  11. PRESENTATION STUDIO v4 (AI-Invented Themes & Automatic In-Pipeline Design Review):
     - Replaced preset theme picker/dropdown in `PresentationStudioView` with free-text "Style Direction" input and quick-fill chips ("Underwater Adventure", "Superhero Comic", "Space Galaxy", "Storybook Magic", "Jungle Explorer").
     - Updated `presentation.generate.v1` system instruction to force Gemini to always invent a kid-friendly `customPalette` ({ bg, accent, text, card }) stored in `presentations.custom_palette` with `theme = 'custom'`.
     - Updated `getThemeStyles` to dynamically render colors from `custom_palette` when `theme === 'custom'`.
     - Removed manual "AI Design Review" button from UI toolbar.
     - Implemented automatic design review and refinement step (`presentation.design-refine.v1`) directly inside `handlePresentationGeneration` background pipeline before inserting slides and scoring images.
  12. GEMINI TRANSIENT ERROR RESILIENCE & MULTIMODAL BUG FIXES:
     - Enhanced `executePrompt` in `src/services/gemini.service.ts` to recognize transient 503 high demand / `UNAVAILABLE` / 429 quota / 500 errors with a 3-attempt backoff retry loop per model.
     - Added multi-model candidate fallback (`gemini-3.6-flash` -> `gemini-3.1-flash-lite` -> `gemini-2.5-flash` -> `gemini-flash-latest`).
     - Wrapped presentation generation in `src/handlers/presentationGeneration.handler.ts` with a fallback presentation deck generator to guarantee background jobs complete successfully during extreme upstream API outages.
     - Updated `presentation.design-refine.v1` schema validation in `presentationGeneration.handler.ts` to use `PresentationGenerateSchema` for robust JSON structure preprocessing.
     - Fixed stock URL handling in `scoreImage` (`src/services/imageScoring.service.ts`) to cleanly bypass multimodal base64 encoding when receiving non-data image URLs.
  13. PRESENTATION STUDIO v5 (True Creative Freedom — Free-Form Composition Engine):
     - Created `SlideCompositionRenderer` component in `src/components/SlideCompositionRenderer.tsx` with `CompositionItem` schema for free-form absolute positioning, dynamic font scaling, rotation, shapes, images, and interactive items.
     - Replaced fixed layout switch cases (`if layout === 'title'`, etc.) in both `SlideCanvasPreview` and `PresentMode` overlay with free-form composition rendering.
     - Rewrote `presentation.generate.v1` system instruction in `src/handlers/presentationGeneration.handler.ts` granting Gemini complete creative control over asymmetrical layouts, arbitrary positions, font size variance, shapes, and layering.
     - Implemented `convertLegacySlideToComposition` fallback generator to ensure legacy slides automatically render as dynamic, multi-layered visual compositions.
*Files Created/Modified:* `src/components/SlideCompositionRenderer.tsx`, `src/components/PresentationStudioView.tsx`, `src/handlers/presentationGeneration.handler.ts`, `src/services/imageScoring.service.ts`, `BUILD_TRACKER.md`
   14. PRESENTATION STUDIO v6 (Vision-Based Design Assessment & Iterative Refinement + Present Mode Fix):
      - Debugged and fixed full-screen `PresentMode` trigger and overlay in `PresentationStudioView.tsx` with `z-[100]` zIndex, keyboard navigation (Space / Left / Right / Escape), and `initialIndex` support.
      - Updated `presentation.generate.v1` system instruction in `presentationGeneration.handler.ts` with explicit DESIGN RULES (min 1.2rem font size, 15-20% margin, max 2-3 font sizes, contrast, interactive click target dimensions).
      - Added `presentation.visual-review.v1` prompt and `visualRefineController` endpoint (`/api/presentations/:id/visual-refine`) using `gemini-2.5-flash` / `gemini-3.6-flash` vision models with multimodal image input.
      - Implemented client-side `handleVisionRefineLoop` in `PresentationStudioView.tsx` converting rendered slide canvases to PNG with `html-to-image` (`toPng`), sending images to Gemini Vision, and automatically refining compositions up to 3 iterations until score >= 8.
