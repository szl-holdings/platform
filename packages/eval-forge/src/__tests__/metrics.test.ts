import { describe, expect, it } from 'vitest';
import {
  computeAllMetrics,
  computeConfidenceCalibration,
  computeCorrectnessMetrics,
  computeCostMetrics,
  computeEvidenceQualityMetrics,
  computeHumanOverrideMetrics,
  computeInterventionValueMetrics,
  computeLatencyMetrics,
  computePolicyViolationMetrics,
  computeRollbackMetrics,
} from '../metrics.js';
import type { EvalCaseResult } from '../types.js';

function makeResult(overrides: Partial<EvalCaseResult> = {}): EvalCaseResult {
  return {
    caseId: 'test-001',
    domain: 'test',
    label: 'Test case',
    evalType: 'prompt-eval',
    graderType: 'exact-match',
    input: {},
    output: {},
    groundTruth: {},
    passed: true,
    score: 0.9,
    expectedOutcome: 'pass',
    latencyMs: 100,
    tokensUsed: 500,
    costUsd: 0.001,
    ...overrides,
  };
}

describe('computeCorrectnessMetrics', () => {
  it('computes pass rate and average score', () => {
    const results = [
      makeResult({ passed: true, score: 1.0 }),
      makeResult({ passed: false, score: 0.4 }),
      makeResult({ passed: true, score: 0.8 }),
    ];
    const m = computeCorrectnessMetrics(results);
    expect(m.passRate).toBeCloseTo(2 / 3);
    expect(m.avgScore).toBeCloseTo((1.0 + 0.4 + 0.8) / 3);
    expect(m.passed).toBe(2);
    expect(m.failed).toBe(1);
    expect(m.total).toBe(3);
  });

  it('handles empty results', () => {
    const m = computeCorrectnessMetrics([]);
    expect(m.passRate).toBe(0);
    expect(m.avgScore).toBe(0);
    expect(m.total).toBe(0);
  });
});

describe('computeEvidenceQualityMetrics', () => {
  it('computes citation coverage score', () => {
    const results = [
      makeResult({
        output: { citations: ['a', 'b', 'c'], citationAccuracy: 0.9, sourceVerified: true },
        groundTruth: { minCitations: 2 },
      }),
    ];
    const m = computeEvidenceQualityMetrics(results);
    expect(m.totalCitations).toBe(3);
    expect(m.citationCoverage).toBeGreaterThan(0.9);
    expect(m.score).toBeGreaterThan(0.5);
  });

  it('handles zero citations', () => {
    const m = computeEvidenceQualityMetrics([makeResult({ output: {}, groundTruth: {} })]);
    expect(m.totalCitations).toBe(0);
    expect(m.score).toBeGreaterThanOrEqual(0);
  });
});

describe('computeConfidenceCalibration', () => {
  it('computes brier score and calibration error', () => {
    const results = [
      makeResult({ passed: true, output: { confidence: 0.9 } }),
      makeResult({ passed: false, output: { confidence: 0.1 } }),
    ];
    const m = computeConfidenceCalibration(results);
    expect(m.brierScore).toBeCloseTo(((0.9 - 1) ** 2 + (0.1 - 0) ** 2) / 2);
    expect(m.score).toBeGreaterThan(0.5);
  });

  it('handles empty results', () => {
    const m = computeConfidenceCalibration([]);
    expect(m.brierScore).toBe(0);
    expect(m.score).toBe(1);
  });
});

describe('computeLatencyMetrics', () => {
  it('computes percentiles correctly', () => {
    const results = [100, 200, 300, 400, 500].map((ms) => makeResult({ latencyMs: ms }));
    const m = computeLatencyMetrics(results);
    expect(m.avgLatencyMs).toBe(300);
    expect(m.p50LatencyMs).toBe(300);
    expect(m.maxLatencyMs).toBe(500);
  });

  it('handles empty results', () => {
    const m = computeLatencyMetrics([]);
    expect(m.avgLatencyMs).toBe(0);
    expect(m.p95LatencyMs).toBe(0);
  });
});

describe('computeCostMetrics', () => {
  it('computes total and per-outcome costs', () => {
    const results = [
      makeResult({ costUsd: 0.001, tokensUsed: 100, passed: true }),
      makeResult({ costUsd: 0.002, tokensUsed: 200, passed: true }),
    ];
    const m = computeCostMetrics(results, 2);
    expect(m.totalCostUsd).toBeCloseTo(0.003);
    expect(m.avgCostUsd).toBeCloseTo(0.0015);
    expect(m.costPerOutcome).toBeCloseTo(0.0015);
    expect(m.totalTokensUsed).toBe(300);
  });
});

describe('computeInterventionValueMetrics', () => {
  it('counts interventions from tags', () => {
    const results = [
      makeResult({ tags: ['intervened'], passed: true }),
      makeResult({ passed: false }),
    ];
    const m = computeInterventionValueMetrics(results);
    expect(m.interventions).toBe(1);
    expect(m.interventionRate).toBeCloseTo(0.5);
  });
});

describe('computeHumanOverrideMetrics', () => {
  it('counts overrides based on score threshold', () => {
    const results = [
      makeResult({ passed: false, score: 0.3 }),
      makeResult({ passed: true, score: 0.9 }),
    ];
    const m = computeHumanOverrideMetrics(results);
    expect(m.overrides).toBe(1);
    expect(m.overrideRate).toBeCloseTo(0.5);
  });
});

describe('computeRollbackMetrics', () => {
  it('counts rollbacks from tags', () => {
    const results = [
      makeResult({ tags: ['rollback'], latencyMs: 200 }),
      makeResult({ passed: true }),
    ];
    const m = computeRollbackMetrics(results);
    expect(m.rollbacks).toBe(1);
    expect(m.rollbackRate).toBeCloseTo(0.5);
  });
});

describe('computePolicyViolationMetrics', () => {
  it('detects violations from output fields', () => {
    const results = [
      makeResult({
        passed: false,
        score: 0.1,
        output: { policyViolation: 'unsafe_action' },
        tags: ['policy:no-delete'],
      }),
      makeResult({ passed: true, score: 0.9, output: {} }),
    ];
    const m = computePolicyViolationMetrics(results);
    expect(m.violations).toBeGreaterThan(0);
    expect(m.complianceRate).toBeLessThan(1);
  });
});

describe('computeAllMetrics', () => {
  it('returns all 9 metric categories', () => {
    const results = [makeResult(), makeResult({ passed: false, score: 0.4 })];
    const m = computeAllMetrics(results);
    expect(m).toHaveProperty('correctness');
    expect(m).toHaveProperty('evidenceQuality');
    expect(m).toHaveProperty('confidenceCalibration');
    expect(m).toHaveProperty('latency');
    expect(m).toHaveProperty('cost');
    expect(m).toHaveProperty('interventionValue');
    expect(m).toHaveProperty('humanOverrideRate');
    expect(m).toHaveProperty('rollbackRate');
    expect(m).toHaveProperty('policyViolations');
  });
});
