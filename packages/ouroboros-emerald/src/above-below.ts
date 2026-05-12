/**
 * Primitive 37 — Above-Below correspondence
 *
 * Hermes Trismegistus, Emerald Tablet (tr. Newton, c. 1680):
 *   "That which is below is like that which is above
 *    and that which is above is like that which is below."
 *
 * Operationalised as scale-invariance: a feature measured at the
 * micro-scale must agree (within tolerance) with the same feature
 * measured at the macro-scale. Disagreement beyond tolerance is a
 * scale-break and is logged honestly.
 */

export interface ScaleObservation {
  scale: "micro" | "macro";
  value: number;
}

export interface AboveBelowReceipt {
  micro: number;
  macro: number;
  ratio: number;            // micro / macro
  symmetricDelta: number;   // |micro - macro| / max(|micro|, |macro|, eps)
  tolerance: number;
  holds: boolean;
  rationale: string;
}

const EPS = 1e-12;

export function checkAboveBelow(
  obs: ScaleObservation[],
  tolerance = 0.05,
): AboveBelowReceipt {
  const micro = obs.find((o) => o.scale === "micro");
  const macro = obs.find((o) => o.scale === "macro");
  if (!micro || !macro) {
    throw new Error("above-below requires one micro and one macro observation");
  }
  const denom = Math.max(Math.abs(micro.value), Math.abs(macro.value), EPS);
  const symmetricDelta = Math.abs(micro.value - macro.value) / denom;
  const ratio = micro.value / (macro.value === 0 ? EPS : macro.value);
  const holds = symmetricDelta <= tolerance;
  return {
    micro: micro.value,
    macro: macro.value,
    ratio,
    symmetricDelta,
    tolerance,
    holds,
    rationale: holds
      ? "scale-invariance holds within tolerance"
      : "scale-break declared: above and below disagree",
  };
}
