/**
 * SZL Holdings — Agent Gateway: Capability → Rego Operation Type Mapping
 * Phase 11 — Agent Gateway / Task #4610
 *
 * Single source of truth for translating an inbound `AgentActionRequest`
 * (capability + caller role + target environment) into the operation_type
 * recognised by the OPA bundle at platform/policy/approval/approval-requirements.rego.
 *
 * Both the authorization path (src/authz.ts → OPA input) and the approval
 * routing path (src/approval.ts → Temporal workflow input) MUST go through
 * this same mapper so that "what was tested by OPA" and "what is recorded in
 * the Temporal approval workflow" describe the same operation type.
 */

import type { AgentActionRequest, CallerIdentity } from './types.js';

/**
 * The operation_type values recognised by the Rego bundle at
 * platform/policy/approval/approval-requirements.rego (and the related
 * environment-guardrails.rego). Keep this union in sync with the Rego
 * constants — a typo here means agent traffic is silently routed past the
 * intended approval rule.
 *
 * `agent-advisory` is the gateway-only sentinel used when an agent action
 * has no Rego counterpart; OPA returns 0 required approvals for it because
 * no rule matches.
 */
export type RegoOperationType =
  | 'deploy'
  | 'rollback'
  | 'database-schema-migration'
  | 'break-glass'
  | 'policy-exception'
  | 'agent-advisory';

const MUTATING_AGENT_CAPABILITIES: ReadonlySet<string> = new Set([
  'draft_prs',
  'propose_policy_fixes',
  'propose_architecture_diffs',
]);

const TRUSTED_CALLER_ROLES: ReadonlySet<string> = new Set([
  'platform-engineer',
  'operator',
]);

/**
 * Maps an agent action onto one of the existing Rego operation types.
 *
 * The mapping rules (in priority order):
 *   1. Production target           → 'deploy'           (1 approval, platform-team / release-managers)
 *   2. Staging + mutating capability → 'policy-exception' (1 approval, security-team)
 *   3. Untrusted caller role       → 'policy-exception' (1 approval, security-team)
 *   4. Otherwise                    → 'agent-advisory'  (no Rego rule → 0 approvals)
 */
export function mapToRegoOperationType(
  request: AgentActionRequest,
  caller: CallerIdentity,
): RegoOperationType {
  if (request.targetEnvironment === 'production') {
    return 'deploy';
  }

  if (
    request.targetEnvironment === 'staging' &&
    MUTATING_AGENT_CAPABILITIES.has(request.capability)
  ) {
    return 'policy-exception';
  }

  if (!TRUSTED_CALLER_ROLES.has(caller.role)) {
    return 'policy-exception';
  }

  return 'agent-advisory';
}
