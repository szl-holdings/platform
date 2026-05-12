import { createHash } from "node:crypto";
import type { OuroborosInput, OuroborosReceipt, Verdict } from "./types.js";

/**
 * Run the Ouroboros closure operator.
 * Iterates transform() until fixed-point, refusal, or max-iter.
 */
export function run<T>(input: OuroborosInput<T>): OuroborosReceipt<T> {
  const { payload, canonical, transform, mechanisms = {}, maxIter = 16 } = input;
  const trace: { iter: number; hash: string }[] = [];
  let x = payload;
  let lastHash = canonical(x);
  trace.push({ iter: 0, hash: lastHash });

  if (mechanisms.lambdaGate && !mechanisms.lambdaGate(x)) {
    return finish("REFUSED_LAMBDA_GATE", x, trace, false, "Λ gate refused input");
  }
  if (mechanisms.fluxionsReceipt && !mechanisms.fluxionsReceipt(x)) {
    return finish("REFUSED_FLUXIONS_BARE_CLAIM", x, trace, false, "Newton fluxions-receipt: bare claim");
  }
  if (mechanisms.bekensteinCheck && !mechanisms.bekensteinCheck(x)) {
    return finish("REFUSED_BEKENSTEIN_OVERFLOW", x, trace, false, "Bekenstein bound exceeded");
  }

  let witnessInfo: OuroborosReceipt<T>["witnessDiversity"];
  if (mechanisms.witnessDiversity) {
    const w = mechanisms.witnessDiversity(x);
    const admitted = w.axis >= w.threshold;
    witnessInfo = {
      axis: w.axis,
      threshold: w.threshold,
      admitted,
      discriminant: w.discriminant,
      classNumber: w.classNumber,
    };
    if (!admitted) {
      const r = finish(
        "REFUSED_WITNESS_DIVERSITY",
        x,
        trace,
        false,
        `Gauss class-number axis ${w.axis.toFixed(3)} < threshold ${w.threshold.toFixed(3)}`,
      );
      r.witnessDiversity = witnessInfo;
      return r;
    }
  }

  const distHistory: number[] = [];
  let forecastInfo: OuroborosReceipt<T>["forecast"];

  for (let i = 1; i <= maxIter; i++) {
    const nextX = transform(x);
    const nextHash = canonical(nextX);
    trace.push({ iter: i, hash: nextHash });
    const dist = hammingHex(nextHash, lastHash);
    distHistory.push(dist);

    if (mechanisms.forecast && distHistory.length >= 2) {
      const f = mechanisms.forecast(distHistory);
      forecastInfo = { predictedResidual: f.predictedResidual, tolerance: f.tolerance, admitted: f.predictedResidual <= f.tolerance };
      if (f.predictedResidual > f.tolerance) {
        const r = finish("REFUSED_FORECAST_DIVERGENT", nextX, trace, false,
          `Gauss-forecast predicts residual ${f.predictedResidual.toFixed(3)} > tol ${f.tolerance}`);
        r.forecast = forecastInfo;
        return r;
      }
    }
    if (nextHash === lastHash) {
      if (mechanisms.dualWitness) {
        const dw = mechanisms.dualWitness(nextX);
        if (!dw.match) {
          const r = finish("REFUSED_DUAL_WITNESS_DIVERGE", nextX, trace, true, "Dual-witness providers diverged");
          r.forecast = forecastInfo;
          r.witnessDiversity = witnessInfo;
          return r;
        }
      }
      const r = finish("ACCEPTED", nextX, trace, true, null);
      r.forecast = forecastInfo;
      r.witnessDiversity = witnessInfo;
      return r;
    }
    x = nextX;
    lastHash = nextHash;
  }
  const r = finish("MAX_ITER_NO_FIXED_POINT", x, trace, false, `No fixed point in ${maxIter} iterations`);
  r.forecast = forecastInfo;
  r.witnessDiversity = witnessInfo;
  return r;
}

function hammingHex(a: string, b: string): number {
  let d = 0;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if ((a[i] ?? "") !== (b[i] ?? "")) d++;
  }
  return d;
}

function finish<T>(
  verdict: Verdict,
  finalValue: T | null,
  trace: { iter: number; hash: string }[],
  fixedPoint: boolean,
  refusalReason: string | null,
): OuroborosReceipt<T> {
  const receiptDigest = createHash("sha256").update(JSON.stringify(trace)).digest("hex");
  return {
    verdict,
    iterations: trace.length - 1,
    fixedPoint,
    finalHash: trace[trace.length - 1].hash,
    finalValue,
    trace,
    refusalReason,
    receiptDigest,
  };
}

/** Compact summary line for logs. */
export function summary<T>(r: OuroborosReceipt<T>): string {
  return `${r.verdict.padEnd(34)} iter=${String(r.iterations).padStart(2)} fp=${r.fixedPoint ? "Y" : "N"} digest=${r.receiptDigest.slice(0, 12)}`;
}
