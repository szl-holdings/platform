/**
 * Primitive 42 — Fluxions / derivative receipt.
 *
 * Source: Newton, "Method of Fluxions and Infinite Series" (composed 1671,
 *   published 1736); De Analysi per Aequationes Numero Terminorum Infinitas
 *   (1669, MS Add 3963 at Cambridge). Newton's dot-notation ẏ = dy/dt is
 *   the original "fluxion" — the rate at which a fluent changes.
 *
 * A claim about a rate-of-change is admissible only if it carries a witness
 * for the limit process. We accept three witness forms:
 *
 *   FORWARD   — y'(x) ≈ (f(x+h) - f(x)) / h               for small h
 *   CENTRAL   — y'(x) ≈ (f(x+h) - f(x-h)) / (2h)          for small h
 *   SYMBOLIC  — caller supplies the closed-form derivative directly
 *
 * Bare claims — "the rate is r" without one of these — are rejected.
 */

export type FluxionWitnessKind = "FORWARD" | "CENTRAL" | "SYMBOLIC";

export interface FluxionClaim {
  claimId: string;
  point: number; // x
  asserted: number; // claimed value of y'(x)
  witness:
    | { kind: "FORWARD"; fxh: number; fx: number; h: number }
    | { kind: "CENTRAL"; fxh: number; fxmh: number; h: number }
    | { kind: "SYMBOLIC"; closedForm: number };
  /** Tolerance for accepting the claim (default 1e-3). */
  tolerance?: number;
}

export type FluxionVerdict = "ACCEPTED" | "REJECTED_TOL" | "REJECTED_BARE" | "REJECTED_H";

export interface FluxionResult {
  claimId: string;
  verdict: FluxionVerdict;
  witnessKind: FluxionWitnessKind;
  computed: number;
  asserted: number;
  residual: number;
  reason: string;
}

export function receiveFluxion(claim: FluxionClaim): FluxionResult {
  const tol = claim.tolerance ?? 1e-3;
  if (!Number.isFinite(claim.asserted)) {
    return {
      claimId: claim.claimId,
      verdict: "REJECTED_BARE",
      witnessKind: claim.witness.kind,
      computed: NaN,
      asserted: claim.asserted,
      residual: NaN,
      reason: "Asserted value is not finite.",
    };
  }
  let computed: number;
  if (claim.witness.kind === "FORWARD") {
    if (claim.witness.h <= 0 || !Number.isFinite(claim.witness.h)) {
      return {
        claimId: claim.claimId,
        verdict: "REJECTED_H",
        witnessKind: "FORWARD",
        computed: NaN,
        asserted: claim.asserted,
        residual: NaN,
        reason: "Step size h must be positive finite.",
      };
    }
    computed = (claim.witness.fxh - claim.witness.fx) / claim.witness.h;
  } else if (claim.witness.kind === "CENTRAL") {
    if (claim.witness.h <= 0 || !Number.isFinite(claim.witness.h)) {
      return {
        claimId: claim.claimId,
        verdict: "REJECTED_H",
        witnessKind: "CENTRAL",
        computed: NaN,
        asserted: claim.asserted,
        residual: NaN,
        reason: "Step size h must be positive finite.",
      };
    }
    computed = (claim.witness.fxh - claim.witness.fxmh) / (2 * claim.witness.h);
  } else {
    computed = claim.witness.closedForm;
  }
  const residual = Math.abs(computed - claim.asserted);
  if (residual > tol) {
    return {
      claimId: claim.claimId,
      verdict: "REJECTED_TOL",
      witnessKind: claim.witness.kind,
      computed,
      asserted: claim.asserted,
      residual,
      reason: `Residual ${residual.toExponential(3)} exceeds tolerance ${tol.toExponential(2)}.`,
    };
  }
  return {
    claimId: claim.claimId,
    verdict: "ACCEPTED",
    witnessKind: claim.witness.kind,
    computed,
    asserted: claim.asserted,
    residual,
    reason: `Witness ${claim.witness.kind} confirms ẏ at x=${claim.point}.`,
  };
}
