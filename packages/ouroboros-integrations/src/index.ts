/**
 * @workspace/ouroboros-integrations — adapters that lift the Ouroboros
 * primitives (Frustum / Seked / Unit-Fractions / Doubling) into the
 * three deployable products in this monorepo.
 *
 *   A11oy   — agent-fleet handoff reconciliation (Frustum, MMP-14)
 *   Amaru   — fleet coordination + thresholds (Seked + Unit-Fractions)
 *   Sentra  — HSM-anchored governance accumulator (Doubling)
 *
 * The integrations are pure-functional and have no I/O. The api-server
 * exposes them via /api/ouroboros/* routes; each artifact renders a
 * small surface that demonstrates the primitive in operation.
 */

export * as a11oy from "./a11oy.js";
export * as amaru from "./amaru.js";
export * as sentra from "./sentra.js";
