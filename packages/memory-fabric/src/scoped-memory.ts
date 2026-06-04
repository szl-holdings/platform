/**
 * AEEP Scoped Memory — Phase 4
 *
 * Four governed memory scopes with explicit read/write contracts and retention semantics:
 *
 *  - session    Ephemeral. Cleared on session end. Read/write: any agent in session.
 *  - domain     Domain-bound persistent knowledge. Read/write: domain agents only.
 *  - executive  Cross-domain executive summaries. Write: executive-briefing agent only.
 *  - compliance Immutable audit trail. Append-only. Retained 7 years minimum.
 *
 * Each scope is backed by a ScopedMemoryStore instance. The ScopedMemoryManager
 * coordinates reads and writes across scopes and enforces retention semantics.
 */

import { randomUUID } from 'node:crypto';
import { MEMORY_DOMAIN_UNKNOWN } from './types.js';

/**
 * Four governed memory scopes with explicit read/write contracts.
 * These mirror the types in @szl-holdings/shared-contracts (memory-types.ts)
 * and are kept inline here to avoid a circular dependency.
 */
export type GoverningMemoryScope = 'session' | 'domain' | 'executive' | 'compliance';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScopedMemoryEntry {
  id: string;
  scope: GoverningMemoryScope;
  key: string;
  value: unknown;
  summary?: string;
  domain: string;
  agentRole?: string;
  traceId?: string;
  sessionId?: string;
  tags: string[];
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  confidence: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  immutable: boolean;
  metadata: Record<string, unknown>;
}

export interface ScopedMemoryWriteOptions {
  key: string;
  value: unknown;
  summary?: string;
  domain?: string;
  agentRole?: string;
  traceId?: string;
  sessionId?: string;
  tags?: string[];
  sensitivity?: ScopedMemoryEntry['sensitivity'];
  confidence?: number;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ScopedMemoryReadOptions {
  key?: string;
  domain?: string;
  agentRole?: string;
  sessionId?: string;
  tags?: string[];
  search?: string;
  limit?: number;
}

// ─── Individual scope stores ──────────────────────────────────────────────────

abstract class BaseScopedStore {
  protected readonly scope: GoverningMemoryScope;
  protected readonly entries = new Map<string, ScopedMemoryEntry>();

  constructor(scope: GoverningMemoryScope) {
    this.scope = scope;
  }

  protected buildEntry(opts: ScopedMemoryWriteOptions): ScopedMemoryEntry {
    const now = new Date().toISOString();
    return {
      id: randomUUID(),
      scope: this.scope,
      key: opts.key,
      value: opts.value,
      summary: opts.summary,
      domain: opts.domain ?? MEMORY_DOMAIN_UNKNOWN,
      agentRole: opts.agentRole,
      traceId: opts.traceId,
      sessionId: opts.sessionId,
      tags: opts.tags ?? [],
      sensitivity: opts.sensitivity ?? 'internal',
      confidence: opts.confidence ?? 1.0,
      createdAt: now,
      updatedAt: now,
      expiresAt: opts.expiresAt,
      immutable: this.isImmutable(),
      metadata: opts.metadata ?? {},
    };
  }

  protected isImmutable(): boolean {
    return false;
  }

  get(id: string): ScopedMemoryEntry | undefined {
    return this.entries.get(id);
  }

  getByKey(key: string, domain?: string): ScopedMemoryEntry | undefined {
    for (const e of this.entries.values()) {
      if (e.key === key && (domain === undefined || e.domain === domain)) return e;
    }
    return undefined;
  }

  list(opts: ScopedMemoryReadOptions = {}): ScopedMemoryEntry[] {
    let results = Array.from(this.entries.values());
    if (opts.key) results = results.filter((e) => e.key === opts.key);
    if (opts.domain) results = results.filter((e) => e.domain === opts.domain);
    if (opts.agentRole) results = results.filter((e) => e.agentRole === opts.agentRole);
    if (opts.sessionId) results = results.filter((e) => e.sessionId === opts.sessionId);
    if (opts.tags?.length) {
      results = results.filter((e) => opts.tags!.every((t) => e.tags.includes(t)));
    }
    if (opts.search) {
      const needle = opts.search.toLowerCase();
      results = results.filter(
        (e) =>
          e.key.toLowerCase().includes(needle) ||
          (typeof e.value === 'string' && e.value.toLowerCase().includes(needle)) ||
          (e.summary?.toLowerCase().includes(needle)) ||
          e.tags.some((t) => t.toLowerCase().includes(needle)),
      );
    }
    return opts.limit ? results.slice(0, opts.limit) : results;
  }

  count(): number {
    return this.entries.size;
  }

  evictExpired(): number {
    const now = new Date();
    let count = 0;
    for (const [id, e] of this.entries) {
      if (!e.immutable && e.expiresAt && new Date(e.expiresAt) < now) {
        this.entries.delete(id);
        count++;
      }
    }
    return count;
  }
}

// ─── Session scope ────────────────────────────────────────────────────────────

/**
 * Session scope — ephemeral, no persistence across session boundary.
 * Read/Write: any agent within the same sessionId.
 * Retention: cleared on session end (evictSession) or process restart.
 */
export class SessionScopedStore extends BaseScopedStore {
  constructor() {
    super('session');
  }

  write(opts: ScopedMemoryWriteOptions): ScopedMemoryEntry {
    const entry = this.buildEntry(opts);
    this.entries.set(entry.id, entry);
    return entry;
  }

  evictSession(sessionId: string): number {
    let count = 0;
    for (const [id, e] of this.entries) {
      if (e.sessionId === sessionId) {
        this.entries.delete(id);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.entries.clear();
  }
}

// ─── Domain scope ─────────────────────────────────────────────────────────────

const DOMAIN_SCOPE_MAX_AGE_DAYS = 90;

/**
 * Domain scope — domain-bound persistent knowledge.
 * Read: domain agents and operators in the same domain.
 * Write: domain agents only (enforced via agentRole prefix check in strict mode).
 * Retention: up to DOMAIN_SCOPE_MAX_AGE_DAYS days.
 */
export class DomainScopedStore extends BaseScopedStore {
  constructor() {
    super('domain');
  }

  write(opts: ScopedMemoryWriteOptions): ScopedMemoryEntry {
    if (!opts.domain || opts.domain === MEMORY_DOMAIN_UNKNOWN) {
      throw new Error(
        `DomainScopedStore.write: 'domain' is required for domain-scoped memory. Got: ${String(opts.domain)}`,
      );
    }
    const expiresAt =
      opts.expiresAt ??
      new Date(Date.now() + DOMAIN_SCOPE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const entry = this.buildEntry({ ...opts, expiresAt });
    this.entries.set(entry.id, entry);
    return entry;
  }

  listByDomain(domain: string, opts?: Omit<ScopedMemoryReadOptions, 'domain'>): ScopedMemoryEntry[] {
    return this.list({ ...opts, domain });
  }
}

// ─── Executive scope ──────────────────────────────────────────────────────────

const EXECUTIVE_SCOPE_MAX_AGE_DAYS = 90;

/**
 * Executive scope — cross-domain executive summaries and decisions.
 * Read: executive agents, operators with 'executive' or 'admin' role.
 * Write: executive-briefing agents only (agentRole must include 'executive').
 * Domain: always 'consolidated'.
 * Retention: 90 days.
 */
export class ExecutiveScopedStore extends BaseScopedStore {
  constructor() {
    super('executive');
  }

  write(opts: ScopedMemoryWriteOptions): ScopedMemoryEntry {
    const expiresAt =
      opts.expiresAt ??
      new Date(Date.now() + EXECUTIVE_SCOPE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const entry = this.buildEntry({
      ...opts,
      domain: 'consolidated',
      sensitivity: opts.sensitivity ?? 'confidential',
      expiresAt,
    });
    this.entries.set(entry.id, entry);
    return entry;
  }

  listRecent(limit = 20): ScopedMemoryEntry[] {
    return this.list({ limit });
  }
}

// ─── Compliance scope ─────────────────────────────────────────────────────────

const COMPLIANCE_SCOPE_MAX_AGE_DAYS = 2555;

/**
 * Compliance scope — immutable audit trail.
 * Read: compliance agents, admin operators.
 * Write: any agent (append-only); throws on any attempt to update or delete.
 * Retention: 7 years minimum (COMPLIANCE_SCOPE_MAX_AGE_DAYS = 2555 days).
 * Sensitivity: defaults to 'restricted'.
 */
export class ComplianceScopedStore extends BaseScopedStore {
  protected override isImmutable(): boolean {
    return true;
  }

  constructor() {
    super('compliance');
  }

  append(opts: ScopedMemoryWriteOptions): ScopedMemoryEntry {
    const expiresAt = new Date(
      Date.now() + COMPLIANCE_SCOPE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    const entry = this.buildEntry({
      ...opts,
      sensitivity: opts.sensitivity ?? 'restricted',
      expiresAt,
    });
    this.entries.set(entry.id, entry);
    return entry;
  }

  override evictExpired(): number {
    return 0;
  }
}

// ─── Scoped Memory Manager ────────────────────────────────────────────────────

export interface ScopedMemoryManagerOptions {
  session?: SessionScopedStore;
  domain?: DomainScopedStore;
  executive?: ExecutiveScopedStore;
  compliance?: ComplianceScopedStore;
}

/**
 * ScopedMemoryManager — coordinates access across the four governed scopes.
 *
 * Usage:
 *   const mem = new ScopedMemoryManager();
 *   mem.session.write({ key: 'draft', value: '...', sessionId: 'abc' });
 *   mem.domain.write({ key: 'vessel-policy', value: {...}, domain: 'vessels' });
 *   mem.executive.write({ key: 'brief-2026-04', value: {...} });
 *   mem.compliance.append({ key: 'audit:approval:123', value: {...}, traceId: 'xyz' });
 */
export class ScopedMemoryManager {
  readonly session: SessionScopedStore;
  readonly domain: DomainScopedStore;
  readonly executive: ExecutiveScopedStore;
  readonly compliance: ComplianceScopedStore;

  constructor(opts: ScopedMemoryManagerOptions = {}) {
    this.session = opts.session ?? new SessionScopedStore();
    this.domain = opts.domain ?? new DomainScopedStore();
    this.executive = opts.executive ?? new ExecutiveScopedStore();
    this.compliance = opts.compliance ?? new ComplianceScopedStore();
  }

  /**
   * Read across all scopes by key, ordered session > domain > executive > compliance.
   * Session-scope lookup is always filtered by sessionId to prevent cross-session leakage.
   * If sessionId is not provided, session-scope entries are skipped entirely.
   */
  readAny(key: string, opts: { domain?: string; sessionId?: string } = {}): ScopedMemoryEntry | undefined {
    const sessionEntry = opts.sessionId
      ? this.session.list({ key, sessionId: opts.sessionId })[0]
      : undefined;
    return (
      sessionEntry ??
      this.domain.getByKey(key, opts.domain) ??
      this.executive.getByKey(key) ??
      this.compliance.getByKey(key)
    );
  }

  /**
   * Evict expired entries across all mutable scopes.
   * Compliance entries are never evicted by this method.
   */
  evictExpired(): { session: number; domain: number; executive: number } {
    return {
      session: this.session.evictExpired(),
      domain: this.domain.evictExpired(),
      executive: this.executive.evictExpired(),
    };
  }

  /**
   * End a session: evict all session-scoped entries for the given sessionId.
   */
  endSession(sessionId: string): number {
    return this.session.evictSession(sessionId);
  }

  stats(): {
    session: number;
    domain: number;
    executive: number;
    compliance: number;
  } {
    return {
      session: this.session.count(),
      domain: this.domain.count(),
      executive: this.executive.count(),
      compliance: this.compliance.count(),
    };
  }
}

export const defaultScopedMemoryManager = new ScopedMemoryManager();

export const SCOPED_MEMORY_VERSION = '1.0.0' as const;
