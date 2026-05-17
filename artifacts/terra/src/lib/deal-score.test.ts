import { describe, expect, it } from 'vitest';
import { autonomyGate } from '@szl-holdings/formulas';
import { dealScore, dealScoreNormalized } from './deal-score.js';

describe('dealScoreNormalized → autonomyGate', () => {
  it('clean low-value deal → auto', () => {
    const r = dealScoreNormalized({
      severity: 0.2,
      likelihood: 0.3,
      dealValueUsd: 250_000,
    });
    // 0.2 * 0.3 * 250_000 = 15_000 / 1_000_000 = 0.015 → auto
    expect(r).toBeCloseTo(0.015, 10);
    expect(autonomyGate(r)).toBe('auto');
  });

  it('mid-risk deal needing operator → approve', () => {
    const r = dealScoreNormalized({
      severity: 0.5,
      likelihood: 0.6,
      dealValueUsd: 1_000_000,
    });
    // 0.5 * 0.6 * 1_000_000 = 300_000 / 1_000_000 = 0.3 → approve
    expect(r).toBeCloseTo(0.3, 10);
    expect(autonomyGate(r)).toBe('approve');
  });

  it('high-value, high-risk deal → multi-party', () => {
    const r = dealScoreNormalized({
      severity: 0.85,
      likelihood: 0.9,
      dealValueUsd: 900_000,
    });
    // 0.85 * 0.9 * 900_000 = 688_500 / 1_000_000 = 0.6885 → multi-party
    expect(r).toBeCloseTo(0.6885, 10);
    expect(autonomyGate(r)).toBe('multi-party');
  });

  it('respects a custom cap to compress mid-size deals', () => {
    const r = dealScoreNormalized({
      severity: 0.6,
      likelihood: 0.6,
      dealValueUsd: 250_000,
      cap: 250_000,
    });
    // 0.6 * 0.6 * 250_000 = 90_000 / 250_000 = 0.36 → approve
    expect(r).toBeCloseTo(0.36, 10);
    expect(autonomyGate(r)).toBe('approve');
  });

  it('non-normalized variant returns raw severity·likelihood·dealValueUsd', () => {
    expect(
      dealScore({ severity: 0.3, likelihood: 0.5, dealValueUsd: 800_000 }),
    ).toBeCloseTo(120_000, 6);
  });
});
