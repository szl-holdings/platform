/**
 * warmup-shared-services.ts
 *
 * Vitest globalSetup — runs once before the entire test suite starts,
 * outside any per-test timeout budget. Pre-warms shared, cross-service
 * infrastructure that has expensive cold-start costs:
 *
 *   1. The `@szl-holdings/db` Postgres pool. The first query against a
 *      freshly-provisioned shared Postgres can take several seconds
 *      to establish the connection.
 *   2. The frontier-ingest service's `frontier_*` schema. Idempotent
 *      `CREATE TABLE IF NOT EXISTS` against a cold DB can take 7–8s on
 *      its own, which would otherwise blow per-test timeouts and produce
 *      spurious failures that mask real bugs.
 *
 * All warm-ups are best-effort: if `DATABASE_URL` is unset, or the
 * workspace pool/service modules cannot be resolved in this env, we
 * silently no-op so unit-test runs without a DB stay green. Failure to
 * warm is never fatal — the per-process lazy init in each service still
 * runs as a fallback (it's just slower).
 *
 * This is wired in via `globalSetup` in the workspace vitest configs so
 * every fork/process spawned after the warm-up sees an already-bootstrapped
 * DB schema. Subsequent per-file calls to `ensureSchema()` short-circuit
 * because the CREATE TABLE IF NOT EXISTS becomes a cheap catalog lookup
 * once the tables exist.
 */

/**
 * Diagnostic helper. When `DATABASE_URL` is set we presume the caller
 * *wanted* the warm-up to run; in that case a silent failure could mask
 * the very flake this hook exists to prevent, so we surface it on
 * stderr. Without `DATABASE_URL`, the warm-up is genuinely optional and
 * we stay quiet (unit-only runs are intentional).
 */
function reportWarmupFailure(label: string, err: unknown): void {
  if (!process.env.DATABASE_URL) return;
  const msg = err instanceof Error ? err.message : String(err);
  // eslint-disable-next-line no-console
  console.warn(`[warmup-shared-services] ${label} skipped: ${msg}`);
}

async function warmDbPool(): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  try {
    const mod = (await import('@szl-holdings/db')) as {
      pool?: { query: (text: string) => Promise<unknown> };
    };
    if (mod?.pool) {
      await mod.pool.query('SELECT 1');
    } else {
      reportWarmupFailure('db pool warm-up', 'no `pool` export found on @szl-holdings/db');
    }
  } catch (err) {
    reportWarmupFailure('db pool warm-up', err);
  }
}

async function warmFrontierIngestSchema(): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  try {
    const mod = (await import('../../services/frontier-ingest/src/db-backend.js')) as {
      ensureSchema?: () => Promise<boolean>;
    };
    if (typeof mod?.ensureSchema === 'function') {
      await mod.ensureSchema();
    } else {
      reportWarmupFailure(
        'frontier-ingest schema warm-up',
        'no `ensureSchema` export on db-backend',
      );
    }
  } catch (err) {
    reportWarmupFailure('frontier-ingest schema warm-up', err);
  }
}

export async function setup(): Promise<void> {
  // Run warm-ups in parallel — they touch independent code paths and
  // both no-op without DATABASE_URL.
  await Promise.all([warmDbPool(), warmFrontierIngestSchema()]);
}
