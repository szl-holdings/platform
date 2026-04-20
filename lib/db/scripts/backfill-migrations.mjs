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
 * 2. Walks every entry in `drizzle/meta/_journal.json`, reads the matching
 *    `<tag>.sql`, and computes the same `sha256(query)` hash drizzle-orm's
 *    `readMigrationFiles` produces.
 * 3. Inserts `(hash, created_at)` rows for every journal entry whose
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

const DATABASE_URL = process.env["DATABASE_URL"];
if (!DATABASE_URL) {
  console.error("[backfill] DATABASE_URL is not set");
  process.exit(1);
}

if (!fs.existsSync(JOURNAL_PATH)) {
  console.error(`[backfill] Cannot find journal at ${JOURNAL_PATH}`);
  process.exit(1);
}

const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, "utf8"));
if (!Array.isArray(journal.entries)) {
  console.error("[backfill] Journal is malformed — no entries[] array");
  process.exit(1);
}

/** @type {Array<{ tag: string; folderMillis: number; hash: string }>} */
const entries = [];
for (const e of journal.entries) {
  const sqlPath = path.join(MIGRATIONS_DIR, `${e.tag}.sql`);
  if (!fs.existsSync(sqlPath)) {
    console.error(
      `[backfill] Missing SQL file for journal entry ${e.tag} (expected at ${sqlPath})`,
    );
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

async function main() {
  await client.connect();
  try {
    await client.query(CREATE_SCHEMA);
    await client.query(CREATE_TABLE);

    const existing = await client.query(
      `SELECT created_at FROM "drizzle"."__drizzle_migrations"`,
    );
    const existingMillis = new Set(
      existing.rows
        .map((r) => (r.created_at == null ? null : Number(r.created_at)))
        .filter((v) => v != null),
    );

    let inserted = 0;
    let skipped = 0;
    await client.query("BEGIN");
    try {
      for (const entry of entries) {
        if (existingMillis.has(entry.folderMillis)) {
          skipped += 1;
          continue;
        }
        await client.query(
          `INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at") VALUES ($1, $2)`,
          [entry.hash, entry.folderMillis],
        );
        inserted += 1;
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }

    const total = await client.query(
      `SELECT count(*)::int AS c FROM "drizzle"."__drizzle_migrations"`,
    );
    console.log(
      `[backfill] inserted=${inserted} skipped=${skipped} total_rows=${total.rows[0].c} journal_entries=${entries.length}`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[backfill] failed:", err);
  process.exit(1);
});
