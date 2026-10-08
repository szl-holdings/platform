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
 *     (`{endpoint}/v1/data/szl/approval/decision`) and return the policy
 *     decision. The response contract is validated without defaults.
 *
 * The remote evaluator captures `evaluatedAt` from OPA's HTTP `Date` header
 * (falling back to the local clock only when OPA omits it). This makes the
 * audit log's `policyDecision.evaluatedAt` reflect the live OPA clock.
 *
 * The gateway sends the agent capability straight through as
 * `operation_type = "agent_<capability>"`. The Rego bundle owns the agent
 * approval rules end-to-end — no capability→operation mapping happens here.
 */

import { agentOperationType } from './operation-type.js';
import { isProductionRuntime } from './runtime-environment.js';
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

const TRUSTED_AGENT_CALLER_ROLES: ReadonlySet<string> = new Set(['platform-engineer', 'operator']);

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
  const url = `${opaEndpoint.replace(/\/$/, '')}/v1/data/szl/approval/decision`;
  const operationType = agentOperationType(request.capability);
  const policyId = `szl.approval/${operationType}`;
  const body = {
    input: {
      operation_type: operationType,
      environment: request.targetEnvironment,
      tier: 'tier-1',
      actor_role: caller.role,
      actor_groups: caller.groups,
      org_id: caller.orgId,
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
      signal: AbortSignal.timeout(3_000),
    });
  } catch (err) {
    throw new AuthzError(
      `OPA is unreachable: ${err instanceof Error ? err.message : String(err)}. Failing closed.`,
      policyId,
      ['OPA endpoint unreachable; policy evaluation failed closed.'],
    );
  }

  if (!res.ok) {
    throw new AuthzError(`OPA evaluation failed: HTTP ${res.status}`, policyId, [
      `OPA responded with status ${res.status}`,
    ]);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new AuthzError('OPA evaluation returned malformed JSON; failing closed', policyId, [
      'OPA response was not valid JSON.',
    ]);
  }

  const required = validateOpaDecision(data, policyId);
  if (!required.allowed) {
    throw new AuthzError(
      'OPA denied the request; failing closed',
      policyId,
      required.deny.length > 0 ? required.deny : ['OPA returned allowed=false.'],
    );
  }

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
    allowed: required.allowed,
    requiredApprovals: required.required_approvals,
    requiredGroups: required.required_groups,
    policyId,
    evaluatedAt,
    reasons: required.deny,
  };
}

interface OpaDecisionContract {
  allowed: boolean;
  required_approvals: number;
  required_groups: string[];
  deny: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isUniqueStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= 100 &&
    value.every(
      (entry) => typeof entry === 'string' && entry.length > 0 && entry === entry.trim(),
    ) &&
    new Set(value).size === value.length
  );
}

function validateOpaDecision(data: unknown, policyId: string): OpaDecisionContract {
  const invalid = (reason: string): never => {
    throw new AuthzError(
      'OPA evaluation returned an invalid decision contract; failing closed',
      policyId,
      [reason],
    );
  };

  if (!isRecord(data) || Object.keys(data).length !== 1 || !('result' in data)) {
    return invalid('OPA response must contain exactly one result object.');
  }
  const result = data.result;
  if (!isRecord(result)) {
    return invalid('OPA result must be an object.');
  }
  const keys = Object.keys(result).sort();
  const expectedKeys = ['allowed', 'deny', 'required_approvals', 'required_groups'];
  if (
    keys.length !== expectedKeys.length ||
    keys.some((key, index) => key !== expectedKeys[index])
  ) {
    return invalid('OPA result fields do not match the pinned decision contract.');
  }
  if (typeof result.allowed !== 'boolean') {
    return invalid('OPA result.allowed must be a boolean.');
  }
  if (
    typeof result.required_approvals !== 'number' ||
    !Number.isSafeInteger(result.required_approvals) ||
    result.required_approvals < 0 ||
    result.required_approvals > 100
  ) {
    return invalid('OPA result.required_approvals must be an integer from 0 through 100.');
  }
  if (!isUniqueStringArray(result.required_groups)) {
    return invalid('OPA result.required_groups must be an array of unique non-empty strings.');
  }
  if (!isUniqueStringArray(result.deny)) {
    return invalid('OPA result.deny must be an array of unique non-empty strings.');
  }
  if (result.allowed && result.deny.length > 0) {
    return invalid('OPA cannot return allowed=true with deny reasons.');
  }
  if (result.required_approvals === 0 && result.required_groups.length > 0) {
    return invalid('OPA cannot return approval groups when required_approvals is zero.');
  }
  if (result.required_approvals > 0 && result.required_groups.length === 0) {
    return invalid('OPA must return approval groups when approvals are required.');
  }

  return result as unknown as OpaDecisionContract;
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
    if (isProductionRuntime()) {
      throw new AuthzError(
        'The embedded OPA evaluator is forbidden in production',
        `szl.agent-gateway.${request.capability}`,
        ['Production policy evaluation requires a live OPA endpoint.'],
      );
    }
    return evaluateLocal(request, caller);
  }
  return evaluateRemote(opaEndpoint, request, caller);
}

export async function probeOpaDecision(opaEndpoint: string): Promise<boolean> {
  if (opaEndpoint === 'local') return !isProductionRuntime();

  const now = Math.floor(Date.now() / 1_000);
  const probeRequest: AgentActionRequest = {
    correlationId: 'agent-gateway-readiness-probe',
    capability: 'inspect_code',
    model: 'readiness-probe',
    promptHash: '0000000000000000',
    target: 'agent-gateway-readiness-probe',
    targetEnvironment: 'production',
    domain: 'platform',
    parameters: {},
    requestedAt: new Date().toISOString(),
  };
  const probeCaller: CallerIdentity = {
    sub: 'agent-gateway-readiness-probe',
    role: 'platform-engineer',
    groups: ['platform-team'],
    orgId: 'agent-gateway-readiness-probe',
    iat: now,
    exp: now + 60,
  };

  try {
    const decision = await evaluateRemote(opaEndpoint, probeRequest, probeCaller);
    return (
      decision.allowed === true &&
      decision.requiredApprovals === 1 &&
      decision.requiredGroups.length === 2 &&
      decision.requiredGroups[0] === 'platform-team' &&
      decision.requiredGroups[1] === 'release-managers' &&
      decision.reasons.length === 0 &&
      decision.policyId === 'szl.approval/agent_inspect_code'
    );
  } catch {
    return false;
  }
}
