import { defaultTraceStore, PostgresTraceStore } from "@workspace/trace-graph";
import { defaultMemoryStore, PostgresMemoryStore } from "@workspace/memory-fabric";
import { defaultPlanStore, DbPlanStore } from "@workspace/planner";
import { defaultVerifierStore, DbVerifierStore } from "@workspace/verifier";
import {
  defaultEvidenceStore,
  defaultRecommendationStore,
  PostgresEvidenceStore,
  PostgresRecommendationStore,
  PostgresEntityRegistry,
} from "@szl-holdings/evidence-graph";
import { defaultSignalBus, PostgresSignalBusStore } from "@szl-holdings/signal-mesh";
import { defaultEntityRegistry } from "@workspace/ontology";
import { defaultSkillRegistry, defaultSkillRunStore, builtinSkills, setSkillLibraryLogger, type SkillDefinition, type SkillRun, type SkillRegistryBackend, type SkillRunStoreBackend } from '@workspace/skill-library';
import { eq, inArray, desc } from "drizzle-orm";
import { defaultCheckpointStore, PostgresCheckpointStore } from "@workspace/cognitive-runtime";
import { defaultSelfModelStore } from "@workspace/self-model";
import { registerEvalRunSink } from "@workspace/eval-forge";
import { logger } from "./logger";

let traceStore: PostgresTraceStore | undefined;
let memoryStore: PostgresMemoryStore | undefined;
let signalBusStore: PostgresSignalBusStore | undefined;
let evidenceStore: PostgresEvidenceStore | undefined;
let recommendationStore: PostgresRecommendationStore | undefined;
let entityRegistry: PostgresEntityRegistry | undefined;
let checkpointStore: PostgresCheckpointStore | undefined;
let retentionTimer: ReturnType<typeof setInterval> | undefined;

const TRACE_RETENTION_DAYS = parseInt(process.env.TRACE_RETENTION_DAYS ?? "30", 10);
const MEMORY_EPHEMERAL_MAX_AGE_MIN = parseInt(process.env.MEMORY_EPHEMERAL_MAX_AGE_MIN ?? "60", 10);
const SIGNAL_RETENTION_DAYS = parseInt(process.env.SIGNAL_RETENTION_DAYS ?? "30", 10);
const EVIDENCE_RETENTION_DAYS = parseInt(process.env.EVIDENCE_RETENTION_DAYS ?? "30", 10);
const RECOMMENDATION_RETENTION_DAYS = parseInt(process.env.RECOMMENDATION_RETENTION_DAYS ?? "90", 10);
const ENTITY_SNAPSHOT_RETENTION_DAYS = parseInt(process.env.ENTITY_SNAPSHOT_RETENTION_DAYS ?? "180", 10);
const CHECKPOINT_RETENTION_HOURS = parseInt(process.env.CHECKPOINT_RETENTION_HOURS ?? "24", 10);
const RETENTION_INTERVAL_MS = parseInt(process.env.PERSISTENCE_RETENTION_INTERVAL_MS ?? `${60 * 60 * 1000}`, 10);
const FLUSH_INTERVAL_MS = parseInt(process.env.PERSISTENCE_FLUSH_INTERVAL_MS ?? "1000", 10);
const TRACE_HYDRATE_LIMIT = parseInt(process.env.TRACE_HYDRATE_LIMIT ?? "1000", 10);
const MEMORY_HYDRATE_LIMIT = parseInt(process.env.MEMORY_HYDRATE_LIMIT ?? "5000", 10);

/**
 * Wire up Postgres-backed durability for the in-process Trace Graph and
 * Memory Fabric singletons. Both stores use a write-through cache so that
 * the synchronous TraceStore / MemoryStore interfaces are preserved while
 * data is asynchronously persisted to the platform database.
 *
 * Hydrates each cache from the database on startup so any traces/memory
 * captured prior to a restart remain visible to dashboards and APIs.
 *
 * Schedules a periodic retention sweep that prunes expired memory entries
 * and traces older than `TRACE_RETENTION_DAYS`.
 */
export async function initDurablePersistence(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    logger.info("[persistence] DATABASE_URL not set — Trace Graph and Memory Fabric remain in-memory only");
    return;
  }

  try {
    const { db } = await import("@szl-holdings/db");
    const {
      tracesTable,
      memoryRecordsTable,
      plansTable,
      planStepsTable,
      verifierResultsTable,
      meshSignalsTable,
      meshEvidenceItemsTable,
      meshEvidenceEntityLinksTable,
      meshRecommendationsTable,
      meshRecommendationDecisionsTable,
      meshEntitySnapshotsTable,
    } = await import("@szl-holdings/db/schema");

    traceStore = new PostgresTraceStore({
      db,
      tracesTable,
      flushIntervalMs: FLUSH_INTERVAL_MS,
      hydrateLimit: TRACE_HYDRATE_LIMIT,
      retentionDays: TRACE_RETENTION_DAYS,
      logger,
    });

    memoryStore = new PostgresMemoryStore({
      db,
      memoryRecordsTable,
      flushIntervalMs: FLUSH_INTERVAL_MS,
      hydrateLimit: MEMORY_HYDRATE_LIMIT,
      logger,
    });

    const [tracesLoaded, memLoaded] = await Promise.all([
      traceStore.hydrate(TRACE_HYDRATE_LIMIT).catch((err) => {
        logger.warn({ err }, "[persistence] Trace hydration failed");
        return 0;
      }),
      memoryStore.hydrate(MEMORY_HYDRATE_LIMIT).catch((err) => {
        logger.warn({ err }, "[persistence] Memory hydration failed");
        return 0;
      }),
    ]);

    defaultTraceStore.setBackend(traceStore);
    defaultMemoryStore.setBackend(memoryStore);

    try {
      signalBusStore = new PostgresSignalBusStore({
        db,
        signalsTable: meshSignalsTable,
        flushIntervalMs: FLUSH_INTERVAL_MS,
        logger,
      });
      evidenceStore = new PostgresEvidenceStore({
        db,
        evidenceItemsTable: meshEvidenceItemsTable,
        evidenceEntityLinksTable: meshEvidenceEntityLinksTable,
        flushIntervalMs: FLUSH_INTERVAL_MS,
        logger,
      });
      recommendationStore = new PostgresRecommendationStore({
        db,
        recommendationsTable: meshRecommendationsTable,
        recommendationDecisionsTable: meshRecommendationDecisionsTable,
        flushIntervalMs: FLUSH_INTERVAL_MS,
        logger,
      });
      entityRegistry = new PostgresEntityRegistry({
        db,
        entitySnapshotsTable: meshEntitySnapshotsTable,
        flushIntervalMs: FLUSH_INTERVAL_MS,
        logger,
      });

      const [hydratedSignals, evidenceLoaded, recsLoaded, entitiesLoaded] = await Promise.all([
        signalBusStore.hydrate().catch((err) => {
          logger.warn({ err }, "[persistence] Signal bus hydration failed");
          return [] as Awaited<ReturnType<PostgresSignalBusStore["hydrate"]>>;
        }),
        evidenceStore.hydrate().catch((err) => {
          logger.warn({ err }, "[persistence] Evidence store hydration failed");
          return 0;
        }),
        recommendationStore.hydrate().catch((err) => {
          logger.warn({ err }, "[persistence] Recommendation store hydration failed");
          return 0;
        }),
        entityRegistry.hydrate().catch((err) => {
          logger.warn({ err }, "[persistence] Entity registry hydration failed");
          return 0;
        }),
      ]);

      defaultSignalBus.loadBuffer(hydratedSignals);
      defaultSignalBus.setStore(signalBusStore);
      defaultEvidenceStore.setBackend(evidenceStore);
      defaultRecommendationStore.setBackend(recommendationStore);
      defaultEntityRegistry.setBackend(entityRegistry);

      logger.info(
        {
          signals: hydratedSignals.length,
          evidence: evidenceLoaded,
          recommendations: recsLoaded,
          entities: entitiesLoaded,
        },
        "[persistence] Signal Mesh (signals/evidence/recommendations/entities) backed by PostgreSQL",
      );
    } catch (err) {
      logger.warn({ err }, "[persistence] Signal Mesh DB store init failed — staying in-memory");
    }

    try {
      defaultPlanStore.setBackend(new DbPlanStore({ db, plansTable, planStepsTable }));
      logger.info("[persistence] Planner store backed by PostgreSQL");
    } catch (err) {
      logger.warn({ err }, "[persistence] Planner DB store init failed — staying in-memory");
    }

    try {
      defaultVerifierStore.setBackend(new DbVerifierStore({ db, verifierResultsTable }));
      logger.info("[persistence] Verifier store backed by PostgreSQL");
    } catch (err) {
      logger.warn({ err }, "[persistence] Verifier DB store init failed — staying in-memory");
    }

    try {
      const { skillsTable, skillRunsTable } = await import("@szl-holdings/db/schema");
      setSkillLibraryLogger(logger);

      const skillToRow = (skill: SkillDefinition) => ({
        skillId: skill.id,
        version: 1,
        latestVersion: 1,
        name: skill.name,
        description: skill.description,
        domain: skill.category,
        capability: skill.category,
        status: skill.enabled ? ("active" as const) : ("deprecated" as const),
        inputSchema: { fields: skill.inputFields } as Record<string, unknown>,
        outputSchema: { expectedOutputs: skill.expectedOutputs } as Record<string, unknown>,
        implementation: { steps: skill.steps, toolsUsed: skill.toolsUsed } as Record<string, unknown>,
        triggerConditions: [] as Record<string, unknown>[],
        tags: skill.tags,
        isBuiltin: skill.isBuiltin,
        confidence: 1.0,
        sensitivityTier: "internal" as const,
        provenanceSource: "agent",
        provenanceMethod: "agent" as const,
        metadata: {
          objective: skill.objective,
          successCriteria: skill.successCriteria,
          failureConditions: skill.failureConditions,
          performance: skill.performance,
          version: skill.version,
        } as Record<string, unknown>,
        createdAt: new Date(skill.createdAt),
        updatedAt: new Date(skill.updatedAt),
      });

      const rowToSkill = (row: Record<string, unknown>): SkillDefinition => {
        const meta = (row.metadata as Record<string, unknown>) ?? {};
        const impl = (row.implementation as Record<string, unknown>) ?? {};
        const inSchema = (row.inputSchema as Record<string, unknown>) ?? {};
        const outSchema = (row.outputSchema as Record<string, unknown>) ?? {};
        const created = row.createdAt;
        const updated = row.updatedAt;
        const toIso = (v: unknown): string => (v instanceof Date ? v.toISOString() : (v as string) ?? new Date().toISOString());
        return {
          id: row.skillId as string,
          name: row.name as string,
          description: (row.description as string) ?? "",
          category: (row.domain as SkillDefinition["category"]) ?? "analysis",
          objective: (meta.objective as string) ?? "",
          inputFields: (inSchema.fields as string[]) ?? [],
          steps: (impl.steps as SkillDefinition["steps"]) ?? [],
          toolsUsed: (impl.toolsUsed as string[]) ?? [],
          expectedOutputs: (outSchema.expectedOutputs as string[]) ?? [],
          successCriteria: (meta.successCriteria as SkillDefinition["successCriteria"]) ?? [],
          failureConditions: (meta.failureConditions as SkillDefinition["failureConditions"]) ?? [],
          performance: (meta.performance as SkillDefinition["performance"]) ?? {
            totalRuns: 0, successfulRuns: 0, failedRuns: 0, successRate: 0, avgLatencyMs: 0,
          },
          isBuiltin: (row.isBuiltin as boolean) ?? false,
          enabled: (row.status as string) !== "deprecated",
          version: (meta.version as string) ?? "1.0.0",
          tags: (row.tags as string[]) ?? [],
          createdAt: toIso(created),
          updatedAt: toIso(updated),
        };
      };

      const runToRow = (run: SkillRun) => ({
        skillId: run.skillId,
        skillVersion: 1,
        status:
          run.status === "running"
            ? ("running" as const)
            : run.status === "completed"
              ? ("completed" as const)
              : ("failed" as const),
        inputs: run.inputs,
        outputs: run.outputs ?? null,
        latencyMs: run.latencyMs ?? null,
        errorMessage: run.error ?? null,
        confidence: 1.0,
        provenanceSource: "agent",
        provenanceMethod: "agent" as const,
        metadata: { runId: run.runId, skillName: run.skillName, steps: run.steps } as Record<string, unknown>,
        startedAt: new Date(run.startedAt),
        completedAt: run.completedAt ? new Date(run.completedAt) : null,
      });

      const rowToRun = (row: Record<string, unknown>): SkillRun => {
        const meta = (row.metadata as Record<string, unknown>) ?? {};
        const toTs = (v: unknown): number | undefined => {
          if (v === null || v === undefined) return undefined;
          return v instanceof Date ? v.getTime() : Number(v);
        };
        return {
          runId: (meta.runId as string) ?? (row.id as string),
          skillId: row.skillId as string,
          skillName: (meta.skillName as string) ?? "",
          status: row.status as SkillRun["status"],
          inputs: (row.inputs as Record<string, unknown>) ?? {},
          outputs: (row.outputs as Record<string, unknown>) ?? undefined,
          steps: (meta.steps as SkillRun["steps"]) ?? [],
          error: (row.errorMessage as string | undefined) ?? undefined,
          startedAt: toTs(row.startedAt) ?? Date.now(),
          completedAt: toTs(row.completedAt),
          latencyMs: (row.latencyMs as number | undefined) ?? undefined,
        };
      };

      const skillRegistryBackend: SkillRegistryBackend = {
        async persistSkill(skill) {
          const row = skillToRow(skill);
          const existing = await db
            .select({ id: skillsTable.id })
            .from(skillsTable)
            .where(eq(skillsTable.skillId, skill.id))
            .limit(1);
          if (existing.length > 0) {
            await db
              .update(skillsTable)
              .set({ ...row, updatedAt: new Date() })
              .where(eq(skillsTable.skillId, skill.id));
          } else {
            await db.insert(skillsTable).values(row);
          }
        },
        async persistSkillUpdate(skillId, patch) {
          const updates: Record<string, unknown> = { updatedAt: new Date() };
          if (patch.name !== undefined) updates.name = patch.name;
          if (patch.description !== undefined) updates.description = patch.description;
          if (patch.tags !== undefined) updates.tags = patch.tags;
          if (patch.enabled !== undefined) updates.status = patch.enabled ? "active" : "deprecated";
          await db.update(skillsTable).set(updates).where(eq(skillsTable.skillId, skillId));
        },
      };

      const skillRunBackend: SkillRunStoreBackend = {
        async persistRun(run) {
          await db.insert(skillRunsTable).values(runToRow(run));
        },
      };

      const [skillRows, runRows] = await Promise.all([
        db.select().from(skillsTable).catch((err) => {
          logger.warn({ err }, "[persistence] Skill registry hydration failed");
          return [] as Record<string, unknown>[];
        }),
        db
          .select()
          .from(skillRunsTable)
          .orderBy(desc(skillRunsTable.startedAt))
          .limit(2000)
          .catch((err) => {
            logger.warn({ err }, "[persistence] Skill run store hydration failed");
            return [] as Record<string, unknown>[];
          }),
      ]);

      const hydratedSkills = (skillRows as Record<string, unknown>[]).map(rowToSkill);
      const hydratedRuns = (runRows as Record<string, unknown>[]).map(rowToRun);

      for (const skill of hydratedSkills) {
        defaultSkillRegistry.registerSkill(skill);
      }
      for (const run of hydratedRuns) {
        defaultSkillRunStore.saveRun(run);
      }

      defaultSkillRegistry.setBackend(skillRegistryBackend);
      defaultSkillRunStore.setBackend(skillRunBackend);

      let seeded = 0;
      try {
        const builtinIds = builtinSkills.map((s) => s.id);
        const existingRows =
          builtinIds.length > 0
            ? await db
                .select({ skillId: skillsTable.skillId })
                .from(skillsTable)
                .where(inArray(skillsTable.skillId, builtinIds))
            : [];
        const existingIds = new Set(existingRows.map((r) => r.skillId as string));
        const toInsert = builtinSkills.filter((s) => !existingIds.has(s.id));
        if (toInsert.length > 0) {
          await db.insert(skillsTable).values(toInsert.map(skillToRow));
          seeded = toInsert.length;
        }
      } catch (err) {
        logger.warn({ err }, "[persistence] Skill builtin seeding failed");
      }

      logger.info(
        { hydratedSkills: hydratedSkills.length, hydratedRuns: hydratedRuns.length, seeded },
        "[persistence] Skill Library is now durably persisted to PostgreSQL"
      );
    } catch (err) {
      logger.warn({ err }, "[persistence] Skill Library DB store init failed — staying in-memory");
    }

    // ----- Self-Model store: install Pool adapter + hydrate at boot -----
    try {
      const { pool } = await import("@szl-holdings/db");
      const { PoolSelfModelAdapter } = await import("./self-model-db-adapter");
      defaultSelfModelStore.setPersistenceAdapter(new PoolSelfModelAdapter(pool));
      const hydratedSelfModels = await defaultSelfModelStore.hydrateAll().catch((err) => {
        logger.warn({ err }, "[persistence] Self-model hydration failed");
        return 0;
      });
      logger.info({ hydratedSelfModels }, "[persistence] Self-Model store backed by PostgreSQL");
    } catch (err) {
      logger.warn({ err }, "[persistence] Self-Model adapter init failed — staying in-memory");
    }

    // ----- Orchestration checkpoints: write-behind + boot hydration -----
    try {
      const { orchestrationCheckpointsTable } = await import("@szl-holdings/db/schema");
      checkpointStore = new PostgresCheckpointStore({
        db,
        table: orchestrationCheckpointsTable,
        flushIntervalMs: FLUSH_INTERVAL_MS,
        hydrateLimit: 1000,
        logger,
      });
      const hydratedCheckpoints = await checkpointStore.hydrate().catch((err) => {
        logger.warn({ err }, "[persistence] Checkpoint hydration failed");
        return 0;
      });
      defaultCheckpointStore.setBackend(checkpointStore);
      logger.info(
        { hydratedCheckpoints },
        "[persistence] Cognitive-runtime checkpoints backed by PostgreSQL",
      );
    } catch (err) {
      logger.warn({ err }, "[persistence] Checkpoint store init failed — staying in-memory");
    }

    // ----- Eval-forge runs: register persistence sink so every runEvalSuite
    //       call lands in eval_forge_runs without route-level wiring. -----
    try {
      const { persistEvalForgeRun } = await import("./eval-forge-store");
      registerEvalRunSink((report) => {
        void persistEvalForgeRun(report).catch((err) =>
          logger.warn({ err, runId: report.runId }, "[persistence] Eval run sink failed"),
        );
      });
      logger.info("[persistence] Eval-forge run sink registered");
    } catch (err) {
      logger.warn({ err }, "[persistence] Eval sink registration failed");
    }

    try {
      const { setHistoryAdapter } = await import("@szl-holdings/action-engine");
      const {
        dbRecordRun,
        dbListRuns,
        dbGetRunById,
        dbGetHistoryStats,
        workflowRunToStored,
        storedToWorkflowRun,
      } = await import("./decisioning-store");

      setHistoryAdapter({
        recordRun: async (run) => { await dbRecordRun(workflowRunToStored(run)); },
        getRunById: async (runId, tenantId) => {
          const stored = await dbGetRunById(runId, tenantId);
          return stored ? storedToWorkflowRun(stored) : undefined;
        },
        listRuns: async (options) => {
          const result = await dbListRuns({ ...options, status: options?.status as string | undefined });
          return result.runs.map(storedToWorkflowRun);
        },
        getHistoryStats: async () => {
          const stats = await dbGetHistoryStats();
          return {
            total: stats.totalRuns,
            completed: (stats.byStatus.completed ?? 0) as number,
            failed: (stats.byStatus.failed ?? 0) as number,
            rolledBack: (stats.byStatus.rolled_back ?? 0) as number,
            pendingApproval: (stats.byStatus.pending_approval ?? 0) as number,
          };
        },
      });
      logger.info("[persistence] Action Engine history store backed by PostgreSQL (szl_decisioning_runs)");
    } catch (err) {
      logger.warn({ err }, "[persistence] Action Engine DB adapter init failed — staying in-memory");
    }

    logger.info(
      {
        tracesLoaded,
        memoryLoaded: memLoaded,
        flushIntervalMs: FLUSH_INTERVAL_MS,
        traceRetentionDays: TRACE_RETENTION_DAYS,
      },
      "[persistence] Trace Graph and Memory Fabric are now durably persisted to PostgreSQL",
    );

    if (RETENTION_INTERVAL_MS > 0) {
      retentionTimer = setInterval(() => {
        void runRetentionSweep().catch((err) => logger.warn({ err }, "[persistence] Retention sweep failed"));
      }, RETENTION_INTERVAL_MS);
      retentionTimer.unref?.();
      logger.info({ intervalMs: RETENTION_INTERVAL_MS }, "[persistence] Retention sweep scheduled");
    }
  } catch (err) {
    logger.error({ err }, "[persistence] Failed to initialize Postgres-backed Trace/Memory stores — falling back to in-memory");
  }
}

/**
 * Run a one-shot retention sweep. Removes expired memory entries from
 * cache + database and traces older than the configured retention window.
 */
export async function runRetentionSweep(): Promise<{
  tracesEvicted: { cacheRemoved: number; dbRemoved: number };
  memoryEvicted: { cacheRemoved: number; dbRemoved: number };
  signalsEvicted: { dbRemoved: number };
  evidenceEvicted: { cacheRemoved: number; dbRemoved: number };
  recommendationsEvicted: { cacheRemoved: number; dbRemoved: number };
  entitiesEvicted: { cacheRemoved: number; dbRemoved: number };
  checkpointsEvicted: { cacheRemoved: number; dbRemoved: number };
}> {
  const tracesEvicted = traceStore
    ? await traceStore.runRetention(TRACE_RETENTION_DAYS)
    : { cacheRemoved: 0, dbRemoved: 0 };
  const memoryEvicted = memoryStore
    ? await memoryStore.runRetention({ ephemeralMaxAgeMinutes: MEMORY_EPHEMERAL_MAX_AGE_MIN })
    : { cacheRemoved: 0, dbRemoved: 0 };
  const signalsEvicted = signalBusStore
    ? await signalBusStore.runRetention(SIGNAL_RETENTION_DAYS).catch((err) => {
        logger.warn({ err }, "[persistence] Signal retention failed");
        return { dbRemoved: 0 };
      })
    : { dbRemoved: 0 };
  const evidenceEvicted = evidenceStore
    ? await evidenceStore.runRetention(EVIDENCE_RETENTION_DAYS).catch((err) => {
        logger.warn({ err }, "[persistence] Evidence retention failed");
        return { cacheRemoved: 0, dbRemoved: 0 };
      })
    : { cacheRemoved: 0, dbRemoved: 0 };
  const recommendationsEvicted = recommendationStore
    ? await recommendationStore.runRetention(RECOMMENDATION_RETENTION_DAYS).catch((err) => {
        logger.warn({ err }, "[persistence] Recommendation retention failed");
        return { cacheRemoved: 0, dbRemoved: 0 };
      })
    : { cacheRemoved: 0, dbRemoved: 0 };
  const entitiesEvicted = entityRegistry
    ? await entityRegistry.runRetention(ENTITY_SNAPSHOT_RETENTION_DAYS).catch((err) => {
        logger.warn({ err }, "[persistence] Entity snapshot retention failed");
        return { cacheRemoved: 0, dbRemoved: 0 };
      })
    : { cacheRemoved: 0, dbRemoved: 0 };
  const checkpointsEvicted = checkpointStore
    ? await checkpointStore.runRetention(CHECKPOINT_RETENTION_HOURS * 60 * 60 * 1000).catch((err) => {
        logger.warn({ err }, "[persistence] Checkpoint retention failed");
        return { cacheRemoved: 0, dbRemoved: 0 };
      })
    : { cacheRemoved: 0, dbRemoved: 0 };

  if (
    signalsEvicted.dbRemoved > 0 ||
    evidenceEvicted.dbRemoved > 0 ||
    recommendationsEvicted.dbRemoved > 0 ||
    entitiesEvicted.dbRemoved > 0 ||
    checkpointsEvicted.dbRemoved > 0
  ) {
    logger.info(
      {
        signals: signalsEvicted.dbRemoved,
        evidence: evidenceEvicted.dbRemoved,
        recommendations: recommendationsEvicted.dbRemoved,
        entities: entitiesEvicted.dbRemoved,
        checkpoints: checkpointsEvicted.dbRemoved,
        signalRetentionDays: SIGNAL_RETENTION_DAYS,
        evidenceRetentionDays: EVIDENCE_RETENTION_DAYS,
        recommendationRetentionDays: RECOMMENDATION_RETENTION_DAYS,
        entitySnapshotRetentionDays: ENTITY_SNAPSHOT_RETENTION_DAYS,
        checkpointRetentionHours: CHECKPOINT_RETENTION_HOURS,
      },
      "[persistence] Signal Mesh retention sweep pruned old records",
    );
  }

  return {
    tracesEvicted,
    memoryEvicted,
    signalsEvicted,
    evidenceEvicted,
    recommendationsEvicted,
    entitiesEvicted,
    checkpointsEvicted,
  };
}

/**
 * Stop the periodic retention sweep and flush any pending writes to the
 * database. Called during graceful shutdown so no records are lost.
 */
export async function stopDurablePersistence(): Promise<void> {
  if (retentionTimer) {
    clearInterval(retentionTimer);
    retentionTimer = undefined;
  }
  await Promise.allSettled([
    traceStore?.stop(),
    memoryStore?.stop(),
    signalBusStore?.stop(),
    evidenceStore?.stop(),
    recommendationStore?.stop(),
    entityRegistry?.stop(),
    checkpointStore?.stop(),
  ]);
  logger.info("[persistence] Trace/Memory stores flushed and stopped");
}
