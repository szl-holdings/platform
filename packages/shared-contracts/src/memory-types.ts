/**
 * AEEP Memory Type Contracts
 *
 * Shared types for working memory, episodic memory,
 * semantic knowledge, governance data, and governed scoped memory.
 */

/**
 * AEEP Memory Scope model:
 *
 * - `working`    — Short-lived session-scoped memory; cleared when session ends.
 *                  Use for in-flight task state, intermediate results.
 *
 * - `episodic`   — Event log memory; records of what happened, ordered by time.
 *                  Use for audit trails, interaction history, user activity logs.
 *
 * - `semantic`   — Long-term structured knowledge; facts that persist across sessions.
 *                  Use for extracted entities, learned preferences, domain knowledge.
 *
 * - `governance` — Policy-sensitive data; profile versions, approval records, overrides.
 *                  Writes to this scope require policy approval in strict mode.
 */
export type MemoryScope = 'working' | 'episodic' | 'semantic' | 'governance';

/**
 * Phase 4 Governed Memory Scopes — four explicit scopes with defined
 * read/write contracts and retention semantics.
 *
 * - `session`    — Ephemeral. Lives for the duration of one agent run / user session.
 *                  No retention after session ends. Read: any agent in session.
 *                  Write: any agent in session. Never persisted to durable storage.
 *
 * - `domain`     — Domain-bound persistent knowledge.
 *                  Scoped to a single product domain (vessels, aegis, terra, …).
 *                  Read: agents and operators in that domain.
 *                  Write: domain agents only. Retained until explicit eviction or
 *                  `maxAgeDays` expiry.
 *
 * - `executive`  — Cross-domain executive summaries and decisions.
 *                  Read: executive agents, human operators with 'executive' role.
 *                  Write: executive-briefing agents only. Retained for 90 days default.
 *                  Not domain-locked; always tagged with `domain = 'consolidated'`.
 *
 * - `compliance` — Immutable audit trail. Append-only; no deletes, no updates.
 *                  Read: compliance agents, admin operators.
 *                  Write: any agent (append only). Retained for 7 years minimum.
 *                  Sensitivity defaults to 'restricted'.
 */
export type GoverningMemoryScope = 'session' | 'domain' | 'executive' | 'compliance';

/**
 * Retention rules for each governing scope.
 */
export const GOVERNED_SCOPE_RETENTION = {
  session: { policy: 'ephemeral', maxAgeDays: undefined, immutable: false } as const,
  domain: { policy: 'persistent', maxAgeDays: 90, immutable: false } as const,
  executive: { policy: 'persistent', maxAgeDays: 90, immutable: false } as const,
  compliance: { policy: 'archival', maxAgeDays: 2555, immutable: true } as const,
} satisfies Record<
  GoverningMemoryScope,
  { policy: string; maxAgeDays: number | undefined; immutable: boolean }
>;

/**
 * Read contract for each governing scope.
 */
export const GOVERNED_SCOPE_READ_ROLES = {
  session: ['any-agent-in-session'],
  domain: ['domain-agent', 'domain-operator'],
  executive: ['executive-agent', 'executive-operator', 'admin'],
  compliance: ['compliance-agent', 'admin'],
} satisfies Record<GoverningMemoryScope, string[]>;

/**
 * Write contract for each governing scope.
 */
export const GOVERNED_SCOPE_WRITE_ROLES = {
  session: ['any-agent-in-session'],
  domain: ['domain-agent'],
  executive: ['executive-briefing-agent'],
  compliance: ['any-agent-append-only'],
} satisfies Record<GoverningMemoryScope, string[]>;

export interface MemoryEntry<T = unknown> {
  memoryId: string;
  scope: MemoryScope;
  key: string;
  value: T;
  agentRole?: string;
  workflowRunId?: string;
  traceId?: string;
  createdAt: string;
  expiresAt?: string;
  lastAccessedAt?: string;
  version?: number;
}

export interface MemoryReadRequest {
  scope?: MemoryScope;
  key?: string;
  pattern?: string;
  traceId?: string;
}

export interface MemoryWriteRequest<T = unknown> {
  scope: MemoryScope;
  key: string;
  value: T;
  ttlSeconds?: number;
  agentRole?: string;
  workflowRunId?: string;
  traceId?: string;
}

export interface MemoryExpireRequest {
  scope?: MemoryScope;
  key?: string;
  pattern?: string;
  reason?: string;
  traceId?: string;
}
