import { describe, expect, it } from 'vitest';
import { canonicalizeEgyptian, computeLambda, parseEgyptianFraction } from './index.js';

describe('parseEgyptianFraction', () => {
  it('parses simple unit fractions', () => {
    const f = parseEgyptianFraction('1/3');
    expect(f.p).toBe(1n);
    expect(f.q).toBe(3n);
  });
  it('parses Egyptian sums', () => {
    const f = parseEgyptianFraction('1/3+1/12');
    // 1/3 + 1/12 = 4/12 + 1/12 = 5/12
    expect(f.p).toBe(5n);
    expect(f.q).toBe(12n);
  });
  it('parses integers', () => {
    expect(parseEgyptianFraction('2')).toEqual({ p: 2n, q: 1n });
    expect(parseEgyptianFraction(3)).toEqual({ p: 3n, q: 1n });
  });
  it('rejects empty / malformed atoms', () => {
    expect(() => parseEgyptianFraction('')).toThrow();
    expect(() => parseEgyptianFraction('1/0')).toThrow();
    expect(() => parseEgyptianFraction('1/3+')).toThrow();
  });
});

describe('canonicalizeEgyptian', () => {
  it('decomposes 5/6 greedily', () => {
    // 5/6 = 1/2 + 1/3
    expect(canonicalizeEgyptian('5/6')).toEqual(['1/2', '1/3']);
  });
  it('decomposes 1 as 1/1', () => {
    expect(canonicalizeEgyptian('1')).toEqual(['1/1']);
  });
  it('returns [] for 0', () => {
    expect(canonicalizeEgyptian('0')).toEqual([]);
  });
});

describe('computeLambda — bounds', () => {
  it('B1: rejects score outside [0,1]', () => {
    expect(() =>
      computeLambda({ components: [{ name: 'a', weight: 1, score: 1.5 }] }),
    ).toThrow(/B1/);
  });

  it('B2: rejects negative weight', () => {
    expect(() =>
      computeLambda({ components: [{ name: 'a', weight: -1, score: 0.5 }] }),
    ).toThrow(/B2/);
  });

  it('B2: rejects all-zero weights', () => {
    expect(() =>
      computeLambda({
        components: [
          { name: 'a', weight: 0, score: 0.5 },
          { name: 'b', weight: 0, score: 0.7 },
        ],
      }),
    ).toThrow(/B2/);
  });

  it('B3+B4: equal weights → unweighted geometric mean', () => {
    const r = computeLambda({
      components: [
        { name: 'a', weight: '1/3', score: 0.5 },
        { name: 'b', weight: '1/3', score: 0.8 },
        { name: 'c', weight: '1/3', score: 1.0 },
      ],
    });
    const expected = (0.5 * 0.8 * 1.0) ** (1 / 3);
    expect(r.lambda).toBeCloseTo(expected, 10);
    expect(r.lambda).toBeGreaterThanOrEqual(0.5);
    expect(r.lambda).toBeLessThanOrEqual(1.0);
  });

  it('Egyptian-fraction weights compose: 1/3+1/12 = 5/12', () => {
    const r = computeLambda({
      components: [
        { name: 'a', weight: '1/3+1/12', score: 0.9 },
        { name: 'b', weight: '7/12', score: 0.4 },
      ],
    });
    // 5/12 + 7/12 = 1 → already normalized
    const expected = 0.9 ** (5 / 12) * 0.4 ** (7 / 12);
    expect(r.lambda).toBeCloseTo(expected, 10);
  });

  it('B4: zero score with positive weight → Λ = 0', () => {
    const r = computeLambda({
      components: [
        { name: 'a', weight: 1, score: 0 },
        { name: 'b', weight: 1, score: 0.9 },
      ],
    });
    expect(r.lambda).toBe(0);
  });

  it('identical scores → Λ equals that score (sandwich tight)', () => {
    const r = computeLambda({
      components: [
        { name: 'a', weight: '1/4', score: 0.73 },
        { name: 'b', weight: '1/4', score: 0.73 },
        { name: 'c', weight: '1/2', score: 0.73 },
      ],
    });
    expect(r.lambda).toBeCloseTo(0.73, 12);
  });
});

describe('computeLambda — 10k fuzz', () => {
  it('produces bounded Λ on 10,000 random inputs', () => {
    // Deterministic PRNG so failures are reproducible.
    let seed = 0x9e3779b9;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };

    for (let i = 0; i < 10_000; i++) {
      const n = 2 + Math.floor(rand() * 7); // 2..8 components
      const components = Array.from({ length: n }, (_, k) => ({
        name: `c${k}`,
        weight: rand() < 0.5 ? `1/${1 + Math.floor(rand() * 12)}` : rand() + 0.001,
        score: rand(),
      }));
      const { lambda } = computeLambda({ components });
      const positiveScores = components.map((c) => c.score);
      const lo = Math.min(...positiveScores);
      const hi = Math.max(...positiveScores);
      expect(lambda).toBeGreaterThanOrEqual(0);
      expect(lambda).toBeLessThanOrEqual(1);
      // Sandwich bound with float epsilon
      expect(lambda).toBeGreaterThanOrEqual(lo - 1e-9);
      expect(lambda).toBeLessThanOrEqual(hi + 1e-9);
    }
  });
});
