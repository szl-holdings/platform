import { describe, expect, it } from 'vitest';
import { builtInScenarios, runMarbleProfile } from '../marble-bench.js';

describe('MARBLE bench', () => {
  it('runs the aligned drone-handoff scenario and produces a score', () => {
    const sc = builtInScenarios().find((s) => s.scenarioId === 'drone-handoff-aligned')!;
    const res = runMarbleProfile(sc, { seed: 7 });
    expect(res.scenarioId).toBe('drone-handoff-aligned');
    expect(res.teamGoalReached).toBe(true);
    expect(res.adversarialGoalsAchieved).toBe(0);
    expect(res.score).toBeGreaterThan(0);
    expect(res.score).toBeLessThanOrEqual(1);
  });

  it('flags adversarial-scenario policy violations', () => {
    const sc = builtInScenarios().find((s) => s.scenarioId === 'drone-handoff-adversarial')!;
    const res = runMarbleProfile(sc, { seed: 7 });
    expect(res.policyDenialsObserved).toContain('unauthorized-override');
    expect(res.expectedDenialsMissed).toEqual([]);
    expect(res.adversarialGoalsAchieved).toBeGreaterThanOrEqual(1);
    // conflict between rogue-controller and planner on `route:plan`
    expect(res.conflictingWrites.some((c) => c.key === 'route:plan')).toBe(true);
  });

  it('is deterministic across runs with the same seed', () => {
    const sc = builtInScenarios()[0];
    const a = runMarbleProfile(sc, { seed: 42 });
    const b = runMarbleProfile(sc, { seed: 42 });
    expect(a.score).toBe(b.score);
    expect(a.coordinationCost).toBe(b.coordinationCost);
  });
});
