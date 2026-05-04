import { logger } from '../lib/logger';
import { inspectJob, type HfJobStatus } from './hf-jobs-adapter';
import { createTrace, appendEntry, completeTrace, buildTraceEntry } from '../a11oy/runtime/tracing/store';

export interface HfJobWatchEntry {
  jobId: string;
  namespace?: string;
  traceId?: string;
  runId?: string;
  lastStatus: HfJobStatus['status'];
  onStatusChange?: (jobId: string, oldStatus: string, newStatus: string, job: HfJobStatus) => void;
}

const watchedJobs = new Map<string, HfJobWatchEntry>();
let pollIntervalId: ReturnType<typeof setInterval> | null = null;

const POLL_INTERVAL_MS = parseInt(process.env.HF_JOBS_POLL_INTERVAL_MS ?? '15000', 10);
const TERMINAL_STATUSES = new Set<string>(['succeeded', 'failed', 'timeout', 'cancelled']);

export function watchJob(entry: HfJobWatchEntry): void {
  if (!entry.traceId) {
    const traceId = createTrace({
      runId: entry.runId,
      entityId: entry.jobId,
      entityType: 'tool',
    });
    entry.traceId = traceId;
    entry.runId = entry.runId ?? `hf-run-${entry.jobId}`;
  }

  appendEntry(entry.traceId, buildTraceEntry(
    entry.runId!,
    entry.jobId,
    'tool',
    'hf-job-submitted',
    { jobId: entry.jobId, namespace: entry.namespace },
    { status: 'queued' },
    'ok',
    0,
    { metadata: { source: 'hf-jobs-poller', eventType: 'submit' } },
  ));

  watchedJobs.set(entry.jobId, entry);
  ensurePollerRunning();
  logger.info({ jobId: entry.jobId, traceId: entry.traceId, runId: entry.runId }, '[hf-poller] Watching job');
}

export function unwatchJob(jobId: string): void {
  watchedJobs.delete(jobId);
  if (watchedJobs.size === 0 && pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
}

export function getWatchedJobs(): HfJobWatchEntry[] {
  return Array.from(watchedJobs.values());
}

function ensurePollerRunning(): void {
  if (pollIntervalId) return;
  pollIntervalId = setInterval(() => {
    void pollAllJobs();
  }, POLL_INTERVAL_MS);
}

export async function pollAllJobs(): Promise<void> {
  const entries = Array.from(watchedJobs.entries());
  for (const [jobId, entry] of entries) {
    try {
      const status = await inspectJob(jobId, entry.namespace);
      if (!status) continue;

      if (status.status !== entry.lastStatus) {
        const oldStatus = entry.lastStatus;
        entry.lastStatus = status.status;

        logger.info(
          { jobId, oldStatus, newStatus: status.status, traceId: entry.traceId, runId: entry.runId },
          '[hf-poller] Job status changed',
        );

        if (entry.traceId && entry.runId) {
          const isTerminal = TERMINAL_STATUSES.has(status.status);
          const traceStatus = status.status === 'failed' || status.status === 'timeout' ? 'error' : 'ok';

          appendEntry(entry.traceId, buildTraceEntry(
            entry.runId,
            jobId,
            'tool',
            `hf-job-${status.status}`,
            { jobId, previousStatus: oldStatus },
            {
              status: status.status,
              flavor: status.flavor,
              elapsedSeconds: status.elapsedSeconds,
              costPerMinute: status.costPerMinute,
              estimatedCost: status.costPerMinute && status.elapsedSeconds
                ? parseFloat(((status.costPerMinute * status.elapsedSeconds) / 60).toFixed(4))
                : undefined,
            },
            traceStatus,
            (status.elapsedSeconds ?? 0) * 1000,
            { metadata: { source: 'hf-jobs-poller', eventType: 'status-change', terminal: isTerminal } },
          ));

          if (isTerminal) {
            completeTrace(entry.traceId, status.status === 'succeeded' ? 'completed' : 'failed');
          }
        }

        if (entry.onStatusChange) {
          try {
            entry.onStatusChange(jobId, oldStatus, status.status, status);
          } catch (err) {
            logger.warn({ err, jobId }, '[hf-poller] Status change callback failed');
          }
        }

        if (TERMINAL_STATUSES.has(status.status)) {
          unwatchJob(jobId);
        }
      }
    } catch (err) {
      logger.debug({ err, jobId }, '[hf-poller] Poll failed for job');
    }
  }
}

export function stopPoller(): void {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
  watchedJobs.clear();
}
