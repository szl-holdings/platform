/**
 * SZL Holdings — Agent Gateway: Authorization (OPA)
 * Phase 11 — Agent Gateway
 *
 * Evaluates the inbound request against the OPA policy bundle at
 * platform/policy/approval/approval-requirements.rego.
 *
 * In local/test mode (OPA_ENDPOINT=local) the evaluation is performed
 * against an embedded policy engine that mirrors the Rego logic so tests
 * run without a live OPA sidecar.
 */

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

// ---------------------------------------------------------------------------
// Local (embedded) policy evaluator — mirrors approval-requirements.rego
// ---------------------------------------------------------------------------

function evaluateLocal(request: AgentActionRequest, caller: CallerIdentity): OpaDecision {
  const policyId = `szl.agent-gateway.${request.capability}`;
  const evaluatedAt = new Date().toISOString();

  // Agent actions are advisory-only (read/draft); no prod mutation is possible.
  // Therefore the base required_approvals for agent capabilities is 0 in dev.
  let requiredApprovals = 0;
  let requiredGroups: string[] = [];
  const reasons: string[] = [];

  // Production targets require 1 approval from platform-team
  if (request.targetEnvironment === 'production') {
    requiredApprovals = 1;
    requiredGroups = ['platform-team', 'release-managers'];
    reasons.push('Agent action targeting production environment requires platform-team approval.');
  }

  // Callers without platform-engineer or operator role require explicit approval
  if (!['platform-engineer', 'operator'].includes(caller.role)) {
    if (requiredApprovals === 0) {
      requiredApprovals = 1;
      requiredGroups = ['platform-team'];
      reasons.push(`Caller role '${caller.role}' requires platform-team approval for agent actions.`);
    }
  }

  // Draft PR and propose_policy_fixes always require staging/prod approval
  if (['draft_prs', 'propose_policy_fixes', 'propose_architecture_diffs'].includes(request.capability)) {
    if (request.targetEnvironment !== 'development') {
      requiredApprovals = Math.max(requiredApprovals, 1);
      if (!requiredGroups.includes('platform-team')) requiredGroups.push('platform-team');
      reasons.push(`Capability '${request.capability}' targeting non-dev environment requires approval.`);
    }
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
  const url = `${opaEndpoint}/v1/data/szl/approval`;
  const body = {
    input: {
      operation_type: `agent_${request.capability}`,
      environment: request.targetEnvironment,
      tier: 'tier-1',
      actor_role: caller.role,
      actor_groups: caller.groups,
      capability: request.capability,
      domain: request.domain,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new AuthzError(`OPA evaluation failed: HTTP ${res.status}`, `szl.agent-gateway.${request.capability}`, [
      `OPA responded with status ${res.status}`,
    ]);
  }

  const data = (await res.json()) as {
    result?: { required_approvals?: number; required_groups?: string[] };
  };

  const required = data.result ?? {};

  return {
    allowed: true,
    requiredApprovals: required.required_approvals ?? 0,
    requiredGroups: required.required_groups ?? [],
    policyId: `szl.agent-gateway.${request.capability}`,
    evaluatedAt: new Date().toISOString(),
    reasons: [],
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
  try {
    return await evaluateRemote(opaEndpoint, request, caller);
  } catch (err) {
    // Fail open is dangerous; fail closed is the safe default.
    // If OPA is unreachable, deny and require manual review.
    throw new AuthzError(
      `OPA is unreachable: ${err instanceof Error ? err.message : String(err)}. Failing closed.`,
      `szl.agent-gateway.${request.capability}`,
      ['OPA endpoint unavailable; policy evaluation failed closed.'],
    );
  }
}
