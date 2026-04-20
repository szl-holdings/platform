/**
 * Forge service layer.
 *
 * Encapsulates the AI runtime + agent factory + governed promotion pipeline:
 *   - drift evaluation
 *   - promotion validation
 *   - policy enforcement
 *   - runtime metadata capture
 *   - rollback orchestration
 *
 * Routes call into these services; no business logic lives in route handlers.
 */
import {
  db,
  type ForgeAgent,
  type ForgeAgentVersion,
  type ForgeDriftEvent,
  type ForgeExecutionRun,
  type ForgePolicyPack,
  type ForgePromotion,
  forgeAgentsTable,
  forgeAgentVersionsTable,
  forgeAuditEventsTable,
  forgeDriftEventsTable,
  forgeEnvironmentProfilesTable,
  forgeEnvironmentSnapshotsTable,
  forgeExecutionArtifactsTable,
  forgeExecutionRunsTable,
  forgeModelsTable,
  forgePolicyAssignmentsTable,
  forgePolicyPacksTable,
  forgePromotionApprovalsTable,
  forgePromotionsTable,
  forgePromptVersionsTable,
  forgeRollbackEventsTable,
  forgeToolsTable,
} from '@szl-holdings/db';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { logger } from '../../lib/logger';

export const ENV_TIERS = ['dev', 'sandbox', 'staging', 'production'] as const;
export type EnvTier = (typeof ENV_TIERS)[number];

export const RISK_TIERS = ['low', 'standard', 'regulated', 'executive'] as const;
export type RiskTier = (typeof RISK_TIERS)[number];

// ─── Audit ────────────────────────────────────────────────────────────────
export async function writeAudit(params: {
  agentId?: string | null;
  actorUserId?: number | null;
  actorRole?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(forgeAuditEventsTable).values({
      agentId: params.agentId ?? null,
      actorUserId: params.actorUserId ?? null,
      actorRole: params.actorRole ?? null,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId ?? null,
      before: (params.before as Record<string, unknown> | undefined) ?? null,
      after: (params.after as Record<string, unknown> | undefined) ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (err) {
    logger.warn({ err }, '[forge] audit write failed');
  }
}

// ─── Drift evaluation ─────────────────────────────────────────────────────
export interface DriftFinding {
  dimension: 'model' | 'prompt' | 'tool' | 'data' | 'config' | 'secret';
  expected: string;
  observed: string;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  detail: string;
}

export interface DriftReport {
  agentId: string;
  envId: string;
  driftScore: number; // 0..100
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  findings: DriftFinding[];
  recommendation: string;
}

const SEVERITY_WEIGHT: Record<DriftFinding['severity'], number> = {
  none: 0,
  low: 10,
  medium: 35,
  high: 65,
  critical: 95,
};

export function aggregateDrift(findings: DriftFinding[]): {
  score: number;
  severity: DriftReport['severity'];
} {
  if (!findings.length) return { score: 0, severity: 'none' };
  const max = findings.reduce((m, f) => Math.max(m, SEVERITY_WEIGHT[f.severity]), 0);
  const avg = findings.reduce((s, f) => s + SEVERITY_WEIGHT[f.severity], 0) / findings.length;
  const score = Math.round(max * 0.7 + avg * 0.3);
  const severity: DriftReport['severity'] =
    score >= 80
      ? 'critical'
      : score >= 60
        ? 'high'
        : score >= 30
          ? 'medium'
          : score >= 10
            ? 'low'
            : 'none';
  return { score, severity };
}

export async function evaluateDrift(agentId: string, envId: string): Promise<DriftReport> {
  const [agent] = await db
    .select()
    .from(forgeAgentsTable)
    .where(eq(forgeAgentsTable.id, agentId))
    .limit(1);
  if (!agent) throw new Error(`Agent ${agentId} not found`);

  const [env] = await db
    .select()
    .from(forgeEnvironmentProfilesTable)
    .where(eq(forgeEnvironmentProfilesTable.id, envId))
    .limit(1);
  if (!env) throw new Error(`Environment ${envId} not found`);

  // Compare active version inventory vs latest snapshot
  const [snapshot] = await db
    .select()
    .from(forgeEnvironmentSnapshotsTable)
    .where(eq(forgeEnvironmentSnapshotsTable.envId, envId))
    .orderBy(desc(forgeEnvironmentSnapshotsTable.capturedAt))
    .limit(1);

  const findings: DriftFinding[] = [];

  if (!snapshot) {
    findings.push({
      dimension: 'config',
      expected: 'snapshot',
      observed: 'missing',
      severity: 'medium',
      detail: 'No environment snapshot captured yet',
    });
  } else if (!agent.activeVersionId) {
    findings.push({
      dimension: 'config',
      expected: 'active_version',
      observed: 'none',
      severity: 'high',
      detail: 'Agent has no active version assigned',
    });
  } else {
    const [version] = await db
      .select()
      .from(forgeAgentVersionsTable)
      .where(eq(forgeAgentVersionsTable.id, agent.activeVersionId))
      .limit(1);

    const inv =
      (snapshot.agentInventory as Record<
        string,
        { modelId?: string; promptVersionId?: string; toolIds?: string[] }
      >) ?? {};
    const observed = inv[agent.id];

    if (version && observed) {
      if (version.modelId && observed.modelId && version.modelId !== observed.modelId) {
        findings.push({
          dimension: 'model',
          expected: version.modelId,
          observed: observed.modelId,
          severity: 'high',
          detail: 'Active model differs from snapshot',
        });
      }
      if (
        version.promptVersionId &&
        observed.promptVersionId &&
        version.promptVersionId !== observed.promptVersionId
      ) {
        findings.push({
          dimension: 'prompt',
          expected: version.promptVersionId,
          observed: observed.promptVersionId,
          severity: 'medium',
          detail: 'Prompt version drift detected',
        });
      }
      const expectedTools = new Set(version.toolIds ?? []);
      const observedTools = new Set(observed.toolIds ?? []);
      const missing = [...expectedTools].filter((t) => !observedTools.has(t));
      const extra = [...observedTools].filter((t) => !expectedTools.has(t));
      if (missing.length || extra.length) {
        findings.push({
          dimension: 'tool',
          expected: [...expectedTools].join(','),
          observed: [...observedTools].join(','),
          severity: missing.length > 0 ? 'high' : 'medium',
          detail: `Tool drift: missing=[${missing.join(',')}] extra=[${extra.join(',')}]`,
        });
      }
    } else if (version && !observed) {
      findings.push({
        dimension: 'config',
        expected: 'deployed',
        observed: 'absent',
        severity: 'critical',
        detail: 'Active version not found in environment snapshot',
      });
    }
  }

  const { score, severity } = aggregateDrift(findings);
  const recommendation =
    severity === 'critical'
      ? 'Block promotions and freeze production traffic until drift is reconciled.'
      : severity === 'high'
        ? 'Re-snapshot the environment and re-evaluate active version inventory.'
        : severity === 'medium'
          ? 'Schedule a controlled redeploy at the next maintenance window.'
          : severity === 'low'
            ? 'Monitor for additional drift over the next 24h.'
            : 'No action required.';

  return { agentId, envId, driftScore: score, severity, findings, recommendation };
}

export async function recordDriftEvent(report: DriftReport): Promise<ForgeDriftEvent | null> {
  if (!report.findings.length) return null;
  const top = report.findings[0]!;
  const [evt] = await db
    .insert(forgeDriftEventsTable)
    .values({
      agentId: report.agentId,
      envId: report.envId,
      driftScore: String(report.driftScore),
      severity: report.severity,
      dimension: top.dimension,
      expectedFingerprint: top.expected,
      observedFingerprint: top.observed,
      findings: { findings: report.findings, recommendation: report.recommendation },
      remediation: report.recommendation,
    })
    .returning();
  return evt ?? null;
}

// ─── Promotion validation ─────────────────────────────────────────────────
export interface PromotionBlocker {
  code: string;
  message: string;
}

export interface PromotionValidationResult {
  ok: boolean;
  blockers: PromotionBlocker[];
  report: Record<string, unknown>;
}

export const PROMOTION_BLOCKER_CODES = {
  EVALS_NOT_PASSED: 'EVALS_NOT_PASSED',
  DRIFT_OVER_THRESHOLD: 'DRIFT_OVER_THRESHOLD',
  MISSING_SECRETS: 'MISSING_SECRETS',
  MISSING_OBSERVABILITY: 'MISSING_OBSERVABILITY',
  MISSING_PROVENANCE: 'MISSING_PROVENANCE',
  UNAPPROVED_MODEL: 'UNAPPROVED_MODEL',
  UNAPPROVED_TOOL: 'UNAPPROVED_TOOL',
  MISSING_HUMAN_APPROVAL: 'MISSING_HUMAN_APPROVAL',
  INVALID_TIER_TRANSITION: 'INVALID_TIER_TRANSITION',
} as const;

const TIER_ORDER: Record<EnvTier, number> = { dev: 0, sandbox: 1, staging: 2, production: 3 };

export async function validatePromotion(params: {
  agentId: string;
  toVersionId: string;
  fromEnv: EnvTier;
  toEnv: EnvTier;
  hasHumanApproval?: boolean;
}): Promise<PromotionValidationResult> {
  const blockers: PromotionBlocker[] = [];
  const report: Record<string, unknown> = {};

  // Tier transition must move forward by exactly one tier
  if (TIER_ORDER[params.toEnv] !== TIER_ORDER[params.fromEnv] + 1) {
    blockers.push({
      code: PROMOTION_BLOCKER_CODES.INVALID_TIER_TRANSITION,
      message: `Promotion must move forward one tier (got ${params.fromEnv} → ${params.toEnv})`,
    });
  }

  const [agent] = await db
    .select()
    .from(forgeAgentsTable)
    .where(eq(forgeAgentsTable.id, params.agentId))
    .limit(1);
  if (!agent) {
    blockers.push({ code: 'AGENT_NOT_FOUND', message: `Agent ${params.agentId} not found` });
    return { ok: false, blockers, report };
  }

  const [version] = await db
    .select()
    .from(forgeAgentVersionsTable)
    .where(eq(forgeAgentVersionsTable.id, params.toVersionId))
    .limit(1);
  if (!version) {
    blockers.push({
      code: 'VERSION_NOT_FOUND',
      message: `Version ${params.toVersionId} not found`,
    });
    return { ok: false, blockers, report };
  }
  // Integrity: the target version must belong to the agent we are promoting
  if (version.agentId !== params.agentId) {
    blockers.push({
      code: 'VERSION_AGENT_MISMATCH',
      message: `Version ${params.toVersionId} does not belong to agent ${params.agentId}`,
    });
    return { ok: false, blockers, report };
  }

  // 1. Evals must pass
  if (!version.evalsPassed) {
    blockers.push({
      code: PROMOTION_BLOCKER_CODES.EVALS_NOT_PASSED,
      message: 'Required evaluation suite has not passed for this version',
    });
  }
  // 2. Observability hook must be configured
  if (!version.observabilityHookConfigured) {
    blockers.push({
      code: PROMOTION_BLOCKER_CODES.MISSING_OBSERVABILITY,
      message: 'Observability hook not configured for this version',
    });
  }
  // 3. Provenance must be complete
  if (!version.provenanceComplete) {
    blockers.push({
      code: PROMOTION_BLOCKER_CODES.MISSING_PROVENANCE,
      message: 'Model + prompt + tool + data-source provenance is incomplete',
    });
  }

  // 4. Model must be approved
  if (version.modelId) {
    const [model] = await db
      .select()
      .from(forgeModelsTable)
      .where(eq(forgeModelsTable.id, version.modelId))
      .limit(1);
    if (!model || !model.approved) {
      blockers.push({
        code: PROMOTION_BLOCKER_CODES.UNAPPROVED_MODEL,
        message: `Model ${model?.slug ?? version.modelId} is not on the approved list`,
      });
    }
    report.model = model?.slug ?? null;
  } else {
    blockers.push({
      code: PROMOTION_BLOCKER_CODES.MISSING_PROVENANCE,
      message: 'No model assigned to this version',
    });
  }

  // 5. All tools must be approved
  const toolIds = (version.toolIds ?? []) as string[];
  if (toolIds.length) {
    const tools = await db
      .select()
      .from(forgeToolsTable)
      .where(inArray(forgeToolsTable.id, toolIds));
    const unapproved = tools.filter((t) => !t.approved).map((t) => t.slug);
    if (unapproved.length) {
      blockers.push({
        code: PROMOTION_BLOCKER_CODES.UNAPPROVED_TOOL,
        message: `Unapproved tools assigned: ${unapproved.join(', ')}`,
      });
    }
    report.tools = tools.map((t) => ({ slug: t.slug, approved: t.approved }));
  }

  // 6. Required secrets present in target env
  const [targetEnv] = await db
    .select()
    .from(forgeEnvironmentProfilesTable)
    .where(eq(forgeEnvironmentProfilesTable.tier, params.toEnv))
    .limit(1);
  if (targetEnv?.targetId) {
    const target = await db.execute(
      sql`SELECT required_secrets FROM forge_deployment_targets WHERE id = ${targetEnv.targetId}`,
    );
    const required = (target.rows[0]?.required_secrets as string[] | undefined) ?? [];
    const missing = required.filter((s) => !process.env[s]);
    if (missing.length) {
      blockers.push({
        code: PROMOTION_BLOCKER_CODES.MISSING_SECRETS,
        message: `Missing secrets in ${params.toEnv}: ${missing.join(', ')}`,
      });
    }
    report.requiredSecrets = required;
  }

  // 7. Drift must be below threshold (only relevant for promotions into staging/production)
  if (TIER_ORDER[params.toEnv] >= TIER_ORDER.staging && targetEnv) {
    const driftReport = await evaluateDrift(params.agentId, targetEnv.id);
    report.drift = { score: driftReport.driftScore, severity: driftReport.severity };
    if (driftReport.driftScore >= 60) {
      blockers.push({
        code: PROMOTION_BLOCKER_CODES.DRIFT_OVER_THRESHOLD,
        message: `Drift score ${driftReport.driftScore} exceeds threshold 60 for ${params.toEnv}`,
      });
    }
  }

  // 8. Production / regulated / executive promotions require human approval
  const requiresApproval =
    params.toEnv === 'production' ||
    agent.riskTier === 'regulated' ||
    agent.riskTier === 'executive';
  if (requiresApproval && !params.hasHumanApproval) {
    blockers.push({
      code: PROMOTION_BLOCKER_CODES.MISSING_HUMAN_APPROVAL,
      message: `Promotion into ${params.toEnv} for risk tier "${agent.riskTier}" requires explicit human approval`,
    });
  }

  return { ok: blockers.length === 0, blockers, report };
}

// ─── Policy enforcement ──────────────────────────────────────────────────
export interface PolicyDecision {
  outcome: 'allow' | 'deny' | 'needs_approval';
  policyPackId: string | null;
  policyPackName: string | null;
  reasons: string[];
}

export async function enforcePolicy(params: {
  agentId: string;
  envTier: EnvTier;
  action: 'execute' | 'promote' | 'rollback' | 'modify';
}): Promise<PolicyDecision> {
  const [assignment] = await db
    .select()
    .from(forgePolicyAssignmentsTable)
    .where(
      and(
        eq(forgePolicyAssignmentsTable.agentId, params.agentId),
        eq(forgePolicyAssignmentsTable.envTier, params.envTier),
      ),
    )
    .limit(1);

  let pack: ForgePolicyPack | null = null;
  if (assignment) {
    const [p] = await db
      .select()
      .from(forgePolicyPacksTable)
      .where(eq(forgePolicyPacksTable.id, assignment.policyPackId))
      .limit(1);
    pack = p ?? null;
  }
  if (!pack) {
    return {
      outcome: 'allow',
      policyPackId: null,
      policyPackName: null,
      reasons: ['No policy pack assigned — default allow (low-risk internal)'],
    };
  }

  const rules = (pack.rules ?? {}) as Record<string, unknown>;
  const reasons: string[] = [];
  let outcome: PolicyDecision['outcome'] = 'allow';

  const requireApprovalActions = (rules.requireApprovalActions as string[] | undefined) ?? [];
  if (requireApprovalActions.includes(params.action)) {
    outcome = 'needs_approval';
    reasons.push(`Policy "${pack.name}" requires human approval for action "${params.action}"`);
  }

  const denyEnvs = (rules.denyEnvs as EnvTier[] | undefined) ?? [];
  if (denyEnvs.includes(params.envTier)) {
    outcome = 'deny';
    reasons.push(`Policy "${pack.name}" denies action in environment "${params.envTier}"`);
  }

  return { outcome, policyPackId: pack.id, policyPackName: pack.name, reasons };
}

// ─── Runtime metadata capture ────────────────────────────────────────────
export interface RuntimeCaptureInput {
  agentId: string;
  versionId: string;
  envTier: EnvTier;
  modelId?: string;
  promptVersionId?: string;
  status: 'success' | 'failure' | 'escalated' | 'overridden';
  outcome?: string;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  toolCalls?: number;
  toolFailures?: number;
  policyOutcome?: PolicyDecision['outcome'];
  humanOverride?: boolean;
  valueAtRiskUsd?: number;
  input?: unknown;
  output?: unknown;
  trace?: unknown;
  isSeed?: boolean;
}

export async function captureRuntime(input: RuntimeCaptureInput): Promise<ForgeExecutionRun> {
  const [run] = await db
    .insert(forgeExecutionRunsTable)
    .values({
      agentId: input.agentId,
      versionId: input.versionId,
      envTier: input.envTier,
      modelId: input.modelId,
      promptVersionId: input.promptVersionId,
      status: input.status,
      outcome: input.outcome,
      latencyMs: input.latencyMs,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      toolCalls: input.toolCalls ?? 0,
      toolFailures: input.toolFailures ?? 0,
      policyOutcome: input.policyOutcome,
      humanOverride: input.humanOverride ?? false,
      valueAtRiskUsd: input.valueAtRiskUsd != null ? String(input.valueAtRiskUsd) : null,
      provenance: {
        modelId: input.modelId ?? null,
        promptVersionId: input.promptVersionId ?? null,
        capturedAt: new Date().toISOString(),
      },
      isSeed: input.isSeed ?? false,
      completedAt: new Date(),
    })
    .returning();

  // Persist input/output/trace as artifacts so Tower can fetch full provenance
  const artifacts: Array<{ kind: 'input' | 'output' | 'trace'; content: Record<string, unknown> }> =
    [];
  if (input.input !== undefined) artifacts.push({ kind: 'input', content: { value: input.input } });
  if (input.output !== undefined)
    artifacts.push({ kind: 'output', content: { value: input.output } });
  if (input.trace !== undefined) artifacts.push({ kind: 'trace', content: { value: input.trace } });
  if (artifacts.length) {
    await db
      .insert(forgeExecutionArtifactsTable)
      .values(artifacts.map((a) => ({ executionId: run!.id, kind: a.kind, content: a.content })));
  }

  // Pipe a Tower-compatible event (best-effort log emission)
  logger.info(
    {
      event: 'forge.execution.captured',
      runId: run!.id,
      agentId: input.agentId,
      envTier: input.envTier,
      status: input.status,
      policyOutcome: input.policyOutcome ?? null,
      latencyMs: input.latencyMs ?? null,
    },
    'Forge execution captured',
  );

  return run!;
}

// ─── Rollback orchestration ──────────────────────────────────────────────
export async function rollbackAgent(params: {
  agentId: string;
  toVersionId: string;
  envTier: EnvTier;
  reason: string;
  triggeredBy?: number;
}): Promise<{ agent: ForgeAgent; rollbackId: string }> {
  const [agent] = await db
    .select()
    .from(forgeAgentsTable)
    .where(eq(forgeAgentsTable.id, params.agentId))
    .limit(1);
  if (!agent) throw new Error(`Agent ${params.agentId} not found`);

  const [target] = await db
    .select()
    .from(forgeAgentVersionsTable)
    .where(eq(forgeAgentVersionsTable.id, params.toVersionId))
    .limit(1);
  if (!target) throw new Error(`Target version ${params.toVersionId} not found`);
  if (target.agentId !== params.agentId)
    throw new Error('Target version does not belong to this agent');

  const fromVersionId = agent.activeVersionId;

  // Atomic version swap
  const [updated] = await db
    .update(forgeAgentsTable)
    .set({ activeVersionId: params.toVersionId, updatedAt: new Date() })
    .where(eq(forgeAgentsTable.id, params.agentId))
    .returning();

  const [rollback] = await db
    .insert(forgeRollbackEventsTable)
    .values({
      agentId: params.agentId,
      fromVersionId,
      toVersionId: params.toVersionId,
      envTier: params.envTier,
      reason: params.reason,
      triggeredBy: params.triggeredBy,
    })
    .returning();

  await writeAudit({
    agentId: params.agentId,
    actorUserId: params.triggeredBy,
    action: 'rollback',
    resourceType: 'agent',
    resourceId: params.agentId,
    before: { activeVersionId: fromVersionId },
    after: { activeVersionId: params.toVersionId },
    metadata: { reason: params.reason, envTier: params.envTier },
  });

  return { agent: updated!, rollbackId: rollback!.id };
}

// ─── Promotion advancement (after validation passes) ─────────────────────
export async function executePromotion(params: {
  promotionId: string;
  approverUserId?: number;
}): Promise<ForgePromotion> {
  const [promo] = await db
    .select()
    .from(forgePromotionsTable)
    .where(eq(forgePromotionsTable.id, params.promotionId))
    .limit(1);
  if (!promo) throw new Error(`Promotion ${params.promotionId} not found`);
  if (promo.status === 'promoted') return promo;
  // Hard re-validation: blockers are terminal regardless of stored status. An
  // approval record may move status to "approved", but it does not waive the
  // blocker codes. The promotion must be re-validated and pass cleanly.
  const approvals = await db
    .select()
    .from(forgePromotionApprovalsTable)
    .where(
      and(
        eq(forgePromotionApprovalsTable.promotionId, params.promotionId),
        eq(forgePromotionApprovalsTable.decision, 'approved'),
      ),
    );
  const hasHumanApproval = approvals.length > 0;
  const fresh = await validatePromotion({
    agentId: promo.agentId,
    toVersionId: promo.toVersionId,
    fromEnv: promo.fromEnv as EnvTier,
    toEnv: promo.toEnv as EnvTier,
    hasHumanApproval,
  });
  if (!fresh.ok) {
    await db
      .update(forgePromotionsTable)
      .set({
        status: 'blocked',
        blockers: fresh.blockers,
        validationReport: fresh.report,
        updatedAt: new Date(),
      })
      .where(eq(forgePromotionsTable.id, params.promotionId));
    throw new Error(
      `Cannot execute a promotion with blockers: ${fresh.blockers.map((b) => b.code).join(', ')}`,
    );
  }

  // Atomic env + active version swap
  await db
    .update(forgeAgentsTable)
    .set({ activeVersionId: promo.toVersionId, currentEnv: promo.toEnv, updatedAt: new Date() })
    .where(eq(forgeAgentsTable.id, promo.agentId));

  const [updated] = await db
    .update(forgePromotionsTable)
    .set({ status: 'promoted', promotedAt: new Date(), updatedAt: new Date() })
    .where(eq(forgePromotionsTable.id, params.promotionId))
    .returning();

  await writeAudit({
    agentId: promo.agentId,
    actorUserId: params.approverUserId,
    action: 'promote',
    resourceType: 'promotion',
    resourceId: params.promotionId,
    metadata: { fromEnv: promo.fromEnv, toEnv: promo.toEnv, toVersionId: promo.toVersionId },
  });

  return updated!;
}

export async function recordPromotionApproval(params: {
  promotionId: string;
  approverUserId?: number;
  approverRole?: string;
  decision: 'approved' | 'rejected';
  note?: string;
}) {
  const [row] = await db
    .insert(forgePromotionApprovalsTable)
    .values({
      promotionId: params.promotionId,
      approverUserId: params.approverUserId,
      approverRole: params.approverRole,
      decision: params.decision,
      note: params.note,
    })
    .returning();
  if (params.decision === 'approved') {
    // Approval only advances status when validation already passes. If
    // blockers remain (other than missing human approval), the promotion
    // stays blocked — approvals never waive non-approval blockers.
    const [promo] = await db
      .select()
      .from(forgePromotionsTable)
      .where(eq(forgePromotionsTable.id, params.promotionId))
      .limit(1);
    const fresh = promo
      ? await validatePromotion({
          agentId: promo.agentId,
          toVersionId: promo.toVersionId,
          fromEnv: promo.fromEnv as EnvTier,
          toEnv: promo.toEnv as EnvTier,
          hasHumanApproval: true,
        })
      : { ok: false, blockers: [], report: {} };
    await db
      .update(forgePromotionsTable)
      .set({
        status: fresh.ok ? 'approved' : 'blocked',
        blockers: fresh.blockers,
        validationReport: fresh.report,
        updatedAt: new Date(),
      })
      .where(eq(forgePromotionsTable.id, params.promotionId));
  } else {
    await db
      .update(forgePromotionsTable)
      .set({ status: 'blocked', updatedAt: new Date() })
      .where(eq(forgePromotionsTable.id, params.promotionId));
  }
  return row;
}

export type {
  ForgeAgent,
  ForgeAgentVersion,
  ForgeDriftEvent,
  ForgeExecutionRun,
  ForgePolicyPack,
  ForgePromotion,
};
