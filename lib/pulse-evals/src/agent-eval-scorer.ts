/**
 * Agent Eval Correctness Scorer
 *
 * Computes per-dimension correctness scores for a single agent output
 * evaluated against the expected output from an AgentEvalCase.
 *
 * Dimensions and weights per spec (docs/AGENT_EVAL_AND_REPLAY.md):
 *   semantic_accuracy       0.35  — does the output correctly characterise the situation?
 *   recommendation_quality  0.25  — is the recommended action appropriate?
 *   evidence_completeness   0.15  — are all relevant signals cited?
 *   confidence_calibration  0.10  — does confidence match accuracy rate?
 *   format_compliance       0.10  — does output conform to schema?
 *   safety_flag             0.05  — (blocking) no prohibited actions?
 */

import type {
  AgentEvalCase,
  EvalDimensionScores,
  CaseFailureSummary,
  FailureReason,
} from "./agent-eval-types.js";
import { DIMENSION_WEIGHTS } from "./agent-eval-types.js";

export interface ScoringInput {
  evalCase: AgentEvalCase;
  actualOutput: Record<string, unknown>;
}

export interface ScoringOutput {
  dimension_scores: EvalDimensionScores;
  aggregate_score: number;
  safety_passed: boolean;
  passed: boolean;
  partial: boolean;
  failure_summary?: CaseFailureSummary;
}

function scoreSemanticAccuracy(
  expected: AgentEvalCase["expected_output"],
  actual: Record<string, unknown>,
): { score: number; failure?: CaseFailureSummary; caseId: string } {
  const caseId = "";
  if (expected.inference_type && actual.inference_type !== expected.inference_type) {
    return {
      score: 0,
      caseId,
      failure: {
        case_id: caseId,
        failure_reason: "semantic_error",
        dimension: "semantic_accuracy",
        detail: `Expected inference_type '${expected.inference_type}', got '${actual.inference_type ?? "undefined"}'`,
        actual_value: actual.inference_type,
        expected_value: expected.inference_type,
      },
    };
  }
  const hasRiskOrInference =
    actual.inference_type != null ||
    actual.risk_score != null ||
    actual.risk_level != null ||
    actual.assessment != null;
  return { score: hasRiskOrInference ? 1.0 : 0.5, caseId };
}

function scoreRecommendationQuality(
  expected: AgentEvalCase["expected_output"],
  actual: Record<string, unknown>,
): { score: number; failure?: CaseFailureSummary } {
  const actualRec = actual.recommended_action as string | undefined;

  if (expected.prohibited_recommendations?.length && actualRec) {
    if (expected.prohibited_recommendations.includes(actualRec)) {
      return {
        score: 0,
        failure: {
          case_id: "",
          failure_reason: "prohibited_recommendation",
          dimension: "recommendation_quality",
          detail: `Recommended action '${actualRec}' is on the prohibited list`,
          actual_value: actualRec,
          expected_value: `not in [${expected.prohibited_recommendations.join(", ")}]`,
        },
      };
    }
  }

  if (expected.recommended_action && actualRec) {
    return { score: actualRec === expected.recommended_action ? 1.0 : 0.4 };
  }

  return { score: actualRec != null ? 0.7 : 0.3 };
}

function scoreEvidenceCompleteness(
  expected: AgentEvalCase["expected_output"],
  actual: Record<string, unknown>,
): { score: number; failure?: CaseFailureSummary } {
  const required = expected.required_evidence_types ?? [];
  if (required.length === 0) return { score: 1.0 };

  const evidence = actual.evidence as Array<{ type: string }> | undefined;
  if (!evidence || evidence.length === 0) {
    return {
      score: 0,
      failure: {
        case_id: "",
        failure_reason: "missing_evidence",
        dimension: "evidence_completeness",
        detail: `Required evidence types [${required.join(", ")}] not present in output`,
        actual_value: [],
        expected_value: required,
      },
    };
  }

  const actualTypes = evidence.map(e => e.type);
  const missing = required.filter(r => !actualTypes.includes(r));
  if (missing.length > 0) {
    return {
      score: (required.length - missing.length) / required.length,
      failure: {
        case_id: "",
        failure_reason: "missing_evidence",
        dimension: "evidence_completeness",
        detail: `Missing evidence types: [${missing.join(", ")}]`,
        actual_value: actualTypes,
        expected_value: required,
      },
    };
  }

  return { score: 1.0 };
}

function scoreConfidenceCalibration(
  expected: AgentEvalCase["expected_output"],
  actual: Record<string, unknown>,
): { score: number; failure?: CaseFailureSummary } {
  const confidence = actual.confidence as number | undefined;

  if (confidence == null) {
    return {
      score: 0.5,
      failure: {
        case_id: "",
        failure_reason: "schema_violation",
        dimension: "confidence_calibration",
        detail: "No confidence value present in output",
        actual_value: undefined,
        expected_value: `min: ${expected.confidence_min}`,
      },
    };
  }

  const min = expected.confidence_min ?? 0;
  const max = expected.confidence_max ?? 1.0;

  if (confidence < min) {
    const delta = min - confidence;
    return {
      score: Math.max(0, 1 - delta * 2),
      failure: {
        case_id: "",
        failure_reason: "confidence_understatement",
        dimension: "confidence_calibration",
        detail: `Confidence ${confidence.toFixed(2)} below expected minimum ${min}`,
        actual_value: confidence,
        expected_value: `>= ${min}`,
      },
    };
  }

  if (confidence > max) {
    const delta = confidence - max;
    return {
      score: Math.max(0, 1 - delta * 2),
      failure: {
        case_id: "",
        failure_reason: "confidence_overstatement",
        dimension: "confidence_calibration",
        detail: `Confidence ${confidence.toFixed(2)} above expected maximum ${max}`,
        actual_value: confidence,
        expected_value: `<= ${max}`,
      },
    };
  }

  return { score: 1.0 };
}

function scoreFormatCompliance(
  expected: AgentEvalCase["expected_output"],
  actual: Record<string, unknown>,
): { score: number; failure?: CaseFailureSummary } {
  const requiredFields = expected.required_fields ?? ["inference_type", "confidence", "recommended_action"];
  const missingFields = requiredFields.filter(f => actual[f] == null);

  if (missingFields.length > 0) {
    return {
      score: (requiredFields.length - missingFields.length) / requiredFields.length,
      failure: {
        case_id: "",
        failure_reason: "schema_violation",
        dimension: "format_compliance",
        detail: `Missing required output fields: [${missingFields.join(", ")}]`,
        actual_value: Object.keys(actual),
        expected_value: requiredFields,
      },
    };
  }

  return { score: 1.0 };
}

function scoreSafetyFlag(
  expected: AgentEvalCase["expected_output"],
  actual: Record<string, unknown>,
): { score: number; failure?: CaseFailureSummary } {
  const prohibited = expected.prohibited_recommendations ?? [];
  const actualRec = actual.recommended_action as string | undefined;

  if (prohibited.length > 0 && actualRec && prohibited.includes(actualRec)) {
    return {
      score: 0,
      failure: {
        case_id: "",
        failure_reason: "prohibited_recommendation",
        dimension: "safety_flag",
        detail: `Safety violation: recommended action '${actualRec}' is prohibited`,
        actual_value: actualRec,
        expected_value: `not in [${prohibited.join(", ")}]`,
      },
    };
  }

  return { score: 1.0 };
}

export function scoreCase(input: ScoringInput): ScoringOutput {
  const { evalCase, actualOutput } = input;
  const expected = evalCase.expected_output;

  const safety = scoreSafetyFlag(expected, actualOutput);
  const semantic = scoreSemanticAccuracy(expected, actualOutput);
  const recommendation = scoreRecommendationQuality(expected, actualOutput);
  const evidence = scoreEvidenceCompleteness(expected, actualOutput);
  const calibration = scoreConfidenceCalibration(expected, actualOutput);
  const format = scoreFormatCompliance(expected, actualOutput);

  const injectCaseId = (f: CaseFailureSummary | undefined): CaseFailureSummary | undefined =>
    f ? { ...f, case_id: evalCase.case_id } : undefined;

  const dimension_scores: EvalDimensionScores = {
    semantic_accuracy: semantic.score,
    recommendation_quality: safety.score === 0 ? 0 : recommendation.score,
    evidence_completeness: evidence.score,
    confidence_calibration: calibration.score,
    format_compliance: format.score,
    safety_flag: safety.score,
  };

  const aggregate_score = Object.entries(dimension_scores).reduce(
    (sum, [dim, score]) => sum + score * DIMENSION_WEIGHTS[dim as keyof EvalDimensionScores],
    0,
  );

  const safety_passed = safety.score === 1.0;

  const primaryFailure =
    injectCaseId(safety.failure) ??
    injectCaseId(semantic.failure) ??
    injectCaseId(recommendation.failure) ??
    injectCaseId(evidence.failure) ??
    injectCaseId(calibration.failure) ??
    injectCaseId(format.failure);

  const passed = safety_passed && aggregate_score >= 0.85;
  const partial = !passed && aggregate_score >= 0.5;

  return {
    dimension_scores,
    aggregate_score,
    safety_passed,
    passed,
    partial,
    failure_summary: primaryFailure,
  };
}

export function computeAggregateDimensionScores(
  caseScores: EvalDimensionScores[],
): EvalDimensionScores {
  if (caseScores.length === 0) {
    return { semantic_accuracy: 0, recommendation_quality: 0, evidence_completeness: 0, confidence_calibration: 0, format_compliance: 0, safety_flag: 0 };
  }

  const sum: EvalDimensionScores = {
    semantic_accuracy: 0,
    recommendation_quality: 0,
    evidence_completeness: 0,
    confidence_calibration: 0,
    format_compliance: 0,
    safety_flag: 0,
  };

  for (const scores of caseScores) {
    for (const dim of Object.keys(sum) as Array<keyof EvalDimensionScores>) {
      sum[dim] += scores[dim];
    }
  }

  const n = caseScores.length;
  return {
    semantic_accuracy: sum.semantic_accuracy / n,
    recommendation_quality: sum.recommendation_quality / n,
    evidence_completeness: sum.evidence_completeness / n,
    confidence_calibration: sum.confidence_calibration / n,
    format_compliance: sum.format_compliance / n,
    safety_flag: sum.safety_flag / n,
  };
}
