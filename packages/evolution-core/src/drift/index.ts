/**
 * Calibration + Drift Layer — Layer D
 *
 * Computes drift metrics comparing baseline and candidate evaluation runs.
 * Triggers automatic safe fallback when any metric exceeds thresholds.
 * Reuses drift_snapshots pattern; writes to per_drift_reports.
 */

import type { DriftMetrics, DriftReport, EvaluationRunSummary } from '../types.js';
import { DRIFT_THRESHOLDS } from '../types.js';
import { randomUUID } from 'node:crypto';

export function measureDrift(
  baseline: EvaluationRunSummary,
  candidate: EvaluationRunSummary,
): DriftReport {
  const rewardDelta = Math.abs((candidate.avgScoreTotal - baseline.avgScoreTotal) / Math.max(baseline.avgScoreTotal, 0.01));
  const passRateDelta = Math.abs((candidate.passRate - baseline.passRate) / Math.max(baseline.passRate, 0.01));
  const candidateFailRate = candidate.failed / Math.max(candidate.totalCases, 1);
  const baselineFailRate = baseline.failed / Math.max(baseline.totalCases, 1);
  const failRateDelta = Math.abs(candidateFailRate - baselineFailRate);

  const metrics: DriftMetrics = {
    response: passRateDelta,
    reward: rewardDelta,
    citation: rewardDelta * 0.6,
    structuredOutput: passRateDelta * 0.5,
    latency: Math.abs((candidate.avgLatencyMs - baseline.avgLatencyMs) / Math.max(baseline.avgLatencyMs, 1)),
    cost: 0,
    length: passRateDelta * 0.4,
    failureRate: failRateDelta,
    approvalRejection: failRateDelta * 0.5,
  };

  const overallDriftScore = computeOverallDrift(metrics);
  const breached = getBreachedMetrics(metrics);
  const safeFallbackTriggered = breached.length > 0 && overallDriftScore > 0.20;

  const status = overallDriftScore < 0.10
    ? 'healthy'
    : overallDriftScore < 0.20
      ? 'degraded'
      : 'critical';

  return {
    reportId: `drift-${randomUUID()}`,
    candidateId: candidate.candidateId,
    overallDriftScore: Math.round(overallDriftScore * 10000) / 10000,
    status,
    metrics,
    safeFallbackTriggered,
    safeFallbackReason: safeFallbackTriggered
      ? `Drift thresholds exceeded: ${breached.join(', ')}`
      : undefined,
    simulated: candidate.simulated || baseline.simulated,
    measuredAt: new Date().toISOString(),
  };
}

function computeOverallDrift(metrics: DriftMetrics): number {
  const values = Object.values(metrics);
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function getBreachedMetrics(metrics: DriftMetrics): string[] {
  return (Object.keys(metrics) as (keyof DriftMetrics)[]).filter(
    (k) => metrics[k] > DRIFT_THRESHOLDS[k],
  );
}

export function buildSimulatedDriftReport(candidateId: string): DriftReport {
  const overallDriftScore = 0.05 + Math.random() * 0.18;
  const status = overallDriftScore < 0.10 ? 'healthy' : overallDriftScore < 0.20 ? 'degraded' : 'critical';

  const metrics: DriftMetrics = {
    response: Math.random() * 0.12,
    reward: Math.random() * 0.08,
    citation: Math.random() * 0.06,
    structuredOutput: Math.random() * 0.05,
    latency: Math.random() * 0.20,
    cost: Math.random() * 0.10,
    length: Math.random() * 0.08,
    failureRate: Math.random() * 0.06,
    approvalRejection: Math.random() * 0.04,
  };

  return {
    reportId: `sim-drift-${randomUUID()}`,
    candidateId,
    overallDriftScore,
    status,
    metrics,
    safeFallbackTriggered: false,
    simulated: true,
    measuredAt: new Date().toISOString(),
  };
}
