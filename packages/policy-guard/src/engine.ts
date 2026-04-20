/**
 * AEEP Policy Guard — Evaluation Engine
 *
 * Evaluates policy check requests against a set of rules.
 * Rules are matched by actionType, toolId, and agentRole.
 *
 * Verdict precedence: blocked > requires-approval > allowed
 */
import type {
  PolicyRule,
  PolicyCheckRequest,
  PolicyCheckResult,
  PolicyVerdict,
} from "@szl-holdings/shared-contracts";

let _requestCounter = 0;
function generateRequestId(): string {
  return `pcr_${Date.now()}_${(++_requestCounter).toString().padStart(4, "0")}`;
}

export interface PolicyGuardEngineOptions {
  /**
   * Controls unmatched-rule behavior (default: true — deny-by-default).
   *
   * `true`  — SECURE. No-match → "requires-approval". Use everywhere that executes
   *            agentic actions, workflow steps, or writes. Recommended for all surfaces.
   *
   * `false` — PERMISSIVE. No-match → "allowed". Only safe for read-only eval surfaces
   *            where every request should pass unless explicitly blocked (e.g. a
   *            search-only query router with a curated deny list).
   *            Must be justified at call site with a comment explaining why.
   */
  strictMode?: boolean;
}

export class PolicyGuardEngine {
  private readonly rules: PolicyRule[];
  private readonly strictMode: boolean;

  constructor(rules: PolicyRule[], options: PolicyGuardEngineOptions = {}) {
    this.rules = rules;
    this.strictMode = options.strictMode ?? true;
  }

  evaluate(request: PolicyCheckRequest): PolicyCheckResult {
    const requestId = generateRequestId();
    const matchingRules = this.rules.filter((rule) =>
      this.matchesRule(rule, request),
    );

    if (matchingRules.length === 0) {
      if (this.strictMode) {
        return {
          requestId,
          verdict: "requires-approval",
          reason: "No matching policy rule. Strict mode: defaulting to requires-approval.",
          traceId: request.traceId,
          evaluatedAt: new Date().toISOString(),
        };
      }
      return {
        requestId,
        verdict: "allowed",
        reason: "No policy rules matched. Default pass-through (read/eval operations).",
        traceId: request.traceId,
        evaluatedAt: new Date().toISOString(),
      };
    }

    const blocked = matchingRules.find((r) => r.verdict === "blocked");
    if (blocked) {
      return {
        requestId,
        verdict: "blocked",
        matchedPolicyId: blocked.policyId,
        reason: blocked.description,
        traceId: request.traceId,
        evaluatedAt: new Date().toISOString(),
      };
    }

    const requiresApproval = matchingRules.find((r) => r.verdict === "requires-approval");
    if (requiresApproval) {
      const approvalId = `apr_${Date.now()}`;
      return {
        requestId,
        verdict: "requires-approval",
        matchedPolicyId: requiresApproval.policyId,
        reason: requiresApproval.description,
        ...(requiresApproval.requiresApprovalFrom !== undefined
          ? { requiresApprovalFrom: requiresApproval.requiresApprovalFrom }
          : {}),
        approvalId,
        traceId: request.traceId,
        evaluatedAt: new Date().toISOString(),
      };
    }

    const firstMatch = matchingRules[0];
    return {
      requestId,
      verdict: "allowed",
      ...(firstMatch !== undefined ? { matchedPolicyId: firstMatch.policyId } : {}),
      traceId: request.traceId,
      evaluatedAt: new Date().toISOString(),
    };
  }

  private matchesRule(rule: PolicyRule, request: PolicyCheckRequest): boolean {
    return rule.conditions.some((condition) => {
      if (condition.startsWith("action:")) {
        return request.actionType === condition.slice("action:".length);
      }
      if (condition.startsWith("tool:")) {
        return request.toolId === condition.slice("tool:".length);
      }
      if (condition.startsWith("role:")) {
        return request.agentRole === condition.slice("role:".length);
      }
      if (condition.startsWith("workflow:")) {
        return request.workflowId === condition.slice("workflow:".length);
      }
      if (condition.startsWith("resource_type:")) {
        return request.resourceType === condition.slice("resource_type:".length);
      }
      return false;
    });
  }
}

/**
 * Baseline AEEP policy rules.
 * Override in production by constructing PolicyGuardEngine with domain-specific rules.
 */
export const BASELINE_POLICY_RULES: PolicyRule[] = [
  {
    policyId: "POL-001",
    description: "Index rebuild on production profiles requires operator approval.",
    tier: "high",
    conditions: ["action:rebuild_index", "workflow:rebuild_index"],
    verdict: "requires-approval",
    requiresApprovalFrom: ["operator"],
    auditRequired: true,
  },
  {
    policyId: "POL-002",
    description: "Profile version rotation requires operator approval.",
    tier: "critical",
    conditions: ["action:rotate_profile_version", "workflow:rotate_profile_version"],
    verdict: "requires-approval",
    requiresApprovalFrom: ["operator", "owner"],
    auditRequired: true,
  },
  {
    policyId: "POL-003",
    description: "Executive briefs require approval before delivery.",
    tier: "medium",
    conditions: ["action:deliver_brief", "workflow:prepare_executive_brief"],
    verdict: "requires-approval",
    requiresApprovalFrom: ["reviewer"],
    auditRequired: true,
  },
  {
    policyId: "POL-004",
    description: "Bulk memory deletion is blocked. Use targeted expiry instead.",
    tier: "high",
    conditions: ["action:memory.deleteAll"],
    verdict: "blocked",
    auditRequired: true,
  },
  {
    policyId: "POL-005",
    description: "Index namespace clear requires approval.",
    tier: "high",
    conditions: ["tool:index.clearNamespace"],
    verdict: "requires-approval",
    requiresApprovalFrom: ["operator"],
    auditRequired: true,
  },
];
