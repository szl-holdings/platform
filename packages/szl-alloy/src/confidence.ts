import type { Evidence } from "./types.js";

export interface ConfidenceInput {
  baseConfidence: number;
  supportingEvidence: Evidence[];
  contradictingEvidence: Evidence[];
  freshnessScore?: number;
  policyPenalty?: number;
}

export interface ConfidenceResult {
  score: number;
  supportingWeight: number;
  contradictingWeight: number;
  freshnessAdjustment: number;
  policyAdjustment: number;
  breakdown: string;
}

export function computeConfidence(input: ConfidenceInput): ConfidenceResult {
  const {
    baseConfidence,
    supportingEvidence,
    contradictingEvidence,
    freshnessScore = 1,
    policyPenalty = 0,
  } = input;

  const supportingWeight = supportingEvidence.reduce((sum, ev) => {
    return sum + ev.weight * ev.confidence * (ev.freshness.isStale ? 0.5 : 1);
  }, 0);

  const contradictingWeight = contradictingEvidence.reduce((sum, ev) => {
    return sum + ev.weight * ev.confidence * (ev.freshness.isStale ? 0.5 : 1);
  }, 0);

  const totalWeight = Math.max(supportingWeight + contradictingWeight, 1);
  const evidenceRatio = (supportingWeight - contradictingWeight * 0.8) / totalWeight;
  const evidenceAdjustment = Math.max(-0.4, Math.min(0.3, evidenceRatio * 0.3));

  const freshnessAdjustment = (freshnessScore - 1) * 0.15;
  const policyAdjustment = -Math.abs(policyPenalty) * 0.1;

  const raw = baseConfidence + evidenceAdjustment + freshnessAdjustment + policyAdjustment;
  const score = Math.max(0, Math.min(1, raw));

  const breakdown = [
    `base=${baseConfidence.toFixed(3)}`,
    `evidence=${evidenceAdjustment >= 0 ? "+" : ""}${evidenceAdjustment.toFixed(3)}`,
    `freshness=${freshnessAdjustment >= 0 ? "+" : ""}${freshnessAdjustment.toFixed(3)}`,
    `policy=${policyAdjustment.toFixed(3)}`,
    `final=${score.toFixed(3)}`,
  ].join(" ");

  return {
    score,
    supportingWeight,
    contradictingWeight,
    freshnessAdjustment,
    policyAdjustment,
    breakdown,
  };
}

export function confidenceTier(score: number): "very-low" | "low" | "medium" | "high" | "very-high" {
  if (score >= 0.85) return "very-high";
  if (score >= 0.7) return "high";
  if (score >= 0.5) return "medium";
  if (score >= 0.3) return "low";
  return "very-low";
}
