/**
 * decisioning-store.ts
 *
 * DB-backed persistence for Action Engine runs, Decision Engine recommendations,
 * and Policy Engine violations. Replaces the in-memory Map in action-engine/src/index.js
 * for the API server context, enabling cross-session audit trails and history pages.
 */

import type { WorkflowRun } from '@szl-holdings/action-engine';
import { pool } from '@szl-holdings/db';
import { logger } from './logger';

export interface StoredRun {
  id?: number;
  runId: string;
  workflowId: string;
  workflowName: string;
  domain: string;
  status: string;
  initiatedBy?: string;
  approvedBy?: string;
  tenantId?: string;
  recommendationId?: string;
  isDryRun: boolean;
  isSimulation: boolean;
  requiresApproval: boolean;
  durationMs?: number;
  steps: unknown[];
  auditTrail: unknown[];
  policyEvaluation?: unknown;
  cost?: unknown;
  outcome?: string;
  outcomeSummary?: string;
  outcomeImpact?: unknown;
  outcomeRecordedAt?: string | null;
  outcomeRecordedBy?: string | null;
  metadata?: unknown;
  startedAt: string;
  completedAt?: string | null;
  createdAt?: string;
}

export interface RunFilter {
  workflowId?: string;
  status?: string;
  domain?: string;
  tenantId?: string;
  onlyNullTenant?: boolean;
  limit?: number;
  offset?: number;
}

export async function dbRecordRun(run: StoredRun): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO szl_decisioning_runs (
        run_id, workflow_id, workflow_name, domain, status,
        initiated_by, approved_by, tenant_id, recommendation_id,
        is_dry_run, is_simulation, requires_approval, duration_ms,
        steps, audit_trail, policy_evaluation, cost, metadata,
        started_at, completed_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      ON CONFLICT (run_id) DO UPDATE SET
        status = EXCLUDED.status,
        workflow_name = COALESCE(EXCLUDED.workflow_name, szl_decisioning_runs.workflow_name),
        domain = COALESCE(EXCLUDED.domain, szl_decisioning_runs.domain),
        approved_by = COALESCE(EXCLUDED.approved_by, szl_decisioning_runs.approved_by),
        tenant_id = COALESCE(EXCLUDED.tenant_id, szl_decisioning_runs.tenant_id),
        recommendation_id = COALESCE(EXCLUDED.recommendation_id, szl_decisioning_runs.recommendation_id),
        requires_approval = EXCLUDED.requires_approval,
        duration_ms = COALESCE(EXCLUDED.duration_ms, szl_decisioning_runs.duration_ms),
        steps = EXCLUDED.steps,
        audit_trail = EXCLUDED.audit_trail,
        policy_evaluation = EXCLUDED.policy_evaluation,
        cost = EXCLUDED.cost,
        completed_at = COALESCE(EXCLUDED.completed_at, szl_decisioning_runs.completed_at),
        metadata = EXCLUDED.metadata`,
      [
        run.runId,
        run.workflowId,
        run.workflowName,
        run.domain,
        run.status,
        run.initiatedBy ?? null,
        run.approvedBy ?? null,
        run.tenantId ?? null,
        run.recommendationId ?? null,
        run.isDryRun,
        run.isSimulation,
        run.requiresApproval,
        run.durationMs ?? null,
        JSON.stringify(run.steps ?? []),
        JSON.stringify(run.auditTrail ?? []),
        JSON.stringify(run.policyEvaluation ?? {}),
        JSON.stringify(run.cost ?? {}),
        JSON.stringify(run.metadata ?? {}),
        run.startedAt,
        run.completedAt ?? null,
      ],
    );
  } catch (err) {
    logger.warn(
      { err, runId: run.runId },
      '[DecisioningStore] Failed to persist run — falling back silently',
    );
  }
}

/**
 * Convert an action-engine WorkflowRun into the StoredRun shape used for
 * persistence in szl_decisioning_runs.
 */
export function workflowRunToStored(run: WorkflowRun): StoredRun {
  return {
    runId: run.runId,
    workflowId: run.workflowId,
    workflowName: run.workflowName,
    domain: (run.metadata?.domain as string | undefined) ?? 'unknown',
    status: run.status,
    initiatedBy: run.initiatedBy,
    approvedBy: run.approvedBy,
    tenantId: run.tenantId,
    recommendationId: run.recommendationId,
    isDryRun: run.isDryRun ?? false,
    isSimulation: run.isSimulation ?? false,
    requiresApproval:
      run.approvalState === 'pending' ||
      (run.steps ?? []).some((s: { requiresApproval?: boolean }) => s.requiresApproval),
    durationMs: run.completedAt != null ? run.completedAt - run.startedAt : undefined,
    steps: run.steps ?? [],
    auditTrail: run.auditTrail ?? [],
    policyEvaluation: run.policyEvaluation,
    cost: { estimated: run.estimatedCostUsd, actual: run.actualCostUsd },
    metadata: run.metadata ?? {},
    startedAt: new Date(run.startedAt).toISOString(),
    completedAt: run.completedAt != null ? new Date(run.completedAt).toISOString() : null,
  };
}

/**
 * Persist an action-engine WorkflowRun directly into szl_decisioning_runs,
 * bypassing the action-engine history adapter. This is used by callers (such
 * as the ATLAS execution engine) that must guarantee runs survive a server
 * restart even if the global history adapter has not yet been wired.
 */
export async function dbRecordWorkflowRun(run: WorkflowRun): Promise<void> {
  await dbRecordRun(workflowRunToStored(run));
}

/**
 * Convert a StoredRun (DB shape) back to an action-engine WorkflowRun shape.
 * Used by code paths that need to rehydrate a persisted run for replay or
 * timeline display.
 */
export function storedToWorkflowRun(stored: StoredRun): WorkflowRun {
  const startedAt =
    typeof stored.startedAt === 'string'
      ? new Date(stored.startedAt).getTime()
      : Number(stored.startedAt);
  const completedAt =
    stored.completedAt != null ? new Date(stored.completedAt).getTime() : undefined;
  return {
    runId: stored.runId,
    workflowId: stored.workflowId,
    workflowName: stored.workflowName,
    tenantId: stored.tenantId,
    initiatedBy: stored.initiatedBy,
    approvedBy: stored.approvedBy,
    recommendationId: stored.recommendationId,
    executionMode: 'manual' as const,
    isDryRun: stored.isDryRun,
    isSimulation: stored.isSimulation,
    status: stored.status as WorkflowRun['status'],
    currentStepIndex: 0,
    steps: (stored.steps ?? []) as WorkflowRun['steps'],
    approvalState: stored.approvedBy ? ('approved' as const) : ('none' as const),
    policyEvaluation: stored.policyEvaluation as Record<string, unknown> | undefined,
    auditTrail: (stored.auditTrail ?? []) as WorkflowRun['auditTrail'],
    startedAt,
    completedAt,
    metadata: stored.metadata as Record<string, unknown> | undefined,
  };
}

export async function dbListRuns(
  filter: RunFilter = {},
): Promise<{ runs: StoredRun[]; total: number }> {
  const limit = Math.min(filter.limit ?? 50, 200);
  const offset = filter.offset ?? 0;

  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (filter.workflowId) {
    conditions.push(`workflow_id = $${idx++}`);
    values.push(filter.workflowId);
  }
  if (filter.status) {
    conditions.push(`status = $${idx++}`);
    values.push(filter.status);
  }
  if (filter.domain) {
    conditions.push(`domain = $${idx++}`);
    values.push(filter.domain);
  }
  if (filter.tenantId) {
    conditions.push(`tenant_id = $${idx++}`);
    values.push(filter.tenantId);
  } else if (filter.onlyNullTenant) {
    conditions.push(`tenant_id IS NULL`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM szl_decisioning_runs ${where}`,
      values,
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const runsResult = await pool.query(
      `SELECT * FROM szl_decisioning_runs ${where} ORDER BY started_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, limit, offset],
    );

    const runs: StoredRun[] = runsResult.rows.map(rowToRun);
    return { runs, total };
  } catch (err) {
    logger.warn({ err }, '[DecisioningStore] Failed to list runs from DB');
    return { runs: [], total: 0 };
  }
}

export async function dbGetRunById(runId: string, tenantId?: string): Promise<StoredRun | null> {
  try {
    const conditions = ['run_id = $1'];
    const values: unknown[] = [runId];
    if (tenantId) {
      conditions.push(`(tenant_id = $2 OR tenant_id IS NULL)`);
      values.push(tenantId);
    }
    const result = await pool.query(
      `SELECT * FROM szl_decisioning_runs WHERE ${conditions.join(' AND ')} LIMIT 1`,
      values,
    );
    if (!result.rows[0]) return null;
    return rowToRun(result.rows[0]);
  } catch (err) {
    logger.warn({ err, runId }, '[DecisioningStore] Failed to fetch run from DB');
    return null;
  }
}

export async function dbUpdateRunOutcome(
  runId: string,
  outcome: string,
  summary?: string,
  impact?: unknown,
  recordedBy?: string,
  tenantId?: string,
): Promise<void> {
  try {
    const tenantClause = tenantId
      ? `AND (tenant_id = $6 OR tenant_id IS NULL)`
      : `AND tenant_id IS NULL`;
    const params: unknown[] = [
      outcome,
      summary ?? null,
      JSON.stringify(impact ?? {}),
      recordedBy ?? null,
      runId,
    ];
    if (tenantId) params.push(tenantId);
    await pool.query(
      `UPDATE szl_decisioning_runs
       SET outcome = $1, outcome_summary = $2, outcome_impact = $3,
           outcome_recorded_at = NOW(), outcome_recorded_by = $4
       WHERE run_id = $5 ${tenantClause}`,
      params,
    );
  } catch (err) {
    logger.warn({ err, runId }, '[DecisioningStore] Failed to update run outcome');
  }
}

const CANCELLABLE_STATUSES = `('pending', 'pending_approval', 'awaiting_approval', 'running', 'started')`;

export async function dbCancelRun(
  runId: string,
  tenantId?: string,
  rejectedBy?: string,
): Promise<boolean> {
  try {
    const tenantClause = tenantId
      ? `AND (tenant_id = $4 OR tenant_id IS NULL)`
      : `AND tenant_id IS NULL`;
    const params: unknown[] = ['rejected', rejectedBy ?? 'operator', runId];
    if (tenantId) params.push(tenantId);
    const result = await pool.query(
      `UPDATE szl_decisioning_runs
       SET status = $1, outcome = $1, outcome_recorded_by = $2,
           outcome_recorded_at = NOW(), completed_at = NOW()
       WHERE run_id = $3 ${tenantClause}
       AND status IN ${CANCELLABLE_STATUSES}`,
      params,
    );
    return (result.rowCount ?? 0) > 0;
  } catch (err) {
    logger.warn({ err, runId }, '[DecisioningStore] Failed to cancel run');
    return false;
  }
}

export async function dbApproveRun(
  runId: string,
  tenantId?: string,
  approvedBy?: string,
): Promise<boolean> {
  try {
    const tenantClause = tenantId
      ? `AND (tenant_id = $4 OR tenant_id IS NULL)`
      : `AND tenant_id IS NULL`;
    const params: unknown[] = ['approved', approvedBy ?? 'operator', runId];
    if (tenantId) params.push(tenantId);
    const result = await pool.query(
      `UPDATE szl_decisioning_runs
       SET status = $1, outcome = $1, outcome_recorded_by = $2,
           outcome_recorded_at = NOW()
       WHERE run_id = $3 ${tenantClause}
       AND status IN ${CANCELLABLE_STATUSES}`,
      params,
    );
    return (result.rowCount ?? 0) > 0;
  } catch (err) {
    logger.warn({ err, runId }, '[DecisioningStore] Failed to approve run');
    return false;
  }
}

export async function dbGetHistoryStats(): Promise<{
  totalRuns: number;
  byStatus: Record<string, number>;
  averageDurationMs: number;
  lastRunAt: string | null;
}> {
  try {
    const result = await pool.query<{
      status: string;
      count: string;
      avg_duration: string;
      last_run: string | null;
    }>(
      `SELECT
         status,
         COUNT(*) AS count,
         AVG(duration_ms) AS avg_duration,
         MAX(started_at) AS last_run
       FROM szl_decisioning_runs
       GROUP BY status`,
    );

    const byStatus: Record<string, number> = {};
    let totalRuns = 0;
    let totalDuration = 0;
    let durationCount = 0;
    let lastRunAt: string | null = null;

    for (const row of result.rows) {
      const count = parseInt(row.count, 10);
      byStatus[row.status] = count;
      totalRuns += count;
      if (row.avg_duration) {
        totalDuration += parseFloat(row.avg_duration) * count;
        durationCount += count;
      }
      if (row.last_run && (!lastRunAt || row.last_run > lastRunAt)) {
        lastRunAt = row.last_run;
      }
    }

    return {
      totalRuns,
      byStatus,
      averageDurationMs: durationCount ? totalDuration / durationCount : 0,
      lastRunAt,
    };
  } catch (err) {
    logger.warn({ err }, '[DecisioningStore] Failed to fetch stats from DB');
    return { totalRuns: 0, byStatus: {}, averageDurationMs: 0, lastRunAt: null };
  }
}

export async function dbRecordRecommendations(
  sessionId: string,
  recommendations: unknown[],
  opts: { tenantId?: string; initiatedBy?: string } = {},
): Promise<void> {
  if (!recommendations.length) return;
  try {
    for (const rec of recommendations as Record<string, unknown>[]) {
      await pool.query(
        `INSERT INTO szl_decisioning_recommendations (
          session_id, recommendation_id, title, description, domain, action,
          priority_score, confidence, urgency, business_impact, signals, evidence,
          reasoning, policy_state, policy_evaluation, required_roles,
          estimated_effort_hours, estimated_cost_usd, suggested_owner, is_actionable,
          tenant_id, initiated_by, evaluated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,NOW())
        ON CONFLICT DO NOTHING`,
        [
          sessionId,
          String(rec.id ?? ''),
          String(rec.title ?? ''),
          String(rec.description ?? ''),
          String(rec.domain ?? 'general'),
          String(rec.action ?? ''),
          Number(rec.priorityScore ?? 0),
          Number(rec.confidence ?? 0.5),
          String(rec.urgency ?? 'routine'),
          JSON.stringify(rec.businessImpact ?? {}),
          JSON.stringify(rec.signals ?? []),
          JSON.stringify(rec.evidence ?? []),
          String(rec.reasoning ?? ''),
          String(rec.policyState ?? 'unchecked'),
          JSON.stringify(rec.policyEvaluation ?? {}),
          JSON.stringify(rec.requiredRoles ?? []),
          rec.estimatedEffortHours != null ? Number(rec.estimatedEffortHours) : null,
          rec.estimatedCostUsd != null ? Number(rec.estimatedCostUsd) : null,
          rec.suggestedOwner != null ? String(rec.suggestedOwner) : null,
          rec.isActionable !== false,
          opts.tenantId ?? null,
          opts.initiatedBy ?? null,
        ],
      );
    }
  } catch (err) {
    logger.warn({ err, sessionId }, '[DecisioningStore] Failed to persist recommendations');
  }
}

export async function dbRecordPolicyViolations(
  violations: unknown[],
  context: {
    action: string;
    domain?: string;
    subjectId?: string;
    subjectRoles?: string[];
    resourceType?: string;
    resourceId?: string;
    runId?: string;
    recommendationId?: string;
    tenantId?: string;
    estimatedCostUsd?: number;
    confidence?: number;
  },
): Promise<void> {
  if (!violations.length) return;
  try {
    for (const v of violations as Record<string, unknown>[]) {
      await pool.query(
        `INSERT INTO szl_policy_violations (
          policy_id, policy_name, rule_name, effect, action, domain,
          subject_id, subject_roles, resource_type, resource_id, reason,
          estimated_cost_usd, confidence, run_id, recommendation_id, tenant_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          String(v.policyId ?? 'unknown'),
          v.policyName != null ? String(v.policyName) : null,
          v.ruleName != null ? String(v.ruleName) : null,
          String(v.effect ?? 'block'),
          context.action,
          context.domain ?? null,
          context.subjectId ?? null,
          JSON.stringify(context.subjectRoles ?? []),
          context.resourceType ?? null,
          context.resourceId ?? null,
          v.reason != null ? String(v.reason) : null,
          context.estimatedCostUsd ?? null,
          context.confidence ?? null,
          (v.runId as string | undefined) ?? context.runId ?? null,
          (v.recommendationId as string | undefined) ?? context.recommendationId ?? null,
          context.tenantId ?? null,
        ],
      );
    }
  } catch (err) {
    logger.warn({ err }, '[DecisioningStore] Failed to persist policy violations');
  }
}

function rowToRun(row: Record<string, unknown>): StoredRun {
  return {
    id: row.id as number,
    runId: row.run_id as string,
    workflowId: row.workflow_id as string,
    workflowName: row.workflow_name as string,
    domain: row.domain as string,
    status: row.status as string,
    initiatedBy: row.initiated_by as string | undefined,
    approvedBy: row.approved_by as string | undefined,
    tenantId: row.tenant_id as string | undefined,
    recommendationId: row.recommendation_id as string | undefined,
    isDryRun: Boolean(row.is_dry_run),
    isSimulation: Boolean(row.is_simulation),
    requiresApproval: Boolean(row.requires_approval),
    durationMs: row.duration_ms as number | undefined,
    steps: (row.steps ?? []) as unknown[],
    auditTrail: (row.audit_trail ?? []) as unknown[],
    policyEvaluation: row.policy_evaluation,
    cost: row.cost,
    outcome: row.outcome as string | undefined,
    outcomeSummary: row.outcome_summary as string | undefined,
    outcomeImpact: row.outcome_impact,
    outcomeRecordedAt: row.outcome_recorded_at as string | null,
    outcomeRecordedBy: row.outcome_recorded_by as string | null,
    metadata: row.metadata,
    startedAt: row.started_at as string,
    completedAt: row.completed_at as string | null,
    createdAt: row.created_at as string,
  };
}
