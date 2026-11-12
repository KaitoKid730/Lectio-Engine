import { getDbPool } from '../db';
import { handleBookProcessing } from '../handlers/bookProcessing.handler';
import { handleLessonGeneration } from '../handlers/lessonGeneration.handler';
import { handleImageGeneration } from '../handlers/imageGeneration.handler';
import { handleQAAudit } from '../handlers/qaAudit.handler';
import { handlePresentationGeneration } from '../handlers/presentationGeneration.handler';

export type JobHandler = (payload: any) => Promise<any>;

/**
 * Job Dispatcher mapping job_type to specific execution handler functions
 */
export const jobDispatcher: Record<string, JobHandler> = {
  book_processing: handleBookProcessing,
  lesson_generation: handleLessonGeneration,
  image_generation: handleImageGeneration,
  qa_audit: handleQAAudit,
  presentation_generation: handlePresentationGeneration,
};

/**
 * Register or override a handler for a job_type
 */
export function registerJobHandler(jobType: string, handler: JobHandler): void {
  jobDispatcher[jobType] = handler;
}

let isWorkerRunning = false;
let shouldStopWorker = false;

const POLL_INTERVAL_MS = 1000;
const JOB_TIMEOUT_MS = 60000;
const MAX_ATTEMPTS = 3;

/**
 * Claims a single queued job using PostgreSQL FOR UPDATE SKIP LOCKED.
 * Uses exact PostgreSQL row-locking query defined in MASTER.md Section 7.1.
 */
async function fetchAndClaimNextJob(): Promise<any | null> {
  const pool = getDbPool();
  let client;
  try {
    client = await pool.connect();
  } catch (err: any) {
    throw new Error(`Database connection failed: ${err?.message || err}`);
  }

  try {
    await client.query('BEGIN');

    // CRITICAL ROW-LOCKING QUERY
    const res = await client.query(`
      SELECT * FROM background_jobs 
      WHERE status = 'queued' 
      ORDER BY created_at ASC 
      LIMIT 1 
      FOR UPDATE SKIP LOCKED;
    `);

    if (res.rows.length === 0) {
      await client.query('COMMIT');
      return null;
    }

    const job = res.rows[0];
    const nextAttempts = Number(job.attempts || 0) + 1;

    await client.query(
      `
      UPDATE background_jobs 
      SET status = 'processing', attempts = $1, updated_at = NOW() 
      WHERE id = $2;
    `,
      [nextAttempts, job.id]
    );

    await client.query('COMMIT');

    return {
      ...job,
      attempts: nextAttempts,
    };
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (_rollbackErr) {
        // ignore rollback errors
      }
    }
    console.error('[Queue Worker] Error claiming next job:', err);
    return null;
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Executes a job handler with a 60-second watchdog timeout.
 */
async function executeJobWithTimeout(handler: JobHandler, payload: any): Promise<any> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Job execution timed out after 60 seconds'));
    }, JOB_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([handler(payload), timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timeoutId!);
  }
}

/**
 * Updates job status in database upon completion, failure, or re-queuing.
 */
async function updateJobStatus(
  jobId: string,
  status: 'completed' | 'failed' | 'queued',
  errorMessage?: string
): Promise<void> {
  const pool = getDbPool();
  try {
    await pool.query(
      `
      UPDATE background_jobs 
      SET status = $1, error_message = $2, updated_at = NOW() 
      WHERE id = $3;
    `,
      [status, errorMessage || null, jobId]
    );
  } catch (err: any) {
    console.error(`[Queue Worker] Failed to update job status for job ${jobId}:`, err?.message);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Processes a single job if available. Returns true if a job was processed.
 */
async function processNextJob(): Promise<boolean> {
  const job = await fetchAndClaimNextJob();
  if (!job) {
    return false;
  }

  const jobType = job.job_type || job.jobType;
  console.log(`[Queue Worker] Claimed job ${job.id} of type '${jobType}' (Attempt ${job.attempts}/${MAX_ATTEMPTS})`);

  const handler = jobDispatcher[jobType];

  if (!handler) {
    const err = `No handler registered for job_type: '${jobType}'`;
    console.error(`[Queue Worker] ${err}`);
    await updateJobStatus(job.id, 'failed', err);
    return true;
  }

  try {
    await executeJobWithTimeout(handler, job.payload);
    await updateJobStatus(job.id, 'completed');
    console.log(`[Queue Worker] Job ${job.id} completed successfully.`);
  } catch (err: any) {
    const isTimeout = err.message && err.message.includes('timed out');
    console.error(`[Queue Worker] Job ${job.id} failed: ${err.message}`);

    if (isTimeout) {
      // Watchdog 60s timeout: mark job as failed immediately
      await updateJobStatus(job.id, 'failed', err.message);
    } else if (job.attempts < MAX_ATTEMPTS) {
      // Exponential backoff: 1s, 2s, 4s for attempts 1, 2, 3
      const backoffMs = Math.pow(2, job.attempts - 1) * 1000;
      console.log(`[Queue Worker] Retrying job ${job.id} in ${backoffMs}ms (Attempt ${job.attempts}/${MAX_ATTEMPTS})`);
      await updateJobStatus(job.id, 'queued', `Attempt ${job.attempts} failed: ${err.message}`);
      await sleep(backoffMs);
    } else {
      await updateJobStatus(job.id, 'failed', `Exceeded max attempts (${MAX_ATTEMPTS}). Last error: ${err.message}`);
    }
  }

  return true;
}

/**
 * Starts the continuous background queue worker loop without blocking the Express HTTP server.
 */
export async function startQueueWorker(): Promise<void> {
  if (isWorkerRunning) return;
  isWorkerRunning = true;
  shouldStopWorker = false;
  console.log('[Queue Worker] Background queue worker initialized.');

  (async () => {
    let connectionErrorLogged = false;
    while (!shouldStopWorker) {
      try {
        const processed = await processNextJob();
        if (connectionErrorLogged) {
          console.log('[Queue Worker] Database reconnected. Resuming normal job processing.');
          connectionErrorLogged = false;
        }
        if (!processed) {
          await sleep(POLL_INTERVAL_MS);
        }
      } catch (loopErr: any) {
        const msg = loopErr?.message || String(loopErr);
        const isConnRefused = msg.includes('ECONNREFUSED') || msg.includes('connection failed') || msg.includes('Connection terminated');
        if (isConnRefused) {
          if (!connectionErrorLogged) {
            console.warn('[Queue Worker] Database connection unavailable. Retrying in background...');
            connectionErrorLogged = true;
          }
          await sleep(5000);
        } else {
          console.error('[Queue Worker] Unexpected error in polling loop:', msg);
          await sleep(POLL_INTERVAL_MS);
        }
      }
    }
    isWorkerRunning = false;
    console.log('[Queue Worker] Background queue worker stopped.');
  })();
}

/**
 * Stops the queue worker polling loop gracefully.
 */
export function stopQueueWorker(): void {
  shouldStopWorker = true;
}
