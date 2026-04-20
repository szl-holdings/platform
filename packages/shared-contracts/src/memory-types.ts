/**
 * AEEP Memory Type Contracts
 *
 * Shared types for working memory, episodic memory,
 * semantic knowledge, and governance data.
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
