/**
 * Montanari concentration bounds for gauge-state covariance.
 *
 * Source: Stanford Montanari — *High-Dimensional Statistics, Part A*
 * (Synthesis dossier row 8, Substance primitive).
 *
 * Promotes the sub-Gaussian covariance concentration result
 *
 *     ‖Σ̂ − Σ‖₂ ≤ C · σ² · (√(d/n) + t/√n)        w.p. ≥ 1 − 2 e^{−t²/2}
 *
 * into a runtime guard the platform can use to decide when the empirical
 * covariance of a gauge-state window is trustworthy. The shim exposes the
 * empirical estimate, the (operator-norm-bounded) deviation, and the
 * Montanari upper bound at a caller-chosen confidence level.
 *
 * The bound is intentionally conservative — the platform constant `C` is
 * a literature-standard 4 (Vershynin, Thm 4.6.1 / Montanari Part A §5).
 * Downstream callers should treat the bound as a sufficient condition for
 * stability, not as a tight estimate.
 */

export type Vector = readonly number[];
export type Matrix = readonly (readonly number[])[];

/** Sub-Gaussian universal constant used by the Montanari bound. */
export const MONTANARI_CONSTANT = 4 as const;

/**
 * Sample mean of a list of d-dimensional vectors. Throws on empty input
 * or ragged rows — silent fallbacks would hide upstream bugs.
 */
export function sampleMean(samples: readonly Vector[]): number[] {
  if (samples.length === 0) {
    throw new Error('sampleMean: at least one sample required');
  }
  const d = samples[0]!.length;
  const out = new Array<number>(d).fill(0);
  for (const s of samples) {
    if (s.length !== d) throw new Error('sampleMean: ragged sample dimensions');
    for (let j = 0; j < d; j++) out[j]! += s[j]!;
  }
  for (let j = 0; j < d; j++) out[j]! /= samples.length;
  return out;
}

/**
 * Empirical covariance Σ̂ = 1/n Σ (x_k − μ)(x_k − μ)ᵀ.
 * Uses the population (1/n) normalisation that matches the Montanari
 * statement; pass `unbiased: true` for the Bessel-corrected (1/(n−1)) form
 * when feeding statistical tests instead of the bound.
 */
export function empiricalCovariance(
  samples: readonly Vector[],
  opts: { readonly unbiased?: boolean } = {},
): number[][] {
  const n = samples.length;
  if (n === 0) throw new Error('empiricalCovariance: at least one sample required');
  const mu = sampleMean(samples);
  const d = mu.length;
  const cov: number[][] = Array.from({ length: d }, () => new Array<number>(d).fill(0));
  for (const s of samples) {
    for (let i = 0; i < d; i++) {
      const di = s[i]! - mu[i]!;
      for (let j = i; j < d; j++) {
        cov[i]![j]! += di * (s[j]! - mu[j]!);
      }
    }
  }
  const denom = opts.unbiased ? Math.max(n - 1, 1) : n;
  for (let i = 0; i < d; i++) {
    for (let j = i; j < d; j++) {
      cov[i]![j]! /= denom;
      cov[j]![i] = cov[i]![j]!;
    }
  }
  return cov;
}

/**
 * Symmetric operator-norm (largest singular value) via power iteration on
 * `Mᵀ M`. Suitable for the small (≤ 64-dimensional) covariance matrices
 * the platform produces; SVD-backed replacement is filed as a follow-up
 * alongside the `null-space` SVD upgrade.
 */
export function operatorNorm(M: Matrix, iters = 64): number {
  const n = M.length;
  if (n === 0) return 0;
  const d = M[0]!.length;
  if (d === 0) return 0;
  let v = new Array<number>(d).fill(0).map((_, i) => Math.sin(i + 1));
  let norm = Math.hypot(...v);
  if (norm === 0) { v[0] = 1; norm = 1; }
  for (let i = 0; i < d; i++) v[i]! /= norm;

  for (let k = 0; k < iters; k++) {
    const Mv = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++) {
      let s = 0;
      const row = M[i]!;
      for (let j = 0; j < d; j++) s += row[j]! * v[j]!;
      Mv[i] = s;
    }
    const MtMv = new Array<number>(d).fill(0);
    for (let j = 0; j < d; j++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += M[i]![j]! * Mv[i]!;
      MtMv[j] = s;
    }
    let nrm = Math.hypot(...MtMv);
    if (nrm === 0) return 0;
    for (let j = 0; j < d; j++) MtMv[j]! /= nrm;
    v = MtMv;
  }
  // Rayleigh quotient ‖M v‖.
  let s = 0;
  for (let i = 0; i < n; i++) {
    let t = 0;
    const row = M[i]!;
    for (let j = 0; j < d; j++) t += row[j]! * v[j]!;
    s += t * t;
  }
  return Math.sqrt(s);
}

export interface ConcentrationBound {
  readonly bound: number;
  readonly delta: number;        // failure probability ≤ delta
  readonly n: number;
  readonly d: number;
  readonly sigma: number;
}

/**
 * Montanari Σ̂-vs-Σ operator-norm bound.
 *
 *     B(n, d, σ, δ) = C · σ² · (√(d/n) + √(2 ln(2/δ))/√n)
 *
 * `sigma` is the sub-Gaussian proxy for the per-coordinate noise.
 */
export function montanariCovarianceBound(args: {
  readonly n: number;
  readonly d: number;
  readonly sigma: number;
  readonly delta: number; // ∈ (0, 1)
}): ConcentrationBound {
  const { n, d, sigma, delta } = args;
  if (n <= 0) throw new Error('montanariCovarianceBound: n must be positive');
  if (d <= 0) throw new Error('montanariCovarianceBound: d must be positive');
  if (sigma < 0) throw new Error('montanariCovarianceBound: sigma must be ≥ 0');
  if (!(delta > 0 && delta < 1)) {
    throw new Error('montanariCovarianceBound: delta must be in (0, 1)');
  }
  const t = Math.sqrt(2 * Math.log(2 / delta));
  const bound = MONTANARI_CONSTANT * sigma * sigma * (Math.sqrt(d / n) + t / Math.sqrt(n));
  return { bound, delta, n, d, sigma };
}

/**
 * Deviation report: empirical-vs-true operator-norm deviation alongside the
 * theoretical bound. `withinBound` is the runtime guard the platform uses to
 * decide if a gauge-state window is in the concentration regime.
 */
export interface CovarianceDeviation extends ConcentrationBound {
  readonly empiricalDeviation: number;
  readonly withinBound: boolean;
}

function matSub(A: Matrix, B: Matrix): number[][] {
  return A.map((row, i) => row.map((v, j) => v - B[i]![j]!));
}

export function covarianceDeviation(args: {
  readonly samples: readonly Vector[];
  readonly trueCovariance: Matrix;
  readonly sigma: number;
  readonly delta: number;
}): CovarianceDeviation {
  const sigmaHat = empiricalCovariance(args.samples);
  const diff = matSub(sigmaHat, args.trueCovariance);
  const empiricalDeviation = operatorNorm(diff);
  const bound = montanariCovarianceBound({
    n: args.samples.length,
    d: args.trueCovariance.length,
    sigma: args.sigma,
    delta: args.delta,
  });
  return {
    ...bound,
    empiricalDeviation,
    withinBound: empiricalDeviation <= bound.bound,
  };
}
