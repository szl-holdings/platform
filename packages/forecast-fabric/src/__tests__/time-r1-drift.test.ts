import { describe, expect, it } from 'vitest';
import { NonMonotonicSeriesError, scoreBuckets } from '../features/time-r1-drift.js';

describe('Time-R1 temporal engine', () => {
  it('scores a synthetic series and surfaces a peak drift bucket', () => {
    const start = 1_700_000_000_000;
    const series = Array.from({ length: 60 }, (_, i) => ({
      t: start + i * 60_000,
      v: 10 + Math.sin(i / 6) * 0.4 + (i > 40 && i < 50 ? 5 : 0),
    }));
    const out = scoreBuckets(series, { seriesId: 'unit', baselineBuckets: 5 });
    expect(out.buckets.length).toBeGreaterThan(0);
    expect(out.peakBucket).not.toBeNull();
    expect(Math.abs(out.peakBucket!.driftScore)).toBeGreaterThan(0);
    expect(out.forecast.confidence).toBeGreaterThan(0);
    expect(out.causalPriorViolations).toEqual([]);
  });

  it('refuses non-monotonic timestamps unless explicitly allowed', () => {
    const series = [
      { t: 100, v: 1 },
      { t: 200, v: 2 },
      { t: 150, v: 3 },
      { t: 300, v: 4 },
    ];
    expect(() => scoreBuckets(series)).toThrow(NonMonotonicSeriesError);
    const out = scoreBuckets(series, { allowNonMonotonic: true });
    expect(out.causalPriorViolations).toEqual([2]);
  });
});
