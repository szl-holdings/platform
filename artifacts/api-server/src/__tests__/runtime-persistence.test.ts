/**
 * Runtime Persistence — Restart Survival Tests
 *
 * Verifies Task #1913: in-memory runtime state for ALL six subsystems is
 * durable across a process restart with ≤1s data-loss budget.
 *
 *   1. Trace Graph                (defaultTraceStore + MutableTraceStore)
 *   2. Memory Fabric / NEXUS mem  (defaultMemoryStore + MutableMemoryStore)
 *   3. Skill Registry + Run Log   (defaultSkillRegistry + defaultSkillRunStore)
 *   4. Self-Model Store           (defaultSelfModelStore.hydrateAll)
 *   5. Eval Suite Results         (registerEvalRunSink → persistEvalForgeRun)
 *   6. Orchestration Checkpoints  (defaultCheckpointStore + MutableCheckpointStore)
 *
 * Each test populates a "before crash" store, then simulates a process
 * restart by constructing fresh in-memory front-ends bound to the SAME
 * persistence backend (a Map/InMemory store standing in for Postgres),
 * and finally verifies that hydration recovers the saved data.
 */

import { describe, it, expect, beforeEach } from "vitest";

import {
  MutableTraceStore,
  InMemoryTraceStore,
  type TraceRecord,
} from "@workspace/trace-graph";

import {
  MutableMemoryStore,
  InMemoryStore as InMemoryMemoryStore,
  type MemoryEntry,
} from "@workspace/memory-fabric";

import {
  InMemorySkillRegistry,
  InMemorySkillRunStore,
  type SkillDefinition,
  type SkillRun,
  type SkillRegistryBackend,
  type SkillRunStoreBackend,
} from "@workspace/skill-library";

import {
  SelfModelStore,
  type SelfModelPersistenceAdapter,
  type SelfModelState,
  type IdentityProfile,
} from "@workspace/self-model";

import {
  MutableCheckpointStore,
  InMemoryCheckpointStore,
  saveCheckpoint,
  type CheckpointEntry,
  type CognitiveLoopRun,
} from "@workspace/cognitive-runtime";

import {
  registerEvalRunSink,
  runEvalSuite,
  type EvalRunReport,
  type EvalSuiteDef,
  type EvalExecutor,
} from "@workspace/eval-forge";

// ---------------------------------------------------------------------------
// Helper: fake "Postgres" backends — Maps that survive simulated restarts
// ---------------------------------------------------------------------------

function makeFakeSkillBackend(skillDb: Map<string, SkillDefinition>): SkillRegistryBackend {
  return {
    async persistSkill(skill) {
      skillDb.set(skill.id, { ...skill });
    },
    async persistSkillUpdate(skillId, patch) {
      const existing = skillDb.get(skillId);
      if (existing) skillDb.set(skillId, { ...existing, ...patch });
    },
  };
}

function makeFakeSkillRunBackend(runDb: Map<string, SkillRun>): SkillRunStoreBackend {
  return {
    async persistRun(run) {
      runDb.set(run.runId, { ...run });
    },
  };
}

class FakeSelfModelAdapter implements SelfModelPersistenceAdapter {
  constructor(private readonly db: Map<string, SelfModelState>) {}
  async saveModel(agentId: string, model: SelfModelState): Promise<void> {
    this.db.set(agentId, JSON.parse(JSON.stringify(model)));
  }
  async saveSnapshot(): Promise<void> { /* noop for restart test */ }
  async loadModel(agentId: string): Promise<SelfModelState | null> {
    return this.db.get(agentId) ?? null;
  }
  async loadHistory(): Promise<SelfModelState[]> { return []; }
  async loadAll(): Promise<SelfModelState[]> {
    return Array.from(this.db.values()).map((m) => JSON.parse(JSON.stringify(m)));
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeTrace(id: string): TraceRecord {
  return {
    traceId: id,
    startedAt: new Date().toISOString(),
    status: "completed" as const,
    retries: 0,
    toolCalls: [],
    metadata: { domain: "test" },
  } as TraceRecord;
}

function makeMemoryEntry(id: string): MemoryEntry {
  const now = new Date().toISOString();
  return {
    id,
    domain: "MEMORY_DOMAIN_UNKNOWN",
    tier: "semantic",
    key: `key-${id}`,
    value: { v: id },
    summary: `summary-${id}`,
    provenance: { source: "test", method: "agent", createdAt: now },
    freshness: { lastUpdatedAt: now, isStale: false },
    confidence: 0.9,
    retention: { policy: "persistent", pinned: false },
    sensitivity: "internal",
    linkedEntities: [],
    linkedTraces: [],
    linkedActions: [],
    tags: [],
    metadata: {},
  } as MemoryEntry;
}

function makeSkill(id: string): SkillDefinition {
  const now = new Date().toISOString();
  return {
    id,
    name: `Skill ${id}`,
    description: `Test skill ${id}`,
    category: "analysis",
    objective: "test",
    inputFields: [],
    steps: [],
    toolsUsed: [],
    expectedOutputs: [],
    successCriteria: [],
    failureConditions: [],
    performance: {
      totalRuns: 0,
      successCount: 0,
      failureCount: 0,
      avgLatencyMs: 0,
      avgCostUsd: 0,
      successRate: 0,
    },
    isBuiltin: false,
    enabled: true,
    version: "1.0.0",
    tags: [],
    createdAt: now,
    updatedAt: now,
  } as SkillDefinition;
}

function makeSkillRun(runId: string, skillId: string): SkillRun {
  return {
    runId,
    skillId,
    skillName: `Skill ${skillId}`,
    status: "completed",
    inputs: {},
    outputs: { ok: true },
    steps: [],
    startedAt: Date.now(),
    completedAt: Date.now(),
    latencyMs: 10,
  } as SkillRun;
}

function makeIdentity(agentId: string): IdentityProfile {
  return {
    runtimeId: agentId,
    name: `Agent ${agentId}`,
    role: "test-analyst",
    domain: "test",
    environment: "production",
    governanceTier: "internal",
  } as IdentityProfile;
}

function makeCognitiveRun(runId: string, agentId: string): CognitiveLoopRun {
  return {
    runId,
    objective: `objective-${runId}`,
    currentPhase: "execute",
    status: "running",
    startedAt: Date.now(),
    context: { agentId, sessionId: "s-1", workflowId: "w-1" },
    phases: [],
    stepResults: [],
    verifyRevisions: 0,
    planRevisions: 0,
    memoryIds: [],
    metadata: {},
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("runtime-persistence — restart survival across all 6 subsystems", () => {
  describe("(1) Trace Graph survives restart", () => {
    it("a fresh MutableTraceStore re-bound to the same backend recovers all traces", () => {
      const sharedBackend = new InMemoryTraceStore();
      const beforeCrash = new MutableTraceStore(sharedBackend);
      beforeCrash.save(makeTrace("t-A"));
      beforeCrash.save(makeTrace("t-B"));
      beforeCrash.save(makeTrace("t-C"));
      expect(beforeCrash.count()).toBe(3);

      // --- simulate process crash + restart ---
      const afterRestart = new MutableTraceStore(new InMemoryTraceStore());
      expect(afterRestart.count()).toBe(0);
      afterRestart.setBackend(sharedBackend); // boot wiring re-points to durable store

      expect(afterRestart.count()).toBe(3);
      expect(afterRestart.get("t-A")?.traceId).toBe("t-A");
      expect(afterRestart.get("t-B")?.traceId).toBe("t-B");
      expect(afterRestart.get("t-C")?.traceId).toBe("t-C");
    });
  });

  describe("(2) Memory Fabric / NEXUS memory survives restart", () => {
    it("a fresh MutableMemoryStore re-bound to the same backend recovers all records", () => {
      const sharedBackend = new InMemoryMemoryStore();
      const beforeCrash = new MutableMemoryStore(sharedBackend);
      beforeCrash.put(makeMemoryEntry("m-1"));
      beforeCrash.put(makeMemoryEntry("m-2"));
      expect(beforeCrash.count()).toBe(2);

      const afterRestart = new MutableMemoryStore(new InMemoryMemoryStore());
      expect(afterRestart.count()).toBe(0);
      afterRestart.setBackend(sharedBackend);

      const restored = afterRestart.list();
      expect(restored.length).toBe(2);
      expect(restored.map((r) => r.id).sort()).toEqual(["m-1", "m-2"]);
    });
  });

  describe("(3) Skill Registry + Run Log survives restart", () => {
    it("registers skills/runs through backend, then a fresh registry hydrates them", async () => {
      const skillDb = new Map<string, SkillDefinition>();
      const runDb = new Map<string, SkillRun>();

      const beforeRegistry = new InMemorySkillRegistry();
      const beforeRunStore = new InMemorySkillRunStore();
      beforeRegistry.setBackend(makeFakeSkillBackend(skillDb));
      beforeRunStore.setBackend(makeFakeSkillRunBackend(runDb));

      beforeRegistry.registerSkill(makeSkill("skill-alpha"));
      beforeRegistry.registerSkill(makeSkill("skill-beta"));
      beforeRunStore.saveRun(makeSkillRun("run-1", "skill-alpha"));
      beforeRunStore.saveRun(makeSkillRun("run-2", "skill-beta"));

      // Allow async backend persistSkill / persistRun to complete.
      await new Promise((r) => setImmediate(r));

      expect(skillDb.size).toBe(2);
      expect(runDb.size).toBe(2);

      // --- simulate crash + restart: fresh in-memory front-ends, hydrate
      // from the same "DB" — mirrors persistence-init.ts boot flow. ---
      const afterRegistry = new InMemorySkillRegistry();
      const afterRunStore = new InMemorySkillRunStore();
      for (const skill of skillDb.values()) afterRegistry.registerSkill(skill);
      for (const run of runDb.values()) afterRunStore.saveRun(run);

      expect(afterRegistry.count()).toBe(2);
      expect(afterRegistry.getSkill("skill-alpha")?.name).toBe("Skill skill-alpha");
      expect(afterRunStore.countRuns()).toBe(2);
      expect(afterRunStore.getRun("run-1")?.skillId).toBe("skill-alpha");
    });
  });

  describe("(4) Self-Model store survives restart", () => {
    it("create+update through adapter then hydrateAll on a fresh store recovers state", async () => {
      const db = new Map<string, SelfModelState>();
      const adapter = new FakeSelfModelAdapter(db);

      const beforeStore = new SelfModelStore();
      beforeStore.setPersistenceAdapter(adapter);
      beforeStore.create({ agentId: "agent-zeta", identityProfile: makeIdentity("agent-zeta") });
      beforeStore.update("agent-zeta", { driftScore: 0.42 }, "test-update", "test-suite");

      // Allow async saveModel to settle.
      await new Promise((r) => setImmediate(r));
      expect(db.has("agent-zeta")).toBe(true);
      expect(db.get("agent-zeta")?.driftScore).toBeCloseTo(0.42);

      // --- simulate crash + restart: fresh store, same adapter, hydrateAll ---
      const afterStore = new SelfModelStore();
      afterStore.setPersistenceAdapter(adapter);
      const hydrated = await afterStore.hydrateAll();

      expect(hydrated).toBe(1);
      const recovered = afterStore.get("agent-zeta");
      expect(recovered).toBeDefined();
      expect(recovered?.driftScore).toBeCloseTo(0.42);
      expect(recovered?.identityProfile.runtimeId).toBe("agent-zeta");
    });
  });

  describe("(5) Eval suite results are routed through the persistence sink", () => {
    beforeEach(() => {
      registerEvalRunSink(null);
    });

    it("registerEvalRunSink captures every runEvalSuite report for durable persistence", async () => {
      const reportDb: EvalRunReport[] = [];
      registerEvalRunSink((r) => {
        reportDb.push(r);
      });

      const suite: EvalSuiteDef = {
        suiteId: "suite-restart",
        name: "Restart Suite",
        domain: "test",
        description: "",
        version: 1,
        tags: [],
        cases: [
          {
            id: "case-1",
            label: "case 1",
            domain: "test",
            graderType: "tool-reliability",
            input: { x: 1 },
            groundTruth: { result: 1 },
          },
        ],
      };

      const executor: EvalExecutor = async () => ({
        output: { result: 1 },
        latencyMs: 1,
        costUsd: 0,
        tokensUsed: 0,
        traceId: "trace-1",
      });

      const report = await runEvalSuite(suite, executor, { runId: "eval-restart-1" });
      // Sink callbacks may run synchronously or as microtasks.
      await new Promise((r) => setImmediate(r));

      expect(reportDb.length).toBe(1);
      expect(reportDb[0]!.runId).toBe("eval-restart-1");
      expect(reportDb[0]!.totalCases).toBe(1);
      expect(report.runId).toBe("eval-restart-1");

      // --- simulate crash: drop in-memory list, re-register sink, run again.
      // After "restart", new runs continue to be persisted via the same path
      // and pre-restart records remain in the durable Map (reportDb). ---
      const afterRestartDb: EvalRunReport[] = [...reportDb];
      registerEvalRunSink((r) => {
        afterRestartDb.push(r);
      });
      await runEvalSuite(suite, executor, { runId: "eval-restart-2" });
      await new Promise((r) => setImmediate(r));

      expect(afterRestartDb.length).toBe(2);
      expect(afterRestartDb.map((r) => r.runId).sort()).toEqual([
        "eval-restart-1",
        "eval-restart-2",
      ]);
    });
  });

  describe("(6) Orchestration checkpoints survive restart", () => {
    it("a fresh MutableCheckpointStore re-bound to the same backend recovers in-flight runs", () => {
      const sharedBackend = new InMemoryCheckpointStore();
      const beforeCrash = new MutableCheckpointStore(sharedBackend);

      const ref1 = saveCheckpoint(makeCognitiveRun("run-X", "agent-1"), 2, beforeCrash);
      const ref2 = saveCheckpoint(makeCognitiveRun("run-Y", "agent-2"), 5, beforeCrash);

      expect(beforeCrash.list().length).toBe(2);
      expect(beforeCrash.load(ref1)?.runId).toBe("run-X");

      // --- simulate crash + restart: fresh wrapper, swap to same backend
      // (mirrors persistence-init.ts which calls
      //  `defaultCheckpointStore.setBackend(checkpointStore)` after hydrate). ---
      const afterRestart = new MutableCheckpointStore(new InMemoryCheckpointStore());
      expect(afterRestart.list().length).toBe(0);
      afterRestart.setBackend(sharedBackend);

      expect(afterRestart.list().length).toBe(2);
      const recovered: CheckpointEntry | undefined = afterRestart.load(ref1);
      expect(recovered?.runId).toBe("run-X");
      expect(recovered?.stepIndex).toBe(2);
      expect(recovered?.snapshot.objective).toBe("objective-run-X");
      expect(afterRestart.load(ref2)?.runId).toBe("run-Y");
      expect(afterRestart.listByAgent("agent-2").length).toBe(1);
    });
  });

  describe("(7) PostgresCheckpointStore — write-behind flush + crash/hydrate against fake DB", () => {
    /**
     * Builds a fake `CheckpointDb` that stores rows in an in-memory Map but
     * implements the same Drizzle-builder shape the real store uses. This
     * lets us exercise the full flush + hydrate code path (timer fires, row
     * is built, insert builder is awaited, hydrate reads back from select)
     * without spinning up Postgres in unit tests.
     */
    function makeFakeCheckpointDb() {
      const rows = new Map<string, Record<string, unknown>>();
      const insertCalls: Array<{ ref: string }> = [];
      const deleteCalls: Array<{ ref: string }> = [];

      const fakeTable = {
        ref: { name: "ref" },
        runId: { name: "runId" },
        agentId: { name: "agentId" },
        createdAt: { name: "createdAt" },
        expiresAt: { name: "expiresAt" },
      };

      const db = {
        select() {
          return {
            from() {
              return {
                orderBy() {
                  return {
                    async limit() {
                      return Array.from(rows.values());
                    },
                  };
                },
              };
            },
          };
        },
        insert() {
          return {
            values(row: Record<string, unknown>) {
              return {
                async onConflictDoUpdate() {
                  const ref = row["ref"] as string;
                  rows.set(ref, row);
                  insertCalls.push({ ref });
                },
              };
            },
          };
        },
        delete() {
          return {
            async where(_clause: unknown) {
              const refsToDelete: string[] = [];
              for (const [ref, _row] of rows) {
                refsToDelete.push(ref);
                deleteCalls.push({ ref });
              }
              for (const ref of refsToDelete) rows.delete(ref);
              return { rowCount: refsToDelete.length };
            },
          };
        },
      };

      return { db, fakeTable, rows, insertCalls, deleteCalls };
    }

    it("flushes pending writes to the DB within the configured interval (≤1s budget)", async () => {
      const { PostgresCheckpointStore } = await import("@workspace/cognitive-runtime");
      const { db, fakeTable, rows, insertCalls } = makeFakeCheckpointDb();

      const store = new PostgresCheckpointStore({
        db: db as unknown as Parameters<typeof PostgresCheckpointStore>[0]["db"],
        table: fakeTable as unknown as Parameters<typeof PostgresCheckpointStore>[0]["table"],
        flushIntervalMs: 50,
        hydrateLimit: 100,
      });

      // Save through the store: synchronous, lands in cache + dirty set.
      const ref = saveCheckpoint(makeCognitiveRun("run-flush-1", "agent-flush"), 3, store);
      expect(store.load(ref)?.runId).toBe("run-flush-1");
      expect(rows.size).toBe(0); // not yet flushed to DB

      // Wait past one flush tick — must be persisted within the budget.
      await new Promise((r) => setTimeout(r, 150));

      expect(insertCalls.length).toBeGreaterThanOrEqual(1);
      expect(rows.size).toBe(1);
      expect(rows.get(ref)?.["ref"]).toBe(ref);

      await store.stop();
    });

    it("a fresh PostgresCheckpointStore hydrates prior runs from the same DB after simulated crash", async () => {
      const { PostgresCheckpointStore } = await import("@workspace/cognitive-runtime");
      const { db, fakeTable, rows } = makeFakeCheckpointDb();

      // --- Boot 1: write some checkpoints, force flush, then "crash". ---
      const before = new PostgresCheckpointStore({
        db: db as unknown as Parameters<typeof PostgresCheckpointStore>[0]["db"],
        table: fakeTable as unknown as Parameters<typeof PostgresCheckpointStore>[0]["table"],
        flushIntervalMs: 0, // disable timer; flush manually
      });

      const refA = saveCheckpoint(makeCognitiveRun("run-crash-A", "agent-A"), 1, before);
      const refB = saveCheckpoint(makeCognitiveRun("run-crash-B", "agent-B"), 7, before);

      await before.flush();
      expect(rows.size).toBe(2);
      // simulate crash: drop the in-memory store entirely.

      // --- Boot 2: brand new store backed by same DB. Hydrate should
      //     repopulate the cache so callers see the prior runs. ---
      const after = new PostgresCheckpointStore({
        db: db as unknown as Parameters<typeof PostgresCheckpointStore>[0]["db"],
        table: fakeTable as unknown as Parameters<typeof PostgresCheckpointStore>[0]["table"],
        flushIntervalMs: 0,
      });
      const recoveredCount = await after.hydrate();

      expect(recoveredCount).toBe(2);
      expect(after.load(refA)?.runId).toBe("run-crash-A");
      expect(after.load(refA)?.stepIndex).toBe(1);
      expect(after.load(refB)?.runId).toBe("run-crash-B");
      expect(after.listByAgent("agent-B").length).toBe(1);
    });

    it("stop() flushes any pending writes before resolving (graceful-shutdown contract)", async () => {
      const { PostgresCheckpointStore } = await import("@workspace/cognitive-runtime");
      const { db, fakeTable, rows } = makeFakeCheckpointDb();

      const store = new PostgresCheckpointStore({
        db: db as unknown as Parameters<typeof PostgresCheckpointStore>[0]["db"],
        table: fakeTable as unknown as Parameters<typeof PostgresCheckpointStore>[0]["table"],
        flushIntervalMs: 60_000, // long enough that timer won't fire during test
      });

      saveCheckpoint(makeCognitiveRun("run-shutdown", "agent-S"), 0, store);
      expect(rows.size).toBe(0);

      await store.stop();

      expect(rows.size).toBe(1);
    });
  });
});
