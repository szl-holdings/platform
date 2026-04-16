import type { Policy, PolicyRule, PolicyCondition, EvaluationRequest, PolicyEvaluationResult, PolicyEffect } from "./types.js";

const EFFECT_PRIORITY: Record<PolicyEffect, number> = {
  block: 100,
  escalate: 80,
  require_approval: 60,
  audit_only: 20,
  allow: 10,
};

function evaluateCondition(condition: PolicyCondition, context: Record<string, unknown>): boolean {
  const actualValue = context[condition.field];
  const expectedValue = condition.value;

  switch (condition.operator) {
    case "eq": return actualValue === expectedValue;
    case "neq": return actualValue !== expectedValue;
    case "gt": return typeof actualValue === "number" && actualValue > (expectedValue as number);
    case "gte": return typeof actualValue === "number" && actualValue >= (expectedValue as number);
    case "lt": return typeof actualValue === "number" && actualValue < (expectedValue as number);
    case "lte": return typeof actualValue === "number" && actualValue <= (expectedValue as number);
    case "in": return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
    case "not_in": return Array.isArray(expectedValue) && !expectedValue.includes(actualValue);
    case "contains": return typeof actualValue === "string" && actualValue.includes(String(expectedValue));
    case "matches": return typeof actualValue === "string" && new RegExp(String(expectedValue)).test(actualValue);
    default: return false;
  }
}

function evaluateRule(rule: PolicyRule, context: Record<string, unknown>): boolean {
  if (!rule.conditions || rule.conditions.length === 0) return true;
  return rule.conditions.every(c => evaluateCondition(c, context));
}

function buildEvaluationContext(request: EvaluationRequest): Record<string, unknown> {
  return {
    action: request.action,
    domain: request.domain,
    tenantId: request.tenantId ?? request.subject.tenantId,
    actionClass: request.actionClass,
    subjectRoles: request.subject.roles,
    subjectId: request.subject.id,
    resourceType: request.resource.type,
    resourceId: request.resource.id,
    resourceDomain: request.resource.domain,
    estimatedCostUsd: request.estimatedCostUsd,
    confidence: request.confidence,
    urgency: request.urgency,
    ...(request.context ?? {}),
    ...(request.resource.attributes ?? {}),
  };
}

function policyAppliesToRequest(policy: Policy, request: EvaluationRequest): boolean {
  if (!policy.isActive) return false;

  if (policy.scope === "tenant") {
    if (policy.tenantId && policy.tenantId !== (request.tenantId ?? request.subject.tenantId)) {
      return false;
    }
  }

  if (policy.scope === "domain" || policy.domain) {
    if (policy.domain && policy.domain !== request.domain && policy.domain !== request.resource.domain) {
      return false;
    }
  }

  if (policy.scope === "action" && policy.actionTypes) {
    if (!policy.actionTypes.includes(request.action) && !policy.actionTypes.includes(request.actionClass ?? "")) {
      return false;
    }
  }

  return true;
}

export function evaluatePolicies(
  policies: Policy[],
  request: EvaluationRequest
): PolicyEvaluationResult {
  const context = buildEvaluationContext(request);
  const applicable = policies
    .filter(p => policyAppliesToRequest(p, request))
    .sort((a, b) => b.priority - a.priority);

  const matchedPolicies: PolicyEvaluationResult["matchedPolicies"] = [];
  const violations: PolicyEvaluationResult["violations"] = [];

  let dominantEffect: PolicyEffect = "allow";
  let requiredApproverRole: string | undefined;
  let escalationTarget: string | undefined;

  for (const policy of applicable) {
    const sortedRules = [...policy.rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (!evaluateRule(rule, context)) continue;

      matchedPolicies.push({
        policyId: policy.id,
        ruleName: rule.name,
        effect: rule.effect,
      });

      if (rule.effect !== "allow" && rule.effect !== "audit_only") {
        violations.push({
          policyId: policy.id,
          policyName: policy.name,
          reason: rule.reason ?? `Rule '${rule.name}' in policy '${policy.name}' matched.`,
        });
      }

      if (EFFECT_PRIORITY[rule.effect] > EFFECT_PRIORITY[dominantEffect]) {
        dominantEffect = rule.effect;
        if (rule.effect === "require_approval" && rule.requiredApproverRole) {
          requiredApproverRole = rule.requiredApproverRole;
        }
        if (rule.effect === "escalate" && rule.escalateTo) {
          escalationTarget = rule.escalateTo;
        }
      }
    }
  }

  const allowed = dominantEffect === "allow" || dominantEffect === "audit_only";
  const requiresApproval = dominantEffect === "require_approval";

  const reasoning = buildReasoning(dominantEffect, matchedPolicies.length, violations.length, applicable.length);

  return {
    effect: dominantEffect,
    allowed,
    requiresApproval,
    requiredApproverRole,
    escalationTarget,
    matchedPolicies,
    violations,
    reasoning,
    evaluatedAt: Date.now(),
  };
}

function buildReasoning(effect: PolicyEffect, matchCount: number, violationCount: number, policiesEvaluated: number): string {
  const lines: string[] = [`Evaluated ${policiesEvaluated} applicable policies, matched ${matchCount} rules.`];
  if (effect === "block") {
    lines.push(`Action is BLOCKED by policy. ${violationCount} violation(s) detected.`);
  } else if (effect === "escalate") {
    lines.push("Action requires escalation per policy configuration.");
  } else if (effect === "require_approval") {
    lines.push("Action requires explicit human approval before execution.");
  } else if (effect === "audit_only") {
    lines.push("Action is permitted but will be recorded for audit purposes.");
  } else {
    lines.push("Action is permitted by applicable policies.");
  }
  return lines.join(" ");
}
