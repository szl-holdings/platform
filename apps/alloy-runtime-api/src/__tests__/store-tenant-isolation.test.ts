/**
 * Store — Tenant Isolation + Hydration Recovery Tests
 *
 * Verifies the durability and cross-tenant isolation contracts for the
 * fabric-backed getMemoryStore() and runStore helpers in store.ts.
 *
 *  (a) Memory entries written by tenant A are not visible to tenant B after restart.
 *  (b) Workflow runs created by tenant A cannot be listed, gotten, or deleted by
 *      tenant B after restart.
 *  (c) Hydration (simulated via setBackend) restores both memory entries and workflow
 *      runs from the durable store.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MutableMemoryStore,
  InMemoryStore as FabricInMemoryStore,
  defaultMemoryStore,
} from '@workspace/memory-fabric';
import type { WorkflowRun } from '@szl-holdings/workflow-runtime';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWorkflowRun(runId: string, state: WorkflowRun['state'] = 'success'): WorkflowRun {
  return {
    runId,
    workflowId: `wf-${runId}`,
    workflowName: `Workflow ${runId}`,
    state,
    startedAt: new Date().toISOString(),
    steps: [],
  };
}

// ---------------------------------------------------------------------------
// (a) + (b) Cross-tenant isolation — structural, not advisory
// ---------------------------------------------------------------------------

describe('store — cross-tenant isolation', () => {
  beforeEach(async () => {
    // Reset defaultMemoryStore to a fresh InMemoryStore between tests.
    // This is safe because store.ts delegates to defaultMemoryStore which is
    // a MutableMemoryStore (singleton); swapping its backend clears all state.
    const fresh = new FabricInMemoryStore();
    (defaultMemoryStore as MutableMemoryStore).setBackend(fresh);
  });

  describe('(a) memory entries — tenant A writes are invisible to tenant B', () => {
    it('getMemoryStore scopes entries by tenantId — tenant B cannot read tenant A keys', async () => {
      const { getMemoryStore } = await import('../store.js');

      const storeA = getMemoryStore('tenant-A');
      const storeB = getMemoryStore('tenant-B');

      storeA.set({
        memoryId: 'mem-a-1',
        scope: 'semantic',
        key: 'secret-key',
        value: { payload: 'tenant-A-only' },
        createdAt: new Date().toISOString(),
      });

      // Tenant B cannot access tenant A's key
      expect(storeB.get('semantic', 'secret-key')).toBeUndefined();
      // Tenant B sees an empty key list
      expect(storeB.keys('semantic')).toHaveLength(0);
      // Tenant A can read its own entry
      const entry = storeA.get('semantic', 'secret-key');
      expect(entry).toBeDefined();
      expect(entry?.value).toEqual({ payload: 'tenant-A-only' });
    });

    it('multiple scopes per tenant are isolated from other tenants', async () => {
      const { getMemoryStore } = await import('../store.js');

      const storeA = getMemoryStore('tenant-alpha');
      const storeB = getMemoryStore('tenant-beta');

      const scopes = ['working', 'episodic', 'semantic', 'governance'] as const;
      for (const scope of scopes) {
        storeA.set({
          memoryId: `mem-${scope}`,
          scope,
          key: `key-${scope}`,
          value: `value-from-alpha-${scope}`,
          createdAt: new Date().toISOString(),
        });
      }

      for (const scope of scopes) {
        expect(storeB.get(scope, `key-${scope}`)).toBeUndefined();
        expect(storeB.keys(scope)).toHaveLength(0);
        expect(storeA.get(scope, `key-${scope}`)).toBeDefined();
      }
    });
  });

  describe('(b) workflow runs — tenant A runs are invisible to tenant B', () => {
    it('runStore.get returns undefined for another tenant\'s run', async () => {
      const { runStore } = await import('../store.js');

      runStore.set(makeWorkflowRun('run-secret'), 'tenant-A');

      expect(runStore.get('run-secret', 'tenant-B')).toBeUndefined();
      expect(runStore.get('run-secret', 'tenant-A')).toBeDefined();
    });

    it('runStore.list returns only the calling tenant\'s runs', async () => {
      const { runStore } = await import('../store.js');

      runStore.set(makeWorkflowRun('run-a1'), 'tenant-A');
      runStore.set(makeWorkflowRun('run-a2'), 'tenant-A');
      runStore.set(makeWorkflowRun('run-b1'), 'tenant-B');

      const listA = runStore.list('tenant-A');
      const listB = runStore.list('tenant-B');

      expect(listA).toHaveLength(2);
      expect(listA.map((r) => r.runId).sort()).toEqual(['run-a1', 'run-a2']);

      expect(listB).toHaveLength(1);
      expect(listB[0]?.runId).toBe('run-b1');
    });

    it('runStore.delete cannot delete another tenant\'s run', async () => {
      const { runStore } = await import('../store.js');

      runStore.set(makeWorkflowRun('run-del'), 'tenant-A');

      // Tenant B attempts to delete tenant A's run — must return false
      const deleted = runStore.delete('run-del', 'tenant-B');
      expect(deleted).toBe(false);

      // Run is still intact for tenant A
      expect(runStore.get('run-del', 'tenant-A')).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// (c) Hydration recovery — setBackend restores entries from a durable store
// ---------------------------------------------------------------------------

describe('store — hydration recovery after simulated restart', () => {
  it('memory entries written before restart are visible after setBackend(sharedBackend)', async () => {
    const { getMemoryStore } = await import('../store.js');

    const sharedBackend = new FabricInMemoryStore();

    // --- Boot 1: write entry, backend is the sharedBackend ---
    (defaultMemoryStore as MutableMemoryStore).setBackend(sharedBackend);

    const store = getMemoryStore('tenant-hydrate');
    store.set({
      memoryId: 'mem-hydrate-1',
      scope: 'episodic',
      key: 'event-key',
      value: { important: true },
      createdAt: new Date().toISOString(),
    });

    expect(store.get('episodic', 'event-key')).toBeDefined();

    // --- Simulate crash: reset defaultMemoryStore to an empty in-memory store ---
    (defaultMemoryStore as MutableMemoryStore).setBackend(new FabricInMemoryStore());
    expect(store.get('episodic', 'event-key')).toBeUndefined();

    // --- Boot 2: hydrate — re-attach to the sharedBackend (durable store) ---
    (defaultMemoryStore as MutableMemoryStore).setBackend(sharedBackend);
    const recovered = store.get('episodic', 'event-key');
    expect(recovered).toBeDefined();
    expect((recovered?.value as Record<string, unknown>)?.important).toBe(true);
  });

  it('workflow runs written before restart are visible after setBackend(sharedBackend)', async () => {
    const { runStore } = await import('../store.js');

    const sharedBackend = new FabricInMemoryStore();

    // --- Boot 1: store a workflow run in the sharedBackend ---
    (defaultMemoryStore as MutableMemoryStore).setBackend(sharedBackend);

    runStore.set(makeWorkflowRun('run-hydrate-1', 'success'), 'tenant-restart');
    runStore.set(makeWorkflowRun('run-hydrate-2', 'failed'), 'tenant-restart');

    expect(runStore.list('tenant-restart')).toHaveLength(2);

    // --- Simulate crash ---
    (defaultMemoryStore as MutableMemoryStore).setBackend(new FabricInMemoryStore());
    expect(runStore.list('tenant-restart')).toHaveLength(0);

    // --- Boot 2: re-attach to durable backend ---
    (defaultMemoryStore as MutableMemoryStore).setBackend(sharedBackend);

    const runs = runStore.list('tenant-restart');
    expect(runs).toHaveLength(2);
    expect(runs.map((r) => r.runId).sort()).toEqual(['run-hydrate-1', 'run-hydrate-2']);

    // Tenant isolation still holds after hydration
    expect(runStore.list('other-tenant')).toHaveLength(0);
    expect(runStore.get('run-hydrate-1', 'other-tenant')).toBeUndefined();
    expect(runStore.delete('run-hydrate-2', 'other-tenant')).toBe(false);
  });

  it('cross-tenant isolation is re-established from scratch on simulated boot (Postgres durability path)', async () => {
    const { getMemoryStore, runStore } = await import('../store.js');

    // Simulate a Postgres-backed durable store: pre-populate it with entries
    // from two tenants (mirrors what PostgresMemoryStore.hydrate() would do).
    const durableStore = new FabricInMemoryStore();
    const managerA = new (await import('@workspace/memory-fabric')).MutableMemoryStore();
    (managerA as MutableMemoryStore).setBackend(durableStore);

    // --- Write tenant-A and tenant-B data BEFORE simulated restart ---
    const preBootStoreA = getMemoryStore('pg-tenant-A');
    const preBootRunA = makeWorkflowRun('pg-run-A', 'success');

    // Temporarily point defaultMemoryStore at durableStore to record entries
    (defaultMemoryStore as MutableMemoryStore).setBackend(durableStore);

    preBootStoreA.set({
      memoryId: 'pg-mem-A',
      scope: 'semantic',
      key: 'pg-key-A',
      value: { secret: 'tenant-A-data' },
      createdAt: new Date().toISOString(),
    });
    runStore.set(preBootRunA, 'pg-tenant-A');

    const preBootStoreB = getMemoryStore('pg-tenant-B');
    preBootStoreB.set({
      memoryId: 'pg-mem-B',
      scope: 'semantic',
      key: 'pg-key-B',
      value: { secret: 'tenant-B-data' },
      createdAt: new Date().toISOString(),
    });
    runStore.set(makeWorkflowRun('pg-run-B', 'running'), 'pg-tenant-B');

    // --- Simulate restart: reset defaultMemoryStore to empty InMemoryStore ---
    (defaultMemoryStore as MutableMemoryStore).setBackend(new FabricInMemoryStore());
    expect(getMemoryStore('pg-tenant-A').get('semantic', 'pg-key-A')).toBeUndefined();
    expect(runStore.list('pg-tenant-A')).toHaveLength(0);

    // --- Hydration: re-attach to the durable store (what boot() does after hydrate()) ---
    (defaultMemoryStore as MutableMemoryStore).setBackend(durableStore);

    // Both tenants' data is back
    expect(getMemoryStore('pg-tenant-A').get('semantic', 'pg-key-A')).toBeDefined();
    expect(runStore.get('pg-run-A', 'pg-tenant-A')).toBeDefined();
    expect(getMemoryStore('pg-tenant-B').get('semantic', 'pg-key-B')).toBeDefined();
    expect(runStore.get('pg-run-B', 'pg-tenant-B')).toBeDefined();

    // Cross-tenant isolation is re-established: tenant-B cannot read tenant-A
    expect(getMemoryStore('pg-tenant-B').get('semantic', 'pg-key-A')).toBeUndefined();
    expect(runStore.get('pg-run-A', 'pg-tenant-B')).toBeUndefined();
    expect(runStore.list('pg-tenant-B').map((r) => r.runId)).not.toContain('pg-run-A');

    // And tenant-A cannot read tenant-B
    expect(getMemoryStore('pg-tenant-A').get('semantic', 'pg-key-B')).toBeUndefined();
    expect(runStore.get('pg-run-B', 'pg-tenant-A')).toBeUndefined();
  });
});
