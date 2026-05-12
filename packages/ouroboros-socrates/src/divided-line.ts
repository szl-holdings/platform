/**
 * Primitive 29 — Divided Line / four-level cognition ladder
 *
 * Source: Plato, Republic 509d–511e, 533c (in Socrates' voice).
 * Working summary: Eva Brann, "Socrates on Mathematics and Being",
 *   The Imaginative Conservative, 2016.
 *
 * Cognitive levels, lowest to highest:
 *   EIKASIA  — image-belief (shadows, reflections)
 *   PISTIS   — sense-belief (concrete things)
 *   DIANOIA  — mathematical reasoning from undisturbed hypotheses
 *   NOESIS   — dialectical knowing, hypotheses RAISED, account given
 *
 * Promotion rules (Republic 510b, 533c8 anairousa):
 *   PISTIS → DIANOIA   requires explicit hypotheses
 *   DIANOIA → NOESIS   requires every hypothesis to be RAISED (anaireō)
 *                       and a synoptic witness binding (see primitive 32).
 */

export type CognitiveTier = "EIKASIA" | "PISTIS" | "DIANOIA" | "NOESIS";

export const TIER_RANK: Record<CognitiveTier, number> = {
  EIKASIA: 0,
  PISTIS: 1,
  DIANOIA: 2,
  NOESIS: 3,
};

export const TIER_GROUNDING: Record<CognitiveTier, number> = {
  EIKASIA: 0.0,
  PISTIS: 0.33,
  DIANOIA: 0.66,
  NOESIS: 1.0,
};

export interface ClaimStamp {
  claimId: string;
  declaredTier: CognitiveTier;
  hypothesisIds: string[];
  raisedHypothesisIds: string[];
  synopticWitnessHash: string | null;
}

export type DividedLineVerdict =
  | "ADMIT_AT_NOESIS"
  | "ADMIT_AT_DIANOIA"
  | "ADMIT_AT_PISTIS"
  | "ADMIT_AT_EIKASIA"
  | "DEMOTE_NO_HYPOTHESES"
  | "DEMOTE_UNRAISED_HYPOTHESES"
  | "DEMOTE_NO_WITNESS";

export interface DividedLineResult {
  claimId: string;
  declaredTier: CognitiveTier;
  admittedTier: CognitiveTier;
  groundingScore: number; // matches Λ₈ axis B
  verdict: DividedLineVerdict;
  reason: string;
}

export function evaluateDividedLine(stamp: ClaimStamp): DividedLineResult {
  const { claimId, declaredTier, hypothesisIds, raisedHypothesisIds, synopticWitnessHash } = stamp;

  // EIKASIA / PISTIS pass through; they never need hypotheses.
  if (declaredTier === "EIKASIA" || declaredTier === "PISTIS") {
    return {
      claimId,
      declaredTier,
      admittedTier: declaredTier,
      groundingScore: TIER_GROUNDING[declaredTier],
      verdict: declaredTier === "EIKASIA" ? "ADMIT_AT_EIKASIA" : "ADMIT_AT_PISTIS",
      reason: "Sub-intelligible tier admits without hypotheses.",
    };
  }

  // DIANOIA requires at least one declared hypothesis.
  if (hypothesisIds.length === 0) {
    return {
      claimId,
      declaredTier,
      admittedTier: "PISTIS",
      groundingScore: TIER_GROUNDING.PISTIS,
      verdict: "DEMOTE_NO_HYPOTHESES",
      reason: "Dianoetic/noetic claim must declare hypotheses (Republic 510b).",
    };
  }

  if (declaredTier === "DIANOIA") {
    return {
      claimId,
      declaredTier,
      admittedTier: "DIANOIA",
      groundingScore: TIER_GROUNDING.DIANOIA,
      verdict: "ADMIT_AT_DIANOIA",
      reason: "Hypotheses present; soul searches from them toward consequences (510b).",
    };
  }

  // NOESIS — every hypothesis must be RAISED, plus a synoptic witness binding.
  const allRaised = hypothesisIds.every((id) => raisedHypothesisIds.includes(id));
  if (!allRaised) {
    return {
      claimId,
      declaredTier,
      admittedTier: "DIANOIA",
      groundingScore: TIER_GROUNDING.DIANOIA,
      verdict: "DEMOTE_UNRAISED_HYPOTHESES",
      reason: "Mathematicians dream about being while hypotheses sit undisturbed (533b8).",
    };
  }
  if (!synopticWitnessHash) {
    return {
      claimId,
      declaredTier,
      admittedTier: "DIANOIA",
      groundingScore: TIER_GROUNDING.DIANOIA,
      verdict: "DEMOTE_NO_WITNESS",
      reason: "Noesis requires synoptikos binding (Republic 531d, 537c).",
    };
  }

  return {
    claimId,
    declaredTier: "NOESIS",
    admittedTier: "NOESIS",
    groundingScore: TIER_GROUNDING.NOESIS,
    verdict: "ADMIT_AT_NOESIS",
    reason: "Hypotheses raised (anairousa, 533c8) and synoptic witness bound.",
  };
}

/**
 * Aggregate grounding score over a payload of claims = mean of admitted-tier groundings.
 * Used as axis B in Λ₈.
 */
export function ontologicalGrounding(results: DividedLineResult[]): number {
  if (results.length === 0) return 0;
  const sum = results.reduce((acc, r) => acc + r.groundingScore, 0);
  return sum / results.length;
}
