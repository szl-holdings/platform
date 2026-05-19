/**
 * Temporal scheduler bootstrap for the ROSIE ingest engine.
 *
 * Production path: the durable Temporal workflow `rosieIngestWorkflow`
 * (registered by the `temporal-worker` deployment) is the authoritative
 * scheduler. This module is the boot-time hook the api-server calls to
 * idempotently *register* that schedule via `@temporalio/client`.
 *
 * The api-server is intentionally NOT a Temporal worker — execution lives
 * in the dedicated worker process. If Temporal is not configured or the
 * SDK is not installed in the runtime, `ensureRosieIngestSchedule` returns
 * `{ ok: false, reason }` so the caller can fall back to its in-process
 * setInterval dev loop.
 *
 * Modeled on `services/frontier-ingest/src/temporal-scheduler.ts`.
 */

import { logger } from '../lib/logger';

export interface TemporalSchedulerResult {
  ok: boolean;
  reason?: string;
  scheduleId?: string;
  workflowType?: string;
  taskQueue?: string;
}

export interface TemporalSchedulerOptions {
  /** Schedule interval in ms (default 6h). */
  intervalMs?: number;
  /** Override task queue (default `szl-rosie-ingest`). */
  taskQueue?: string;
  /** Override schedule id (default `rosie-ingest-default`). */
  scheduleId?: string;
}

export async function ensureRosieIngestSchedule(
  opts: TemporalSchedulerOptions = {},
): Promise<TemporalSchedulerResult> {
  const address = process.env.TEMPORAL_ADDRESS ?? process.env.TEMPORAL_ENDPOINT;
  if (!address) {
    return { ok: false, reason: 'TEMPORAL_ADDRESS/TEMPORAL_ENDPOINT not configured' };
  }

  let clientMod: unknown;
  try {
    // Lazy import — keep `@temporalio/client` an optional runtime dep so
    // unit tests and Temporal-less dev envs don't fail to load this file.
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
      schedule: { create: (o: Record<string, unknown>) => Promise<unknown> };
    };
    ScheduleAlreadyRunning: new (...a: unknown[]) => Error;
    ScheduleOverlapPolicy: { SKIP: number };
  };

  const intervalMs = opts.intervalMs ?? 6 * 60 * 60 * 1000;
  const taskQueue = opts.taskQueue ?? process.env.ROSIE_TASK_QUEUE ?? 'szl-rosie-ingest';
  const scheduleId = opts.scheduleId ?? 'rosie-ingest-default';
  const workflowType = 'rosieIngestWorkflow';

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
      // Already exists — that's the desired state.
      if (!(e instanceof ScheduleAlreadyRunning)) {
        const msg = (e as Error).message ?? '';
        if (!/already.*exist|AlreadyExists/i.test(msg)) throw e;
      }
    }
    logger.info({ scheduleId, intervalMs }, '[rosie-temporal] schedule ensured');
    return { ok: true, scheduleId, workflowType, taskQueue };
  } catch (err) {
    return { ok: false, reason: `Temporal schedule failed: ${(err as Error).message}` };
  }
}
