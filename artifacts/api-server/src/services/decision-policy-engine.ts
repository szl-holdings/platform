/**
 * Decision Policy Engine — Thin Adapter over @szl-holdings/policy-engine
 *
 * Loads workspace constitutions from the DB, converts them to the canonical
 * Policy format expected by the policy-engine package, and delegates all
 * evaluation to `evaluatePolicies`.  This service is the single source of
 * truth for workspace-constitution-based governance; the policy-engine package
 * (`evaluatePolicies`) is the single source of truth for evaluation logic.
 */

import { db, workspaceConstitutionsTable } from '@szl-holdings/db';
import {
  evaluatePolicies,
  type EvaluationRequest,
  type Policy,
  type PolicyCondition,
  type PolicyEvaluationResult,
  type PolicyRule,
} from '@szl-holdings/policy-engine';
import { and, eq } from 'drizzle-orm';
import { logger } from '../lib/logger';

// ─── Public Types (kept stable for callers) ──────────────────────────────────

export interface ConstitutionRules {
  workspaceId: string;
  version: string;
  name: string;
  requiredApprovals: Record<string, { roles: string[]; sla_minutes: number }>;
  actionRedlines: string[];
  autonomyCeilings: Record<string, string>;
  confidenceFloor: number;
  freshnessMaxHours: number;
  extraRules: Record<string, unknown>;
}

export type PolicyDecision = 'allow' | 'require-approval' | 'block';

export interface PolicyEvaluation {
  decision: PolicyDecision;
  reasons: string[];
  requiredApproverRoles?: string[];
  slaMinutes?: number;
  appliedConstitutionVersion?: string;
  simulationMode?: boolean;
  /** Raw result from the policy-engine evaluator for audit purposes. */
  evaluatorResult?: PolicyEvaluationResult;
}

export interface DecisionInput {
  cardId: string;
  workspaceId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  autonomyMode: 'observe' | 'recommend' | 'draft' | 'execute-with-approval' | 'auto-execute';
  recommendedAction?: string;
  confidence: number;
  freshnessMaxAgeHours?: number;
}

// ─── Default constitution (fallback when no DB record exists) ─────────────────

const DEFAULT_CONSTITUTION: Omit<ConstitutionRules, 'workspaceId' | 'name'> = {
  version: 'default-1.0',
  requiredApprovals: {
    'execute-with-approval': { roles: ['operator', 'admin', 'owner'], sla_minutes: 60 },
    'auto-execute': { roles: [], sla_minutes: 0 },
  },
  actionRedlines: [
    'notify_external_party',
    'delete_record',
    'submit_regulatory_filing',
    'send_external_communication',
  ],
  autonomyCeilings: {
    critical: 'execute-with-approval',
    high: 'execute-with-approval',
    medium: 'recommend',
    low: 'auto-execute',
  },
  confidenceFloor: 0.7,
  freshnessMaxHours: 48,
  extraRules: {},
};

// ─── In-memory constitution cache (TTL: 5 min) ──────────────────────────────

interface CacheEntry {
  rules: ConstitutionRules;
  expiresAt: number;
}
const constitutionCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function loadConstitution(workspaceId: string): Promise<ConstitutionRules> {
  const cached = constitutionCache.get(workspaceId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.rules;
  }

  try {
    const rows = await db
      .select()
      .from(workspaceConstitutionsTable)
      .where(
        and(
          eq(workspaceConstitutionsTable.workspaceId, workspaceId),
          eq(workspaceConstitutionsTable.isActive, true),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      const fallback: ConstitutionRules = {
        ...DEFAULT_CONSTITUTION,
        workspaceId,
        name: 'Default Constitution',
      };
      constitutionCache.set(workspaceId, { rules: fallback, expiresAt: Date.now() + CACHE_TTL_MS });
      return fallback;
    }

    const row = rows[0];
    const rules: ConstitutionRules = {
      workspaceId: row.workspaceId,
      version: row.version,
      name: row.name,
      requiredApprovals:
        (row.requiredApprovals as Record<string, { roles: string[]; sla_minutes: number }>) ?? {},
      actionRedlines: (row.actionRedlines as string[]) ?? [],
      autonomyCeilings: (row.autonomyCeilings as Record<string, string>) ?? {},
      confidenceFloor: row.confidenceFloor,
      freshnessMaxHours: row.freshnessMaxHours,
      extraRules: (row.extraRules as Record<string, unknown>) ?? {},
    };

    constitutionCache.set(workspaceId, { rules, expiresAt: Date.now() + CACHE_TTL_MS });
    return rules;
  } catch (err) {
    logger.warn({ err, workspaceId }, 'Failed to load constitution from DB — using default');
    const fallback: ConstitutionRules = {
      ...DEFAULT_CONSTITUTION,
      workspaceId,
      name: 'Default Constitution (fallback)',
    };
    return fallback;
  }
}

export function clearConstitutionCache(workspaceId?: string): void {
  if (workspaceId) {
    constitutionCache.delete(workspaceId);
  } else {
    constitutionCache.clear();
  }
}

// ─── Constitution → Policy Conversion ────────────────────────────────────────

const MODE_ORDER = ['observe', 'recommend', 'draft', 'execute-with-approval', 'auto-execute'];

/**
 * Convert a workspace ConstitutionRules object into an array of Policy objects
 * that the canonical `evaluatePolicies` function can evaluate.  Each
 * constitution constraint becomes one or more typed PolicyRules.
 */
export function constitutionToPolicies(constitution: ConstitutionRules): Policy[] {
  const policies: Policy[] = [];
  const now = Date.now();
  const workspaceId = constitution.workspaceId;

  // ── 1. Confidence floor ────────────────────────────────────────────────────
  // Applies unconditionally across ALL autonomy modes — including observe and
  // recommend — to restore parity with the original constitution enforcement.
  if (constitution.confidenceFloor > 0) {
    const confidenceRule: PolicyRule = {
      id: `${workspaceId}-confidence-floor`,
      name: `Confidence floor: ${(constitution.confidenceFloor * 100).toFixed(0)}%`,
      conditions: [
        {
          field: 'confidence',
          operator: 'lt',
          value: constitution.confidenceFloor,
        },
      ],
      effect: 'block',
      reason: `Confidence below workspace floor of ${(constitution.confidenceFloor * 100).toFixed(0)}%`,
      priority: 9500,
    };
    policies.push({
      id: `${workspaceId}-constitution-confidence`,
      name: 'Confidence Floor Guard',
      description: `Blocks actions when confidence is below ${constitution.confidenceFloor}`,
      scope: 'tenant',
      tenantId: workspaceId,
      priority: 9500,
      isActive: true,
      rules: [confidenceRule],
      createdAt: now,
      updatedAt: now,
    });
  }

  // ── 2. Action redlines ─────────────────────────────────────────────────────
  if (constitution.actionRedlines.length > 0) {
    const redlineRule: PolicyRule = {
      id: `${workspaceId}-redline-block`,
      name: 'Action redline block',
      conditions: [
        {
          field: 'action',
          operator: 'in',
          value: constitution.actionRedlines,
        },
      ],
      effect: 'block',
      reason: 'Action matches a workspace redline — blocked by constitution',
      priority: 9000,
    };
    policies.push({
      id: `${workspaceId}-constitution-redlines`,
      name: 'Action Redlines',
      description: 'Blocks actions that match workspace redlines',
      scope: 'tenant',
      tenantId: workspaceId,
      priority: 9000,
      isActive: true,
      rules: [redlineRule],
      createdAt: now,
      updatedAt: now,
    });
  }

  // ── 3. Autonomy ceilings per severity ──────────────────────────────────────
  const ceilingRules: PolicyRule[] = [];
  const severities = ['critical', 'high', 'medium', 'low'] as const;
  for (const sev of severities) {
    const ceiling = constitution.autonomyCeilings[sev];
    if (!ceiling) continue;
    const ceilingIdx = MODE_ORDER.indexOf(ceiling);
    if (ceilingIdx < 0) continue;

    const modesAboveCeiling = MODE_ORDER.slice(ceilingIdx + 1);
    if (modesAboveCeiling.length === 0) continue;

    ceilingRules.push({
      id: `${workspaceId}-ceiling-${sev}`,
      name: `Autonomy ceiling: ${sev} → max ${ceiling}`,
      conditions: [
        { field: 'severity', operator: 'eq', value: sev },
        { field: 'autonomyMode', operator: 'in', value: modesAboveCeiling },
      ],
      effect: 'block',
      reason: `Autonomy mode exceeds workspace ceiling "${ceiling}" for severity "${sev}"`,
      priority: 8500,
    });
  }

  if (ceilingRules.length > 0) {
    policies.push({
      id: `${workspaceId}-constitution-ceilings`,
      name: 'Autonomy Ceilings',
      description: 'Enforces per-severity autonomy mode ceilings from workspace constitution',
      scope: 'tenant',
      tenantId: workspaceId,
      priority: 8500,
      isActive: true,
      rules: ceilingRules,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ── 4. execute-with-approval always requires approval ─────────────────────
  const approvalConfig = constitution.requiredApprovals['execute-with-approval'];
  if (approvalConfig) {
    const approvalRule: PolicyRule = {
      id: `${workspaceId}-execute-with-approval`,
      name: 'Execute-with-approval requires human sign-off',
      conditions: [{ field: 'autonomyMode', operator: 'eq', value: 'execute-with-approval' }],
      effect: 'require_approval',
      requiredApproverRole: approvalConfig.roles[0] ?? 'operator',
      reason: 'Autonomy mode "execute-with-approval" requires human sign-off per workspace constitution',
      priority: 8000,
    };
    policies.push({
      id: `${workspaceId}-constitution-approval`,
      name: 'Execute-With-Approval Gate',
      description: 'Requires approval for execute-with-approval mode',
      scope: 'tenant',
      tenantId: workspaceId,
      priority: 8000,
      isActive: true,
      rules: [approvalRule],
      createdAt: now,
      updatedAt: now,
    });
  }

  // ── 5. auto-execute: block if not explicitly permitted ────────────────────
  const autoExecConfig = constitution.requiredApprovals['auto-execute'];
  if (!autoExecConfig || autoExecConfig.roles.length > 0) {
    const autoExecRule: PolicyRule = {
      id: `${workspaceId}-auto-execute-block`,
      name: 'Auto-execute requires zero-role config',
      conditions: [{ field: 'autonomyMode', operator: 'eq', value: 'auto-execute' }],
      effect: 'block',
      reason: 'Auto-execute requires a zero-role approval config in the workspace constitution',
      priority: 7500,
    };
    policies.push({
      id: `${workspaceId}-constitution-auto-exec`,
      name: 'Auto-Execute Guard',
      description: 'Blocks auto-execute unless the constitution explicitly permits it',
      scope: 'tenant',
      tenantId: workspaceId,
      priority: 7500,
      isActive: true,
      rules: [autoExecRule],
      createdAt: now,
      updatedAt: now,
    });
  }

  return policies;
}

// ─── Policy Evaluation (delegates to evaluatePolicies) ───────────────────────

export function evaluatePolicy(
  decision: DecisionInput,
  constitution: ConstitutionRules,
  simulationMode = false,
): PolicyEvaluation {
  // ── Pre-check: action redlines with substring matching ────────────────────
  // The policy engine evaluates redlines with exact `in` matching; to restore
  // the original contains-based behavior (any redline token appearing anywhere
  // in the action string triggers a block), we do this check here first.
  if (constitution.actionRedlines.length > 0) {
    const candidateStr = (decision.recommendedAction ?? decision.autonomyMode).toLowerCase();
    const hitRedline = constitution.actionRedlines.find((r) =>
      candidateStr.includes(r.toLowerCase()),
    );
    if (hitRedline) {
      return {
        decision: 'block',
        reasons: [
          `Action matches workspace redline "${hitRedline}" — blocked by constitution (contains-match)`,
        ],
        appliedConstitutionVersion: constitution.version,
        simulationMode,
        evaluatorResult: { effect: 'block', violations: [], requiresApproval: false },
      };
    }
  }

  const policies = constitutionToPolicies(constitution);

  const actionKey = decision.recommendedAction?.toLowerCase().replace(/\s+/g, '_');

  const evalRequest: EvaluationRequest = {
    action: actionKey ?? decision.autonomyMode,
    domain: decision.workspaceId,
    tenantId: decision.workspaceId,
    actionClass: decision.autonomyMode,
    subject: {
      id: decision.cardId,
      roles: [],
      tenantId: decision.workspaceId,
    },
    resource: {
      type: 'decision_card',
      id: decision.cardId,
      domain: decision.workspaceId,
    },
    context: {
      severity: decision.severity,
      autonomyMode: decision.autonomyMode,
      action: actionKey ?? decision.autonomyMode,
    },
    confidence: decision.confidence,
    urgency: decision.severity,
  };

  const result = evaluatePolicies(policies, evalRequest);

  const reasons: string[] = result.violations.map((v) => v.reason);
  if (reasons.length === 0) {
    reasons.push('All policy checks passed');
  }

  let policyDecision: PolicyDecision;
  if (result.effect === 'block') {
    policyDecision = 'block';
  } else if (result.effect === 'require_approval' || result.requiresApproval) {
    policyDecision = 'require-approval';
  } else {
    policyDecision = 'allow';
  }

  const approvalConfig = constitution.requiredApprovals['execute-with-approval'];

  return {
    decision: policyDecision,
    reasons,
    requiredApproverRoles:
      policyDecision === 'require-approval'
        ? (approvalConfig?.roles ?? [result.requiredApproverRole].filter(Boolean) as string[])
        : undefined,
    slaMinutes: policyDecision === 'require-approval' ? (approvalConfig?.sla_minutes ?? 60) : undefined,
    appliedConstitutionVersion: constitution.version,
    simulationMode,
    evaluatorResult: result,
  };
}

// ─── Convenience: load + evaluate in one call ─────────────────────────────────

export async function evaluateDecisionPolicy(
  decision: DecisionInput,
  { simulationMode = false }: { simulationMode?: boolean } = {},
): Promise<PolicyEvaluation> {
  const constitution = await loadConstitution(decision.workspaceId);
  return evaluatePolicy(decision, constitution, simulationMode);
}
