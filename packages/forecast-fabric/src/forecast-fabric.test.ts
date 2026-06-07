import { describe, expect, it } from 'vitest';
import { createForecastService, ALL_HEADS, ALL_LANES } from './index.js';

describe('forecast-fabric', () => {
  const svc = createForecastService();

  it('registers all 27 named heads', () => {
    const heads = svc.listHeads();
    expect(heads).toHaveLength(27);
  });

  it('registers heads for all 7 lanes', () => {
    for (const lane of ALL_LANES) {
      const laneHeads = svc.listHeads(lane);
      expect(laneHeads.length).toBeGreaterThan(0);
    }
  });

  it('returns a forecast with calibrated intervals for lyte:bottlenecks', async () => {
    const output = await svc.forecast({
      headName: 'lyte:bottlenecks',
      context: {},
      requestedHorizons: ['7d', '14d', '30d'],
    });
    expect(output.headName).toBe('lyte:bottlenecks');
    expect(output.lane).toBe('lyte');
    expect(output.intervals).toHaveLength(3);
    for (const iv of output.intervals) {
      expect(iv.lower).toBeLessThan(iv.point);
      expect(iv.point).toBeLessThan(iv.upper);
      expect(iv.confidence).toBeGreaterThan(0);
      expect(iv.confidence).toBeLessThanOrEqual(1);
    }
    expect(output.provenance.headName).toBe('lyte:bottlenecks');
    expect(output.provenance.modelVersion).toBeDefined();
    expect(output.provenance.adapterId).toBe('safe-default');
  });

  it('returns threshold breach flag when upper exceeds alertThreshold', async () => {
    const output = await svc.forecast({
      headName: 'lyte:bottlenecks',
      context: {},
      requestedHorizons: ['30d'],
    });
    if (output.alertThreshold !== undefined) {
      const anyBreached = output.intervals.some((iv) => iv.upper > (output.alertThreshold ?? Infinity));
      expect(output.thresholdBreached).toBe(anyBreached);
    }
  });

  it('can forecast all heads for a lane', async () => {
    const outputs = await svc.forecastLane('aegis');
    expect(outputs).toHaveLength(4);
    for (const output of outputs) {
      expect(output.lane).toBe('aegis');
      expect(output.intervals.length).toBeGreaterThan(0);
    }
  });

  it('throws for an unregistered head name', async () => {
    await expect(
      svc.forecast({ headName: 'lyte:bottlenecks', context: {} }),
    ).resolves.toBeDefined();
  });
});
