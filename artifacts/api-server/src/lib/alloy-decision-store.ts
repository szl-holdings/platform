import { pool } from "@szl-holdings/db";
import { logger } from "./logger";
import type { AlloyDecision } from "@szl-holdings/ai-engine";


export async function insertDecision(decision: Partial<AlloyDecision> & Record<string, unknown>, orgId?: number | null): Promise<void> {
  await pool.query(
    `INSERT INTO alloy_ai_decisions (
      decision_id, org_id, workflow_id, signal_ids, recommended_action, rationale_summary,
      evidence_refs, confidence, owner_suggestion, approval_required, risk_level,
      fallback_plan, model_route, schema_version, status, raw_input, raw_output, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW())
    ON CONFLICT (decision_id) DO NOTHING`,
    [
      decision.decisionId,
      orgId ?? null,
      decision.workflowId,
      JSON.stringify(decision.signalIds),
      decision.recommendedAction,
      decision.rationaleSummary,
      JSON.stringify(decision.evidenceRefs),
      decision.confidence,
      decision.ownerSuggestion,
      decision.approvalRequired,
      decision.riskLevel,
      decision.fallbackPlan,
      decision.modelRoute,
      decision.schemaVersion,
      decision.status,
      decision.rawInput,
      decision.rawOutput,
      decision.createdAt,
    ],
  );
}

export async function updateDecisionStatus(
  decisionId: string,
  patch: Partial<Pick<AlloyDecision, "status" | "approvedBy" | "approvedAt" | "rejectedBy" | "rejectedAt" | "rejectionReason" | "executionOutcome" | "executedAt">>,
  orgId: number | null,
  isAdmin?: boolean,
): Promise<void> {
  if (!isAdmin && (orgId === null || orgId === undefined)) {
    throw new Error("NO_ORG: non-admin users must have an org to update decisions");
  }
  const sets: string[] = ["updated_at = NOW()"];
  const values: unknown[] = [];
  let idx = 1;

  if (patch.status !== undefined) { sets.push(`status = $${idx++}`); values.push(patch.status); }
  if (patch.approvedBy !== undefined) { sets.push(`approved_by = $${idx++}`); values.push(patch.approvedBy); }
  if (patch.approvedAt !== undefined) { sets.push(`approved_at = $${idx++}`); values.push(patch.approvedAt); }
  if (patch.rejectedBy !== undefined) { sets.push(`rejected_by = $${idx++}`); values.push(patch.rejectedBy); }
  if (patch.rejectedAt !== undefined) { sets.push(`rejected_at = $${idx++}`); values.push(patch.rejectedAt); }
  if (patch.rejectionReason !== undefined) { sets.push(`rejection_reason = $${idx++}`); values.push(patch.rejectionReason); }
  if (patch.executionOutcome !== undefined) { sets.push(`execution_outcome = $${idx++}`); values.push(patch.executionOutcome); }
  if (patch.executedAt !== undefined) { sets.push(`executed_at = $${idx++}`); values.push(patch.executedAt); }

  if (sets.length === 1) return;

  values.push(decisionId);
  let sql = `UPDATE alloy_ai_decisions SET ${sets.join(", ")} WHERE decision_id = $${idx}`;

  if (orgId !== undefined && orgId !== null) {
    sql += ` AND org_id = $${++idx}`;
    values.push(orgId);
  }

  await pool.query(sql, values);
}

function rowToDecision(row: Record<string, unknown>): AlloyDecision {
  return {
    decisionId: row.decision_id as string,
    workflowId: row.workflow_id as string | null,
    signalIds: (row.signal_ids as string[]) ?? [],
    recommendedAction: row.recommended_action as string,
    rationaleSummary: row.rationale_summary as string,
    evidenceRefs: (row.evidence_refs as AlloyDecision["evidenceRefs"]) ?? [],
    confidence: Number(row.confidence),
    ownerSuggestion: row.owner_suggestion as string | null,
    approvalRequired: Boolean(row.approval_required),
    riskLevel: row.risk_level as AlloyDecision["riskLevel"],
    fallbackPlan: row.fallback_plan as string | null,
    modelRoute: row.model_route as string,
    schemaVersion: "2.0.0" as const,
    status: row.status as AlloyDecision["status"],
    approvedBy: (row.approved_by as string | null) ?? null,
    approvedAt: (row.approved_at as string | null) ?? null,
    rejectedBy: (row.rejected_by as string | null) ?? null,
    rejectedAt: (row.rejected_at as string | null) ?? null,
    rejectionReason: (row.rejection_reason as string | null) ?? null,
    executedAt: (row.executed_at as string | null) ?? null,
    executionOutcome: (row.execution_outcome as AlloyDecision["executionOutcome"]) ?? null,
    rawInput: (row.raw_input as string | null) ?? null,
    rawOutput: (row.raw_output as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function listDecisions(opts: {
  limit: number;
  offset: number;
  status?: string;
  riskLevel?: string;
  orgId: number | null;
  isAdmin: boolean;
}): Promise<{ total: number; decisions: AlloyDecision[] }> {
  if (!opts.isAdmin && (opts.orgId === null || opts.orgId === undefined)) {
    return { total: 0, decisions: [] };
  }

  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (!opts.isAdmin) {
    conditions.push(`org_id = $${idx++}`);
    values.push(opts.orgId);
  }
  if (opts.status) { conditions.push(`status = $${idx++}`); values.push(opts.status); }
  if (opts.riskLevel) { conditions.push(`risk_level = $${idx++}`); values.push(opts.riskLevel); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [countResult, rowsResult] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total FROM alloy_ai_decisions ${where}`, values),
    pool.query(
      `SELECT * FROM alloy_ai_decisions ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      [...values, opts.limit, opts.offset],
    ),
  ]);

  return {
    total: (countResult.rows[0] as { total: number }).total,
    decisions: rowsResult.rows.map(r => rowToDecision(r as Record<string, unknown>)),
  };
}

export async function getDecision(decisionId: string, orgId: number | null, isAdmin: boolean): Promise<AlloyDecision | null> {
  if (!isAdmin && (orgId === null || orgId === undefined)) {
    return null;
  }

  let sql = `SELECT * FROM alloy_ai_decisions WHERE decision_id = $1`;
  const values: unknown[] = [decisionId];

  if (!isAdmin) {
    sql += ` AND org_id = $2`;
    values.push(orgId);
  }

  const result = await pool.query(sql, values);
  if (!result.rows.length) return null;
  return rowToDecision(result.rows[0] as Record<string, unknown>);
}

export async function appendAuditEntry(entry: {
  decisionId?: string | null;
  orgId?: number | null;
  endpoint: string;
  model?: string | null;
  routeClass?: string | null;
  confidence?: number | null;
  latencyMs?: number | null;
  approverUserId?: number | null;
  approverRoles?: string[] | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO alloy_ai_audit_log
        (decision_id, org_id, endpoint, model, route_class, confidence, latency_ms, approver_user_id, approver_roles, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        entry.decisionId ?? null,
        entry.orgId ?? null,
        entry.endpoint,
        entry.model ?? null,
        entry.routeClass ?? null,
        entry.confidence ?? null,
        entry.latencyMs ?? null,
        entry.approverUserId ?? null,
        entry.approverRoles ? JSON.stringify(entry.approverRoles) : null,
        JSON.stringify(entry.metadata ?? {}),
      ],
    );
  } catch (err) {
    logger.warn({ err, endpoint: entry.endpoint }, "Audit log append failed (non-fatal)");
  }
}

export async function listAuditEntries(opts: {
  limit?: number;
  offset?: number;
  orgId: number | null;
  isAdmin: boolean;
}): Promise<{ total: number; entries: Array<Record<string, unknown>> }> {
  if (!opts.isAdmin && (opts.orgId === null || opts.orgId === undefined)) {
    return { total: 0, entries: [] };
  }

  const limit = Math.min(opts.limit ?? 50, 200);
  const offset = opts.offset ?? 0;
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (!opts.isAdmin) {
    conditions.push(`org_id = $${idx++}`);
    values.push(opts.orgId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [countResult, rowsResult] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total FROM alloy_ai_audit_log ${where}`, values),
    pool.query(
      `SELECT * FROM alloy_ai_audit_log ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      [...values, limit, offset],
    ),
  ]);

  return {
    total: (countResult.rows[0] as { total: number }).total,
    entries: rowsResult.rows as Array<Record<string, unknown>>,
  };
}
