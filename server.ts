import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { env } from './src/config/env';
import { checkDatabaseHealth } from './src/db';
import { ensureSeedUsersExist } from './src/db/seed';
import { sendResponse } from './src/utils/response';
import { sessionMiddleware } from './src/middleware/auth.middleware';
import { studentSafeProjection } from './src/middleware/studentProjection.middleware';
import authRouter from './src/routes/auth.routes';
import bookRouter from './src/routes/book.routes';
import lessonRouter from './src/routes/lesson.routes';
import imageRouter from './src/routes/image.routes';
import qaRouter from './src/routes/qa.routes';
import studentRouter from './src/routes/student.routes';
import teacherRouter from './src/routes/teacher.routes';
import adminRouter from './src/routes/admin.routes';
import presentationRouter, { slideRouter } from './src/routes/presentation.routes';
import { anonymizeStudentController } from './src/controllers/admin.controller';
import { requireAuth, requireRole } from './src/middleware/auth.middleware';
import { startQueueWorker } from './src/workers/queue.worker';

const app = express();
app.set('trust proxy', 1);

const PORT = env.PORT;

// ----------------------------------------------------
// MIDDLEWARE CONFIGURATION (01-CORE-Foundation)
// ----------------------------------------------------

// CORS Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.CORS_ALLOWED_ORIGINS.includes(origin) || env.CORS_ALLOWED_ORIGINS === '*') {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

// Body Parsing & Cookie Parser Middleware
app.use(express.json({ limit: `${env.MAX_MANUSCRIPT_SIZE}b` }));
app.use(express.urlencoded({ extended: true, limit: `${env.MAX_MANUSCRIPT_SIZE}b` }));
app.use(cookieParser());

// Global Rate Limiting Middleware
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.RATE_LIMIT_MAX, // 100 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
  handler: (_req, res) => {
    sendResponse(res, 429, false, undefined, 'Too many requests from this IP, please try again after 15 minutes.');
  },
});

app.use('/api/', globalLimiter);

// Structured JSON Logger Middleware (Phase 8 Observability & Cloud Logging)
app.use('/api/', (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      JSON.stringify({
        severity: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARNING' : 'INFO',
        message: `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: duration,
        timestamp: new Date().toISOString(),
      })
    );
  });
  next();
});

// Session Resolution & Projection Safeguard Middleware
app.use('/api/', sessionMiddleware);
app.use('/api/', studentSafeProjection);

// ----------------------------------------------------
// PHASE 1 & 2 ROUTE MOUNTING
// ----------------------------------------------------

// Liveness Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  sendResponse(res, 200, true, {
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Readiness & Dependencies Health Check (queries PostgreSQL via Drizzle ORM)
app.get('/api/health/dependencies', async (_req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();
  const geminiConfigured = Boolean(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY);

  sendResponse(res, 200, true, {
    database: {
      status: dbHealth.connected ? 'healthy' : 'disconnected',
      connected: dbHealth.connected,
      error: dbHealth.error || null,
    },
    gemini: {
      status: geminiConfigured ? 'configured' : 'unconfigured',
      configured: geminiConfigured,
    },
    environment: env.NODE_ENV,
    port: PORT,
  });
});

// Phase 2 Modular Auth Routes
app.use('/api/auth', authRouter);

// Phase 4 Core Pipeline Routes
app.use('/api/books', bookRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/images', imageRouter);
app.use('/api/qa', qaRouter);

// Phase 5 Student Portal Routes
app.use('/api/student', studentRouter);

// Phase 6 Teacher Copilot & Admin Console Routes
app.use('/api/teacher', teacherRouter);
app.use('/api/admin', adminRouter);
app.use('/api/presentations', presentationRouter);
app.use('/api/slides', slideRouter);
app.post('/api/students/:id/anonymize', requireAuth, requireRole('admin', 'district_admin'), anonymizeStudentController);

// Global Error Handler Middleware (16-API-Gateway contract & Cloud Logging)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(
    JSON.stringify({
      severity: 'ERROR',
      message: 'Unhandled Server Error',
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    })
  );
  sendResponse(res, 500, false, undefined, err.message || 'Internal Server Error');
});

// ----------------------------------------------------
// VITE & STATIC BOOTSTRAP (01-CORE-Foundation)
// ----------------------------------------------------

async function startServer() {
  // Run DB Seed check once at boot
  await ensureSeedUsersExist();

  if (env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lectio Engine Phase 3 Server running on http://0.0.0.0:${PORT} [${env.NODE_ENV}]`);
    console.log('[Queue Worker] Started');
    startQueueWorker().catch((err) => {
      console.error('Failed to start background queue worker:', err);
    });
  });
}

startServer();
