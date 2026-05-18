/**
 * Temporal scheduler bootstrap for the Frontier *retention* workflow.
 *
 * Mirrors `temporal-scheduler.ts` (which schedules the ingest workflow),
 * but registers the `frontierRetentionWorkflow` that periodically prunes
 * old `frontier_timeline` and discarded inbox rows so the DB stays lean.
 *
 * Soft-fails (returns `{ ok: false, reason }`) when Temporal isn't
 * configured — the api-server uses this for status surfacing and may
 * fall back to an in-process interval (see `startRetentionLoopIfEnabled`
 * in this module).
 */
import { pruneFrontierRetention, resolveFrontierRetentionConfig } from './retention.js';

export interface RetentionSchedulerResult {
  ok: boolean;
  reason?: string;
  scheduleId?: string;
  workflowType?: string;
  taskQueue?: string;
}

export interface RetentionSchedulerOptions {
  intervalMs?: number;
  taskQueue?: string;
  scheduleId?: string;
}

export async function ensureFrontierRetentionSchedule(
  opts: RetentionSchedulerOptions = {},
): Promise<RetentionSchedulerResult> {
  const address = process.env.TEMPORAL_ADDRESS ?? process.env.TEMPORAL_ENDPOINT;
  if (!address) {
    return { ok: false, reason: 'TEMPORAL_ADDRESS/TEMPORAL_ENDPOINT not configured' };
  }

  let clientMod: unknown;
  try {
    // @ts-ignore - optional runtime dependency
    clientMod = await import('@temporalio/client');
  } catch (err) {
    return {
      ok: false,
      reason: `@temporalio/client not installed: ${(err as Error).message}`,
    };
  }

  const { Connection, Client, ScheduleAlreadyRunning, ScheduleOverlapPolicy } = clientMod as {
    Connection: { connect: (o: { address: string }) => Promise<unknown> };
    Client: new (o: { connection: unknown; namespace?: string }) => {
      schedule: { create: (o: Record<string, unknown>) => Promise<unknown> };
    };
    ScheduleAlreadyRunning: new (...a: unknown[]) => Error;
    ScheduleOverlapPolicy: { SKIP: number };
  };

  const cfg = resolveFrontierRetentionConfig({ intervalMs: opts.intervalMs });
  const taskQueue =
    opts.taskQueue ?? process.env.FRONTIER_TASK_QUEUE ?? 'szl-frontier-ingest';
  const scheduleId = opts.scheduleId ?? 'frontier-retention-default';
  const workflowType = 'frontierRetentionWorkflow';

  try {
    const connection = await Connection.connect({ address });
    const client = new Client({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
    });
    try {
      await client.schedule.create({
        scheduleId,
        spec: { intervals: [{ every: cfg.intervalMs }] },
        action: {
          type: 'startWorkflow',
          workflowType,
          taskQueue,
          args: [
            {
              timelineDays: cfg.timelineDays,
              discardedInboxDays: cfg.discardedInboxDays,
              intervalMs: cfg.intervalMs,
            },
          ],
        },
        policies: { overlap: ScheduleOverlapPolicy?.SKIP ?? 1 },
      });
    } catch (e) {
      if (!(e instanceof ScheduleAlreadyRunning)) {
        const msg = (e as Error).message ?? '';
        if (!/already.*exist|AlreadyExists/i.test(msg)) throw e;
      }
    }
    return { ok: true, scheduleId, workflowType, taskQueue };
  } catch (err) {
    return { ok: false, reason: `Temporal schedule failed: ${(err as Error).message}` };
  }
}

let retentionTimer: ReturnType<typeof setInterval> | undefined;
let retentionRunning = false;

/**
 * In-process fallback loop. Only starts when explicitly enabled via
 * `FRONTIER_RETENTION_IN_PROCESS=true` — production should rely on the
 * Temporal schedule above. Useful in dev / single-process deployments
 * where Temporal isn't reachable.
 */
export function startRetentionLoopIfEnabled(): { running: boolean; intervalMs?: number } {
  if (retentionRunning) return { running: true };
  if (process.env.FRONTIER_RETENTION_IN_PROCESS !== 'true') {
    return { running: false };
  }
  const cfg = resolveFrontierRetentionConfig();
  retentionRunning = true;
  // Run once on boot, then on interval. Fire-and-forget; prune failures
  // are non-fatal (the DB grows for one more cycle).
  void pruneFrontierRetention().catch(() => undefined);
  retentionTimer = setInterval(() => {
    void pruneFrontierRetention().catch(() => undefined);
  }, cfg.intervalMs);
  if (retentionTimer.unref) retentionTimer.unref();
  return { running: true, intervalMs: cfg.intervalMs };
}

export function stopRetentionLoop(): void {
  if (retentionTimer) clearInterval(retentionTimer);
  retentionTimer = undefined;
  retentionRunning = false;
}

export function isRetentionLoopRunning(): boolean {
  return retentionRunning;
}
