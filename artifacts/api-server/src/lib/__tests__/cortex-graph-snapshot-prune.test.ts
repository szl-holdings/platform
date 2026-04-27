import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const _deletedQueue: unknown[][] = [];
const whereSpy = vi.fn();
const returningSpy = vi.fn();

vi.mock('@szl-holdings/db', () => {
  const cortexGraphSnapshotsTable = {
    id: { _col: 'id' },
    expiresAt: { _col: 'expires_at' },
  };
  const terraDistressPropertiesTable = {
    id: { _col: 'id' },
    financialsLastBackfilledAt: { _col: 'financials_last_backfilled_at' },
    isActive: { _col: 'is_active' },
  };
  return {
    cortexGraphSnapshotsTable,
    terraDistressPropertiesTable,
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
      select() { return { from: () => ({ where: () => Promise.resolve([]) }) }; },
      update() { return { set: () => ({ where: () => Promise.resolve([]) }) }; },
    },
  };
});

vi.mock('drizzle-orm', () => ({
  lt: (col: unknown, val: unknown) => ({ op: 'lt', col, val }),
  lte: (col: unknown, val: unknown) => ({ op: 'lte', col, val }),
  gt: (col: unknown, val: unknown) => ({ op: 'gt', col, val }),
  gte: (col: unknown, val: unknown) => ({ op: 'gte', col, val }),
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
  ne: (col: unknown, val: unknown) => ({ op: 'ne', col, val }),
  and: (...conds: unknown[]) => ({ op: 'and', conds }),
  or: (...conds: unknown[]) => ({ op: 'or', conds }),
  isNull: (col: unknown) => ({ op: 'isNull', col }),
  isNotNull: (col: unknown) => ({ op: 'isNotNull', col }),
  not: (expr: unknown) => ({ op: 'not', expr }),
  desc: (col: unknown) => ({ op: 'desc', col }),
  asc: (col: unknown) => ({ op: 'asc', col }),
  inArray: (col: unknown, vals: unknown) => ({ op: 'inArray', col, vals }),
  sql: Object.assign((strings: TemplateStringsArray, ...values: unknown[]) => ({
    op: 'sql', strings, values,
  }), { raw: (s: string) => ({ op: 'sqlRaw', s }) }),
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

  const capturedByType = new Map<string, (job: { id: string; payload: Record<string, unknown> }) => Promise<void>>();
  const forge = await import('@szl-holdings/forge-runtime');
  (forge.durableJobQueue.register as ReturnType<typeof vi.fn>).mockImplementation(
    (type: string, fn: (job: { id: string; payload: Record<string, unknown> }) => Promise<void>) => {
      capturedByType.set(type, fn);
    },
  );

  await import('../scheduled-jobs');

  runHandler = capturedByType.get('cortex_graph_snapshot_prune')!;
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

    const { getJobRegistry } = await import('../scheduled-jobs');
    const entry = getJobRegistry().find((e) => e.type === 'cortex_graph_snapshot_prune');
    expect(entry).toBeDefined();
    expect(entry?.lastStatus).toBe('completed');
    expect(entry?.lastResult?.purged).toBe(3);
    expect(typeof entry?.lastResult?.cutoff).toBe('string');
    expect(entry?.runCount).toBe(1);
    expect(entry?.runHistory?.length).toBe(1);
    expect(entry?.runHistory?.[0]?.status).toBe('completed');
    expect(entry?.runHistory?.[0]?.result?.purged).toBe(3);
    expect(typeof entry?.runHistory?.[0]?.durationMs).toBe('number');
  });

  it('reports zero when no rows are eligible for prune', async () => {
    _deletedQueue.push([]);

    await runHandler({ id: 'job-2', payload: {} });

    const event = recordBusinessEventSpy.mock.calls[0]?.[0];
    expect(event.success).toBe(true);
    expect(event.metadata.purged).toBe(0);

    const { getJobRegistry } = await import('../scheduled-jobs');
    const entry = getJobRegistry().find((e) => e.type === 'cortex_graph_snapshot_prune');
    expect(entry?.lastResult?.purged).toBe(0);
    expect(entry?.runHistory?.[entry.runHistory.length - 1]?.result?.purged).toBe(0);
  });

  it('appends to run history across multiple runs and caps growth', async () => {
    for (let i = 0; i < 5; i++) {
      _deletedQueue.push([{ id: i }]);
      await runHandler({ id: `job-history-${i}`, payload: {} });
    }

    const { getJobRegistry } = await import('../scheduled-jobs');
    const entry = getJobRegistry().find((e) => e.type === 'cortex_graph_snapshot_prune');
    expect(entry?.runHistory?.length).toBe(5);
    expect(entry?.runCount).toBe(5);
    const purgedTotals = entry?.runHistory?.map((h) => h.result?.purged);
    expect(purgedTotals).toEqual([1, 1, 1, 1, 1]);
  });

  it('records a failed entry in run history when the prune throws', async () => {
    vi.resetModules();
    vi.doMock('@szl-holdings/db', () => ({
      cortexGraphSnapshotsTable: { id: {}, expiresAt: {} },
      terraDistressPropertiesTable: { id: {}, status: {}, updatedAt: {} },
      db: {
        delete: () => ({
          where: () => ({
            returning: () => Promise.reject(new Error('history-fail')),
          }),
        }),
        select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
        update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
      },
    }));
    const captured = new Map<string, (job: { id: string; payload: Record<string, unknown> }) => Promise<void>>();
    const forge = await import('@szl-holdings/forge-runtime');
    (forge.durableJobQueue.register as ReturnType<typeof vi.fn>).mockImplementation(
      (type: string, fn: (job: { id: string; payload: Record<string, unknown> }) => Promise<void>) => {
        captured.set(type, fn);
      },
    );
    const mod = await import('../scheduled-jobs');
    const handler = captured.get('cortex_graph_snapshot_prune')!;

    await expect(handler({ id: 'job-fail-history', payload: {} })).rejects.toThrow('history-fail');

    const entry = mod.getJobRegistry().find((e) => e.type === 'cortex_graph_snapshot_prune');
    expect(entry?.lastStatus).toBe('failed');
    expect(entry?.failCount).toBe(1);
    const last = entry?.runHistory?.[entry.runHistory.length - 1];
    expect(last?.status).toBe('failed');
  });

  it('rethrows DB errors so the durable scheduler retries', async () => {
    const forge = await import('@szl-holdings/forge-runtime');
    (forge.durableJobQueue.register as ReturnType<typeof vi.fn>).mockClear();

    vi.doMock('@szl-holdings/db', () => ({
      cortexGraphSnapshotsTable: { id: {}, expiresAt: {} },
      terraDistressPropertiesTable: { id: {}, status: {}, updatedAt: {} },
      db: {
        delete: () => ({
          where: () => ({
            returning: () => Promise.reject(new Error('boom')),
          }),
        }),
        select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
        update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
      },
    }));

    vi.resetModules();
    const capturedByType2 = new Map<string, (job: { id: string; payload: Record<string, unknown> }) => Promise<void>>();
    const forge2 = await import('@szl-holdings/forge-runtime');
    (forge2.durableJobQueue.register as ReturnType<typeof vi.fn>).mockImplementation(
      (type: string, fn: (job: { id: string; payload: Record<string, unknown> }) => Promise<void>) => {
        capturedByType2.set(type, fn);
      },
    );
    await import('../scheduled-jobs');
    const handler = capturedByType2.get('cortex_graph_snapshot_prune')!;

    await expect(handler({ id: 'job-3', payload: {} })).rejects.toThrow('boom');
    expect(loggerSpy.error).toHaveBeenCalled();
  });
});
