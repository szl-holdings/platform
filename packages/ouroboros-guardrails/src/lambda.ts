/**
 * Closed-form Lambda scoring for guardrail rails.
 *
 * This module bridges the guardrails system to the formal Lutar Invariant.
 * The lambdaScore function remains for backward compatibility with existing
 * rail implementations. The new lambdaScore9 function runs the full 9-axis
 * formal invariant and returns the composite plus per-axis breakdown.
 *
 * Innovation: every guard decision now carries the formal Lutar Invariant
 * score, the per-axis breakdown, the Egyptian-inspectable weights, and
 * the Adaptive Depth Routing decision. This is the first guardrails
 * runtime where the trust score IS the cost optimizer.
 */

import { type LutarAxes9, type LutarReportN, lutarInvariant9, verifyLutarBoundN } from "@workspace/ouroboros-invariant";

export interface Lambda9Result {
  invariant: number;
  report: LutarReportN;
  boundVerified: boolean;
}

export function lambdaScore(axes: Record<string, number>): number {
  const values = Object.values(axes);
  if (values.length === 0) return 1;
  for (const v of values) {
    if (!Number.isFinite(v)) return 0;
    if (v <= 0) return 0;
  }
  const clamped = values.map((v) => Math.min(1, Math.max(0, v)));
  const logSum = clamped.reduce((acc, v) => acc + Math.log(v), 0);
  return Math.exp(logSum / clamped.length);
}

export function lambdaScore9(axes: LutarAxes9): Lambda9Result {
  const report = lutarInvariant9(axes);
  const boundVerified = verifyLutarBoundN(report);
  return { invariant: report.invariant, report, boundVerified };
}

export function compositeLambda(rails: { lambda: number }[]): number {
  if (rails.length === 0) return 1;
  return lambdaScore(
    Object.fromEntries(rails.map((r, i) => [`rail_${i}`, r.lambda])),
  );
}

export function lambdaVerdict(
  lambda: number,
  thresholds: { proceed: number; quarantine: number } = {
    proceed: 0.85,
    quarantine: 0.5,
  },
): "PROCEED" | "QUARANTINE" | "ABORT" {
  if (lambda >= thresholds.proceed) return "PROCEED";
  if (lambda >= thresholds.quarantine) return "QUARANTINE";
  return "ABORT";
}

export function extractAxes9FromRails(
  rails: { axes: Record<string, number> }[],
): LutarAxes9 {
  const merged: Record<string, number[]> = {};
  for (const rail of rails) {
    for (const [k, v] of Object.entries(rail.axes)) {
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
    cleanliness: clamp01(avg("cleanliness", 0.95)),
    horizon: clamp01(avg("horizon", 0.90)),
    resonance: clamp01(avg("resonance", 0.85)),
    frustum: clamp01(avg("frustum", 0.88)),
    gaussClosure: clamp01(avg("gaussClosure", 0.90)),
    invariance: clamp01(avg("invariance", 0.92)),
    moralGrounding: clamp01(avg("moralGrounding", 0.85)),
    ontologicalGrounding: clamp01(avg("ontologicalGrounding", 0.80)),
    measurabilityHonesty: clamp01(avg("measurabilityHonesty", 0.90)),
  };
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}
