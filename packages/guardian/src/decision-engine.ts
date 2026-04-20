import type {
  DecisionRequest,
  DecisionResult,
  EvaluateResult,
  GuardianRule,
  RuleCondition,
} from './schema.js';
import {
  type PolicyTier,
  PolicyTierSchema,
  TIER_CONTROLS,
  TIER_RISK_LEVEL,
  type TierControlSet,
} from './tiers.js';

/**
 * Per-call override of the tier metadata the engine uses for a single
 * decision. Lets callers (e.g. the api-server) supply org-specific tier
 * controls and risk level resolved from the persisted `guardian_tiers`
 * table, overriding the in-process constants in `tiers.ts`.
 *
 * Either field may be omitted; missing fields fall back to the constant.
 */
export interface TierOverride {
  controls?: TierControlSet;
  riskLevel?: number;
}

function resolveControls(tier: PolicyTier, override?: TierOverride): TierControlSet {
  return override?.controls ?? TIER_CONTROLS[tier];
}

function resolveRiskLevel(tier: PolicyTier, override?: TierOverride): number {
  return override?.riskLevel ?? TIER_RISK_LEVEL[tier];
}

function evaluateCondition(condition: RuleCondition, context: Record<string, unknown>): boolean {
  const actual = context[condition.field];
  switch (condition.operator) {
    case 'eq':
      return actual === condition.value;
    case 'neq':
      return actual !== condition.value;
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(actual);
    case 'nin':
      return Array.isArray(condition.value) && !condition.value.includes(actual);
    case 'gt':
      return (
        typeof actual === 'number' &&
        typeof condition.value === 'number' &&
        actual > condition.value
      );
    case 'lt':
      return (
        typeof actual === 'number' &&
        typeof condition.value === 'number' &&
        actual < condition.value
      );
    case 'gte':
      return (
        typeof actual === 'number' &&
        typeof condition.value === 'number' &&
        actual >= condition.value
      );
    case 'lte':
      return (
        typeof actual === 'number' &&
        typeof condition.value === 'number' &&
        actual <= condition.value
      );
    case 'matches':
      return (
        typeof actual === 'string' &&
        typeof condition.value === 'string' &&
        new RegExp(condition.value).test(actual)
      );
    case 'exists':
      return actual !== undefined && actual !== null;
    default:
      return false;
  }
}

function ruleMatchesRequest(rule: GuardianRule, request: DecisionRequest): boolean {
  if (!rule.enabled) return false;
  if (request.tier && rule.tier !== request.tier) return false;
  const ctx = {
    action: request.action,
    domain: request.domain,
    agentId: request.agentId,
    toolId: request.toolId,
    model: request.model,
    environment: request.environment,
    actionCount: request.actionCount,
    ...request.context,
  };
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

  decide(request: DecisionRequest, override?: TierOverride): DecisionResult {
    const decidedAt = new Date().toISOString();

    if (!request.tier) {
      return {
        requestId: request.requestId,
        outcome: 'deny',
        reason: 'Deny-by-default: no policy tier set on request',
        requiredApprovers: [],
        decidedAt,
      };
    }

    const tierRisk = resolveRiskLevel(request.tier as PolicyTier, override);
    if (tierRisk >= 4) {
      const controls = resolveControls(request.tier as PolicyTier, override);
      if (controls.approvalGate === 'dual') {
        return {
          requestId: request.requestId,
          outcome: 'require-dual-approval' as const,
          reason: `Policy tier '${request.tier}' requires dual human approval (operator + executive)`,
          requiredApprovers: ['operator', 'executive'],
          decidedAt,
        };
      }
    }

    for (const rule of this.rules) {
      if (ruleMatchesRequest(rule, request)) {
        const isDualRule = rule.action === 'require-dual-approval' || rule.action === 'escalate';
        const outcome =
          rule.action === 'log' || rule.action === 'redact'
            ? ('allow' as const)
            : rule.action === 'block' || rule.action === 'deny'
              ? ('deny' as const)
              : isDualRule
                ? ('require-dual-approval' as const)
                : (rule.action as 'allow' | 'deny' | 'require-approval');
        return {
          requestId: request.requestId,
          outcome,
          matchedRuleId: rule.id,
          reason: rule.description ?? `Matched rule: ${rule.name}`,
          requiredApprovers: isDualRule
            ? ['operator', 'executive']
            : rule.action === 'require-approval'
              ? ['approver']
              : [],
          decidedAt,
        };
      }
    }

    const tierParsed = PolicyTierSchema.safeParse(request.tier);
    if (tierParsed.success) {
      const tierControls = resolveControls(tierParsed.data, override);
      if (tierControls.approvalGate === 'single') {
        return {
          requestId: request.requestId,
          outcome: 'require-approval',
          reason: `Tier '${request.tier}' requires operator approval for unmatched actions`,
          requiredApprovers: ['operator'],
          decidedAt,
        };
      }
    }

    return {
      requestId: request.requestId,
      outcome: 'deny',
      reason: 'Deny-by-default: no matching allow rule found',
      requiredApprovers: [],
      decidedAt,
    };
  }

  evaluate(request: DecisionRequest, override?: TierOverride): EvaluateResult {
    const decidedAt = new Date().toISOString();
    const controlViolations: string[] = [];
    let rollbackRequired = false;
    let redactApplied = false;

    if (!request.tier) {
      return {
        requestId: request.requestId,
        outcome: 'block',
        reason: 'Block-by-default: no policy tier set on request',
        requiredApprovers: [],
        rollbackRequired: false,
        redactApplied: false,
        controlViolations: ['missing-tier'],
        decidedAt,
      };
    }

    const tierParsed = PolicyTierSchema.safeParse(request.tier);
    if (!tierParsed.success) {
      return {
        requestId: request.requestId,
        outcome: 'block',
        reason: `Block: unknown tier '${request.tier}'`,
        requiredApprovers: [],
        rollbackRequired: false,
        redactApplied: false,
        controlViolations: ['unknown-tier'],
        decidedAt,
      };
    }

    const tier = tierParsed.data;
    const controls = resolveControls(tier, override);

    rollbackRequired = controls.requiresRollback;
    redactApplied = controls.redactPII;

    if (!controls.allowMemoryWrite && request.memoryScope) {
      controlViolations.push('memory-write-not-allowed');
    }

    if (!controls.allowExternalComms && request.isExternalComms) {
      controlViolations.push('external-comms-blocked');
    }

    if (controls.allowedEnvironments.length > 0 && request.environment) {
      if (!controls.allowedEnvironments.includes(request.environment)) {
        controlViolations.push(`environment-not-allowed:${request.environment}`);
      }
    }

    if (controls.maxActionsPerSession !== null && request.actionCount !== undefined) {
      if (request.actionCount >= controls.maxActionsPerSession) {
        controlViolations.push(
          `action-limit-exceeded:${request.actionCount}/${controls.maxActionsPerSession}`,
        );
      }
    }

    if (controls.allowedModels !== null && request.model) {
      if (!controls.allowedModels.includes(request.model)) {
        controlViolations.push(`model-not-allowlisted:${request.model}`);
      }
    }

    if (controls.allowedTools !== null && request.toolId) {
      if (!controls.allowedTools.includes(request.toolId)) {
        controlViolations.push(`tool-not-allowlisted:${request.toolId}`);
      }
    }

    const ruleViolations = controlViolations.filter(
      (v) =>
        v === 'external-comms-blocked' ||
        v.startsWith('environment-not-allowed') ||
        v.startsWith('action-limit-exceeded') ||
        v.startsWith('model-not-allowlisted') ||
        v.startsWith('tool-not-allowlisted'),
    );

    if (ruleViolations.length > 0) {
      return {
        requestId: request.requestId,
        outcome: 'block',
        reason: `Blocked by tier control violations: ${ruleViolations.join(', ')}`,
        requiredApprovers: [],
        rollbackRequired,
        redactApplied,
        controlViolations,
        decidedAt,
      };
    }

    if (controlViolations.includes('memory-write-not-allowed')) {
      return {
        requestId: request.requestId,
        outcome: 'block',
        reason: 'Memory write not permitted at this autonomy tier',
        requiredApprovers: [],
        rollbackRequired,
        redactApplied,
        controlViolations,
        decidedAt,
      };
    }

    if (controls.approvalGate === 'dual') {
      return {
        requestId: request.requestId,
        outcome: 'require-dual-approval',
        reason: `Tier '${tier}' requires dual approval (operator + executive)`,
        requiredApprovers: ['operator', 'executive'],
        rollbackRequired,
        redactApplied,
        controlViolations,
        decidedAt,
      };
    }

    for (const rule of this.rules) {
      if (ruleMatchesRequest(rule, request)) {
        if (
          rule.allowedModels !== undefined &&
          request.model &&
          !rule.allowedModels.includes(request.model)
        ) {
          controlViolations.push(`rule-model-not-allowlisted:${request.model}`);
          return {
            requestId: request.requestId,
            outcome: 'block',
            reason: `Rule '${rule.id}' does not allow model '${request.model}'`,
            requiredApprovers: [],
            rollbackRequired,
            redactApplied,
            controlViolations,
            matchedRuleId: rule.id,
            decidedAt,
          };
        }

        if (
          rule.allowedTools !== undefined &&
          request.toolId &&
          !rule.allowedTools.includes(request.toolId)
        ) {
          controlViolations.push(`rule-tool-not-allowlisted:${request.toolId}`);
          return {
            requestId: request.requestId,
            outcome: 'block',
            reason: `Rule '${rule.id}' does not allow tool '${request.toolId}'`,
            requiredApprovers: [],
            rollbackRequired,
            redactApplied,
            controlViolations,
            matchedRuleId: rule.id,
            decidedAt,
          };
        }

        if (rule.action === 'allow' || rule.action === 'log') {
          if (controls.approvalGate === 'single') {
            return {
              requestId: request.requestId,
              outcome: 'require-approval',
              reason: `Tier '${tier}' requires single operator approval`,
              requiredApprovers: ['operator'],
              rollbackRequired,
              redactApplied,
              controlViolations,
              matchedRuleId: rule.id,
              decidedAt,
            };
          }
          return {
            requestId: request.requestId,
            outcome: 'allow',
            matchedRuleId: rule.id,
            reason: rule.description ?? `Matched rule: ${rule.name}`,
            requiredApprovers: [],
            rollbackRequired,
            redactApplied,
            controlViolations,
            decidedAt,
          };
        }

        if (rule.action === 'require-approval') {
          if (controls.approvalGate === 'single') {
            return {
              requestId: request.requestId,
              outcome: 'require-approval',
              matchedRuleId: rule.id,
              reason: rule.description ?? `Rule requires approval: ${rule.name}`,
              requiredApprovers: ['operator'],
              rollbackRequired,
              redactApplied,
              controlViolations,
              decidedAt,
            };
          }
          return {
            requestId: request.requestId,
            outcome: 'require-approval',
            matchedRuleId: rule.id,
            reason: rule.description ?? `Rule requires approval: ${rule.name}`,
            requiredApprovers: ['approver'],
            rollbackRequired,
            redactApplied,
            controlViolations,
            decidedAt,
          };
        }

        if (rule.action === 'require-dual-approval' || rule.action === 'escalate') {
          return {
            requestId: request.requestId,
            outcome: 'require-dual-approval',
            matchedRuleId: rule.id,
            reason: rule.description ?? `Rule requires dual approval: ${rule.name}`,
            requiredApprovers: ['operator', 'executive'],
            rollbackRequired,
            redactApplied,
            controlViolations,
            decidedAt,
          };
        }

        if (rule.action === 'deny' || rule.action === 'block' || rule.action === 'redact') {
          return {
            requestId: request.requestId,
            outcome: 'block',
            matchedRuleId: rule.id,
            reason: rule.description ?? `Rule blocks action: ${rule.name}`,
            requiredApprovers: [],
            rollbackRequired,
            redactApplied: rule.action === 'redact' ? true : redactApplied,
            controlViolations,
            decidedAt,
          };
        }
      }
    }

    if (controls.approvalGate === 'single') {
      return {
        requestId: request.requestId,
        outcome: 'require-approval',
        reason: `Tier '${tier}' requires operator approval for unmatched actions`,
        requiredApprovers: ['operator'],
        rollbackRequired,
        redactApplied,
        controlViolations,
        decidedAt,
      };
    }

    return {
      requestId: request.requestId,
      outcome: 'block',
      reason: 'Block-by-default: no matching allow rule found',
      requiredApprovers: [],
      rollbackRequired,
      redactApplied,
      controlViolations,
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
    action: 'allow',
    priority: 999,
    enabled: true,
    tags: ['default'],
  });
}
