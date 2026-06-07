/**
 * Agent Version Comparison
 *
 * Diffs two eval runs (baseline vs candidate) and produces:
 *   - delta in aggregate and per-dimension scores
 *   - regression analysis (new failures, recovered failures, unchanged failures)
 *   - promotion recommendation with rationale
 *
 * Per spec: docs/AGENT_EVAL_AND_REPLAY.md
 */

import {
  PROMOTION_AGGREGATE_THRESHOLD,
  PROMOTION_SAFETY_FLAG_REQUIREMENT,
} from './agent-eval-promotion.js';
import type {
  AgentEvalRunRecord,
  DimensionDelta,
  EvalDimensionScores,
  PromotionDecision,
  RegressionAnalysis,
  VersionComparisonRecord,
} from './agent-eval-types.js';

const comparisonHistory: VersionComparisonRecord[] = [];

function computeDimensionDelta(
  baseline: EvalDimensionScores,
  candidate: EvalDimensionScores,
): DimensionDelta {
  return {
    semantic_accuracy: candidate.semantic_accuracy - baseline.semantic_accuracy,
    recommendation_quality: candidate.recommendation_quality - baseline.recommendation_quality,
    evidence_completeness: candidate.evidence_completeness - baseline.evidence_completeness,
    confidence_calibration: candidate.confidence_calibration - baseline.confidence_calibration,
    format_compliance: candidate.format_compliance - baseline.format_compliance,
    safety_flag: candidate.safety_flag - baseline.safety_flag,
  };
}

function computeRegressionAnalysis(
  baselineRun: AgentEvalRunRecord,
  candidateRun: AgentEvalRunRecord,
): RegressionAnalysis {
  const baselinePassed = new Set(
    baselineRun.case_results.filter((r) => r.passed).map((r) => r.case_id),
  );
  const baselineFailed = new Set(
    baselineRun.case_results.filter((r) => !r.passed).map((r) => r.case_id),
  );
  const candidatePassed = new Set(
    candidateRun.case_results.filter((r) => r.passed).map((r) => r.case_id),
  );
  const candidateFailed = new Set(
    candidateRun.case_results.filter((r) => !r.passed).map((r) => r.case_id),
  );

  const new_failures = Array.from(baselinePassed).filter((id) => candidateFailed.has(id));
  const recovered_failures = Array.from(baselineFailed).filter((id) => candidatePassed.has(id));
  const unchanged_failures = Array.from(baselineFailed).filter((id) => candidateFailed.has(id));

  return { new_failures, recovered_failures, unchanged_failures };
}

function buildPromotionNotes(
  _baselineRun: AgentEvalRunRecord,
  candidateRun: AgentEvalRunRecord,
  regression: RegressionAnalysis,
  delta: number,
): { recommendation: PromotionDecision; notes: string } {
  const issues: string[] = [];
  const positives: string[] = [];

  if (candidateRun.dimension_scores.safety_flag < PROMOTION_SAFETY_FLAG_REQUIREMENT) {
    issues.push('Safety flag violations detected — promotion blocked regardless of score.');
  }

  if (candidateRun.aggregate_score < PROMOTION_AGGREGATE_THRESHOLD) {
    issues.push(
      `Aggregate score ${candidateRun.aggregate_score.toFixed(3)} below required threshold ${PROMOTION_AGGREGATE_THRESHOLD}.`,
    );
  }

  if (regression.new_failures.length > 0) {
    issues.push(
      `${regression.new_failures.length} new regression(s): [${regression.new_failures.join(', ')}].`,
    );
  }

  if (regression.recovered_failures.length > 0) {
    positives.push(
      `Candidate version recovers ${regression.recovered_failures.length} previously failing case(s): [${regression.recovered_failures.join(', ')}].`,
    );
  }

  if (delta > 0) {
    positives.push(`Aggregate score improved by +${delta.toFixed(3)}.`);
  } else if (delta < 0) {
    issues.push(`Aggregate score degraded by ${delta.toFixed(3)}.`);
  }

  if (regression.unchanged_failures.length > 0) {
    positives.push(
      `${regression.unchanged_failures.length} persistent failure(s) remain — flagged for next sprint: [${regression.unchanged_failures.join(', ')}].`,
    );
  }

  const blocked = issues.some(
    (i) => i.includes('Safety flag') || i.includes('below required') || i.includes('regression'),
  );

  const recommendation: PromotionDecision = blocked ? 'block' : 'approve';
  const notes =
    [...(positives.length > 0 ? positives : []), ...(issues.length > 0 ? issues : [])].join(' ') ||
    'No significant changes detected between versions.';

  return { recommendation, notes };
}

export function compareEvalRuns(
  baselineRun: AgentEvalRunRecord,
  candidateRun: AgentEvalRunRecord,
): VersionComparisonRecord {
  const comparison_id = `cmp_${baselineRun.agent_id}_${baselineRun.model_version}_vs_${candidateRun.model_version}_${Date.now()}`;

  const aggregate_delta = candidateRun.aggregate_score - baselineRun.aggregate_score;
  const dimension_deltas = computeDimensionDelta(
    baselineRun.dimension_scores,
    candidateRun.dimension_scores,
  );
  const regression_analysis = computeRegressionAnalysis(baselineRun, candidateRun);
  const { recommendation, notes } = buildPromotionNotes(
    baselineRun,
    candidateRun,
    regression_analysis,
    aggregate_delta,
  );

  const record: VersionComparisonRecord = {
    comparison_id,
    baseline_eval: baselineRun.eval_id,
    candidate_eval: candidateRun.eval_id,
    aggregate_delta,
    dimension_deltas,
    regression_analysis,
    promotion_recommendation: recommendation,
    promotion_notes: notes,
    created_at: new Date().toISOString(),
  };

  comparisonHistory.unshift(record);
  if (comparisonHistory.length > 500) comparisonHistory.length = 500;

  return record;
}

export function getVersionComparison(comparison_id: string): VersionComparisonRecord | undefined {
  return comparisonHistory.find((c) => c.comparison_id === comparison_id);
}

export function listVersionComparisons(
  options: { agent_id?: string; limit?: number } = {},
): VersionComparisonRecord[] {
  let records = comparisonHistory;
  if (options.agent_id) {
    records = records.filter((r) => r.comparison_id.includes(options.agent_id!));
  }
  return records.slice(0, options.limit ?? 50);
}

export function formatVersionComparisonReport(c: VersionComparisonRecord): string {
  const sign = (n: number) => (n >= 0 ? `+${n.toFixed(3)}` : n.toFixed(3));
  const lines = [
    `Version Comparison: ${c.comparison_id}`,
    `  Baseline Eval:   ${c.baseline_eval}`,
    `  Candidate Eval:  ${c.candidate_eval}`,
    `  Aggregate Delta: ${sign(c.aggregate_delta)}`,
    `  Dimension Deltas:`,
    `    semantic_accuracy:      ${sign(c.dimension_deltas.semantic_accuracy)}`,
    `    recommendation_quality: ${sign(c.dimension_deltas.recommendation_quality)}`,
    `    evidence_completeness:  ${sign(c.dimension_deltas.evidence_completeness)}`,
    `    confidence_calibration: ${sign(c.dimension_deltas.confidence_calibration)}`,
    `    format_compliance:      ${sign(c.dimension_deltas.format_compliance)}`,
    `    safety_flag:            ${sign(c.dimension_deltas.safety_flag)}`,
    `  Regression Analysis:`,
    `    New Failures:       [${c.regression_analysis.new_failures.join(', ') || 'none'}]`,
    `    Recovered Failures: [${c.regression_analysis.recovered_failures.join(', ') || 'none'}]`,
    `    Unchanged Failures: [${c.regression_analysis.unchanged_failures.join(', ') || 'none'}]`,
    `  Promotion: ${c.promotion_recommendation.toUpperCase()}`,
    `  Notes: ${c.promotion_notes}`,
  ];
  return lines.join('\n');
}
