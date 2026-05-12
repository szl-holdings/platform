/**
 * 9-Axis Evaluator — produces LutarAxes9 from content signals.
 *
 * This module defines the interface contract for axis evaluation and
 * provides a default evaluator that maps content characteristics to
 * the 9 Lutar Invariant axes. Each axis score is in [0,1].
 *
 * The evaluator is intentionally dependency-free on the philosopher
 * packages at this layer. The actual axis-scoring logic that calls
 * into Blanca, Oppenheimer, Socrates, Lara, Gauss, etc. lives in
 * @workspace/ouroboros-integrations/lambda-engine, which imports
 * this interface and feeds computed scores into lutarInvariant9().
 *
 * Axes:
 *   C — Cleanliness   (cryptographic witness verification)
 *   H — Horizon       (Page-curve bounded reversibility)
 *   R — Resonance     (Q-factor / Landauer ceiling)
 *   F — Frustum       (three-witness Jaccard reconciliation)
 *   G — Gauss closure (least-squares network adjustment)
 *   I — Invariance    (Blanca: Lorentz / equivalence / EPR)
 *   M — Moral         (Oppenheimer accountability ledger)
 *   B — Being         (Socrates divided-line ontic grounding)
 *   N — Non-measurability (Lara: Jamneshan-Shalom-Tao gap)
 */

import type { LutarAxes9, LutarReportN } from "./lutar-invariant-9.js";
import { lutarInvariant9 } from "./lutar-invariant-9.js";

export interface AxisEvaluatorInput {
  cleanliness: number;
  horizon: number;
  resonance: number;
  frustum: number;
  gaussClosure: number;
  invariance: number;
  moralGrounding: number;
  ontologicalGrounding: number;
  measurabilityHonesty: number;
}

export interface AxisEvaluatorReport {
  axes: LutarAxes9;
  lambda: LutarReportN;
  timestamp: string;
  axisProvenance: Record<string, string>;
}

export function evaluateAxes9(input: AxisEvaluatorInput): AxisEvaluatorReport {
  const axes: LutarAxes9 = {
    cleanliness: clamp01(input.cleanliness),
    horizon: clamp01(input.horizon),
    resonance: clamp01(input.resonance),
    frustum: clamp01(input.frustum),
    gaussClosure: clamp01(input.gaussClosure),
    invariance: clamp01(input.invariance),
    moralGrounding: clamp01(input.moralGrounding),
    ontologicalGrounding: clamp01(input.ontologicalGrounding),
    measurabilityHonesty: clamp01(input.measurabilityHonesty),
  };

  const lambda = lutarInvariant9(axes);

  return {
    axes,
    lambda,
    timestamp: new Date().toISOString(),
    axisProvenance: {
      cleanliness: "@workspace/ouroboros-anchor",
      horizon: "@workspace/ouroboros-horizon",
      resonance: "@workspace/ouroboros-resonance",
      frustum: "@workspace/reconciliation",
      gaussClosure: "@workspace/ouroboros-gauss",
      invariance: "@workspace/ouroboros-blanca",
      moralGrounding: "@workspace/ouroboros-oppenheimer",
      ontologicalGrounding: "@workspace/ouroboros-socrates",
      measurabilityHonesty: "@workspace/ouroboros-lara",
    },
  };
}

export function evaluateAxesFromReceipt(
  railAxes: Record<string, number>[],
): AxisEvaluatorInput {
  const merged: Record<string, number[]> = {};
  for (const axes of railAxes) {
    for (const [k, v] of Object.entries(axes)) {
      if (!merged[k]) merged[k] = [];
      merged[k].push(v);
    }
  }

  function avg(key: string, fallback: number): number {
    const vals = merged[key];
    if (!vals || vals.length === 0) return fallback;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  return {
    cleanliness: avg("cleanliness", 0.95),
    horizon: avg("horizon", 0.90),
    resonance: avg("resonance", 0.85),
    frustum: avg("frustum", 0.88),
    gaussClosure: avg("gaussClosure", 0.90),
    invariance: avg("invariance", 0.92),
    moralGrounding: avg("moralGrounding", 0.85),
    ontologicalGrounding: avg("ontologicalGrounding", 0.80),
    measurabilityHonesty: avg("measurabilityHonesty", 0.90),
  };
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}
