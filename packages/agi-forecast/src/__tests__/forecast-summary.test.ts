import { describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import {
  buildDailySummary,
  canonicalize,
  deriveMetrics,
  CAPABILITY_SIGNAL_IDS,
  SAFETY_SIGNAL_IDS,
  type HistoryEntry,
  type VariableSnapshot,
} from '../forecast-summary';
import { assertAllowedLicense } from '../licenses';

const snapshot: VariableSnapshot = {
  METR: { ok: true, value: 100, fetchedAt: '2026-05-16T00:00:00.000Z', sourceUrl: 'https://api.github.com/repos/METR/public-tasks' },
  EPOCH: { ok: true, value: 700, fetchedAt: '2026-05-16T00:00:00.000Z', sourceUrl: 'https://epoch.ai/data/notable_ai_models.csv' },
  ARC: { ok: false, error: 'HTTP 503', fetchedAt: '2026-05-16T00:00:00.000Z', sourceUrl: 'https://api.github.com/repos/fchollet/ARC-AGI' },
};

function ok(value: number, date = '2026-05-16'): VariableSnapshot[string] {
  return { ok: true, value, fetchedAt: `${date}T00:00:00.000Z`, sourceUrl: 'x' };
}

describe('buildDailySummary', () => {
  it('is deterministic — same snapshot yields same receiptHash', () => {
    const a = buildDailySummary('2026-05-16', snapshot);
    const b = buildDailySummary('2026-05-16', snapshot);
    expect(a.receiptHash).toBe(b.receiptHash);
    expect(a.receiptHash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.id).toBe('forecast.summary@2026-05-16');
    expect(a.ingestionPolicy).toBe('PUBLIC_ONLY');
  });

  it('receiptHash equals sha256 of canonicalized {snapshot, derived}', () => {
    const a = buildDailySummary('2026-05-16', snapshot);
    const expected = createHash('sha256')
      .update(canonicalize({ snapshot, derived: a.derived }), 'utf8')
      .digest('hex');
    expect(a.receiptHash).toBe(expected);
  });

  it('receiptHash is independent of the date field when history is empty', () => {
    const a = buildDailySummary('2026-05-16', snapshot);
    const b = buildDailySummary('2026-05-17', snapshot);
    expect(a.receiptHash).toBe(b.receiptHash);
  });

  it('receiptHash changes when derived metrics change (history-dependent)', () => {
    const history: HistoryEntry[] = [
      { date: '2026-05-10', snapshot: { METR: ok(50, '2026-05-10'), APOLLO: ok(10, '2026-05-10') } },
    ];
    const a = buildDailySummary('2026-05-16', snapshot);
    const b = buildDailySummary('2026-05-16', snapshot, history);
    expect(a.receiptHash).not.toBe(b.receiptHash);
    expect(b.derived.horizonVelocity).not.toBeNull();
  });

  it('buildDailySummary enforces license allowlist via summary build path', async () => {
    vi.resetModules();
    vi.doMock('../gauge-registry', () => ({
      GAUGE_VARIABLES: [
        { id: 'BAD', label: 'bad', source: 'https://x', unit: 'u', cadence: 'daily', license: 'GPL-3.0', provenance: 'PUBLIC_ONLY' },
      ],
    }));
    const mod = await import('../forecast-summary');
    expect(() => mod.buildDailySummary('2026-05-16', snapshot)).toThrow(/allowlist/);
    vi.doUnmock('../gauge-registry');
    vi.resetModules();
  });

  it('changes hash when snapshot changes', () => {
    const a = buildDailySummary('2026-05-16', snapshot);
    const b = buildDailySummary('2026-05-16', { ...snapshot, METR: { ok: true, value: 101, fetchedAt: '2026-05-16T00:00:00.000Z', sourceUrl: 'x' } });
    expect(a.receiptHash).not.toBe(b.receiptHash);
  });

  it('canonicalize sorts object keys at every depth', () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    expect(canonicalize({ b: { y: 1, x: 2 }, a: [3, { d: 4, c: 5 }] }))
      .toBe('{"a":[3,{"c":5,"d":4}],"b":{"x":2,"y":1}}');
  });

  it('rejects invalid date strings', () => {
    expect(() => buildDailySummary('2026/05/16', snapshot)).toThrow();
  });

  it('license allowlist throws on disallowed values', () => {
    expect(() => assertAllowedLicense('GPL-3.0')).toThrow(/allowlist/);
    expect(assertAllowedLicense('Apache-2.0')).toBe('Apache-2.0');
    expect(assertAllowedLicense('MIT')).toBe('MIT');
    expect(assertAllowedLicense('BSD-3-Clause')).toBe('BSD-3-Clause');
    expect(assertAllowedLicense('CC-BY-4.0')).toBe('CC-BY-4.0');
  });
});

describe('deriveMetrics', () => {
  // Fixed 5-day fixture: capability signals climb fast, safety signals climb slowly.
  const fixture: HistoryEntry[] = [
    {
      date: '2026-05-12',
      snapshot: {
        METR: ok(100, '2026-05-12'), EPOCH: ok(700, '2026-05-12'), ARC: ok(2000, '2026-05-12'),
        APOLLO: ok(50, '2026-05-12'), AISI: ok(80, '2026-05-12'),
      },
    },
    {
      date: '2026-05-13',
      snapshot: {
        METR: ok(110, '2026-05-13'), EPOCH: ok(705, '2026-05-13'), ARC: ok(2010, '2026-05-13'),
        APOLLO: ok(51, '2026-05-13'), AISI: ok(80, '2026-05-13'),
      },
    },
    {
      date: '2026-05-14',
      snapshot: {
        METR: ok(125, '2026-05-14'), EPOCH: ok(710, '2026-05-14'), ARC: ok(2025, '2026-05-14'),
        APOLLO: ok(52, '2026-05-14'), AISI: ok(81, '2026-05-14'),
      },
    },
    {
      date: '2026-05-16',
      snapshot: {
        METR: ok(140, '2026-05-16'), EPOCH: ok(720, '2026-05-16'), ARC: ok(2040, '2026-05-16'),
        APOLLO: ok(53, '2026-05-16'), AISI: ok(82, '2026-05-16'),
      },
    },
  ];

  it('returns nulls when history has fewer than 2 observations per signal', () => {
    const m = deriveMetrics([fixture[0]]);
    expect(m).toEqual({ horizonVelocity: null, alignmentDebt: null, lutarReadiness: null });
  });

  it('computes horizon-velocity as mean per-day delta across capability signals', () => {
    const m = deriveMetrics(fixture);
    // 4 days span. METR: (140-100)/4=10, EPOCH: (720-700)/4=5, ARC: (2040-2000)/4=10
    // Mean of (10, 5, 10) = 25/3
    expect(m.horizonVelocity).toBeCloseTo(25 / 3, 10);
  });

  it('computes alignment-debt as horizon-velocity minus safety velocity', () => {
    const m = deriveMetrics(fixture);
    // APOLLO: (53-50)/4=0.75, AISI: (82-80)/4=0.5. Mean = 0.625
    // debt = 25/3 - 0.625
    expect(m.alignmentDebt).toBeCloseTo(25 / 3 - 0.625, 10);
  });

  it('computes lutar-readiness as safetyVel / (capVel + safetyVel)', () => {
    const m = deriveMetrics(fixture);
    const cap = 25 / 3;
    const safe = 0.625;
    expect(m.lutarReadiness).toBeCloseTo(safe / (cap + safe), 10);
    expect(m.lutarReadiness).toBeGreaterThan(0);
    expect(m.lutarReadiness).toBeLessThan(1);
  });

  it('lutar-readiness saturates to 1 when capability stalls and safety climbs', () => {
    const flat: HistoryEntry[] = [
      { date: '2026-05-12', snapshot: { METR: ok(100, '2026-05-12'), APOLLO: ok(50, '2026-05-12') } },
      { date: '2026-05-16', snapshot: { METR: ok(100, '2026-05-16'), APOLLO: ok(60, '2026-05-16') } },
    ];
    const m = deriveMetrics(flat);
    expect(m.horizonVelocity).toBe(0);
    expect(m.lutarReadiness).toBe(1);
  });

  it('lutar-readiness is 0.5 when both velocities are zero', () => {
    const flat: HistoryEntry[] = [
      { date: '2026-05-12', snapshot: { METR: ok(100, '2026-05-12'), APOLLO: ok(50, '2026-05-12') } },
      { date: '2026-05-16', snapshot: { METR: ok(100, '2026-05-16'), APOLLO: ok(50, '2026-05-16') } },
    ];
    const m = deriveMetrics(flat);
    expect(m.lutarReadiness).toBe(0.5);
  });

  it('ignores failed ingest entries when computing series', () => {
    const history: HistoryEntry[] = [
      { date: '2026-05-12', snapshot: { METR: ok(100, '2026-05-12'), APOLLO: ok(50, '2026-05-12') } },
      { date: '2026-05-13', snapshot: { METR: { ok: false, error: 'x', fetchedAt: 'x', sourceUrl: 'x' }, APOLLO: ok(51, '2026-05-13') } },
      { date: '2026-05-16', snapshot: { METR: ok(140, '2026-05-16'), APOLLO: ok(53, '2026-05-16') } },
    ];
    const m = deriveMetrics(history);
    // METR: (140-100)/4 = 10. APOLLO: (53-50)/4 = 0.75
    expect(m.horizonVelocity).toBeCloseTo(10, 10);
    expect(m.alignmentDebt).toBeCloseTo(10 - 0.75, 10);
  });

  it('capability and safety signal IDs are disjoint and non-empty', () => {
    expect(CAPABILITY_SIGNAL_IDS.length).toBeGreaterThan(0);
    expect(SAFETY_SIGNAL_IDS.length).toBeGreaterThan(0);
    const overlap = CAPABILITY_SIGNAL_IDS.filter(id => SAFETY_SIGNAL_IDS.includes(id));
    expect(overlap).toEqual([]);
  });

  it('buildDailySummary embeds derived metrics computed against history+today', () => {
    const today: VariableSnapshot = {
      METR: ok(140, '2026-05-16'), APOLLO: ok(53, '2026-05-16'),
    };
    const history: HistoryEntry[] = [
      { date: '2026-05-12', snapshot: { METR: ok(100, '2026-05-12'), APOLLO: ok(50, '2026-05-12') } },
    ];
    const summary = buildDailySummary('2026-05-16', today, history);
    expect(summary.derived.horizonVelocity).toBeCloseTo(10, 10);
    expect(summary.derived.alignmentDebt).toBeCloseTo(10 - 0.75, 10);
  });

  it('buildDailySummary deduplicates today when caller also includes it in history', () => {
    const today: VariableSnapshot = { METR: ok(140, '2026-05-16'), APOLLO: ok(53, '2026-05-16') };
    const history: HistoryEntry[] = [
      { date: '2026-05-12', snapshot: { METR: ok(100, '2026-05-12'), APOLLO: ok(50, '2026-05-12') } },
      { date: '2026-05-16', snapshot: { METR: ok(999, '2026-05-16'), APOLLO: ok(999, '2026-05-16') } },
    ];
    const summary = buildDailySummary('2026-05-16', today, history);
    expect(summary.derived.horizonVelocity).toBeCloseTo(10, 10);
  });
});
