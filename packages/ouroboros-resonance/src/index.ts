/**
 * @workspace/resonance — Tesla-physics-derived primitives for inter-loop
 * coupling.
 *
 * Five primitives:
 *   - Cadence (resonant frequency match)        f = 1/(2π√(LC))
 *   - Impedance (reflection / power transfer)   Z = √(L/C),  Γ = (Z₂−Z₁)/(Z₂+Z₁)
 *   - Q-factor (quality / loss budget)          Q = ωL/R
 *   - Kuramoto (multi-agent phase coherence)    dθ/dt = ω + (K/N)Σ sin(θj−θi)
 *   - Peak-vs-RMS (alerting correctness)        E_rms = 0.7071·E_peak
 *
 * Companion to @workspace/horizon (black-hole-physics primitives).
 * Together they govern the loop's lifetime AND the loop-to-loop handoff.
 */

export {
  measureCadence,
  checkCadenceMatch,
  predictedResonantFrequency,
  beatFrequency,
  frequencyToBitsPerTick,
  type CadenceObservation,
  type CadenceReading,
  type CadenceMatchConfig,
  type CadenceMatchResult,
} from "./cadence.js";

export {
  computeImpedance,
  reflectionCoefficient,
  impedanceVerdict,
  type ImpedanceProfile,
  type ImpedanceReading,
  type ReflectionResult,
  type ImpedanceGuardConfig,
  type ImpedanceVerdict,
} from "./impedance.js";

export {
  computeQFactor,
  QFactorHistory,
  type QInputs,
  type QReading,
  type QVerdict,
  type QBudgetConfig,
} from "./q-factor.js";

export {
  orderParameter,
  stepKuramoto,
  runKuramoto,
  classifyCoherence,
  decoherenceWindowLength,
  wrap,
  type KuramotoOscillator,
  type KuramotoState,
  type CoherenceVerdict,
  type CoherenceConfig,
} from "./kuramoto.js";

export {
  seriesStats,
  AlertRuleRegistry,
  SINUSOID_RMS_TO_PEAK,
  type SeriesStats,
  type Aggregator,
  type InvariantClass,
  type AlertRule,
} from "./peak-rms.js";
