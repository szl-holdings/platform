import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { buildDailySummary, canonicalize, type VariableSnapshot } from '../forecast-summary';
import { assertAllowedLicense } from '../licenses';

const snapshot: VariableSnapshot = {
  METR: { ok: true, value: 100, fetchedAt: '2026-05-16T00:00:00.000Z', sourceUrl: 'https://api.github.com/repos/METR/public-tasks' },
  EPOCH: { ok: true, value: 700, fetchedAt: '2026-05-16T00:00:00.000Z', sourceUrl: 'https://epoch.ai/data/notable_ai_models.csv' },
  ARC: { ok: false, error: 'HTTP 503', fetchedAt: '2026-05-16T00:00:00.000Z', sourceUrl: 'https://api.github.com/repos/fchollet/ARC-AGI' },
};

describe('buildDailySummary', () => {
  it('is deterministic — same snapshot yields same receiptHash', () => {
    const a = buildDailySummary('2026-05-16', snapshot);
    const b = buildDailySummary('2026-05-16', snapshot);
    expect(a.receiptHash).toBe(b.receiptHash);
    expect(a.receiptHash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.id).toBe('forecast.summary@2026-05-16');
    expect(a.ingestionPolicy).toBe('PUBLIC_ONLY');
  });

  it('receiptHash equals sha256 of the canonicalized snapshot only', () => {
    const a = buildDailySummary('2026-05-16', snapshot);
    const expected = createHash('sha256').update(canonicalize(snapshot), 'utf8').digest('hex');
    expect(a.receiptHash).toBe(expected);
  });

  it('receiptHash is independent of the date field (snapshot-only)', () => {
    const a = buildDailySummary('2026-05-16', snapshot);
    const b = buildDailySummary('2026-05-17', snapshot);
    expect(a.receiptHash).toBe(b.receiptHash);
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
