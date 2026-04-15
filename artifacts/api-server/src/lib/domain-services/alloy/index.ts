import { domainEventBus } from "../../domain-events/index.js";

// ─── Port Interfaces ───────────────────────────────────────────────────────────

export interface AlloyStoragePort {
  listSignals(args: { severity?: string; status?: string; domain?: string; limit: number; offset: number }): Promise<unknown[]>;
  getSignal(id: number): Promise<unknown | null>;
  listWorkflows(args: { status?: string; priority?: string; domain?: string; limit: number; offset: number }): Promise<unknown[]>;
  getWorkflow(id: number): Promise<unknown | null>;
  getWorkflowStatus(id: number): Promise<string | null>;
  listWorkflowRuns(args: { workflowId?: number; status?: string; limit: number; offset: number }): Promise<unknown[]>;
  getWorkflowRun(id: number): Promise<unknown | null>;
  listApprovals(args: { workflowId?: number; status?: string; limit: number; offset: number }): Promise<unknown[]>;
  getApproval(id: number): Promise<unknown | null>;
  listActions(args: { workflowId?: number; limit: number; offset: number }): Promise<unknown[]>;
  listArtifacts(args: { workflowId?: number; domain?: string; limit: number; offset: number }): Promise<unknown[]>;
  listAuditLog(args: { entityType?: string; entityId?: number; limit: number; offset: number }): Promise<unknown[]>;
  getDashboardStats(): Promise<AlloyDashboardStats>;
  createWorkflow(data: CreateWorkflowInput): Promise<unknown>;
  updateWorkflow(id: number, data: Record<string, unknown>): Promise<unknown>;
}

export interface CreateWorkflowInput {
  name: string;
  type?: string;
  priority?: string;
  description?: string;
  domain?: string;
  requiresApproval?: boolean;
}

export interface AlloyDashboardStats {
  totalWorkflows: number;
  totalRuns: number;
  runningRuns: number;
  pendingApprovals: number;
  failedRuns: number;
  successRate: number;
  avgDurationMs?: number | null;
  workflowsByStatus: Array<{ status: string; count: number }>;
  recentActivity: unknown[];
}

// ─── Workflow State Machine ────────────────────────────────────────────────────

export const WORKFLOW_STATE_MACHINE: Record<string, string[]> = {
  draft:            ["pending", "cancelled"],
  pending:          ["waiting_approval", "running", "cancelled"],
  waiting_approval: ["approved", "rejected", "cancelled"],
  approved:         ["running", "cancelled"],
  running:          ["completed", "failed", "cancelled"],
  failed:           ["pending", "cancelled"],
  completed:        [],
  rejected:         [],
  cancelled:        [],
};

export function canTransition(from: string, to: string): boolean {
  return (WORKFLOW_STATE_MACHINE[from] ?? []).includes(to);
}

export type WorkflowType = "investigation" | "remediation" | "escalation" | "review" | "notification" | "report" | "custom";
export type WorkflowPriority = "low" | "medium" | "high" | "critical";
export type WorkflowStatus = "draft" | "pending" | "running" | "waiting_approval" | "approved" | "rejected" | "completed" | "failed" | "cancelled";
export type WorkflowRunStatus = "started" | "completed" | "failed" | "cancelled";
export type ActionType = "alert" | "notify" | "escalate" | "assign" | "resolve" | "suppress" | "review" | "remediate" | "report" | "custom";

export const VALID_WORKFLOW_TYPES = new Set<WorkflowType>(["investigation", "remediation", "escalation", "review", "notification", "report", "custom"]);
export const VALID_PRIORITIES = new Set<WorkflowPriority>(["low", "medium", "high", "critical"]);
export const VALID_WORKFLOW_STATUSES = new Set<WorkflowStatus>(["draft", "pending", "running", "waiting_approval", "approved", "rejected", "completed", "failed", "cancelled"]);

export function coerceWorkflowType(t: string | undefined): WorkflowType {
  return VALID_WORKFLOW_TYPES.has(t as WorkflowType) ? (t as WorkflowType) : "investigation";
}

export function coercePriority(p: string | undefined): WorkflowPriority {
  return VALID_PRIORITIES.has(p as WorkflowPriority) ? (p as WorkflowPriority) : "medium";
}

// ─── Workflow Enrichment ──────────────────────────────────────────────────────

export function enrichWorkflow(workflow: Record<string, unknown>): Record<string, unknown> {
  const status = String(workflow.status ?? "pending");
  const allowed = WORKFLOW_STATE_MACHINE[status] ?? [];
  return {
    ...workflow,
    canRun: allowed.includes("running"),
    canCancel: allowed.includes("cancelled"),
    canRetry: status === "failed",
    allowedNextStates: allowed,
    steps: Array.isArray(workflow.steps) ? workflow.steps : [],
    requiresApproval: workflow.requiresApproval ?? false,
    approvalState: workflow.approvalState ?? "none",
  };
}

export function auditEntrySerialize(r: Record<string, unknown>): Record<string, unknown> {
  return {
    ...r,
    previousState: r.previousState ? JSON.stringify(r.previousState) : null,
    newState: r.newState ? JSON.stringify(r.newState) : null,
  };
}

// ─── Domain Service Functions ─────────────────────────────────────────────────

export async function listAlloySignals(storage: AlloyStoragePort, args: { severity?: string; status?: string; domain?: string; limit?: number; offset?: number }) {
  return storage.listSignals({ severity: args.severity, status: args.status, domain: args.domain, limit: args.limit ?? 50, offset: args.offset ?? 0 });
}

export async function getAlloySignal(storage: AlloyStoragePort, id: number) {
  return storage.getSignal(id);
}

export async function listAlloyWorkflows(storage: AlloyStoragePort, args: { status?: string; priority?: string; domain?: string; limit?: number; offset?: number }) {
  const statusFilter = args.status && VALID_WORKFLOW_STATUSES.has(args.status as WorkflowStatus) ? args.status : undefined;
  const priorityFilter = args.priority && VALID_PRIORITIES.has(args.priority as WorkflowPriority) ? args.priority : undefined;
  const rows = await storage.listWorkflows({ status: statusFilter, priority: priorityFilter, domain: args.domain, limit: args.limit ?? 50, offset: args.offset ?? 0 });
  return rows.map(r => enrichWorkflow(r as Record<string, unknown>));
}

export async function getAlloyWorkflow(storage: AlloyStoragePort, id: number) {
  const row = await storage.getWorkflow(id);
  return row ? enrichWorkflow(row as Record<string, unknown>) : null;
}

export async function getAlloyWorkflowStateTransitions(storage: AlloyStoragePort, workflowId: number) {
  const status = await storage.getWorkflowStatus(workflowId);
  return status ? (WORKFLOW_STATE_MACHINE[status] ?? []) : [];
}

export async function listAlloyWorkflowRuns(storage: AlloyStoragePort, args: { workflowId?: number; status?: string; limit?: number; offset?: number }) {
  return storage.listWorkflowRuns({ workflowId: args.workflowId, status: args.status, limit: args.limit ?? 50, offset: args.offset ?? 0 });
}

export async function getAlloyWorkflowRun(storage: AlloyStoragePort, id: number) {
  return storage.getWorkflowRun(id);
}

export async function listAlloyApprovals(storage: AlloyStoragePort, args: { workflowId?: number; status?: string; limit?: number; offset?: number }) {
  return storage.listApprovals({ workflowId: args.workflowId, status: args.status, limit: args.limit ?? 50, offset: args.offset ?? 0 });
}

export async function getAlloyApproval(storage: AlloyStoragePort, id: number) {
  return storage.getApproval(id);
}

export async function listAlloyActions(storage: AlloyStoragePort, args: { workflowId?: number; limit?: number; offset?: number }) {
  return storage.listActions({ workflowId: args.workflowId, limit: args.limit ?? 50, offset: args.offset ?? 0 });
}

export async function listAlloyArtifacts(storage: AlloyStoragePort, args: { workflowId?: number; domain?: string; limit?: number; offset?: number }) {
  return storage.listArtifacts({ workflowId: args.workflowId, domain: args.domain, limit: args.limit ?? 50, offset: args.offset ?? 0 });
}

export async function listAlloyAuditLog(storage: AlloyStoragePort, args: { entityType?: string; entityId?: number; limit?: number; offset?: number }) {
  const rows = await storage.listAuditLog({ entityType: args.entityType, entityId: args.entityId, limit: args.limit ?? 50, offset: args.offset ?? 0 });
  return rows.map(r => auditEntrySerialize(r as Record<string, unknown>));
}

export async function getAlloyDashboard(storage: AlloyStoragePort) {
  return storage.getDashboardStats();
}

export function notifyAlloySignalIngested(signal: {
  signalId: number;
  severity: string;
  domain: string | null;
  source: string;
  title: string;
}): void {
  domainEventBus.publish("alloy.signal-ingested", signal);
}

export function notifyAlloyWorkflowCreated(params: {
  workflowId: number;
  signalId: number;
  workflowType: string;
  priority: string;
}): void {
  domainEventBus.publish("alloy.workflow-created", params);
}

export function notifyAlloyWorkflowRunUpdated(params: {
  runId: number;
  workflowId: number;
  state: string;
}): void {
  domainEventBus.publish("alloy.workflow-run-updated", params);
}
