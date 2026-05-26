import { describe, expect, it } from 'vitest';
import {
  covarianceDeviation,
  empiricalCovariance,
  montanariCovarianceBound,
  operatorNorm,
  sampleMean,
} from '../concentration';

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

function gaussian(rng: () => number): number {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

describe('Montanari concentration bounds', () => {
  it('empiricalCovariance recovers identity in the large-n limit', () => {
    const rng = mulberry32(0xC0A1);
    const d = 4;
    const n = 4000;
    const samples = Array.from({ length: n }, () =>
      Array.from({ length: d }, () => gaussian(rng)),
    );
    const cov = empiricalCovariance(samples);
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) {
        const target = i === j ? 1 : 0;
        expect(Math.abs(cov[i]![j]! - target)).toBeLessThan(0.1);
      }
    }
  });

  it('covariance deviation is within the Montanari bound for sub-Gaussian samples', () => {
    const rng = mulberry32(0xB0EB);
    const d = 4;
    const n = 2000;
    const sigma = 1;
    const truth = Array.from({ length: d }, (_, i) =>
      Array.from({ length: d }, (__, j) => (i === j ? 1 : 0)),
    );
    let passes = 0;
    const trials = 25;
    for (let t = 0; t < trials; t++) {
      const samples = Array.from({ length: n }, () =>
        Array.from({ length: d }, () => sigma * gaussian(rng)),
      );
      const dev = covarianceDeviation({
        samples,
        trueCovariance: truth,
        sigma,
        delta: 0.05,
      });
      if (dev.withinBound) passes++;
    }
    expect(passes / trials).toBeGreaterThanOrEqual(0.95);
  });

  it('operatorNorm matches the largest singular value on a diagonal matrix', () => {
    const D = [
      [3, 0, 0],
      [0, -2, 0],
      [0, 0, 1],
    ];
    expect(operatorNorm(D)).toBeCloseTo(3, 4);
  });

  it('sampleMean averages component-wise and rejects empty input', () => {
    expect(sampleMean([[1, 2], [3, 4], [5, 6]])).toEqual([3, 4]);
    expect(() => sampleMean([])).toThrow();
  });

  it('montanariCovarianceBound rejects invalid parameters', () => {
    expect(() => montanariCovarianceBound({ n: 0, d: 1, sigma: 1, delta: 0.05 })).toThrow();
    expect(() => montanariCovarianceBound({ n: 10, d: 0, sigma: 1, delta: 0.05 })).toThrow();
    expect(() => montanariCovarianceBound({ n: 10, d: 1, sigma: -1, delta: 0.05 })).toThrow();
    expect(() => montanariCovarianceBound({ n: 10, d: 1, sigma: 1, delta: 0 })).toThrow();
    expect(() => montanariCovarianceBound({ n: 10, d: 1, sigma: 1, delta: 1 })).toThrow();
  });
});
