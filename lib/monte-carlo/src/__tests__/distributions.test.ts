import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCDF,
  buildHistogram,
  type Distribution,
  distributionStats,
  sample,
  sampleBatch,
} from '../distributions.js';

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

describe('sample()', () => {
  it('returns the configured value for a constant distribution', () => {
    expect(sample({ type: 'constant', value: 42 })).toBe(42);
  });

  it('uniform sampling stays within [min, max]', () => {
    const dist: Distribution = { type: 'uniform', min: 5, max: 9 };
    const xs = sampleBatch(dist, 500);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(5);
    expect(Math.max(...xs)).toBeLessThanOrEqual(9);
    expect(mean(xs)).toBeGreaterThan(5);
    expect(mean(xs)).toBeLessThan(9);
  });

  it('normal sampling has mean approximately equal to the configured mean', () => {
    const xs = sampleBatch({ type: 'normal', mean: 100, stdDev: 10 }, 5000);
    expect(mean(xs)).toBeGreaterThan(95);
    expect(mean(xs)).toBeLessThan(105);
  });

  it('triangular sampling stays within [min, max]', () => {
    const xs = sampleBatch({ type: 'triangular', min: 0, mode: 5, max: 10 }, 500);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThanOrEqual(10);
  });

  it('beta sampling with min/max stays within bounds', () => {
    const xs = sampleBatch({ type: 'beta', alpha: 2, beta: 5, min: 0, max: 1 }, 500);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThanOrEqual(1);
  });

  it('poisson sampling produces non-negative integers', () => {
    const xs = sampleBatch({ type: 'poisson', lambda: 3 }, 500);
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(x)).toBe(true);
    }
  });

  it('log-normal sampling produces strictly positive values', () => {
    const xs = sampleBatch({ type: 'log_normal', mean: 5, stdDev: 2 }, 500);
    expect(Math.min(...xs)).toBeGreaterThan(0);
  });

  it('custom sampling honours weights', () => {
    // Force the first weight branch by stubbing Math.random
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const dist: Distribution = { type: 'custom', values: [10, 20, 30], weights: [1, 1, 1] };
    expect(sample(dist)).toBe(10);
    spy.mockReturnValue(0.99);
    expect(sample(dist)).toBe(30);
    spy.mockRestore();
  });

  it('custom sampling without weights picks from the value list', () => {
    const xs = sampleBatch({ type: 'custom', values: [1, 2, 3] }, 500);
    for (const x of xs) expect([1, 2, 3]).toContain(x);
  });
});

describe('distributionStats()', () => {
  it('computes mean, median, percentiles and bounds correctly', () => {
    const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const s = distributionStats(xs);
    expect(s.mean).toBeCloseTo(5.5, 6);
    expect(s.median).toBeCloseTo(5.5, 6);
    expect(s.min).toBe(1);
    expect(s.max).toBe(10);
    expect(s.p25).toBeCloseTo(3.25, 6);
    expect(s.p75).toBeCloseTo(7.75, 6);
    expect(s.confidenceInterval95.lower).toBeLessThan(s.mean);
    expect(s.confidenceInterval95.upper).toBeGreaterThan(s.mean);
  });

  it('returns zero skew/kurtosis when stdDev is zero', () => {
    const s = distributionStats([7, 7, 7, 7]);
    expect(s.stdDev).toBe(0);
    expect(s.skewness).toBe(0);
    expect(s.kurtosis).toBe(0);
  });
});

describe('histogram and CDF helpers', () => {
  it('buildHistogram sums to the input length', () => {
    const xs = sampleBatch({ type: 'uniform', min: 0, max: 1 }, 200);
    const buckets = buildHistogram(xs, 10);
    expect(buckets).toHaveLength(10);
    const total = buckets.reduce((s, b) => s + b.count, 0);
    expect(total).toBe(200);
    const freqSum = buckets.reduce((s, b) => s + b.frequency, 0);
    expect(freqSum).toBeCloseTo(1, 6);
  });

  it('buildCDF is monotonically non-decreasing in cumulative probability', () => {
    const xs = sampleBatch({ type: 'normal', mean: 0, stdDev: 1 }, 200);
    const cdf = buildCDF(xs, 25);
    expect(cdf).toHaveLength(25);
    for (let i = 1; i < cdf.length; i++) {
      expect(cdf[i]!.cumProb).toBeGreaterThanOrEqual(cdf[i - 1]!.cumProb);
    }
    expect(cdf[cdf.length - 1]!.cumProb).toBeCloseTo(1, 2);
  });
});
