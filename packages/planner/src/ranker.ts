import type { BusinessImpact } from '@szl-holdings/decision-engine';
import { computePriorityScore } from '@szl-holdings/decision-engine';
import type { PlanGraph } from './types.js';

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

    // Score the *benefit* of swapping to this fallback (cost saved + risk
    // reduced), so higher decision-engine priority => better fallback.
    const reputationalRisk: BusinessImpact['reputationalRisk'] =
      riskDelta > 0.4 ? 'critical' : riskDelta > 0.2 ? 'high' : riskDelta > 0.05 ? 'medium' : 'low';

    const businessImpact: BusinessImpact = {
      financialExposureUsd: Math.round(costDelta * 1000),
      regulatoryExposure: fb.steps.some((s) => s.requiredApproval),
      reputationalRisk,
      affectedEntities: fb.steps.length * 10,
      crossDomainBlastRadius: dedupe(
        fb.steps
          .map((s) => {
            const kind = s.metadata['fallbackKind'];
            return typeof kind === 'string' ? kind : '';
          })
          .filter((k): k is string => k.length > 0),
      ),
    };

    // Higher urgency when the primary is itself critical (we *need* a viable
    // fallback fast). Falls through on the fallback's own risk level for
    // tie-breaking.
    const urgency: 'critical' | 'urgent' | 'moderate' =
      primary.riskLevel === 'critical'
        ? 'critical'
        : primary.riskLevel === 'high'
          ? 'urgent'
          : 'moderate';

    const score = computePriorityScore({
      businessImpact,
      urgency,
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
