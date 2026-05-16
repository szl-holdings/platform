import { describe, expect, it } from 'vitest';
import { createDriftDetector, type DriftObservation } from '@szl-holdings/formulas';

function obs(overrides: Partial<DriftObservation> = {}): DriftObservation {
  return {
    formulaId: 'risk-score',
    parameter: 'wSeverity',
    observed: 1.2,
    baseline: 1.0,
    oldValue: 0.5,
    candidateValue: 0.6,
    fromVersion: '1.0.0',
    thesisCitation: 'v10-canonical.md §3.2',
    ...overrides,
  };
}

describe('drift-detector', () => {
  it('does not emit a signal until samplesMin is reached', () => {
    const d = createDriftDetector({ gapMin: 0.1, samplesMin: 25 });
    for (let i = 0; i < 24; i++) d.record(obs());
    expect(d.pendingSignals()).toHaveLength(0);
    d.record(obs());
    const sig = d.pendingSignals();
    expect(sig).toHaveLength(1);
    expect(sig[0].samples).toBe(25);
    // 0.2 / 1.0 = 0.20 mean gap
    expect(sig[0].observedGap).toBeCloseTo(0.2, 5);
  });

  it('does not emit when mean gap is below the threshold', () => {
    const d = createDriftDetector({ gapMin: 0.1, samplesMin: 25 });
    for (let i = 0; i < 30; i++) d.record(obs({ observed: 1.05, baseline: 1.0 }));
    expect(d.pendingSignals()).toHaveLength(0);
  });

  it('drainSignals removes drifting buckets so they do not re-fire next tick', () => {
    const d = createDriftDetector({ gapMin: 0.1, samplesMin: 25 });
    for (let i = 0; i < 30; i++) d.record(obs());
    expect(d.drainSignals()).toHaveLength(1);
    expect(d.drainSignals()).toHaveLength(0);
    expect(d.size()).toBe(0);
  });

  it('tracks distinct (formulaId, parameter) buckets independently', () => {
    const d = createDriftDetector({ gapMin: 0.1, samplesMin: 25 });
    for (let i = 0; i < 30; i++) {
      d.record(obs({ formulaId: 'a', parameter: 'p1' }));
      d.record(obs({ formulaId: 'a', parameter: 'p2', observed: 1.01 }));
    }
    const signals = d.pendingSignals();
    expect(signals).toHaveLength(1);
    expect(signals[0].formulaId).toBe('a');
    expect(signals[0].parameter).toBe('p1');
  });

  it('clamps the relative gap at 1 when the baseline is near zero', () => {
    const d = createDriftDetector({ gapMin: 0.1, samplesMin: 5 });
    for (let i = 0; i < 5; i++) d.record(obs({ observed: 100, baseline: 0 }));
    const sig = d.pendingSignals();
    expect(sig).toHaveLength(1);
    expect(sig[0].observedGap).toBeLessThanOrEqual(1);
  });
});
