/**
 * @workspace/ouroboros-loop
 * =========================
 * Implements the OUROBOROS_OPERATOR documented in
 *   packages/ouroboros-integrations/src/supreme-codex-constants.ts:
 *     O : X → X,  O(x) = T^n(x),  fixed-point: O(x) = x.
 *
 * Composes:
 *   - Λ-invariant gate            (Mechanism I — @workspace/ouroboros-invariant)
 *   - Newton fluxions-receipt     (witness gate — @workspace/ouroboros-newton)
 *   - Gauss least-squares forecast (predict refusal — @workspace/ouroboros-gauss)
 *   - Bekenstein cascade          (Mechanism III)
 *   - Dual-witness verdict        (Mechanism IV)
 *   - Receipt chain               (Mechanism II)
 *
 * The forecast term (Gauss) uses the residual of a least-squares fit on
 * recent loop traces to PREDICT whether the next iteration will close.
 * If forecast residual exceeds tolerance, we short-circuit — saving the
 * provider call AND any downstream verification work.
 *
 * Provenance: every refusal/admit decision carries a Newton mint-style
 * pyx receipt (SHA-256 over the trace) for offline replay.
 */
export * from "./types.js";
export * from "./loop.js";
export * from "./forecast.js";
