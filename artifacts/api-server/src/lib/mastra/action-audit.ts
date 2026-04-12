import { pool } from "@szl-holdings/db";
import { logger } from "../logger";

export interface ActionAuditEntry {
  actionId: string;
  actionType: "tool_call" | "document_processed" | "workflow_triggered" | "nla_routed" | "event_fired" | "approval_requested" | "approval_decision";
  triggeredBy: string;
  agentId?: string;
  toolName?: string;
  domain?: string;
  input?: unknown;
  output?: unknown;
  status: "pending" | "running" | "completed" | "failed" | "rejected" | "awaiting_approval";
  errorMessage?: string;
  latencyMs?: number;
  approvalRequired: boolean;
  approvedBy?: string;
  approvalDecision?: "approved" | "rejected";
  approvalNotes?: string;
  metadata?: Record<string, unknown>;
}

export async function ensureActionAuditTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_action_audit (
        id BIGSERIAL PRIMARY KEY,
        action_id TEXT NOT NULL UNIQUE,
        action_type TEXT NOT NULL,
        triggered_by TEXT NOT NULL,
        agent_id TEXT,
        tool_name TEXT,
        domain TEXT,
        input JSONB,
        output JSONB,
        status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT,
        latency_ms INTEGER,
        approval_required BOOLEAN NOT NULL DEFAULT FALSE,
        approved_by TEXT,
        approval_decision TEXT,
        approval_notes TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_action_audit_action_type ON ai_action_audit(action_type);
      CREATE INDEX IF NOT EXISTS idx_ai_action_audit_triggered_by ON ai_action_audit(triggered_by);
      CREATE INDEX IF NOT EXISTS idx_ai_action_audit_status ON ai_action_audit(status);
      CREATE INDEX IF NOT EXISTS idx_ai_action_audit_domain ON ai_action_audit(domain);
      CREATE INDEX IF NOT EXISTS idx_ai_action_audit_created_at ON ai_action_audit(created_at DESC);
    `);
    logger.info("ai_action_audit table ensured");
  } catch (err) {
    logger.error({ err }, "Failed to ensure ai_action_audit table");
  }
}

export async function logAction(entry: ActionAuditEntry): Promise<string> {
  try {
    await pool.query(
      `INSERT INTO ai_action_audit
       (action_id, action_type, triggered_by, agent_id, tool_name, domain,
        input, output, status, error_message, latency_ms, approval_required,
        approved_by, approval_decision, approval_notes, metadata, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW(),NOW())
       ON CONFLICT (action_id) DO UPDATE SET
         status = EXCLUDED.status,
         output = EXCLUDED.output,
         error_message = EXCLUDED.error_message,
         latency_ms = EXCLUDED.latency_ms,
         approved_by = EXCLUDED.approved_by,
         approval_decision = EXCLUDED.approval_decision,
         approval_notes = EXCLUDED.approval_notes,
         updated_at = NOW()`,
      [
        entry.actionId,
        entry.actionType,
        entry.triggeredBy,
        entry.agentId ?? null,
        entry.toolName ?? null,
        entry.domain ?? null,
        entry.input != null ? JSON.stringify(entry.input) : null,
        entry.output != null ? JSON.stringify(entry.output) : null,
        entry.status,
        entry.errorMessage ?? null,
        entry.latencyMs ?? null,
        entry.approvalRequired,
        entry.approvedBy ?? null,
        entry.approvalDecision ?? null,
        entry.approvalNotes ?? null,
        JSON.stringify(entry.metadata ?? {}),
      ]
    );
    return entry.actionId;
  } catch (err) {
    logger.error({ err, actionId: entry.actionId }, "Failed to log action audit entry");
    return entry.actionId;
  }
}

export async function updateActionStatus(
  actionId: string,
  status: ActionAuditEntry["status"],
  updates?: {
    output?: unknown;
    errorMessage?: string;
    latencyMs?: number;
    approvedBy?: string;
    approvalDecision?: "approved" | "rejected";
    approvalNotes?: string;
  }
): Promise<void> {
  try {
    await pool.query(
      `UPDATE ai_action_audit SET
         status = $2,
         output = COALESCE($3, output),
         error_message = COALESCE($4, error_message),
         latency_ms = COALESCE($5, latency_ms),
         approved_by = COALESCE($6, approved_by),
         approval_decision = COALESCE($7, approval_decision),
         approval_notes = COALESCE($8, approval_notes),
         updated_at = NOW()
       WHERE action_id = $1`,
      [
        actionId,
        status,
        updates?.output != null ? JSON.stringify(updates.output) : null,
        updates?.errorMessage ?? null,
        updates?.latencyMs ?? null,
        updates?.approvedBy ?? null,
        updates?.approvalDecision ?? null,
        updates?.approvalNotes ?? null,
      ]
    );
  } catch (err) {
    logger.error({ err, actionId }, "Failed to update action audit status");
  }
}

export async function listActionAudit(filters?: {
  actionType?: string;
  status?: string;
  domain?: string;
  triggeredBy?: string;
  approvalRequired?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ entries: ActionAuditEntry[]; total: number }> {
  const conditions = ["1=1"];
  const params: any[] = [];
  let idx = 1;

  if (filters?.actionType) { conditions.push(`action_type = $${idx}`); params.push(filters.actionType); idx++; }
  if (filters?.status) { conditions.push(`status = $${idx}`); params.push(filters.status); idx++; }
  if (filters?.domain) { conditions.push(`domain = $${idx}`); params.push(filters.domain); idx++; }
  if (filters?.triggeredBy) { conditions.push(`triggered_by = $${idx}`); params.push(filters.triggeredBy); idx++; }
  if (filters?.approvalRequired !== undefined) { conditions.push(`approval_required = $${idx}`); params.push(filters.approvalRequired); idx++; }

  const where = conditions.join(" AND ");

  try {
    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT * FROM ai_action_audit WHERE ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, filters?.limit ?? 50, filters?.offset ?? 0]
      ),
      pool.query(`SELECT COUNT(*) as cnt FROM ai_action_audit WHERE ${where}`, params),
    ]);

    return {
      entries: dataResult.rows.map(rowToEntry),
      total: parseInt(countResult.rows[0]?.cnt ?? "0"),
    };
  } catch (err) {
    logger.error({ err }, "Failed to list action audit");
    return { entries: [], total: 0 };
  }
}

export async function getActionAuditEntry(actionId: string): Promise<ActionAuditEntry | null> {
  try {
    const result = await pool.query("SELECT * FROM ai_action_audit WHERE action_id = $1", [actionId]);
    if (result.rows.length === 0) return null;
    return rowToEntry(result.rows[0]);
  } catch (err) {
    logger.error({ err, actionId }, "Failed to get action audit entry");
    return null;
  }
}

function rowToEntry(row: any): ActionAuditEntry {
  return {
    actionId: row.action_id,
    actionType: row.action_type,
    triggeredBy: row.triggered_by,
    agentId: row.agent_id,
    toolName: row.tool_name,
    domain: row.domain,
    input: row.input,
    output: row.output,
    status: row.status,
    errorMessage: row.error_message,
    latencyMs: row.latency_ms,
    approvalRequired: row.approval_required,
    approvedBy: row.approved_by,
    approvalDecision: row.approval_decision,
    approvalNotes: row.approval_notes,
    metadata: row.metadata,
  };
}

export function generateActionId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
