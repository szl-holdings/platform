/**
 * Regression test for the migration runner pool-isolation contract.
 *
 * Background (Task #2828): the consolidated migration runner used to call
 * `pool.connect()` against the shared application pool, holding a connection
 * for the entire 113+ file run. With small DB_POOL_MAX values that starved
 * request handlers during startup and triggered long-checkout warnings.
 *
 * The fix routes migrations through a dedicated pg.Client opened directly
 * against DATABASE_URL. This test enforces that contract by:
 *   1. Spying on `pool.connect` and asserting it is NEVER called.
 *   2. Spying on the `pg.Client` constructor and asserting one is created
 *      and connected.
 *
 * No real Postgres is required: pg.Client is mocked end-to-end so the test
 * runs offline and inside the existing vitest harness.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const clientQueryMock = vi.fn().mockResolvedValue({ rows: [] });
const clientConnectMock = vi.fn().mockResolvedValue(undefined);
const clientEndMock = vi.fn().mockResolvedValue(undefined);
const clientCtorSpy = vi.fn();

class FakePgClient {
  constructor(opts: unknown) {
    clientCtorSpy(opts);
  }
  connect = clientConnectMock;
  query = clientQueryMock;
  end = clientEndMock;
}

vi.mock('@szl-holdings/db', () => {
  const connectSpy = vi.fn();
  return {
    pool: {
      connect: connectSpy,
      query: vi.fn(),
    },
    db: {},
    healthPool: { connect: vi.fn(), query: vi.fn() },
    PgClient: FakePgClient,
    PgPool: class {},
  };
});

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    default: actual,
    existsSync: () => true,
    readdirSync: () => ['0001_init.sql', '0002_more.sql'] as unknown as string[],
    readFileSync: () =>
      'CREATE TABLE IF NOT EXISTS noop (id int);\nCREATE INDEX IF NOT EXISTS noop_idx ON noop(id);\n',
  };
});

beforeEach(() => {
  process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
  clientQueryMock.mockClear();
  clientConnectMock.mockClear();
  clientEndMock.mockClear();
  clientCtorSpy.mockClear();
});

afterEach(() => {
  vi.resetModules();
});

describe('runMigrations — connection isolation', () => {
  it('opens a dedicated pg.Client against DATABASE_URL (does not check out from the shared pool)', async () => {
    const { runMigrations } = await import('../lib/run-migrations');
    const { pool } = (await import('@szl-holdings/db')) as unknown as {
      pool: { connect: ReturnType<typeof vi.fn> };
    };

    await runMigrations();

    expect(pool.connect).not.toHaveBeenCalled();
    expect(clientCtorSpy).toHaveBeenCalledTimes(1);
    expect(clientCtorSpy).toHaveBeenCalledWith({
      connectionString: 'postgres://test:test@localhost:5432/test',
    });
    expect(clientConnectMock).toHaveBeenCalledTimes(1);
    expect(clientQueryMock).toHaveBeenCalled();
    expect(clientEndMock).toHaveBeenCalledTimes(1);
  });

  it('still calls client.end() when a statement throws a non-idempotent error', async () => {
    clientQueryMock.mockReset();
    clientQueryMock.mockRejectedValueOnce(Object.assign(new Error('boom'), { code: 'XX000' }));
    clientQueryMock.mockResolvedValue({ rows: [] });

    const { runMigrations } = await import('../lib/run-migrations');
    await runMigrations();

    expect(clientEndMock).toHaveBeenCalledTimes(1);
  });

  it('throws a clear error when DATABASE_URL is missing', async () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const { runMigrations } = await import('../lib/run-migrations');
      await expect(runMigrations()).rejects.toThrow(/DATABASE_URL must be set/);
      expect(clientCtorSpy).not.toHaveBeenCalled();
    } finally {
      if (previous !== undefined) process.env.DATABASE_URL = previous;
    }
  });
});
