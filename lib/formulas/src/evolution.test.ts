import { describe, expect, it } from 'vitest';
import {
  evaluateObservedEvent,
  hoeffdingLowerBound,
  rosieProposalScore,
  type ObservedEvent,
} from './evolution.js';

/**
 * Reference Hoeffding LCB radii for δ=0.05 (95% one-sided):
 *   n=10   ε = √(ln(20) / 20)  ≈ 0.3870
 *   n=25   ε = √(ln(20) / 50)  ≈ 0.2448
 *   n=200  ε = √(ln(20) / 400) ≈ 0.0865
 * Citations: Hoeffding (1963) JASA 58:13–30; Auer, Cesa-Bianchi & Fischer
 * (2002) Machine Learning 47:235–256, §2.1.
 */

describe('hoeffdingLowerBound', () => {
  it('returns mean - sqrt(ln(1/δ) / 2n) clamped to [0,1]', () => {
    const lcb = hoeffdingLowerBound(0.5, 200, 0.05);
    const expected = 0.5 - Math.sqrt(Math.log(20) / 400);
    expect(lcb).toBeCloseTo(expected, 10);
  });

  it('clamps the lower bound to 0 when the radius exceeds the mean', () => {
    // n=10, mean=0.15 → radius ≈ 0.387 ⇒ raw LCB ≈ -0.237, clamped to 0
    expect(hoeffdingLowerBound(0.15, 10, 0.05)).toBe(0);
  });

  it('clamps to [0,1] for absurd inputs', () => {
    expect(hoeffdingLowerBound(2, 100, 0.05)).toBe(1);
    expect(hoeffdingLowerBound(-1, 100, 0.05)).toBe(0);
  });

  it('returns 0 when n ≤ 0', () => {
    expect(hoeffdingLowerBound(0.5, 0)).toBe(0);
    expect(hoeffdingLowerBound(0.5, -3)).toBe(0);
  });

  it('tightens as n grows (same mean, more evidence ⇒ higher LCB)', () => {
    const lcbThin = hoeffdingLowerBound(0.4, 30, 0.05);
    const lcbThick = hoeffdingLowerBound(0.4, 3000, 0.05);
    expect(lcbThick).toBeGreaterThan(lcbThin);
  });

  it('uses a tighter LCB at higher δ (less stringent confidence)', () => {
    const lcb95 = hoeffdingLowerBound(0.4, 100, 0.05);
    const lcb80 = hoeffdingLowerBound(0.4, 100, 0.20);
    expect(lcb80).toBeGreaterThan(lcb95);
  });
});

function ev(over: Partial<ObservedEvent>): ObservedEvent {
  return {
    formulaId: 'f1',
    fromVersion: 'v1',
    parameter: 'p1',
    oldValue: 0.5,
    candidateValue: 0.7,
    observedGap: 0.15,
    samples: 30,
    thesisCitation: 'docs/thesis/v10-canonical.md',
    ...over,
  };
}

describe('evaluateObservedEvent — Hoeffding LCB gate', () => {
  it('reports gapLcb=0 in evidence when no gapHistory is supplied', () => {
    const d = evaluateObservedEvent(ev({}));
    expect(d.kind).toBe('tuning');
    if (d.kind !== 'tuning') return;
    expect(d.proposal.evidence.gapLcb).toBe(0);
  });

  it('lets a thin-evidence proposal through when gapLcbMin = 0 (default)', () => {
    // 30 samples at 15% gap — point estimate beats gapMin=0.10 but LCB
    // is well below it (≈ -0.07). Default gate is informational only.
    const gapHistory = Array.from({ length: 30 }, () => 0.15);
    const d = evaluateObservedEvent(ev({ samples: 30, observedGap: 0.15, gapHistory }));
    expect(d.kind).toBe('tuning');
    if (d.kind !== 'tuning') return;
    expect(d.proposal.evidence.gapLcb).toBe(0); // clamped from negative raw
    expect(d.proposal.rationale).toMatch(/Hoeffding LCB/);
  });

  it('REJECTS thin-evidence proposals once gapLcbMin = gapMin (production gate)', () => {
    const gapHistory = Array.from({ length: 30 }, () => 0.15);
    const d = evaluateObservedEvent(
      ev({ samples: 30, observedGap: 0.15, gapHistory }),
      { gapLcbMin: 0.1 },
    );
    expect(d.kind).toBe('noop');
    if (d.kind !== 'noop') return;
    expect(d.reason).toMatch(/gap LCB/);
    expect(d.reason).toMatch(/n=30/);
  });

  it('PASSES thick-evidence proposals at the same point estimate', () => {
    // 1000 samples at 15% gap — Hoeffding radius ≈ 0.0387, so LCB ≈ 0.111
    // which clears gapLcbMin = 0.10.
    const gapHistory = Array.from({ length: 1000 }, () => 0.15);
    const d = evaluateObservedEvent(
      ev({ samples: 1000, observedGap: 0.15, gapHistory }),
      { gapLcbMin: 0.1 },
    );
    expect(d.kind).toBe('tuning');
    if (d.kind !== 'tuning') return;
    expect(d.proposal.evidence.gapLcb).toBeGreaterThan(0.1);
    expect(d.proposal.evidence.samples).toBe(1000);
  });

  it('still rejects on gapMin before reaching the LCB gate', () => {
    const gapHistory = Array.from({ length: 1000 }, () => 0.02);
    const d = evaluateObservedEvent(
      ev({ samples: 1000, observedGap: 0.02, gapHistory }),
      { gapLcbMin: 0.1 },
    );
    expect(d.kind).toBe('noop');
    if (d.kind !== 'noop') return;
    expect(d.reason).toMatch(/^gap 0\.020 below/);
  });

  it('still rejects on samplesMin before reaching the LCB gate', () => {
    const gapHistory = Array.from({ length: 5 }, () => 0.5);
    const d = evaluateObservedEvent(
      ev({ samples: 5, observedGap: 0.5, gapHistory }),
      { gapLcbMin: 0.1 },
    );
    expect(d.kind).toBe('noop');
    if (d.kind !== 'noop') return;
    expect(d.reason).toMatch(/^samples 5 below/);
  });
});

describe('rosieProposalScore', () => {
  it('rewards gap and samples, penalises irreversibility', () => {
    const lowEvidence = rosieProposalScore({
      gap: 0.2,
      samples: 30,
      drift: 0.1,
      irreversibility: 0.8,
    });
    const highEvidence = rosieProposalScore({
      gap: 0.2,
      samples: 3000,
      drift: 0.1,
      irreversibility: 0.1,
    });
    expect(highEvidence).toBeGreaterThan(lowEvidence);
  });
});
