/**
 * Operational unit tests for the Ouroboros Gauß axis port.
 *
 * Covers:
 *   - Exact recovery of a known overdetermined system
 *   - Closure axis G = 1 for a perfectly closed network
 *   - Closure axis G < 1 for a noisy network
 *   - Residual fit detects non-Gaussian residuals
 *   - Defensive errors on malformed input
 */
import { describe, it, expect } from 'vitest';
import {
  leastSquares,
  gaussClosureAxis,
  residualFit,
} from '../index.js';

describe('ouroboros-gauss · operational port', () => {
  it('recovers the true solution for a noiseless overdetermined system', () => {
    // True x = [2, -1]. Three rows in R^2.
    const A = [
      [1, 0],
      [0, 1],
      [1, 1],
    ];
    const xTrue = [2, -1];
    const b = A.map((row) => row[0]! * xTrue[0]! + row[1]! * xTrue[1]!);
    const r = leastSquares({ A, b });
    expect(r.solution[0]).toBeCloseTo(2, 10);
    expect(r.solution[1]).toBeCloseTo(-1, 10);
    expect(r.residualNorm).toBeLessThan(1e-9);
    expect(r.normalsPositiveDefinite).toBe(true);
  });

  it('closure axis is exactly 1 for a noiseless closed network', () => {
    const A = [
      [1, 0],
      [0, 1],
      [1, 1],
    ];
    const b = [1, 2, 3];
    const r = leastSquares({ A, b });
    const G = gaussClosureAxis(r, 1);
    expect(G).toBeCloseTo(1, 10);
  });

  it('closure axis decays strictly below 1 with injected noise', () => {
    const A = [
      [1, 0],
      [0, 1],
      [1, 1],
    ];
    const bClean = [1, 2, 3];
    const bNoisy = [1.3, 1.7, 3.4];
    const rClean = leastSquares({ A, b: bClean });
    const rNoisy = leastSquares({ A, b: bNoisy });
    const Gc = gaussClosureAxis(rClean, 1);
    const Gn = gaussClosureAxis(rNoisy, 1);
    expect(Gc).toBeGreaterThan(Gn);
    expect(Gn).toBeGreaterThan(0);
    expect(Gn).toBeLessThan(1);
  });

  it('refuses underdetermined systems and ragged matrices', () => {
    expect(() => leastSquares({ A: [[1, 2, 3]], b: [1] })).toThrow();
    expect(() => leastSquares({ A: [[1, 2], [3]], b: [1, 2] })).toThrow();
    expect(() => leastSquares({ A: [[1, 2]], b: [1, 2] })).toThrow();
  });

  it('residualFit returns GAUSSIAN verdict on Box–Muller draws (JB ≤ 5.99 = χ²(2) 95th pct)', () => {
    // Deterministic pseudo-Gaussian via Box–Muller from a fixed seed.
    const n = 1024;
    const r: number[] = [];
    let s = 1n;
    const rand = () => {
      s = (s * 6364136223846793005n + 1442695040888963407n) & ((1n << 64n) - 1n);
      return Number((s >> 11n) & ((1n << 53n) - 1n)) / 2 ** 53;
    };
    for (let i = 0; i < n; i += 2) {
      const u1 = Math.max(rand(), 1e-12);
      const u2 = rand();
      const mag = Math.sqrt(-2 * Math.log(u1));
      r.push(mag * Math.cos(2 * Math.PI * u2));
      r.push(mag * Math.sin(2 * Math.PI * u2));
    }
    const fit = residualFit(r);
    expect(fit.n).toBe(n);
    expect(fit.verdict).toBe('GAUSSIAN');
    // χ²(2) 95th percentile is 5.99 — a true Gaussian sample at n=1024
    // sits far below this with overwhelming probability.
    expect(fit.jarqueBera).toBeLessThanOrEqual(5.99);
  });

  it('residualFit flags clearly non-Gaussian residuals with NON_GAUSSIAN verdict', () => {
    // A bimodal ±1 distribution — kurtosis = 1, excess = −2 ⇒ high JB at n=512.
    const r: number[] = [];
    for (let i = 0; i < 512; i++) r.push(i % 2 === 0 ? 1 : -1);
    const fit = residualFit(r);
    expect(fit.jarqueBera).toBeGreaterThan(5.99);
    expect(fit.verdict).toBe('NON_GAUSSIAN');
  });
});
