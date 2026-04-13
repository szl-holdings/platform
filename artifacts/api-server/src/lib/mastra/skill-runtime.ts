import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { executeTool } from "./tool-registry";
import { logAction, updateActionStatus, generateActionId } from "./action-audit";
import { emitActivityEvent } from "./agent-activity";
import {
  getSkill, getUserAutonomyLevel, getSkillOrgConfigs, isSkillEnabledForOrg,
  recordSkillInvocation, type AutonomyLevel,
} from "./skills-registry";
import type { AgentExecutionContext } from "./types";

export interface SkillExecutionRequest {
  skillId: string;
  input: Record<string, unknown>;
  agentId: string;
  userId?: string;
  orgId?: string;
  domain?: string;
  runId?: string;
  parentEventId?: string;
  autonomyOverride?: AutonomyLevel;
}

export interface SkillExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  latencyMs: number;
  skillId: string;
  autonomyLevel: AutonomyLevel;
  actionId: string;
  requiresApproval: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  eventId: string;
}

export interface PendingApproval {
  actionId: string;
  eventId: string;
  skillId: string;
  skillLabel?: string;
  agentId: string;
  userId?: string;
  input: Record<string, unknown>;
  requestedAt: Date;
  reason: string;
}

export async function ensureSkillRuntimeTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_skill_pending_approvals (
        id BIGSERIAL PRIMARY KEY,
        action_id TEXT NOT NULL UNIQUE,
        event_id TEXT NOT NULL,
        skill_id TEXT NOT NULL,
        skill_label TEXT,
        agent_id TEXT NOT NULL,
        user_id TEXT,
        org_id TEXT,
        input JSONB NOT NULL DEFAULT '{}',
        reason TEXT NOT NULL DEFAULT 'Advisor mode requires approval',
        approved_by TEXT,
        approval_decision TEXT,
        approval_notes TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        decided_at TIMESTAMPTZ,
        executed_at TIMESTAMPTZ
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_pending_approvals_user_id ON ai_skill_pending_approvals(user_id);
      CREATE INDEX IF NOT EXISTS idx_pending_approvals_status ON ai_skill_pending_approvals(status);
    `);
    logger.info("Skill runtime tables ensured");
  } catch (err) {
    logger.warn({ err }, "Failed to ensure skill runtime tables (non-fatal)");
  }
}

export async function executeSkill(
  request: SkillExecutionRequest,
  context: AgentExecutionContext
): Promise<SkillExecutionResult> {
  const startTime = Date.now();
  const actionId = generateActionId();

  const skill = await getSkill(request.skillId);
  if (!skill) {
    return {
      success: false,
      error: `Skill "${request.skillId}" not found`,
      latencyMs: Date.now() - startTime,
      skillId: request.skillId,
      autonomyLevel: "observer",
      actionId,
      requiresApproval: false,
      eventId: "",
    };
  }

  if (skill.status === "inactive" || skill.status === "deprecated") {
    return {
      success: false,
      error: `Skill "${request.skillId}" is ${skill.status}`,
      latencyMs: Date.now() - startTime,
      skillId: request.skillId,
      autonomyLevel: "observer",
      actionId,
      requiresApproval: false,
      eventId: "",
    };
  }

  if (request.orgId) {
    const enabled = await isSkillEnabledForOrg(request.skillId, request.orgId);
    if (!enabled) {
      return {
        success: false,
        error: `Skill "${request.skillId}" is disabled for this organization`,
        latencyMs: Date.now() - startTime,
        skillId: request.skillId,
        autonomyLevel: "observer",
        actionId,
        requiresApproval: false,
        eventId: "",
      };
    }
  }

  let effectiveAutonomy: AutonomyLevel = request.autonomyOverride ?? "observer";
  if (!request.autonomyOverride) {
    if (request.userId) {
      effectiveAutonomy = await getUserAutonomyLevel(request.userId, request.skillId);
    }

    if (request.orgId) {
      const orgConfigs = await getSkillOrgConfigs(request.skillId);
      const orgConfig = orgConfigs.find(c => c.orgId === request.orgId);
      if (orgConfig?.autonomyLevelOverride) {
        effectiveAutonomy = orgConfig.autonomyLevelOverride;
      }
    }
  }

  const levelOrder = { observer: 0, advisor: 1, operator: 2 };
  const requiredLevel = levelOrder[skill.required_autonomy_level as AutonomyLevel] ?? 0;
  const userLevel = levelOrder[effectiveAutonomy] ?? 0;

  await logAction({
    actionId,
    actionType: "tool_call",
    triggeredBy: request.userId ?? request.agentId,
    agentId: request.agentId,
    toolName: request.skillId,
    domain: request.domain,
    input: request.input,
    status: "running",
    approvalRequired: effectiveAutonomy === "advisor" && requiredLevel >= 1,
    metadata: { autonomyLevel: effectiveAutonomy, skillLabel: skill.label },
  });

  const startEventId = await emitActivityEvent({
    eventType: "skill_invoked",
    agentId: request.agentId,
    agentName: context.agentId,
    skillId: request.skillId,
    skillLabel: skill.label,
    domain: request.domain ?? context.domain,
    userId: request.userId,
    runId: request.runId ?? context.runId,
    parentEventId: request.parentEventId,
    input: request.input,
    autonomyLevel: effectiveAutonomy,
    requiresApproval: effectiveAutonomy === "advisor" && requiredLevel >= 1,
    metadata: { category: skill.category, requiredAutonomyLevel: skill.required_autonomy_level },
  });

  if (effectiveAutonomy === "observer") {
    const toolName = request.skillId.replace(/-/g, "_");
    const result = await executeTool(toolName, request.input, context);
    const latencyMs = Date.now() - startTime;

    await Promise.all([
      recordSkillInvocation(request.skillId, !result.error, latencyMs),
      updateActionStatus(actionId, result.error ? "failed" : "completed", {
        output: result.output,
        errorMessage: result.error,
        latencyMs,
      }),
      emitActivityEvent({
        eventType: result.error ? "skill_failed" : "skill_completed",
        agentId: request.agentId,
        skillId: request.skillId,
        skillLabel: skill.label,
        domain: request.domain ?? context.domain,
        userId: request.userId,
        runId: request.runId ?? context.runId,
        parentEventId: startEventId,
        output: result.output as Record<string, unknown> | undefined,
        latencyMs,
        autonomyLevel: effectiveAutonomy,
        metadata: { success: !result.error, error: result.error },
      }),
    ]);

    return {
      success: !result.error,
      output: result.output,
      error: result.error,
      latencyMs,
      skillId: request.skillId,
      autonomyLevel: effectiveAutonomy,
      actionId,
      requiresApproval: false,
      eventId: startEventId,
    };
  }

  if (effectiveAutonomy === "advisor") {
    const pendingApprovalId = await queueForApproval({
      actionId,
      eventId: startEventId,
      skillId: request.skillId,
      skillLabel: skill.label,
      agentId: request.agentId,
      userId: request.userId,
      orgId: request.orgId,
      input: request.input,
      reason: `Advisor mode: skill "${skill.label}" requires human approval before execution`,
    });

    await updateActionStatus(actionId, "awaiting_approval");

    await emitActivityEvent({
      eventType: "approval_requested",
      agentId: request.agentId,
      skillId: request.skillId,
      skillLabel: skill.label,
      domain: request.domain ?? context.domain,
      userId: request.userId,
      runId: request.runId ?? context.runId,
      parentEventId: startEventId,
      autonomyLevel: effectiveAutonomy,
      requiresApproval: true,
      approvalStatus: "pending",
      metadata: { actionId, pendingApprovalId, reason: `Skill requires advisor approval` },
    });

    return {
      success: true,
      output: { queued: true, pendingApprovalId, message: `Skill "${skill.label}" queued for approval` },
      latencyMs: Date.now() - startTime,
      skillId: request.skillId,
      autonomyLevel: effectiveAutonomy,
      actionId,
      requiresApproval: true,
      approvalStatus: "pending",
      eventId: startEventId,
    };
  }

  if (effectiveAutonomy === "operator") {
    const toolName = request.skillId.replace(/-/g, "_");
    const result = await executeTool(toolName, request.input, context);
    const latencyMs = Date.now() - startTime;

    await Promise.all([
      recordSkillInvocation(request.skillId, !result.error, latencyMs),
      updateActionStatus(actionId, result.error ? "failed" : "completed", {
        output: result.output,
        errorMessage: result.error,
        latencyMs,
        approvedBy: "operator-auto",
        approvalDecision: "approved",
        approvalNotes: "Operator mode: auto-approved",
      }),
      emitActivityEvent({
        eventType: result.error ? "skill_failed" : "skill_completed",
        agentId: request.agentId,
        skillId: request.skillId,
        skillLabel: skill.label,
        domain: request.domain ?? context.domain,
        userId: request.userId,
        runId: request.runId ?? context.runId,
        parentEventId: startEventId,
        output: result.output as Record<string, unknown> | undefined,
        latencyMs,
        autonomyLevel: effectiveAutonomy,
        approvalStatus: "approved",
        metadata: { success: !result.error, operatorAutoApproved: true },
      }),
    ]);

    return {
      success: !result.error,
      output: result.output,
      error: result.error,
      latencyMs,
      skillId: request.skillId,
      autonomyLevel: effectiveAutonomy,
      actionId,
      requiresApproval: false,
      approvalStatus: "approved",
      eventId: startEventId,
    };
  }

  return {
    success: false,
    error: `Unknown autonomy level: ${effectiveAutonomy}`,
    latencyMs: Date.now() - startTime,
    skillId: request.skillId,
    autonomyLevel: effectiveAutonomy,
    actionId,
    requiresApproval: false,
    eventId: startEventId,
  };
}

async function queueForApproval(params: {
  actionId: string;
  eventId: string;
  skillId: string;
  skillLabel?: string;
  agentId: string;
  userId?: string;
  orgId?: string;
  input: Record<string, unknown>;
  reason: string;
}): Promise<string> {
  await pool.query(
    `INSERT INTO ai_skill_pending_approvals
     (action_id, event_id, skill_id, skill_label, agent_id, user_id, org_id, input, reason, status, requested_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',NOW())
     ON CONFLICT (action_id) DO NOTHING`,
    [
      params.actionId, params.eventId, params.skillId, params.skillLabel ?? params.skillId,
      params.agentId, params.userId ?? null, params.orgId ?? null,
      JSON.stringify(params.input), params.reason,
    ]
  );
  return params.actionId;
}

export async function approveSkillExecution(
  actionId: string,
  approvedBy: string,
  notes?: string
): Promise<{ success: boolean; result?: SkillExecutionResult; error?: string }> {
  try {
    const result = await pool.query(
      "SELECT * FROM ai_skill_pending_approvals WHERE action_id = $1 AND status = 'pending'",
      [actionId]
    );
    if (result.rows.length === 0) {
      return { success: false, error: "Pending approval not found or already decided" };
    }

    const pending = result.rows[0];
    await pool.query(
      `UPDATE ai_skill_pending_approvals SET
         status = 'approved', approved_by = $2, approval_decision = 'approved',
         approval_notes = $3, decided_at = NOW()
       WHERE action_id = $1`,
      [actionId, approvedBy, notes ?? null]
    );

    await updateActionStatus(actionId, "running", {
      approvedBy,
      approvalDecision: "approved",
      approvalNotes: notes,
    });

    await emitActivityEvent({
      eventType: "approval_granted",
      agentId: pending.agent_id,
      skillId: pending.skill_id,
      skillLabel: pending.skill_label,
      userId: pending.user_id,
      parentEventId: pending.event_id,
      autonomyLevel: "advisor",
      approvalStatus: "approved",
      metadata: { actionId, approvedBy, notes },
    });

    return { success: true };
  } catch (err: any) {
    logger.error({ err, actionId }, "Failed to approve skill execution");
    return { success: false, error: err.message };
  }
}

export async function rejectSkillExecution(
  actionId: string,
  rejectedBy: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await pool.query(
      "SELECT * FROM ai_skill_pending_approvals WHERE action_id = $1 AND status = 'pending'",
      [actionId]
    );
    if (result.rows.length === 0) {
      return { success: false, error: "Pending approval not found or already decided" };
    }

    const pending = result.rows[0];
    await pool.query(
      `UPDATE ai_skill_pending_approvals SET
         status = 'rejected', approved_by = $2, approval_decision = 'rejected',
         approval_notes = $3, decided_at = NOW()
       WHERE action_id = $1`,
      [actionId, rejectedBy, reason ?? null]
    );

    await updateActionStatus(actionId, "rejected", {
      approvedBy: rejectedBy,
      approvalDecision: "rejected",
      approvalNotes: reason,
    });

    await emitActivityEvent({
      eventType: "approval_rejected",
      agentId: pending.agent_id,
      skillId: pending.skill_id,
      skillLabel: pending.skill_label,
      userId: pending.user_id,
      parentEventId: pending.event_id,
      autonomyLevel: "advisor",
      approvalStatus: "rejected",
      metadata: { actionId, rejectedBy, reason },
    });

    return { success: true };
  } catch (err: any) {
    logger.error({ err, actionId }, "Failed to reject skill execution");
    return { success: false, error: err.message };
  }
}

export async function getPendingApprovals(filters?: {
  userId?: string;
  orgId?: string;
  agentId?: string;
  limit?: number;
}): Promise<PendingApproval[]> {
  const conditions = ["status = 'pending'"];
  const params: any[] = [];
  let idx = 1;

  if (filters?.userId) { conditions.push(`user_id = $${idx}`); params.push(filters.userId); idx++; }
  if (filters?.orgId) { conditions.push(`org_id = $${idx}`); params.push(filters.orgId); idx++; }
  if (filters?.agentId) { conditions.push(`agent_id = $${idx}`); params.push(filters.agentId); idx++; }
  params.push(filters?.limit ?? 20);

  const result = await pool.query(
    `SELECT * FROM ai_skill_pending_approvals WHERE ${conditions.join(" AND ")}
     ORDER BY requested_at DESC LIMIT $${idx}`,
    params
  );

  return result.rows.map((r: any) => ({
    actionId: r.action_id,
    eventId: r.event_id,
    skillId: r.skill_id,
    skillLabel: r.skill_label,
    agentId: r.agent_id,
    userId: r.user_id,
    input: r.input,
    requestedAt: r.requested_at,
    reason: r.reason,
  }));
}
