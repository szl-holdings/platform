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
});
