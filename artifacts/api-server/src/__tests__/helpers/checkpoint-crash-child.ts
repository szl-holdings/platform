/**
 * Child process used by `runtime-crash-resume.integration.test.ts`.
 *
 * Real cognitive-runtime run (not a seeded snapshot):
 *
 *   1. Connects to the live Postgres database and installs a
 *      production-shaped `PostgresCheckpointStore` (write-behind, 1s flush)
 *      as the backend of `defaultCheckpointStore`.
 *   2. Calls `run(...)` from `@workspace/cognitive-runtime` with a
 *      deterministic step executor. Steps 0–2 complete instantly; step 3
 *      polls Postgres until the i=2 checkpoint is empirically durable
 *      (proving the asynchronous flush window has closed without any
 *      forced `flush()` call), then announces `READY <runId>` on stdout
 *      and blocks forever waiting for the parent to deliver SIGKILL.
 *   3. Never calls `stop()` or any graceful flush — the SIGKILL is the
 *      crash signal the runtime is supposed to survive.
 */

import { db } from '@szl-holdings/db';
import { orchestrationCheckpointsTable } from '@szl-holdings/db/schema';
import {
  type CognitiveRuntimeOptions,
  defaultCheckpointStore,
  PostgresCheckpointStore,
  run as runCognitiveLoop,
} from '@workspace/cognitive-runtime';
import { and, eq, gte } from 'drizzle-orm';

const FLUSH_INTERVAL_MS = 1000; // production default — ≤1s data-loss budget

async function pollForDurableCheckpoint(
  agentId: string,
  minStepIndex: number,
  timeoutMs: number,
): Promise<{ runId: string; ref: string } | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const rows = await db
      .select()
      .from(orchestrationCheckpointsTable)
      .where(
        and(
          eq(orchestrationCheckpointsTable.agentId, agentId),
          gte(orchestrationCheckpointsTable.stepIndex, minStepIndex),
        ),
      );
    if (rows.length > 0) {
      const row = rows[0]!;
      return { runId: row.runId as string, ref: row.ref as string };
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

async function main(): Promise<void> {
  const tag = process.env.CHECKPOINT_RUN_TAG ?? 'untagged';
  const agentId = `agent-${tag}`;
  const sessionId = `session-${tag}`;

  const store = new PostgresCheckpointStore({
    db: db as unknown as Parameters<typeof PostgresCheckpointStore>[0]['db'],
    table: orchestrationCheckpointsTable,
    flushIntervalMs: FLUSH_INTERVAL_MS,
  });
  defaultCheckpointStore.setBackend(store);

  let stepCount = 0;

  const runtimeOptions: CognitiveRuntimeOptions = {
    stepExecutor: async (step) => {
      const idx = stepCount++;

      // Steps 0–2: complete instantly. The orchestrator writes a
      // checkpoint after each step (checkpointEveryNSteps=1), so by the
      // time step 3 starts the cache contains entries at i=0, 1, 2 and
      // the flush timer carries them to Postgres asynchronously.
      if (idx < 3) {
        return { ok: true, stepId: step.stepId, idx };
      }

      // Step 3 onwards: wait for the i=2 checkpoint to actually appear
      // in Postgres (this proves the flush timer fired — we never call
      // flush() ourselves), then announce READY and block forever so the
      // parent test can SIGKILL us mid-execution.
      const found = await pollForDurableCheckpoint(
        agentId,
        2,
        // Allow up to 20s: tsx startup + module imports can consume 8-12s
        // before steps even begin, leaving the 1s flush interval precious
        // little room. 20s gives ≥8 flush cycles after steps 0-2 complete
        // while still catching genuine flush failures within a reasonable
        // wall-clock budget.
        20_000,
      );
      if (!found) {
        process.stderr.write(
          `[crash-child] no i>=2 checkpoint observed in Postgres for agent ${agentId} within 20s\n`,
        );
        process.exit(3);
      }

      process.stdout.write(`READY ${found.runId} ${found.ref}\n`);

      // Block forever — orchestrator never returns; SIGKILL is expected.
      await new Promise<never>(() => {
        /* never resolves */
      });
      // Unreachable.
      return { unreachable: true };
    },
  };

  // Use baseline planner (heuristic, no LLM) — yields 5 plan steps:
  // Perceive → Plan → Act → Verify → Reflect.
  await runCognitiveLoop(
    'verify orchestrator resumes from orchestration_checkpoints after a real crash',
    {
      agentId,
      sessionId,
      domain: 'test',
      maxRetries: 0,
      maxVerifyRevisions: 0,
      checkpointEveryNSteps: 1,
      guardianEnabled: false,
      verifierEnabled: false,
      reflectionEnabled: false,
      metadata: { crashResumeTag: tag },
    },
    runtimeOptions,
  ).catch((err) => {
    process.stderr.write(`[crash-child] orchestrator threw: ${String(err)}\n`);
    process.exit(4);
  });
}

main().catch((_err) => {
  process.exit(2);
});
