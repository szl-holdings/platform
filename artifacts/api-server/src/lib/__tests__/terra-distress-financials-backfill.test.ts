import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface FakeRow {
  id: number;
  distressType: string;
  estimatedValue: string;
  opportunityScore: number;
  connectorSource: string | null;
  daysInDistress: number | null;
  debtAmount: string | null;
  lienAmount: string | null;
  rawData: Record<string, unknown> | null;
}

const state: {
  candidates: FakeRow[];
  updates: Array<{ id: number; debtAmount: string; lienAmount: string; rawData: Record<string, unknown> }>;
  coverage: { total: number; covered: number };
  selectMode: 'candidates' | 'coverage';
} = {
  candidates: [],
  updates: [],
  coverage: { total: 0, covered: 0 },
  selectMode: 'candidates',
};

vi.mock('@szl-holdings/db', () => {
  const terraDistressPropertiesTable = {
    id: { _col: 'id' },
    distressType: { _col: 'distress_type' },
    estimatedValue: { _col: 'estimated_value' },
    opportunityScore: { _col: 'opportunity_score' },
    connectorSource: { _col: 'connector_source' },
    daysInDistress: { _col: 'days_in_distress' },
    debtAmount: { _col: 'debt_amount' },
    lienAmount: { _col: 'lien_amount' },
    rawData: { _col: 'raw_data' },
    isActive: { _col: 'is_active' },
    updatedAt: { _col: 'updated_at' },
  };
  return {
    terraDistressPropertiesTable,
    db: {
      select(_proj?: unknown) {
        // First select() in our code path returns candidates; second returns coverage.
        const isCoverage = state.selectMode === 'coverage';
        return {
          from() {
            return {
              where() {
                if (isCoverage) {
                  return Promise.resolve([{ total: state.coverage.total, covered: state.coverage.covered }]);
                }
                state.selectMode = 'coverage';
                return Promise.resolve(state.candidates);
              },
            };
          },
        };
      },
      update() {
        return {
          set(values: { debtAmount: string; lienAmount: string; rawData: Record<string, unknown> }) {
            return {
              where(cond: { _id: number }) {
                state.updates.push({ id: cond._id, ...values });
                return Promise.resolve();
              },
            };
          },
        };
      },
    },
  };
});

vi.mock('drizzle-orm', () => ({
  and: (...c: unknown[]) => ({ op: 'and', c }),
  eq: (col: { _col: string }, val: unknown) =>
    col._col === 'id' ? { _id: val as number } : { op: 'eq', col, val },
  or: (...c: unknown[]) => ({ op: 'or', c }),
  isNull: (col: unknown) => ({ op: 'isNull', col }),
  sql: (() => {
    const fn = (..._args: unknown[]) => ({ op: 'sql' });
    (fn as unknown as { raw: unknown }).raw = fn;
    return fn;
  })(),
}));

const loggerSpy = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
vi.mock('../logger', () => ({ logger: loggerSpy }));

beforeEach(() => {
  state.candidates = [];
  state.updates = [];
  state.coverage = { total: 0, covered: 0 };
  state.selectMode = 'candidates';
  loggerSpy.warn.mockClear();
  loggerSpy.error.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('runDistressFinancialsBackfill', () => {
  it('estimates encumbrances for active rows missing debt+lien and records provenance', async () => {
    state.candidates = [
      {
        id: 101,
        distressType: 'foreclosure',
        estimatedValue: '1000000',
        opportunityScore: 80,
        connectorSource: 'NYC ACRIS',
        daysInDistress: 120,
        debtAmount: null,
        lienAmount: null,
        rawData: { existing: true },
      },
      {
        id: 102,
        distressType: 'tax-lien',
        estimatedValue: '500000',
        opportunityScore: 65,
        connectorSource: 'NYC DOF Tax Liens',
        daysInDistress: 300,
        debtAmount: '0',
        lienAmount: '0',
        rawData: null,
      },
      {
        id: 103,
        distressType: 'expired-listing',
        estimatedValue: '900000',
        opportunityScore: 30,
        connectorSource: null,
        daysInDistress: 10,
        debtAmount: null,
        lienAmount: null,
        rawData: null,
      },
    ];
    state.coverage = { total: 5, covered: 4 };

    const { runDistressFinancialsBackfill } = await import(
      '../../jobs/terra-distress-financials-backfill'
    );
    const result = await runDistressFinancialsBackfill();

    expect(result.scanned).toBe(3);
    expect(result.estimated).toBe(2);
    expect(result.skipped).toBe(1); // expired-listing
    expect(result.failed).toBe(0);
    expect(result.encumbrancesAfterCoverage).toBe(4);
    expect(result.totalActiveRows).toBe(5);

    expect(state.updates).toHaveLength(2);
    const fc = state.updates.find((u) => u.id === 101)!;
    expect(Number(fc.debtAmount)).toBeGreaterThan(0);
    expect(Number(fc.lienAmount)).toBe(0);
    const prov = (fc.rawData as { financialsEstimate: { source: string; method: string } })
      .financialsEstimate;
    expect(prov.source).toBe('heuristic_v1');
    expect(prov.method).toBe('acris_foreclosure_v1');
    expect((fc.rawData as { existing?: boolean }).existing).toBe(true);

    const lien = state.updates.find((u) => u.id === 102)!;
    expect(Number(lien.lienAmount)).toBeGreaterThan(0);
    expect(Number(lien.debtAmount)).toBe(275000); // 500k * 0.55
  });

  it('skips rows whose distress_type is unknown to the estimator', async () => {
    state.candidates = [
      {
        id: 1,
        distressType: 'unrecognized-type',
        estimatedValue: '500000',
        opportunityScore: 50,
        connectorSource: null,
        daysInDistress: null,
        debtAmount: null,
        lienAmount: null,
        rawData: null,
      },
    ];
    state.coverage = { total: 1, covered: 0 };

    const { runDistressFinancialsBackfill } = await import(
      '../../jobs/terra-distress-financials-backfill'
    );
    const result = await runDistressFinancialsBackfill();
    expect(result.estimated).toBe(0);
    expect(result.skipped).toBe(1);
    expect(state.updates).toHaveLength(0);
  });

  it('returns zero coverage cleanly when there are no rows', async () => {
    state.candidates = [];
    state.coverage = { total: 0, covered: 0 };
    const { runDistressFinancialsBackfill } = await import(
      '../../jobs/terra-distress-financials-backfill'
    );
    const result = await runDistressFinancialsBackfill();
    expect(result.scanned).toBe(0);
    expect(result.estimated).toBe(0);
    expect(result.totalActiveRows).toBe(0);
  });
});
