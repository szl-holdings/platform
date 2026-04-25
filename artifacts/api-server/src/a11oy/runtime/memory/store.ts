import type { MemoryEntry } from '../types.js';
import { randomUUID } from 'node:crypto';

const SENSITIVE_PATTERNS = [/api[_-]?key/i, /secret/i, /password/i, /token/i, /credential/i, /ssn/i, /bearer/i];
const MAX_ENTRIES = 2000;
const FRESHNESS_DECAY_RATE = 0.01;

const store = new Map<string, MemoryEntry>();

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

export function store_write(opts: {
  vertical: string;
  entityId: string;
  content: Record<string, unknown>;
  tags?: string[];
  isSensitive?: boolean;
  ttlMs?: number;
}): MemoryEntry {
  if (store.size >= MAX_ENTRIES) {
    compact();
  }
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
  store.set(entry.memoryId, entry);
  return entry;
}

export function store_read(memoryId: string): MemoryEntry | undefined {
  const entry = store.get(memoryId);
  if (!entry) return undefined;
  entry.freshnessScore = computeFreshness(entry.updatedAt, entry.expiresAt);
  return entry;
}

export function store_query(opts: {
  vertical?: string;
  entityId?: string;
  tags?: string[];
  minFreshness?: number;
  limit?: number;
}): MemoryEntry[] {
  const now = Date.now();
  let results = [...store.values()].filter((e) => {
    if (e.expiresAt && new Date(e.expiresAt).getTime() < now) return false;
    if (opts.vertical && e.vertical !== opts.vertical) return false;
    if (opts.entityId && e.entityId !== opts.entityId) return false;
    if (opts.tags?.length) {
      const has = opts.tags.every((t) => e.tags.includes(t));
      if (!has) return false;
    }
    const freshness = computeFreshness(e.updatedAt, e.expiresAt);
    if (opts.minFreshness !== undefined && freshness < opts.minFreshness) return false;
    return true;
  });
  results = results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return results.slice(0, opts.limit ?? 50);
}

export function store_update(memoryId: string, patch: Partial<Pick<MemoryEntry, 'content' | 'tags'>>): MemoryEntry | undefined {
  const entry = store.get(memoryId);
  if (!entry) return undefined;
  if (patch.content) entry.content = redactContent(patch.content);
  if (patch.tags) entry.tags = patch.tags;
  entry.updatedAt = new Date().toISOString();
  entry.freshnessScore = 1;
  return entry;
}

export function compact(): void {
  const entries = [...store.values()].sort(
    (a, b) => computeFreshness(a.updatedAt, a.expiresAt) - computeFreshness(b.updatedAt, b.expiresAt),
  );
  const toRemove = Math.floor(entries.length * 0.2);
  for (let i = 0; i < toRemove; i++) {
    store.delete(entries[i].memoryId);
  }
}

export function listEntries(limit = 50): MemoryEntry[] {
  return [...store.values()].slice(-limit).reverse();
}

export function getStats() {
  return {
    totalEntries: store.size,
    maxEntries: MAX_ENTRIES,
    utilizationPct: Math.round((store.size / MAX_ENTRIES) * 100),
  };
}
