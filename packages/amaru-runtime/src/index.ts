/**
 * @workspace/amaru-runtime
 * =========================
 * Fleet-coordination runtime for SZL Holdings' Amaru surface.
 *
 * Public API:
 *   amaru.verify(input)     — runs an Amaru request through the Ouroboros
 *                             spine (Λ-gate, Newton fluxions, dual-witness,
 *                             Gauss forecast, receipt chain) and returns
 *                             an OuroborosReceipt + the AmaruFleetSignal.
 *   amaru.observe(sample)   — sample a fleet metric (slope, recommendation).
 *   amaru.auditThreshold()  — decompose a threshold into unit fractions.
 *
 * The Λ-gate over Amaru uses Λ₉ on these axes:
 *   C  cleanliness        ← input validation pass-rate
 *   H  horizon            ← time-window completeness
 *   R  resonance          ← seked stability (1 - |Δ|)
 *   F  frustum            ← witness Jaccard across replicas
 *   G  Gauß closure       ← least-squares residual closure
 *   I  invariance         ← Blanca Lorentz check
 *   M  moral grounding    ← Oppenheimer ledger pass
 *   B  being / ontology   ← Socratic divided-line
 *   N  non-measurability  ← Lara gap honesty
 *
 * Public: amaru = { verify, observe, auditThreshold, monitor: () => Monitor }
 */
export * from "./legacy.js";
export * from "./verify.js";
export * from "./kuramoto-sync.js";
export { lutarInvariant9, verifyLutarBoundN } from "@workspace/ouroboros-invariant";
