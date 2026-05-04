import { describe, it, expect } from 'vitest';
import { memoryWrite, memoryLookup, memoryInvalidate } from '../memory-fabric.js';

const TENANT_A = 'tenant-mem-A';
const TENANT_B = 'tenant-mem-B';

describe('MemoryFabric', () => {
  it('returns a hit with high reuse score for recent overlapping context', () => {
    const key = 'ctx-maritime-vessel-001';
    memoryWrite(
      { tenantId: TENANT_A, domain: 'maritime' },
      key,
      { vesselId: 'vessel-001', lastPosition: { lat: 51.5, lon: -0.12 } },
      { tags: ['vessel', 'position', 'maritime'], tokenCount: 240 },
    );

    const result = memoryLookup(
      { tenantId: TENANT_A, domain: 'maritime' },
      key,
      ['vessel', 'position'],
    );

    expect(result.hit).toBe(true);
    expect(result.contextReuseScore).toBeGreaterThan(0.5);
    expect(result.overlapScore).toBeGreaterThan(0);
    expect(result.freshnessScore).toBeGreaterThan(0.9);
    expect(result.tokensSaved).toBe(240);
  });

  it('returns a miss for non-existent key', () => {
    const result = memoryLookup({ tenantId: TENANT_A }, 'ctx-nonexistent-xyz');
    expect(result.hit).toBe(false);
    expect(result.contextReuseScore).toBe(0);
  });

  it('returns low reuse score for stale context (TTL expired)', () => {
    const key = 'ctx-stale-001';
    memoryWrite(
      { tenantId: TENANT_A },
      key,
      { data: 'old' },
      { tags: ['stale'], ttlMs: 1 },
    );

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const result = memoryLookup({ tenantId: TENANT_A }, key, ['stale']);
        expect(result.hit).toBe(false);
        resolve();
      }, 10);
    });
  });

  it('blocks cross-tenant access with a hard error', () => {
    const key = `ctx-secret-tenant-A-${Date.now()}`;
    memoryWrite(
      { tenantId: TENANT_A },
      key,
      { sensitive: true },
      { tags: ['classified'] },
    );

    expect(() => {
      memoryLookup({ tenantId: TENANT_B }, key);
    }).toThrow(/TENANT_ISOLATION_BREACH/);
  });

  it('cross-tenant invalidation also throws', () => {
    const key = `ctx-owned-by-A-${Date.now()}`;
    memoryWrite({ tenantId: TENANT_A }, key, { val: 1 }, {});

    expect(() => {
      memoryInvalidate({ tenantId: TENANT_B }, key);
    }).toThrow(/TENANT_ISOLATION_BREACH/);
  });

  it('invalidation removes the entry', () => {
    const key = `ctx-to-invalidate-${Date.now()}`;
    memoryWrite({ tenantId: TENANT_A }, key, { val: 99 }, {});
    const before = memoryLookup({ tenantId: TENANT_A }, key);
    expect(before.hit).toBe(true);

    memoryInvalidate({ tenantId: TENANT_A }, key);
    const after = memoryLookup({ tenantId: TENANT_A }, key);
    expect(after.hit).toBe(false);
  });

  it('returns miss for different workspace in same tenant', () => {
    const key = `ctx-workspace-scoped-${Date.now()}`;
    memoryWrite({ tenantId: TENANT_A, workspaceId: 'ws-001' }, key, { x: 1 }, {});

    // workspace isolation: entry written with workspaceId 'ws-001' is not visible from 'ws-002'
    const result = memoryLookup({ tenantId: TENANT_A, workspaceId: 'ws-002' }, key);
    expect(result.hit).toBe(false);

    // same workspace can read it
    const sameWs = memoryLookup({ tenantId: TENANT_A, workspaceId: 'ws-001' }, key);
    expect(sameWs.hit).toBe(true);
  });
});
