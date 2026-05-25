/**
 * Catch-up scheduler for proof-chain hybrid attestation.
 *
 * Runs on an hourly cadence (configurable via PROOF_CHAIN_CATCHUP_INTERVAL_MS)
 * and attests any audit_chain_events written by a still-legacy code path
 * without a hybrid attestation. Pairs with the Temporal backfill workflow
 * registered via {@link ensureProofChainBackfillSchedule}.
 *
 * Following the rosie-temporal-scheduler pattern: this service is the
 * boot-time hook that idempotently registers a Temporal schedule for the
 * durable backfill workflow. If Temporal is not configured or the SDK isn't
 * installed, the in-process setInterval catch-up loop is the fallback.
 */

import { runAttestationCatchUp } from '@szl-holdings/proof-chain';
import { buildAttestationSigner } from '../routes/audit-chain-attestations';
import { logger } from '../lib/logger';

let catchUpTimer: NodeJS.Timeout | null = null;

export function startAttestationCatchUpLoop(opts: { intervalMs?: number } = {}): void {
  const intervalMs = opts.intervalMs ?? Number(process.env.PROOF_CHAIN_CATCHUP_INTERVAL_MS ?? 3_600_000);
  if (catchUpTimer) return;
  if (process.env.PROOF_CHAIN_CATCHUP_DISABLED === '1') {
    logger.info('[attestation-catch-up] disabled via PROOF_CHAIN_CATCHUP_DISABLED=1');
    return;
  }

  const tick = async () => {
    const signer = buildAttestationSigner();
    if (!signer) {
      logger.debug('[attestation-catch-up] platform DID not ready — skipping tick');
      return;
    }
    try {
      const summary = await runAttestationCatchUp(signer, { limit: 500 });
      if (summary.totalAttested > 0 || summary.totalQuarantined > 0) {
        logger.info(
          {
            attested: summary.totalAttested,
            quarantined: summary.totalQuarantined,
            lastEventId: summary.lastEventId,
            throughputPerSec: summary.throughputPerSec,
          },
          '[attestation-catch-up] tick complete',
        );
      }
    } catch (err) {
      logger.warn({ err }, '[attestation-catch-up] tick failed (will retry on next interval)');
    }
  };

  // First run kicks off after a short delay so DID bootstrap can finish.
  setTimeout(() => {
    void tick();
  }, 30_000);
  catchUpTimer = setInterval(() => {
    void tick();
  }, intervalMs);
  if (typeof catchUpTimer.unref === 'function') catchUpTimer.unref();
  logger.info({ intervalMs }, '[attestation-catch-up] loop started');
}

export function stopAttestationCatchUpLoop(): void {
  if (catchUpTimer) {
    clearInterval(catchUpTimer);
    catchUpTimer = null;
  }
}

export interface AttestationScheduleResult {
  ok: boolean;
  reason?: string;
  scheduleId?: string;
  workflowType?: string;
  taskQueue?: string;
}

/**
 * Idempotently register the Temporal backfill schedule. The actual workflow
 * `proofChainBackfillWorkflow` is owned by the temporal-worker deployment.
 * Returns `{ ok: false }` when Temporal is not configured so the caller can
 * fall back to the in-process catch-up loop.
 */
export async function ensureProofChainBackfillSchedule(
  opts: { intervalMs?: number; taskQueue?: string; scheduleId?: string } = {},
): Promise<AttestationScheduleResult> {
  const address = process.env.TEMPORAL_ADDRESS ?? process.env.TEMPORAL_ENDPOINT;
  if (!address) {
    return { ok: false, reason: 'TEMPORAL_ADDRESS/TEMPORAL_ENDPOINT not configured' };
  }

  let clientMod: unknown;
  try {
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

  const intervalMs = opts.intervalMs ?? 60 * 60 * 1000;
  const taskQueue = opts.taskQueue ?? process.env.PROOF_CHAIN_TASK_QUEUE ?? 'szl-proof-chain';
  const scheduleId = opts.scheduleId ?? 'proof-chain-backfill-default';
  const workflowType = 'proofChainBackfillWorkflow';

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
          args: [{ chunkSize: 200, maxRows: 5000 }],
        },
        policies: { overlap: ScheduleOverlapPolicy?.SKIP ?? 1 },
      });
    } catch (e) {
      if (!(e instanceof ScheduleAlreadyRunning)) {
        const msg = (e as Error).message ?? '';
        if (!/already.*exist|AlreadyExists/i.test(msg)) throw e;
      }
    }
    logger.info({ scheduleId, intervalMs }, '[attestation-temporal] schedule ensured');
    return { ok: true, scheduleId, workflowType, taskQueue };
  } catch (err) {
    return { ok: false, reason: `Temporal schedule failed: ${(err as Error).message}` };
  }
}
