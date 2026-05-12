/**
 * Equivalence-Principle Witness — Primitive 22.
 *
 * Sources:
 *   Albert Einstein, "Über das Relativitätsprinzip und die aus
 *     demselben gezogenen Folgerungen" (On the Relativity Principle
 *     and the Conclusions Drawn from It), Jahrbuch der Radioaktivität
 *     und Elektronik 4 (1907), pp. 411–462.
 *   Albert Einstein, "Über den Einfluß der Schwerkraft auf die
 *     Ausbreitung des Lichtes" (On the Influence of Gravitation on
 *     the Propagation of Light), Annalen der Physik (ser. 4) 35 (1911),
 *     pp. 898–908.
 *
 * Principle: locally — over a sufficiently small region of spacetime —
 * a uniform gravitational field and a uniformly accelerating frame are
 * indistinguishable.
 *
 * In Ouroboros: a runtime cannot tell, from a single witness's drift,
 * whether the drift comes from a real bias (a "gravity" — an attacker
 * pulling consistently on its measurements) or from a coordinate
 * artifact (a "uniform acceleration" — clock skew, frame change).
 *
 * The equivalence primitive returns the time-window L over which the
 * runtime is permitted to defer the judgement, and the residual
 * tidal signal that distinguishes the two cases. Tidal terms are
 * second-order: their presence indicates a real field, not a
 * coordinate artifact.
 */

export interface EquivalenceObservation {
  /** Mean acceleration measured by the witness (units: any consistent set). */
  readonly meanAcceleration: number;
  /** Tidal signal: max difference of acceleration across the witness's spatial extent. */
  readonly tidalDelta: number;
  /** Window length in seconds over which both quantities were averaged. */
  readonly window: number;
}

export interface EquivalenceReading {
  /** Tidal-to-bias ratio = tidalDelta / |meanAcceleration|. Bounded if mean is nonzero. */
  readonly tidalRatio: number;
  /** Maximum window the runtime may defer judgement, in seconds. */
  readonly deferralCeiling: number;
  /**
   * Verdict.
   *   INDISTINGUISHABLE — tidal ≪ bias and window ≤ ceiling: defer is fine.
   *   FIELD_DETECTED    — tidal exceeds bias by a margin: a real field is present.
   *   FRAME_ARTIFACT    — bias dominates and tidal is negligible: likely a coordinate change.
   *   WINDOW_EXCEEDED   — deferral window has been exhausted; runtime must escalate.
   */
  readonly verdict: "INDISTINGUISHABLE" | "FIELD_DETECTED" | "FRAME_ARTIFACT" | "WINDOW_EXCEEDED";
}

export interface EquivalenceThresholds {
  /** Tidal ratio above which a real field is asserted. Default 0.1. */
  readonly fieldThreshold: number;
  /** Tidal ratio below which a frame artifact is asserted. Default 0.01. */
  readonly frameThreshold: number;
  /** Maximum tolerable deferral window in seconds. Default 60. */
  readonly maxWindow: number;
}

const DEFAULT_THRESHOLDS: EquivalenceThresholds = {
  fieldThreshold: 0.1,
  frameThreshold: 0.01,
  maxWindow: 60,
};

/**
 * Apply the equivalence-principle test to a witness observation.
 */
export function checkEquivalence(
  obs: EquivalenceObservation,
  thresholds: EquivalenceThresholds = DEFAULT_THRESHOLDS,
): EquivalenceReading {
  for (const v of [obs.meanAcceleration, obs.tidalDelta, obs.window]) {
    if (!Number.isFinite(v)) {
      throw new Error("blanca.checkEquivalence: observation must contain finite numbers");
    }
  }
  if (obs.window <= 0) {
    throw new Error("blanca.checkEquivalence: window must be positive");
  }
  if (obs.tidalDelta < 0) {
    throw new Error("blanca.checkEquivalence: tidalDelta must be non-negative");
  }

  const denom = Math.abs(obs.meanAcceleration);
  const tidalRatio = denom === 0 ? (obs.tidalDelta === 0 ? 0 : Number.POSITIVE_INFINITY)
                                  : obs.tidalDelta / denom;
  const deferralCeiling = thresholds.maxWindow;

  let verdict: EquivalenceReading["verdict"];
  if (obs.window > thresholds.maxWindow) {
    verdict = "WINDOW_EXCEEDED";
  } else if (tidalRatio >= thresholds.fieldThreshold) {
    verdict = "FIELD_DETECTED";
  } else if (tidalRatio <= thresholds.frameThreshold) {
    verdict = "FRAME_ARTIFACT";
  } else {
    verdict = "INDISTINGUISHABLE";
  }

  return { tidalRatio, deferralCeiling, verdict };
}

/**
 * Reduce an equivalence reading to a trust axis E ∈ [0, 1].
 *
 *   FIELD_DETECTED  ⇒ 0  (a real bias is present; the runtime must NOT trust the witness blindly)
 *   FRAME_ARTIFACT  ⇒ 1  (likely a coordinate change; safe to recompose with frame correction)
 *   INDISTINGUISHABLE ⇒ linear in tidalRatio between 0 and 1
 *   WINDOW_EXCEEDED ⇒ 0  (deferral exhausted; treat as broken)
 */
export function equivalenceAxis(
  reading: EquivalenceReading,
  thresholds: EquivalenceThresholds = DEFAULT_THRESHOLDS,
): number {
  switch (reading.verdict) {
    case "FIELD_DETECTED":
    case "WINDOW_EXCEEDED":
      return 0;
    case "FRAME_ARTIFACT":
      return 1;
    case "INDISTINGUISHABLE": {
      const span = thresholds.fieldThreshold - thresholds.frameThreshold;
      if (span <= 0) return 1;
      const t = 1 - (reading.tidalRatio - thresholds.frameThreshold) / span;
      return Math.max(0, Math.min(1, t));
    }
  }
}
