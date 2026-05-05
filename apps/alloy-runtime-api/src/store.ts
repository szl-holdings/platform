/**
 * Shared singleton stores for the runtime API process.
 *
 * Tenant isolation is enforced at this layer:
 *   - Memory entries are scoped via scopeId = "${tenantId}::${scope}" so keys from
 *     one tenant are never accessible to another — structural, not advisory.
 *   - Workflow runs are stored as tier='workflow' entries with scopeId="tenant:${tenantId}",
 *     making cross-tenant IDOR structurally impossible via list/get/delete helpers.
 *
 * Both stores are backed by @workspace/memory-fabric's defaultMemoryStore, which is
 * wired to PostgresMemoryStore at boot time when DATABASE_URL is set, making all
 * writes durable across restarts without changing these call sites.
 */
import { defaultMemoryStore } from '@workspace/memory-fabric';
import type { MemoryEntry } from '@workspace/memory-fabric';
import type { MemoryScope } from '@szl-holdings/shared-contracts';
import type { WorkflowRun } from '@szl-holdings/workflow-runtime';

// ---------------------------------------------------------------------------
// Tenant-scoped memory store
// ---------------------------------------------------------------------------

/**
 * Shape returned by get() — mirrors the legacy MemoryEntry contract that
 * routes/v1/memory.ts depends on so that route handlers need no changes.
 */
export interface LegacyMemoryEntry {
  memoryId: string;
  scope: MemoryScope;
  key: string;
  value: unknown;
  createdAt: string;
  agentRole?: string;
  workflowRunId?: string;
  traceId?: string;
  expiresAt?: string;
  lastAccessedAt?: string;
}

/**
 * Thin wrapper around defaultMemoryStore that namespaces all reads and writes
 * under scopeId="${tenantId}::${scope}". This ensures cross-tenant isolation
 * at the storage layer regardless of the active backend (in-memory or Postgres).
 *
 * The API surface intentionally mirrors the legacy @szl-holdings/memory-core
 * InMemoryStore so routes/v1/memory.ts requires no changes.
 */
class TenantScopedMemoryStore {
  constructor(private readonly tenantId: string) {}

  private scopeId(scope: MemoryScope): string {
    return `${this.tenantId}::${scope}`;
  }

  set(entry: Omit<LegacyMemoryEntry, 'lastAccessedAt'>): void {
    const now = new Date().toISOString();
    const fabricEntry: MemoryEntry = {
      id: entry.memoryId,
      tier: 'entity',
      key: entry.key,
      value: entry.value,
      scopeId: this.scopeId(entry.scope),
      domain: 'alloy-runtime',
      summary: `${entry.scope}:${entry.key}`,
      provenance: {
        source: 'alloy-runtime-api',
        method: 'agent',
        createdAt: entry.createdAt,
      },
      freshness: {
        lastUpdatedAt: now,
        isStale: false,
      },
      confidence: 1.0,
      retention: {
        policy: 'persistent',
        pinned: false,
        ...(entry.expiresAt ? { expiresAt: entry.expiresAt } : {}),
      },
      sensitivity: 'internal',
      linkedEntities: [],
      linkedTraces: entry.traceId ? [entry.traceId] : [],
      linkedActions: [],
      tags: [
        `scope:${entry.scope}`,
        ...(entry.agentRole ? [`agentRole:${entry.agentRole}`] : []),
        ...(entry.workflowRunId ? [`workflowRunId:${entry.workflowRunId}`] : []),
      ],
      metadata: {
        legacyScope: entry.scope,
        agentRole: entry.agentRole,
        workflowRunId: entry.workflowRunId,
        traceId: entry.traceId,
        originalCreatedAt: entry.createdAt,
      },
    };
    defaultMemoryStore.put(fabricEntry);
  }

  get(scope: MemoryScope, key: string): LegacyMemoryEntry | undefined {
    const entry = defaultMemoryStore.getByKey('entity', key, this.scopeId(scope));
    if (!entry) return undefined;
    if (entry.retention.expiresAt && new Date(entry.retention.expiresAt) < new Date()) {
      defaultMemoryStore.delete(entry.id);
      return undefined;
    }
    const meta = (entry.metadata ?? {}) as Record<string, unknown>;
    return {
      memoryId: entry.id,
      scope: (meta.legacyScope as MemoryScope) ?? scope,
      key: entry.key,
      value: entry.value,
      createdAt: (meta.originalCreatedAt as string) ?? entry.provenance.createdAt,
      agentRole: meta.agentRole as string | undefined,
      workflowRunId: meta.workflowRunId as string | undefined,
      traceId: meta.traceId as string | undefined,
      expiresAt: entry.retention.expiresAt,
      lastAccessedAt: entry.freshness.lastAccessedAt,
    };
  }

  keys(scope: MemoryScope): string[] {
    const entries = defaultMemoryStore.list({
      tier: 'entity',
      scopeId: this.scopeId(scope),
      includeStale: false,
    });
    return entries.map((e) => e.key);
  }

  delete(scope: MemoryScope, key: string): boolean {
    const entry = defaultMemoryStore.getByKey('entity', key, this.scopeId(scope));
    if (!entry) return false;
    return defaultMemoryStore.delete(entry.id);
  }

  expireStale(): number {
    return defaultMemoryStore.evictExpired();
  }
}

const tenantStoreCache = new Map<string, TenantScopedMemoryStore>();

export function getMemoryStore(tenantId: string): TenantScopedMemoryStore {
  let store = tenantStoreCache.get(tenantId);
  if (!store) {
    store = new TenantScopedMemoryStore(tenantId);
    tenantStoreCache.set(tenantId, store);
  }
  return store;
}

// ---------------------------------------------------------------------------
// Tenant-scoped workflow run registry — backed by the memory fabric
// ---------------------------------------------------------------------------

interface TenantedRun extends WorkflowRun {
  tenantId: string;
}

function runScopeId(tenantId: string): string {
  return `tenant:${tenantId}`;
}

function runEntryId(tenantId: string, runId: string): string {
  return `wfrun::${tenantId}::${runId}`;
}

function runToFabricEntry(run: TenantedRun): MemoryEntry {
  const now = new Date().toISOString();
  return {
    id: runEntryId(run.tenantId, run.runId),
    tier: 'workflow',
    key: run.runId,
    value: run as unknown as Record<string, unknown>,
    scopeId: runScopeId(run.tenantId),
    domain: 'alloy-runtime',
    summary: `Workflow run ${run.runId} [${run.state}]`,
    provenance: {
      source: 'alloy-runtime-api',
      method: 'agent',
      createdAt: run.startedAt ?? now,
    },
    freshness: {
      lastUpdatedAt: now,
      isStale: false,
    },
    confidence: 1.0,
    retention: {
      policy: 'workflow-scoped',
      pinned: false,
    },
    sensitivity: 'internal',
    linkedEntities: [],
    linkedTraces: [],
    linkedActions: [],
    tags: [`state:${run.state}`, `tenantId:${run.tenantId}`],
    metadata: { tenantId: run.tenantId, workflowId: run.workflowId },
  };
}

function runFromFabricEntry(entry: MemoryEntry): TenantedRun | undefined {
  if (!entry.value || typeof entry.value !== 'object') return undefined;
  return entry.value as TenantedRun;
}

export const runStore = {
  set(run: WorkflowRun, tenantId: string): void {
    const tenanted: TenantedRun = { ...run, tenantId };
    defaultMemoryStore.put(runToFabricEntry(tenanted));
  },

  /** Returns the run only if it belongs to the specified tenant. */
  get(runId: string, tenantId: string): TenantedRun | undefined {
    const entry = defaultMemoryStore.getByKey('workflow', runId, runScopeId(tenantId));
    if (!entry) return undefined;
    return runFromFabricEntry(entry);
  },

  /** Lists all runs belonging to the specified tenant only. */
  list(tenantId: string): TenantedRun[] {
    const entries = defaultMemoryStore.list({
      tier: 'workflow',
      scopeId: runScopeId(tenantId),
      includeStale: true,
    });
    return entries
      .map(runFromFabricEntry)
      .filter((r): r is TenantedRun => r !== undefined && r.tenantId === tenantId);
  },

  /** Deletes a run only if it belongs to the specified tenant. Returns false if not found or wrong tenant. */
  delete(runId: string, tenantId: string): boolean {
    const entry = defaultMemoryStore.getByKey('workflow', runId, runScopeId(tenantId));
    if (!entry) return false;
    return defaultMemoryStore.delete(entry.id);
  },
};
