# Lectio Engine

> A full-stack AI lesson-planning platform: ingest children's storybooks, generate standards-aligned lesson plans and slide presentations, and run a privacy-conscious student portal.

[![React 19](https://img.shields.io/badge/React-19.0.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Backend-Express%204-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini API](https://img.shields.io/badge/AI-Google%20Gemini%202.5-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle%20ORM-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Status:** portfolio project / working prototype. Runs locally; not deployed (it needs a Node backend and a Gemini API key). See [Status & Limitations](#status--limitations).

---

## Demo

<img width="1366" height="722" alt="image" src="https://github.com/user-attachments/assets/cf40885c-a658-49a2-9aff-58bbd9e4e9ae" />

---

## Overview

Lectio Engine connects children's literature, curriculum standards and classroom presentation in one app. Teachers, curriculum leads and administrators can upload a manuscript or storybook and generate:

- **Standards-aligned lesson plans** (Common Core, NGSS, differentiated instruction tiers)
- **Slide presentations** with motion presets, vocabulary flashcards, quizzes and `.pptx` export
- **Teacher Copilot** suggestions for scaffolding questions, discussion hooks and misconception handling
- **Curriculum QA reports** covering age-appropriateness, vocabulary load and content safety
- **Scene and character illustrations** via Gemini image generation
- **A student portal** built around pseudonymous accounts and classroom access codes, with no personal information stored

---

## Key Features

### 1. Presentation Studio
- **Component-driven slide library:** `HeroTitle`, `SplitScreen`, `CardGrid`, `Quote`, `InteractiveQuiz`, `Flashcard`, `ImageWithOverlay`, `Timeline`, `Comparison`, `DiscussionPrompt`.
- **Motion presets:** `Fade`, `Pop`, `Slide`, `Zoom`, `Bounce`, `Reveal`, `Wipe`, with timing controls.
- **Theming:** gradients, SVG shapes (`wave`, `blob`, `starburst`, `cloud`) and custom branding.
- **Fullscreen presentation mode:** a teacher-side overlay for projecting slides in class, including flip flashcards and multiple-choice quizzes.
- **PowerPoint export (`.pptx`):** client-side download using `pptxgenjs`.
- **AI design reviewer:** checks typography hierarchy, contrast and content density against the design brief.

### 2. Storybook Ingestion
- Upload and parse manuscripts.
- Estimated readability scoring (Flesch-Kincaid and grade-level estimation).
- Tiered vocabulary extraction (Tier 1, Tier 2 academic, Tier 3 domain-specific) with context sentences.
- Chapter and thematic segmentation.

### 3. AI Lesson Planning Studio
- Generates lesson frameworks: anticipatory set, direct instruction, guided practice, independent practice, formative and summative assessments, and differentiated accommodations (ELL, IEP/504, gifted).
- Maps lessons to Common Core ELA, Math and NGSS standards.

### 4. Teacher Copilot
- Context-aware assistant that generates scaffolding questions, discussion hooks and checks for understanding on demand.
- Suggests explanation strategies for common student misconceptions.

### 5. Curriculum QA Auditor
- Reviews reading-level fit, pedagogical alignment, vocabulary load and content safety.
- Produces structured remediation feedback before material is published to a class.

### 6. Visual Illustration AI
- Generates character sheets and scene illustrations with Gemini multimodal models.
- Supports consistent style prompts across scenes (watercolor, picture book, 3D, line art).

### 7. Student Portal
- **Pseudonymous accounts:** students sign in with a classroom code and 4-digit PIN; no names, emails or contact details are stored.
- **Student-safe projection middleware:** server-side filtering removes teacher scripts, notes, internal metadata, and quiz answer keys (`correctAnswerIndex`) and explanations from student responses, so answers can't be read in client network traffic.
- Flashcards, vocabulary review and comprehension quizzes.

---

## Design Decisions

- **Projection middleware over client-side hiding:** answer keys never leave the server for student sessions, rather than being hidden in the UI.
- **Two-layer RBAC:** roles are enforced in Express (`requireRole`) and in the React router (`RoleGuard`).
- **Embedded Postgres for zero-config setup:** PGlite runs in-process for quick local starts; set `DATABASE_URL` to use an external PostgreSQL instance.
- **Component-driven slides:** each slide type is an isolated React component routed through `SlideRenderer`, so adding a layout doesn't touch the editor.

---

## Architecture & Tech Stack

```
lectio-engine/
├── server.ts                    # Express entry point with Vite middleware
├── src/
│   ├── components/
│   │   ├── PresentationStudioView.tsx   # Slide editor, inspector, animation preview
│   │   ├── SlideRenderer.tsx            # Slide component router
│   │   ├── slides/                      # Modular slide templates
│   │   ├── BookProcessingView.tsx       # Storybook ingestion & readability
│   │   ├── LessonAIView.tsx             # Lesson plan builder & standards mapper
│   │   ├── TeacherCopilotView.tsx       # Instructional assistant
│   │   ├── QAAuditorView.tsx            # Curriculum QA auditor
│   │   ├── StudentPortalView.tsx        # Student reading & quiz interface
│   │   ├── ImageAIView.tsx              # Gemini illustration generator
│   │   └── AdminUserManagementView.tsx  # RBAC & school management
│   ├── controllers/             # Express API controllers
│   ├── routes/                  # REST API routes
│   ├── middleware/              # Auth, RBAC, rate limiting, student projection
│   ├── services/                # Gemini services & PowerPoint generation
│   ├── db/                      # Drizzle schema, migrations, seed, PGlite
│   └── context/                 # AuthContext & ToastContext
```

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion
- **Backend:** Node.js, Express 4, TypeScript (`tsx`), CORS, cookie-parser, express-rate-limit
- **Database:** Drizzle ORM with embedded PostgreSQL (`@electric-sql/pglite`) or external PostgreSQL via `DATABASE_URL`
- **AI:** `@google/genai` SDK (Gemini 2.5 Flash / Pro)
- **Export:** `pptxgenjs`, `html-to-image`

---

## Quick Start

### Prerequisites
- Node.js 18+ (20+ recommended)
- npm or pnpm
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Install

```bash
git clone https://github.com/KaitoKid730/Lectio-Engine.git
cd Lectio-Engine
npm install
```

### Configure

```bash
cp .env.example .env
```

```env
# Required for AI features
GEMINI_API_KEY="your_gemini_api_key_here"

# Application
PORT=3000
NODE_ENV="development"
SESSION_SECRET="replace_with_a_long_random_string"
CORS_ALLOWED_ORIGINS="http://localhost:3000"
RATE_LIMIT_MAX=100

# Optional: external PostgreSQL (defaults to embedded PGlite)
# DATABASE_URL="postgres://postgres:postgres@localhost:5432/lectio_db"
```

### Run

```bash
npm run dev
```

Open `http://localhost:3000`. The database seeds demo users on first run.

---

## Demo Accounts

> **Demo only.** These credentials are created by the seed script for local testing. Never reuse them or run the seed in a real deployment.

| Role | Email / Access Code | Password / PIN | Access |
| :--- | :--- | :--- | :--- |
| Teacher | `teacher@lectio.edu` | `password123` | Ingestion, lesson plans, presentations, copilot |
| Curriculum Lead | `curriculum@lectio.edu` | `password123` | Standards alignment, full studio |
| QA Auditor | `qa@lectio.edu` | `password123` | Quality reviews and feedback |
| Administrator | `admin@lectio.edu` | `password123` | User and school management |
| Student | Class code `READ2026` | PIN `1234` | Student portal, quizzes |

---

## Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| Development | `npm run dev` | Full-stack dev server (`server.ts` with Vite HMR) |
| Build | `npm run build` | Builds the frontend and compiles `server.ts` to `dist/server.cjs` |
| Production | `npm start` | Runs the compiled server |
| Typecheck | `npm run lint` | `tsc --noEmit` across client and server |
| Test | `npm run test` | Runs the Vitest unit tests |
| Clean | `npm run clean` | Removes build artifacts |

---

## Privacy & Security Approach

- **Data minimization:** student records contain no names, emails or contact details; accounts use pseudonyms (e.g. `Student 101`) and sign in with a classroom code and PIN.
- **Server-side response filtering:** student endpoints never receive teacher scripts, instructor notes, internal prompt metadata, answer keys or explanations.
- **Role-based access control** at both the API and router layers.
- **Rate limiting** on all routes to limit brute-force and token-exhaustion attempts.

This project follows privacy-minded design principles inspired by COPPA and FERPA. It has not been through a legal or compliance audit and should not be treated as certified compliant.

---

## Status & Limitations

- Working prototype; runs locally and is not deployed.
- The presentation mode is a single-screen teacher overlay. Slides are not synchronized to student devices.
- Quizzes are served to students as authored; there is no adaptive or per-student quiz generation.
- A 4-digit PIN suits a demo; a production system would need stronger student authentication.
- AI-generated lesson content should be reviewed by an educator before classroom use.
- The test suite covers unit tests only.

---

## License

MIT. See [LICENSE](LICENSE).
