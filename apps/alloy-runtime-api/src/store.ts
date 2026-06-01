/**
 * Shared singleton stores for the runtime API process.
 *
 * Tenant isolation is enforced at this layer:
 *   - Runs are keyed by `${tenantId}::${runId}` so cross-tenant leakage
 *     is structurally impossible via list/get/delete helpers.
 *   - Memory entries are namespaced under a tenant-scoped InMemoryStore.
 *
 * In production, swap the in-process Maps for Redis/DB-backed adapters
 * while preserving the same key-scoping conventions.
 */
import { InMemoryStore } from '@szl-holdings/memory-core';
import type { WorkflowRun } from '@szl-holdings/workflow-runtime';

// ---------------------------------------------------------------------------
// Tenant-scoped memory stores
// Each tenant gets its own InMemoryStore instance so keys never collide.
// ---------------------------------------------------------------------------
const tenantMemoryStores = new Map<string, InMemoryStore>();

export function getMemoryStore(tenantId: string): InMemoryStore {
  let store = tenantMemoryStores.get(tenantId);
  if (!store) {
    store = new InMemoryStore();
    tenantMemoryStores.set(tenantId, store);
  }
  return store;
}

// ---------------------------------------------------------------------------
// Tenant-scoped workflow run registry
// Runs are keyed by `${tenantId}::${runId}` to prevent cross-tenant IDOR.
// ---------------------------------------------------------------------------
interface TenantedRun extends WorkflowRun {
  tenantId: string;
}

const runRegistry = new Map<string, TenantedRun>();

function runKey(tenantId: string, runId: string): string {
  return `${tenantId}::${runId}`;
}

export const runStore = {
  set(run: WorkflowRun, tenantId: string): void {
    runRegistry.set(runKey(tenantId, run.runId), { ...run, tenantId });
  },

  /** Returns the run only if it belongs to the specified tenant. */
  get(runId: string, tenantId: string): TenantedRun | undefined {
    return runRegistry.get(runKey(tenantId, runId));
  },

  /** Lists all runs belonging to the specified tenant only. */
  list(tenantId: string): TenantedRun[] {
    const prefix = `${tenantId}::`;
    return Array.from(runRegistry.values()).filter(
      (r) => r.tenantId === tenantId && runRegistry.has(prefix + r.runId),
    );
  },

  /** Deletes a run only if it belongs to the specified tenant. Returns false if not found or wrong tenant. */
  delete(runId: string, tenantId: string): boolean {
    const key = runKey(tenantId, runId);
    if (!runRegistry.has(key)) return false;
    return runRegistry.delete(key);
  },
};
