import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  buildMigrationPlan,
  ManualMigrationDriftError,
  runManualMigrations,
  sha256,
} from './apply-manual-migrations.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function migration(filename, sql) {
  return { filename, sql, checksum: sha256(sql) };
}

class ScriptedClient {
  constructor(handler) {
    this.handler = handler;
    this.queries = [];
  }

  async query(sql, params) {
    this.queries.push({ sql, params });
    return this.handler(sql, params, this.queries.length - 1);
  }
}

test('normal migrate preflights manual drift before applying either migration set', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8'),
  );
  assert.doesNotMatch(packageJson.scripts.migrate, /backfill-migrations/);
  assert.match(
    packageJson.scripts.migrate,
    /^DRY_RUN=1 node \.\/scripts\/apply-manual-migrations\.mjs && drizzle-kit migrate/,
  );
  assert.match(
    packageJson.scripts.migrate,
    /drizzle-kit migrate.*&& node \.\/scripts\/apply-manual-migrations\.mjs$/,
  );
});

test('buildMigrationPlan separates applied, pending, and drifted files', () => {
  const migrations = [
    migration('0001_applied.sql', 'SELECT 1'),
    migration('0002_pending.sql', 'SELECT 2'),
    migration('0003_drift.sql', 'SELECT 3'),
  ];
  const plan = buildMigrationPlan(migrations, [
    { filename: '0001_applied.sql', checksum: migrations[0].checksum },
    { filename: '0003_drift.sql', checksum: 'recorded-checksum' },
  ]);

  assert.deepEqual(
    plan.alreadyApplied.map((entry) => entry.filename),
    ['0001_applied.sql'],
  );
  assert.deepEqual(
    plan.pending.map((entry) => entry.filename),
    ['0002_pending.sql'],
  );
  assert.deepEqual(
    plan.drift.map((entry) => entry.filename),
    ['0003_drift.sql'],
  );
});

test('checksum drift fails before any pending migration is applied', async () => {
  const migrations = [
    migration('0001_pending.sql', "SELECT 'pending'"),
    migration('0002_drift.sql', "SELECT 'changed'"),
  ];
  const client = new ScriptedClient((sql) => {
    if (sql.includes('to_regclass')) return { rows: [{ tracker: '__manual_migrations' }] };
    if (sql.includes('SELECT filename')) {
      return {
        rows: [{ filename: '0002_drift.sql', checksum: 'old-checksum' }],
      };
    }
    throw new Error(`Unexpected write/query: ${sql}`);
  });

  await assert.rejects(
    runManualMigrations({
      client,
      migrations,
      dryRun: false,
      appliedBy: 'test@host',
    }),
    ManualMigrationDriftError,
  );
  assert.equal(client.queries.length, 2);
  assert.equal(
    client.queries.some(({ sql }) => sql === 'BEGIN'),
    false,
  );
});

test('dry-run with an absent tracker is read-only and reports all files pending', async () => {
  const migrations = [migration('0001_pending.sql', 'SELECT 1')];
  const client = new ScriptedClient((sql) => {
    assert.match(sql, /^SELECT to_regclass/);
    return { rows: [{ tracker: null }] };
  });

  const report = await runManualMigrations({
    client,
    migrations,
    dryRun: true,
    appliedBy: 'test@host',
  });

  assert.deepEqual(report.pending, ['0001_pending.sql']);
  assert.deepEqual(report.applied, []);
  assert.equal(report.trackerExists, false);
  assert.equal(client.queries.length, 1);
});

test('dry-run with a tracker performs only SELECT statements', async () => {
  const migrations = [
    migration('0001_applied.sql', 'SELECT 1'),
    migration('0002_pending.sql', 'SELECT 2'),
  ];
  const client = new ScriptedClient((sql) => {
    if (sql.includes('to_regclass')) return { rows: [{ tracker: '__manual_migrations' }] };
    if (sql.includes('SELECT filename')) {
      return {
        rows: [{ filename: '0001_applied.sql', checksum: migrations[0].checksum }],
      };
    }
    throw new Error(`Unexpected write/query: ${sql}`);
  });

  const report = await runManualMigrations({
    client,
    migrations,
    dryRun: true,
    appliedBy: 'test@host',
  });

  assert.deepEqual(report.alreadyApplied, ['0001_applied.sql']);
  assert.deepEqual(report.pending, ['0002_pending.sql']);
  assert.equal(
    client.queries.every(({ sql }) => /^SELECT/.test(sql)),
    true,
  );
});

test('apply records a pending migration transactionally', async () => {
  const migrations = [migration('0001_pending.sql', "SELECT 'apply-me'")];
  const client = new ScriptedClient((sql) => {
    if (sql.includes('to_regclass')) return { rows: [{ tracker: '__manual_migrations' }] };
    if (sql.includes('SELECT filename')) return { rows: [] };
    return { rows: [] };
  });

  const report = await runManualMigrations({
    client,
    migrations,
    dryRun: false,
    appliedBy: 'test@host',
  });

  assert.deepEqual(report.applied, ['0001_pending.sql']);
  assert.deepEqual(
    client.queries.slice(2).map(({ sql }) => sql.trim()),
    [
      'BEGIN',
      "SELECT 'apply-me'",
      'INSERT INTO "public"."__manual_migrations" (filename, checksum, applied_by) VALUES ($1, $2, $3)',
      'COMMIT',
    ],
  );
});
