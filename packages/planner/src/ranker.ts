import { computePriorityScore } from "@szl-holdings/decision-engine";
import type { PlanGraph } from "./types.js";

/**
 * Rank fallback plans using @szl-holdings/decision-engine's priority scorer.
 *
 * Each fallback is converted into a synthetic signal/business-impact pair so
 * the same scorer that ranks operational recommendations can rank planner
 * counterfactuals. Higher score = higher priority. Returns the fallbacks
 * sorted descending with `rank` reassigned to reflect the new order, plus
 * the score in `metadata.fallbackPriority`.
 */
export function rankFallbacks(primary: PlanGraph, fallbacks: PlanGraph[]): PlanGraph[] {
  if (fallbacks.length <= 1) {
    return fallbacks.map((f, i) => ({ ...f, rank: i + 1 }));
  }

  const weights = {
    businessImpact: 0.35,
    urgency: 0.1,
    confidence: 0.2,
    slaProximity: 0.05,
    crossDomainRisk: 0.3,
  };

  const scored = fallbacks.map((fb) => {
    // Build a synthetic BusinessImpact: cheaper + lower-risk fallbacks win.
    const costDelta = Math.max(0, primary.estimatedCostUsd - fb.estimatedCostUsd);
    const riskDelta = Math.max(0, primary.estimatedRisk - fb.estimatedRisk);

    const businessImpact = {
      financialExposureUsd: Math.round(costDelta * 1000),
      regulatoryExposure: fb.steps.some((s) => s.requiredApproval),
      crossDomainBlastRadius: dedupe(
        fb.steps
          .map((s) => (s.metadata.fallbackKind as string | undefined) ?? "")
          .filter(Boolean),
      ),
      affectedUsers: fb.steps.length * 10,
      customerImpactSeverity: fb.estimatedRisk > 0.5 ? "high" : fb.estimatedRisk > 0.25 ? "medium" : "low",
    } as const;

    const score = computePriorityScore({
      businessImpact: businessImpact as any,
      urgency: fb.riskLevel === "critical" ? "critical" : fb.riskLevel === "high" ? "urgent" : "moderate",
      confidence: clamp01(fb.confidence + riskDelta),
      signals: [],
      weights,
    });

    return { fb, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.map((entry, i) => ({
    ...entry.fb,
    rank: i + 1,
    metadata: {
      ...entry.fb.metadata,
      fallbackPriority: entry.score,
    },
  }));
}

function dedupe<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
