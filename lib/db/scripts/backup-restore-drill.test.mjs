// Tests for backup-encrypted.mjs + restore-drill.mjs (gap G2).
// Offline tests always run. The round-trip test needs SZL_DB_TEST_ADMIN_URL
// (a THROWAWAY server where scratch databases may be created/dropped) and the
// `age` / `age-keygen` binaries; it generates a one-off key in a temp dir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import pg from 'pg';
import { libpqEnv, requireEnv, backup } from './backup-encrypted.mjs';
import { restoreDrill } from './restore-drill.mjs';

const ADMIN_URL = process.env.SZL_DB_TEST_ADMIN_URL;
const hasAge = spawnSync('age', ['--version']).status === 0;

test('libpqEnv keeps the password out of argv and rejects unknown params', () => {
  const e = libpqEnv('postgresql://u%40x:p%2Fw@db.example:6543/app?sslmode=require');
  assert.deepEqual(e, { PGHOST: 'db.example', PGPORT: '6543', PGUSER: 'u@x', PGPASSWORD: 'p/w', PGDATABASE: 'app', PGSSLMODE: 'require' });
  assert.throws(() => libpqEnv('postgresql://h/db?sslkey=/etc/x'), /unsupported connection parameter/);
  assert.throws(() => libpqEnv('mysql://h/db'), /postgres/);
});

test('backup refuses to run without an age recipient (no unencrypted mode)', () => {
  assert.throws(() => requireEnv({ DATABASE_URL: 'postgresql://h/db' }), /BACKUP_AGE_RECIPIENT/);
  assert.throws(() => requireEnv({ DATABASE_URL: 'postgresql://h/db', BACKUP_AGE_RECIPIENT: 'not-a-key' }), /age X25519/);
});

test('restore drill refuses without explicit throwaway confirmation', async () => {
  await assert.rejects(restoreDrill({ manifestPath: '/nonexistent.json', env: {} }), /RESTORE_DRILL_CONFIRM/);
});

test('encrypted backup -> restore drill round trip, and tamper detection', { skip: (!ADMIN_URL && 'SZL_DB_TEST_ADMIN_URL not set') || (!hasAge && 'age not installed'), timeout: 300_000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'szl-backup-test-'));
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query('DROP DATABASE IF EXISTS szl_backup_src_test');
  await admin.query('CREATE DATABASE szl_backup_src_test');
  const src = new URL(ADMIN_URL); src.pathname = '/szl_backup_src_test';
  try {
    const c = new pg.Client({ connectionString: src.toString() });
    await c.connect();
    await c.query(`CREATE SCHEMA drizzle; CREATE TABLE drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint);
      CREATE TABLE public.__manual_migrations (filename text primary key, checksum text not null);
      CREATE TABLE public.users (id serial primary key, email text not null);
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('h', 1);
      INSERT INTO public.users (email) SELECT 'synthetic' || g || '@example.invalid' FROM generate_series(1, 250) g;`);
    await c.end();
    const key = path.join(dir, 'key.txt');
    assert.equal(spawnSync('age-keygen', ['-o', key]).status, 0);
    const recipient = spawnSync('age-keygen', ['-y', key], { encoding: 'utf8' }).stdout.trim();
    const { manifestPath, encPath, manifest } = await backup({ ...process.env, DATABASE_URL: src.toString(), BACKUP_AGE_RECIPIENT: recipient, BACKUP_OUT_DIR: dir });
    assert.equal(manifest.row_counts['public.users'], 250);
    assert.ok(fs.readFileSync(encPath).subarray(0, 21).toString() === 'age-encryption.org/v1', 'artifact is age-encrypted');
    assert.ok(!fs.readFileSync(encPath).includes('example.invalid'), 'no plaintext rows in artifact');

    const env = { ...process.env, RESTORE_ADMIN_URL: ADMIN_URL, BACKUP_AGE_IDENTITY_FILE: key, RESTORE_DRILL_CONFIRM: 'throwaway' };
    const ok = await restoreDrill({ manifestPath, env });
    assert.equal(ok.ok, true, JSON.stringify(ok.checks.filter((x) => !x.ok)));

    const buf = fs.readFileSync(encPath); buf[buf.length - 10] ^= 0xff; fs.writeFileSync(encPath, buf);
    const bad = await restoreDrill({ manifestPath, env });
    assert.equal(bad.ok, false);
    const left = await admin.query("select count(*)::int n from pg_database where datname like 'restore_drill_%'");
    assert.equal(left.rows[0].n, 0, 'scratch databases are dropped');
  } finally {
    await admin.query('DROP DATABASE IF EXISTS szl_backup_src_test WITH (FORCE)');
    await admin.end();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
