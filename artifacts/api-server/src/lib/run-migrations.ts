import fs from "fs";
import path from "path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "@szl-holdings/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

function getMigrationsFolder(): string {
  const relativePath = path.join("lib", "db", "drizzle");
  const replHome = process.env["REPL_HOME"];
  if (replHome) {
    const candidate = path.join(replHome, relativePath);
    if (fs.existsSync(candidate)) return candidate;
  }
  const cwdCandidate = path.resolve(process.cwd(), relativePath);
  if (fs.existsSync(cwdCandidate)) return cwdCandidate;
  return path.resolve(process.cwd(), "..", "..", relativePath);
}

/**
 * Migration sentinels — one per migration file, keyed by idx (matching
 * _journal.json). Each entry names a table (or constraint) that is provably
 * created by that migration. A migration is considered "applied" only when its
 * sentinel object actually exists in the database.
 *
 * For migrations that only alter existing tables (e.g. 0011 unique constraint),
 * we check the constraint in information_schema instead of a table.
 */
const MIGRATION_SENTINELS: Array<{
  idx: number;
  hash: string;
  when: number;
  checkSql: string;
}> = [
  { idx: 0,  hash: "8208d611b0f3372aa73313ecef59593acee19943c3352610b733356ef071e92f", when: 1774828392191, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='projects') AS ok" },
  { idx: 1,  hash: "7e2cb91ba279d8784b2c30ebdf64f6831f3b3ebadff01cdb4cee83f0f91e4ce2", when: 1774877701115, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='conversations') AS ok" },
  { idx: 2,  hash: "38c256d42d860f06bbb6adf3a178577247b4d99c81ca7400289b5da3909c1383", when: 1774900000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sites') AS ok" },
  { idx: 3,  hash: "cba3b4b3b819dc94e02d78839c0e2b90924980cbe480954a1d3c337953413a66", when: 1774960000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='terra_distress_properties') AS ok" },
  { idx: 4,  hash: "507663b5c9e6adf086865279c0a4c2df038494d9f1704a23c1b12a9d35a1185d", when: 1774965000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='alloy_owners') AS ok" },
  { idx: 5,  hash: "80d53c85b433254cc1a1a0efd9f0f088cdd6cefb52aa23c127fc7c5f9cce430c", when: 1774970000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='platform_job_runs') AS ok" },
  { idx: 6,  hash: "c1eeeb1d808ffb9424c46368492d0a03d4d0a783bf69c33210f6dd0db50b4273", when: 1774980000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='firestorm_hardening_controls') AS ok" },
  { idx: 7,  hash: "1b134b8bce42087f1d17f6eec068cd5d48f5ee707bbfe04b55cd63e4b46f89a1", when: 1774990000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='azure_tenants') AS ok" },
  { idx: 8,  hash: "babc5aff73de1c71b5c0fde3317302dd7376b077a3a7876ba58cd858f9af82d4", when: 1775000000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='lyte_dashboards') AS ok" },
  { idx: 9,  hash: "54e0120a7c4998696822cbdacf43f31b0a0a7514f53a90b978ff7cce3234adf8", when: 1775010000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='capital_artifacts') AS ok" },
  { idx: 10, hash: "9574c49aa9c175f1a49d3c9c122ae514bad3aebf9c24d449f6c1d85ac41f565b", when: 1775020000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='org_invitations') AS ok" },
  { idx: 11, hash: "54a90a08661ddab7d98de6ff119f247337ea46d3093a09602f04d743b9caa62c", when: 1775030000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.constraint_table_usage WHERE constraint_name='org_members_org_user_uq') AS ok" },
  { idx: 12, hash: "d91d5b910cabc3a6afdc3e85c97aee38eaaad6df936a5b4ab5d71811fb41730c", when: 1775040000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='platform_alloy_policies') AS ok" },
  { idx: 13, hash: "9bfa3400a4cb3fa5f222460441ab70be9d3e278a7c782792f9f81ea832dc2bf4", when: 1775050000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='terra_action_items') AS ok" },
  { idx: 14, hash: "90d57aa2d714bb2fcba9f06f068a4308bf95992cdff6ba79b689762626b643f5", when: 1775060000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='firestorm_tradecraft_decisions') AS ok" },
  { idx: 15, hash: "d850c46b99b03273f01d31e7d6d4b525b9c16b64f37c34293103ec99db576793", when: 1775070000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pc_clock_rules') AS ok" },
  { idx: 16, hash: "ed82033461de8cf753cf1d10ce69b3f69bed9cfe3ba5ba23805fdfac057605c5", when: 1775080000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='outcome_graph') AS ok" },
  { idx: 17, hash: "8a0c37d45b9b82dd3fce5c1dabf2e3f4c902b44602a4602aaad9612655805057", when: 1775090000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pc_citation_audit_reports') AS ok" },
  { idx: 18, hash: "b824d58e195d39eb7b48b0467195adb2279dfea564d4619e4f804f1b42d6071b", when: 1775100000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='nexus_situation_rooms') AS ok" },
  { idx: 19, hash: "1d4d1c2f5f30fef48c9196c36b59ef189720986dbb8cc288a8365f0a34b1be2d", when: 1775110000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='terra_brokerages') AS ok" },
  { idx: 20, hash: "89614890f4049d2c9ece580e68dea1074f8c15668841a2bb34ee8bb73ca0d264", when: 1775120000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='export_jobs') AS ok" },
  { idx: 21, hash: "ec9abcdbb47dce5a05f87144bf99ff9001e1208ae63e8128783d584decf18ab9", when: 1775130000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='feedback') AS ok" },
  { idx: 22, hash: "86d812f3215601e0e1729265cfd9f19ce87f366b9993795d5147c4f99b39aae4", when: 1775140000000, checkSql: "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pc_matters' AND column_name='practice_area') AS ok" },
];

/**
 * Ensures the Drizzle migration tracking table exists. Returns the set of
 * migration hashes already recorded in that table.
 */
async function getTrackedHashes(): Promise<Set<string>> {
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS drizzle`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);
  const rows = await db.execute<{ hash: string }>(sql`
    SELECT hash FROM drizzle.__drizzle_migrations
  `);
  return new Set(rows.rows.map((r: { hash: string }) => r.hash));
}

/**
 * For each migration not yet recorded in the tracking table, verify via SQL
 * that the migration's sentinel object actually exists in the schema before
 * marking it as applied. Only provably-applied migrations are inserted.
 *
 * This means:
 * - On a fresh DB: nothing is verified/inserted (no sentinel tables exist),
 *   so Drizzle runs all migrations normally from scratch.
 * - On a legacy DB (pre-Drizzle-tracking, fully migrated via db:push + ensure*):
 *   each migration passes its sentinel check and gets recorded, so Drizzle
 *   skips re-running already-applied SQL.
 * - On a partially-migrated DB: only the migrations whose sentinel objects
 *   exist are recorded; Drizzle runs the rest and fails loudly if SQL errors occur.
 */
async function reconcileMigrationHistory(): Promise<void> {
  const tracked = await getTrackedHashes();

  let inserted = 0;
  let verified = 0;
  for (const m of MIGRATION_SENTINELS) {
    if (tracked.has(m.hash)) {
      continue;
    }
    const result = await db.execute<{ ok: boolean }>(sql.raw(m.checkSql));
    const exists = result.rows[0]?.ok === true;
    if (exists) {
      await db.execute(sql`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES (${m.hash}, ${m.when})
      `);
      inserted++;
    }
    verified++;
  }

  logger.info(
    { checked: verified, inserted, alreadyTracked: tracked.size },
    "Migration history reconciled"
  );
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 5, delayMs = 1000): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const isConnectErr = err instanceof Error && (
        err.message.includes("timeout exceeded when trying to connect") ||
        err.message.includes("Connection terminated")
      );
      if (!isConnectErr || attempt === maxAttempts) throw err;
      logger.warn(
        { attempt, maxAttempts, delayMs },
        "DB connection unavailable during migration — retrying after delay"
      );
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw new Error("Migration retry exhausted");
}

export async function runDrizzleMigrations(): Promise<void> {
  const migrationsFolder = getMigrationsFolder();
  logger.info({ migrationsFolder }, "Running Drizzle migrations");
  await withRetry(() => reconcileMigrationHistory());
  await withRetry(() => migrate(db, { migrationsFolder }));
  logger.info("Drizzle migrations complete");
}
