import { describe, expect, it } from 'vitest';
import { autonomyGate } from '@szl-holdings/formulas';
import { matterRisk, matterRiskNormalized } from './matter-risk.js';

describe('matterRiskNormalized → autonomyGate', () => {
  it('routine filing with low exposure → auto', () => {
    const r = matterRiskNormalized({
      severity: 0.2,
      likelihood: 0.4,
      exposureUsd: 100_000,
    });
    // 0.2 * 0.4 * 100_000 = 8_000 / 1_000_000 = 0.008 → auto
    expect(r).toBeCloseTo(0.008, 10);
    expect(autonomyGate(r)).toBe('auto');
  });

  it('contested matter with mid exposure → approve', () => {
    const r = matterRiskNormalized({
      severity: 0.6,
      likelihood: 0.6,
      exposureUsd: 1_000_000,
    });
    // 0.6 * 0.6 * 1_000_000 = 360_000 capped at 1_000_000 → 0.36 → approve
    expect(r).toBeCloseTo(0.36, 10);
    expect(autonomyGate(r)).toBe('approve');
  });

  it('bet-the-company litigation → multi-party', () => {
    const r = matterRiskNormalized({
      severity: 0.9,
      likelihood: 0.85,
      exposureUsd: 1_000_000,
    });
    // 0.9 * 0.85 * 1_000_000 = 765_000 / 1_000_000 = 0.765 → multi-party
    expect(r).toBeCloseTo(0.765, 10);
    expect(autonomyGate(r)).toBe('multi-party');
  });

  it('exposure above default cap clamps to multi-party', () => {
    const r = matterRiskNormalized({
      severity: 1,
      likelihood: 1,
      exposureUsd: 50_000_000,
    });
    expect(r).toBe(1);
    expect(autonomyGate(r)).toBe('multi-party');
  });

  it('non-normalized variant returns raw severity·likelihood·exposure', () => {
    expect(
      matterRisk({ severity: 0.4, likelihood: 0.5, exposureUsd: 500_000 }),
    ).toBeCloseTo(100_000, 6);
  });
});
