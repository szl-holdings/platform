import { describe, expect, it } from 'vitest';
import { createDriftDetector, type DriftObservation } from './drift-detector.js';

function obs(over: Partial<DriftObservation>): DriftObservation {
  return {
    formulaId: 'f1',
    parameter: 'p1',
    observed: 1.5,
    baseline: 1.0,
    oldValue: 0.7,
    candidateValue: 0.9,
    fromVersion: 'v1',
    thesisCitation: 'docs/thesis/v10-canonical.md',
    ...over,
  };
}

describe('inspectBuckets()', () => {
  it('reports a warming-up bucket with willFire=false and progress<1', () => {
    const d = createDriftDetector({ samplesMin: 10, gapMin: 0.1 });
    for (let i = 0; i < 3; i++) d.record(obs({ observed: 1.3, baseline: 1.0 }));
    const snaps = d.inspectBuckets();
    expect(snaps).toHaveLength(1);
    const b = snaps[0];
    expect(b.willFire).toBe(false);
    expect(b.sampleCount).toBe(3);
    expect(b.samplesMinTarget).toBe(10);
    expect(b.progressSamples).toBeCloseTo(0.3, 5);
    expect(b.progressGap).toBeGreaterThan(1 - 1e-9); // 30% gap >> 10% target → capped at 1
    expect(b.meanGap).toBeCloseTo(0.3, 5);
    expect(b.observedTail).toHaveLength(3);
    expect(b.baselineTail).toHaveLength(3);
  });

  it('flips willFire=true once the bucket has crossed both thresholds', () => {
    const d = createDriftDetector({ samplesMin: 5, gapMin: 0.1 });
    for (let i = 0; i < 5; i++) d.record(obs({ observed: 1.5, baseline: 1.0 }));
    const [b] = d.inspectBuckets();
    expect(b.willFire).toBe(true);
    expect(b.sampleCount).toBe(5);
    expect(b.meanGap).toBeCloseTo(0.5, 5);
  });

  it('does NOT fire when samples are sufficient but gap is below threshold', () => {
    const d = createDriftDetector({ samplesMin: 3, gapMin: 0.2 });
    for (let i = 0; i < 5; i++) d.record(obs({ observed: 1.05, baseline: 1.0 })); // 5% gap
    const [b] = d.inspectBuckets();
    expect(b.sampleCount).toBe(5);
    expect(b.willFire).toBe(false);
    expect(b.meanGap).toBeCloseTo(0.05, 5);
    expect(b.progressGap).toBeCloseTo(0.25, 5);
  });

  it('sorts firing buckets first, then by gap×samples progress', () => {
    const d = createDriftDetector({ samplesMin: 5, gapMin: 0.1 });
    // bucket A: warming, low progress
    d.record(obs({ formulaId: 'A', observed: 1.05, baseline: 1.0 }));
    // bucket B: firing
    for (let i = 0; i < 5; i++) d.record(obs({ formulaId: 'B', observed: 1.5, baseline: 1.0 }));
    // bucket C: warming, higher progress than A
    for (let i = 0; i < 3; i++) d.record(obs({ formulaId: 'C', observed: 1.3, baseline: 1.0 }));
    const ids = d.inspectBuckets().map((b) => b.formulaId);
    expect(ids[0]).toBe('B');
    expect(ids.indexOf('C')).toBeLessThan(ids.indexOf('A'));
  });

  it('caps the observed/baseline tail at 60 even when the window is larger', () => {
    const d = createDriftDetector({ samplesMin: 5, gapMin: 0.1, windowSize: 120 });
    for (let i = 0; i < 100; i++) d.record(obs({ observed: 1.2, baseline: 1.0 }));
    const [b] = d.inspectBuckets();
    expect(b.sampleCount).toBe(100);
    expect(b.observedTail).toHaveLength(60);
    expect(b.baselineTail).toHaveLength(60);
  });

  it('returns an empty list when no observations have been recorded', () => {
    const d = createDriftDetector();
    expect(d.inspectBuckets()).toEqual([]);
  });
});
