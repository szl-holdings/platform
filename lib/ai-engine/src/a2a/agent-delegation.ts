import { randomUUID } from 'node:crypto';
import { AGENT_REGISTRY, callAgent } from '../nuro-mesh.js';
import { getAgentCard, recordDelegationResult } from './agent-registry.js';

export type DelegationStatus =
  | 'pending'
  | 'accepted'
  | 'running'
  | 'completed'
  | 'failed'
  | 'rejected';

export interface DelegationTask {
  taskId: string;
  fromAgentId: string;
  toAgentId: string;
  query: string;
  context: string;
  status: DelegationStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  result: DelegationResult | null;
  error: string | null;
  delegationChain: string[];
}

export interface DelegationResult {
  taskId: string;
  fromAgentId: string;
  toAgentId: string;
  response: string;
  confidence: number;
  domain: string;
  tokensUsed?: number;
  latencyMs: number;
  validatedBy?: string;
  completedAt: string;
}

const activeDelegations = new Map<string, DelegationTask>();
const delegationHistory: DelegationTask[] = [];
const MAX_HISTORY = 200;
const MAX_DELEGATION_DEPTH = 3;

export async function delegateTask(params: {
  fromAgentId: string;
  toAgentId: string;
  query: string;
  context?: string;
  priority?: DelegationTask['priority'];
  parentChain?: string[];
  orgId?: number | null;
  callerUserId?: number | null;
  callerRoles?: string[];
}): Promise<DelegationResult> {
  const chain = params.parentChain ?? [];
  if (chain.length >= MAX_DELEGATION_DEPTH) {
    throw new Error(`Max delegation depth (${MAX_DELEGATION_DEPTH}) exceeded`);
  }

  const toCard = getAgentCard(params.toAgentId);
  if (!toCard) {
    throw new Error(`Unknown agent: ${params.toAgentId}`);
  }
  if (toCard.availability === 'offline') {
    throw new Error(`Agent ${params.toAgentId} is offline`);
  }

  const taskId = `del_${randomUUID()}`;
  const now = new Date().toISOString();

  const task: DelegationTask = {
    taskId,
    fromAgentId: params.fromAgentId,
    toAgentId: params.toAgentId,
    query: params.query,
    context: params.context ?? '',
    status: 'accepted',
    priority: params.priority ?? 'medium',
    createdAt: now,
    startedAt: null,
    completedAt: null,
    result: null,
    error: null,
    delegationChain: [...chain, params.fromAgentId],
  };

  activeDelegations.set(taskId, task);

  const startTime = Date.now();
  task.status = 'running';
  task.startedAt = new Date().toISOString();

  try {
    const agentDef = AGENT_REGISTRY.find((a) => a.id === params.toAgentId);
    if (!agentDef) throw new Error(`Agent definition not found: ${params.toAgentId}`);

    const agentResult = await callAgent(agentDef, params.query, params.context ?? '', {
      orgId: params.orgId ?? null,
      action: 'a2a_delegation',
      callerUserId: params.callerUserId ?? null,
      callerRoles: params.callerRoles ?? [],
    });

    const latencyMs = Date.now() - startTime;

    const result: DelegationResult = {
      taskId,
      fromAgentId: params.fromAgentId,
      toAgentId: params.toAgentId,
      response: agentResult.response,
      confidence: agentResult.confidence,
      domain: agentResult.domain,
      latencyMs,
      completedAt: new Date().toISOString(),
    };

    task.status = 'completed';
    task.completedAt = result.completedAt;
    task.result = result;

    recordDelegationResult(params.toAgentId, true);

    delegationHistory.unshift(task);
    if (delegationHistory.length > MAX_HISTORY) delegationHistory.length = MAX_HISTORY;
    activeDelegations.delete(taskId);

    return result;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    task.status = 'failed';
    task.error = errMsg;
    task.completedAt = new Date().toISOString();

    recordDelegationResult(params.toAgentId, false);

    delegationHistory.unshift(task);
    if (delegationHistory.length > MAX_HISTORY) delegationHistory.length = MAX_HISTORY;
    activeDelegations.delete(taskId);

    throw err;
  }
}

export async function multiDelegateAndMerge(params: {
  fromAgentId: string;
  toAgentIds: string[];
  query: string;
  context?: string;
  orgId?: number | null;
}): Promise<{ results: DelegationResult[]; mergedSummary: string }> {
  const results = await Promise.allSettled(
    params.toAgentIds.map((toId) =>
      delegateTask({
        fromAgentId: params.fromAgentId,
        toAgentId: toId,
        query: params.query,
        ...(params.context !== undefined ? { context: params.context } : {}),
        ...(params.orgId !== undefined ? { orgId: params.orgId } : {}),
      }),
    ),
  );

  const successful: DelegationResult[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') successful.push(r.value);
  }

  const mergedSummary =
    successful.length === 0
      ? '[All delegated agents failed to respond]'
      : successful
          .map(
            (r) =>
              `[${r.toAgentId.toUpperCase()} — ${r.domain} — confidence ${r.confidence}%]\n${r.response}`,
          )
          .join('\n\n---\n\n');

  return { results: successful, mergedSummary };
}

export function getActiveDelegations(): DelegationTask[] {
  return Array.from(activeDelegations.values());
}

export function getDelegationHistory(limit = 50): DelegationTask[] {
  return delegationHistory.slice(0, limit);
}

export function getDelegationStats(): {
  active: number;
  totalHistorical: number;
  completedCount: number;
  failedCount: number;
  avgLatencyMs: number;
  byAgent: Record<string, { delegations: number; successes: number; failures: number }>;
} {
  const byAgent: Record<string, { delegations: number; successes: number; failures: number }> = {};

  let totalLatency = 0;
  let countWithLatency = 0;

  for (const task of delegationHistory) {
    if (!byAgent[task.toAgentId]) {
      byAgent[task.toAgentId] = { delegations: 0, successes: 0, failures: 0 };
    }
    byAgent[task.toAgentId]!.delegations++;
    if (task.status === 'completed') {
      byAgent[task.toAgentId]!.successes++;
      if (task.result?.latencyMs) {
        totalLatency += task.result.latencyMs;
        countWithLatency++;
      }
    }
    if (task.status === 'failed') byAgent[task.toAgentId]!.failures++;
  }

  return {
    active: activeDelegations.size,
    totalHistorical: delegationHistory.length,
    completedCount: delegationHistory.filter((t) => t.status === 'completed').length,
    failedCount: delegationHistory.filter((t) => t.status === 'failed').length,
    avgLatencyMs: countWithLatency > 0 ? Math.round(totalLatency / countWithLatency) : 0,
    byAgent,
  };
}
