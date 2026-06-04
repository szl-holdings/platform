import { type AgentTierName, AGENT_TIER_DEFINITIONS, isRouteClassAllowedForTier, isToolAllowedForTier, requiresApproval } from './agent-tiers.js';
import { createLogger } from './logger.js';

const logger = createLogger('ai-control-plane:policy-engine');

export interface PolicyRequest {
  tier: AgentTierName;
  tool?: string;
  routeClass?: string;
  isHighRisk?: boolean;
  estimatedCostUsd?: number;
  promptText?: string;
  orgId?: string;
  agentId?: string;
}

export interface PolicyDecision {
  allowed: boolean;
  requiresApproval: boolean;
  approvalLevel: 'none' | 'operator' | 'manager' | 'executive';
  violations: PolicyViolation[];
  warnings: string[];
  effectiveTier: AgentTierName;
}

export interface PolicyViolation {
  code: string;
  message: string;
  severity: 'block' | 'warn';
}

export interface PolicyRule {
  id: string;
  description: string;
  condition: (req: PolicyRequest) => boolean;
  violation: Omit<PolicyViolation, 'code'> & { code: string };
  enabled: boolean;
}

const BUILT_IN_RULES: PolicyRule[] = [
  {
    id: 'tool-allowed',
    description: 'Verify tool is permitted for the agent tier',
    condition: (req) => !!(req.tool && !isToolAllowedForTier(req.tier, req.tool)),
    violation: {
      code: 'TOOL_NOT_PERMITTED',
      message: 'Tool is not permitted for this agent tier',
      severity: 'block',
    },
    enabled: true,
  },
  {
    id: 'route-class-allowed',
    description: 'Verify route class is permitted for the agent tier',
    condition: (req) => !!(req.routeClass && !isRouteClassAllowedForTier(req.tier, req.routeClass)),
    violation: {
      code: 'ROUTE_CLASS_NOT_PERMITTED',
      message: 'Route class is not permitted for this agent tier',
      severity: 'block',
    },
    enabled: true,
  },
  {
    id: 'cost-ceiling',
    description: 'Verify estimated cost does not exceed tier limit',
    condition: (req) => {
      const def = AGENT_TIER_DEFINITIONS[req.tier];
      return !!(req.estimatedCostUsd && req.estimatedCostUsd > def.maxCostPerRequestUsd);
    },
    violation: {
      code: 'COST_CEILING_EXCEEDED',
      message: 'Estimated cost exceeds tier maximum per-request limit',
      severity: 'block',
    },
    enabled: true,
  },
  {
    id: 'assistant-no-execute',
    description: 'Assistant tier cannot execute actions',
    condition: (req) =>
      req.tier === 'assistant' &&
      req.tool !== undefined &&
      ['execute_workflow', 'trigger_alert', 'update_record'].includes(req.tool),
    violation: {
      code: 'ASSISTANT_EXECUTION_BLOCKED',
      message: 'Assistant tier is read-only — action execution is not permitted',
      severity: 'block',
    },
    enabled: true,
  },
  {
    id: 'autonomous-requires-preauth',
    description: 'Autonomous tier operations require pre-authorization',
    condition: (req) => req.tier === 'autonomous' && req.isHighRisk === true,
    violation: {
      code: 'AUTONOMOUS_HIGH_RISK_WARNING',
      message: 'Autonomous tier high-risk action — ensure pre-authorization is on record',
      severity: 'warn',
    },
    enabled: true,
  },
];

function resolveApprovalLevel(
  req: PolicyRequest,
  violations: PolicyViolation[],
): PolicyDecision['approvalLevel'] {
  if (violations.some((v) => v.severity === 'block')) return 'none';
  if (!requiresApproval(req.tier, req.isHighRisk ?? false)) return 'none';
  const _def = AGENT_TIER_DEFINITIONS[req.tier];
  if (req.estimatedCostUsd && req.estimatedCostUsd > 5.0) return 'executive';
  if (req.tier === 'operator') return 'manager';
  return 'operator';
}

class PolicyEngine {
  private rules: PolicyRule[];

  constructor(rules: PolicyRule[] = BUILT_IN_RULES) {
    this.rules = [...rules];
  }

  addRule(rule: PolicyRule): void {
    this.rules.push(rule);
    logger.info({ ruleId: rule.id }, 'Policy rule added');
  }

  removeRule(id: string): void {
    this.rules = this.rules.filter((r) => r.id !== id);
  }

  evaluate(req: PolicyRequest): PolicyDecision {
    const violations: PolicyViolation[] = [];
    const warnings: string[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      if (rule.condition(req)) {
        violations.push({
          code: rule.violation.code,
          message: rule.violation.message,
          severity: rule.violation.severity,
        });
        if (rule.violation.severity === 'warn') {
          warnings.push(rule.violation.message);
        }
      }
    }

    const blockers = violations.filter((v) => v.severity === 'block');
    const allowed = blockers.length === 0;
    const needsApproval = allowed && requiresApproval(req.tier, req.isHighRisk ?? false);

    const decision: PolicyDecision = {
      allowed,
      requiresApproval: needsApproval,
      approvalLevel: resolveApprovalLevel(req, violations),
      violations,
      warnings,
      effectiveTier: req.tier,
    };

    if (!allowed) {
      logger.warn(
        { tier: req.tier, tool: req.tool, blockers: blockers.map((b) => b.code) },
        'Policy blocked request',
      );
    } else if (needsApproval) {
      logger.info(
        { tier: req.tier, approvalLevel: decision.approvalLevel },
        'Policy: approval required',
      );
    }

    return decision;
  }

  listRules(): PolicyRule[] {
    return [...this.rules];
  }
}

export const policyEngine = new PolicyEngine();

export function evaluatePolicy(req: PolicyRequest): PolicyDecision {
  return policyEngine.evaluate(req);
}

export { PolicyEngine };
