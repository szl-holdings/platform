/**
 * AEEP Alloy Runtime API — Server Entry Point
 *
 * Unified v1 API surface for task planning, memory fabric,
 * and governed workflow execution.
 *
 * Boot sequence:
 *  1. When DATABASE_URL is set, wire defaultMemoryStore to PostgresMemoryStore
 *     and hydrate from Postgres so memory entries and workflow runs written
 *     before a restart are immediately visible.
 *  2. Start listening. Fail open: without DATABASE_URL the process runs
 *     in-memory only (suitable for local development).
 */
import express, { type Express } from 'express';
import { createRouter } from './router.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4010;
const MEMORY_HYDRATE_LIMIT = parseInt(process.env.MEMORY_HYDRATE_LIMIT ?? '5000', 10);
const FLUSH_INTERVAL_MS = parseInt(process.env.PERSISTENCE_FLUSH_INTERVAL_MS ?? '1000', 10);

const app: Express = express();

app.use(express.json({ limit: '4mb' }));
app.use(createRouter());
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

async function boot(): Promise<void> {
  if (process.env.DATABASE_URL) {
    try {
      const { defaultMemoryStore, PostgresMemoryStore } = await import('@workspace/memory-fabric');
      const { db } = await import('@szl-holdings/db');
      const { memoryRecordsTable } = await import('@szl-holdings/db/schema/memory-fabric');

      const pgStore = new PostgresMemoryStore({
        db,
        memoryRecordsTable,
        flushIntervalMs: FLUSH_INTERVAL_MS,
        hydrateLimit: MEMORY_HYDRATE_LIMIT,
      });

      const totalHydrated = await pgStore.hydrate(MEMORY_HYDRATE_LIMIT).catch((err: unknown) => {
        console.warn('[alloy-runtime-api][persistence] Memory hydration failed', err);
        return 0;
      });

      defaultMemoryStore.setBackend(pgStore);

      const workflowRunsLoaded = defaultMemoryStore.count('workflow');
      const entityEntriesLoaded = defaultMemoryStore.count('entity');

      console.log(
        `[alloy-runtime-api][persistence] PostgresMemoryStore active — ` +
          `hydratedRecords=${totalHydrated} ` +
          `workflowRuns=${workflowRunsLoaded} entityEntries=${entityEntriesLoaded}`,
      );
    } catch (err) {
      console.warn(
        '[alloy-runtime-api][persistence] Postgres store init failed — staying in-memory',
        err,
      );
    }
  } else {
    console.warn(
      '[alloy-runtime-api][persistence] DATABASE_URL not set — memory fabric remains in-memory only',
    );
  }

  app.listen(PORT, () => {
    console.log(`[alloy-runtime-api] Listening on port ${PORT}`);
  });
}

boot().catch((err: unknown) => {
  console.error('[alloy-runtime-api] Boot failed', err);
  process.exit(1);
});

export { app };
