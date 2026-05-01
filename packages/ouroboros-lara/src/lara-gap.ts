/**
 * Primitive 36 — Lara-gap declaration.
 *
 * Combines primitives 33 (Gowers gate), 34 (Abramov gate), 35 (measurability).
 *
 * Receipt logic:
 *   STRUCTURED detection + ABRAMOV_FAILS + NON_MEASURABLE
 *     → emit LARA_GAP receipt; runtime may USE the structure but
 *       MUST NOT claim reconstructibility to downstream consumers.
 *
 *   STRUCTURED + (ABRAMOV_PROVEN or ABRAMOV_OPEN) + MEASURABLE
 *     → emit LARA_OK receipt; reconstructibility may be claimed.
 *
 *   Any UNDETERMINED → emit LARA_HOLD receipt; runtime must defer.
 *
 *   STRUCTURED + ABRAMOV_PROVEN + NON_MEASURABLE
 *     → emit LARA_BUG receipt; this contradicts the proven case and indicates
 *       a runtime error in the reconstruction pipeline. Halt.
 *
 *   Anything else → emit LARA_NA (no structure detected).
 */

import type { GowersGateResult } from "./gowers-norm.js";
import type { AbramovGateResult } from "./abramov-gate.js";
import type { MeasurabilityResult } from "./measurability.js";

export type LaraReceiptKind =
  | "LARA_OK"
  | "LARA_GAP"
  | "LARA_HOLD"
  | "LARA_BUG"
  | "LARA_NA";

export interface LaraInput {
  detectionId: string;
  gowers: GowersGateResult;
  abramov: AbramovGateResult;
  measurability: MeasurabilityResult | null;
}

export interface LaraReceipt {
  detectionId: string;
  kind: LaraReceiptKind;
  reconstructibilityClaimAllowed: boolean;
  axisN: number; // contribution to Λ₉ axis N for this single detection
  reason: string;
  citations: string[];
}

const PAPER =
  "Jamneshan–Shalom–Tao, Math. Ann. 394:11 (2026), https://doi.org/10.1007/s00208-026-03344-5";

export function declareLara(input: LaraInput): LaraReceipt {
  const { detectionId, gowers, abramov, measurability } = input;

  if (gowers.verdict === "UNIFORM" || gowers.verdict === "ESTIMATED") {
    return {
      detectionId,
      kind: "LARA_NA",
      reconstructibilityClaimAllowed: false,
      axisN: 1.0,
      reason:
        gowers.verdict === "UNIFORM"
          ? "No structure detected; Lara N/A."
          : "Estimator path; Lara cannot speak.",
      citations: [PAPER],
    };
  }

  if (!measurability || measurability.verdict === "UNDETERMINED") {
    return {
      detectionId,
      kind: "LARA_HOLD",
      reconstructibilityClaimAllowed: false,
      axisN: 1.0,
      reason: "Measurability undetermined; runtime defers reconstruction claim.",
      citations: [PAPER],
    };
  }

  if (abramov.status === "ABRAMOV_FAILS" && measurability.verdict === "NON_MEASURABLE") {
    return {
      detectionId,
      kind: "LARA_GAP",
      reconstructibilityClaimAllowed: false,
      axisN: 1.0, // honesty rewarded — gap correctly declared
      reason:
        "Structure detected; Abramov property fails for (p,k); reconstruction non-measurable. Use allowed; reconstructibility claim forbidden.",
      citations: [PAPER, abramov.citation],
    };
  }

  if (abramov.status !== "ABRAMOV_FAILS" && measurability.verdict === "MEASURABLE") {
    return {
      detectionId,
      kind: "LARA_OK",
      reconstructibilityClaimAllowed: true,
      axisN: 1.0,
      reason: "Structure detected and reconstruction Lipschitz-recoverable; reconstructibility claim permitted.",
      citations: [PAPER, abramov.citation],
    };
  }

  if (abramov.status === "ABRAMOV_PROVEN" && measurability.verdict === "NON_MEASURABLE") {
    return {
      detectionId,
      kind: "LARA_BUG",
      reconstructibilityClaimAllowed: false,
      axisN: 0.0, // dishonest state — runtime contradicts a proven theorem
      reason:
        "Contradiction: Abramov holds for (p,k) but reconstruction failed. Runtime bug; halt and audit.",
      citations: [PAPER, abramov.citation],
    };
  }

  // Mixed remaining cases (e.g., ABRAMOV_OPEN + NON_MEASURABLE, or ABRAMOV_FAILS + MEASURABLE).
  if (abramov.status === "ABRAMOV_OPEN" && measurability.verdict === "NON_MEASURABLE") {
    return {
      detectionId,
      kind: "LARA_GAP",
      reconstructibilityClaimAllowed: false,
      axisN: 1.0,
      reason: "Abramov open for (p,k); empirical non-measurability observed. Treat as gap; record receipt.",
      citations: [PAPER, abramov.citation],
    };
  }
  // ABRAMOV_FAILS + MEASURABLE — empirically lucky, but the theory says no general guarantee.
  return {
    detectionId,
    kind: "LARA_HOLD",
    reconstructibilityClaimAllowed: false,
    axisN: 0.5,
    reason:
      "Empirical reconstruction succeeded but Abramov fails in general for (p,k); claim withheld.",
    citations: [PAPER, abramov.citation],
  };
}

/** Aggregate Λ₉ axis N over a batch of receipts: mean of per-receipt axisN. */
export function nonMeasurabilityHonesty(receipts: LaraReceipt[]): number {
  if (receipts.length === 0) return 1.0;
  const sum = receipts.reduce((acc, r) => acc + r.axisN, 0);
  return sum / receipts.length;
}
