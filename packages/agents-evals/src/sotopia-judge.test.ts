import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordDecision,
  getOperatorResonance,
  resetCalibration,
  canonicalDomain,
  CALIBRATION_BAND,
} from './operator-calibration.js';
import { judgeScenario, SOTOPIA_SCENARIOS } from './sotopia-judge.js';

describe('operator calibration', () => {
  beforeEach(() => resetCalibration());

  it('starts at 1.0 and stays inside the band on a single update', () => {
    expect(getOperatorResonance('op', 'Maritime')).toBe(CALIBRATION_BAND.starting);
    const e = recordDecision({ operatorId: 'op', domain: 'Maritime', verdict: 'approve' });
    expect(e.weight).toBeGreaterThan(1.0);
    expect(e.weight).toBeLessThanOrEqual(CALIBRATION_BAND.ceiling);
  });

  it('approve nudges up, deny nudges down — and both bound', () => {
    for (let i = 0; i < 200; i++) recordDecision({ operatorId: 'op', domain: 'Maritime', verdict: 'approve' });
    expect(getOperatorResonance('op', 'Maritime')).toBeLessThanOrEqual(CALIBRATION_BAND.ceiling);
    expect(getOperatorResonance('op', 'Maritime')).toBeGreaterThan(1.1);

    for (let i = 0; i < 200; i++) recordDecision({ operatorId: 'op2', domain: 'Compliance', verdict: 'deny' });
    expect(getOperatorResonance('op2', 'Compliance')).toBeGreaterThanOrEqual(CALIBRATION_BAND.floor);
    expect(getOperatorResonance('op2', 'Compliance')).toBeLessThan(0.95);
  });

  it('isolates (operator, domain) tuples', () => {
    recordDecision({ operatorId: 'a', domain: 'X', verdict: 'approve' });
    recordDecision({ operatorId: 'b', domain: 'X', verdict: 'deny' });
    expect(getOperatorResonance('a', 'X')).toBeGreaterThan(getOperatorResonance('b', 'X'));
    expect(getOperatorResonance('a', 'Y')).toBe(1.0);
  });

  it('canonicalDomain folds approval-side and UI-side keys onto the same bucket', () => {
    // Same problem the reviewer flagged: approvals-inbox passes a kind like
    // "maritime.standby" while UniRec asks for resonance on "Maritime".
    expect(canonicalDomain('Maritime')).toBe('maritime');
    expect(canonicalDomain('maritime.standby')).toBe('maritime');
    expect(canonicalDomain('Legal.demurrage')).toBe('legal');

    // End-to-end keyspace alignment: a deny on "maritime.standby" must lower
    // the weight that UniRec sees when asking about "Maritime".
    for (let i = 0; i < 200; i++) {
      recordDecision({ operatorId: 'opE', domain: 'maritime.standby', verdict: 'deny' });
    }
    const uniRecSeen = getOperatorResonance('opE', 'Maritime');
    expect(uniRecSeen).toBeLessThan(0.95);
    expect(uniRecSeen).toBeGreaterThanOrEqual(CALIBRATION_BAND.floor);
  });
});

describe('sotopia judge', () => {
  beforeEach(() => resetCalibration());

  it('rewards alignment and penalises mismatches', () => {
    const r = judgeScenario(SOTOPIA_SCENARIOS[0]!);
    expect(r.matches).toBe(2);
    expect(r.mismatches).toBe(1);
    expect(r.reward).toBeCloseTo(1 / 3, 4);
  });

  it('penalises escalation-heavy runs', () => {
    const r = judgeScenario(SOTOPIA_SCENARIOS[1]!);
    expect(r.escalations).toBe(1);
    expect(r.reward).toBeLessThan(0.7);
  });

  it('returns neutral reward on discretionary scenarios', () => {
    const r = judgeScenario(SOTOPIA_SCENARIOS[2]!);
    expect(r.reward).toBe(0);
  });

  it('applyCalibration=true mutates the calibration store', () => {
    judgeScenario(SOTOPIA_SCENARIOS[0]!, { applyCalibration: true });
    expect(getOperatorResonance('op-1', 'Maritime')).not.toBe(1.0);
  });
});
