/**
 * SZL Holdings — Agent Gateway: Authorization (OPA)
 * Phase 11 — Agent Gateway
 *
 * Evaluates the inbound request against the OPA policy bundle at
 * platform/policy/approval/approval-requirements.rego.
 *
 * Two modes:
 *   - opaEndpoint === 'local'  → embedded evaluator that mirrors the Rego logic
 *     so unit/integration tests can run without a sidecar.
 *   - opaEndpoint is a URL     → POST to the live OPA Data API
 *     (`{endpoint}/v1/data/szl/approval`) and return the policy decision.
 *
 * The remote evaluator captures `evaluatedAt` from OPA's HTTP `Date` header
 * (falling back to the local clock only when OPA omits it). This makes the
 * audit log's `policyDecision.evaluatedAt` reflect the live OPA clock.
 *
 * The gateway sends the agent capability straight through as
 * `operation_type = "agent_<capability>"`. The Rego bundle owns the agent
 * approval rules end-to-end — no capability→operation mapping happens here.
 */

import { agentOperationType } from './capabilities/operation-type.js';
import type { AgentActionRequest, CallerIdentity, OpaDecision } from './types.js';

export class AuthzError extends Error {
  constructor(
    message: string,
    public readonly policyId: string,
    public readonly reasons: string[],
  ) {
    super(message);
    this.name = 'AuthzError';
  }
}

const MUTATING_AGENT_OPERATION_TYPES: ReadonlySet<string> = new Set([
  'agent_draft_prs',
  'agent_propose_policy_fixes',
  'agent_propose_architecture_diffs',
]);

const TRUSTED_AGENT_CALLER_ROLES: ReadonlySet<string> = new Set([
  'platform-engineer',
  'operator',
]);

// ---------------------------------------------------------------------------
// Local (embedded) policy evaluator — mirrors the agent_* rules in
// platform/policy/approval/approval-requirements.rego.
// ---------------------------------------------------------------------------

function evaluateLocal(request: AgentActionRequest, caller: CallerIdentity): OpaDecision {
  const operationType = agentOperationType(request.capability);
  const policyId = `szl.approval/${operationType}`;
  const evaluatedAt = new Date().toISOString();

  let requiredApprovals = 0;
  let requiredGroups: string[] = [];
  const reasons: string[] = [];

  if (request.targetEnvironment === 'production') {
    // Rule 1 — Production target requires release-quality approvers.
    requiredApprovals = 1;
    requiredGroups = ['platform-team', 'release-managers'];
    reasons.push('Agent action targeting production environment requires platform-team approval.');
  } else if (!TRUSTED_AGENT_CALLER_ROLES.has(caller.role)) {
    // Rule 2 — Non-prod call from an untrusted caller role.
    requiredApprovals = 1;
    requiredGroups = ['platform-team'];
    reasons.push(`Caller role '${caller.role}' requires platform-team approval for agent actions.`);
  } else if (
    request.targetEnvironment === 'staging' &&
    MUTATING_AGENT_OPERATION_TYPES.has(operationType)
  ) {
    // Rule 3 — Mutating capability targeting staging by a trusted caller.
    requiredApprovals = 1;
    requiredGroups = ['platform-team'];
    reasons.push(`Capability '${request.capability}' targeting staging requires approval.`);
  }

  return {
    allowed: true,
    requiredApprovals,
    requiredGroups,
    policyId,
    evaluatedAt,
    reasons,
  };
}

// ---------------------------------------------------------------------------
// Remote OPA evaluator
// ---------------------------------------------------------------------------

async function evaluateRemote(
  opaEndpoint: string,
  request: AgentActionRequest,
  caller: CallerIdentity,
): Promise<OpaDecision> {
  const url = `${opaEndpoint.replace(/\/$/, '')}/v1/data/szl/approval`;
  const operationType = agentOperationType(request.capability);
  const body = {
    input: {
      operation_type: operationType,
      environment: request.targetEnvironment,
      tier: 'tier-1',
      actor_role: caller.role,
      actor_groups: caller.groups,
      capability: request.capability,
      domain: request.domain,
      // The bundle's deny-rule references `approvals` and `pending_minutes`;
      // pre-approval evaluation supplies empty/zero so the decision reflects
      // only the requirement, not satisfaction.
      approvals: [],
      pending_minutes: 0,
    },
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new AuthzError(
      `OPA is unreachable: ${err instanceof Error ? err.message : String(err)}. Failing closed.`,
      `szl.agent-gateway.${request.capability}`,
      ['OPA endpoint unreachable; policy evaluation failed closed.'],
    );
  }

  if (!res.ok) {
    throw new AuthzError(
      `OPA evaluation failed: HTTP ${res.status}`,
      `szl.agent-gateway.${request.capability}`,
      [`OPA responded with status ${res.status}`],
    );
  }

  const data = (await res.json()) as {
    result?: {
      required_approvals?: number;
      required_groups?: string[];
      deny?: string[];
    };
  };

  const required = data.result ?? {};

  // Capture OPA's clock from the HTTP Date header so audit entries reflect the
  // policy server's authoritative time, not the gateway's local clock. Fall
  // back to the local clock when the header is missing OR when it parses to
  // an invalid Date (e.g. malformed value). `Date.toISOString()` would throw
  // on an invalid Date, so we guard with `Number.isFinite` first.
  const dateHeader = res.headers.get('date');
  let evaluatedAt = new Date().toISOString();
  if (dateHeader) {
    const parsed = new Date(dateHeader);
    if (Number.isFinite(parsed.getTime())) {
      evaluatedAt = parsed.toISOString();
    }
  }

  return {
    allowed: true,
    requiredApprovals: required.required_approvals ?? 0,
    requiredGroups: required.required_groups ?? [],
    policyId: `szl.approval/${operationType}`,
    evaluatedAt,
    reasons: required.deny ?? [],
  };
}

// ---------------------------------------------------------------------------
// Public evaluator — chooses local vs remote based on config
// ---------------------------------------------------------------------------

export async function evaluatePolicy(
  request: AgentActionRequest,
  caller: CallerIdentity,
  opaEndpoint: string,
): Promise<OpaDecision> {
  if (opaEndpoint === 'local') {
    return evaluateLocal(request, caller);
  }
  return evaluateRemote(opaEndpoint, request, caller);
}
