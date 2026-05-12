/**
 * Primitive 53 — Carrier integrity (chi-square against baseline)
 *
 * Trithemius (Steganographia, Polygraphiae): a covert message
 * survives only if its carrier looks like the baseline. We compute
 * a Pearson chi-square statistic between observed and expected
 * symbol frequencies; if it exceeds the declared threshold the
 * carrier is flagged as anomalous.
 */

export interface CarrierTest {
  observed: Record<string, number>;
  expected: Record<string, number>; // same keys, expected counts
  threshold: number;                 // chi-square critical value
}

export interface CarrierReceipt {
  chiSquare: number;
  degreesOfFreedom: number;
  threshold: number;
  anomalous: boolean;
  rationale: string;
}

export function checkCarrier(t: CarrierTest): CarrierReceipt {
  const keys = Object.keys(t.expected);
  let chi = 0;
  for (const k of keys) {
    const o = t.observed[k] ?? 0;
    const e = t.expected[k];
    if (e <= 0) continue;
    chi += ((o - e) ** 2) / e;
  }
  const df = Math.max(1, keys.length - 1);
  const anomalous = chi > t.threshold;
  return {
    chiSquare: chi,
    degreesOfFreedom: df,
    threshold: t.threshold,
    anomalous,
    rationale: anomalous
      ? "carrier deviates from baseline beyond threshold"
      : "carrier consistent with baseline within threshold",
  };
}
