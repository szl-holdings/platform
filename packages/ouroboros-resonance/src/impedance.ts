/**
 * R2. Impedance-Matched Handoff — primitive #2 of Resonance.
 *
 * BACKGROUND
 * ----------
 * Tesla's characteristic impedance:
 *
 *     Z = √(L / C)
 *
 * Maximum power transfer between source and load occurs when their
 * impedances match. Mismatch produces a reflection coefficient:
 *
 *     Γ = (Z_load − Z_source) / (Z_load + Z_source)
 *
 * |Γ| = 0 is perfect match; |Γ| = 1 is total reflection.
 *
 * Reference: Pozar, *Microwave Engineering*, ch. 2.
 *
 * COMPUTATIONAL ANALOG
 * --------------------
 * Every loop has an inductance-analog L (boundary-cardinality squared,
 * representing the work-in-flight inertia of the boundary) and a
 * capacitance-analog C (state-cardinality, representing how much
 * persistent state the loop holds). The characteristic impedance is
 * Z = √(L/C), measured in the dimensionless runtime unit "loop-ohms."
 *
 * When loop A hands work to loop B, the reflection coefficient
 *
 *     Γ = (Z_B − Z_A) / (Z_B + Z_A)
 *
 * tells us how much of the work bounces back as retries, validation
 * failures, or mid-handoff state corruption.
 */

export interface ImpedanceProfile {
  /** Boundary cardinality (number of distinct integration points). >= 0 */
  readonly boundaryCardinality: number;
  /** State cardinality (number of distinct distinguishable internal states). >= 1 */
  readonly stateCardinality: number;
}

export interface ImpedanceReading {
  /** Z = √(L/C) where L = b² and C = s, in dimensionless loop-ohms. */
  readonly impedance: number;
  readonly L: number;
  readonly C: number;
}

/**
 * Compute the characteristic impedance Z = √(L/C) of a loop.
 *
 * L = boundaryCardinality²    (boundary "inertia" scales quadratically)
 * C = max(1, stateCardinality)
 */
export function computeImpedance(profile: ImpedanceProfile): ImpedanceReading {
  const L = Math.max(0, profile.boundaryCardinality) ** 2;
  const C = Math.max(1, profile.stateCardinality);
  const Z = Math.sqrt(L / C);
  return { impedance: Z, L, C };
}

export interface ReflectionResult {
  /** Reflection coefficient Γ ∈ [−1, +1]. */
  readonly gamma: number;
  /** |Γ| (always non-negative). */
  readonly magnitude: number;
  /** Power transfer efficiency η = 1 − |Γ|². */
  readonly efficiency: number;
  /** VSWR = (1 + |Γ|)/(1 − |Γ|). Approaches ∞ at total reflection. */
  readonly vswr: number;
}

/**
 * Reflection coefficient for a handoff source → load.
 *
 *     Γ = (Z_load − Z_source) / (Z_load + Z_source)
 */
export function reflectionCoefficient(
  source: ImpedanceReading,
  load: ImpedanceReading,
): ReflectionResult {
  const denom = load.impedance + source.impedance;
  if (denom <= 0) {
    return { gamma: 0, magnitude: 0, efficiency: 1, vswr: 1 };
  }
  const gamma = (load.impedance - source.impedance) / denom;
  const magnitude = Math.abs(gamma);
  const efficiency = 1 - magnitude * magnitude;
  const vswr =
    magnitude < 1 ? (1 + magnitude) / (1 - magnitude) : Infinity;
  return { gamma, magnitude, efficiency, vswr };
}

export interface ImpedanceGuardConfig {
  /** Warn when |Γ| exceeds this. Default 0.2. */
  readonly warnAtMagnitude?: number;
  /** Hard deny when |Γ| exceeds this. Default 0.5. */
  readonly denyAtMagnitude?: number;
}

export type ImpedanceVerdict = "MATCHED" | "WARN" | "DENY";

/**
 * Apply guard thresholds to a reflection result.
 */
export function impedanceVerdict(
  refl: ReflectionResult,
  cfg: ImpedanceGuardConfig = {},
): ImpedanceVerdict {
  const warn = cfg.warnAtMagnitude ?? 0.2;
  const deny = cfg.denyAtMagnitude ?? 0.5;
  if (refl.magnitude >= deny) return "DENY";
  if (refl.magnitude >= warn) return "WARN";
  return "MATCHED";
}
