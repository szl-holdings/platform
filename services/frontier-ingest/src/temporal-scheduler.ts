/**
 * Temporal scheduler bootstrap for the Frontier Ingestion Engine.
 *
 * In production, the durable Temporal workflow `frontierIngestWorkflow`
 * (defined in `platform/temporal/workflows/frontier-ingest-workflow.ts`)
 * is the authoritative scheduler. This module is the boot-time hook that
 * api-server calls to *start* that workflow on a schedule via the Temporal
 * client. The Temporal worker process itself runs separately and registers
 * `frontier-ingest-activities`.
 *
 * Why split client (start) and worker (execute)?
 *   - The api-server should not be a Temporal worker — that's the
 *     `temporal-worker` deployment's job.
 *   - The api-server's job is to ensure the schedule exists and is
 *     enabled when the frontier engine is configured.
 *
 * If `TEMPORAL_ADDRESS` is not set or `@temporalio/client` is not
 * installed in the runtime, this returns `{ ok: false, reason }` so the
 * caller can fall back to the documented dev `setInterval` worker
 * (gated behind `FRONTIER_INGEST_DEV_WORKER=true`).
 */

export interface TemporalSchedulerResult {
  ok: boolean;
  reason?: string;
  scheduleId?: string;
  workflowType?: string;
  taskQueue?: string;
}

export interface TemporalSchedulerOptions {
  /** Schedule interval (default 6h). */
  intervalMs?: number;
  /** Override task queue (default `szl-frontier-ingest`). */
  taskQueue?: string;
  /** Override schedule id (default `frontier-ingest-default`). */
  scheduleId?: string;
}

/**
 * Idempotently ensure a Temporal Schedule exists that fires
 * `frontierIngestWorkflow` on the configured cadence.
 *
 * Returns `{ ok: false }` (without throwing) when Temporal is
 * unreachable or the SDK is not installed — the api-server treats this
 * as a soft failure and falls back to the in-process dev loop only when
 * `FRONTIER_INGEST_DEV_WORKER=true`.
 */
export async function ensureFrontierIngestSchedule(
  opts: TemporalSchedulerOptions = {},
): Promise<TemporalSchedulerResult> {
  // Accept both env names — `TEMPORAL_ADDRESS` is the canonical
  // Temporal SDK var, but parts of the platform use `TEMPORAL_ENDPOINT`.
  // Honouring both prevents the scheduler silently no-op'ing when the
  // operator only set the platform-wide variable.
  const address = process.env.TEMPORAL_ADDRESS ?? process.env.TEMPORAL_ENDPOINT;
  if (!address) {
    return { ok: false, reason: 'TEMPORAL_ADDRESS/TEMPORAL_ENDPOINT not configured' };
  }

  let clientMod: unknown;
  try {
    // Lazy import — keeps `@temporalio/client` an optional runtime dep.
    // Typed as `unknown` because the dep is intentionally not declared in
    // this package's package.json; the dedicated Temporal worker process
    // owns the SDK at runtime.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - optional runtime dependency, resolved by host process
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
      schedule: {
        create: (o: Record<string, unknown>) => Promise<unknown>;
      };
    };
    ScheduleAlreadyRunning: new (...a: unknown[]) => Error;
    ScheduleOverlapPolicy: { SKIP: number };
  };

  const intervalMs = opts.intervalMs ?? 6 * 60 * 60 * 1000;
  const taskQueue = opts.taskQueue ?? process.env.FRONTIER_TASK_QUEUE ?? 'szl-frontier-ingest';
  const scheduleId = opts.scheduleId ?? 'frontier-ingest-default';
  const workflowType = 'frontierIngestWorkflow';

  try {
    const connection = await Connection.connect({ address });
    const client = new Client({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
    });
    try {
      await client.schedule.create({
        scheduleId,
        spec: { intervals: [{ every: intervalMs }] },
        action: {
          type: 'startWorkflow',
          workflowType,
          taskQueue,
          args: [{ intervalMs }],
        },
        policies: { overlap: ScheduleOverlapPolicy?.SKIP ?? 1 },
      });
    } catch (e) {
      // Already exists — that's fine; the schedule is what we wanted.
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
