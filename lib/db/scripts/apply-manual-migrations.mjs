#!/usr/bin/env node
/**
 * Apply hand-authored SQL migrations from `lib/db/migrations/` and record
 * apply state in a lightweight `__manual_migrations` tracking table.
 *
 * Why a separate tracker
 * ----------------------
 * Hand-authored migrations live alongside the Drizzle-kit journal but are
 * not part of it (different prefix sequence, parallel branches that produced
 * duplicate prefixes such as `0004_*`, `0008_*`, `0015_*`, `0016_*`).
 * Without a tracker it is impossible to know which environment has which
 * migration applied. The tracker mirrors `__drizzle_migrations` in spirit:
 * filename + sha256 checksum + apply timestamp, primary-keyed on filename
 * so re-runs are idempotent.
 *
 * Apply order
 * -----------
 * Files are applied in lexicographic (alphabetical) order. The four
 * duplicate-prefix pairs were audited (see `audit/db-verification.md` §2.2):
 *   - `0004_carlota_time_billing.sql` and `0004_signal_chain_executions.sql`
 *     touch disjoint tables (`carlota_*` vs `signal_chain_executions`).
 *   - `0008_notification_preferences_digest_config.sql` and
 *     `0008_vessels_org_scope.sql` touch disjoint tables.
 *   - `0015_on_call_schedules.sql` and `0015_team_pages.sql` touch disjoint
 *     tables; `0015_team_pages.sql` MUST run before `0016_team_pages_mute_duplicates.sql`
 *     because the latter ALTERs the table created by the former. Alphabetical
 *     order satisfies that ordering.
 *   - `0016_gateway_event_latency.sql` and `0016_team_pages_mute_duplicates.sql`
 *     touch disjoint tables.
 * All files use `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`
 * / `CREATE INDEX IF NOT EXISTS` patterns and are safe to re-apply.
 *
 * Checksum drift
 * --------------
 * If a recorded migration's file content changes after it has been applied,
 * the runner fails before applying any pending migration. Edit history must
 * be migrated by writing a new `NNNN_*.sql` file rather than mutating an
 * applied one.
 *
 * Usage
 * -----
 *   pnpm --filter @szl-holdings/db migrate:manual
 *   DATABASE_URL=... node lib/db/scripts/apply-manual-migrations.mjs
 *
 * Env:
 *   DATABASE_URL   — required, postgres connection string
 *   DRY_RUN=1      — list pending migrations without applying
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');
const DRY_RUN = process.env.DRY_RUN === '1';

const TRACKER_DDL = `
  CREATE TABLE IF NOT EXISTS "public"."__manual_migrations" (
    "filename"   TEXT PRIMARY KEY,
    "checksum"   TEXT NOT NULL,
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "applied_by" TEXT
  );
`;

export const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

export class ManualMigrationDriftError extends Error {
  constructor(drift) {
    const filenames = drift.map((entry) => entry.filename).join(', ');
    super(`Manual migration checksum drift detected: ${filenames}`);
    this.name = 'ManualMigrationDriftError';
    this.drift = drift;
  }
}

export function loadManualMigrations(migrationsDir = MIGRATIONS_DIR) {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Manual migration directory does not exist: ${migrationsDir}`);
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((filename) => filename.endsWith('.sql'))
    .sort()
    .map((filename) => {
      const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf8');
      return { filename, sql, checksum: sha256(sql) };
    });
}

export function buildMigrationPlan(migrations, appliedRows) {
  const applied = new Map(appliedRows.map((row) => [String(row.filename), String(row.checksum)]));
  const alreadyApplied = [];
  const pending = [];
  const drift = [];

  for (const migration of migrations) {
    const recordedChecksum = applied.get(migration.filename);
    if (recordedChecksum === undefined) {
      pending.push(migration);
    } else if (recordedChecksum === migration.checksum) {
      alreadyApplied.push(migration);
    } else {
      drift.push({
        filename: migration.filename,
        recordedChecksum,
        currentChecksum: migration.checksum,
      });
    }
  }

  return { alreadyApplied, pending, drift };
}

async function manualTrackerExists(client) {
  const { rows } = await client.query(
    "SELECT to_regclass('public.__manual_migrations')::text AS tracker",
  );
  return rows[0]?.tracker != null;
}

async function readAppliedRows(client, trackerExists) {
  if (!trackerExists) return [];
  const { rows } = await client.query(
    'SELECT filename, checksum FROM "public"."__manual_migrations"',
  );
  return rows;
}

async function applyPendingMigrations(client, pending, appliedBy) {
  const applied = [];
  for (const migration of pending) {
    await client.query('BEGIN');
    try {
      await client.query(migration.sql);
      await client.query(
        'INSERT INTO "public"."__manual_migrations" (filename, checksum, applied_by) VALUES ($1, $2, $3)',
        [migration.filename, migration.checksum, appliedBy],
      );
      await client.query('COMMIT');
      applied.push(migration.filename);
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    }
  }
  return applied;
}

export async function runManualMigrations({ client, migrations, dryRun, appliedBy }) {
  let trackerExists = await manualTrackerExists(client);

  // A dry-run must remain read-only. An absent tracker therefore means every
  // file is reported pending without creating the tracker as a side effect.
  if (!dryRun && !trackerExists) {
    await client.query(TRACKER_DDL);
    trackerExists = true;
  }

  const appliedRows = await readAppliedRows(client, trackerExists);
  const plan = buildMigrationPlan(migrations, appliedRows);

  // Validate the complete migration set before starting the first migration
  // transaction so a later drift cannot leave earlier pending SQL applied.
  if (plan.drift.length > 0) {
    throw new ManualMigrationDriftError(plan.drift);
  }

  const applied = dryRun ? [] : await applyPendingMigrations(client, plan.pending, appliedBy);

  return {
    mode: dryRun ? 'dry-run' : 'apply',
    trackerExists,
    total: migrations.length,
    alreadyApplied: plan.alreadyApplied.map((entry) => entry.filename),
    pending: plan.pending.map((entry) => entry.filename),
    applied,
    drift: plan.drift,
  };
}

export function formatMigrationReport(report) {
  return JSON.stringify(report, null, 2);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const migrations = loadManualMigrations();
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const report = await runManualMigrations({
      client,
      migrations,
      dryRun: DRY_RUN,
      appliedBy: `${os.userInfo().username}@${os.hostname()}`,
    });
    process.stdout.write(`${formatMigrationReport(report)}\n`);
  } finally {
    await client.end();
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
