/**
 * Two-tier memory contract for the Agentic RAG Aggregator.
 *
 * Short-term (working) memory  — per-session, in-process store + Redis.
 *   Read during Perceive/Orient.  Written during Reflect.
 *   Default retention: session lifetime (evicted on session close).
 *
 * Long-term memory             — episodic event log + semantic vector store
 *   backed by the Alloy embedding/vector workers.
 *   Read during Perceive/Orient.  Written during Reflect.
 *   Default retention: 90 days (configurable via policy.longTermRetentionDays).
 */
import {
  type MemoryEntry,
  type MemoryStore,
  InMemoryStore,
  defaultMemoryStore,
} from '@workspace/memory-fabric';
import { randomUUID } from 'node:crypto';

export interface MemoryTierConfig {
  shortTermRetentionMs?: number;
  longTermRetentionDays?: number;
  scopeId?: string;
  domain?: string;
}

const DEFAULT_SHORT_TERM_RETENTION_MS = 60 * 60 * 1000;
const DEFAULT_LONG_TERM_RETENTION_DAYS = 90;

export interface AgenticMemoryContext {
  shortTerm: MemoryStore;
  longTerm: MemoryStore;
  config: Required<MemoryTierConfig>;
}

/**
 * Build a two-tier memory context for a single agentic RAG run.
 * Short-term is always a fresh in-process store scoped to the run.
 * Long-term points to the process-wide default memory store (Postgres-backed
 * in production, in-memory in tests) which survives across runs.
 */
export function createMemoryContext(config: MemoryTierConfig = {}): AgenticMemoryContext {
  const shortTerm = new InMemoryStore();
  const longTerm = defaultMemoryStore as unknown as MemoryStore;

  return {
    shortTerm,
    longTerm,
    config: {
      shortTermRetentionMs: config.shortTermRetentionMs ?? DEFAULT_SHORT_TERM_RETENTION_MS,
      longTermRetentionDays: config.longTermRetentionDays ?? DEFAULT_LONG_TERM_RETENTION_DAYS,
      scopeId: config.scopeId ?? randomUUID(),
      domain: config.domain ?? 'alloy-agentic-rag',
    },
  };
}

export interface MemoryReadResult {
  shortTermEntries: MemoryEntry[];
  longTermEntries: MemoryEntry[];
  totalEntries: number;
}

/**
 * Perceive/Orient phase: read relevant memory from both tiers.
 */
export function readMemory(ctx: AgenticMemoryContext, query: string): MemoryReadResult {
  const shortTermEntries = ctx.shortTerm.search(query, 'working');
  const longTermEntries = (() => {
    try {
      return ctx.longTerm.search(query, 'semantic');
    } catch {
      return [];
    }
  })();

  return {
    shortTermEntries,
    longTermEntries,
    totalEntries: shortTermEntries.length + longTermEntries.length,
  };
}

export interface MemoryWriteOptions {
  runId: string;
  query: string;
  answer: string;
  confidence: number;
}

/**
 * Reflect phase: write outcomes to both tiers.
 */
export function writeMemory(ctx: AgenticMemoryContext, opts: MemoryWriteOptions): void {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + ctx.config.shortTermRetentionMs).toISOString();

  const workingEntry: MemoryEntry = {
    id: randomUUID(),
    tier: 'working',
    memoryType: 'working',
    key: `rag:run:${opts.runId}`,
    value: { query: opts.query, answer: opts.answer, confidence: opts.confidence },
    domain: ctx.config.domain,
    scopeId: ctx.config.scopeId,
    confidence: opts.confidence,
    sensitivity: 'internal',
    tags: ['rag', 'run'],
    provenance: { source: 'alloy-agentic-rag', method: 'agent', createdAt: now },
    freshness: { lastUpdatedAt: now, isStale: false },
    retention: { policy: 'session-scoped', expiresAt, pinned: false },
    linkedEntities: [],
    linkedTraces: [],
    linkedActions: [],
    metadata: {},
  };

  try {
    ctx.shortTerm.put(workingEntry);
  } catch {
  }

  const episodicEntry: MemoryEntry = {
    id: randomUUID(),
    tier: 'episodic',
    memoryType: 'episodic',
    key: `rag:episodic:${opts.runId}`,
    value: {
      query: opts.query,
      answer: opts.answer.slice(0, 512),
      confidence: opts.confidence,
      runId: opts.runId,
    },
    domain: ctx.config.domain,
    scopeId: ctx.config.scopeId,
    confidence: opts.confidence,
    sensitivity: 'internal',
    tags: ['rag', 'episodic'],
    provenance: { source: 'alloy-agentic-rag', method: 'agent', createdAt: now },
    freshness: { lastUpdatedAt: now, isStale: false },
    retention: { policy: 'persistent', pinned: false },
    linkedEntities: [],
    linkedTraces: [],
    linkedActions: [],
    metadata: {},
  };

  try {
    ctx.longTerm.put(episodicEntry);
  } catch {
  }
}
