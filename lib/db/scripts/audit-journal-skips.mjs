#!/usr/bin/env node
/**
 * audit-journal-skips.mjs — gap G3 / audit F2.
 *
 * drizzle-orm's pg migrator applies a journal entry only if its `when` is
 * greater than the newest `created_at` already in drizzle.__drizzle_migrations.
 * 39 historical entries have a `when` at or below an EARLIER entry's `when`,
 * so on any database that applied the earlier entry first they are skipped
 * silently. check-journal.mjs stops NEW cases; this tool answers the open
 * question for an EXISTING database: which of the 39 (or any other entry) are
 * missing from its tracker, and do the objects they create exist anyway?
 *
 *   node scripts/audit-journal-skips.mjs                 # offline: list the 39
 *   node scripts/audit-journal-skips.mjs --db [--json]   # read-only check of DATABASE_URL
 *
 * DB mode is strictly read-only: the session sets
 * default_transaction_read_only=on and runs in a READ ONLY transaction, so a
 * read-write role cannot write through this tool. It only reads
 * drizzle.__drizzle_migrations and pg_catalog. Run it with a read-only role
 * (audit_ro) anyway.
 *
 * Exit codes: 0 = every journal entry recorded; 3 = entries missing (report
 * lists them); 2 = usage/connection error.
 *
 * NOTE: a tracker row only proves a row was written. backfill-migrations.mjs
 * writes rows from the journal without running SQL, so for every entry the
 * report also probes whether the tables/columns it creates actually exist.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function loadEntries(root = DB_ROOT) {
  const j = JSON.parse(fs.readFileSync(path.join(root, 'drizzle/meta/_journal.json'), 'utf8'));
  let high = -Infinity;
  let highTag = null;
  return j.entries.map((e) => {
    const sql = fs.readFileSync(path.join(root, 'drizzle', `${e.tag}.sql`)).toString();
    const skipRisk = e.when <= high;
    const out = { idx: e.idx, tag: e.tag, when: e.when, hash: crypto.createHash('sha256').update(sql).digest('hex'),
      skipRisk, shadowedBy: skipRisk ? highTag : null, creates: declaredObjects(sql) };
    if (e.when > high) { high = e.when; highTag = e.tag; }
    return out;
  });
}

/** Tables and columns a migration declares (best-effort, for existence probes). */
export function declaredObjects(sql) {
  const tables = new Set();
  const columns = [];
  for (const m of sql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+(?:"?public"?\.)?"?([A-Za-z0-9_]+)"?/gi)) tables.add(m[1]);
  for (const m of sql.matchAll(/ALTER TABLE(?: ONLY)?(?: IF EXISTS)?\s+(?:"?public"?\.)?"?([A-Za-z0-9_]+)"?\s+ADD COLUMN(?: IF NOT EXISTS)?\s+"?([A-Za-z0-9_]+)"?/gi)) columns.push([m[1], m[2]]);
  return { tables: [...tables], columns };
}

export function compare(entries, trackerRows, catalog) {
  const recorded = new Set(trackerRows.map((r) => r.hash));
  const known = new Set(entries.map((e) => e.hash));
  const rows = entries.map((e) => {
    const missingTables = e.creates.tables.filter((t) => !catalog.tables.has(t));
    const missingColumns = e.creates.columns.filter(([t, c]) => !catalog.columns.has(`${t}.${c}`)).map(([t, c]) => `${t}.${c}`);
    return { tag: e.tag, skipRisk: e.skipRisk, recorded: recorded.has(e.hash), missingTables, missingColumns };
  });
  return {
    journalEntries: entries.length,
    skipRiskEntries: entries.filter((e) => e.skipRisk).length,
    trackerRows: trackerRows.length,
    missing: rows.filter((r) => !r.recorded),
    missingSkipRisk: rows.filter((r) => !r.recorded && r.skipRisk).map((r) => r.tag),
    recordedButObjectsAbsent: rows.filter((r) => r.recorded && (r.missingTables.length || r.missingColumns.length)),
    unknownTrackerHashes: trackerRows.filter((r) => !known.has(r.hash)).map((r) => ({ hash: r.hash, created_at: String(r.created_at) })),
    maxTrackerCreatedAt: trackerRows.reduce((m, r) => Math.max(m, Number(r.created_at)), 0),
  };
}

async function readDb(url) {
  const { default: pg } = await import('pg');
  const client = new pg.Client({ connectionString: url, options: '-c default_transaction_read_only=on' });
  await client.connect();
  try {
    await client.query('BEGIN READ ONLY');
    const { rows: [{ ro }] } = await client.query("select current_setting('transaction_read_only') as ro");
    if (ro !== 'on') throw new Error('session is not read-only; refusing');
    const exists = (await client.query("select to_regclass('drizzle.__drizzle_migrations') is not null as e")).rows[0].e;
    const trackerRows = exists ? (await client.query('select hash, created_at from drizzle.__drizzle_migrations')).rows : [];
    const tables = new Set((await client.query("select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p')")).rows.map((r) => r.relname));
    const columns = new Set((await client.query("select table_name||'.'||column_name as k from information_schema.columns where table_schema='public'")).rows.map((r) => r.k));
    const version = (await client.query('show server_version')).rows[0].server_version;
    await client.query('ROLLBACK');
    return { trackerExists: exists, trackerRows, catalog: { tables, columns }, version };
  } finally {
    await client.end();
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const entries = loadEntries();
  const skips = entries.filter((e) => e.skipRisk);
  if (!args.has('--db')) {
    if (args.has('--json')) { console.log(JSON.stringify(skips.map(({ creates, ...e }) => e), null, 2)); return; }
    console.log(`${skips.length} of ${entries.length} journal entries can be silently skipped on an existing database:`);
    for (const e of skips) console.log(`  ${e.tag}  when=${e.when}  <= ${e.shadowedBy}`);
    return;
  }
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL is required with --db (use a read-only role)'); process.exit(2); }
  const db = await readDb(url);
  if (!db.trackerExists) {
    console.error('drizzle.__drizzle_migrations does not exist on this database: every entry is unrecorded. Stop; reconcile per lib/db/AGENTS.md.');
    process.exitCode = 3; return;
  }
  const report = { server_version: db.version, ...compare(entries, db.trackerRows, db.catalog) };
  if (args.has('--json')) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`server ${report.server_version}: ${report.trackerRows} tracker rows, ${report.journalEntries} journal entries, ${report.skipRiskEntries} skip-risk`);
    console.log(`missing from tracker: ${report.missing.length} (of which skip-risk: ${report.missingSkipRisk.length})`);
    for (const m of report.missing) console.log(`  MISSING ${m.skipRisk ? '[skip-risk] ' : ''}${m.tag}  tables absent: ${m.missingTables.join(',') || '-'}  columns absent: ${m.missingColumns.join(',') || '-'}`);
    for (const r of report.recordedButObjectsAbsent) console.log(`  RECORDED-BUT-ABSENT ${r.tag}  tables: ${r.missingTables.join(',') || '-'}  columns: ${r.missingColumns.join(',') || '-'}`);
    if (report.unknownTrackerHashes.length) console.log(`  ${report.unknownTrackerHashes.length} tracker hashes match no journal file (edited or foreign)`);
  }
  if (report.missing.length) process.exitCode = 3;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => { console.error(err.message); process.exitCode = 2; });
}
