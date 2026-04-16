import type { WorkflowRun } from "./types.js";

const _history: WorkflowRun[] = [];

export function recordRun(run: WorkflowRun): void {
  _history.push(Object.freeze({ ...run }));
}

export function getRunById(runId: string): WorkflowRun | undefined {
  return _history.find(r => r.runId === runId);
}

export function listRuns(options?: {
  workflowId?: string;
  tenantId?: string;
  status?: WorkflowRun["status"];
  limit?: number;
  offset?: number;
}): WorkflowRun[] {
  let filtered = _history;

  if (options?.workflowId) {
    filtered = filtered.filter(r => r.workflowId === options.workflowId);
  }
  if (options?.tenantId) {
    filtered = filtered.filter(r => r.tenantId === options.tenantId);
  }
  if (options?.status) {
    filtered = filtered.filter(r => r.status === options.status);
  }

  const sorted = [...filtered].sort((a, b) => b.startedAt - a.startedAt);
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 50;
  return sorted.slice(offset, offset + limit);
}

export function getAuditTrail(runId: string): WorkflowRun["auditTrail"] | null {
  const run = getRunById(runId);
  return run?.auditTrail ?? null;
}

export function getHistoryStats(): {
  total: number;
  completed: number;
  failed: number;
  rolledBack: number;
  pendingApproval: number;
} {
  return {
    total: _history.length,
    completed: _history.filter(r => r.status === "completed").length,
    failed: _history.filter(r => r.status === "failed").length,
    rolledBack: _history.filter(r => r.status === "rolled_back").length,
    pendingApproval: _history.filter(r => r.status === "pending_approval").length,
  };
}
