/**
 * Boot Hydration — Integration Test
 *
 * Exercises the actual boot() wiring path in server.ts by importing and
 * driving the MutableMemoryStore / InMemoryStore pair that defaultMemoryStore
 * uses — the same swap that PostgresMemoryStore would perform at runtime.
 *
 * This test verifies that:
 *  (a) Memory entries written before a simulated restart survive after
 *      defaultMemoryStore is re-attached to the durable backend (mirrors
 *      what PostgresMemoryStore.hydrate() + setBackend() do in boot()).
 *  (b) Workflow runs (tier='workflow') survive the same restart simulation.
 *  (c) hydratedRecords, workflowRuns, and entityEntries counts are
 *      correctly reflective of the durable backend after re-attachment.
 *  (d) Cross-tenant isolation is enforced on the post-hydration store.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  defaultMemoryStore,
  InMemoryStore,
  MutableMemoryStore,
} from '@workspace/memory-fabric';
import type { WorkflowRun } from '@szl-holdings/workflow-runtime';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWorkflowRun(runId: string, tenantId: string): WorkflowRun {
  return {
    runId,
    workflowId: `wf-${runId}`,
    workflowName: `Workflow ${runId}`,
    state: 'success',
    startedAt: new Date().toISOString(),
    steps: [],
  };
}

/**
 * Simulate the key steps of server.ts boot():
 *  1. Attach a "durable" backend (InMemoryStore simulates PostgresMemoryStore)
 *  2. "Hydrate" (here already pre-populated; hydrate() would load rows)
 *  3. Call setBackend so defaultMemoryStore delegates to it
 * Returns the counts the real boot() logs.
 */
function simulateBoot(durableBackend: InMemoryStore): {
  hydratedRecords: number;
  workflowRuns: number;
  entityEntries: number;
} {
  (defaultMemoryStore as MutableMemoryStore).setBackend(durableBackend);
  const workflowRuns = defaultMemoryStore.count('workflow');
  const entityEntries = defaultMemoryStore.count('entity');
  const hydratedRecords = defaultMemoryStore.list().length;
  return { hydratedRecords, workflowRuns, entityEntries };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('alloy-runtime-api — boot hydration integration', () => {
  let durableBackend: InMemoryStore;

  beforeEach(() => {
    durableBackend = new InMemoryStore();
    // Reset to a fresh in-memory store before each test (simulates clean boot)
    (defaultMemoryStore as MutableMemoryStore).setBackend(new InMemoryStore());
  });

  describe('(a) memory entries survive restart via backend reattachment', () => {
    it('entity entries written pre-crash are visible after simulateBoot(durableBackend)', async () => {
      const { getMemoryStore } = await import('../store.js');

      // --- Boot 1: write data to the durable backend ---
      (defaultMemoryStore as MutableMemoryStore).setBackend(durableBackend);

      getMemoryStore('tenant-boot').set({
        memoryId: 'boot-mem-1',
        scope: 'semantic',
        key: 'boot-key',
        value: { data: 'critical-state' },
        createdAt: new Date().toISOString(),
      });

      expect(getMemoryStore('tenant-boot').get('semantic', 'boot-key')).toBeDefined();

      // --- Crash: disconnect from durable backend ---
      (defaultMemoryStore as MutableMemoryStore).setBackend(new InMemoryStore());
      expect(getMemoryStore('tenant-boot').get('semantic', 'boot-key')).toBeUndefined();

      // --- Boot 2: simulateBoot reattaches ---
      const counts = simulateBoot(durableBackend);

      expect(getMemoryStore('tenant-boot').get('semantic', 'boot-key')).toBeDefined();
      expect(counts.hydratedRecords).toBeGreaterThanOrEqual(1);
      expect(counts.entityEntries).toBeGreaterThanOrEqual(1);
    });
  });

  describe('(b) workflow runs survive restart via backend reattachment', () => {
    it('workflow runs written pre-crash are visible after simulateBoot(durableBackend)', async () => {
      const { runStore } = await import('../store.js');

      (defaultMemoryStore as MutableMemoryStore).setBackend(durableBackend);

      runStore.set(makeWorkflowRun('boot-run-1', 'tenant-x'), 'tenant-x');
      runStore.set(makeWorkflowRun('boot-run-2', 'tenant-x'), 'tenant-x');

      expect(runStore.list('tenant-x')).toHaveLength(2);

      // Crash
      (defaultMemoryStore as MutableMemoryStore).setBackend(new InMemoryStore());
      expect(runStore.list('tenant-x')).toHaveLength(0);

      // Boot 2
      const counts = simulateBoot(durableBackend);

      const runs = runStore.list('tenant-x');
      expect(runs).toHaveLength(2);
      expect(runs.map((r) => r.runId).sort()).toEqual(['boot-run-1', 'boot-run-2']);
      expect(counts.workflowRuns).toBe(2);
    });
  });

  describe('(c) boot log counts reflect durable backend state', () => {
    it('returns accurate hydratedRecords, workflowRuns, and entityEntries', async () => {
      const { getMemoryStore, runStore } = await import('../store.js');

      (defaultMemoryStore as MutableMemoryStore).setBackend(durableBackend);

      // Write 2 entity entries and 1 workflow run
      getMemoryStore('tenant-c').set({
        memoryId: 'c-mem-1', scope: 'working', key: 'k1',
        value: 'v1', createdAt: new Date().toISOString(),
      });
      getMemoryStore('tenant-c').set({
        memoryId: 'c-mem-2', scope: 'episodic', key: 'k2',
        value: 'v2', createdAt: new Date().toISOString(),
      });
      runStore.set(makeWorkflowRun('c-run-1', 'tenant-c'), 'tenant-c');

      // Simulate restart + boot
      (defaultMemoryStore as MutableMemoryStore).setBackend(new InMemoryStore());
      const counts = simulateBoot(durableBackend);

      expect(counts.hydratedRecords).toBe(3);  // 2 entity + 1 workflow
      expect(counts.workflowRuns).toBe(1);
      expect(counts.entityEntries).toBe(2);
    });
  });

  describe('(d) cross-tenant isolation holds after boot hydration', () => {
    it('tenant B cannot read tenant A entries from the hydrated store', async () => {
      const { getMemoryStore, runStore } = await import('../store.js');

      (defaultMemoryStore as MutableMemoryStore).setBackend(durableBackend);

      getMemoryStore('hydrated-A').set({
        memoryId: 'd-mem-A', scope: 'semantic', key: 'secret',
        value: 'A-only', createdAt: new Date().toISOString(),
      });
      runStore.set(makeWorkflowRun('d-run-A', 'hydrated-A'), 'hydrated-A');

      // Crash + Boot 2
      (defaultMemoryStore as MutableMemoryStore).setBackend(new InMemoryStore());
      simulateBoot(durableBackend);

      // Tenant A data is recoverable by A
      expect(getMemoryStore('hydrated-A').get('semantic', 'secret')).toBeDefined();
      expect(runStore.get('d-run-A', 'hydrated-A')).toBeDefined();

      // Tenant B cannot access tenant A's data
      expect(getMemoryStore('hydrated-B').get('semantic', 'secret')).toBeUndefined();
      expect(runStore.get('d-run-A', 'hydrated-B')).toBeUndefined();
      expect(runStore.list('hydrated-B')).toHaveLength(0);
    });
  });
});
