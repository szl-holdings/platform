#!/usr/bin/env node
/**
 * backup-encrypted.mjs — full, encrypted, verifiable PostgreSQL backup (gap G2 / G8).
 *
 * Replaces the plain, unencrypted, public-schema-only `scripts/backup-db.sh`
 * dump for the platform database:
 *   - full database (`pg_dump --format=custom`, ALL schemas, so the
 *     drizzle.__drizzle_migrations and __manual_migrations trackers are included)
 *   - taken from an exported REPEATABLE READ snapshot, and exact per-table row
 *     counts are read from that same snapshot so a restore can be verified 1:1
 *   - streamed straight into `age` public-key encryption: plaintext never
 *     touches disk; only the PUBLIC recipient is needed here, the private
 *     identity stays offline with the data owner
 *   - writes <name>.dump.age plus <name>.manifest.json (sizes, sha256 of
 *     plaintext and ciphertext, server/pg_dump versions, schema/table counts,
 *     per-table row counts). The manifest holds no data values and no secrets.
 *
 * Env:
 *   DATABASE_URL_DIRECT    source database, DIRECT/unpooled (dedicated read-only backup role);
 *                          falls back to DATABASE_URL; pooled endpoints are refused
 *   BACKUP_AGE_RECIPIENT   age public key ("age1...") — required, no unencrypted mode
 *   BACKUP_OUT_DIR         output directory (default ./backups)
 *   BACKUP_LABEL           name prefix (default "platform")
 *   PG_DUMP_BIN / AGE_BIN  binaries (default pg_dump / age on PATH)
 * Prints the manifest path on the last stdout line.
 */
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { migrationDatabaseUrl } from './migration-url.mjs';

const LIBPQ_PARAMS = { sslmode: 'PGSSLMODE', sslrootcert: 'PGSSLROOTCERT', channel_binding: 'PGCHANNELBINDING', options: 'PGOPTIONS', application_name: 'PGAPPNAME', connect_timeout: 'PGCONNECT_TIMEOUT', target_session_attrs: 'PGTARGETSESSIONATTRS' };

/**
 * Turn a postgres:// URL into libpq environment variables for child
 * processes, so the password never appears on a command line (ps, logs).
 */
export function libpqEnv(url) {
  const u = new URL(url);
  if (!/^postgres(ql)?:$/.test(u.protocol)) throw new Error('connection string must be postgres:// or postgresql://');
  const env = {};
  if (u.hostname) env.PGHOST = decodeURIComponent(u.hostname);
  if (u.port) env.PGPORT = u.port;
  if (u.username) env.PGUSER = decodeURIComponent(u.username);
  if (u.password) env.PGPASSWORD = decodeURIComponent(u.password);
  const db = decodeURIComponent(u.pathname.replace(/^\//, ''));
  if (db) env.PGDATABASE = db;
  for (const [k, v] of u.searchParams) {
    if (k === 'host') { env.PGHOST = v; continue; }
    if (!LIBPQ_PARAMS[k]) throw new Error(`unsupported connection parameter "${k}" (refusing to guess)`);
    env[LIBPQ_PARAMS[k]] = v;
  }
  return env;
}

function dumpEnv(url) {
  const pq = libpqEnv(url);
  return { ...process.env, ...pq, PGOPTIONS: `${pq.PGOPTIONS ?? ''} -c default_transaction_read_only=on`.trim() };
}

export function requireEnv(env) {
  const missing = ['BACKUP_AGE_RECIPIENT'].filter((k) => !env[k]);
  if (!env.DATABASE_URL && !env.DATABASE_URL_DIRECT) missing.unshift('DATABASE_URL_DIRECT');
  if (missing.length) throw new Error(`missing required env: ${missing.join(', ')} (no unencrypted fallback)`);
  if (!/^age1[0-9a-z]{58}$/.test(env.BACKUP_AGE_RECIPIENT.trim())) throw new Error('BACKUP_AGE_RECIPIENT is not an age X25519 public key');
}

function versionOf(bin) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, ['--version']); let out = '';
    p.stdout.on('data', (d) => { out += d; }); p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve(out.trim()) : reject(new Error(`${bin} --version exited ${code}`))));
  });
}

export async function backup(env = process.env) {
  requireEnv(env);
  // pg_dump needs a direct session (exported snapshot); pooled endpoints are refused.
  const sourceUrl = migrationDatabaseUrl(env);
  const PG_DUMP = env.PG_DUMP_BIN || 'pg_dump';
  const AGE = env.AGE_BIN || 'age';
  const outDir = path.resolve(env.BACKUP_OUT_DIR || './backups');
  fs.mkdirSync(outDir, { recursive: true, mode: 0o700 });
  const started = new Date();
  const stamp = started.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const name = `${env.BACKUP_LABEL || 'platform'}-${stamp}`;
  const encPath = path.join(outDir, `${name}.dump.age`);
  const manifestPath = path.join(outDir, `${name}.manifest.json`);

  // Hold a REPEATABLE READ snapshot open; count rows and dump from the same snapshot.
  const client = new pg.Client({ connectionString: sourceUrl, options: '-c default_transaction_read_only=on' });
  await client.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const snapshot = (await client.query('select pg_export_snapshot() as s')).rows[0].s;
    const serverVersion = (await client.query('show server_version')).rows[0].server_version;
    const database = (await client.query('select current_database() as d')).rows[0].d;
    const tables = (await client.query(`
      select n.nspname as schema, c.relname as name from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relkind in ('r','p') and n.nspname not in ('pg_catalog','information_schema') and n.nspname not like 'pg_toast%'
      order by 1, 2`)).rows;
    const rowCounts = {};
    for (const t of tables) {
      const id = `${client.escapeIdentifier(t.schema)}.${client.escapeIdentifier(t.name)}`;
      rowCounts[`${t.schema}.${t.name}`] = Number((await client.query(`select count(*) as n from ${id}`)).rows[0].n);
    }
    const extensions = (await client.query('select extname from pg_extension order by 1')).rows.map((r) => r.extname);
    const pgDumpVersion = await versionOf(PG_DUMP);

    const plainHash = crypto.createHash('sha256');
    const encHash = crypto.createHash('sha256');
    let plainBytes = 0;
    let encBytes = 0;
    const dump = spawn(PG_DUMP, ['--format=custom', '--compress=6', '--no-owner', '--no-acl', `--snapshot=${snapshot}`],
      { stdio: ['ignore', 'pipe', 'pipe'], env: dumpEnv(sourceUrl) });
    const age = spawn(AGE, ['--encrypt', '--recipient', env.BACKUP_AGE_RECIPIENT.trim()], { stdio: ['pipe', 'pipe', 'pipe'] });
    const out = fs.createWriteStream(encPath, { mode: 0o600 });
    const outClosed = new Promise((resolve, reject) => { out.on('close', resolve); out.on('error', reject); });
    let dumpErr = ''; let ageErr = '';
    dump.stderr.on('data', (d) => { dumpErr += d; });
    age.stderr.on('data', (d) => { ageErr += d; });
    dump.stdout.on('data', (chunk) => { plainHash.update(chunk); plainBytes += chunk.length; });
    dump.stdout.pipe(age.stdin);
    age.stdout.on('data', (chunk) => { encHash.update(chunk); encBytes += chunk.length; });
    age.stdout.pipe(out);
    const exit = (p) => new Promise((resolve, reject) => { p.on('error', reject); p.on('close', resolve); });
    const [dumpCode, ageCode] = await Promise.all([exit(dump), exit(age)]);
    await outClosed;
    if (dumpCode !== 0 || ageCode !== 0) {
      fs.rmSync(encPath, { force: true });
      // stderr of pg_dump can include the host but not the password; redact any URL anyway.
      const redact = (s) => s.replace(/postgres(ql)?:\/\/[^\s]+/g, 'postgresql://<redacted>');
      throw new Error(`backup failed: pg_dump=${dumpCode} age=${ageCode} ${redact(dumpErr)} ${redact(ageErr)}`.trim());
    }
    await client.query('COMMIT');
    const finished = new Date();
    const manifest = {
      format: 'szl-pg-backup/1',
      name,
      database,
      server_version: serverVersion,
      pg_dump_version: pgDumpVersion,
      snapshot_taken_at: started.toISOString(),
      finished_at: finished.toISOString(),
      duration_ms: finished - started,
      encryption: { tool: 'age', recipient: env.BACKUP_AGE_RECIPIENT.trim() },
      artifact: path.basename(encPath),
      plaintext_bytes: plainBytes,
      plaintext_sha256: plainHash.digest('hex'),
      ciphertext_bytes: encBytes,
      ciphertext_sha256: encHash.digest('hex'),
      extensions,
      table_count: tables.length,
      row_counts: rowCounts,
    };
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
    return { manifestPath, encPath, manifest };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  backup().then(({ manifestPath, manifest }) => {
    console.log(`[backup] ${manifest.table_count} tables, ${manifest.plaintext_bytes} bytes -> ${manifest.ciphertext_bytes} encrypted bytes`);
    console.log(manifestPath);
  }).catch((err) => { console.error(`[backup] FAILED: ${err.message}`); process.exitCode = 1; });
}
