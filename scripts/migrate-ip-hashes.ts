#!/usr/bin/env tsx
/**
 * migrate-ip-hashes.ts — Task #1441 (backfill) / Task #3146 (original script)
 *
 * One-shot migration that finds all rows in the three primary audit tables
 * (`activity_log`, `audit_events`, `alloy_audit_log`) and the enriched
 * platform audit table (`platform_audit_log`) where `ip_address` still holds
 * a raw IP address and replaces it with the sha256-hashed equivalent produced
 * by the same algorithm used by `lib/audit/src/ip-hash.ts`.
 *
 * Why this matters
 * ----------------
 * Data-at-rest privacy policy (threat_model.md §5, docs/security/security-checklist.md §158)
 * requires that raw IPs are never persisted. The forward-looking hashing
 * middleware was added in an earlier pass; this script closes the gap for
 * existing rows written before that change landed.
 *
 * Hash format
 * -----------
 * SHA-256 of (IP_HASH_SALT + rawIp), truncated to 40 hex chars, prefixed
 * with "sha256:".  A row is considered already-hashed when its ip_address
 * value starts with "sha256:" — those rows are skipped.
 *
 * Safety
 * ------
 * - Idempotent: already-hashed rows are never touched.
 * - --dry-run: prints counts without issuing any UPDATE.
 * - Exits non-zero on DB error so CI/ops pipelines can detect failures.
 * - IMPORTANT: run with the same IP_HASH_SALT that is (or will be) set in
 *   production so that new writes and migrated rows share the same hash space.
 *
 * Usage
 * -----
 *   pnpm --filter @workspace/scripts migrate:ip-hashes            # apply
 *   pnpm --filter @workspace/scripts migrate:ip-hashes -- --dry-run
 *   pnpm --filter @workspace/scripts migrate:ip-hashes -- --verbose
 */

import crypto from 'node:crypto';

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

/** Minimal subset of pg Pool used by the migration — enables DI for tests. */
export interface MigrationPool {
  query<T extends Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[] }>;
}

/**
 * Hash an IP address using the same algorithm as lib/audit/src/ip-hash.ts.
 * Exported so tests can verify algorithm parity without importing the lib.
 *
 * IMPORTANT: must stay in sync with lib/audit/src/ip-hash.ts if the
 * hashing algorithm ever changes.
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? '';
  const hash = crypto
    .createHash('sha256')
    .update(salt + ip)
    .digest('hex')
    .slice(0, 40);
  return `sha256:${hash}`;
}

/** Returns true when a stored value is already in the hashed format. */
export function isAlreadyHashed(value: string): boolean {
  return value.startsWith('sha256:');
}

export interface TableSpec {
  /** SQL table name */
  table: string;
  /** Primary key column (for batching) */
  pk: string;
}

/** The four audit tables that require backfill. */
export const AUDIT_TABLES: TableSpec[] = [
  { table: 'activity_log',      pk: 'id' },
  { table: 'audit_events',      pk: 'id' },
  { table: 'alloy_audit_log',   pk: 'id' },
  { table: 'platform_audit_log', pk: 'id' },
];

/** Batch size — keeps individual transactions small to avoid lock contention. */
export const BATCH_SIZE = 500;

export interface MigrationResult {
  table: string;
  rawCount: number;
  updatedCount: number;
  skipped: number;
}

/**
 * Migrate a single table: hash all raw IP addresses in ip_address column.
 *
 * Exported for unit testing with a mock pool — the real entry point passes
 * the production `pool` from @szl-holdings/db.
 */
export async function migrateTable(
  spec: TableSpec,
  db: MigrationPool,
  opts: { dryRun?: boolean; verbose?: boolean } = {},
): Promise<MigrationResult> {
  const { table, pk } = spec;
  const { dryRun = false, verbose = false } = opts;

  const { rows: countRows } = await db.query<{ n: string }>(
    `SELECT count(*) AS n FROM ${table} WHERE ip_address IS NOT NULL AND ip_address NOT LIKE 'sha256:%'`,
  );
  const rawCount = parseInt(countRows[0]?.n ?? '0', 10);

  if (rawCount === 0) {
    return { table, rawCount: 0, updatedCount: 0, skipped: 0 };
  }

  if (dryRun) {
    return { table, rawCount, updatedCount: 0, skipped: rawCount };
  }

  let updatedCount = 0;

  while (true) {
    const { rows } = await db.query<{ id: number; ip_address: string }>(
      `SELECT ${pk} AS id, ip_address
         FROM ${table}
        WHERE ip_address IS NOT NULL
          AND ip_address NOT LIKE 'sha256:%'
        ORDER BY ${pk}
        LIMIT $1`,
      [BATCH_SIZE],
    );

    if (rows.length === 0) break;

    for (const row of rows) {
      const hashed = hashIp(row.ip_address);
      await db.query(
        `UPDATE ${table} SET ip_address = $1 WHERE ${pk} = $2`,
        [hashed, row.id],
      );
      if (verbose) {
        console.log(`  [${table}] id=${row.id} ${row.ip_address} → ${hashed}`);
      }
    }

    updatedCount += rows.length;

    if (rows.length < BATCH_SIZE) break;
  }

  // Verify no raw IPs remain — fail loudly rather than silently leave a gap.
  const { rows: remainingRows } = await db.query<{ n: string }>(
    `SELECT count(*) AS n FROM ${table} WHERE ip_address IS NOT NULL AND ip_address NOT LIKE 'sha256:%'`,
  );
  const remaining = parseInt(remainingRows[0]?.n ?? '0', 10);
  if (remaining > 0) {
    throw new Error(
      `[migrate-ip-hashes] Invariant violated: ${remaining} raw IP(s) remain in ${table} after migration`,
    );
  }

  return { table, rawCount, updatedCount, skipped: 0 };
}

/** Run the migration across all audit tables using the production pool. */
export async function run(
  db: MigrationPool,
  opts: { dryRun?: boolean; verbose?: boolean } = {},
): Promise<MigrationResult[]> {
  const { dryRun = false } = opts;

  if (!process.env.IP_HASH_SALT && process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    console.warn(
      '[migrate-ip-hashes] WARNING: IP_HASH_SALT is not set. Hashes will use an empty salt and will NOT match',
      'production hashes produced with a salt. Set IP_HASH_SALT to the production value before running.',
    );
  }

  if (dryRun) {
    console.log('[migrate-ip-hashes] DRY-RUN mode — no rows will be modified.\n');
  }

  const results: MigrationResult[] = [];

  for (const spec of AUDIT_TABLES) {
    const result = await migrateTable(spec, db, opts);
    results.push(result);
  }

  console.log('\n=== Migration Summary ===');
  let grandTotal = 0;
  for (const r of results) {
    const status = dryRun
      ? `${r.rawCount} raw IPs found (dry-run — skipped)`
      : r.rawCount === 0
      ? 'no raw IPs — already clean'
      : `${r.updatedCount}/${r.rawCount} rows updated`;
    console.log(`  ${r.table.padEnd(25)} ${status}`);
    grandTotal += r.updatedCount;
  }

  if (!dryRun) {
    console.log(`\n  Total rows updated: ${grandTotal}`);
  }

  console.log('\n[migrate-ip-hashes] Done.');
  return results;
}

// ── Entry point ──────────────────────────────────────────────────────────────
// Dynamic import keeps the DB pool out of the module scope so tests can import
// the exported functions without triggering a DB connection.
if (process.env.NODE_ENV !== 'test') {
  import('@szl-holdings/db').then(({ pool }) => {
    run(pool, { dryRun: DRY_RUN, verbose: VERBOSE })
      .then(async () => {
        await pool.end();
        process.exit(0);
      })
      .catch(async (err) => {
        console.error('[migrate-ip-hashes] Fatal error:', err);
        try {
          await pool.end();
        } catch {
          /* ignore */
        }
        process.exit(1);
      });
  });
}
