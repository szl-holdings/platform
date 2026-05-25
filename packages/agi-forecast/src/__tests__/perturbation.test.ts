import { describe, expect, it } from 'vitest';
import {
  firstOrderForecast,
  perturbationResidual,
  residualUpperBound,
} from '../perturbation';

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

/** Family of C² test functionals along with analytic Φ' and an |Φ''| bound. */
const family = [
  {
    Phi:  (x: number) => Math.sin(x),
    Prime: (x: number) => Math.cos(x),
    M: 1,
  },
  {
    Phi:  (x: number) => Math.cos(x),
    Prime: (x: number) => -Math.sin(x),
    M: 1,
  },
  {
    Phi:  (x: number) => x * x * x,
    Prime: (x: number) => 3 * x * x,
    // |Φ''| = |6 x| — we'll compute M per-sample below.
    M: NaN,
  },
  {
    Phi:  (x: number) => Math.exp(x),
    Prime: (x: number) => Math.exp(x),
    M: NaN,
  },
];

describe('Fleming–McGwier O(ε²) residual bound', () => {
  it('residual ≤ (M/2)(εδ)² across 1k random C² samples', () => {
    const rng = mulberry32(0xF1E315);
    const tol = 1e-9;
    for (let i = 0; i < 1000; i++) {
      const f = family[i % family.length]!;
      const x = rng() * 2 - 1;                  // x ∈ [-1, 1]
      const delta = rng() * 2 - 1;              // δ ∈ [-1, 1]
      const eps = (rng() * 0.2 - 0.1);          // ε ∈ [-0.1, 0.1]
      const lo = Math.min(x, x + eps * delta);
      const hi = Math.max(x, x + eps * delta);

      // Compute or use M = sup |Φ''| on [lo, hi].
      let M = f.M;
      if (!Number.isFinite(M)) {
        if (f.Phi(0) === 1 && f.Prime(0) === 1) {
          M = Math.exp(hi);                      // exp
        } else {
          M = 6 * Math.max(Math.abs(lo), Math.abs(hi)); // 6x for x³
        }
      }
      const res = Math.abs(perturbationResidual(f.Phi, f.Prime, x, delta, eps));
      const bound = residualUpperBound(M, eps, delta) + tol;
      expect(res).toBeLessThanOrEqual(bound);
    }
  });

  it('first-order expansion is exact when ε = 0', () => {
    const Phi = (x: number) => Math.tanh(x);
    const PhiPrime = (x: number) => 1 - Math.tanh(x) ** 2;
    expect(firstOrderForecast(Phi, PhiPrime, 0.7, 1.3, 0)).toBeCloseTo(Phi(0.7), 12);
    expect(perturbationResidual(Phi, PhiPrime, 0.7, 1.3, 0)).toBe(0);
  });
});
