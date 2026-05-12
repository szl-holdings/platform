/**
 * Primitive 60 — Sfumato gradient continuity
 *
 * Leonardo's sfumato is a continuous tonal gradient. We compute
 * total variation Σ|y_{i+1} − y_i| and the maximum step. A claimed
 * continuous gradient must keep maxStep ≤ tolerance; otherwise a
 * discontinuity is surfaced.
 */

export interface SfumatoSample {
  position: number;  // ordered axis (e.g. pixel index)
  value: number;     // tonal value
}

export interface SfumatoReceipt {
  totalVariation: number;
  maxStep: number;
  tolerance: number;
  continuous: boolean;
  discontinuityIndex: number; // -1 if continuous
  rationale: string;
}

export function checkSfumato(
  samples: SfumatoSample[],
  tolerance = 0.05,
): SfumatoReceipt {
  if (samples.length < 2) {
    throw new Error("sfumato requires ≥ 2 samples");
  }
  const ordered = [...samples].sort((a, b) => a.position - b.position);
  let tv = 0;
  let maxStep = 0;
  let discontinuityIndex = -1;
  for (let i = 1; i < ordered.length; i++) {
    const step = Math.abs(ordered[i].value - ordered[i - 1].value);
    tv += step;
    if (step > maxStep) {
      maxStep = step;
      if (step > tolerance && discontinuityIndex === -1) {
        discontinuityIndex = i;
      }
    }
  }
  const continuous = maxStep <= tolerance;
  return {
    totalVariation: tv,
    maxStep,
    tolerance,
    continuous,
    discontinuityIndex: continuous ? -1 : discontinuityIndex,
    rationale: continuous
      ? "gradient continuous within tolerance"
      : `discontinuity at index ${discontinuityIndex}: step ${maxStep.toFixed(4)} > tolerance ${tolerance}`,
  };
}
