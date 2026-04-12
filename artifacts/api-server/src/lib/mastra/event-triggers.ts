import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { logAction, updateActionStatus, generateActionId } from "./action-audit";

export type TriggerEventType =
  | "new_threat_detected"
  | "compliance_deadline"
  | "vessel_incident"
  | "property_distress"
  | "financial_alert"
  | "agent_error"
  | "workflow_completed"
  | "document_ingested"
  | "custom";

export type TriggerActionType =
  | "run_agent"
  | "execute_tool"
  | "send_notification"
  | "create_workflow"
  | "call_webhook";

export interface TriggerCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "contains" | "exists";
  value?: unknown;
}

export interface WorkflowTrigger {
  triggerId: string;
  name: string;
  description: string;
  eventType: TriggerEventType;
  conditions: TriggerCondition[];
  action: {
    type: TriggerActionType;
    agentId?: string;
    toolName?: string;
    message?: string;
    webhookUrl?: string;
    parameters?: Record<string, unknown>;
  };
  requiresApproval: boolean;
  approvalLevel: "none" | "operator" | "manager" | "executive";
  enabled: boolean;
  createdBy: string;
  executionCount: number;
  lastExecutedAt?: string;
}

export interface TriggerFireResult {
  triggerId: string;
  actionId: string;
  status: "executed" | "pending_approval" | "skipped" | "failed";
  reason?: string;
  approvalId?: string;
}

const triggerRegistry = new Map<string, WorkflowTrigger>();

const pendingApprovals = new Map<string, {
  approvalId: string;
  triggerId: string;
  actionId: string;
  eventData: Record<string, unknown>;
  requestedBy: string;
  createdAt: string;
  decision?: "approved" | "rejected";
  decidedBy?: string;
  decidedAt?: string;
}>();

export async function ensureTriggerTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_workflow_triggers (
        id BIGSERIAL PRIMARY KEY,
        trigger_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        event_type TEXT NOT NULL,
        conditions JSONB DEFAULT '[]',
        action JSONB NOT NULL,
        requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
        approval_level TEXT NOT NULL DEFAULT 'none',
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_by TEXT NOT NULL,
        execution_count INTEGER NOT NULL DEFAULT 0,
        last_executed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_trigger_approvals (
        id BIGSERIAL PRIMARY KEY,
        approval_id TEXT NOT NULL UNIQUE,
        trigger_id TEXT NOT NULL,
        action_id TEXT NOT NULL,
        event_data JSONB DEFAULT '{}',
        requested_by TEXT NOT NULL,
        decision TEXT,
        decided_by TEXT,
        decided_at TIMESTAMPTZ,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_triggers_event_type ON ai_workflow_triggers(event_type);
      CREATE INDEX IF NOT EXISTS idx_ai_triggers_enabled ON ai_workflow_triggers(enabled);
      CREATE INDEX IF NOT EXISTS idx_ai_trigger_approvals_status ON ai_trigger_approvals(decision);
    `);
    logger.info("Workflow trigger tables ensured");
  } catch (err) {
    logger.error({ err }, "Failed to ensure trigger tables");
  }
}

export function registerTrigger(trigger: Omit<WorkflowTrigger, "executionCount" | "lastExecutedAt">): WorkflowTrigger {
  const full: WorkflowTrigger = { ...trigger, executionCount: 0 };
  triggerRegistry.set(trigger.triggerId, full);
  logger.info({ triggerId: trigger.triggerId, eventType: trigger.eventType }, "Workflow trigger registered");
  return full;
}

export function getTrigger(triggerId: string): WorkflowTrigger | undefined {
  return triggerRegistry.get(triggerId);
}

export function listTriggers(filters?: { eventType?: string; enabled?: boolean }): WorkflowTrigger[] {
  return Array.from(triggerRegistry.values()).filter(t => {
    if (filters?.eventType && t.eventType !== filters.eventType) return false;
    if (filters?.enabled !== undefined && t.enabled !== filters.enabled) return false;
    return true;
  });
}

export function removeTrigger(triggerId: string): boolean {
  return triggerRegistry.delete(triggerId);
}

function evaluateCondition(condition: TriggerCondition, eventData: Record<string, unknown>): boolean {
  const value = getNestedValue(eventData, condition.field);
  switch (condition.operator) {
    case "eq": return value === condition.value;
    case "neq": return value !== condition.value;
    case "gt": return typeof value === "number" && typeof condition.value === "number" && value > condition.value;
    case "lt": return typeof value === "number" && typeof condition.value === "number" && value < condition.value;
    case "contains": return typeof value === "string" && typeof condition.value === "string" && value.includes(condition.value);
    case "exists": return value !== undefined && value !== null;
    default: return false;
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((curr, key) => {
    if (curr && typeof curr === "object") return (curr as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

export async function fireTrigger(
  triggerId: string,
  eventData: Record<string, unknown>,
  firedBy: string
): Promise<TriggerFireResult> {
  const trigger = triggerRegistry.get(triggerId);
  if (!trigger) return { triggerId, actionId: "", status: "failed", reason: "Trigger not found" };
  if (!trigger.enabled) return { triggerId, actionId: "", status: "skipped", reason: "Trigger disabled" };

  const conditionsMet = trigger.conditions.every(c => evaluateCondition(c, eventData));
  if (!conditionsMet) return { triggerId, actionId: "", status: "skipped", reason: "Conditions not met" };

  const actionId = generateActionId();

  await logAction({
    actionId,
    actionType: "event_fired",
    triggeredBy: firedBy,
    domain: trigger.action.agentId?.split("-")[0],
    input: { triggerId, eventType: trigger.eventType, eventData },
    status: "running",
    approvalRequired: trigger.requiresApproval,
    metadata: { triggerName: trigger.name, approvalLevel: trigger.approvalLevel },
  });

  if (trigger.requiresApproval) {
    const approvalId = `appr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    pendingApprovals.set(approvalId, {
      approvalId,
      triggerId,
      actionId,
      eventData,
      requestedBy: firedBy,
      createdAt: new Date().toISOString(),
    });

    try {
      await pool.query(
        `INSERT INTO ai_trigger_approvals
         (approval_id, trigger_id, action_id, event_data, requested_by, created_at)
         VALUES ($1,$2,$3,$4,$5,NOW())`,
        [approvalId, triggerId, actionId, JSON.stringify(eventData), firedBy]
      );
    } catch (err) {
      logger.warn({ err }, "Failed to persist trigger approval to DB");
    }

    await updateActionStatus(actionId, "awaiting_approval", {
      output: { approvalId, approvalLevel: trigger.approvalLevel },
    });

    logger.info({ triggerId, approvalId, approvalLevel: trigger.approvalLevel }, "Trigger firing awaiting approval");
    return { triggerId, actionId, status: "pending_approval", approvalId };
  }

  return executeTriggerAction(trigger, eventData, actionId, firedBy);
}

export async function approveTrigger(
  approvalId: string,
  decidedBy: string,
  decision: "approved" | "rejected",
  notes?: string
): Promise<TriggerFireResult & { approvalId: string }> {
  const approval = pendingApprovals.get(approvalId);
  if (!approval) throw new Error(`Approval "${approvalId}" not found`);

  approval.decision = decision;
  approval.decidedBy = decidedBy;
  approval.decidedAt = new Date().toISOString();

  try {
    await pool.query(
      `UPDATE ai_trigger_approvals SET decision=$2, decided_by=$3, decided_at=NOW(), notes=$4 WHERE approval_id=$1`,
      [approvalId, decision, decidedBy, notes ?? null]
    );
  } catch (err) {
    logger.warn({ err }, "Failed to update trigger approval in DB");
  }

  if (decision === "rejected") {
    pendingApprovals.delete(approvalId);
    await updateActionStatus(approval.actionId, "rejected", {
      approvedBy: decidedBy,
      approvalDecision: "rejected",
      approvalNotes: notes,
    });
    return { triggerId: approval.triggerId, actionId: approval.actionId, approvalId, status: "skipped", reason: "Rejected by approver" };
  }

  const trigger = triggerRegistry.get(approval.triggerId);
  if (!trigger) throw new Error(`Trigger "${approval.triggerId}" no longer registered`);

  pendingApprovals.delete(approvalId);

  await updateActionStatus(approval.actionId, "running", {
    approvedBy: decidedBy,
    approvalDecision: "approved",
    approvalNotes: notes,
  });

  const result = await executeTriggerAction(trigger, approval.eventData, approval.actionId, approval.requestedBy);
  return { ...result, approvalId };
}

async function executeTriggerAction(
  trigger: WorkflowTrigger,
  eventData: Record<string, unknown>,
  actionId: string,
  firedBy: string
): Promise<TriggerFireResult> {
  const start = Date.now();

  try {
    let output: unknown;

    switch (trigger.action.type) {
      case "run_agent": {
        output = { agentId: trigger.action.agentId, message: trigger.action.message, eventData };
        logger.info({ triggerId: trigger.triggerId, agentId: trigger.action.agentId }, "Trigger: run_agent (async dispatch)");
        break;
      }

      case "execute_tool": {
        output = { toolName: trigger.action.toolName, parameters: trigger.action.parameters };
        logger.info({ triggerId: trigger.triggerId, toolName: trigger.action.toolName }, "Trigger: execute_tool");
        break;
      }

      case "send_notification": {
        const notifContent = resolveTemplate(trigger.action.message ?? "Event triggered: {{eventType}}", eventData);
        output = { notification: notifContent, sentAt: new Date().toISOString() };
        logger.info({ triggerId: trigger.triggerId, notification: notifContent }, "Trigger: send_notification");
        break;
      }

      case "call_webhook": {
        if (trigger.action.webhookUrl) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 10000);
          try {
            await fetch(trigger.action.webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ triggerId: trigger.triggerId, eventData, firedBy, timestamp: new Date().toISOString() }),
              signal: controller.signal,
            });
            output = { webhookCalled: true, url: trigger.action.webhookUrl };
          } finally {
            clearTimeout(timer);
          }
        }
        break;
      }

      default:
        output = { message: "Trigger action executed", type: trigger.action.type };
    }

    trigger.executionCount++;
    trigger.lastExecutedAt = new Date().toISOString();

    await updateActionStatus(actionId, "completed", { output, latencyMs: Date.now() - start });

    try {
      await pool.query(
        `UPDATE ai_workflow_triggers SET execution_count = execution_count + 1, last_executed_at = NOW(), updated_at = NOW() WHERE trigger_id = $1`,
        [trigger.triggerId]
      );
    } catch {}

    return { triggerId: trigger.triggerId, actionId, status: "executed" };
  } catch (err: any) {
    await updateActionStatus(actionId, "failed", { errorMessage: err.message, latencyMs: Date.now() - start });
    return { triggerId: trigger.triggerId, actionId, status: "failed", reason: err.message };
  }
}

function resolveTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path: string) => {
    const parts = path.split(".");
    let val: unknown = data;
    for (const part of parts) {
      if (val && typeof val === "object") val = (val as Record<string, unknown>)[part];
      else return `{{${path}}}`;
    }
    return val != null ? String(val) : `{{${path}}}`;
  });
}

export async function emitDomainEvent(
  eventType: TriggerEventType,
  eventData: Record<string, unknown>,
  emittedBy: string
): Promise<TriggerFireResult[]> {
  const matchingTriggers = Array.from(triggerRegistry.values()).filter(
    t => t.enabled && t.eventType === eventType
  );

  if (matchingTriggers.length === 0) return [];

  const results = await Promise.allSettled(
    matchingTriggers.map(t => fireTrigger(t.triggerId, eventData, emittedBy))
  );

  return results.map(r => {
    if (r.status === "fulfilled") return r.value;
    return { triggerId: "unknown", actionId: "", status: "failed" as const, reason: r.reason?.message };
  });
}

export function getPendingApprovals(): Array<typeof pendingApprovals extends Map<string, infer V> ? V : never> {
  return Array.from(pendingApprovals.values()).filter(a => !a.decision);
}

export function registerDefaultTriggers(): void {
  registerTrigger({
    triggerId: "trig_threat_brief_prism",
    name: "New Threat → Brief Prism Counsel",
    description: "When a new critical threat is detected, automatically brief the Prism legal team",
    eventType: "new_threat_detected",
    conditions: [
      { field: "severity", operator: "eq", value: "critical" },
    ],
    action: {
      type: "run_agent",
      agentId: "prism-legal",
      message: "A critical security threat has been detected. Please prepare a compliance brief.",
    },
    requiresApproval: true,
    approvalLevel: "manager",
    enabled: true,
    createdBy: "system",
  });

  registerTrigger({
    triggerId: "trig_compliance_deadline",
    name: "Compliance Deadline Alert",
    description: "Notify relevant agents when a compliance deadline is approaching",
    eventType: "compliance_deadline",
    conditions: [
      { field: "daysRemaining", operator: "lt", value: 7 },
    ],
    action: {
      type: "send_notification",
      message: "Compliance deadline approaching in {{daysRemaining}} days: {{deadline}}",
    },
    requiresApproval: false,
    approvalLevel: "none",
    enabled: true,
    createdBy: "system",
  });

  registerTrigger({
    triggerId: "trig_vessel_incident",
    name: "Vessel Incident → Aegis Alert",
    description: "Forward vessel incidents to the Aegis defense team for threat assessment",
    eventType: "vessel_incident",
    conditions: [
      { field: "incidentType", operator: "exists" },
    ],
    action: {
      type: "run_agent",
      agentId: "aegis-defense",
      message: "A vessel incident has been reported. Conduct threat assessment.",
    },
    requiresApproval: false,
    approvalLevel: "none",
    enabled: true,
    createdBy: "system",
  });

  logger.info("Registered 3 default workflow triggers");
}
