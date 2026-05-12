/**
 * sentra.verify — run a Sentra cyber-resilience event through the Ouroboros
 * spine. Returns the receipt, the Λ₉ report, the Gauss fusion report, and
 * the defender Kuramoto score.
 *
 * Λ-gate (admission) is computed on the standard 9 axes; sentra plugs the
 * Gauss `fusionAxis` (goodness-of-fit) directly into the `gaussClosure` axis
 * so the gate is *informed by* the multi-sensor fusion — the spine is no
 * longer guessing.
 */
import { run, gaussForecast, type OuroborosReceipt } from "@workspace/ouroboros-loop";
import {
  lutarInvariant9,
  verifyLutarBoundN,
  type LutarAxes9,
  type LutarReportN,
} from "@workspace/ouroboros-invariant";
import {
  fuseSensors,
  type FusionReport,
  type SensorObservation,
  type FusionThresholds,
} from "./gauss-fusion.js";
import {
  scoreDefenders,
  type DefenderReading,
  type DefenderScore,
} from "./kuramoto-defender.js";

export interface SentraEvent {
  /** Stable event id (e.g. "evt-2026-05-11-3a8c"). */
  readonly id: string;
  /** Severity in [0, 1]. */
  readonly severity: number;
  /** Timestamp (seconds since epoch). */
  readonly timestamp: number;
}

export interface SentraVerifyInput {
  /** The threat event to admit / refuse. */
  readonly event: SentraEvent;
  /** Multi-sensor observation bundle (Gauss fusion). */
  readonly sensors: ReadonlyArray<SensorObservation>;
  /** Defender ensemble readings (Kuramoto coherence). */
  readonly defenders: ReadonlyArray<DefenderReading>;
  /** Partial Λ₉ axes; sentra populates `gaussClosure` from fusion. */
  readonly axes: Omit<LutarAxes9, "gaussClosure"> & { gaussClosure?: number };
  /** Optional historical residuals for Gauss-forecast short-circuit. */
  readonly history?: ReadonlyArray<number>;
  /** Tolerance for Λ₉ admission (default 0.5). */
  readonly lambdaThreshold?: number;
  /** Forecast tolerance for Gauss short-circuit (default 1.0). */
  readonly forecastTolerance?: number;
  /** Fusion thresholds (drop-Z, reject-χ²). */
  readonly fusionThresholds?: FusionThresholds;
}

export interface SentraVerifyOutput {
  readonly receipt: OuroborosReceipt<SentraVerifyInput>;
  readonly lutar: LutarReportN;
  readonly fusion: FusionReport;
  readonly defenderScore: DefenderScore;
  /** Final admit decision: ACCEPTED ⇒ true. */
  readonly admitted: boolean;
}

export function verify(input: SentraVerifyInput): SentraVerifyOutput {
  // --- 1. Gauss multi-sensor fusion ---------------------------------------
  const fusion = fuseSensors(input.sensors, input.fusionThresholds);

  // --- 2. Defender Kuramoto coherence -------------------------------------
  const defenderScore = scoreDefenders(input.defenders);

  // --- 3. Compose Λ₉ axes: gaussClosure ← fusion goodness-of-fit ---------
  const axes: LutarAxes9 = {
    ...input.axes,
    gaussClosure: input.axes.gaussClosure ?? fusion.fusionAxis,
  };
  const lutar = lutarInvariant9(axes);
  const boundHolds = verifyLutarBoundN(lutar);
  const threshold = input.lambdaThreshold ?? 0.5;
  const lambdaAdmit = boundHolds && lutar.invariant >= threshold;

  const forecastTol = input.forecastTolerance ?? 1.0;
  const history = input.history ?? [];

  // --- 4. Spine: run loop with mechanisms ---------------------------------
  const receipt = run<SentraVerifyInput>({
    payload: input,
    canonical: (x) =>
      `${x.event.id}:${x.event.severity.toFixed(6)}:${lutar.invariant.toFixed(6)}:${fusion.fusionAxis.toFixed(6)}`,
    transform: (x) => x,
    mechanisms: {
      lambdaGate: () => lambdaAdmit,
      fluxionsReceipt: (x) =>
        Number.isFinite(x.event.severity) &&
        x.event.severity >= 0 &&
        x.event.severity <= 1,
      bekensteinCheck: () => fusion.verdict !== "REJECT_FUSION_DIVERGENT",
      forecast: history.length >= 2
        ? () => {
            const f = gaussForecast([...history], forecastTol);
            return { predictedResidual: f.predictedResidual, tolerance: f.tolerance };
          }
        : undefined,
    },
    maxIter: 1,
  });

  return {
    receipt,
    lutar,
    fusion,
    defenderScore,
    admitted: receipt.verdict === "ACCEPTED",
  };
}
