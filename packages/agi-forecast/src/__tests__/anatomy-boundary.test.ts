import { describe, expect, it } from 'vitest';
import {
  hendersonMcGwierConstant,
  picardDisagreement,
  withinUniquenessRegime,
} from '../anatomy-boundary';

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('Henderson–McGwier 4th-order BVP uniqueness', () => {
  it('reports the closed-form optimal constant 384 / (b - a)^4', () => {
    expect(hendersonMcGwierConstant(0, 1)).toBeCloseTo(384, 12);
    expect(hendersonMcGwierConstant(0, 2)).toBeCloseTo(384 / 16, 12);
  });

  it('two-seed solver agreement across 1k random sub-Lipschitz regimes', () => {
    const rng = mulberry32(0xB7B11C);
    let maxGap = 0;
    for (let i = 0; i < 1000; i++) {
      // Contractive linear nonlinearity: α ∈ (-0.95, 0.95) ⇒ Banach unique.
      const alpha = rng() * 1.9 - 0.95;
      const beta = rng() * 10 - 5;
      const seedA = rng() * 100 - 50;
      const seedB = rng() * 100 - 50;
      // Keep interval narrow so 384/(b-a)^4 stays well above |α| ≤ 0.95.
      const a = 0;
      const b = 1 + rng() * 1.5;           // interval (1, 2.5]
      const L = Math.abs(alpha);
      expect(withinUniquenessRegime(L, a, b)).toBe(true);
      const gap = picardDisagreement(alpha, beta, seedA, seedB, 400);
      if (gap > maxGap) maxGap = gap;
      expect(gap).toBeLessThan(1e-6);
    }
    expect(maxGap).toBeLessThan(1e-6);
  });

  it('rejects Lipschitz constants above the HM bound', () => {
    expect(withinUniquenessRegime(500, 0, 1)).toBe(false);
    expect(withinUniquenessRegime(-1, 0, 1)).toBe(false);
  });
});
