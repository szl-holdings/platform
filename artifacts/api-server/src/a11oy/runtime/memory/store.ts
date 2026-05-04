import { defaultMemoryStore } from '@workspace/memory-fabric';
import type { MemoryEntry as FabricEntry } from '@workspace/memory-fabric';
import type { MemoryEntry } from '../types.js';
import { randomUUID } from 'node:crypto';

const SENSITIVE_PATTERNS = [/api[_-]?key/i, /secret/i, /password/i, /token/i, /credential/i, /ssn/i, /bearer/i];
const FRESHNESS_DECAY_RATE = 0.01;

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some((p) => p.test(key));
}

export function redactContent(content: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(content)) {
    if (isSensitiveKey(k)) {
      out[k] = '[REDACTED]';
    } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = redactContent(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function computeFreshness(updatedAt: string, expiresAt?: string): number {
  const now = Date.now();
  const age = now - new Date(updatedAt).getTime();
  if (expiresAt) {
    const ttl = new Date(expiresAt).getTime() - new Date(updatedAt).getTime();
    const remaining = new Date(expiresAt).getTime() - now;
    if (remaining <= 0) return 0;
    return Math.max(0, Math.min(1, remaining / ttl));
  }
  const ageDays = age / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - FRESHNESS_DECAY_RATE * ageDays);
}

function toFabricEntry(entry: MemoryEntry): FabricEntry {
  return {
    id: entry.memoryId,
    tier: 'session',
    key: `${entry.vertical}:${entry.entityId}`,
    value: entry.content,
    domain: entry.vertical || 'platform',
    provenance: {
      source: 'a11oy-runtime',
      method: 'agent',
      createdAt: entry.createdAt,
    },
    freshness: {
      lastUpdatedAt: entry.updatedAt,
      isStale: false,
    },
    confidence: 1,
    sensitivity: entry.isSensitive ? 'confidential' : 'internal',
    retention: {
      policy: entry.expiresAt ? 'session-scoped' : 'persistent',
      expiresAt: entry.expiresAt,
      pinned: false,
    },
    tags: entry.tags,
    scopeId: `domain:${entry.vertical}`,
    linkedEntities: [],
    linkedTraces: [],
    linkedActions: [],
    metadata: {
      vertical: entry.vertical,
      entityId: entry.entityId,
      isSensitive: entry.isSensitive,
      provenanceSource: 'a11oy-runtime',
    },
  };
}

function fromFabricEntry(e: FabricEntry): MemoryEntry {
  const meta = (e.metadata ?? {}) as Record<string, unknown>;
  const updatedAt = e.freshness.lastUpdatedAt;
  return {
    memoryId: e.id,
    vertical: (meta.vertical as string) ?? e.domain,
    entityId: (meta.entityId as string) ?? '',
    content: (e.value as Record<string, unknown>) ?? {},
    tags: e.tags ?? [],
    isSensitive: e.sensitivity === 'confidential',
    freshnessScore: computeFreshness(updatedAt, e.retention?.expiresAt),
    createdAt: e.provenance.createdAt,
    updatedAt,
    expiresAt: e.retention?.expiresAt,
  };
}

function isA11oyEntry(e: FabricEntry): boolean {
  const meta = (e.metadata ?? {}) as Record<string, unknown>;
  return (meta.provenanceSource as string) === 'a11oy-runtime';
}

export function store_write(opts: {
  vertical: string;
  entityId: string;
  content: Record<string, unknown>;
  tags?: string[];
  isSensitive?: boolean;
  ttlMs?: number;
}): MemoryEntry {
  const now = new Date().toISOString();
  const expiresAt = opts.ttlMs ? new Date(Date.now() + opts.ttlMs).toISOString() : undefined;
  const entry: MemoryEntry = {
    memoryId: `mem-${randomUUID().slice(0, 8)}`,
    vertical: opts.vertical,
    entityId: opts.entityId,
    content: opts.isSensitive ? redactContent(opts.content) : opts.content,
    tags: opts.tags ?? [],
    isSensitive: opts.isSensitive ?? false,
    freshnessScore: 1,
    createdAt: now,
    updatedAt: now,
    expiresAt,
  };
  defaultMemoryStore.put(toFabricEntry(entry));
  return entry;
}

export function store_read(memoryId: string): MemoryEntry | undefined {
  const e = defaultMemoryStore.get(memoryId);
  if (!e || !isA11oyEntry(e)) return undefined;
  const result = fromFabricEntry(e);
  result.freshnessScore = computeFreshness(result.updatedAt, result.expiresAt);
  return result;
}

export function store_query(opts: {
  vertical?: string;
  entityId?: string;
  tags?: string[];
  minFreshness?: number;
  limit?: number;
}): MemoryEntry[] {
  const now = Date.now();
  let results = defaultMemoryStore
    .list({ tags: opts.tags?.length ? opts.tags : undefined })
    .filter((e) => {
      if (!isA11oyEntry(e)) return false;
      if (e.retention?.expiresAt && new Date(e.retention.expiresAt).getTime() < now) return false;
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      if (opts.vertical && (meta.vertical as string) !== opts.vertical) return false;
      if (opts.entityId && (meta.entityId as string) !== opts.entityId) return false;
      return true;
    })
    .map(fromFabricEntry);
  if (opts.minFreshness !== undefined) {
    const minF = opts.minFreshness;
    results = results.filter((e) => computeFreshness(e.updatedAt, e.expiresAt) >= minF);
  }
  results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return results.slice(0, opts.limit ?? 50);
}

export function store_update(
  memoryId: string,
  patch: Partial<Pick<MemoryEntry, 'content' | 'tags'>>,
): MemoryEntry | undefined {
  const existing = defaultMemoryStore.get(memoryId);
  if (!existing || !isA11oyEntry(existing)) return undefined;
  const entry = fromFabricEntry(existing);
  if (patch.content) entry.content = redactContent(patch.content);
  if (patch.tags) entry.tags = patch.tags;
  entry.updatedAt = new Date().toISOString();
  entry.freshnessScore = 1;
  defaultMemoryStore.put(toFabricEntry(entry));
  return entry;
}

export function compact(): void {
  defaultMemoryStore.evictExpired();
}

export function listEntries(limit = 50): MemoryEntry[] {
  return defaultMemoryStore
    .list()
    .filter(isA11oyEntry)
    .slice(-limit)
    .reverse()
    .map(fromFabricEntry);
}

export function getStats() {
  const a11oyCount = defaultMemoryStore.list().filter(isA11oyEntry).length;
  return {
    totalEntries: a11oyCount,
    maxEntries: 2000,
    utilizationPct: Math.round((a11oyCount / 2000) * 100),
  };
}

export function hydrateMemoryStore(_entries: MemoryEntry[]): void {
  // No-op: defaultMemoryStore (memory-fabric / PostgresMemoryStore) owns hydration
  // from memoryRecordsTable on boot. A11oy entries written with provenanceSource='a11oy-runtime'
  // are visible via defaultMemoryStore.list() and store_query() immediately after fabric hydrate().
}
