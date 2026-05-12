/**
 * SZL Holdings — Agent Gateway: Capability → Rego operation_type prefix
 * Phase 11 — Agent Gateway
 *
 * The agent gateway sends `operation_type = "agent_<capability>"` to OPA so
 * the Rego bundle's `agent_*` rules in
 * platform/policy/approval/approval-requirements.rego match directly. This
 * is a deterministic namespace prefix — NOT a context-aware mapping. All
 * approval-shape decisions live in the bundle.
 */

export function agentOperationType(capability: string): string {
  return `agent_${capability}`;
}
