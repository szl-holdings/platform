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
 * the runner logs a WARN but does not re-apply (the file is already
 * recorded as applied). Edit history must be migrated by writing a new
 * `NNNN_*.sql` file rather than mutating an applied one.
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

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, "..", "migrations");
const DRY_RUN = process.env.DRY_RUN === "1";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  process.exit(1);
}

if (!fs.existsSync(MIGRATIONS_DIR)) {
  process.exit(1);
}

const TRACKER_DDL = `
  CREATE TABLE IF NOT EXISTS "__manual_migrations" (
    "filename"   TEXT PRIMARY KEY,
    "checksum"   TEXT NOT NULL,
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "applied_by" TEXT
  );
`;

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

const files = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  process.exit(0);
}

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

try {
  await client.query(TRACKER_DDL);

  const { rows: appliedRows } = await client.query(
    'SELECT filename, checksum FROM "__manual_migrations"',
  );
  const applied = new Map(appliedRows.map((r) => [r.filename, r.checksum]));

  const appliedBy = `${os.userInfo().username}@${os.hostname()}`;

  let _appliedCount = 0;
  let _skippedCount = 0;
  let _driftCount = 0;

  for (const filename of files) {
    const filepath = path.join(MIGRATIONS_DIR, filename);
    const sql = fs.readFileSync(filepath, "utf8");
    const checksum = sha256(sql);
    const recorded = applied.get(filename);

    if (recorded) {
      if (recorded !== checksum) {
        _driftCount += 1;
      }
      _skippedCount += 1;
      continue;
    }

    if (DRY_RUN) {
      continue;
    }
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        'INSERT INTO "__manual_migrations" (filename, checksum, applied_by) VALUES ($1, $2, $3)',
        [filename, checksum, appliedBy],
      );
      await client.query("COMMIT");
      _appliedCount += 1;
    } catch (_err) {
      await client.query("ROLLBACK").catch(() => {});
      process.exit(1);
    }
  }
} finally {
  await client.end();
}
