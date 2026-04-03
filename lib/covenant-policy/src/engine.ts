import type { PrismDomain, PrismPermission, PrismRole } from "@szl-holdings/prism-bus";

export type CovenantEffect = "allow" | "deny";

export type CovenantPermission = PrismPermission;
export type CovenantRole = PrismRole;

export interface CovenantPolicy {
  id: string;
  name: string;
  description?: string;
  version: string;
  roles: CovenantRole[];
  domains: PrismDomain[];
  permissions: CovenantPermission[];
  conditions?: CovenantCondition[];
  effect: CovenantEffect;
  priority?: number;
  expiresAt?: number | null;
  metadata?: Record<string, unknown>;
}

export interface CovenantCondition {
  type: "time_window" | "ip_range" | "domain_match" | "action_class" | "attribute_match";
  field?: string;
  operator: "eq" | "neq" | "in" | "nin" | "gt" | "lt" | "contains" | "matches";
  value: unknown;
}

export interface CovenantSubject {
  userId?: string | null;
  roles: CovenantRole[];
  tenantId?: string | null;
  attributes?: Record<string, unknown>;
}

export interface CovenantResource {
  type: string;
  id?: string | null;
  domain?: PrismDomain | null;
  actionClass?: string | null;
  attributes?: Record<string, unknown>;
}

export interface CovenantRequest {
  subject: CovenantSubject;
  resource: CovenantResource;
  action: CovenantPermission;
  context?: Record<string, unknown>;
}

export interface CovenantDecision {
  requestId: string;
  effect: CovenantEffect;
  allowed: boolean;
  matchedPolicies: string[];
  deniedBy?: string | null;
  reason?: string;
  evaluatedAt: number;
  durationMs: number;
  subject: CovenantSubject;
  resource: CovenantResource;
  action: CovenantPermission;
}

const HIGH_RISK_ACTIONS = new Set([
  "deploy",
  "delete_tenant",
  "export_all",
  "modify_policy",
  "escalate_privilege",
  "bypass_sandbox",
  "force_approve",
  "purge_data",
  "external_transfer",
  "modify_audit_log",
]);

export class CovenantPolicyEngine {
  private policies: Map<string, CovenantPolicy> = new Map();
  private decisionLog: CovenantDecision[] = [];
  private readonly MAX_DECISION_LOG = 1000;

  register(policy: CovenantPolicy): void {
    this.policies.set(policy.id, policy);
  }

  unregister(policyId: string): void {
    this.policies.delete(policyId);
  }

  evaluate(request: CovenantRequest): CovenantDecision {
    const startedAt = Date.now();
    const requestId = `cov-req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const now = Date.now();
    const applicablePolicies = Array.from(this.policies.values())
      .filter(p => {
        if (p.expiresAt != null && p.expiresAt < now) return false;
        const roleMatch = p.roles.length === 0 || request.subject.roles.some(r => p.roles.includes(r));
        const domainMatch =
          p.domains.length === 0 ||
          !request.resource.domain ||
          p.domains.includes(request.resource.domain) ||
          p.domains.includes("global" as PrismDomain);
        const permissionMatch = p.permissions.includes(request.action);
        return roleMatch && domainMatch && permissionMatch;
      })
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    let effect: CovenantEffect = "deny";
    let deniedBy: string | null = null;
    let reason: string | undefined;
    const matchedPolicies: string[] = [];

    for (const policy of applicablePolicies) {
      if (!this.evaluateConditions(policy.conditions ?? [], request)) continue;

      matchedPolicies.push(policy.id);

      if (policy.effect === "deny") {
        effect = "deny";
        deniedBy = policy.id;
        reason = `Denied by policy: ${policy.name}`;
        break;
      }

      if (policy.effect === "allow") {
        effect = "allow";
        reason = `Allowed by policy: ${policy.name}`;
      }
    }

    if (matchedPolicies.length === 0) {
      effect = "deny";
      reason = "No applicable policy found (default deny)";
    }

    if (
      effect === "allow" &&
      request.context?.actionName &&
      HIGH_RISK_ACTIONS.has(String(request.context.actionName))
    ) {
      const hasApproverRole = request.subject.roles.some(r =>
        (["approver", "tenant_admin", "super_admin"] as CovenantRole[]).includes(r)
      );
      if (!hasApproverRole) {
        effect = "deny";
        deniedBy = "covenant:high-risk-action-guard";
        reason = `High-risk action '${request.context.actionName}' requires approver or admin role`;
      }
    }

    const decision: CovenantDecision = {
      requestId,
      effect,
      allowed: effect === "allow",
      matchedPolicies,
      deniedBy: deniedBy ?? null,
      reason,
      evaluatedAt: startedAt,
      durationMs: Date.now() - startedAt,
      subject: request.subject,
      resource: request.resource,
      action: request.action,
    };

    this.decisionLog.unshift(decision);
    if (this.decisionLog.length > this.MAX_DECISION_LOG) {
      this.decisionLog.length = this.MAX_DECISION_LOG;
    }

    return decision;
  }

  simulate(request: CovenantRequest): { decision: CovenantDecision; explanation: string[] } {
    const decision = this.evaluate(request);
    const explanation: string[] = [];

    explanation.push(`COVENANT POLICY ENGINE — Simulation`);
    explanation.push(`Subject roles: [${request.subject.roles.join(", ")}]`);
    explanation.push(`Resource: ${request.resource.type}${request.resource.domain ? ` in domain '${request.resource.domain}'` : ""}`);
    explanation.push(`Action: ${request.action}`);
    explanation.push(`Effect: ${decision.effect.toUpperCase()}`);
    if (decision.reason) explanation.push(`Reason: ${decision.reason}`);
    if (decision.matchedPolicies.length > 0) {
      explanation.push(`Matched policies: ${decision.matchedPolicies.join(", ")}`);
    } else {
      explanation.push("No policies matched — default deny applied");
    }

    return { decision, explanation };
  }

  private evaluateConditions(conditions: CovenantCondition[], request: CovenantRequest): boolean {
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, request)) return false;
    }
    return true;
  }

  private evaluateCondition(condition: CovenantCondition, request: CovenantRequest): boolean {
    try {
      switch (condition.type) {
        case "time_window": {
          const now = new Date();
          const hour = now.getHours();
          const range = condition.value as { start: number; end: number };
          if (condition.operator === "in") {
            return hour >= range.start && hour <= range.end;
          }
          return true;
        }
        case "domain_match": {
          if (condition.operator === "eq") {
            return request.resource.domain === condition.value;
          }
          if (condition.operator === "in") {
            return (condition.value as string[]).includes(request.resource.domain ?? "");
          }
          return true;
        }
        case "action_class": {
          if (condition.operator === "eq") {
            return request.resource.actionClass === condition.value;
          }
          if (condition.operator === "in") {
            return (condition.value as string[]).includes(request.resource.actionClass ?? "");
          }
          return true;
        }
        case "attribute_match": {
          const attrs = {
            ...request.subject.attributes,
            ...request.resource.attributes,
            ...request.context,
          };
          const fieldValue = condition.field ? attrs[condition.field] : undefined;
          if (condition.operator === "eq") return fieldValue === condition.value;
          if (condition.operator === "neq") return fieldValue !== condition.value;
          if (condition.operator === "in") return (condition.value as unknown[]).includes(fieldValue);
          if (condition.operator === "contains" && typeof fieldValue === "string") {
            return fieldValue.includes(String(condition.value));
          }
          return true;
        }
        default:
          return true;
      }
    } catch {
      return false;
    }
  }

  getDecisionLog(options: {
    limit?: number;
    effect?: CovenantEffect;
    action?: CovenantPermission;
  } = {}): CovenantDecision[] {
    let results = this.decisionLog;
    if (options.effect) results = results.filter(d => d.effect === options.effect);
    if (options.action) results = results.filter(d => d.action === options.action);
    return results.slice(0, options.limit ?? 100);
  }

  getPolicies(): CovenantPolicy[] {
    return Array.from(this.policies.values());
  }

  getPolicy(id: string): CovenantPolicy | undefined {
    return this.policies.get(id);
  }

  isHighRiskAction(actionName: string): boolean {
    return HIGH_RISK_ACTIONS.has(actionName);
  }

  getHighRiskActions(): string[] {
    return Array.from(HIGH_RISK_ACTIONS);
  }

  getStats() {
    const total = this.decisionLog.length;
    const allowed = this.decisionLog.filter(d => d.allowed).length;
    const denied = total - allowed;
    return { total, allowed, denied, policyCount: this.policies.size };
  }
}

export const covenantEngine = new CovenantPolicyEngine();
