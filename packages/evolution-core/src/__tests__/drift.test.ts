/**
 * Unit tests — Drift Measurement
 */

import { measureDrift, buildSimulatedDriftReport } from '../drift/index.js';
import type { EvaluationRunSummary } from '../types.js';
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

describe('measureDrift', () => {
  test('identical baseline and candidate produce healthy status', () => {
    const baseline = makeRunSummary();
    const candidate = makeRunSummary({ runId: randomUUID() });
    const result = measureDrift(baseline, candidate);
    expect(result.status).toBe('healthy');
    expect(result.simulated).toBe(false);
  });

  test('significant reward drop increases drift score vs healthy baseline', () => {
    const baseline = makeRunSummary({ passRate: 0.90, avgScoreTotal: 0.88 });
    const healthyCandidate = makeRunSummary({ passRate: 0.89, avgScoreTotal: 0.87 });
    const degradedCandidate = makeRunSummary({ passRate: 0.50, avgScoreTotal: 0.45 });
    const healthyDrift = measureDrift(baseline, healthyCandidate);
    const degradedDrift = measureDrift(baseline, degradedCandidate);
    expect(degradedDrift.overallDriftScore).toBeGreaterThan(healthyDrift.overallDriftScore);
  });

  test('critical reward drop produces degraded or critical status', () => {
    const baseline = makeRunSummary({ passRate: 0.90, avgScoreTotal: 0.88 });
    const candidate = makeRunSummary({ passRate: 0.30, avgScoreTotal: 0.25 });
    const result = measureDrift(baseline, candidate);
    expect(['degraded', 'critical']).toContain(result.status);
  });

  test('high latency regression increases drift score vs low latency', () => {
    const baseline = makeRunSummary({ avgLatencyMs: 200 });
    const slightlySlower = makeRunSummary({ avgLatencyMs: 210 });
    const muchSlower = makeRunSummary({ avgLatencyMs: 1200 });
    const healthy = measureDrift(baseline, slightlySlower);
    const degraded = measureDrift(baseline, muchSlower);
    expect(degraded.overallDriftScore).toBeGreaterThan(healthy.overallDriftScore);
  });

  test('overallDriftScore is non-negative', () => {
    const baseline = makeRunSummary({ passRate: 1, avgScoreTotal: 1, avgLatencyMs: 50 });
    const worst = makeRunSummary({ passRate: 0, avgScoreTotal: 0, avgLatencyMs: 50000 });
    const result = measureDrift(baseline, worst);
    expect(result.overallDriftScore).toBeGreaterThanOrEqual(0);
  });

  test('result has required fields', () => {
    const result = measureDrift(makeRunSummary(), makeRunSummary({ runId: randomUUID() }));
    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('candidateId');
    expect(result).toHaveProperty('overallDriftScore');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('simulated');
  });

  test('status is one of the valid values', () => {
    const result = measureDrift(makeRunSummary(), makeRunSummary({ runId: randomUUID() }));
    expect(['healthy', 'degraded', 'critical']).toContain(result.status);
  });

  test('metrics object is present', () => {
    const result = measureDrift(makeRunSummary(), makeRunSummary({ runId: randomUUID() }));
    expect(result.metrics).toBeDefined();
  });
});

describe('buildSimulatedDriftReport', () => {
  test('produces a drift report tagged simulated=true', () => {
    const result = buildSimulatedDriftReport('test-candidate');
    expect(result.simulated).toBe(true);
    expect(result.candidateId).toBe('test-candidate');
    expect(result.overallDriftScore).toBeGreaterThanOrEqual(0);
    expect(['healthy', 'degraded', 'critical']).toContain(result.status);
  });
});
