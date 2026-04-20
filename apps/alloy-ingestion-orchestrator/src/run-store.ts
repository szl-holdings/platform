/**
 * AEF Ingestion Orchestrator — Run Store
 *
 * Persists and queries workflow run state.
 * Dev implementation: in-memory.
 */

import type { ListRunsFilter, WorkflowRun } from './types.js';

export interface RunStore {
  save(run: WorkflowRun): void;
  get(runId: string): WorkflowRun | undefined;
  list(filter: ListRunsFilter): WorkflowRun[];
  delete(runId: string): boolean;
  count(): number;
}

export class InMemoryRunStore implements RunStore {
  private readonly store = new Map<string, WorkflowRun>();
  private readonly insertOrder: string[] = [];

  save(run: WorkflowRun): void {
    if (!this.store.has(run.runId)) {
      this.insertOrder.push(run.runId);
    }
    this.store.set(run.runId, { ...run });
  }

  get(runId: string): WorkflowRun | undefined {
    return this.store.get(runId);
  }

  list(filter: ListRunsFilter): WorkflowRun[] {
    const { limit = 100, offset = 0 } = filter;
    const results: WorkflowRun[] = [];
    for (const id of this.insertOrder) {
      const run = this.store.get(id);
      if (!run) continue;
      if (filter.tenantId !== undefined && run.tenantId !== filter.tenantId) continue;
      if (filter.profileId !== undefined && run.profileId !== filter.profileId) continue;
      if (filter.status !== undefined && run.status !== filter.status) continue;
      if (filter.workflowId !== undefined && run.workflowId !== filter.workflowId) continue;
      results.push(run);
    }
    return results.slice(offset, offset + limit);
  }

  delete(runId: string): boolean {
    if (!this.store.has(runId)) return false;
    this.store.delete(runId);
    const idx = this.insertOrder.indexOf(runId);
    if (idx !== -1) this.insertOrder.splice(idx, 1);
    return true;
  }

  count(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
    this.insertOrder.length = 0;
  }
}

export const defaultRunStore = new InMemoryRunStore();
