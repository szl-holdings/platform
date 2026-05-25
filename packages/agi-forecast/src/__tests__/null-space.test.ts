import { describe, expect, it } from 'vitest';
import { projectionResidual, projectOntoNullSpace, type Matrix } from '../null-space';

/** Deterministic mulberry32 PRNG so test runs are reproducible. */
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

function randomMatrix(rng: () => number, m: number, n: number): Matrix {
  const A: number[][] = [];
  for (let i = 0; i < m; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) row.push(rng() * 2 - 1);
    A.push(row);
  }
  return A;
}

function randomVector(rng: () => number, n: number): number[] {
  const v: number[] = [];
  for (let i = 0; i < n; i++) v.push(rng() * 2 - 1);
  return v;
}

describe('null-space projection (Sodagari et al.)', () => {
  it('A (P v) ≈ 0 across 1k random fat matrices', () => {
    const rng = mulberry32(0xC0E1571);
    const samples = 1000;
    let maxRes = 0;
    for (let i = 0; i < samples; i++) {
      // Use fat matrices (m < n) so the null-space is non-trivial.
      const n = 3 + Math.floor(rng() * 6);   // 3..8
      const m = 1 + Math.floor(rng() * (n - 1));
      const A = randomMatrix(rng, m, n);
      const v = randomVector(rng, n);
      const res = projectionResidual(A, v);
      if (res > maxRes) maxRes = res;
      expect(res).toBeLessThan(1e-8);
    }
    expect(maxRes).toBeLessThan(1e-8);
  });

  it('projects to zero when v already lies in the row-space', () => {
    const A: Matrix = [[1, 0], [0, 1]]; // full rank ⇒ ker = {0}
    const Pv = projectOntoNullSpace(A, [3, 4]);
    expect(Pv[0]).toBeCloseTo(0, 10);
    expect(Pv[1]).toBeCloseTo(0, 10);
  });
});
