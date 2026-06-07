/**
 * Unit tests — Reward Composer
 */

import { composeReward, buildSimulatedRewardBreakdown } from '../reward/index.js';
import type { EvaluationRunSummary, EvaluationCaseResult } from '../types.js';
import { randomUUID } from 'node:crypto';

function makeRunSummary(overrides: Partial<EvaluationRunSummary> = {}): EvaluationRunSummary {
  return {
    runId: randomUUID(),
    candidateId: 'test-candidate',
    status: 'completed',
    passRate: 0.85,
    avgScoreTotal: 0.82,
    avgLatencyMs: 200,
    totalCases: 20,
    passed: 17,
    failed: 3,
    hasRegression: false,
    regressionSeverity: 'none',
    coverageThresholdMet: true,
    simulated: false,
    ...overrides,
  };
}

function makeCaseResults(count: number, passRate: number): EvaluationCaseResult[] {
  return Array.from({ length: count }, (_, i) => ({
    caseId: `case-${i}`,
    category: 'general',
    passed: i < Math.floor(count * passRate),
    scoreTotal: i < Math.floor(count * passRate) ? 0.85 : 0.40,
    latencyMs: 150 + Math.random() * 100,
  }));
}

describe('composeReward', () => {
  test('high-quality run returns a valid reward breakdown with all required fields', () => {
    const summary = makeRunSummary();
    const cases = makeCaseResults(20, 0.85);
    const result = composeReward(summary, cases);
    expect(typeof result.scoreTotal).toBe('number');
    expect(result.scoreTotal).toBeGreaterThanOrEqual(0);
    expect(result.scoreTotal).toBeLessThanOrEqual(1);
    expect(result.runId).toBe(summary.runId);
    expect(result.candidateId).toBe(summary.candidateId);
  });

  test('high pass rate scores higher than low pass rate', () => {
    const highRun = makeRunSummary({ passRate: 0.90, avgScoreTotal: 0.88, passed: 18, failed: 2 });
    const lowRun = makeRunSummary({ passRate: 0.45, avgScoreTotal: 0.40, passed: 9, failed: 11 });
    const highResult = composeReward(highRun, makeCaseResults(20, 0.90));
    const lowResult = composeReward(lowRun, makeCaseResults(20, 0.45));
    expect(highResult.scoreTotal).toBeGreaterThan(lowResult.scoreTotal);
  });

  test('major regression changes recommendation away from promote', () => {
    const withReg = makeRunSummary({ hasRegression: true, regressionSeverity: 'major' });
    const result = composeReward(withReg, makeCaseResults(20, 0.85));
    expect(result.recommendation).not.toBe('promote');
  });

  test('critical regression results in reject recommendation', () => {
    const withCritReg = makeRunSummary({ hasRegression: true, regressionSeverity: 'critical' });
    const result = composeReward(withCritReg, makeCaseResults(20, 0.85));
    expect(result.recommendation).toBe('reject');
  });

  test('components object is present and non-empty', () => {
    const result = composeReward(makeRunSummary(), makeCaseResults(20, 0.85));
    expect(result.components).toBeDefined();
    expect(Object.keys(result.components).length).toBeGreaterThan(0);
  });

  test('scoreTotal is clamped between 0 and 1', () => {
    const worstRun = makeRunSummary({
      passRate: 0,
      avgScoreTotal: 0,
      passed: 0,
      failed: 20,
      hasRegression: true,
      regressionSeverity: 'critical',
      coverageThresholdMet: false,
    });
    const result = composeReward(worstRun, makeCaseResults(20, 0));
    expect(result.scoreTotal).toBeGreaterThanOrEqual(0);
    expect(result.scoreTotal).toBeLessThanOrEqual(1);
  });

  test('promotionEligible is a boolean', () => {
    const result = composeReward(makeRunSummary(), makeCaseResults(20, 0.85));
    expect(typeof result.promotionEligible).toBe('boolean');
  });

  test('recommendation is one of the valid values', () => {
    const result = composeReward(makeRunSummary(), makeCaseResults(20, 0.85));
    expect(['promote', 'review', 'reject', 'hold']).toContain(result.recommendation);
  });

  test('poor coverage does not produce promote recommendation', () => {
    const run = makeRunSummary({ passRate: 0.40, coverageThresholdMet: false });
    const result = composeReward(run, makeCaseResults(20, 0.40));
    expect(result.recommendation).not.toBe('promote');
  });
});

describe('buildSimulatedRewardBreakdown', () => {
  test('produces a reward breakdown tagged simulated=true', () => {
    const result = buildSimulatedRewardBreakdown('test-candidate');
    expect(result.simulated).toBe(true);
    expect(result.candidateId).toBe('test-candidate');
    expect(result.scoreTotal).toBeGreaterThanOrEqual(0);
    expect(result.scoreTotal).toBeLessThanOrEqual(1);
  });

  test('produces different runIds on successive calls', () => {
    const a = buildSimulatedRewardBreakdown('cand-x');
    const b = buildSimulatedRewardBreakdown('cand-x');
    expect(a.runId).not.toBe(b.runId);
  });
});
