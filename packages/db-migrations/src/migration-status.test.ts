import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getManualMigrationStatus,
  getMigrationStatus,
  MIGRATION_PATHS,
  type MigrationQueryExecutor,
} from './migration-status';

class ScriptedExecutor implements MigrationQueryExecutor {
  readonly queries: string[] = [];
  private readonly responses: Array<unknown[] | Error>;

  constructor(responses: Array<unknown[] | Error>) {
    this.responses = [...responses];
  }

  async execute<T>(query: string): Promise<{ rows: T[] }> {
    this.queries.push(query);
    const response = this.responses.shift();
    if (response instanceof Error) throw response;
    if (!response) throw new Error(`No scripted response for query: ${query}`);
    return { rows: response as T[] };
  }
}

test('Drizzle status uses the schema-qualified tracker and hash identity', async () => {
  const executor = new ScriptedExecutor([
    [{ tracker: 'drizzle.__drizzle_migrations' }],
    [{ hash: 'sha256-value', created_at: '1780473600000' }],
    [{ count: '148' }],
  ]);

  const status = await getMigrationStatus(executor);

  assert.equal(status.trackerExists, true);
  assert.equal(status.appliedCount, 148);
  assert.equal(status.latestMigration, 'sha256-value');
  assert.equal(status.appliedAt?.getTime(), 1_780_473_600_000);
  assert.match(executor.queries[1], /"drizzle"\."__drizzle_migrations"/);
  assert.match(executor.queries[2], /"drizzle"\."__drizzle_migrations"/);
});

test('an absent Drizzle tracker is reported without masking database errors', async () => {
  const executor = new ScriptedExecutor([[{ tracker: null }]]);

  assert.deepEqual(await getMigrationStatus(executor), {
    appliedCount: 0,
    latestMigration: null,
    appliedAt: null,
    trackerExists: false,
  });
  assert.equal(executor.queries.length, 1);
});

test('a real Drizzle status query error propagates', async () => {
  const failure = new Error('database connection lost');
  const executor = new ScriptedExecutor([failure]);

  await assert.rejects(getMigrationStatus(executor), failure);
});

test('manual tracker status is schema-qualified and reports the latest file', async () => {
  const executor = new ScriptedExecutor([
    [{ tracker: '__manual_migrations' }],
    [{ count: '44' }],
    [{ filename: '0044_distribution_retry_count.sql', applied_at: '2026-10-11T01:02:03Z' }],
  ]);

  const status = await getManualMigrationStatus(executor);

  assert.equal(status.trackerExists, true);
  assert.equal(status.appliedCount, 44);
  assert.equal(status.latestFilename, '0044_distribution_retry_count.sql');
  assert.equal(status.appliedAt?.toISOString(), '2026-10-11T01:02:03.000Z');
  assert.match(executor.queries[1], /"public"\."__manual_migrations"/);
  assert.match(executor.queries[2], /"public"\."__manual_migrations"/);
});

test('manual status does not turn operational errors into tracker absence', async () => {
  const failure = new Error('permission denied');
  const executor = new ScriptedExecutor([[{ tracker: '__manual_migrations' }], failure]);

  await assert.rejects(getManualMigrationStatus(executor), failure);
});

test('migration paths contain only repository paths that exist', () => {
  assert.deepEqual(MIGRATION_PATHS, {
    drizzle: 'lib/db/drizzle',
    manual: 'lib/db/migrations',
  });
});
