/**
 * Unit tests for the runtime config reader (`lib/runtime-config`).
 *
 * Locks in the contract from task #4622:
 *   - Type casting: string / number / boolean / json
 *   - Cache hit: a second read does not re-query the DB
 *   - Cache miss / missing key: returns the supplied defaultValue
 *   - DB throw: returns the supplied defaultValue (fail-safe, never throws)
 *   - invalidateConfigCache forces a refresh on the next read
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const CONFIG_TABLE = { __name: 'runtime_config' } as const;

interface DbState {
  row: Record<string, unknown> | null;
  failSelect: boolean;
  selectCount: number;
}

const dbState: DbState = {
  row: null,
  failSelect: false,
  selectCount: 0,
};

function resetDbState(): void {
  dbState.row = null;
  dbState.failSelect = false;
  dbState.selectCount = 0;
}

function makeSelectChain(table: unknown): unknown {
  const chain = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'then') {
          return (
            resolve: (v: unknown[]) => unknown,
            reject?: (e: unknown) => unknown,
          ): unknown => {
            dbState.selectCount++;
            if (dbState.failSelect) {
              return Promise.reject(new Error('simulated DB outage')).then(resolve, reject);
            }
            const rows = table === CONFIG_TABLE && dbState.row ? [dbState.row] : [];
            return Promise.resolve(rows).then(resolve, reject);
          };
        }
        return () => chain;
      },
    },
  );
  return chain;
}

vi.mock('@szl-holdings/db', () => {
  const insertResult = (): Promise<unknown[]> & {
    returning: () => Promise<unknown[]>;
    onConflictDoNothing: () => Promise<unknown[]>;
  } => {
    const p = Promise.resolve([]) as Promise<unknown[]> & {
      returning: () => Promise<unknown[]>;
      onConflictDoNothing: () => Promise<unknown[]>;
    };
    p.returning = () => Promise.resolve([]);
    p.onConflictDoNothing = () => Promise.resolve([]);
    return p;
  };
  return {
    db: {
      select: () => ({ from: (table: unknown) => makeSelectChain(table) }),
      insert: () => ({ values: () => insertResult() }),
    },
    runtimeConfigTable: CONFIG_TABLE,
  };
});

vi.mock('drizzle-orm', () => ({ eq: () => ({}) }));

vi.mock('../lib/logger.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createLoggerMock();
});

async function loadSut() {
  return await import('../lib/runtime-config.js');
}

beforeEach(() => {
  vi.resetModules();
  resetDbState();
});

describe('getConfig — type casting', () => {
  it('returns a string verbatim when valueType=string', async () => {
    const { getConfig } = await loadSut();
    dbState.row = { key: 'banner', value: 'hello world', valueType: 'string' };
    const v = await getConfig<string>('banner', '');
    expect(v).toBe('hello world');
  });

  it('casts a number string to a finite number', async () => {
    const { getConfig } = await loadSut();
    dbState.row = { key: 'rate', value: '250', valueType: 'number' };
    const v = await getConfig<number>('rate', 0);
    expect(v).toBe(250);
    expect(typeof v).toBe('number');
  });

  it('preserves precision on decimal numbers (no integer rounding)', async () => {
    const { getConfig } = await loadSut();
    dbState.row = { key: 'ratio', value: '0.125', valueType: 'number' };
    const v = await getConfig<number>('ratio', 0);
    expect(v).toBe(0.125);
  });

  it('returns 0 when the number value is not finite', async () => {
    const { getConfig } = await loadSut();
    dbState.row = { key: 'broken', value: 'not-a-number', valueType: 'number' };
    const v = await getConfig<number>('broken', 999);
    // castValue → NaN → 0 (NOT defaultValue, which is the documented behaviour)
    expect(v).toBe(0);
  });

  it('casts boolean strings (true / 1 → true; anything else → false)', async () => {
    const { getConfig } = await loadSut();

    dbState.row = { key: 'b', value: 'true', valueType: 'boolean' };
    expect(await getConfig<boolean>('b', false)).toBe(true);

    vi.resetModules();
    const sut2 = await loadSut();
    dbState.row = { key: 'b', value: '1', valueType: 'boolean' };
    expect(await sut2.getConfig<boolean>('b', false)).toBe(true);

    vi.resetModules();
    const sut3 = await loadSut();
    dbState.row = { key: 'b', value: 'false', valueType: 'boolean' };
    expect(await sut3.getConfig<boolean>('b', true)).toBe(false);

    vi.resetModules();
    const sut4 = await loadSut();
    dbState.row = { key: 'b', value: 'no', valueType: 'boolean' };
    expect(await sut4.getConfig<boolean>('b', true)).toBe(false);
  });

  it('parses valid JSON values', async () => {
    const { getConfig } = await loadSut();
    dbState.row = {
      key: 'j',
      value: JSON.stringify({ a: 1, b: ['x', 'y'] }),
      valueType: 'json',
    };
    const v = await getConfig<{ a: number; b: string[] }>('j', { a: 0, b: [] });
    expect(v).toEqual({ a: 1, b: ['x', 'y'] });
  });

  it('returns null (not the default) when JSON is malformed', async () => {
    const { getConfig } = await loadSut();
    dbState.row = { key: 'j', value: '{not json', valueType: 'json' };
    const v = await getConfig<unknown>('j', { fallback: true });
    // castValue returns null for invalid JSON; the default only applies when
    // the row is missing, not when casting fails.
    expect(v).toBeNull();
  });
});

describe('getConfig — cache behaviour', () => {
  it('cache hit: a second read does not re-query the DB', async () => {
    const { getConfig } = await loadSut();
    dbState.row = { key: 'k', value: '5', valueType: 'number' };

    expect(await getConfig<number>('k', 0)).toBe(5);
    const after1 = dbState.selectCount;
    expect(after1).toBe(1);

    expect(await getConfig<number>('k', 0)).toBe(5);
    expect(dbState.selectCount).toBe(after1); // no extra DB hit
  });

  it('cache miss: a different key triggers a fresh DB read', async () => {
    const { getConfig } = await loadSut();

    dbState.row = { key: 'a', value: '1', valueType: 'number' };
    await getConfig<number>('a', 0);
    const after1 = dbState.selectCount;

    dbState.row = { key: 'b', value: '2', valueType: 'number' };
    await getConfig<number>('b', 0);
    expect(dbState.selectCount).toBe(after1 + 1);
  });

  it('returns the default value when the key is missing from the DB', async () => {
    const { getConfig } = await loadSut();
    dbState.row = null;
    expect(await getConfig<string>('missing', 'fallback')).toBe('fallback');
    expect(await getConfig<number>('missing_num', 42)).toBe(42);
  });

  it('returns the default value when the DB read throws', async () => {
    const { getConfig } = await loadSut();
    dbState.failSelect = true;
    expect(await getConfig<string>('whatever', 'safe')).toBe('safe');
  });

  it('invalidateConfigCache forces the next read to re-query the DB', async () => {
    const { getConfig, invalidateConfigCache } = await loadSut();

    dbState.row = { key: 'k', value: '1', valueType: 'number' };
    expect(await getConfig<number>('k', 0)).toBe(1);
    const after1 = dbState.selectCount;

    // Mutate "DB" + invalidate → next read sees the new value AND re-queries.
    dbState.row = { key: 'k', value: '99', valueType: 'number' };
    invalidateConfigCache('k');
    expect(await getConfig<number>('k', 0)).toBe(99);
    expect(dbState.selectCount).toBe(after1 + 1);
  });

  it('invalidateAllConfigCache clears every cached entry', async () => {
    const { getConfig, invalidateAllConfigCache } = await loadSut();

    dbState.row = { key: 'a', value: '1', valueType: 'number' };
    await getConfig<number>('a', 0);
    dbState.row = { key: 'b', value: '2', valueType: 'number' };
    await getConfig<number>('b', 0);
    const baseline = dbState.selectCount;

    invalidateAllConfigCache();

    dbState.row = { key: 'a', value: '1', valueType: 'number' };
    await getConfig<number>('a', 0);
    dbState.row = { key: 'b', value: '2', valueType: 'number' };
    await getConfig<number>('b', 0);
    expect(dbState.selectCount).toBe(baseline + 2);
  });
});
