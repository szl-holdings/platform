/**
 * Real-Crash Resume Integration Test (Task #1932)
 *
 * Closes the gap left by `runtime-persistence.test.ts` (which proves
 * checkpoints round-trip through fakes only) by exercising the full
 * SIGKILL → restart → resume path against real Postgres with the
 * production-shaped write-behind flush timing.
 *
 *   1. Spawns a child Node process that runs the cognitive-runtime
 *      orchestrator end-to-end with `flushIntervalMs: 1000` (production
 *      default — the spec's ≤1s data-loss budget). The child completes
 *      steps 0–2, then *blocks* inside step 3 until the i=2 checkpoint
 *      is empirically observed in Postgres (no forced `flush()`), then
 *      announces `READY <runId> <ref>` and waits forever.
 *   2. Sends SIGKILL — no graceful shutdown, no `stop()` — this is the
 *      "real crash" the runtime is designed to survive.
 *   3. In the parent, constructs a fresh `PostgresCheckpointStore`
 *      against the same DB, hydrates it, verifies the row is present,
 *      and runs the orchestrator with `resumeFromCheckpoint: ref`.
 *   4. Asserts the orchestrator skips perceive/orient/plan, resumes the
 *      execute phase at step index 3, and finishes successfully — i.e.
 *      no data was lost across the crash and the resume contract holds.
 *
 * Skipped automatically when `DATABASE_URL` is not set.
 */

import { type ChildProcess, spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHILD_SCRIPT = path.join(HERE, 'helpers', 'checkpoint-crash-child.ts');
const TSX_BIN = path.resolve(HERE, '../../../../node_modules/.bin/tsx');

const HAS_DB = Boolean(process.env.DATABASE_URL);
const describeIfDb = HAS_DB ? describe : describe.skip;

interface ChildHandle {
  child: ChildProcess;
  runId: string;
  ref: string;
}

async function spawnCrashChild(tag: string, timeoutMs = 30_000): Promise<ChildHandle> {
  const child = spawn(TSX_BIN, [CHILD_SCRIPT], {
    env: { ...process.env, CHECKPOINT_RUN_TAG: tag },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let stderrBuf = '';
  child.stderr?.on('data', (chunk: Buffer) => {
    stderrBuf += chunk.toString('utf8');
  });

  const ready = await new Promise<{ runId: string; ref: string }>((resolve, reject) => {
    let stdoutBuf = '';
    const timer = setTimeout(() => {
      reject(
        new Error(`crash-child did not emit READY within ${timeoutMs}ms. stderr=${stderrBuf}`),
      );
    }, timeoutMs);
    timer.unref?.();

    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutBuf += chunk.toString('utf8');
      const m = stdoutBuf.match(/READY (\S+) (\S+)/);
      if (m) {
        clearTimeout(timer);
        resolve({ runId: m[1]!, ref: m[2]! });
      }
    });

    child.once('exit', (code, signal) => {
      clearTimeout(timer);
      reject(
        new Error(
          `crash-child exited prematurely (code=${code}, signal=${signal}). stderr=${stderrBuf}`,
        ),
      );
    });
    child.once('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  return { child, ...ready };
}

function killChildHard(child: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }
    child.once('exit', () => resolve());
    child.kill('SIGKILL');
    setTimeout(() => resolve(), 2000).unref?.();
  });
}

describeIfDb('runtime crash → resume from orchestration_checkpoints', () => {
  const tag = `t${Date.now().toString(36)}`;
  const agentId = `agent-${tag}`;
  let originalCheckpointBackend: unknown;
  let observedRunId: string | undefined;

  afterAll(async () => {
    // Restore singleton state so other tests in the same worker aren't
    // affected by our PostgresCheckpointStore swap.
    try {
      const { defaultCheckpointStore, InMemoryCheckpointStore } = await import(
        '@workspace/cognitive-runtime'
      );
      defaultCheckpointStore.setBackend(
        (originalCheckpointBackend as Parameters<typeof defaultCheckpointStore.setBackend>[0]) ??
          new InMemoryCheckpointStore(),
      );
    } catch {
      /* ignore — non-fatal */
    }

    // Best-effort cleanup of any rows we wrote, regardless of outcome.
    try {
      const { db } = await import('@szl-holdings/db');
      const { orchestrationCheckpointsTable } = await import('@szl-holdings/db/schema');
      const { eq } = await import('drizzle-orm');
      await db
        .delete(orchestrationCheckpointsTable)
        .where(eq(orchestrationCheckpointsTable.agentId, agentId));
      if (observedRunId) {
        await db
          .delete(orchestrationCheckpointsTable)
          .where(eq(orchestrationCheckpointsTable.runId, observedRunId));
      }
    } catch {
      /* ignore — non-fatal */
    }
  });

  it('kills the orchestrator mid-run with SIGKILL and resumes from the persisted checkpoint', async () => {
    // ── Step 1: spawn a real cognitive-runtime run inside a child ─────────
    const { child, runId, ref } = await spawnCrashChild(tag);
    observedRunId = runId;
    expect(ref).toMatch(/^ckpt-/);
    expect(runId).toBeTruthy();

    // ── Step 2: SIGKILL — simulate a real crash. No flush, no stop() ────
    await killChildHard(child);
    expect(child.signalCode).toBe('SIGKILL');

    // ── Step 3: verify the row is durable in Postgres (write-behind
    //           flush actually fired in the child — we never called
    //           flush() ourselves) ────────────────────────────────────────
    const { db } = await import('@szl-holdings/db');
    const { orchestrationCheckpointsTable } = await import('@szl-holdings/db/schema');
    const { eq } = await import('drizzle-orm');

    const rows = await db
      .select()
      .from(orchestrationCheckpointsTable)
      .where(eq(orchestrationCheckpointsTable.ref, ref));
    expect(rows.length).toBe(1);
    expect(rows[0]?.runId).toBe(runId);
    expect((rows[0] as { stepIndex: number }).stepIndex).toBeGreaterThanOrEqual(2);

    // ── Step 4: hydrate a fresh PostgresCheckpointStore (production-
    //           shaped flush window) and bind it to the singleton ────────
    const {
      PostgresCheckpointStore,
      defaultCheckpointStore,
      run: runCognitiveLoop,
    } = await import('@workspace/cognitive-runtime');

    originalCheckpointBackend = defaultCheckpointStore.getBackend();

    const store = new PostgresCheckpointStore({
      db: db as unknown as Parameters<typeof PostgresCheckpointStore>[0]['db'],
      table: orchestrationCheckpointsTable,
      flushIntervalMs: 1000, // production default — same ≤1s budget
    });
    const hydrated = await store.hydrate();
    expect(hydrated).toBeGreaterThanOrEqual(1);

    const recovered = store.load(ref);
    expect(recovered, 'checkpoint must be hydrated from Postgres after crash').toBeDefined();
    expect(recovered?.runId).toBe(runId);
    expect(recovered?.stepIndex).toBeGreaterThanOrEqual(2);
    expect(recovered?.snapshot.planId).toBeTruthy();
    // Snapshot persisted by the crashed orchestrator must contain the
    // step results executed before the kill — proving zero data loss.
    expect(recovered?.snapshot.stepResults.length).toBeGreaterThanOrEqual(3);

    defaultCheckpointStore.setBackend(store);

    // ── Step 5: resume the orchestrator from the persisted ref ──────────
    const executedStepIds: string[] = [];
    const result = await runCognitiveLoop(
      recovered?.objective,
      {
        agentId,
        domain: 'test',
        maxRetries: 0,
        maxVerifyRevisions: 0,
        checkpointEveryNSteps: 100, // avoid extra checkpoints during resume
        guardianEnabled: false,
        verifierEnabled: false,
        reflectionEnabled: false,
        resumeFromCheckpoint: ref,
      },
      {
        stepExecutor: async (step) => {
          executedStepIds.push(step.stepId);
          return { resumed: true, stepId: step.stepId };
        },
      },
    );

    // ── Step 6: prove resume happened — only the unexecuted suffix ran ─
    // The child completed plan-step indices 0, 1, 2 before SIGKILL, so
    // the resumed run must execute exactly indices 3 and 4 (Verify and
    // Reflect from the baseline 5-step plan).
    const recoveredStepIds = recovered?.snapshot.stepResults.map((s) => s.stepId);
    const expectedResumedStepIds = recovered?.snapshot.phases
      .filter((p) => p.phase === 'plan')
      .flatMap((p) => {
        const out = p.output as { plan?: { executionOrder?: string[] } } | undefined;
        return out?.plan?.executionOrder ?? [];
      })
      .filter((id) => !recoveredStepIds.includes(id));

    expect(executedStepIds).toEqual(expectedResumedStepIds);
    expect(executedStepIds.length).toBeGreaterThanOrEqual(2);
    expect(result.success).toBe(true);
    expect(result.run.status).toBe('completed');
    // Snapshot results + newly executed = full plan length
    expect(result.run.stepResults.length).toBe(recoveredStepIds.length + executedStepIds.length);

    // Resume must not re-run perceive/orient/plan — they appear at most
    // once each (loaded from snapshot, never re-invoked).
    const phaseCounts = new Map<string, number>();
    for (const p of result.run.phases) {
      phaseCounts.set(p.phase, (phaseCounts.get(p.phase) ?? 0) + 1);
    }
    expect(phaseCounts.get('perceive') ?? 0).toBeLessThanOrEqual(1);
    expect(phaseCounts.get('orient') ?? 0).toBeLessThanOrEqual(1);
    expect(phaseCounts.get('plan') ?? 0).toBeLessThanOrEqual(1);
    expect(phaseCounts.get('execute') ?? 0).toBeGreaterThanOrEqual(1);

    await store.stop();
  }, 90_000);
});

if (!HAS_DB) {
}
