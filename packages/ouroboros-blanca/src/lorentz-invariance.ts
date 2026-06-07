/**
 * Lorentz-Invariance Witness — Primitive 21.
 *
 * Source: Albert Einstein, "Zur Elektrodynamik bewegter Körper"
 *   (On the Electrodynamics of Moving Bodies),
 *   Annalen der Physik (ser. 4) 17 (1905), pp. 891–921.
 *
 * Principle: physical laws are invariant under change of inertial frame.
 * The Minkowski interval
 *
 *     s² = c² Δt² − Δx² − Δy² − Δz²
 *
 * is preserved by every Lorentz transformation. Two observers in
 * relative motion who both compute s² from the same pair of events
 * MUST obtain the same scalar. If they do not, the transformation
 * between their frames is not a Lorentz element — meaning at least
 * one of the two coordinate systems is corrupt or the change-of-basis
 * is broken.
 *
 * In Ouroboros: a representation handoff between two trust frames is
 * trustworthy iff the spacetime-style interval between any two paired
 * observation events is preserved across the handoff. The Lorentz
 * primitive returns the relative defect and a trust axis I ∈ [0, 1].
 *
 * No external linear algebra; closed-form scalar arithmetic.
 */

export interface SpacetimeEvent {
  /** Time coordinate in the frame's seconds. */
  readonly t: number;
  /** Spatial vector in the frame's metres. (Length must match across all events.) */
  readonly x: ReadonlyArray<number>;
}

export interface PairedObservation {
  /** Event A as seen in frame 1. */
  readonly frame1A: SpacetimeEvent;
  /** Event B as seen in frame 1. */
  readonly frame1B: SpacetimeEvent;
  /** Event A as seen in frame 2. */
  readonly frame2A: SpacetimeEvent;
  /** Event B as seen in frame 2. */
  readonly frame2B: SpacetimeEvent;
}

export interface InvarianceReading {
  /** Interval s² = c²Δt² − |Δx|² as seen in frame 1. */
  readonly interval1: number;
  /** Interval s² as seen in frame 2. */
  readonly interval2: number;
  /** Absolute defect |s²₁ − s²₂|. */
  readonly defect: number;
  /** Relative defect |s²₁ − s²₂| / max(|s²₁|, |s²₂|, 1). */
  readonly relativeDefect: number;
  readonly verdict: "INVARIANT" | "NEAR_INVARIANT" | "BROKEN";
}

export interface InvarianceThresholds {
  /** ≤ this relative defect ⇒ INVARIANT. Default 1e-9. */
  readonly invariant: number;
  /** ≤ this relative defect ⇒ NEAR_INVARIANT. Default 1e-3. */
  readonly near: number;
}

const DEFAULT_THRESHOLDS: InvarianceThresholds = {
  invariant: 1e-9,
  near: 1e-3,
};

/** Speed of light in m/s. Default; operators may override per workload. */
export const C_DEFAULT = 299_792_458;

function squaredInterval(
  a: SpacetimeEvent,
  b: SpacetimeEvent,
  c: number,
): number {
  if (a.x.length !== b.x.length) {
    throw new Error("blanca.squaredInterval: spatial vectors must have matching length");
  }
  const dt = b.t - a.t;
  let dx2 = 0;
  for (let i = 0; i < a.x.length; i++) {
    const dxi = (b.x[i] ?? 0) - (a.x[i] ?? 0);
    dx2 += dxi * dxi;
  }
  return c * c * dt * dt - dx2;
}

/**
 * Test whether a paired observation is Lorentz-invariant: do the two
 * frames agree on the squared interval between the same two events?
 */
export function checkInvariance(
  obs: PairedObservation,
  c: number = C_DEFAULT,
  thresholds: InvarianceThresholds = DEFAULT_THRESHOLDS,
): InvarianceReading {
  if (!Number.isFinite(c) || c <= 0) {
    throw new Error("blanca.checkInvariance: c must be a positive finite number");
  }
  const s1 = squaredInterval(obs.frame1A, obs.frame1B, c);
  const s2 = squaredInterval(obs.frame2A, obs.frame2B, c);
  for (const v of [s1, s2]) {
    if (!Number.isFinite(v)) {
      throw new Error("blanca.checkInvariance: non-finite interval");
    }
  }
  const defect = Math.abs(s1 - s2);
  const scale = Math.max(Math.abs(s1), Math.abs(s2), 1);
  const relativeDefect = defect / scale;

  let verdict: InvarianceReading["verdict"];
  if (relativeDefect <= thresholds.invariant) verdict = "INVARIANT";
  else if (relativeDefect <= thresholds.near) verdict = "NEAR_INVARIANT";
  else verdict = "BROKEN";

  return {
    interval1: s1,
    interval2: s2,
    defect,
    relativeDefect,
    verdict,
  };
}

/**
 * Reduce an invariance reading to the trust axis I ∈ [0, 1].
 *
 *   I = max(0, 1 − relativeDefect / nearThreshold)
 *
 * BROKEN ⇒ I = 0.
 */
export function invarianceAxis(
  reading: InvarianceReading,
  thresholds: InvarianceThresholds = DEFAULT_THRESHOLDS,
): number {
  if (reading.verdict === "BROKEN") return 0;
  const t = 1 - reading.relativeDefect / thresholds.near;
  return Math.max(0, Math.min(1, t));
}
