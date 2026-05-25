import { describe, expect, it } from 'vitest';
import { heCoeff3, heCoeff4, type RawMoments } from '../moments';

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

describe('GCA Hermite coefficients (Kawamoto–McGwier)', () => {
  it('heCoeff3 is degree-3 homogeneous in t (Lean heCoeff3_homogeneous, 1k samples)', () => {
    const rng = mulberry32(0xA0A03);
    for (let i = 0; i < 1000; i++) {
      const t = (rng() * 4 - 2);                       // t ∈ [-2, 2]
      const m1 = rng() * 4 - 2;
      const m2 = rng() * 4 - 2;
      const m3 = rng() * 4 - 2;
      const lhs: RawMoments = { m1: t * m1, m2: t ** 2 * m2, m3: t ** 3 * m3, m4: 0 };
      const rhs = t ** 3 * heCoeff3({ m1, m2, m3, m4: 0 });
      expect(heCoeff3(lhs)).toBeCloseTo(rhs, 8);
    }
  });

  it('heCoeff4 is degree-4 homogeneous in t (Lean heCoeff4_homogeneous, 1k samples)', () => {
    const rng = mulberry32(0xA0A04);
    for (let i = 0; i < 1000; i++) {
      const t = rng() * 4 - 2;
      const m1 = rng() * 4 - 2;
      const m2 = rng() * 4 - 2;
      const m3 = rng() * 4 - 2;
      const m4 = rng() * 4 - 2;
      const lhs: RawMoments = {
        m1: t * m1,
        m2: t ** 2 * m2,
        m3: t ** 3 * m3,
        m4: t ** 4 * m4,
      };
      const rhs = t ** 4 * heCoeff4({ m1, m2, m3, m4 });
      expect(heCoeff4(lhs)).toBeCloseTo(rhs, 8);
    }
  });

  it('centred specialisations match the Lean corollaries', () => {
    expect(heCoeff3({ m1: 0, m2: 2.5, m3: 7, m4: 0 })).toBeCloseTo(7 / 6, 12);
    const m4 = 9; const m2 = 1.5;
    expect(heCoeff4({ m1: 0, m2, m3: 0, m4 })).toBeCloseTo((m4 - 3 * m2 ** 2) / 24, 12);
  });
});
