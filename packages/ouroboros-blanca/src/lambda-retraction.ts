/**
 * Λ-Retraction Discipline — Primitive 24.
 *
 * Sources:
 *   Albert Einstein, "Kosmologische Betrachtungen zur allgemeinen
 *     Relativitätstheorie" (Cosmological Considerations in the General
 *     Theory of Relativity), Sitzungsberichte der Preussischen Akademie
 *     der Wissenschaften (1917), pp. 142–152 — introduces the
 *     cosmological constant Λ.
 *   Albert Einstein, "Zum kosmologischen Problem der allgemeinen
 *     Relativitätstheorie" (On the Cosmological Problem of the General
 *     Theory of Relativity), Sitzungsberichte der Preussischen Akademie
 *     der Wissenschaften (1931), pp. 235–237 — retracts Λ in light of
 *     Hubble's expansion data.
 *
 * Principle: every operator-supplied constant inserted into a runtime
 * trust law to maintain a desired equilibrium MUST come with a public
 * retraction commitment — a named witness whose contradictory signal
 * forces the constant to zero. Einstein paid for this lesson the hard
 * way: the cosmological constant Λ was inserted to keep the universe
 * static, and only later overruled by Hubble's redshift data.
 *
 * In Ouroboros: any operator-defined trust constant carries a
 * Falsifiability-Λ slot. The slot names (a) the witness that may
 * contradict it, (b) the threshold past which the constant is retracted,
 * and (c) the public log entry that records the retraction. Without
 * all three, the constant is inadmissible.
 */

export interface FalsifiabilityCommitment {
  /** Human-readable name of the constant being defended. */
  readonly constantName: string;
  /** The value of the constant. */
  readonly constantValue: number;
  /** Name of the witness whose signal can contradict the constant. */
  readonly witnessName: string;
  /** Threshold past which the constant must be retracted. */
  readonly retractionThreshold: number;
  /** Public log identifier where retraction will be recorded. */
  readonly publicLogRef: string;
}

export interface RetractionEvent {
  readonly timestamp: number;
  readonly observedSignal: number;
  readonly retracted: boolean;
  readonly publicLogRef: string;
  readonly reason: string;
}

export interface RetractionReport {
  readonly commitment: FalsifiabilityCommitment;
  readonly observedSignal: number;
  readonly retracted: boolean;
  readonly margin: number;
  readonly verdict: "HOLDING" | "MARGINAL" | "RETRACTED" | "INADMISSIBLE";
}

/**
 * Validate that a Falsifiability-Λ commitment is admissible.
 * All four slots must be present and non-empty; the threshold must be
 * a finite positive number.
 */
export function validateCommitment(c: FalsifiabilityCommitment): boolean {
  if (typeof c.constantName !== "string" || c.constantName.trim().length === 0) return false;
  if (!Number.isFinite(c.constantValue)) return false;
  if (typeof c.witnessName !== "string" || c.witnessName.trim().length === 0) return false;
  if (!Number.isFinite(c.retractionThreshold) || c.retractionThreshold <= 0) return false;
  if (typeof c.publicLogRef !== "string" || c.publicLogRef.trim().length === 0) return false;
  return true;
}

/**
 * Apply the retraction discipline: given a commitment and the
 * currently observed witness signal, decide whether to retract.
 *
 * Defects against the signal magnitude relative to the threshold;
 * margin > 0 means the signal does not yet trigger retraction.
 */
export function applyRetraction(
  commitment: FalsifiabilityCommitment,
  observedSignal: number,
): RetractionReport {
  if (!validateCommitment(commitment)) {
    return {
      commitment,
      observedSignal,
      retracted: false,
      margin: NaN,
      verdict: "INADMISSIBLE",
    };
  }
  if (!Number.isFinite(observedSignal)) {
    throw new Error("blanca.applyRetraction: observedSignal must be finite");
  }
  const magnitude = Math.abs(observedSignal);
  const margin = commitment.retractionThreshold - magnitude;

  let verdict: RetractionReport["verdict"];
  let retracted = false;
  if (magnitude >= commitment.retractionThreshold) {
    verdict = "RETRACTED";
    retracted = true;
  } else if (magnitude >= 0.8 * commitment.retractionThreshold) {
    verdict = "MARGINAL";
  } else {
    verdict = "HOLDING";
  }

  return { commitment, observedSignal, retracted, margin, verdict };
}

/**
 * Reduce a retraction report to a trust axis L ∈ [0, 1].
 *
 *   HOLDING      ⇒ 1
 *   MARGINAL     ⇒ linear bleed 1 → 0 across the marginal band [0.8·threshold, threshold]
 *   RETRACTED    ⇒ 0
 *   INADMISSIBLE ⇒ 0  (the commitment itself fails axiom — Λ has no falsifiability slot)
 */
export function lambdaRetractionAxis(report: RetractionReport): number {
  switch (report.verdict) {
    case "HOLDING":
      return 1;
    case "RETRACTED":
    case "INADMISSIBLE":
      return 0;
    case "MARGINAL": {
      const t = report.margin / (0.2 * report.commitment.retractionThreshold);
      return Math.max(0, Math.min(1, t));
    }
  }
}

/**
 * Build a public retraction log entry. Returns the full RetractionEvent
 * record that an operator must commit to the named publicLogRef.
 */
export function recordRetraction(
  report: RetractionReport,
  timestamp: number,
  reason: string,
): RetractionEvent {
  if (!Number.isFinite(timestamp) || timestamp < 0) {
    throw new Error("blanca.recordRetraction: timestamp must be a non-negative finite number");
  }
  return {
    timestamp,
    observedSignal: report.observedSignal,
    retracted: report.retracted,
    publicLogRef: report.commitment.publicLogRef,
    reason,
  };
}
