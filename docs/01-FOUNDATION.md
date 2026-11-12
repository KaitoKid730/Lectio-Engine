---
title: Layer 01 - System Foundation & Runtime Architecture
layer: LAYER_01_FOUNDATION
status: APPROVED
version: 2.0.0
last_updated: 2026-08-04
author: System Architecture Team
---

# Layer 01: System Foundation & Runtime Specification

## 1. Subsystem Purpose & Scope
Layer 01 defines the foundational execution environment, Express web server bootstrap, runtime configuration, security headers, environment secrets, CORS policies, rate limiting, and centralized error handling for the entire Lectio Engine application.

---

## 2. Environment Variables & Security Directives

Defined in `.env.example`:

```env
# GEMINI_API_KEY: Server-side Google Gemini API secret key
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# APP_URL: Production Cloud Run deployment URL
APP_URL="https://ais-dev-uveobcjhjd6lsy7vqloeqg-563230207799.europe-west2.run.app"

# NODE_ENV: Application environment mode (development / production)
NODE_ENV="development"
```

### Security Directives:
1. `GEMINI_API_KEY` is loaded strictly on the Node.js server (`process.env.GEMINI_API_KEY`).
2. Zero `VITE_` prefixed API keys shall ever be exposed to the browser.
3. Server initializes `@google/genai` with `httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }`.

---

## 3. Server Architecture (`server.ts`)
- **Runtime Engine**: Node.js with Express framework & Vite dev middleware.
- **Port Ingress**: Binds strictly to `0.0.0.0:3000` (required for Cloud Run container ingress).
- **Development Mode**: Express mounts Vite dev server in `middlewareMode` (`appType: "spa"`).
- **Production Mode**: Express serves bundled static SPA assets from `dist/` with fallback routing to `index.html`.
- **Production Build Target**: Bundle entry point compiled via `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`.

---

## 4. Universal Response & Error Handling Standards

All API endpoints return JSON payloads wrapped in a standard response envelope:

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}
```

### Error Handling Protocol:
- Upstream Gemini or DB errors are caught via try/catch blocks in Express controller handlers.
- Errors log sanitized details on the server console and return HTTP 400 or HTTP 500 JSON error structures.
- Frontend UI components handle error states by displaying user-friendly error banners with retry capabilities.

---

## 5. Security Headers, CORS & Rate Limiting
- **CORS Policy**: Configured to restrict origin requests to matched deployment domain (`APP_URL`).
- **Content Security Policy (CSP)**: Disallows inline scripts outside Vite bundle; restricts media sources.
- **Rate Limiting**: Express rate limiter caps clients at 100 API requests per 15-minute window to prevent abuse.
- **PII Scrubbing**: Inbound text payloads are sanitized prior to invoking external AI models.
