/**
 * Vitest setup file — runs before every test module is evaluated.
 *
 * Several modules in this workspace (notably `lib/db` via
 * `packages/env`) validate required environment variables at import
 * time using a strict zod schema. When a test file imports anything
 * that transitively pulls those modules, missing/short env vars cause
 * the whole file to fail to load before a single test executes.
 *
 * To make tests reliably bootable in any environment (CI, local, the
 * Replit api-test workflow), we pre-populate safe non-secret defaults
 * for the small set of vars enforced by the schema. We use `??=` so
 * any value already supplied by the runner takes precedence.
 *
 * NOTE: these are TEST defaults only. Production values come from the
 * Replit environment (see `setEnvVars`).
 *
 * DB POOL SETTINGS (root-cause fix for max_connections overflow and
 * inter-test deadlocks):
 *
 * Vitest reuses worker subprocesses across test files (forks pool mode).
 * Each test file (and each vi.resetModules() call within a file) imports
 * @szl-holdings/db and creates a new node-postgres Pool.  With 74+ test
 * files and multiple vi.resetModules() calls, pool instances accumulate
 * inside worker processes.  These accumulations cause two problems:
 *
 *   1. max_connections overflow – With the default min=1 and
 *      idleTimeoutMillis=60s, every pool keeps at least one connection
 *      open for 60 s after its test file finishes.  After ~30-40 files,
 *      the total connection count exceeds Postgres's limit (112).
 *      Subsequent pool.connect() calls are retried until
 *      connectionTimeoutMillis (30 s) expires — manifesting as 30-s
 *      hookTimeout failures throughout the suite.
 *
 *   2. Intra-worker deadlocks – When a test times out (describe-level or
 *      testTimeout), any in-flight supertest / HTTP request that was
 *      driving an express handler is left dangling.  That handler holds
 *      an active DB connection and may also be waiting for a second
 *      connection.  Because the pool is capped, the new test file cannot
 *      acquire a connection, so its first DB call blocks for the full
 *      connectionTimeoutMillis — matching the hookTimeout and appearing
 *      as a cascade of 30-s failures.
 *
 * Overrides applied here:
 *   DB_POOL_MIN=0          — pools start empty; no eager connections
 *   DB_POOL_MAX=10         — enough headroom for concurrent operations
 *                            per pool, but low enough to cap total DB
 *                            usage across workers
 *   DB_IDLE_TIMEOUT_MS=8000  — release idle connections after 8 s so
 *                              finished test files drain quickly
 *   DB_CONNECT_TIMEOUT_MS=5000 — fail fast if all pool slots are busy
 *                                (breaks deadlocks: handlers get a quick
 *                                error, respond 500, free the connection)
 */

const SAFE_TOKEN = 'vitest-internal-token-padding-padding-padding-1214';
if (!process.env.ALLOY_INTERNAL_TOKEN || process.env.ALLOY_INTERNAL_TOKEN.length < 32) {
  process.env.ALLOY_INTERNAL_TOKEN = SAFE_TOKEN;
}
process.env.NODE_ENV ??= 'test';

process.env.DB_POOL_MIN ??= '0';
process.env.DB_POOL_MAX ??= '10';
process.env.DB_IDLE_TIMEOUT_MS ??= '8000';
process.env.DB_CONNECT_TIMEOUT_MS ??= '5000';
