/**
 * Decision Policy Engine
 *
 * Loads workspace constitutions and evaluates decision cards against them.
 * Returns allow / require-approval / block with structured reasons.
 */

import { db, workspaceConstitutionsTable } from '@szl-holdings/db';
import { and, eq } from 'drizzle-orm';
import { logger } from '../lib/logger';

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Policy Evaluation ───────────────────────────────────────────────────────

export function evaluatePolicy(
  decision: DecisionInput,
  constitution: ConstitutionRules,
  simulationMode = false,
): PolicyEvaluation {
  const reasons: string[] = [];

  // 1. Confidence floor check
  if (decision.confidence < constitution.confidenceFloor) {
    reasons.push(
      `Confidence ${(decision.confidence * 100).toFixed(0)}% is below workspace floor ${(constitution.confidenceFloor * 100).toFixed(0)}%`,
    );
    return {
      decision: 'block',
      reasons,
      appliedConstitutionVersion: constitution.version,
      simulationMode,
    };
  }

  // 2. Action redlines check
  if (decision.recommendedAction) {
    const actionKey = decision.recommendedAction.toLowerCase().replace(/\s+/g, '_');
    const hitRedline = constitution.actionRedlines.some((r) => actionKey.includes(r));
    if (hitRedline) {
      reasons.push(
        `Action "${decision.recommendedAction}" matches a workspace redline — blocked by constitution`,
      );
      return {
        decision: 'block',
        reasons,
        appliedConstitutionVersion: constitution.version,
        simulationMode,
      };
    }
  }

  // 3. Autonomy ceiling check (per severity)
  const severityCeiling = constitution.autonomyCeilings[decision.severity];
  if (severityCeiling) {
    const modeOrder = ['observe', 'recommend', 'draft', 'execute-with-approval', 'auto-execute'];
    const requestedIdx = modeOrder.indexOf(decision.autonomyMode);
    const ceilingIdx = modeOrder.indexOf(severityCeiling);

    if (requestedIdx > ceilingIdx) {
      reasons.push(
        `Autonomy mode "${decision.autonomyMode}" exceeds workspace ceiling "${severityCeiling}" for severity "${decision.severity}" — auto-execute outside constitution is blocked`,
      );
      // Always block when requested mode exceeds the severity ceiling — never downgrade to
      // require-approval, which would mislead the caller into thinking approval suffices.
      return {
        decision: 'block',
        reasons,
        appliedConstitutionVersion: constitution.version,
        simulationMode,
      };
    }
  }

  // 4. Modes that always require approval
  if (decision.autonomyMode === 'execute-with-approval') {
    const approvalConfig = constitution.requiredApprovals['execute-with-approval'];
    reasons.push(
      `Autonomy mode "execute-with-approval" requires human sign-off per workspace constitution`,
    );
    return {
      decision: 'require-approval',
      reasons,
      requiredApproverRoles: approvalConfig?.roles ?? ['operator', 'admin'],
      slaMinutes: approvalConfig?.sla_minutes ?? 60,
      appliedConstitutionVersion: constitution.version,
      simulationMode,
    };
  }

  // 5. Auto-execute: verify it is explicitly permitted
  if (decision.autonomyMode === 'auto-execute') {
    const autoExecConfig = constitution.requiredApprovals['auto-execute'];
    if (!autoExecConfig || autoExecConfig.roles.length > 0) {
      reasons.push(
        `Auto-execute requires a zero-role approval config in the workspace constitution; current config has required roles`,
      );
      return {
        decision: 'block',
        reasons,
        appliedConstitutionVersion: constitution.version,
        simulationMode,
      };
    }
  }

  reasons.push('All policy checks passed');
  return {
    decision: 'allow',
    reasons,
    appliedConstitutionVersion: constitution.version,
    simulationMode,
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
