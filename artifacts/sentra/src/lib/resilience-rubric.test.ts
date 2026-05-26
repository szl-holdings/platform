import { describe, expect, it } from 'vitest';
import {
  RESILIENCE_RUBRIC,
  RESILIENCE_STAGES,
  gradeResilience,
  type StageScores,
} from './resilience-rubric';

const PERFECT: StageScores = {
  anticipate: 100, withstand: 100, recover: 100, adapt: 100, evolve: 100,
};
const ZEROES: StageScores = {
  anticipate: 0, withstand: 0, recover: 0, adapt: 0, evolve: 0,
};

describe('Sentra cyber-resilience rubric (Dotterrer)', () => {
  it('rubric covers the five Dotterrer stages in canonical order', () => {
    expect(RESILIENCE_RUBRIC.map((s) => s.stage)).toEqual([...RESILIENCE_STAGES]);
  });

  it('stage weights sum to 1', () => {
    const total = RESILIENCE_RUBRIC.reduce((s, r) => s + r.weight, 0);
    expect(total).toBeCloseTo(1, 12);
  });

  it('perfect inputs yield the optimising tier at 100', () => {
    const a = gradeResilience(PERFECT);
    expect(a.compositeScore).toBe(100);
    expect(a.tier).toBe('optimising');
    expect(a.recommendations).toHaveLength(0);
  });

  it('zero inputs yield the initial tier and recommendations for every stage', () => {
    const a = gradeResilience(ZEROES);
    expect(a.compositeScore).toBe(0);
    expect(a.tier).toBe('initial');
    expect(a.recommendations).toHaveLength(RESILIENCE_RUBRIC.length);
  });

  it('clips out-of-range inputs to [0, 100]', () => {
    const a = gradeResilience({
      anticipate: 500, withstand: -10, recover: NaN, adapt: 60, evolve: 60,
    });
    expect(a.stageScores.anticipate).toBe(100);
    expect(a.stageScores.withstand).toBe(0);
    expect(a.stageScores.recover).toBe(0);
    expect(a.compositeScore).toBeGreaterThanOrEqual(0);
    expect(a.compositeScore).toBeLessThanOrEqual(100);
  });

  it('identifies the weakest and strongest stage', () => {
    const a = gradeResilience({
      anticipate: 80, withstand: 40, recover: 70, adapt: 75, evolve: 90,
    });
    expect(a.weakestStage).toBe('withstand');
    expect(a.strongestStage).toBe('evolve');
  });

  // ── Mid-range fixtures ────────────────────────────────────────────────
  //
  // These pin the canonical Λ-operator's behaviour on representative
  // estates so a silent tweak to the formula (here or in `lambda-math`)
  // would shift one of these composites and fail loudly. Without them
  // only boundary behaviour (all-100, all-0, clipping) is asserted, and
  // a drift could move maturity-tier thresholds for real estates
  // without any test catching it.
  describe('mid-range composites are pinned (no silent Λ drift)', () => {
    it('Dotterrer-typical mixed estate scores in the "defined" tier', () => {
      // Anticipate/Withstand strongest, recovery/learning trailing —
      // the shape the CDR essay sketches for a maturing estate.
      const a = gradeResilience({
        anticipate: 70, withstand: 65, recover: 60, adapt: 50, evolve: 45,
      });
      expect(a.compositeScore).toBe(59.3);
      expect(a.tier).toBe('defined');
    });

    it('upper-mid estate sits just below the "managed" threshold', () => {
      const a = gradeResilience({
        anticipate: 80, withstand: 75, recover: 70, adapt: 60, evolve: 55,
      });
      expect(a.compositeScore).toBe(69.4);
      expect(a.tier).toBe('defined');
    });

    it('mature estate crosses into "managed"', () => {
      const a = gradeResilience({
        anticipate: 90, withstand: 85, recover: 75, adapt: 70, evolve: 65,
      });
      expect(a.compositeScore).toBe(78.5);
      expect(a.tier).toBe('managed');
    });

    it('weak estate sits in "developing"', () => {
      const a = gradeResilience({
        anticipate: 60, withstand: 55, recover: 50, adapt: 40, evolve: 40,
      });
      expect(a.compositeScore).toBe(50.1);
      expect(a.tier).toBe('developing');
    });
  });

  // ── Λ axiom A2: a single zero short-circuits the composite ───────────
  //
  // Geometric-mean behaviour — if any positively-weighted stage scores
  // zero, the composite is 0 regardless of how strong the others are.
  // This is the rubric's "weakest-link" guarantee and the property that
  // distinguishes Λ from a weighted arithmetic mean.
  describe('Λ axiom A2 — one zero zero-pins the composite', () => {
    it('a single zero-scored stage pins the composite at 0 even with strong neighbours', () => {
      const a = gradeResilience({
        anticipate: 90, withstand: 85, recover: 0, adapt: 70, evolve: 80,
      });
      expect(a.compositeScore).toBe(0);
      expect(a.tier).toBe('initial');
      // The zero stage is also the weakest, by definition.
      expect(a.weakestStage).toBe('recover');
    });

    it('zero in the lowest-weighted stage still zero-pins the composite', () => {
      const a = gradeResilience({
        anticipate: 80, withstand: 80, recover: 80, adapt: 0, evolve: 80,
      });
      expect(a.compositeScore).toBe(0);
      expect(a.tier).toBe('initial');
      expect(a.weakestStage).toBe('adapt');
    });
  });
});
