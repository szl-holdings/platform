import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type RunArgs = { history?: ReadonlyArray<{ date: string; snapshot: unknown }> };

const runMock = vi.fn<(opts?: RunArgs) => Promise<unknown>>();

vi.mock('@workspace/agi-forecast', () => ({
  runAllPublicIngestors: (opts?: RunArgs) => runMock(opts),
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

function buildRunResult(date: string, opts: { horizonVelocity?: number | null; receiptHash?: string } = {}) {
  const snapshot = { __date: date };
  return {
    date,
    startedAt: `${date}T00:00:00.000Z`,
    finishedAt: `${date}T00:00:01.000Z`,
    snapshot,
    statuses: [
      { id: 'METR', label: 'METR', source: 'metr', ok: true, lastFetchedAt: `${date}T00:00:00.000Z`, value: 1, error: null },
    ],
    summary: {
      id: `summary-${date}`,
      date,
      ingestionPolicy: 'PUBLIC_ONLY' as const,
      snapshot,
      variables: [],
      derived: {
        horizonVelocity: opts.horizonVelocity ?? 0.1,
        alignmentDebt: 0,
        lutarReadiness: 0.5,
      },
      receiptHash: opts.receiptHash ?? `hash-${date}`,
    },
  };
}

let tmpDir: string;
let originalCwd: () => string;
let snapshotFile: string;

async function importJob() {
  return await import('../agi-forecast-ingest');
}

beforeEach(async () => {
  vi.resetModules();
  runMock.mockReset();
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agi-forecast-ingest-'));
  snapshotFile = path.join(tmpDir, '.data', 'agi-forecast-snapshot.json');
  originalCwd = process.cwd;
  process.cwd = () => tmpDir;
});

afterEach(async () => {
  process.cwd = originalCwd;
  const mod = await importJob();
  mod.__resetAgiForecastIngestForTests();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('agi-forecast-ingest history merge/dedupe/cap', () => {
  it('appends distinct dates and keeps history sorted oldest-first', async () => {
    const { runAgiForecastIngestOnce, __resetAgiForecastIngestForTests } = await importJob();
    __resetAgiForecastIngestForTests();

    runMock.mockResolvedValueOnce(buildRunResult('2026-05-20'));
    await runAgiForecastIngestOnce();

    runMock.mockResolvedValueOnce(buildRunResult('2026-05-21'));
    await runAgiForecastIngestOnce();

    runMock.mockResolvedValueOnce(buildRunResult('2026-05-22'));
    const snap = await runAgiForecastIngestOnce();

    expect(snap.history.map((h) => h.date)).toEqual(['2026-05-20', '2026-05-21', '2026-05-22']);
    expect(snap.snapshotHistory.map((h) => h.date)).toEqual([
      '2026-05-20',
      '2026-05-21',
      '2026-05-22',
    ]);
  });

  it('same-day re-runs overwrite the prior entry instead of duplicating it', async () => {
    const { runAgiForecastIngestOnce, __resetAgiForecastIngestForTests } = await importJob();
    __resetAgiForecastIngestForTests();

    runMock.mockResolvedValueOnce(buildRunResult('2026-05-20', { receiptHash: 'first' }));
    await runAgiForecastIngestOnce();

    runMock.mockResolvedValueOnce(buildRunResult('2026-05-20', { receiptHash: 'second' }));
    const snap = await runAgiForecastIngestOnce();

    expect(snap.history).toHaveLength(1);
    expect(snap.history[0]!.date).toBe('2026-05-20');
    expect(snap.history[0]!.receiptHash).toBe('second');
    expect(snap.snapshotHistory).toHaveLength(1);
    expect(snap.snapshotHistory[0]!.date).toBe('2026-05-20');
  });

  it('feeds prior snapshot history into the package on subsequent runs', async () => {
    const { runAgiForecastIngestOnce, __resetAgiForecastIngestForTests } = await importJob();
    __resetAgiForecastIngestForTests();

    runMock.mockResolvedValueOnce(buildRunResult('2026-05-20'));
    await runAgiForecastIngestOnce();
    runMock.mockResolvedValueOnce(buildRunResult('2026-05-21'));
    await runAgiForecastIngestOnce();

    expect(runMock).toHaveBeenNthCalledWith(1, { history: [] });
    const secondCallArg = runMock.mock.calls[1]![0] as RunArgs;
    expect(secondCallArg.history!.map((h) => h.date)).toEqual(['2026-05-20']);
  });

  it('enforces the 30-entry derived-history cap', async () => {
    const { runAgiForecastIngestOnce, __resetAgiForecastIngestForTests } = await importJob();
    __resetAgiForecastIngestForTests();

    // Bump retention so snapshotHistory doesn't prune entries by date.
    process.env.AGI_FORECAST_HISTORY_RETENTION_DAYS = '365';
    // Run 35 distinct sequential dates — only the last 30 should remain.
    for (let i = 0; i < 35; i++) {
      const base = new Date(Date.UTC(2026, 3, 1));
      base.setUTCDate(base.getUTCDate() + i);
      const iso = base.toISOString().slice(0, 10);
      runMock.mockResolvedValueOnce(buildRunResult(iso));
      // eslint-disable-next-line no-await-in-loop
      await runAgiForecastIngestOnce();
    }

    const { getLatestAgiForecastSnapshot } = await importJob();
    const snap = getLatestAgiForecastSnapshot()!;
    expect(snap.history.length).toBe(30);
    // Sorted oldest-first
    const dates = snap.history.map((h) => h.date);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
    // The earliest 5 should have been dropped.
    expect(dates[0]).toBe('2026-04-06');
    expect(dates[29]).toBe('2026-05-05');

    delete process.env.AGI_FORECAST_HISTORY_RETENTION_DAYS;
  });
});

describe('agi-forecast-ingest persisted-snapshot migration', () => {
  it('loads a legacy snapshot file without a history field as history: []', async () => {
    await fs.mkdir(path.dirname(snapshotFile), { recursive: true });
    const legacy = {
      lastRunAt: '2026-05-19T00:00:00.000Z',
      date: '2026-05-19',
      statuses: [],
      summary: {
        id: 'summary-legacy',
        date: '2026-05-19',
        ingestionPolicy: 'PUBLIC_ONLY',
        snapshot: {},
        variables: [],
        derived: { horizonVelocity: null, alignmentDebt: null, lutarReadiness: null },
        receiptHash: 'legacy-hash',
      },
      runCount: 7,
      // Note: no `history` or `snapshotHistory` fields — legacy format.
    };
    await fs.writeFile(snapshotFile, JSON.stringify(legacy), 'utf8');

    const {
      startAgiForecastIngest,
      stopAgiForecastIngest,
      getLatestAgiForecastSnapshot,
      runAgiForecastIngestOnce,
      __resetAgiForecastIngestForTests,
    } = await importJob();
    __resetAgiForecastIngestForTests();

    // Hydration runs from startAgiForecastIngest. Use a far-future kickoff so
    // the scheduled run doesn't fire during the test.
    startAgiForecastIngest({ intervalMs: 10_000_000, kickoffMs: 10_000_000 });
    // Poll for the async loadPersistedSnapshot to resolve, bounded so a real
    // failure doesn't hang the suite.
    const deadline = Date.now() + 2000;
    while (getLatestAgiForecastSnapshot() === null && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 10));
    }

    const hydrated = getLatestAgiForecastSnapshot();
    expect(hydrated).not.toBeNull();
    expect(hydrated!.history).toEqual([]);
    expect(hydrated!.snapshotHistory).toEqual([]);
    expect(hydrated!.runCount).toBe(7);

    // And a subsequent ingest run should treat the missing history as empty
    // (rather than crashing on `undefined`) and produce a one-entry history.
    runMock.mockResolvedValueOnce(buildRunResult('2026-05-20'));
    const snap = await runAgiForecastIngestOnce();
    expect(snap.history).toHaveLength(1);
    expect(snap.history[0]!.date).toBe('2026-05-20');

    stopAgiForecastIngest();
  });
});
