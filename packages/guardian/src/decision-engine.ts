import type { GuardianRule, DecisionRequest, DecisionResult, RuleCondition } from "./schema.js";
import { TIER_RISK_LEVEL, type PolicyTier } from "./tiers.js";

function evaluateCondition(condition: RuleCondition, context: Record<string, unknown>): boolean {
  const actual = context[condition.field];
  switch (condition.operator) {
    case "eq":
      return actual === condition.value;
    case "neq":
      return actual !== condition.value;
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(actual);
    case "nin":
      return Array.isArray(condition.value) && !condition.value.includes(actual);
    case "gt":
      return typeof actual === "number" && typeof condition.value === "number" && actual > condition.value;
    case "lt":
      return typeof actual === "number" && typeof condition.value === "number" && actual < condition.value;
    case "gte":
      return typeof actual === "number" && typeof condition.value === "number" && actual >= condition.value;
    case "lte":
      return typeof actual === "number" && typeof condition.value === "number" && actual <= condition.value;
    case "matches":
      return typeof actual === "string" && typeof condition.value === "string" && new RegExp(condition.value).test(actual);
    case "exists":
      return actual !== undefined && actual !== null;
    default:
      return false;
  }
}

function ruleMatchesRequest(rule: GuardianRule, request: DecisionRequest): boolean {
  if (!rule.enabled) return false;
  if (request.tier && rule.tier !== request.tier) return false;
  const ctx = { action: request.action, domain: request.domain, agentId: request.agentId, ...request.context };
  return rule.conditions.every((c) => evaluateCondition(c, ctx as Record<string, unknown>));
}

export class GuardianDecisionEngine {
  private rules: GuardianRule[] = [];

  addRule(rule: GuardianRule): void {
    const idx = this.rules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      this.rules[idx] = rule;
    } else {
      this.rules.push(rule);
    }
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  removeRule(ruleId: string): boolean {
    const idx = this.rules.findIndex((r) => r.id === ruleId);
    if (idx >= 0) {
      this.rules.splice(idx, 1);
      return true;
    }
    return false;
  }

  getRules(): GuardianRule[] {
    return [...this.rules];
  }

  decide(request: DecisionRequest): DecisionResult {
    const decidedAt = new Date().toISOString();

    if (!request.tier) {
      return {
        requestId: request.requestId,
        outcome: "deny",
        reason: "Deny-by-default: no policy tier set on request",
        requiredApprovers: [],
        decidedAt,
      };
    }

    const tierRisk = TIER_RISK_LEVEL[request.tier as PolicyTier];
    if (tierRisk >= 8) {
      return {
        requestId: request.requestId,
        outcome: "require-approval",
        reason: "Policy tier 'human-approval-mandatory' always requires explicit human approval",
        requiredApprovers: ["human-approver"],
        decidedAt,
      };
    }

    for (const rule of this.rules) {
      if (ruleMatchesRequest(rule, request)) {
        return {
          requestId: request.requestId,
          outcome: rule.action === "log" ? "allow" : rule.action === "escalate" ? "require-approval" : rule.action === "redact" ? "allow" : rule.action,
          matchedRuleId: rule.id,
          reason: rule.description ?? `Matched rule: ${rule.name}`,
          requiredApprovers: rule.action === "require-approval" ? ["approver"] : [],
          decidedAt,
        };
      }
    }

    return {
      requestId: request.requestId,
      outcome: "deny",
      reason: "Deny-by-default: no matching allow rule found",
      requiredApprovers: [],
      decidedAt,
    };
  }
}

export const defaultDecisionEngine = new GuardianDecisionEngine();

export function addDefaultAllowRule(tier: PolicyTier): void {
  defaultDecisionEngine.addRule({
    id: `default-allow-${tier}`,
    name: `Default allow for ${tier}`,
    tier,
    conditions: [],
    action: "allow",
    priority: 999,
    enabled: true,
    tags: ["default"],
  });
}
