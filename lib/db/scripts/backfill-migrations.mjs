#!/usr/bin/env node
/**
 * Backfill the `drizzle.__drizzle_migrations` tracking table from the
 * existing `lib/db/drizzle/_journal.json` so that the historical migrations
 * (which were applied via `drizzle-kit push` long before a tracking table
 * existed) are recorded as already-applied.
 *
 * Why this exists
 * ---------------
 * The project has been using `drizzle-kit push` to apply schema changes
 * directly to the database, which never writes to a tracking table. As a
 * result `drizzle-kit migrate` (the supported, non-interactive workflow)
 * would try to re-run every historical migration on first invocation and
 * blow up on the very first `CREATE TABLE` of an already-existing table.
 *
 * What this does
 * --------------
 * 1. Creates the `drizzle` schema and `drizzle.__drizzle_migrations` table
 *    using the exact DDL the drizzle-orm pg dialect emits in its own
 *    `migrate()` implementation (see drizzle-orm/pg-core/dialect.js).
 * 2. Checks whether the application schema is already present (by probing for
 *    the `users` table). If the database is brand-new (no tables yet) the
 *    backfill is skipped entirely so that `drizzle-kit migrate` can apply all
 *    migrations from scratch on the clean database.
 * 3. When the schema IS present, walks every entry in
 *    `drizzle/meta/_journal.json`, reads the matching `<tag>.sql`, and
 *    computes the same `sha256(query)` hash drizzle-orm's
 *    `readMigrationFiles` produces.
 * 4. Inserts `(hash, created_at)` rows for every journal entry whose
 *    `folderMillis` (the `when` field) is not already represented in the
 *    tracking table. Idempotent — safe to run multiple times.
 *
 * After this runs once, `drizzle-kit migrate` (which compares each
 * migration's `folderMillis` against the latest `created_at` in the
 * tracking table) will treat all journal entries as already-applied and
 * only execute newly-added migrations.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, "..", "drizzle");
const JOURNAL_PATH = path.join(MIGRATIONS_DIR, "meta", "_journal.json");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  process.exit(1);
}

if (!fs.existsSync(JOURNAL_PATH)) {
  process.exit(1);
}

const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, "utf8"));
if (!Array.isArray(journal.entries)) {
  process.exit(1);
}

/** @type {Array<{ tag: string; folderMillis: number; hash: string }>} */
const entries = [];
for (const e of journal.entries) {
  const sqlPath = path.join(MIGRATIONS_DIR, `${e.tag}.sql`);
  if (!fs.existsSync(sqlPath)) {
    process.exit(1);
  }
  const query = fs.readFileSync(sqlPath, "utf8");
  const hash = crypto.createHash("sha256").update(query).digest("hex");
  entries.push({ tag: e.tag, folderMillis: Number(e.when), hash });
}

const { Client } = pg;
const client = new Client({ connectionString: DATABASE_URL });

const CREATE_SCHEMA = `CREATE SCHEMA IF NOT EXISTS "drizzle"`;
const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
  )
`;

/**
 * Detect whether the application schema already exists by checking for the
 * `users` table (the first table created in migration 0000). On a brand-new
 * database this will return false and we skip the backfill, letting
 * drizzle-kit migrate apply all migrations from scratch cleanly.
 */
async function hasExistingSchema(client) {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name   = 'users'
    ) AS has_schema
  `);
  return result.rows[0].has_schema === true;
}

async function main() {
  await client.connect();
  try {
    await client.query(CREATE_SCHEMA);
    await client.query(CREATE_TABLE);

    // On a fresh database the application tables have not been created yet.
    // Skip the backfill so that drizzle-kit migrate can apply every migration
    // from scratch. Backfilling on a fresh DB would incorrectly mark all
    // migrations as "done" before they have actually been run.
    const schemaPresent = await hasExistingSchema(client);
    if (!schemaPresent) {
      return;
    }

    const existing = await client.query(
      `SELECT created_at FROM "drizzle"."__drizzle_migrations"`,
    );
    const existingMillis = new Set(
      existing.rows
        .map((r) => (r.created_at == null ? null : Number(r.created_at)))
        .filter((v) => v != null),
    );

    let _inserted = 0;
    let _skipped = 0;
    await client.query("BEGIN");
    try {
      for (const entry of entries) {
        if (existingMillis.has(entry.folderMillis)) {
          _skipped += 1;
          continue;
        }
        await client.query(
          `INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at") VALUES ($1, $2)`,
          [entry.hash, entry.folderMillis],
        );
        _inserted += 1;
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }

    const _total = await client.query(
      `SELECT count(*)::int AS c FROM "drizzle"."__drizzle_migrations"`,
    );
  } finally {
    await client.end();
  }
}

main().catch((_err) => {
  process.exit(1);
});
