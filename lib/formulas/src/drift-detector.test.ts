import { describe, expect, it, vi } from 'vitest';
import {
  createDriftDetector,
  type DriftBucketState,
  type DriftObservation,
} from './drift-detector.js';
import { hoeffdingLowerBound } from './evolution.js';

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

describe('drainSignals() — gapHistory forwarding', () => {
  it('attaches the per-sample gapHistory to each emitted signal so the ROSIE LCB gate can run', () => {
    const d = createDriftDetector({ samplesMin: 5, gapMin: 0.1 });
    for (let i = 0; i < 5; i++) d.record(obs({ observed: 1.2, baseline: 1.0 }));
    const [sig] = d.drainSignals();
    expect(sig).toBeDefined();
    expect(sig.gapHistory).toBeDefined();
    expect(sig.gapHistory!).toHaveLength(5);
    // Every sample is a 20% gap → mean 0.2 → LCB at 95% should be 0
    // (clamped) because n=5 is too thin (radius ≈ 0.547).
    const lcb = hoeffdingLowerBound(0.2, 5, 0.05);
    expect(lcb).toBe(0);
  });
});

describe('persistence hooks', () => {
  it('fires onBucketChanged on every record() call with a lossless snapshot', () => {
    const onBucketChanged = vi.fn();
    const d = createDriftDetector({ samplesMin: 5, gapMin: 0.1 }, { onBucketChanged });
    d.record(obs({ observed: 1.3, baseline: 1.0 }));
    d.record(obs({ observed: 1.4, baseline: 1.0 }));
    expect(onBucketChanged).toHaveBeenCalledTimes(2);
    const last = onBucketChanged.mock.calls[1][0] as DriftBucketState;
    expect(last.observedHistory).toEqual([1.3, 1.4]);
    expect(last.baselineHistory).toEqual([1.0, 1.0]);
    expect(last.gapHistory).toHaveLength(2);
    expect(last.totalSamples).toBe(2);
  });

  it('fires onBucketDeleted when drainSignals removes a fired bucket', () => {
    const onBucketDeleted = vi.fn();
    const d = createDriftDetector({ samplesMin: 3, gapMin: 0.1 }, { onBucketDeleted });
    for (let i = 0; i < 3; i++) d.record(obs({ observed: 1.5, baseline: 1.0 }));
    const signals = d.drainSignals();
    expect(signals).toHaveLength(1);
    expect(onBucketDeleted).toHaveBeenCalledOnce();
    expect(onBucketDeleted).toHaveBeenCalledWith('f1', 'p1');
  });

  it('fires onBucketDeleted once per remaining bucket on reset()', () => {
    const onBucketDeleted = vi.fn();
    const d = createDriftDetector({ samplesMin: 5, gapMin: 0.1 }, { onBucketDeleted });
    d.record(obs({ formulaId: 'A', observed: 1.2, baseline: 1.0 }));
    d.record(obs({ formulaId: 'B', observed: 1.3, baseline: 1.0 }));
    d.reset();
    expect(onBucketDeleted).toHaveBeenCalledTimes(2);
  });

  it('swallows persistence errors so record() never throws', () => {
    const d = createDriftDetector(
      {},
      {
        onBucketChanged: () => {
          throw new Error('boom');
        },
      },
    );
    expect(() => d.record(obs({ observed: 1.5, baseline: 1.0 }))).not.toThrow();
    expect(d.size()).toBe(1);
  });
});

describe('loadBuckets() rehydration', () => {
  it('replays persisted state into a new detector and resumes accumulation', () => {
    const d1 = createDriftDetector({ samplesMin: 5, gapMin: 0.1 });
    for (let i = 0; i < 3; i++) d1.record(obs({ observed: 1.3, baseline: 1.0 }));
    const snapshots = d1.dumpBuckets();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].totalSamples).toBe(3);

    const d2 = createDriftDetector({ samplesMin: 5, gapMin: 0.1 });
    d2.loadBuckets(snapshots);
    expect(d2.size()).toBe(1);

    // Two more observations should now cross the threshold — proving the
    // window resumed where d1 left off instead of restarting at zero.
    d2.record(obs({ observed: 1.4, baseline: 1.0 }));
    d2.record(obs({ observed: 1.4, baseline: 1.0 }));
    const signals = d2.drainSignals();
    expect(signals).toHaveLength(1);
    expect(signals[0].samples).toBe(5);
  });

  it('loadBuckets does NOT fire onBucketChanged (no write-loop on boot)', () => {
    const onBucketChanged = vi.fn();
    const d = createDriftDetector({}, { onBucketChanged });
    d.loadBuckets([
      {
        formulaId: 'f1',
        parameter: 'p1',
        oldValue: 0.5,
        candidateValue: 0.7,
        fromVersion: 'v1',
        thesisCitation: 'docs',
        irreversibility: 0,
        observedHistory: [1.2, 1.3],
        baselineHistory: [1.0, 1.0],
        gapHistory: [0.2, 0.3],
        totalSamples: 2,
      },
    ]);
    expect(onBucketChanged).not.toHaveBeenCalled();
    expect(d.size()).toBe(1);
  });

  it('trims persisted history exceeding the configured window size', () => {
    const d = createDriftDetector({ windowSize: 3 });
    d.loadBuckets([
      {
        formulaId: 'f1',
        parameter: 'p1',
        oldValue: 0.5,
        candidateValue: 0.7,
        fromVersion: 'v1',
        thesisCitation: 'docs',
        irreversibility: 0,
        observedHistory: [1, 2, 3, 4, 5],
        baselineHistory: [1, 1, 1, 1, 1],
        gapHistory: [0, 1, 2, 3, 4],
        totalSamples: 5,
      },
    ]);
    const dumped = d.dumpBuckets();
    expect(dumped[0].observedHistory).toEqual([3, 4, 5]);
    expect(dumped[0].totalSamples).toBe(5); // totalSamples is preserved
  });
});
