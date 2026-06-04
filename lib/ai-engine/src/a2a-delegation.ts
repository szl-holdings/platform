/**
 * A2A Delegation Protocol — Structured task handoff between agents.
 *
 * Implements: request → accept/reject → status streaming → result collection
 * with timeout enforcement and fallback handling.
 */

import { a2aDelegationTasks, db } from '@szl-holdings/db';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { a2aRegistry } from './a2a-registry.js';
import { AGENT_REGISTRY, callAgent } from './nuro-mesh.js';

export type DelegationStatus =
  | 'pending'
  | 'accepted'
  | 'running'
  | 'completed'
  | 'rejected'
  | 'failed'
  | 'timeout';

export interface DelegationRequest {
  requestingAgentId: string;
  targetAgentId: string;
  query: string;
  context?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  timeoutMs?: number;
  orchestrationId?: string;
  orgId?: number | null;
  callerUserId?: number | null;
  callerRoles?: string[];
}

export interface DelegationAcceptance {
  taskId: string;
  accepted: boolean;
  reason?: string;
  estimatedCompletionMs?: number;
}

export interface DelegationResult {
  taskId: string;
  status: DelegationStatus;
  result?: string;
  confidence?: number;
  durationMs?: number;
  errorMessage?: string;
}

export interface DelegationTaskRecord {
  taskId: string;
  requestingAgentId: string;
  targetAgentId: string;
  query: string;
  context: string;
  status: DelegationStatus;
  priority: string;
  result?: string | null;
  resultConfidence?: number | null;
  errorMessage?: string | null;
  requestedAt: number;
  acceptedAt?: number | null;
  completedAt?: number | null;
  durationMs?: number | null;
  orchestrationId?: string | null;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 120_000;

async function persistTask(req: DelegationRequest, taskId: string): Promise<void> {
  await db.insert(a2aDelegationTasks).values({
    taskId,
    requestingAgentId: req.requestingAgentId,
    targetAgentId: req.targetAgentId,
    query: req.query,
    context: req.context ?? '',
    status: 'pending',
    priority: req.priority ?? 'normal',
    timeoutMs: Math.min(req.timeoutMs ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS),
    requestedAt: Date.now(),
    orchestrationId: req.orchestrationId,
  });
}

async function updateTaskStatus(
  taskId: string,
  updates: Partial<{
    status: DelegationStatus;
    result: string;
    resultConfidence: number;
    errorMessage: string;
    acceptedAt: number;
    completedAt: number;
    durationMs: number;
  }>,
): Promise<void> {
  await db
    .update(a2aDelegationTasks)
    .set(updates as Record<string, unknown>)
    .where(eq(a2aDelegationTasks.taskId, taskId))
    .catch(() => {});
}

async function canAcceptTask(
  targetAgentId: string,
): Promise<{ accepted: boolean; reason?: string }> {
  const card = await a2aRegistry.getAgentCard(targetAgentId).catch(() => null);

  if (!card) {
    const inRegistry = AGENT_REGISTRY.find((a) => a.id === targetAgentId);
    if (!inRegistry) {
      return { accepted: false, reason: `Agent '${targetAgentId}' not found in registry` };
    }
    return { accepted: true };
  }

  if (card.status === 'offline') {
    return { accepted: false, reason: `Agent '${targetAgentId}' is offline` };
  }

  return { accepted: true };
}

export async function delegateTask(req: DelegationRequest): Promise<DelegationResult> {
  const taskId = randomUUID();
  const timeoutMs = Math.min(req.timeoutMs ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);
  const startTime = Date.now();

  await persistTask(req, taskId).catch(() => {});

  const acceptance = await canAcceptTask(req.targetAgentId);
  if (!acceptance.accepted) {
    await updateTaskStatus(taskId, {
      status: 'rejected',
      ...(acceptance.reason !== undefined ? { errorMessage: acceptance.reason } : {}),
      completedAt: Date.now(),
    });
    return {
      taskId,
      status: 'rejected',
      ...(acceptance.reason !== undefined ? { errorMessage: acceptance.reason } : {}),
    };
  }

  await updateTaskStatus(taskId, {
    status: 'accepted',
    acceptedAt: Date.now(),
  });

  const targetAgent = AGENT_REGISTRY.find((a) => a.id === req.targetAgentId);
  if (!targetAgent) {
    await updateTaskStatus(taskId, {
      status: 'failed',
      errorMessage: `Agent definition not found: ${req.targetAgentId}`,
      completedAt: Date.now(),
    });
    return {
      taskId,
      status: 'failed',
      errorMessage: `Agent '${req.targetAgentId}' definition not found`,
    };
  }

  await updateTaskStatus(taskId, { status: 'running' });

  const executionPromise = callAgent(targetAgent, req.query, req.context ?? '', {
    orgId: req.orgId ?? null,
    callerUserId: req.callerUserId ?? null,
    callerRoles: req.callerRoles ?? [],
    action: 'delegation',
  });

  const timeoutPromise = new Promise<null>((_, reject) => {
    setTimeout(() => reject(new Error('DELEGATION_TIMEOUT')), timeoutMs);
  });

  try {
    const callResult = (await Promise.race([executionPromise, timeoutPromise])) as Awaited<
      typeof executionPromise
    >;
    const durationMs = Date.now() - startTime;

    await updateTaskStatus(taskId, {
      status: 'completed',
      result: callResult.response,
      resultConfidence: callResult.confidence / 100,
      completedAt: Date.now(),
      durationMs,
    });

    void a2aRegistry
      .updateAgentMetrics(req.targetAgentId, {
        avgLatencyMs: durationMs,
        successRate: 0.95,
      })
      .catch(() => {});

    return {
      taskId,
      status: 'completed',
      result: callResult.response,
      confidence: callResult.confidence / 100,
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const isTimeout = err instanceof Error && err.message === 'DELEGATION_TIMEOUT';

    await updateTaskStatus(taskId, {
      status: isTimeout ? 'timeout' : 'failed',
      errorMessage: isTimeout
        ? `Task timed out after ${timeoutMs}ms`
        : String(err instanceof Error ? err.message : err),
      completedAt: Date.now(),
      durationMs,
    });

    void a2aRegistry
      .updateAgentMetrics(req.targetAgentId, {
        successRate: 0.85,
      })
      .catch(() => {});

    return {
      taskId,
      status: isTimeout ? 'timeout' : 'failed',
      errorMessage: isTimeout
        ? `Delegation timed out after ${timeoutMs}ms`
        : String(err instanceof Error ? err.message : err),
      durationMs,
    };
  }
}

export async function getDelegationTask(taskId: string): Promise<DelegationTaskRecord | null> {
  const [row] = await db
    .select()
    .from(a2aDelegationTasks)
    .where(eq(a2aDelegationTasks.taskId, taskId))
    .limit(1);

  if (!row) return null;

  return {
    taskId: row.taskId,
    requestingAgentId: row.requestingAgentId,
    targetAgentId: row.targetAgentId,
    query: row.query,
    context: row.context,
    status: row.status as DelegationStatus,
    priority: row.priority,
    result: row.result,
    resultConfidence: row.resultConfidence,
    errorMessage: row.errorMessage,
    requestedAt: Number(row.requestedAt),
    acceptedAt: row.acceptedAt ? Number(row.acceptedAt) : null,
    completedAt: row.completedAt ? Number(row.completedAt) : null,
    durationMs: row.durationMs,
    orchestrationId: row.orchestrationId,
  };
}

export async function getDelegationHistory(
  options: { requestingAgentId?: string; targetAgentId?: string; limit?: number } = {},
): Promise<DelegationTaskRecord[]> {
  const query = db.select().from(a2aDelegationTasks).orderBy(a2aDelegationTasks.id);

  const rows = await query.limit(options.limit ?? 50);

  return rows
    .filter((r) => {
      if (options.requestingAgentId && r.requestingAgentId !== options.requestingAgentId)
        return false;
      if (options.targetAgentId && r.targetAgentId !== options.targetAgentId) return false;
      return true;
    })
    .map((r) => ({
      taskId: r.taskId,
      requestingAgentId: r.requestingAgentId,
      targetAgentId: r.targetAgentId,
      query: r.query,
      context: r.context,
      status: r.status as DelegationStatus,
      priority: r.priority,
      result: r.result,
      resultConfidence: r.resultConfidence,
      errorMessage: r.errorMessage,
      requestedAt: Number(r.requestedAt),
      acceptedAt: r.acceptedAt ? Number(r.acceptedAt) : null,
      completedAt: r.completedAt ? Number(r.completedAt) : null,
      durationMs: r.durationMs,
      orchestrationId: r.orchestrationId,
    }));
}
