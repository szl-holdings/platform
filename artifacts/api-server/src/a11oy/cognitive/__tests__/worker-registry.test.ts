import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerWorker,
  drainWorker,
  listWorkers,
  ChecksumConflictError,
} from '../worker-registry.js';

const TENANT = `tenant-worker-${Date.now()}`;
let ckA = 'sha256-aaaaaaaaaaaa';
let ckB = 'sha256-bbbbbbbbbbbb';

describe('WorkerRegistry', () => {
  it('registers a worker with a valid checksum', () => {
    const group = `rg-valid-${Date.now()}`;
    const w = registerWorker({ tenantId: TENANT, name: 'W1', rolloutGroup: group, configChecksum: ckA });
    expect(w.workerId).toMatch(/^wk-/);
    expect(w.rolloutGroup).toBe(group);
    expect(w.configChecksum).toBe(ckA);
    expect(w.status).toBe('active');
  });

  it('allows same checksum within a rollout group', () => {
    const group = `rg-same-${Date.now()}`;
    const w1 = registerWorker({ tenantId: TENANT, name: 'Same-1', rolloutGroup: group, configChecksum: ckA });
    const w2 = registerWorker({ tenantId: TENANT, name: 'Same-2', rolloutGroup: group, configChecksum: ckA });
    expect(w1.configChecksum).toBe(w2.configChecksum);
  });

  it('rejects incompatible checksum within same rollout group', () => {
    const group = `rg-conflict-${Date.now()}`;
    registerWorker({ tenantId: TENANT, name: 'Good', rolloutGroup: group, configChecksum: ckA });
    expect(() => {
      registerWorker({ tenantId: TENANT, name: 'Bad', rolloutGroup: group, configChecksum: ckB });
    }).toThrow(ChecksumConflictError);
  });

  it('allows different checksums across different rollout groups', () => {
    const g1 = `rg-blue-${Date.now()}`;
    const g2 = `rg-green-${Date.now()}`;
    const w1 = registerWorker({ tenantId: TENANT, name: 'Blue', rolloutGroup: g1, configChecksum: ckA });
    const w2 = registerWorker({ tenantId: TENANT, name: 'Green', rolloutGroup: g2, configChecksum: ckB });
    expect(w1.rolloutGroup).not.toBe(w2.rolloutGroup);
  });

  it('drains a worker successfully', () => {
    const group = `rg-drain-${Date.now()}`;
    const w = registerWorker({ tenantId: TENANT, name: 'ToDrain', rolloutGroup: group, configChecksum: ckA });
    const result = drainWorker(w.workerId, TENANT);
    expect(result.success).toBe(true);
    expect(result.worker?.isDraining).toBe(true);
    expect(result.worker?.status).toBe('draining');
  });

  it('rejects drain from wrong tenant', () => {
    const group = `rg-secure-${Date.now()}`;
    const w = registerWorker({ tenantId: TENANT, name: 'Secure', rolloutGroup: group, configChecksum: ckA });
    const result = drainWorker(w.workerId, 'tenant-evil-999');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('lists workers scoped to tenant', () => {
    const group = `rg-list-${Date.now()}`;
    registerWorker({ tenantId: TENANT, name: 'Listed', rolloutGroup: group, configChecksum: ckA });
    const workers = listWorkers(TENANT);
    expect(workers.every((w) => w.tenantId === TENANT)).toBe(true);
    expect(workers.length).toBeGreaterThan(0);
  });
});
