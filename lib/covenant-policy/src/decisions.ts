import type { PrismRole } from '@szl-holdings/prism-bus';
import { type CovenantDecision, type CovenantPermission, type CovenantRequest, type CovenantResource, type CovenantSubject, covenantEngine } from './engine.js';

export interface CovenantCheckResult {
  allowed: boolean;
  decision: CovenantDecision;
  reason?: string;
}

export function checkPermission(
  roles: PrismRole[],
  action: CovenantPermission,
  resourceType: string,
  options: {
    tenantId?: string | null;
    userId?: string | null;
    domain?: string;
    resourceId?: string;
    actionClass?: string;
    subjectAttributes?: Record<string, unknown>;
    resourceAttributes?: Record<string, unknown>;
    context?: Record<string, unknown>;
  } = {},
): CovenantCheckResult {
  const subject: CovenantSubject = {
    userId: options.userId,
    roles,
    tenantId: options.tenantId,
    attributes: options.subjectAttributes,
  };

  const resource: CovenantResource = {
    type: resourceType,
    id: options.resourceId ?? null,
    domain: (options.domain as CovenantResource['domain']) ?? null,
    actionClass: options.actionClass ?? null,
    attributes: options.resourceAttributes,
  };

  const request: CovenantRequest = {
    subject,
    resource,
    action,
    context: options.context,
  };

  const decision = covenantEngine.evaluate(request);
  return { allowed: decision.allowed, decision, reason: decision.reason };
}

export function assertPermission(
  roles: PrismRole[],
  action: CovenantPermission,
  resourceType: string,
  options: Parameters<typeof checkPermission>[3] = {},
): void {
  const result = checkPermission(roles, action, resourceType, options);
  if (!result.allowed) {
    const err = new Error(
      result.reason ?? `COVENANT: Permission denied — action '${action}' on '${resourceType}'`,
    );
    Object.assign(err, { code: 'COVENANT_DENIED', decision: result.decision });
    throw err;
  }
}

export function getRecentDecisions(limit = 50): CovenantDecision[] {
  return covenantEngine.getDecisionLog({ limit });
}

export function getDeniedDecisions(limit = 50): CovenantDecision[] {
  return covenantEngine.getDecisionLog({ limit, effect: 'deny' });
}

export interface CovenantVisibleDecision {
  requestId: string;
  effect: 'allow' | 'deny';
  action: CovenantPermission;
  resourceType: string;
  domain?: string | null;
  reason?: string;
  matchedPolicies: string[];
  evaluatedAt: number;
}

export function formatDecisionForUI(decision: CovenantDecision): CovenantVisibleDecision {
  return {
    requestId: decision.requestId,
    effect: decision.effect,
    action: decision.action,
    resourceType: decision.resource.type,
    domain: decision.resource.domain ?? null,
    reason: decision.reason,
    matchedPolicies: decision.matchedPolicies,
    evaluatedAt: decision.evaluatedAt,
  };
}
