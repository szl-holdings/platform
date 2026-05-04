import { newId } from './types.js';
import type { CognitiveWorker, WorkerStatus } from './types.js';

const WORKER_STORE = new Map<string, CognitiveWorker>();

export class ChecksumConflictError extends Error {
  constructor(
    public readonly workerId: string,
    public readonly rolloutGroup: string,
    public readonly existingChecksum: string,
    public readonly newChecksum: string,
  ) {
    super(
      `[WorkerRegistry] Checksum conflict in rollout group "${rolloutGroup}": ` +
        `existing=${existingChecksum.slice(0, 12)}, new=${newChecksum.slice(0, 12)}. ` +
        `Use a different rollout group to run multiple versions simultaneously.`,
    );
    this.name = 'ChecksumConflictError';
  }
}

// Tenant-scoped: only checks workers belonging to the same tenant + rollout group
function checksumForGroup(tenantId: string, rolloutGroup: string): string | undefined {
  for (const w of WORKER_STORE.values()) {
    if (
      w.tenantId === tenantId &&
      w.rolloutGroup === rolloutGroup &&
      w.status !== 'drained' &&
      w.status !== 'offline'
    ) {
      return w.configChecksum;
    }
  }
  return undefined;
}

export function registerWorker(opts: {
  tenantId: string;
  name: string;
  rolloutGroup?: string;
  configChecksum: string;
  capabilities?: string[];
  tags?: string[];
}): CognitiveWorker {
  const {
    tenantId,
    name,
    rolloutGroup = 'default',
    configChecksum,
    capabilities = [],
    tags = [],
  } = opts;

  // Checksum conflict check is scoped to tenant + rollout group
  const existingChecksum = checksumForGroup(tenantId, rolloutGroup);
  if (existingChecksum !== undefined && existingChecksum !== configChecksum) {
    const conflict = Array.from(WORKER_STORE.values()).find(
      (w) =>
        w.tenantId === tenantId &&
        w.rolloutGroup === rolloutGroup &&
        w.configChecksum === existingChecksum,
    );
    throw new ChecksumConflictError(
      conflict?.workerId ?? 'unknown',
      rolloutGroup,
      existingChecksum,
      configChecksum,
    );
  }

  const workerId = newId('wk');
  const now = new Date().toISOString();

  const worker: CognitiveWorker = {
    workerId,
    tenantId,
    name,
    rolloutGroup,
    configChecksum,
    capabilities,
    status: 'active',
    isDraining: false,
    uptimeSeconds: 0,
    requestsHandled: 0,
    errorsCount: 0,
    registeredAt: now,
    lastHeartbeatAt: now,
    tags,
  };

  WORKER_STORE.set(workerId, worker);
  return worker;
}

export function drainWorker(
  workerId: string,
  tenantId: string,
): { success: boolean; worker?: CognitiveWorker; error?: string } {
  const worker = WORKER_STORE.get(workerId);

  if (!worker) {
    return { success: false, error: `Worker "${workerId}" not found` };
  }
  if (worker.tenantId !== tenantId) {
    return { success: false, error: `Worker "${workerId}" does not belong to tenant "${tenantId}"` };
  }
  if (worker.isDraining || worker.status === 'drained') {
    return { success: true, worker };
  }

  worker.isDraining = true;
  worker.status = 'draining';

  setTimeout(() => {
    if (WORKER_STORE.has(workerId)) {
      const w = WORKER_STORE.get(workerId)!;
      w.status = 'drained';
      w.isDraining = false;
      w.drainedAt = new Date().toISOString();
    }
  }, 5000);

  return { success: true, worker };
}

export function heartbeat(workerId: string, tenantId: string): boolean {
  const worker = WORKER_STORE.get(workerId);
  if (!worker || worker.tenantId !== tenantId) return false;
  worker.lastHeartbeatAt = new Date().toISOString();
  worker.uptimeSeconds += 30;
  return true;
}

export function listWorkers(
  tenantId: string,
  opts: { rolloutGroup?: string; status?: WorkerStatus } = {},
): CognitiveWorker[] {
  return Array.from(WORKER_STORE.values()).filter((w) => {
    if (w.tenantId !== tenantId) return false;
    if (opts.rolloutGroup && w.rolloutGroup !== opts.rolloutGroup) return false;
    if (opts.status && w.status !== opts.status) return false;
    return true;
  });
}

export function getWorker(workerId: string, tenantId: string): CognitiveWorker | undefined {
  const w = WORKER_STORE.get(workerId);
  if (!w || w.tenantId !== tenantId) return undefined;
  return w;
}

export function recordRequest(workerId: string, succeeded: boolean): void {
  const w = WORKER_STORE.get(workerId);
  if (!w) return;
  w.requestsHandled++;
  if (!succeeded) w.errorsCount++;
}

export function getRegistryStats(tenantId: string): {
  total: number;
  active: number;
  draining: number;
  drained: number;
  offline: number;
  rolloutGroups: string[];
} {
  const workers = listWorkers(tenantId);
  const groups = new Set<string>();
  let active = 0, draining = 0, drained = 0, offline = 0;
  for (const w of workers) {
    groups.add(w.rolloutGroup);
    if (w.status === 'active') active++;
    else if (w.status === 'draining') draining++;
    else if (w.status === 'drained') drained++;
    else if (w.status === 'offline') offline++;
  }
  return {
    total: workers.length,
    active,
    draining,
    drained,
    offline,
    rolloutGroups: Array.from(groups),
  };
}

export function seedDemoWorkers(tenantId: string): CognitiveWorker[] {
  const existing = listWorkers(tenantId);
  if (existing.length > 0) return existing;

  const workers = [
    { name: 'CortexNode-Alpha', rolloutGroup: 'blue', configChecksum: 'sha256-a1b2c3d4e5f6a7b8', capabilities: ['reasoning', 'retrieval'] },
    { name: 'CortexNode-Beta', rolloutGroup: 'blue', configChecksum: 'sha256-a1b2c3d4e5f6a7b8', capabilities: ['reasoning', 'generation'] },
    { name: 'CortexNode-Gamma', rolloutGroup: 'green', configChecksum: 'sha256-c9d0e1f2a3b4c5d6', capabilities: ['reasoning', 'retrieval', 'verification'] },
    { name: 'CortexNode-Delta', rolloutGroup: 'green', configChecksum: 'sha256-c9d0e1f2a3b4c5d6', capabilities: ['reasoning', 'audit'] },
    { name: 'CortexNode-Epsilon', rolloutGroup: 'canary', configChecksum: 'sha256-e7f8a9b0c1d2e3f4', capabilities: ['reasoning', 'generation', 'guardrail'] },
  ];

  return workers.map((w) =>
    registerWorker({ tenantId, name: w.name, rolloutGroup: w.rolloutGroup, configChecksum: w.configChecksum, capabilities: w.capabilities }),
  );
}
