/**
 * Thales Primitives — Primitives 15 & 16.
 *
 * Source: Thales of Miletus (c. 624–546 BCE), as recorded in
 *   Maor & Jost, Beautiful Geometry, Chapter 1 (Princeton University Press).
 *   https://assets.press.princeton.edu/chapters/s10065.pdf
 *
 * Two of the oldest theorems in mathematics, repurposed for runtime trust.
 *
 * Primitive 15 — Similarity Ratio (Cheops Method).
 *   Thales found the height of the Great Pyramid by erecting a staff and
 *   reading two shadows. Similar right triangles give:
 *       H / S = h / s     ⇒    H = h · S / s
 *   In runtime terms: a small reference run (h, s) you trust pins the
 *   reachable height H of a giant production run (S) you cannot anchor
 *   directly. The trust ratio H/h equals the workload ratio S/s. A
 *   "similarity defect" measures how far the production triangle has
 *   drifted from its reference twin.
 *
 * Primitive 16 — Inscribed-Angle Locus (Thales' Theorem).
 *   Thales' invariance theorem — the first invariance theorem in
 *   mathematics — says that every point on the circumference of a
 *   circle subtends the diameter at exactly 90°. Generalised: every
 *   point on the major arc subtends a fixed chord at the same angle α.
 *   In runtime terms: every witness on the same locus must observe a
 *   handoff chord under the same subtended angle. If one witness reports
 *   a different angle, that witness is off-circle and its verdict
 *   should be quarantined.
 *
 * Both primitives are dimension-free (ratios and angles only) and so can
 * be carried as Lutar-Invariant axes without unit conversion.
 */

// --- Primitive 15: Similarity Ratio --------------------------------------

export interface ThalesReference {
  /** The trusted small triangle: anchored, known height. */
  readonly referenceHeight: number; // h
  readonly referenceShadow: number; // s
}

export interface ThalesObservation {
  /** The unanchored tall triangle: unknown height, observed shadow. */
  readonly observedShadow: number; // S
  /** Optional ground-truth height for similarity-defect computation. */
  readonly observedHeight?: number; // H_obs
}

export type SimilarityVerdict = "SIMILAR" | "DEGRADED" | "BROKEN" | "UNDEFINED";

export interface SimilarityReading {
  /** Inferred height H = h · S / s. */
  readonly inferredHeight: number;
  /** Trust ratio = referenceHeight / referenceShadow = h/s. Independent of S. */
  readonly trustRatio: number;
  /** Workload ratio = observedShadow / referenceShadow = S/s. */
  readonly workloadRatio: number;
  /**
   * Similarity defect ∈ [0, ∞). Zero means H_obs matches the inference exactly.
   * Computed as |H_obs − H_inferred| / H_inferred. NaN when no H_obs given.
   */
  readonly similarityDefect: number;
  readonly verdict: SimilarityVerdict;
}

export interface SimilarityThresholds {
  /** ≤ this defect ⇒ SIMILAR. Default 0.05 (5%). */
  readonly similar: number;
  /** ≤ this defect ⇒ DEGRADED. Default 0.20 (20%). Above ⇒ BROKEN. */
  readonly degraded: number;
}

const DEFAULT_THRESHOLDS: SimilarityThresholds = {
  similar: 0.05,
  degraded: 0.2,
};

/**
 * Compute the Thales similarity reading.
 *
 * Throws if the reference triangle is degenerate (s = 0 or h ≤ 0). All
 * three of (h, s, S) must be strictly positive; H_obs is optional.
 */
export function computeSimilarity(
  reference: ThalesReference,
  observation: ThalesObservation,
  thresholds: SimilarityThresholds = DEFAULT_THRESHOLDS,
): SimilarityReading {
  const { referenceHeight: h, referenceShadow: s } = reference;
  const { observedShadow: S, observedHeight: Hobs } = observation;

  if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(S)) {
    throw new Error("thales.similarity: h, s, S must all be finite numbers");
  }
  if (h <= 0 || s <= 0 || S < 0) {
    throw new Error(
      "thales.similarity: h, s must be > 0 and S must be ≥ 0 (Thales requires a real reference triangle)",
    );
  }

  const trustRatio = h / s;
  const workloadRatio = S / s;
  const inferredHeight = trustRatio * S;

  let similarityDefect = Number.NaN;
  let verdict: SimilarityVerdict = "UNDEFINED";

  if (Hobs !== undefined) {
    if (!Number.isFinite(Hobs) || Hobs < 0) {
      throw new Error("thales.similarity: H_obs must be a non-negative finite number");
    }
    if (inferredHeight === 0) {
      similarityDefect = Hobs === 0 ? 0 : Number.POSITIVE_INFINITY;
    } else {
      similarityDefect = Math.abs(Hobs - inferredHeight) / inferredHeight;
    }
    if (similarityDefect <= thresholds.similar) verdict = "SIMILAR";
    else if (similarityDefect <= thresholds.degraded) verdict = "DEGRADED";
    else verdict = "BROKEN";
  }

  return {
    inferredHeight,
    trustRatio,
    workloadRatio,
    similarityDefect,
    verdict,
  };
}

/**
 * Reduce a similarity reading to a Cleanliness-axis fraction in [0, 1].
 * Used as the "Thales axis" T contribution to the Lutar Invariant.
 *
 *  T = max(0, 1 − defect / degradedThreshold)
 *
 * SIMILAR (defect ≤ similar)   ⇒ T close to 1.
 * DEGRADED                    ⇒ T linearly between 1 and 0.
 * BROKEN                      ⇒ T = 0.
 * UNDEFINED                   ⇒ T = 1 (no observation = no penalty).
 */
export function similarityAxis(
  reading: SimilarityReading,
  thresholds: SimilarityThresholds = DEFAULT_THRESHOLDS,
): number {
  if (reading.verdict === "UNDEFINED") return 1;
  if (reading.verdict === "BROKEN") return 0;
  const t = 1 - reading.similarityDefect / thresholds.degraded;
  return Math.max(0, Math.min(1, t));
}

// --- Primitive 16: Inscribed-Angle Locus --------------------------------

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface WitnessOnCircle {
  /** Stable identifier for this witness. */
  readonly id: string;
  /** Witness position on the circle, e.g. (cos θ_i, sin θ_i). */
  readonly point: Point2D;
}

export interface Chord {
  /** Two endpoints of the handoff chord. */
  readonly a: Point2D;
  readonly b: Point2D;
}

export type LocusVerdict = "ON_LOCUS" | "DRIFT" | "OFF_LOCUS" | "INSUFFICIENT";

export interface SubtendedReading {
  readonly witnessId: string;
  /** Angle subtended by the chord at this witness, in radians. */
  readonly angle: number;
  /** Deviation from the median angle, in radians. */
  readonly deviation: number;
}

export interface LocusReport {
  readonly verdict: LocusVerdict;
  readonly medianAngle: number;
  readonly meanAngle: number;
  readonly maxDeviation: number;
  readonly readings: ReadonlyArray<SubtendedReading>;
}

export interface LocusThresholds {
  /** ≤ this ⇒ ON_LOCUS (radians). Default 1° = 0.01745. */
  readonly onLocus: number;
  /** ≤ this ⇒ DRIFT. Default 5° = 0.0873. Above ⇒ OFF_LOCUS. */
  readonly drift: number;
}

const DEFAULT_LOCUS_THRESHOLDS: LocusThresholds = {
  onLocus: Math.PI / 180, // 1°
  drift: (5 * Math.PI) / 180, // 5°
};

function subtendedAngle(p: Point2D, chord: Chord): number {
  const ax = chord.a.x - p.x;
  const ay = chord.a.y - p.y;
  const bx = chord.b.x - p.x;
  const by = chord.b.y - p.y;
  const dot = ax * bx + ay * by;
  const cross = ax * by - ay * bx;
  // atan2 returns the signed angle in (-π, π]; we take its absolute value
  // so that "subtended angle" is unsigned in [0, π].
  return Math.abs(Math.atan2(cross, dot));
}

/**
 * Median for a small array — used because the locus check is a robust
 * statistic and we want a single bad witness not to drag the centre.
 */
function median(xs: number[]): number {
  if (xs.length === 0) return Number.NaN;
  const s = [...xs].sort((p, q) => p - q);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1]! + s[mid]!) / 2 : s[mid]!;
}

/**
 * Verify Thales' inscribed-angle invariance across a witness set.
 *
 * Every witness on the same locus arc must subtend the chord at the same
 * angle. The check is robust: we compute all angles, take the median, and
 * report each witness's deviation. A single off-circle witness lights up.
 *
 * Requires at least 3 witnesses (otherwise INSUFFICIENT).
 */
export function verifyInscribedAngle(
  witnesses: ReadonlyArray<WitnessOnCircle>,
  chord: Chord,
  thresholds: LocusThresholds = DEFAULT_LOCUS_THRESHOLDS,
): LocusReport {
  if (witnesses.length < 3) {
    return {
      verdict: "INSUFFICIENT",
      medianAngle: Number.NaN,
      meanAngle: Number.NaN,
      maxDeviation: Number.NaN,
      readings: [],
    };
  }

  const angles = witnesses.map((w) => subtendedAngle(w.point, chord));
  const med = median(angles);
  const mean = angles.reduce((a, b) => a + b, 0) / angles.length;

  const readings: SubtendedReading[] = witnesses.map((w, i) => ({
    witnessId: w.id,
    angle: angles[i]!,
    deviation: Math.abs(angles[i]! - med),
  }));

  const maxDeviation = readings.reduce((m, r) => (r.deviation > m ? r.deviation : m), 0);

  let verdict: LocusVerdict;
  if (maxDeviation <= thresholds.onLocus) verdict = "ON_LOCUS";
  else if (maxDeviation <= thresholds.drift) verdict = "DRIFT";
  else verdict = "OFF_LOCUS";

  return {
    verdict,
    medianAngle: med,
    meanAngle: mean,
    maxDeviation,
    readings,
  };
}

/**
 * Reduce a locus report to a Resonance-axis fraction in [0, 1].
 *  L = max(0, 1 − maxDeviation / driftThreshold)
 * INSUFFICIENT ⇒ L = 1 (no penalty when not enough data; gate at adapter).
 */
export function locusAxis(
  report: LocusReport,
  thresholds: LocusThresholds = DEFAULT_LOCUS_THRESHOLDS,
): number {
  if (report.verdict === "INSUFFICIENT") return 1;
  if (report.verdict === "OFF_LOCUS") {
    const t = 1 - report.maxDeviation / thresholds.drift;
    return Math.max(0, Math.min(1, t));
  }
  const t = 1 - report.maxDeviation / thresholds.drift;
  return Math.max(0, Math.min(1, t));
}

/**
 * Diameter convenience: build a chord that is the diameter of the unit circle
 * along the x-axis. Used by tests to verify that every point on the unit
 * circle subtends the diameter at exactly π/2 (Thales' classical theorem).
 */
export function unitDiameter(): Chord {
  return { a: { x: -1, y: 0 }, b: { x: 1, y: 0 } };
}
