/**
 * Sentra Gauss multi-sensor fusion.
 *
 * In a cyber-resilience deployment we typically have N independent
 * sensors each reporting a noisy linear functional of the unknown
 * threat-state vector x ∈ ℝᵏ:
 *
 *     y_i = a_iᵀ · x + ε_i,    ε_i ~ N(0, σ_i²)
 *
 * We use Gauss' least-squares method (Theoria combinationis observationum
 * erroribus minimis obnoxiae, 1823) to fuse them into a maximum-likelihood
 * estimate x̂ and report:
 *
 *   - the per-sensor residual r_i = a_iᵀ x̂ − y_i
 *   - the closure norm ‖r‖₂  (Gauß-closure G ∈ [0, 1] after sigmoid)
 *   - the residual goodness-of-fit χ² / dof  → fusionAxis ∈ [0, 1]
 *   - the residualGate verdict ACCEPT / DROP_SENSOR / REJECT_FUSION
 *
 * This is a thin, purpose-built wrapper over @workspace/ouroboros-gauss
 * `leastSquares` that surfaces the *forensic* signal (worst-sensor index,
 * goodness-of-fit) Sentra needs to issue tamper-evident receipts.
 */
import { leastSquares, type LeastSquaresReport } from "@workspace/ouroboros-gauss";

export interface SensorObservation {
  /** Sensor identifier (e.g. "siem-1", "edr-east", "honeypot-3"). */
  readonly id: string;
  /** Linear functional a_i (row of design matrix). */
  readonly weights: ReadonlyArray<number>;
  /** Observed value y_i. */
  readonly value: number;
  /** 1-sigma noise estimate (default 1.0). */
  readonly sigma?: number;
}

export type FusionVerdict =
  | "ACCEPT"
  | "DROP_SENSOR"
  | "REJECT_FUSION_DIVERGENT";

export interface FusionReport {
  /** Maximum-likelihood threat state x̂. */
  readonly state: ReadonlyArray<number>;
  /** Closure norm ||r||₂ — total disagreement. */
  readonly residualNorm: number;
  /** Worst single-sensor |r_i|. */
  readonly maxResidual: number;
  /** Index of worst sensor in input array (or -1 if no sensors). */
  readonly worstSensorIndex: number;
  /** Worst sensor's id. */
  readonly worstSensorId: string | null;
  /** Goodness-of-fit χ² / dof.  ≈ 1 = expected noise, ≫ 1 = poor fit. */
  readonly chiSqPerDof: number;
  /** Gauß-closure axis in [0, 1]: 1 = perfect closure, 0 = divergent. */
  readonly fusionAxis: number;
  /** Operational verdict. */
  readonly verdict: FusionVerdict;
  /** Raw report for replay. */
  readonly raw: LeastSquaresReport;
}

export interface FusionThresholds {
  /** Drop-sensor threshold on |r_i| / σ_i.  Default 3.0 (3σ). */
  readonly dropZ?: number;
  /** Reject-fusion threshold on χ²/dof.  Default 5.0. */
  readonly rejectChiSq?: number;
}

/**
 * Fuse a sensor bundle into a maximum-likelihood threat state.
 * Throws on degenerate input (fewer sensors than unknowns, ragged rows).
 */
export function fuseSensors(
  observations: ReadonlyArray<SensorObservation>,
  thresholds: FusionThresholds = {},
): FusionReport {
  if (observations.length === 0) {
    throw new Error("sentra.fuseSensors: empty observation bundle");
  }
  const k = observations[0]!.weights.length;
  for (const o of observations) {
    if (o.weights.length !== k) {
      throw new Error(
        `sentra.fuseSensors: sensor ${o.id} has ${o.weights.length} weights, expected ${k}`,
      );
    }
  }
  // Inverse-variance scaling: each row i is multiplied by 1/σ_i
  const A: number[][] = [];
  const b: number[] = [];
  for (const o of observations) {
    const s = o.sigma ?? 1.0;
    if (!(s > 0)) throw new Error(`sentra.fuseSensors: sensor ${o.id} sigma must be > 0`);
    A.push(o.weights.map((w) => w / s));
    b.push(o.value / s);
  }
  const raw = leastSquares({ A, b });
  // Identify worst sensor in absolute terms
  let worstIdx = -1;
  let worstAbs = -Infinity;
  for (let i = 0; i < raw.residuals.length; i++) {
    const a = Math.abs(raw.residuals[i]!);
    if (a > worstAbs) {
      worstAbs = a;
      worstIdx = i;
    }
  }
  const dof = Math.max(1, raw.m - raw.n);
  const chiSq = raw.residuals.reduce((s, r) => s + r * r, 0);
  const chiSqPerDof = chiSq / dof;
  // Goodness-of-fit → axis in [0,1]: 1/(1+χ²/dof) is monotone-decreasing.
  const fusionAxis = 1 / (1 + chiSqPerDof);

  const dropZ = thresholds.dropZ ?? 3.0;
  const rejectChiSq = thresholds.rejectChiSq ?? 5.0;
  let verdict: FusionVerdict = "ACCEPT";
  if (chiSqPerDof > rejectChiSq) verdict = "REJECT_FUSION_DIVERGENT";
  else if (worstAbs > dropZ) verdict = "DROP_SENSOR";

  const worstSensorId = worstIdx >= 0 ? observations[worstIdx]!.id : null;
  return {
    state: raw.solution,
    residualNorm: raw.residualNorm,
    maxResidual: worstAbs === -Infinity ? 0 : worstAbs,
    worstSensorIndex: worstIdx,
    worstSensorId,
    chiSqPerDof,
    fusionAxis,
    verdict,
    raw,
  };
}
