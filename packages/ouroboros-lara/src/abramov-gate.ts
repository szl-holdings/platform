/**
 * Primitive 34 — Abramov-order gate.
 *
 * Encodes the current state of the Bergelson–Tao–Ziegler conjecture
 * (Ergodic Abramov property of Host–Kra F_p^ω-systems of order ≤ k):
 *
 *   k ≤ p + 1                → ABRAMOV_PROVEN (BTZ 2010 + Candela–González-Sánchez–Szegedy 2023)
 *   (p, k) = (2, 5)          → ABRAMOV_FAILS (Jamneshan–Shalom–Tao, Math. Ann. 394:11, 2026)
 *   otherwise                → ABRAMOV_OPEN
 *
 * The runtime uses this gate to decide whether reconstruction
 * (the strong inverse conjecture 1.3) is theoretically available.
 */

export type AbramovStatus = "ABRAMOV_PROVEN" | "ABRAMOV_FAILS" | "ABRAMOV_OPEN";

export interface AbramovGateInput {
  p: number;
  k: number;
}

export interface AbramovGateResult {
  p: number;
  k: number;
  status: AbramovStatus;
  citation: string;
  reason: string;
}

export function abramovGate(input: AbramovGateInput): AbramovGateResult {
  const { p, k } = input;
  if (!Number.isInteger(p) || p < 2) throw new Error("p must be a prime ≥ 2.");
  if (!Number.isInteger(k) || k < 1) throw new Error("k must be a positive integer.");

  if (k <= p + 1) {
    return {
      p,
      k,
      status: "ABRAMOV_PROVEN",
      citation:
        "Bergelson–Tao–Ziegler 2010 (k+1 ≤ p) + Candela–González-Sánchez–Szegedy 2023 (k ≤ p+1).",
      reason: `k=${k} ≤ p+1=${p + 1}; Abramov property holds.`,
    };
  }
  if (p === 2 && k === 5) {
    return {
      p,
      k,
      status: "ABRAMOV_FAILS",
      citation: "Jamneshan, Shalom, Tao, Math. Ann. 394:11 (2026), https://doi.org/10.1007/s00208-026-03344-5.",
      reason:
        "Counter-example: there exists a Host–Kra F_2^ω-system of order 5 that is not Abramov of order 5. Strong inverse conjecture for U^6 fails (non-measurability).",
    };
  }
  return {
    p,
    k,
    status: "ABRAMOV_OPEN",
    citation: "Status open as of 2026.",
    reason: `(p=${p}, k=${k}) outside proven range and outside known counter-example.`,
  };
}
