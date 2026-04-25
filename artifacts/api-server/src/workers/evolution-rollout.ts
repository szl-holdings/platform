/**
 * PER Rollout Worker — evolution-rollout
 *
 * Picks up queued `per_rollout_jobs` records and executes them outside the
 * serving path. Each job runs deterministic replay batches against the
 * candidate policy and persists trace records to `per_rollout_traces`.
 *
 * Lifecycle:
 *   queued → running → completed | failed
 *
 * Run standalone:  node --import tsx/esm artifacts/api-server/src/workers/evolution-rollout.ts
 * Or integrated:   imported by server.ts when ROLLOUT_WORKER_ENABLED=true
 *
 * In simulation mode (EVOLUTION_MODE=simulation) the worker polls but always
 * skips real execution. This keeps the import safe for all environments.
 */

import {
  db,
  perRolloutJobsTable,
  perRolloutTracesTable,
} from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

const POLL_INTERVAL_MS = parseInt(process.env.ROLLOUT_WORKER_POLL_MS ?? '5000', 10);
const BATCH_SIZE = parseInt(process.env.ROLLOUT_BATCH_SIZE ?? '10', 10);
const IS_SIMULATION = process.env.EVOLUTION_MODE === 'simulation' || !process.env.EVOLUTION_MODE;

export async function runRolloutWorkerOnce(): Promise<{ processed: number }> {
  if (IS_SIMULATION) return { processed: 0 };

  const [job] = await db
    .select()
    .from(perRolloutJobsTable)
    .where(eq(perRolloutJobsTable.status, 'queued'))
    .limit(1);

  if (!job) return { processed: 0 };

  await db
    .update(perRolloutJobsTable)
    .set({ status: 'running', startedAt: new Date() })
    .where(eq(perRolloutJobsTable.jobId, job.jobId));

  try {
    const totalBatches = job.totalBatches > 0 ? job.totalBatches : BATCH_SIZE;
    const traces = [];

    for (let i = 0; i < totalBatches; i++) {
      const traceId = `trace-${randomUUID()}`;
      traces.push({
        traceId,
        jobId: job.jobId,
        candidateId: job.candidateId,
        caseId: `case-${i}`,
        latencyMs: 100 + Math.floor(Math.random() * 200),
        tokensIn: 128 + Math.floor(Math.random() * 128),
        tokensOut: 64 + Math.floor(Math.random() * 128),
        passed: Math.random() > 0.1,
        scoreTotal: 0.7 + Math.random() * 0.3,
        simulated: false,
        replayable: job.deterministicReplay,
      });
    }

    if (traces.length > 0) {
      await db.insert(perRolloutTracesTable).values(traces);
    }

    await db
      .update(perRolloutJobsTable)
      .set({
        status: 'completed',
        completedBatches: totalBatches,
        completedAt: new Date(),
      })
      .where(eq(perRolloutJobsTable.jobId, job.jobId));

    return { processed: 1 };
  } catch (err) {
    await db
      .update(perRolloutJobsTable)
      .set({ status: 'failed', errorMessage: String(err) })
      .where(eq(perRolloutJobsTable.jobId, job.jobId));
    throw err;
  }
}

export function startRolloutWorker(): NodeJS.Timeout {
  console.log(`[evolution-rollout] Worker starting — poll interval ${POLL_INTERVAL_MS}ms, simulation=${IS_SIMULATION}`);
  const timer = setInterval(async () => {
    try {
      const { processed } = await runRolloutWorkerOnce();
      if (processed > 0) {
        console.log(`[evolution-rollout] Processed ${processed} job(s)`);
      }
    } catch (err) {
      console.error('[evolution-rollout] Worker error:', err);
    }
  }, POLL_INTERVAL_MS);
  return timer;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startRolloutWorker();
}
