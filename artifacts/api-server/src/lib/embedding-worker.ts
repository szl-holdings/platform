import { processEmbeddingTasks } from "@szl-holdings/ai-engine/embedding-pipeline";
import { logger } from "./logger";

const POLL_INTERVAL_MS = 30_000;
const IDLE_INTERVAL_MS = 60_000;
const MAX_BACKOFF_MS = 300_000;
const BATCH_SIZE = 20;

let timer: ReturnType<typeof setTimeout> | null = null;
let stopped = true; // worker begins in stopped state; startEmbeddingWorker() transitions to active
let consecutiveErrors = 0;

async function runOnce(): Promise<void> {
  try {
    const { processed, failed } = await processEmbeddingTasks(BATCH_SIZE);
    consecutiveErrors = 0;
    if (processed > 0 || failed > 0) {
      logger.info({ processed, failed }, "[embedding-worker] Batch complete");
    }
    const nextDelay = processed > 0 ? POLL_INTERVAL_MS : IDLE_INTERVAL_MS;
    scheduleNext(nextDelay);
  } catch (err) {
    consecutiveErrors++;
    const backoff = Math.min(POLL_INTERVAL_MS * 2 ** consecutiveErrors, MAX_BACKOFF_MS);
    logger.warn({ err, consecutiveErrors, backoffMs: backoff }, "[embedding-worker] Error — backing off");
    scheduleNext(backoff);
  }
}

function scheduleNext(delayMs: number): void {
  if (stopped) return;
  timer = setTimeout(() => { void runOnce(); }, delayMs);
  timer.unref();
}

/**
 * Starts the background embedding task processor.
 * Idempotent: calling this when the worker is already running is a no-op.
 * @param runImmediately If true, runs a processing batch immediately instead of
 *   waiting for the first poll interval. Useful after server boot to drain any
 *   tasks already queued before the worker started.
 */
export function startEmbeddingWorker(runImmediately = false): void {
  if (!stopped) {
    logger.debug("[embedding-worker] Already running — start call is a no-op");
    return;
  }
  stopped = false;
  consecutiveErrors = 0;
  logger.info("[embedding-worker] Starting automatic embedding task processor");
  if (runImmediately) {
    void runOnce();
  } else {
    scheduleNext(POLL_INTERVAL_MS);
  }
}

/** Returns current worker health snapshot for health-check and monitoring use. */
export function getWorkerStatus(): { running: boolean; consecutiveErrors: number; pollIntervalMs: number } {
  return { running: !stopped, consecutiveErrors, pollIntervalMs: POLL_INTERVAL_MS };
}

export function stopEmbeddingWorker(): void {
  stopped = true;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  logger.info("[embedding-worker] Stopped");
}
