/**
 * amaru.verify — run an Amaru fleet-coordination request through the
 * Ouroboros loop spine. Returns the receipt + the fleet signal.
 */
import { run, gaussForecast, type OuroborosReceipt } from "@workspace/ouroboros-loop";
import {
  lutarInvariant9,
  verifyLutarBoundN,
  type LutarAxes9,
  type LutarReportN,
} from "@workspace/ouroboros-invariant";
import { AmaruFleetMonitor, type AmaruFleetSignal, type AmaruMetricSample } from "./legacy.js";

export interface AmaruVerifyInput {
  /** The metric sample (dx, dy) to admit / refuse. */
  sample: AmaruMetricSample;
  /** Λ₉ axis scores in [0,1]. */
  axes: LutarAxes9;
  /** Optional historical residuals for Gauss-forecast short-circuit. */
  history?: ReadonlyArray<number>;
  /** Tolerance for Λ₉ admission (default 0.5). */
  lambdaThreshold?: number;
  /** Forecast tolerance for Gauss short-circuit (default 1.0). */
  forecastTolerance?: number;
}

export interface AmaruVerifyOutput {
  receipt: OuroborosReceipt<AmaruVerifyInput>;
  lutar: LutarReportN;
  signal: AmaruFleetSignal | null;
}

const SHARED_MONITOR = new AmaruFleetMonitor();

export function verify(input: AmaruVerifyInput): AmaruVerifyOutput {
  const lutar = lutarInvariant9(input.axes);
  const boundHolds = verifyLutarBoundN(lutar);
  const threshold = input.lambdaThreshold ?? 0.5;
  const lambdaAdmit = boundHolds && lutar.invariant >= threshold;

  // Λ-gate carries forward via mechanisms.lambdaGate
  const forecastTol = input.forecastTolerance ?? 1.0;
  const history = input.history ?? [];

  const receipt = run<AmaruVerifyInput>({
    payload: input,
    canonical: (x) =>
      `${x.sample.metricId}:${x.sample.horizontal}:${x.sample.vertical}:${lutar.invariant.toFixed(6)}`,
    transform: (x) => x,                          // 1-shot: state is canonical
    mechanisms: {
      lambdaGate: () => lambdaAdmit,
      fluxionsReceipt: (x) =>
        Number.isFinite(x.sample.horizontal) &&
        Number.isFinite(x.sample.vertical),       // bare-claim rejection
      forecast: history.length >= 2
        ? () => gaussForecast([...history], forecastTol)
        : undefined,
    },
    maxIter: 1,
  });

  let signal: AmaruFleetSignal | null = null;
  if (receipt.verdict === "ACCEPTED") {
    signal = SHARED_MONITOR.observe(input.sample);
  }
  return { receipt, lutar, signal };
}
