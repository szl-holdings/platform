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
import {
  defaultSkillRegistry,
  defaultSkillRunStore,
  PostgresSkillRegistry,
  PostgresSkillRunStore,
  builtinSkills,
  setSkillLibraryLogger,
} from "@workspace/skill-library";
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

      const pgSkillRegistry = new PostgresSkillRegistry({
        db,
        skillsTable: skillsTable as any,
        logger,
      });

      const pgSkillRunStore = new PostgresSkillRunStore({
        db,
        skillRunsTable: skillRunsTable as any,
        hydrateLimit: 2000,
      });

      const [hydratedSkills, hydratedRuns] = await Promise.all([
        pgSkillRegistry.hydrate().catch((err) => {
          logger.warn({ err }, "[persistence] Skill registry hydration failed");
          return [] as import("@workspace/skill-library").SkillDefinition[];
        }),
        pgSkillRunStore.hydrate().catch((err) => {
          logger.warn({ err }, "[persistence] Skill run store hydration failed");
          return [] as import("@workspace/skill-library").SkillRun[];
        }),
      ]);

      for (const skill of hydratedSkills) {
        defaultSkillRegistry.registerSkill(skill);
      }
      for (const run of hydratedRuns) {
        defaultSkillRunStore.saveRun(run);
      }

      defaultSkillRegistry.setBackend(pgSkillRegistry);
      defaultSkillRunStore.setBackend(pgSkillRunStore);

      const seeded = await pgSkillRegistry.seedBuiltins(builtinSkills).catch((err) => {
        logger.warn({ err }, "[persistence] Skill builtin seeding failed");
        return 0;
      });

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
            completed: (stats.byStatus["completed"] ?? 0) as number,
            failed: (stats.byStatus["failed"] ?? 0) as number,
            rolledBack: (stats.byStatus["rolled_back"] ?? 0) as number,
            pendingApproval: (stats.byStatus["pending_approval"] ?? 0) as number,
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
}> {
  const tracesEvicted = traceStore
    ? await traceStore.runRetention(TRACE_RETENTION_DAYS)
    : { cacheRemoved: 0, dbRemoved: 0 };
  const memoryEvicted = memoryStore
    ? await memoryStore.runRetention({ ephemeralMaxAgeMinutes: MEMORY_EPHEMERAL_MAX_AGE_MIN })
    : { cacheRemoved: 0, dbRemoved: 0 };
  return { tracesEvicted, memoryEvicted };
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
