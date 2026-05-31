/**
 * gates/ — T05 Policy-gate / Sentra thesis.
 *
 * Backing (REAL): mirrors sentra/web/src/lib/policy-engine.ts (the fail-closed
 * egress gate pipeline) and a11oy/packages/policy/src/gates/ (anchor-formula
 * gates). Formal layer: Lutar/Doctrine/CrossComponentInvariant.lean
 * (doctrine_cross_invariant — proven; contrapositive is a tracked := True shell).
 *
 * THREE GATE COUNTS — reconciled cleanly with provenance (these are distinct,
 * real, separately-counted populations; they are NOT the same number drifting):
 *
 *   - 8  sentra egress gates  — the fail-closed defensive-action egress
 *        pipeline (action-class, asset-exists, ownership, integration-tenant,
 *        asset-tenant, high-impact-approval, audit-logging, deny-default).
 *        Source: sentra/web/src/lib/policy-engine.ts::runPolicyGate.
 *   - 44 a11oy anchor gates   — the anchor-formula policy gates count cited in
 *        AGENT_DOCTRINE_ENFORCEMENT.md ("Anchor gates: 44 in a11oy").
 *   - 48 a11oy package gates  — the total policy-gate files cited in the thesis
 *        census ("48 real policy gates in a11oy/packages/policy/src/gates/").
 *
 * The deltas are real: not every gate file is an *anchor-formula* gate (some are
 * doctrine/admission/conjunctive gates), and the egress pipeline is a separate
 * sentra-side population. evaluateGates() below runs the real 8-step sentra
 * egress logic.
 */

export const GATE_COUNTS = {
  sentraEgress: 8,
  a11oyAnchor: 44,
  a11oyPackage: 48,
  /** Provenance for each count — every number carries its source. */
  provenance: {
    sentraEgress: "sentra/web/src/lib/policy-engine.ts::runPolicyGate (fail-closed egress)",
    a11oyAnchor: "AGENT_DOCTRINE_ENFORCEMENT.md — 'Anchor gates: 44 in a11oy'",
    a11oyPackage: "THESIS_CENSUS_REPORT.md — '48 real policy gates in a11oy/packages/policy/src/gates/'",
  },
} as const;

export const ALLOWED_ACTION_CLASSES = [
  "scan",
  "monitor",
  "alert",
  "contain",
  "isolate",
  "remediate",
] as const;
export const HIGH_IMPACT_ACTIONS = ["contain", "isolate", "remediate"] as const;
export const EXECUTABLE_STATUSES = ["owned", "authorized", "contracted_scope", "lab"] as const;

export interface GateContext {
  readonly actionClass: string;
  readonly assetExists: boolean;
  readonly targetOwnershipStatus: string;
  readonly integrationTenantId: string | null;
  readonly requestingTenantId: string;
  readonly assetTenantId: string;
  readonly approvalStatus?: string;
  readonly auditLoggingEnabled: boolean;
}

export interface GateResult {
  readonly allowed: boolean;
  readonly gate: number; // which of the 8 gates decided (0 = all passed)
  readonly reason: string;
}

/**
 * evaluateGates — real fail-closed 8-step egress pipeline, ported from sentra's
 * runPolicyGate. Denies by default; every deny names the gate that fired.
 */
export function evaluateGates(ctx: GateContext): GateResult {
  // 1. Action class must be allowed.
  if (!(ALLOWED_ACTION_CLASSES as readonly string[]).includes(ctx.actionClass)) {
    return { allowed: false, gate: 1, reason: `action class '${ctx.actionClass}' not in allowed list` };
  }
  // 2. Target asset must exist.
  if (!ctx.assetExists) {
    return { allowed: false, gate: 2, reason: "target asset does not exist in registry" };
  }
  // 3. Ownership status must be executable.
  if (!(EXECUTABLE_STATUSES as readonly string[]).includes(ctx.targetOwnershipStatus)) {
    return { allowed: false, gate: 3, reason: `ownership_status '${ctx.targetOwnershipStatus}' not executable` };
  }
  // 4. Integration must belong to the same tenant.
  if (ctx.integrationTenantId && ctx.integrationTenantId !== ctx.requestingTenantId) {
    return { allowed: false, gate: 4, reason: "integration belongs to a different tenant" };
  }
  // 5. Asset must belong to the same tenant.
  if (ctx.assetTenantId !== ctx.requestingTenantId) {
    return { allowed: false, gate: 5, reason: "asset belongs to a different tenant" };
  }
  // 6. High-impact actions require an approved approval record.
  if ((HIGH_IMPACT_ACTIONS as readonly string[]).includes(ctx.actionClass) && ctx.approvalStatus !== "approved") {
    return { allowed: false, gate: 6, reason: `high-impact action requires approval (got '${ctx.approvalStatus ?? "none"}')` };
  }
  // 7. Audit logging must be enabled.
  if (!ctx.auditLoggingEnabled) {
    return { allowed: false, gate: 7, reason: "audit logging must be enabled" };
  }
  // 8. Default: allowed only after all 7 checks pass (gate 8 = explicit allow).
  return { allowed: true, gate: 0, reason: "all 8 egress gates passed" };
}
