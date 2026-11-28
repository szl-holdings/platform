// Tests for rebuild-fresh.mjs (audit F1 / gap G2).
// Offline tests always run. The clean-database integration test runs only when
// SZL_DB_TEST_ADMIN_URL points at a THROWAWAY PostgreSQL server (pgvector
// installed) where this test may CREATE and DROP its own scratch databases.
// It never uses DATABASE_URL, so it cannot be aimed at an app database by accident.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import {
  splitTopLevel, loadBaseline, loadAllowlist, loadJournal, rebuildFresh, assertEmptyTarget,
} from './rebuild-fresh.mjs';
import { loadManualMigrations, runManualMigrations } from './apply-manual-migrations.mjs';

const DB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ADMIN_URL = process.env.SZL_DB_TEST_ADMIN_URL;

test('splitTopLevel respects quotes, dollar bodies and comments', () => {
  const sql = "select 'a;b'; -- c;d\ncreate function f() returns int as $fn$ begin return 1; end $fn$ language plpgsql; /* e;f */ select \"g;h\";";
  const parts = splitTopLevel(sql);
  assert.equal(parts.length, 3);
  assert.match(parts[1], /\$fn\$ begin return 1; end \$fn\$/);
});

test('baseline sha256 is pinned and verified', () => {
  const { meta, statements } = loadBaseline();
  assert.match(meta.sha256, /^[0-9a-f]{64}$/);
  assert.ok(statements.length > 1000);
});

test('allow-list entries all carry a reviewed reason', () => {
  const allow = loadAllowlist();
  assert.ok(allow.size > 0);
  for (const reason of allow.values()) assert.ok(reason.length > 40 && !/^TODO/i.test(reason));
});

test('journal hashes match drizzle-orm readMigrationFiles semantics', () => {
  const j = loadJournal();
  assert.equal(j.length, JSON.parse(fs.readFileSync(path.join(DB_ROOT, 'drizzle/meta/_journal.json'), 'utf8')).entries.length);
  for (const e of j) assert.match(e.hash, /^[0-9a-f]{64}$/);
});

async function withScratchDb(name, fn) {
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${name}`);
  await admin.query(`CREATE DATABASE ${name}`);
  const url = new URL(ADMIN_URL); url.pathname = `/${name}`;
  try { await fn(url.toString()); } finally {
    await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    await admin.end();
  }
}

test('clean-database rebuild from migrations', { skip: !ADMIN_URL && 'SZL_DB_TEST_ADMIN_URL not set', timeout: 300_000 }, async () => {
  await withScratchDb('szl_rebuild_fresh_test', async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      await assert.rejects(rebuildFresh({ client, confirm: 'wrong_name' }), /REBUILD_FRESH_CONFIRM/);
      const report = await rebuildFresh({ client, confirm: 'szl_rebuild_fresh_test' });
      const journal = loadJournal();
      assert.equal(report.entries.length, journal.length);

      // every table the TS schema defines exists
      const baselineTables = [...fs.readFileSync(path.join(DB_ROOT, 'baseline', report.baseline.file), 'utf8')
        .matchAll(/CREATE TABLE "([a-z0-9_]+)"/g)].map((m) => m[1]);
      const { rows } = await client.query(`select table_name from information_schema.tables where table_schema='public'`);
      const have = new Set(rows.map((r) => r.table_name));
      assert.deepEqual(baselineTables.filter((t) => !have.has(t)), []);

      // drizzle tracker: one row per journal entry with drizzle's hash; migrate() is a no-op
      const tracked = await client.query('select hash, created_at from drizzle.__drizzle_migrations order by id');
      assert.deepEqual(tracked.rows.map((r) => r.hash), journal.map((e) => e.hash));
      const pool = new pg.Pool({ connectionString: url });
      await migrate(drizzle(pool), { migrationsFolder: path.join(DB_ROOT, 'drizzle') });
      await pool.end();
      const after = await client.query('select count(*)::int n from drizzle.__drizzle_migrations');
      assert.equal(after.rows[0].n, journal.length);

      // manual tracker: nothing pending, no checksum drift
      const plan = await runManualMigrations({ client, migrations: loadManualMigrations(), dryRun: true, appliedBy: 'test' });
      assert.equal(plan.pending.length, 0);
      assert.equal(plan.drift.length, 0);

      // a second run refuses: the database is no longer empty
      await assert.rejects(assertEmptyTarget(client, 'szl_rebuild_fresh_test'), /not empty/);
    } finally {
      await client.end();
    }
  });
});
