# Lectio Engine

> **Enterprise AI Platform for Storybook Ingestion, Automated Curriculum & Lesson Planning, Presentation Generation, and FERPA/COPPA-Compliant Classroom Instruction.**

[![React 19](https://img.shields.io/badge/React-19.0.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Backend-Express%204-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini API](https://img.shields.io/badge/AI-Google%20Gemini%202.5%20%2F%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle%20ORM-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

**Lectio Engine** is an end-to-end pedagogical and instructional intelligence platform. It bridges the gap between children's literature, curriculum standards, and dynamic classroom presentation. Teachers, curriculum directors, and school administrators can ingest manuscripts or storybooks and automatically generate:

- **Standards-Aligned Lesson Plans** (Common Core, NGSS, multi-tier differentiated instruction).
- **Interactive Multimedia Slide Presentations** complete with PowerPoint motion presets, vocabulary flashcards, interactive quizzes, and `.pptx` export.
- **Teacher Copilot Assistance** for real-time pedagogical prompts, misconception handling, and scaffolding.
- **Curriculum QA & Compliance Auditing** to ensure age-appropriateness, sentiment safety, and pedagogical rigor.
- **Visual Scene & Character Illustrations** via Google Gemini Image Generation.
- **FERPA & COPPA-Compliant Student Portal** featuring pseudonymous identifiers, zero-PII student sessions, and classroom access codes.

---

## Key Features

### 1. Presentation Studio & Component-Driven Slides
- **Component-Driven Slide Library**: Modular slide architectures (`HeroTitle`, `SplitScreen`, `CardGrid`, `Quote`, `InteractiveQuiz`, `Flashcard`, `ImageWithOverlay`, `Timeline`, `Comparison`, `DiscussionPrompt`).
- **PowerPoint Motion Presets**: Native animations (`Fade`, `Pop`, `Slide`, `Zoom`, `Bounce`, `Reveal`, `Wipe`) with live timing controls.
- **Theme & Palette Styling**: Dynamic gradients, typographic contrast, SVG shapes (`wave`, `blob`, `starburst`, `cloud`), and custom school district branding.
- **Interactive In-Slide Activities**: Flip vocabulary flashcards and multiple-choice quizzes directly during live classroom projection.
- **PowerPoint Export (`.pptx`)**: Direct client-side PowerPoint download powered by `pptxgenjs` with integrated fallback handlers.
- **AI Design Reviewer**: Evaluates slide typography hierarchy, readability contrast, and content density against the curriculum design brief.

### 2. Manuscript & Storybook Ingestion Pipeline
- Upload and parse children's manuscripts and literature.
- Automated readability scoring (Flesch-Kincaid, Lexile grade level estimation).
- Multi-tier vocabulary extraction (Tier 1, Tier 2 Academic, Tier 3 Domain-Specific) with context sentences.
- Automated chapter and thematic narrative segmentation.

### 3. AI Lesson Planning Studio
- Generates pedagogical lesson frameworks:
  - **Anticipatory Set** & Hook
  - **Direct Instruction** & Teacher Modeling
  - **Guided Practice** & Collaborative Tasks
  - **Independent Practice** & Extension Activities
  - **Formative & Summative Assessments**
  - **Differentiated Accommodations** (ELL, IEP/504, Gifted & Talented)
- Standards alignment mapping (Common Core ELA, Math, NGSS).

### 4. Teacher Copilot
- Context-aware instructional assistant.
- Real-time generation of scaffolding questions, discussion hooks, and checks for understanding.
- Instant handling of student misconceptions and differentiated explanation strategies.

### 5. Curriculum QA & Compliance Auditor
- Automated quality assurance for curriculum leads.
- Evaluates reading level fit, pedagogical alignment, vocabulary load, and content safety.
- Generates structured remediation feedback before publishing to classrooms.

### 6. Visual Illustration AI
- Generates character sheets and scene illustrations using Google Gemini multimodal capabilities.
- Consistent character styling prompts across scenes (watercolor, picture book, whimsical 3D, line art).

### 7. Student Portal (COPPA / FERPA Compliant)
- **Zero-PII Storage**: Pseudonymous identifiers for student accounts.
- **Access Code & PIN Auth**: Simple 4-digit PIN login with classroom code (e.g. `READ2026`).
- **Student-Safe Projection Middleware**: Server-side payload filtering prevents student endpoints from receiving teacher scripts, notes, or internal metadata.
- Interactive student flashcards, vocabulary review, and comprehension badges.

---

## Architecture & Tech Stack

```
lectio-engine/
├── server.ts                    # Full-stack Express entry point with Vite middleware
├── src/
│   ├── components/              # React Views & UI components
│   │   ├── PresentationStudioView.tsx   # Slide editor, inspector & animation preview
│   │   ├── SlideRenderer.tsx            # Dynamic slide component router
│   │   ├── slides/                      # Modular slide templates (HeroTitle, Quiz, etc.)
│   │   ├── BookProcessingView.tsx       # Storybook ingestion & readability
│   │   ├── LessonAIView.tsx             # Lesson plan builder & standards mapper
│   │   ├── TeacherCopilotView.tsx       # Real-time instructional assistant
│   │   ├── QAAuditorView.tsx            # Standards QA & compliance auditor
│   │   ├── StudentPortalView.tsx        # Student reading & quiz interface
│   │   ├── ImageAIView.tsx              # Gemini illustration generator
│   │   └── AdminUserManagementView.tsx  # Multi-tenant RBAC & school management
│   ├── controllers/             # Express API controllers
│   ├── routes/                  # Modular REST API routes
│   ├── middleware/              # Auth, RBAC, Rate-limit & Student Projection
│   ├── services/                # Gemini AI services & PowerPoint generation
│   ├── db/                      # Drizzle ORM schema, migrations, seed & PGlite
│   └── context/                 # AuthContext & ToastContext
```

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion.
- **Backend**: Node.js, Express 4, TypeScript (`tsx`), CORS, Cookie-Parser, Express-Rate-Limit.
- **Database**: Drizzle ORM with embedded PostgreSQL (`@electric-sql/pglite`) for instant zero-config startup, or external PostgreSQL via `DATABASE_URL`.
- **AI Engine**: `@google/genai` TypeScript SDK (Gemini 2.5 Flash / Pro).
- **Presentation Export**: `pptxgenjs` & `html-to-image`.

---

## Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm** or **pnpm**
- **Google Gemini API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/).

### 2. Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-username/lectio-engine.git
cd lectio-engine

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the project root (see `.env.example`):

```bash
cp .env.example .env
```

Fill in your configuration:
```env
# Required for AI generation features
GEMINI_API_KEY="your_gemini_api_key_here"

# Application Config
PORT=3000
NODE_ENV="development"
SESSION_SECRET="your_secure_session_secret"
CORS_ALLOWED_ORIGINS="http://localhost:3000"
RATE_LIMIT_MAX=100

# Database (Leave default for built-in in-memory PGlite PostgreSQL)
# DATABASE_URL="postgres://postgres:postgres@localhost:5432/lectio_db"
```

### 4. Run Development Server

```bash
npm run dev
```

Open your browser at **`http://localhost:3000`**. The database seeds initial test users automatically on first run!

---

## Seed Accounts & Demo Credentials

Use any of the pre-configured role accounts to test the application:

| Role | Email / Access Code | Password / PIN | Permissions & Description |
| :--- | :--- | :--- | :--- |
| **Teacher** | `teacher@lectio.edu` | `password123` | Storybook ingestion, lesson plans, presentations, copilot |
| **Curriculum Lead** | `curriculum@lectio.edu` | `password123` | Standards alignment, curriculum oversight, full studio |
| **QA Auditor** | `qa@lectio.edu` | `password123` | Standards compliance auditor, quality reviews, feedback |
| **Administrator** | `admin@lectio.edu` | `password123` | User management, district/school configuration, anonymization |
| **Student** | Class Code: `READ2026` | PIN: `1234` | Zero-PII student portal, reading comprehension, interactive quizzes |

---

## Available NPM Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **Development** | `npm run dev` | Runs the full-stack app (`server.ts` with Vite HMR middleware via `tsx`) |
| **Build** | `npm run build` | Builds Vite frontend bundle and compiles `server.ts` to `dist/server.cjs` |
| **Production** | `npm start` | Launches the compiled production server (`node dist/server.cjs`) |
| **Typecheck** | `npm run lint` | Runs `tsc --noEmit` to validate TypeScript types across client & server |
| **Test** | `npm run test` | Runs unit and integration test suite via Vitest |
| **Clean** | `npm run clean` | Cleans build artifacts (`dist/`, `server.js`) |

---

## Privacy, Security & Compliance

- **COPPA & FERPA Zero-PII**: Student records do not store full names, email addresses, or personal contact information. Accounts use random pseudonyms (e.g. `Student 101`) and authenticate strictly via Classroom Code + 4-digit PIN.
- **Student-Safe Response Projection**: Server middleware strips all instructor notes, answer explanations, internal prompt metadata, and teacher scripts before delivering payloads to student sessions.
- **RBAC (Role-Based Access Control)**: Enforced both at the Express route level (`requireRole`) and React router layer (`RoleGuard`).
- **Rate Limiting & Security Headers**: Global IP rate limiting prevents brute force and token exhaustion.

---

## License

This project is licensed under the [MIT License](LICENSE).
