#!/usr/bin/env node
/**
 * restore-drill.mjs — restore an encrypted backup into a NEW scratch database
 * and prove it matches its manifest (restore spec R1; gap G2).
 *
 *   RESTORE_ADMIN_URL=postgresql://.../postgres   (a THROWAWAY / isolated server)
 *   BACKUP_AGE_IDENTITY_FILE=/path/to/key.txt     (age private identity; never commit, never in CI logs)
 *   RESTORE_DRILL_CONFIRM=throwaway
 *   node lib/db/scripts/restore-drill.mjs <name>.manifest.json [--keep] [--report out.json]
 *
 * Steps: verify ciphertext sha256 -> decrypt (streamed, plaintext never on
 * disk) and verify plaintext sha256 -> CREATE DATABASE restore_drill_<ts>
 * (never an existing database) -> pg_restore --exit-on-error -> assertions:
 *   - table count and EXACT per-table row counts equal the manifest
 *     (counts were taken from the same snapshot as the dump)
 *   - drizzle.__drizzle_migrations and public.__manual_migrations present
 *   - no NOT VALID constraints; every manifest extension present
 *   - every owned sequence's last_value >= max(column)
 * -> records measured RTO (restore wall clock) and RPO sample (backup age)
 * -> drops the scratch database unless --keep.
 * Exit 0 only if every assertion passes.
 */
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { libpqEnv } from './backup-encrypted.mjs';

const sha256File = (p) => new Promise((resolve, reject) => {
  const h = crypto.createHash('sha256');
  fs.createReadStream(p).on('data', (d) => h.update(d)).on('error', reject).on('end', () => resolve(h.digest('hex')));
});

export async function restoreDrill({ manifestPath, env = process.env, keep = false, log = () => {} }) {
  if (env.RESTORE_DRILL_CONFIRM !== 'throwaway') throw new Error('refusing: set RESTORE_DRILL_CONFIRM=throwaway to confirm the target server is an isolated scratch server');
  for (const k of ['RESTORE_ADMIN_URL', 'BACKUP_AGE_IDENTITY_FILE']) if (!env[k]) throw new Error(`missing required env: ${k}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.format !== 'szl-pg-backup/1') throw new Error(`unknown manifest format ${manifest.format}`);
  const encPath = path.join(path.dirname(manifestPath), manifest.artifact);
  const checks = [];
  const check = (name, ok, detail) => { checks.push({ name, ok: Boolean(ok), detail }); log(`[drill] ${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`); };

  check('ciphertext sha256 matches manifest', (await sha256File(encPath)) === manifest.ciphertext_sha256);
  if (!checks.at(-1).ok) return { ok: false, checks };

  const t0 = Date.now();
  const dbName = `restore_drill_${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`;
  const admin = new pg.Client({ connectionString: env.RESTORE_ADMIN_URL });
  await admin.connect();
  const exists = (await admin.query('select 1 from pg_database where datname = $1', [dbName])).rowCount;
  if (exists) { await admin.end(); throw new Error(`refusing: ${dbName} already exists`); }
  await admin.query(`CREATE DATABASE ${admin.escapeIdentifier(dbName)}`);
  const target = new URL(env.RESTORE_ADMIN_URL); target.pathname = `/${dbName}`;
  let ok = false;
  try {
    // decrypt -> hash -> pg_restore (stdin), plaintext only in pipes
    const age = spawn(env.AGE_BIN || 'age', ['--decrypt', '--identity', env.BACKUP_AGE_IDENTITY_FILE, encPath], { stdio: ['ignore', 'pipe', 'pipe'] });
    const restore = spawn(env.PG_RESTORE_BIN || 'pg_restore', ['--exit-on-error', '--no-owner', '--no-acl', '--single-transaction', '--dbname', dbName],
      { stdio: ['pipe', 'ignore', 'pipe'], env: { ...process.env, ...libpqEnv(target.toString()) } });
    const h = crypto.createHash('sha256'); let errs = '';
    age.stdout.on('data', (d) => h.update(d));
    restore.stdin.on('error', (e) => { errs += `pg_restore stdin: ${e.code}\n`; });
    age.stdout.pipe(restore.stdin);
    age.stderr.on('data', (d) => { errs += d; }); restore.stderr.on('data', (d) => { errs += d; });
    const exit = (p) => new Promise((resolve, reject) => { p.on('error', reject); p.on('close', resolve); });
    const [ageCode, restoreCode] = await Promise.all([exit(age), exit(restore)]);
    check('decrypt succeeded', ageCode === 0, ageCode ? errs.slice(0, 400) : undefined);
    check('plaintext sha256 matches manifest', h.digest('hex') === manifest.plaintext_sha256);
    check('pg_restore --exit-on-error succeeded', restoreCode === 0, restoreCode ? errs.slice(0, 400) : undefined);
    const rtoMs = Date.now() - t0;

    const c = new pg.Client({ connectionString: target.toString() });
    await c.connect();
    try {
      const tables = (await c.query(`select n.nspname as schema, c.relname as name from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where c.relkind in ('r','p') and n.nspname not in ('pg_catalog','information_schema') and n.nspname not like 'pg_toast%' order by 1,2`)).rows;
      check('table count equals manifest', tables.length === manifest.table_count, `${tables.length} vs ${manifest.table_count}`);
      const mismatches = [];
      for (const t of tables) {
        const key = `${t.schema}.${t.name}`;
        const n = Number((await c.query(`select count(*) as n from ${c.escapeIdentifier(t.schema)}.${c.escapeIdentifier(t.name)}`)).rows[0].n);
        if (manifest.row_counts[key] !== n) mismatches.push(`${key}: ${n} vs ${manifest.row_counts[key]}`);
      }
      for (const key of Object.keys(manifest.row_counts)) if (!tables.some((t) => `${t.schema}.${t.name}` === key)) mismatches.push(`${key}: missing`);
      check('exact per-table row counts equal manifest', mismatches.length === 0, mismatches.slice(0, 10).join('; ') || undefined);
      const reg = async (r) => (await c.query('select to_regclass($1) is not null as e', [r])).rows[0].e;
      check('drizzle.__drizzle_migrations present', await reg('drizzle.__drizzle_migrations'));
      check('public.__manual_migrations present', await reg('public.__manual_migrations'));
      const notValid = (await c.query('select count(*)::int n from pg_constraint where not convalidated')).rows[0].n;
      check('no NOT VALID constraints', notValid === 0, `${notValid}`);
      const exts = (await c.query('select extname from pg_extension')).rows.map((r) => r.extname);
      const missingExt = manifest.extensions.filter((e) => !exts.includes(e));
      check('extensions present', missingExt.length === 0, missingExt.join(',') || undefined);
      const seqs = (await c.query(`select s.relname as seq, n.nspname as schema, t.relname as tbl, a.attname as col
        from pg_depend d join pg_class s on s.oid = d.objid and s.relkind = 'S' join pg_class t on t.oid = d.refobjid
        join pg_namespace n on n.oid = t.relnamespace join pg_attribute a on a.attrelid = t.oid and a.attnum = d.refobjsubid
        where d.deptype in ('a','i')`)).rows;
      const badSeq = [];
      for (const s of seqs) {
        const q = `select (select coalesce(max(${c.escapeIdentifier(s.col)})::numeric, 0) from ${c.escapeIdentifier(s.schema)}.${c.escapeIdentifier(s.tbl)}) as mx,
          (select last_value::numeric from ${c.escapeIdentifier(s.schema)}.${c.escapeIdentifier(s.seq)}) as lv`;
        const { mx, lv } = (await c.query(q)).rows[0];
        if (Number(mx) > Number(lv)) badSeq.push(`${s.seq}: max ${mx} > last ${lv}`);
      }
      check('sequences ahead of data', badSeq.length === 0, badSeq.slice(0, 5).join('; ') || `${seqs.length} sequences`);
      ok = checks.every((x) => x.ok);
      return {
        ok, database: dbName, checks,
        measured: { rto_restore_ms: rtoMs, rpo_backup_age_ms: Date.now() - Date.parse(manifest.snapshot_taken_at) },
        source: { name: manifest.name, server_version: manifest.server_version, pg_dump_version: manifest.pg_dump_version },
        restored_server_version: (await c.query('show server_version')).rows[0].server_version,
      };
    } finally { await c.end(); }
  } finally {
    if (!keep) await admin.query(`DROP DATABASE IF EXISTS ${admin.escapeIdentifier(dbName)} WITH (FORCE)`);
    log(`[drill] scratch database ${dbName} ${keep ? 'KEPT' : 'dropped'}`);
    await admin.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const manifestPath = args.find((a) => a.endsWith('.json') && args[args.indexOf(a) - 1] !== '--report');
  const reportIdx = args.indexOf('--report');
  if (!manifestPath) { console.error('usage: restore-drill.mjs <manifest.json> [--keep] [--report out.json]'); process.exit(2); }
  restoreDrill({ manifestPath, keep: args.includes('--keep'), log: console.log }).then((r) => {
    if (reportIdx >= 0) fs.writeFileSync(args[reportIdx + 1], `${JSON.stringify(r, null, 2)}\n`);
    console.log(`[drill] ${r.ok ? 'PASS' : 'FAIL'}${r.measured ? ` — restore ${r.measured.rto_restore_ms} ms, backup age ${r.measured.rpo_backup_age_ms} ms` : ''}`);
    process.exitCode = r.ok ? 0 : 1;
  }).catch((err) => { console.error(`[drill] FAILED: ${err.message}`); process.exitCode = 1; });
}
