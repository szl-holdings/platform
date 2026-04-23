/**
 * Unit tests for the core migration logic in migrate-ip-hashes.ts.
 *
 * All tests use a mock pool — no real database connection required.
 * The mock intercepts SQL queries and simulates the DB state using
 * in-memory data, letting us verify:
 *   - Idempotency (already-hashed rows are skipped)
 *   - Correct hash output (matches lib/audit/src/ip-hash.ts algorithm)
 *   - Batching (pagination via LIMIT stops when all rows are processed)
 *   - Invariant check (throws if raw IPs remain after migration)
 *   - Dry-run (no UPDATE queries issued)
 *   - Multi-table coverage (AUDIT_TABLES lists all four required tables)
 *   - isAlreadyHashed predicate
 */

import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUDIT_TABLES,
  BATCH_SIZE,
  type MigrationPool,
  type MigrationResult,
  type TableSpec,
  hashIp,
  isAlreadyHashed,
  migrateTable,
  run,
} from './migrate-ip-hashes.js';

// ---------------------------------------------------------------------------
// Helper: reference hash (mirrors lib/audit/src/ip-hash.ts algorithm)
// ---------------------------------------------------------------------------

function expectedHash(salt: string, ip: string): string {
  return (
    'sha256:' +
    crypto.createHash('sha256').update(salt + ip).digest('hex').slice(0, 40)
  );
}

// ---------------------------------------------------------------------------
// Helper: build a mock pool that simulates a table with given rows
// ---------------------------------------------------------------------------

interface Row {
  id: number;
  ip_address: string;
}

function mockPool(initialRows: Row[]): { pool: MigrationPool; store: Row[] } {
  // Mutable in-memory store — UPDATE queries modify it in place.
  const store: Row[] = initialRows.map((r) => ({ ...r }));

  const pool: MigrationPool = {
    async query<T extends Record<string, unknown>>(
      sql: string,
      params?: unknown[],
    ): Promise<{ rows: T[] }> {
      const s = sql.trim().replace(/\s+/g, ' ');

      // COUNT query — how many raw IPs remain?
      if (s.startsWith('SELECT count(*)')) {
        const raw = store.filter(
          (r) => r.ip_address != null && !r.ip_address.startsWith('sha256:'),
        );
        return { rows: [{ n: String(raw.length) } as unknown as T] };
      }

      // SELECT batch query
      if (s.startsWith('SELECT')) {
        const limit = (params?.[0] as number) ?? BATCH_SIZE;
        const raw = store
          .filter((r) => r.ip_address != null && !r.ip_address.startsWith('sha256:'))
          .sort((a, b) => a.id - b.id)
          .slice(0, limit);
        return { rows: raw as unknown as T[] };
      }

      // UPDATE query
      if (s.startsWith('UPDATE')) {
        const [newHash, id] = params as [string, number];
        const row = store.find((r) => r.id === id);
        if (row) row.ip_address = newHash;
        return { rows: [] };
      }

      return { rows: [] };
    },
  };

  return { pool, store };
}

// ---------------------------------------------------------------------------
// hashIp (exported from migration script)
// ---------------------------------------------------------------------------

describe('hashIp (migration-script copy)', () => {
  const savedSalt = process.env.IP_HASH_SALT;

  afterEach(() => {
    if (savedSalt === undefined) delete process.env.IP_HASH_SALT;
    else process.env.IP_HASH_SALT = savedSalt;
  });

  it('matches the reference algorithm with a salt', () => {
    process.env.IP_HASH_SALT = 'test-salt';
    expect(hashIp('192.168.1.1')).toBe(expectedHash('test-salt', '192.168.1.1'));
  });

  it('matches the reference algorithm with empty salt fallback', () => {
    delete process.env.IP_HASH_SALT;
    expect(hashIp('10.0.0.1')).toBe(expectedHash('', '10.0.0.1'));
  });

  it('returns a sha256:-prefixed 47-char string', () => {
    process.env.IP_HASH_SALT = 'x';
    const result = hashIp('1.2.3.4');
    expect(result).toMatch(/^sha256:[0-9a-f]{40}$/);
  });
});

// ---------------------------------------------------------------------------
// isAlreadyHashed
// ---------------------------------------------------------------------------

describe('isAlreadyHashed', () => {
  it('returns true for a sha256:-prefixed value', () => {
    expect(isAlreadyHashed('sha256:abc123')).toBe(true);
  });

  it('returns false for a raw IPv4 address', () => {
    expect(isAlreadyHashed('1.2.3.4')).toBe(false);
  });

  it('returns false for a raw IPv6 address', () => {
    expect(isAlreadyHashed('::1')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AUDIT_TABLES — coverage check
// ---------------------------------------------------------------------------

describe('AUDIT_TABLES', () => {
  const tableNames = AUDIT_TABLES.map((t) => t.table);

  it('includes activity_log', () => expect(tableNames).toContain('activity_log'));
  it('includes audit_events', () => expect(tableNames).toContain('audit_events'));
  it('includes alloy_audit_log', () => expect(tableNames).toContain('alloy_audit_log'));
  it('includes platform_audit_log', () => expect(tableNames).toContain('platform_audit_log'));
  it('has exactly four entries', () => expect(AUDIT_TABLES).toHaveLength(4));
});

// ---------------------------------------------------------------------------
// migrateTable — core behaviour
// ---------------------------------------------------------------------------

describe('migrateTable', () => {
  const spec: TableSpec = { table: 'activity_log', pk: 'id' };
  const savedSalt = process.env.IP_HASH_SALT;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.IP_HASH_SALT = 'unit-test-salt';
  });

  afterEach(() => {
    if (savedSalt === undefined) delete process.env.IP_HASH_SALT;
    else process.env.IP_HASH_SALT = savedSalt;
  });

  it('returns zeroed result when the table has no raw IPs', async () => {
    const { pool } = mockPool([
      { id: 1, ip_address: 'sha256:already_hashed_value_here_padded_to_40c' },
    ]);
    const result = await migrateTable(spec, pool);
    expect(result).toEqual<MigrationResult>({
      table: 'activity_log',
      rawCount: 0,
      updatedCount: 0,
      skipped: 0,
    });
  });

  it('hashes raw IP addresses and updates them in the store', async () => {
    const { pool, store } = mockPool([
      { id: 1, ip_address: '192.168.0.1' },
      { id: 2, ip_address: '10.0.0.2' },
    ]);
    const result = await migrateTable(spec, pool);

    expect(result.rawCount).toBe(2);
    expect(result.updatedCount).toBe(2);
    expect(result.skipped).toBe(0);

    expect(store[0].ip_address).toBe(expectedHash('unit-test-salt', '192.168.0.1'));
    expect(store[1].ip_address).toBe(expectedHash('unit-test-salt', '10.0.0.2'));
  });

  it('skips rows that already start with sha256:', async () => {
    const alreadyHashed = 'sha256:' + 'a'.repeat(40);
    const { pool, store } = mockPool([
      { id: 1, ip_address: alreadyHashed },
      { id: 2, ip_address: '172.16.0.5' },
    ]);

    await migrateTable(spec, pool);

    // Row 1 must be untouched; row 2 must be hashed.
    expect(store[0].ip_address).toBe(alreadyHashed);
    expect(store[1].ip_address).toBe(expectedHash('unit-test-salt', '172.16.0.5'));
  });

  it('is idempotent — running twice produces the same result', async () => {
    const { pool, store } = mockPool([{ id: 1, ip_address: '1.2.3.4' }]);

    await migrateTable(spec, pool);
    const firstHash = store[0].ip_address;

    await migrateTable(spec, pool);
    const secondHash = store[0].ip_address;

    expect(firstHash).toBe(secondHash);
    expect(firstHash).toMatch(/^sha256:[0-9a-f]{40}$/);
  });

  it('dry-run: returns rawCount but issues no updates', async () => {
    const { pool, store } = mockPool([
      { id: 1, ip_address: '10.0.0.1' },
      { id: 2, ip_address: '10.0.0.2' },
    ]);

    const result = await migrateTable(spec, pool, { dryRun: true });

    expect(result.rawCount).toBe(2);
    expect(result.updatedCount).toBe(0);
    expect(result.skipped).toBe(2);

    // Store must be unmodified.
    expect(store[0].ip_address).toBe('10.0.0.1');
    expect(store[1].ip_address).toBe('10.0.0.2');
  });

  it('processes rows in batches (pagination stops when exhausted)', async () => {
    // Create BATCH_SIZE + 1 rows so two SELECT rounds are needed.
    const rows: Row[] = Array.from({ length: BATCH_SIZE + 1 }, (_, i) => ({
      id: i + 1,
      ip_address: `10.0.${Math.floor(i / 255)}.${i % 255}`,
    }));
    const { pool, store } = mockPool(rows);

    const result = await migrateTable(spec, pool);

    expect(result.updatedCount).toBe(BATCH_SIZE + 1);
    for (const row of store) {
      expect(row.ip_address).toMatch(/^sha256:[0-9a-f]{40}$/);
    }
  });

  it('throws if raw IPs remain after migration (invariant check)', async () => {
    // Build a pool whose final COUNT still returns 1 to simulate a broken state.
    let callCount = 0;
    const faultyPool: MigrationPool = {
      async query<T extends Record<string, unknown>>(
        sql: string,
        params?: unknown[],
      ): Promise<{ rows: T[] }> {
        const s = sql.trim().replace(/\s+/g, ' ');
        if (s.startsWith('SELECT count(*)')) {
          callCount++;
          // First count: report 1 raw row; second (post-migration) count: still 1.
          return { rows: [{ n: '1' } as unknown as T] };
        }
        if (s.startsWith('SELECT')) {
          // Return one row on first fetch, none on second (so the while loop ends).
          if (callCount === 1) {
            return {
              rows: [{ id: 1, ip_address: '1.2.3.4' } as unknown as T],
            };
          }
          return { rows: [] };
        }
        return { rows: [] };
      },
    };

    await expect(migrateTable(spec, faultyPool)).rejects.toThrow(
      /Invariant violated/,
    );
  });
});

// ---------------------------------------------------------------------------
// run — multi-table orchestration
// ---------------------------------------------------------------------------

describe('run', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.IP_HASH_SALT = 'run-test-salt';
  });

  it('returns one MigrationResult per AUDIT_TABLE', async () => {
    const { pool } = mockPool([]);
    const results = await run(pool);
    expect(results).toHaveLength(AUDIT_TABLES.length);
    for (const r of results) {
      expect(r.rawCount).toBe(0);
    }
  });

  it('dry-run: returns rawCount without modifying rows', async () => {
    // All four tables share the same mock store in this test.
    const { pool, store } = mockPool([{ id: 1, ip_address: '9.9.9.9' }]);
    const results = await run(pool, { dryRun: true });

    // At least one result should report a raw row found.
    const found = results.some((r) => r.rawCount > 0);
    expect(found).toBe(true);
    // Store untouched.
    expect(store[0].ip_address).toBe('9.9.9.9');
  });
});
