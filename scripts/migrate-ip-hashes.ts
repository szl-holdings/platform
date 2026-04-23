#!/usr/bin/env tsx
/**
 * migrate-ip-hashes.ts — Task #3146
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
import { pool } from '@szl-holdings/db';

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

/**
 * Mirrors lib/audit/src/ip-hash.ts exactly.
 * Must stay in sync if the hashing algorithm changes.
 */
function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? '';
  const hash = crypto
    .createHash('sha256')
    .update(salt + ip)
    .digest('hex')
    .slice(0, 40);
  return `sha256:${hash}`;
}

interface TableSpec {
  /** SQL table name */
  table: string;
  /** Primary key column (for batching) */
  pk: string;
}

const TABLES: TableSpec[] = [
  { table: 'activity_log',    pk: 'id' },
  { table: 'audit_events',    pk: 'id' },
  { table: 'alloy_audit_log', pk: 'id' },
  { table: 'platform_audit_log', pk: 'id' },
];

/** Batch size — keeps individual transactions small to avoid lock contention. */
const BATCH_SIZE = 500;

interface MigrationResult {
  table: string;
  rawCount: number;
  updatedCount: number;
  skipped: number;
}

async function migrateTable(spec: TableSpec): Promise<MigrationResult> {
  const { table, pk } = spec;

  const { rows: countRows } = await pool.query<{ n: string }>(
    `SELECT count(*) AS n FROM ${table} WHERE ip_address IS NOT NULL AND ip_address NOT LIKE 'sha256:%'`,
  );
  const rawCount = parseInt(countRows[0]?.n ?? '0', 10);

  if (rawCount === 0) {
    return { table, rawCount: 0, updatedCount: 0, skipped: 0 };
  }

  if (DRY_RUN) {
    return { table, rawCount, updatedCount: 0, skipped: rawCount };
  }

  let updatedCount = 0;
  let offset = 0;

  while (true) {
    const { rows } = await pool.query<{ id: number; ip_address: string }>(
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
      await pool.query(
        `UPDATE ${table} SET ip_address = $1 WHERE ${pk} = $2`,
        [hashed, row.id],
      );
      if (VERBOSE) {
        console.log(`  [${table}] id=${row.id} ${row.ip_address} → ${hashed}`);
      }
    }

    updatedCount += rows.length;
    offset += rows.length;

    if (rows.length < BATCH_SIZE) break;
  }

  // Verify no raw IPs remain.
  const { rows: remainingRows } = await pool.query<{ n: string }>(
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

async function run(): Promise<void> {
  if (!process.env.IP_HASH_SALT && process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    console.warn(
      '[migrate-ip-hashes] WARNING: IP_HASH_SALT is not set. Hashes will use an empty salt and will NOT match',
      'production hashes produced with a salt. Set IP_HASH_SALT to the production value before running.',
    );
  }

  if (DRY_RUN) {
    console.log('[migrate-ip-hashes] DRY-RUN mode — no rows will be modified.\n');
  }

  const results: MigrationResult[] = [];

  for (const spec of TABLES) {
    const result = await migrateTable(spec);
    results.push(result);
  }

  console.log('\n=== Migration Summary ===');
  let grandTotal = 0;
  for (const r of results) {
    const status = DRY_RUN
      ? `${r.rawCount} raw IPs found (dry-run — skipped)`
      : r.rawCount === 0
      ? 'no raw IPs — already clean'
      : `${r.updatedCount}/${r.rawCount} rows updated`;
    console.log(`  ${r.table.padEnd(25)} ${status}`);
    grandTotal += r.updatedCount;
  }

  if (!DRY_RUN) {
    console.log(`\n  Total rows updated: ${grandTotal}`);
  }

  console.log('\n[migrate-ip-hashes] Done.');
}

run()
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
