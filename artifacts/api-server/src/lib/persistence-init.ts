import { defaultTraceStore, PostgresTraceStore } from "@workspace/trace-graph";
import { defaultMemoryStore, PostgresMemoryStore } from "@workspace/memory-fabric";
import { defaultPlanStore, DbPlanStore } from "@workspace/planner";
import { defaultVerifierStore, DbVerifierStore } from "@workspace/verifier";
import {
  defaultSkillRegistry,
  defaultSkillRunStore,
  PostgresSkillRegistry,
  PostgresSkillRunStore,
  builtinSkills,
  setSkillLibraryLogger,
} from "@workspace/skill-library";
import { logger } from "./logger";

let traceStore: PostgresTraceStore | undefined;
let memoryStore: PostgresMemoryStore | undefined;
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
    const { tracesTable, memoryRecordsTable, plansTable, planStepsTable, verifierResultsTable } =
      await import("@szl-holdings/db/schema");

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
        skillsTable,
        logger,
      });

      const pgSkillRunStore = new PostgresSkillRunStore({
        db,
        skillRunsTable,
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
  ]);
  logger.info("[persistence] Trace/Memory stores flushed and stopped");
}
