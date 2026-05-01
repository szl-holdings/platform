/**
 * Gauß Conformal Projection — Primitive 18.
 *
 * Source: Gauß Nachlass, Cod. Ms. Gauß, "Geodäsie 179–184 — Konforme
 * Projektion" (the manuscripts Gauß used to derive what became the
 * Gauß–Krüger projection); foundation laid in Gauß's 1825 prize essay
 * "Allgemeine Auflösung der Aufgabe: die Theile einer gegebnen Fläche
 * auf einer andern gegebnen Fläche so abzubilden, dass die Abbildung
 * dem Abgebildeten in den kleinsten Theilen ähnlich wird".
 *
 * A map between two surfaces is conformal iff it preserves angles
 * locally. Equivalently, its Jacobian J at every point is a similarity
 * transformation: a uniform scaling composed with a rotation. Two
 * algebraic conditions are equivalent and easy to check:
 *
 *  (i)  Cauchy–Riemann form: ∂u/∂x = ∂v/∂y and ∂u/∂y = −∂v/∂x.
 *  (ii) JᵀJ is a positive scalar multiple of the identity.
 *
 * In Ouroboros: a representation change between two trust spaces is
 * trustworthy if it is conformal — angles, and therefore the Thales
 * inscribed-angle locus, survive the change. A conformal-defect axis
 * P ∈ [0, 1] reports how close a sampled handoff transformation is to
 * conformality.
 *
 * This is what bonds Thales's primitive 16 to a real protocol step:
 * verify each transform is conformal before allowing the locus check
 * to carry its weight.
 */

export interface Jacobian2x2 {
  /** ∂u/∂x */
  readonly dudx: number;
  /** ∂u/∂y */
  readonly dudy: number;
  /** ∂v/∂x */
  readonly dvdx: number;
  /** ∂v/∂y */
  readonly dvdy: number;
}

export type ConformalVerdict = "CONFORMAL" | "NEAR_CONFORMAL" | "NON_CONFORMAL" | "DEGENERATE";

export interface ConformalReading {
  /** Cauchy–Riemann residual r1 = ∂u/∂x − ∂v/∂y. */
  readonly cr1: number;
  /** Cauchy–Riemann residual r2 = ∂u/∂y + ∂v/∂x. */
  readonly cr2: number;
  /** Conformal defect = sqrt(r1² + r2²) / scale, dimensionless. */
  readonly conformalDefect: number;
  /** Local scale factor — geometric mean of the singular values of J. */
  readonly scaleFactor: number;
  /** Determinant of J. Positive ⇒ orientation-preserving. */
  readonly determinant: number;
  readonly verdict: ConformalVerdict;
}

export interface ConformalThresholds {
  readonly conformal: number; // ≤ this defect ⇒ CONFORMAL. Default 1e-6.
  readonly near: number;      // ≤ this defect ⇒ NEAR_CONFORMAL. Default 0.05.
}

const DEFAULT_THRESHOLDS: ConformalThresholds = {
  conformal: 1e-6,
  near: 0.05,
};

/**
 * Test a 2×2 Jacobian for conformality. Returns the Cauchy–Riemann
 * residuals, the local scale, and a verdict.
 */
export function checkConformal(
  J: Jacobian2x2,
  thresholds: ConformalThresholds = DEFAULT_THRESHOLDS,
): ConformalReading {
  const { dudx, dudy, dvdx, dvdy } = J;
  for (const v of [dudx, dudy, dvdx, dvdy]) {
    if (!Number.isFinite(v)) {
      throw new Error("gauss.checkConformal: Jacobian must contain finite numbers");
    }
  }

  const cr1 = dudx - dvdy;
  const cr2 = dudy + dvdx;
  const det = dudx * dvdy - dudy * dvdx;

  // Singular values via 2×2 closed form.
  const a = dudx * dudx + dudy * dudy + dvdx * dvdx + dvdy * dvdy;
  const b = Math.abs(det);
  const sumSq = Math.max(0, a);
  const diff = Math.sqrt(Math.max(0, sumSq * sumSq / 4 - b * b));
  const sigma1Sq = sumSq / 2 + diff;
  const sigma2Sq = Math.max(0, sumSq / 2 - diff);
  const sigma1 = Math.sqrt(sigma1Sq);
  const sigma2 = Math.sqrt(sigma2Sq);
  const scale = Math.sqrt(sigma1 * sigma2);

  let verdict: ConformalVerdict;
  let conformalDefect: number;
  if (scale === 0) {
    verdict = "DEGENERATE";
    conformalDefect = Number.POSITIVE_INFINITY;
    return { cr1, cr2, conformalDefect, scaleFactor: 0, determinant: det, verdict };
  }
  conformalDefect = Math.sqrt(cr1 * cr1 + cr2 * cr2) / scale;

  if (conformalDefect <= thresholds.conformal) verdict = "CONFORMAL";
  else if (conformalDefect <= thresholds.near) verdict = "NEAR_CONFORMAL";
  else verdict = "NON_CONFORMAL";

  return { cr1, cr2, conformalDefect, scaleFactor: scale, determinant: det, verdict };
}

/**
 * Reduce a conformal reading to an axis fraction in [0, 1].
 *  P = max(0, 1 − defect / nearThreshold)
 * DEGENERATE ⇒ P = 0.
 */
export function conformalAxis(
  reading: ConformalReading,
  thresholds: ConformalThresholds = DEFAULT_THRESHOLDS,
): number {
  if (reading.verdict === "DEGENERATE") return 0;
  const t = 1 - reading.conformalDefect / thresholds.near;
  return Math.max(0, Math.min(1, t));
}

/**
 * Numerically estimate the Jacobian of a vector field f: R² → R²
 * at point (x, y) by central differences with step h.
 */
export function estimateJacobian(
  f: (x: number, y: number) => readonly [number, number],
  x: number,
  y: number,
  h = 1e-6,
): Jacobian2x2 {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(h) || h <= 0) {
    throw new Error("gauss.estimateJacobian: x, y, h must be finite and h > 0");
  }
  const [u_xp, v_xp] = f(x + h, y);
  const [u_xm, v_xm] = f(x - h, y);
  const [u_yp, v_yp] = f(x, y + h);
  const [u_ym, v_ym] = f(x, y - h);
  return {
    dudx: (u_xp - u_xm) / (2 * h),
    dudy: (u_yp - u_ym) / (2 * h),
    dvdx: (v_xp - v_xm) / (2 * h),
    dvdy: (v_yp - v_ym) / (2 * h),
  };
}
