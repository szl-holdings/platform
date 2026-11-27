// Tests for audit-journal-skips.mjs (gap G3 / audit F2).
// Offline tests always run. The database test runs only when SZL_DB_TEST_ADMIN_URL
// points at a THROWAWAY PostgreSQL server where it may create/drop scratch
// databases; it never reads DATABASE_URL from the environment.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { loadEntries, compare } from './audit-journal-skips.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ADMIN_URL = process.env.SZL_DB_TEST_ADMIN_URL;

test('exactly the 39 entries allow-listed by check-journal.mjs are skip-risk', () => {
  const guard = fs.readFileSync(path.join(here, 'check-journal.mjs'), 'utf8');
  const block = guard.slice(guard.indexOf('HISTORICAL_NON_MONOTONIC'), guard.indexOf(']);'));
  const allow = new Set([...block.matchAll(/"(\d{4}_[a-z0-9_]+)"/g)].map((m) => m[1]));
  const skip = loadEntries().filter((e) => e.skipRisk).map((e) => e.tag);
  assert.equal(skip.length, 39);
  assert.deepEqual([...skip].sort(), [...allow].sort());
});

test('compare flags unrecorded entries and recorded-but-absent objects', () => {
  const entries = [
    { tag: 'a', hash: 'h1', skipRisk: false, creates: { tables: ['t1'], columns: [] } },
    { tag: 'b', hash: 'h2', skipRisk: true, creates: { tables: ['t2'], columns: [['t1', 'c']] } },
    { tag: 'c', hash: 'h3', skipRisk: false, creates: { tables: ['t3'], columns: [] } },
  ];
  const r = compare(entries, [{ hash: 'h1', created_at: 1 }, { hash: 'h3', created_at: 3 }, { hash: 'zz', created_at: 4 }],
    { tables: new Set(['t1']), columns: new Set() });
  assert.deepEqual(r.missingSkipRisk, ['b']);
  assert.deepEqual(r.recordedButObjectsAbsent.map((x) => x.tag), ['c']);
  assert.equal(r.unknownTrackerHashes.length, 1);
});

function fixture(entries) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'szl-skip-'));
  fs.mkdirSync(path.join(root, 'drizzle/meta'), { recursive: true });
  for (const e of entries) fs.writeFileSync(path.join(root, 'drizzle', `${e.tag}.sql`), e.sql);
  fs.writeFileSync(path.join(root, 'drizzle/meta/_journal.json'), JSON.stringify({ version: '7', dialect: 'postgresql',
    entries: entries.map((e, idx) => ({ idx, version: '7', when: e.when, tag: e.tag, breakpoints: true })) }));
  return root;
}

test('reproduces a real drizzle-orm silent skip and detects it read-only', { skip: !ADMIN_URL && 'SZL_DB_TEST_ADMIN_URL not set', timeout: 120_000 }, async () => {
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query('DROP DATABASE IF EXISTS szl_skip_test');
  await admin.query('CREATE DATABASE szl_skip_test');
  const url = new URL(ADMIN_URL); url.pathname = '/szl_skip_test';
  const first = { tag: '0000_first', when: 2000, sql: 'CREATE TABLE first_t (id int);' };
  const late = { tag: '0001_late', when: 1000, sql: 'CREATE TABLE late_t (id int);' }; // authored "earlier" but merged later
  const roots = [fixture([first]), fixture([first, late])];
  try {
    const pool = new pg.Pool({ connectionString: url.toString() });
    await migrate(drizzle(pool), { migrationsFolder: path.join(roots[0], 'drizzle') });
    await migrate(drizzle(pool), { migrationsFolder: path.join(roots[1], 'drizzle') }); // silently skips 0001_late
    const lateExists = (await pool.query("select to_regclass('public.late_t') is not null as e")).rows[0].e;
    assert.equal(lateExists, false, 'drizzle-orm skipped the late entry without error');
    const rowsBefore = (await pool.query('select count(*)::int n from drizzle.__drizzle_migrations')).rows[0].n;
    await pool.end();

    // CLI against the scratch DB, with the fixture journal (copy the script next to it)
    const scripts = path.join(roots[1], 'scripts');
    fs.mkdirSync(scripts);
    fs.copyFileSync(path.join(here, 'audit-journal-skips.mjs'), path.join(scripts, 'audit-journal-skips.mjs'));
    fs.symlinkSync(path.resolve(here, '..', 'node_modules'), path.join(roots[1], 'node_modules'), 'dir');
    const run = spawnSync(process.execPath, [path.join(scripts, 'audit-journal-skips.mjs'), '--db', '--json'],
      { env: { ...process.env, DATABASE_URL: url.toString() }, encoding: 'utf8', timeout: 30_000 });
    assert.equal(run.status, 3, run.stderr);
    const report = JSON.parse(run.stdout);
    assert.deepEqual(report.missingSkipRisk, ['0001_late']);
    assert.deepEqual(report.missing[0].missingTables, ['late_t']);

    const check = new pg.Client({ connectionString: url.toString() });
    await check.connect();
    const rowsAfter = (await check.query('select count(*)::int n from drizzle.__drizzle_migrations')).rows[0].n;
    await check.end();
    assert.equal(rowsAfter, rowsBefore, 'audit tool must not write');
  } finally {
    for (const r of roots) fs.rmSync(r, { recursive: true, force: true });
    await admin.query('DROP DATABASE IF EXISTS szl_skip_test WITH (FORCE)');
    await admin.end();
  }
});
