import type {
  QualityGateFailingGate,
  QualityGateResult,
  RunLedgerEntry,
} from '@szl-holdings/contracts/governance';

// ─── Profile thresholds ───────────────────────────────────────────────────────

export interface QualityGateProfile {
  /** Minimum fraction of plan steps that must complete successfully (0-1). */
  completionThreshold: number;
  /** Minimum average retrieval score across all sources consulted (0-1). */
  evidenceCoverageThreshold: number;
  /** Maximum fraction of tool calls allowed to fail (0-1). */
  toolFailureRateThreshold: number;
  /** Maximum total run duration in ms. 0 = no limit. */
  latencyBudgetMs: number;
  /** Policy outcomes that cause a gate block. */
  blockedPolicyResults: Array<'block'>;
}

export const DEFAULT_QUALITY_GATE_PROFILE: QualityGateProfile = {
  completionThreshold: 0.5,
  evidenceCoverageThreshold: 0.3,
  toolFailureRateThreshold: 0.5,
  latencyBudgetMs: 0,
  blockedPolicyResults: ['block'],
};

// ─── Evaluator ────────────────────────────────────────────────────────────────

/**
 * Inspects a RunLedgerEntry against a QualityGateProfile and returns a
 * structured gate result. The run is only marked `complete` if all gates pass;
 * partial failures produce `degraded`; a hard-block gate produces `blocked`.
 */
export function evaluateQualityGate(
  ledger: RunLedgerEntry,
  profile: Partial<QualityGateProfile> = {},
): QualityGateResult {
  const p: QualityGateProfile = { ...DEFAULT_QUALITY_GATE_PROFILE, ...profile };
  const failingGates: QualityGateFailingGate[] = [];
  let hasBlocker = false;

  // ── Gate 1: completion criteria ───────────────────────────────────────────
  const totalTools = ledger.toolCalls.length;
  const successTools = ledger.toolCalls.filter((t) => t.outcome === 'success').length;
  const completionRate = totalTools > 0 ? successTools / totalTools : 1;

  if (completionRate < p.completionThreshold) {
    failingGates.push({
      gate: 'completion',
      reason: `Only ${(completionRate * 100).toFixed(0)}% of steps completed (threshold: ${(p.completionThreshold * 100).toFixed(0)}%)`,
      actual: completionRate,
      threshold: p.completionThreshold,
    });
  }

  // ── Gate 2: evidence coverage ─────────────────────────────────────────────
  const sources = ledger.sourcesConsulted;
  const avgScore =
    sources.length > 0 ? sources.reduce((s, c) => s + c.retrievalScore, 0) / sources.length : 1;

  if (sources.length > 0 && avgScore < p.evidenceCoverageThreshold) {
    failingGates.push({
      gate: 'evidence_coverage',
      reason: `Average retrieval score ${avgScore.toFixed(2)} is below threshold ${p.evidenceCoverageThreshold.toFixed(2)}`,
      actual: avgScore,
      threshold: p.evidenceCoverageThreshold,
    });
  }

  // ── Gate 3: policy status ─────────────────────────────────────────────────
  for (const outcome of ledger.policyOutcomes) {
    if (p.blockedPolicyResults.includes(outcome.result as 'block')) {
      hasBlocker = true;
      failingGates.push({
        gate: 'policy_block',
        reason: `Policy '${outcome.policyId}' result is '${outcome.result}': ${outcome.reason ?? 'blocked'}`,
      });
    }
  }

  // ── Gate 4: tool failure rate ─────────────────────────────────────────────
  const failedTools = ledger.toolCalls.filter((t) => t.outcome === 'failure').length;
  const failureRate = totalTools > 0 ? failedTools / totalTools : 0;

  if (failureRate > p.toolFailureRateThreshold) {
    failingGates.push({
      gate: 'tool_failure_rate',
      reason: `Tool failure rate ${(failureRate * 100).toFixed(0)}% exceeds threshold ${(p.toolFailureRateThreshold * 100).toFixed(0)}%`,
      actual: failureRate,
      threshold: p.toolFailureRateThreshold,
    });
  }

  // ── Gate 5: latency budget ────────────────────────────────────────────────
  if (p.latencyBudgetMs > 0 && (ledger.totalDurationMs ?? 0) > p.latencyBudgetMs) {
    failingGates.push({
      gate: 'latency_budget',
      reason: `Run took ${ledger.totalDurationMs}ms, exceeding budget of ${p.latencyBudgetMs}ms`,
      actual: ledger.totalDurationMs ?? 0,
      threshold: p.latencyBudgetMs,
    });
  }

  // ── Determine status ──────────────────────────────────────────────────────
  let status: QualityGateResult['status'];
  let recommendedNextAction: string;

  if (hasBlocker) {
    status = 'blocked';
    recommendedNextAction =
      'A policy block is present. Review the flagged policy outcomes and request an approved override before re-running.';
  } else if (failingGates.length > 0) {
    status = 'degraded';
    const gateNames = failingGates.map((g) => g.gate).join(', ');
    recommendedNextAction = `Address failing gates: ${gateNames}. Consider improving evidence retrieval, reducing tool retries, or relaxing profile thresholds.`;
  } else {
    status = 'complete';
    recommendedNextAction = 'All quality gates passed. The run artifact is ready for consumption.';
  }

  return {
    status,
    failingGates,
    recommendedNextAction,
    evaluatedAt: Date.now(),
  };
}
