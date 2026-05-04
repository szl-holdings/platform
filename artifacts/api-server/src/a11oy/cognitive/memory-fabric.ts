import { newId } from './types.js';
import type { MemoryLookupResult } from './types.js';

export interface MemoryContext {
  tenantId: string;
  workspaceId?: string;
  domain?: string;
}

interface ContextEntry {
  memoryKey: string;
  tenantId: string;
  workspaceId?: string;
  domain?: string;
  tags: string[];
  tokenCount: number;
  data: unknown;
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
  ttlMs?: number;
}

// Store WITHOUT tenant/workspace prefix — runtime checks enforce isolation
const CONTEXT_STORE = new Map<string, ContextEntry>();
const MAX_ENTRIES = 5000;
const DEFAULT_TTL_MS = 60 * 60 * 1000;

function isExpired(entry: ContextEntry): boolean {
  if (!entry.ttlMs) return false;
  return Date.now() - entry.createdAt > entry.ttlMs;
}

function computeOverlap(tags1: string[], tags2: string[]): number {
  if (tags1.length === 0 && tags2.length === 0) return 0.5;
  const set2 = new Set(tags2);
  const common = tags1.filter((t) => set2.has(t)).length;
  return common / Math.max(tags1.length, tags2.length, 1);
}

function computeFreshness(createdAt: number, ttlMs: number = DEFAULT_TTL_MS): number {
  const age = Date.now() - createdAt;
  return Math.max(0, 1 - age / ttlMs);
}

function computeContextReuseScore(overlap: number, freshness: number): number {
  return Math.round((overlap * 0.6 + freshness * 0.4) * 100) / 100;
}

function evict(): void {
  const entries = Array.from(CONTEXT_STORE.entries())
    .sort(([, a], [, b]) => a.lastAccessedAt - b.lastAccessedAt);
  const toRemove = Math.floor(entries.length * 0.2);
  for (let i = 0; i < toRemove; i++) {
    CONTEXT_STORE.delete(entries[i]![0]);
  }
}

export function memoryWrite(
  ctx: MemoryContext,
  memoryKey: string,
  data: unknown,
  opts: { tags?: string[]; tokenCount?: number; ttlMs?: number } = {},
): string {
  if (CONTEXT_STORE.size >= MAX_ENTRIES) evict();
  const now = Date.now();
  CONTEXT_STORE.set(memoryKey, {
    memoryKey,
    tenantId: ctx.tenantId,
    workspaceId: ctx.workspaceId,
    domain: ctx.domain,
    tags: opts.tags ?? [],
    tokenCount: opts.tokenCount ?? 0,
    data,
    createdAt: now,
    lastAccessedAt: now,
    accessCount: 0,
    ttlMs: opts.ttlMs ?? DEFAULT_TTL_MS,
  });
  return memoryKey;
}

export function memoryLookup(
  ctx: MemoryContext,
  memoryKey: string,
  queryTags: string[] = [],
): MemoryLookupResult {
  const entry = CONTEXT_STORE.get(memoryKey);
  const miss: MemoryLookupResult = { hit: false, contextReuseScore: 0, overlapScore: 0, freshnessScore: 0, memoryKey };

  if (!entry) return miss;

  // Hard tenant isolation: throw immediately on cross-tenant access attempt
  if (entry.tenantId !== ctx.tenantId) {
    throw new Error(
      `[MemoryFabric] TENANT_ISOLATION_BREACH: requestedTenant="${ctx.tenantId}" does not match ownerTenant="${entry.tenantId}" for key="${memoryKey}"`,
    );
  }

  // Workspace isolation: entry written with a workspaceId is only accessible from the same workspace
  if (entry.workspaceId !== undefined && entry.workspaceId !== ctx.workspaceId) {
    return miss;
  }

  if (isExpired(entry)) {
    CONTEXT_STORE.delete(memoryKey);
    return miss;
  }

  const overlapScore = computeOverlap(queryTags, entry.tags);
  const freshnessScore = computeFreshness(entry.createdAt, entry.ttlMs);
  const contextReuseScore = computeContextReuseScore(overlapScore, freshnessScore);

  entry.lastAccessedAt = Date.now();
  entry.accessCount += 1;

  return {
    hit: true,
    contextReuseScore,
    overlapScore,
    freshnessScore,
    memoryKey,
    tokensSaved: entry.tokenCount,
    data: entry.data,
  };
}

export function memoryInvalidate(ctx: MemoryContext, memoryKey: string): boolean {
  const entry = CONTEXT_STORE.get(memoryKey);
  if (!entry) return false;
  if (entry.tenantId !== ctx.tenantId) {
    throw new Error(
      `[MemoryFabric] TENANT_ISOLATION_BREACH: cannot invalidate key="${memoryKey}" for requestedTenant="${ctx.tenantId}" (owned by "${entry.tenantId}")`,
    );
  }
  return CONTEXT_STORE.delete(memoryKey);
}

export function memoryStats(tenantId: string): {
  totalEntries: number;
  tenantEntries: number;
  avgContextReuseScore: number;
  hitRate: number;
} {
  let tenantEntries = 0;
  let totalAccesses = 0;
  let totalReuseScore = 0;

  for (const entry of CONTEXT_STORE.values()) {
    if (entry.tenantId === tenantId) {
      tenantEntries++;
      totalAccesses += entry.accessCount;
      const freshness = computeFreshness(entry.createdAt, entry.ttlMs);
      totalReuseScore += freshness;
    }
  }

  return {
    totalEntries: CONTEXT_STORE.size,
    tenantEntries,
    avgContextReuseScore:
      tenantEntries > 0 ? Math.round((totalReuseScore / tenantEntries) * 100) / 100 : 0,
    hitRate: totalAccesses > 0 ? Math.min(1, totalAccesses / (tenantEntries || 1)) : 0,
  };
}

export { newId };
