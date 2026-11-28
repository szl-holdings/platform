import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPooledUrl, migrationDatabaseUrl } from './migration-url.mjs';

test('direct URL wins over the runtime URL', () => {
  assert.equal(migrationDatabaseUrl({ DATABASE_URL: 'postgresql://a@ep-x-pooler.us-east-2.aws.neon.tech/db', DATABASE_URL_DIRECT: 'postgresql://a@ep-x.us-east-2.aws.neon.tech/db' }),
    'postgresql://a@ep-x.us-east-2.aws.neon.tech/db');
});

test('pooled endpoints are refused for migrations', () => {
  assert.ok(isPooledUrl('postgresql://a@ep-cool-x-pooler.us-east-2.aws.neon.tech/db?sslmode=require'));
  assert.ok(isPooledUrl('postgresql://a@db.example:6432/db?pgbouncer=true'));
  assert.ok(!isPooledUrl('postgresql://a@ep-cool-x.us-east-2.aws.neon.tech/db'));
  assert.throws(() => migrationDatabaseUrl({ DATABASE_URL: 'postgresql://a@ep-x-pooler.us-east-2.aws.neon.tech/db' }), /pooled endpoint/);
});

test('missing or non-postgres URL fails closed', () => {
  assert.throws(() => migrationDatabaseUrl({}), /required/);
  assert.throws(() => migrationDatabaseUrl({ DATABASE_URL_DIRECT: 'mysql://x/y' }), /postgres/);
});
