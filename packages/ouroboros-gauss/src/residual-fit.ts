/**
 * Gaussian Residual Goodness-of-Fit — Primitive 20.
 *
 * Source: Gauß Nachlass, Cod. Ms. Gauß, "Mathematik 35–47 —
 * Wahrscheinlichkeitsrechnung. Göttinger Professoren-Witwenkasse"
 * and Theoria motus corporum coelestium (1809), where Gauß first
 * derived the Gaussian distribution as the law of errors that justifies
 * least-squares.
 *
 * If observation residuals are produced by an honest measurement
 * pipeline, they should be (approximately) Gaussian-distributed with
 * mean zero. If they are NOT, an attacker is biasing them — e.g.
 * preferentially nudging witnesses to one side. We test residuals for
 * mean zero, sample variance, and skewness/kurtosis (Jarque–Bera-style
 * statistic).
 *
 * In Ouroboros: bolt this onto Primitive 17 (least-squares) to detect
 * adversarial residuals that fit the closure equation but are not
 * Gaussian. Catches the canonical attack of "wash-trading" witness
 * residuals to beat the closure check.
 */

export interface ResidualReport {
  readonly n: number;
  readonly mean: number;
  readonly sampleVariance: number;
  readonly skewness: number;
  readonly excessKurtosis: number;
  /** Jarque–Bera statistic JB = n/6 · (S² + (K−3)²/4). χ²(2)-distributed under H₀. */
  readonly jarqueBera: number;
  /** "GAUSSIAN" iff JB ≤ 5.99 (χ²(2) 95th percentile) and |mean| ≤ meanTolerance·σ. */
  readonly verdict: "GAUSSIAN" | "DRIFTING_MEAN" | "NON_GAUSSIAN" | "INSUFFICIENT";
}

export interface ResidualThresholds {
  /** χ²(2) critical value. Default 5.99 (5%). */
  readonly jbCritical: number;
  /** Allowed |mean|/σ. Default 0.5. */
  readonly meanTolerance: number;
}

const DEFAULT_THRESHOLDS: ResidualThresholds = {
  jbCritical: 5.99,
  meanTolerance: 0.5,
};

/**
 * Apply a Gaussian residual goodness-of-fit test to the residuals
 * produced by least-squares (or any other zero-mean estimator).
 *
 * Requires n ≥ 8 to compute the kurtosis term meaningfully.
 */
export function residualFit(
  residuals: ReadonlyArray<number>,
  thresholds: ResidualThresholds = DEFAULT_THRESHOLDS,
): ResidualReport {
  const n = residuals.length;
  if (n < 8) {
    return {
      n,
      mean: NaN,
      sampleVariance: NaN,
      skewness: NaN,
      excessKurtosis: NaN,
      jarqueBera: NaN,
      verdict: "INSUFFICIENT",
    };
  }
  for (const r of residuals) {
    if (!Number.isFinite(r)) {
      throw new Error("gauss.residualFit: residuals must be finite numbers");
    }
  }

  let mean = 0;
  for (const r of residuals) mean += r;
  mean /= n;

  let m2 = 0;
  let m3 = 0;
  let m4 = 0;
  for (const r of residuals) {
    const d = r - mean;
    const d2 = d * d;
    m2 += d2;
    m3 += d2 * d;
    m4 += d2 * d2;
  }
  m2 /= n;
  m3 /= n;
  m4 /= n;
  const sampleVariance = (n / (n - 1)) * m2;

  const sd = Math.sqrt(m2);
  const skewness = sd === 0 ? 0 : m3 / Math.pow(sd, 3);
  const kurtosis = sd === 0 ? 3 : m4 / (m2 * m2);
  const excessKurtosis = kurtosis - 3;

  const jb = (n / 6) * (skewness * skewness + (excessKurtosis * excessKurtosis) / 4);

  let verdict: ResidualReport["verdict"];
  const sigma = Math.sqrt(sampleVariance);
  if (sigma > 0 && Math.abs(mean) / sigma > thresholds.meanTolerance) {
    verdict = "DRIFTING_MEAN";
  } else if (jb > thresholds.jbCritical) {
    verdict = "NON_GAUSSIAN";
  } else {
    verdict = "GAUSSIAN";
  }

  return {
    n,
    mean,
    sampleVariance,
    skewness,
    excessKurtosis,
    jarqueBera: jb,
    verdict,
  };
}

/**
 * Reduce a residual-fit report to an axis fraction in [0, 1].
 *
 *   F_residual = max(0, 1 − JB / (2 · jbCritical))
 *
 * GAUSSIAN typically ⇒ value > 0.5; very high JB tends toward 0.
 * INSUFFICIENT ⇒ axis = 1 (no penalty).
 */
export function residualAxis(
  report: ResidualReport,
  thresholds: ResidualThresholds = DEFAULT_THRESHOLDS,
): number {
  if (report.verdict === "INSUFFICIENT") return 1;
  if (report.verdict === "DRIFTING_MEAN") {
    // mean drift kills this axis fast — a biased pipeline is not Gaussian.
    return 0;
  }
  const t = 1 - report.jarqueBera / (2 * thresholds.jbCritical);
  return Math.max(0, Math.min(1, t));
}
