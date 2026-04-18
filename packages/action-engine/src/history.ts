import type { WorkflowRun } from "./types.js";

export interface HistoryAdapter {
  recordRun?(run: WorkflowRun): Promise<void>;
  getRunById?(runId: string, tenantId?: string): Promise<WorkflowRun | undefined>;
  listRuns?(options?: {
    workflowId?: string;
    tenantId?: string;
    domain?: string;
    status?: WorkflowRun["status"];
    limit?: number;
    offset?: number;
    onlyNullTenant?: boolean;
  }): Promise<WorkflowRun[]>;
  getHistoryStats?(): Promise<{
    total: number;
    completed: number;
    failed: number;
    rolledBack: number;
    pendingApproval: number;
  }>;
}

const _history: WorkflowRun[] = [];
let _adapter: HistoryAdapter | null = null;

/**
 * Install a durable history adapter (e.g. DB-backed) to replace the in-memory
 * array. The adapter is called for writes and reads; on adapter failure the
 * function falls back to the in-memory history array.
 */
export function setHistoryAdapter(adapter: HistoryAdapter): void {
  _adapter = adapter;
}

export async function recordRun(run: WorkflowRun): Promise<void> {
  _history.push(Object.freeze({ ...run }));
  if (_adapter?.recordRun) {
    try {
      await _adapter.recordRun(run);
    } catch {
      // adapter failure is non-fatal; in-memory copy is still available
    }
  }
}

export async function getRunById(runId: string, tenantId?: string): Promise<WorkflowRun | undefined> {
  if (_adapter?.getRunById) {
    try {
      const run = await _adapter.getRunById(runId, tenantId);
      if (run) return run;
    } catch {
      // fall through to in-memory
    }
  }
  const run = _history.find(r => r.runId === runId);
  if (!run) return undefined;
  if (tenantId && run.tenantId && run.tenantId !== tenantId) return undefined;
  return run;
}

export async function listRuns(options?: {
  workflowId?: string;
  tenantId?: string;
  domain?: string;
  status?: WorkflowRun["status"];
  limit?: number;
  offset?: number;
  onlyNullTenant?: boolean;
}): Promise<WorkflowRun[]> {
  if (_adapter?.listRuns) {
    try {
      return await _adapter.listRuns(options);
    } catch {
      // fall through to in-memory
    }
  }
  let filtered = _history as WorkflowRun[];
  if (options?.workflowId) {
    filtered = filtered.filter(r => r.workflowId === options.workflowId);
  }
  if (options?.tenantId) {
    filtered = filtered.filter(r => r.tenantId === options.tenantId);
  } else if (options?.onlyNullTenant) {
    filtered = filtered.filter(r => !r.tenantId);
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
  const run = _history.find(r => r.runId === runId);
  return run?.auditTrail ?? null;
}

export async function getHistoryStats(): Promise<{
  total: number;
  completed: number;
  failed: number;
  rolledBack: number;
  pendingApproval: number;
}> {
  if (_adapter?.getHistoryStats) {
    try {
      return await _adapter.getHistoryStats();
    } catch {
      // fall through to in-memory
    }
  }
  return {
    total: _history.length,
    completed: _history.filter(r => r.status === "completed").length,
    failed: _history.filter(r => r.status === "failed").length,
    rolledBack: _history.filter(r => r.status === "rolled_back").length,
    pendingApproval: _history.filter(r => r.status === "pending_approval").length,
  };
}
