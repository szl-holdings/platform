import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const _deletedQueue: unknown[][] = [];
const whereSpy = vi.fn();
const returningSpy = vi.fn();

vi.mock('@szl-holdings/db', () => {
  const cortexGraphSnapshotsTable = {
    id: { _col: 'id' },
    expiresAt: { _col: 'expires_at' },
  };
  return {
    cortexGraphSnapshotsTable,
    db: {
      delete() {
        return {
          where: (cond: unknown) => {
            whereSpy(cond);
            return {
              returning: (proj: unknown) => {
                returningSpy(proj);
                return Promise.resolve(_deletedQueue.shift() ?? []);
              },
            };
          },
        };
      },
    },
  };
});

vi.mock('drizzle-orm', () => ({
  lt: (col: unknown, val: unknown) => ({ op: 'lt', col, val }),
}));

vi.mock('@szl-holdings/forge-runtime', () => ({
  durableJobQueue: { register: vi.fn() },
}));

const recordBusinessEventSpy = vi.fn();
vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: { recordBusinessEvent: recordBusinessEventSpy },
}));

const loggerSpy = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
vi.mock('../logger', () => ({ logger: loggerSpy }));

let runHandler: (job: { id: string; payload: Record<string, unknown> }) => Promise<void>;

beforeEach(async () => {
  vi.resetModules();
  recordBusinessEventSpy.mockClear();
  whereSpy.mockClear();
  returningSpy.mockClear();
  loggerSpy.info.mockClear();
  loggerSpy.error.mockClear();
  _deletedQueue.length = 0;

  const captured: Array<(job: { id: string; payload: Record<string, unknown> }) => Promise<void>> = [];
  const forge = await import('@szl-holdings/forge-runtime');
  (forge.durableJobQueue.register as ReturnType<typeof vi.fn>).mockImplementation(
    (_type: string, fn: (job: { id: string; payload: Record<string, unknown> }) => Promise<void>) => {
      captured.push(fn);
    },
  );

  await import('../scheduled-jobs');

  // The prune handler is the last register() call in scheduled-jobs.ts
  runHandler = captured[captured.length - 1]!;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('cortex_graph_snapshot_prune', () => {
  it('deletes snapshots whose expires_at is in the past and reports purge count', async () => {
    _deletedQueue.push([{ id: 1 }, { id: 2 }, { id: 3 }]);

    await runHandler({ id: 'job-1', payload: {} });

    expect(whereSpy).toHaveBeenCalledTimes(1);
    const cond = whereSpy.mock.calls[0]?.[0] as { op: string; col: { _col: string }; val: Date };
    expect(cond.op).toBe('lt');
    expect(cond.col._col).toBe('expires_at');
    expect(cond.val).toBeInstanceOf(Date);

    const event = recordBusinessEventSpy.mock.calls[0]?.[0];
    expect(event.type).toBe('cortex_graph_snapshot_prune_completed');
    expect(event.success).toBe(true);
    expect(event.metadata.purged).toBe(3);

    const logEntry = loggerSpy.info.mock.calls.find((c) => c[1] === 'cortex_graph_snapshot_prune: complete');
    expect(logEntry?.[0].purged).toBe(3);
  });

  it('reports zero when no rows are eligible for prune', async () => {
    _deletedQueue.push([]);

    await runHandler({ id: 'job-2', payload: {} });

    const event = recordBusinessEventSpy.mock.calls[0]?.[0];
    expect(event.success).toBe(true);
    expect(event.metadata.purged).toBe(0);
  });

  it('rethrows DB errors so the durable scheduler retries', async () => {
    const forge = await import('@szl-holdings/forge-runtime');
    (forge.durableJobQueue.register as ReturnType<typeof vi.fn>).mockClear();

    vi.doMock('@szl-holdings/db', () => ({
      cortexGraphSnapshotsTable: { id: {}, expiresAt: {} },
      db: {
        delete: () => ({
          where: () => ({
            returning: () => Promise.reject(new Error('boom')),
          }),
        }),
      },
    }));

    vi.resetModules();
    const captured: Array<(job: { id: string; payload: Record<string, unknown> }) => Promise<void>> = [];
    const forge2 = await import('@szl-holdings/forge-runtime');
    (forge2.durableJobQueue.register as ReturnType<typeof vi.fn>).mockImplementation(
      (_type: string, fn: (job: { id: string; payload: Record<string, unknown> }) => Promise<void>) => {
        captured.push(fn);
      },
    );
    await import('../scheduled-jobs');
    const handler = captured[captured.length - 1]!;

    await expect(handler({ id: 'job-3', payload: {} })).rejects.toThrow('boom');
    expect(loggerSpy.error).toHaveBeenCalled();
  });
});
