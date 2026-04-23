import { createHash } from 'crypto';
import type {
  ProvenanceEnvelope,
  ProvenanceLineage,
  SourceCitation,
  ToolCallRecord,
} from '@szl-holdings/shared-contracts';
import type { AgentCallResult, AgentDefinition } from './types.js';
import { callAgent } from './nuro-mesh.js';

const store = new Map<string, ProvenanceLineage>();
const MAX_ENTRIES = 5000;

function generateRunId(): string {
  return `prov_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function hashPrompt(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex').slice(0, 16);
}

function estimateCostFromTokens(model: string, tokens: number): number {
  const rates: Record<string, { input: number; output: number }> = {
    'gpt-5.2': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'claude-sonnet-4-6': { input: 0.003, output: 0.015 },
    'gemini-2.5-pro': { input: 0.00125, output: 0.005 },
  };
  const rate = rates[model] ?? { input: 0.003, output: 0.015 };
  const inputTokens = Math.round(tokens * 0.3);
  const outputTokens = Math.round(tokens * 0.7);
  return (inputTokens / 1000) * rate.input + (outputTokens / 1000) * rate.output;
}

function evictOldest(): void {
  if (store.size <= MAX_ENTRIES) return;
  const oldest = store.keys().next().value;
  if (oldest) store.delete(oldest);
}

export interface ProvenancedResult extends AgentCallResult {
  provenance: ProvenanceEnvelope;
}

export async function callAgentWithProvenance(
  agent: AgentDefinition,
  query: string,
  context: string,
  options?: {
    orgId?: number | null;
    action?: string;
    callerUserId?: number | null;
    callerRoles?: string[];
    workflowId?: string;
    traceId?: string;
    parentForkId?: string;
    parentRunId?: string;
    sources?: SourceCitation[];
    toolCalls?: ToolCallRecord[];
  },
): Promise<ProvenancedResult> {
  const runId = generateRunId();
  const promptHash = hashPrompt(`${agent.systemPrompt}\n${context}\n${query}`);

  const result = await callAgent(agent, query, context, {
    orgId: options?.orgId,
    action: options?.action,
    callerUserId: options?.callerUserId,
    callerRoles: options?.callerRoles,
    workflowId: options?.workflowId,
    traceId: options?.traceId ?? runId,
    parentForkId: options?.parentForkId,
  });

  const totalTokens = result.tokensUsed ?? 0;
  const modelUsed = result.modelUsed ?? agent.preferredModel;
  const isBlocked = result.response.startsWith('[Blocked by governance');

  const envelope: ProvenanceEnvelope = {
    runId,
    agentId: result.agentId,
    domain: result.domain,
    model: modelUsed,
    provider: agent.preferredProvider,
    promptHash,
    promptTokens: Math.round(totalTokens * 0.3),
    completionTokens: Math.round(totalTokens * 0.7),
    totalTokens,
    costEstimateUsd: estimateCostFromTokens(modelUsed, totalTokens),
    confidence: result.confidence,
    latencyMs: result.latencyMs ?? 0,
    sources: options?.sources ?? [],
    toolCalls: options?.toolCalls ?? [],
    governanceVerdict: isBlocked ? 'blocked' : 'allowed',
    generatedAt: new Date().toISOString(),
  };

  const consultationEnvelopes: ProvenanceEnvelope[] = (result.consultations ?? []).map((c) => ({
    runId: generateRunId(),
    agentId: c.consultingAgentId,
    domain: '',
    model: modelUsed,
    provider: agent.preferredProvider,
    promptHash: hashPrompt(c.question),
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    costEstimateUsd: 0,
    confidence: c.confidence,
    latencyMs: 0,
    sources: [],
    toolCalls: [],
    governanceVerdict: 'allowed' as const,
    generatedAt: envelope.generatedAt,
  }));

  const lineage: ProvenanceLineage = {
    runId,
    envelope,
    parentRunIds: options?.parentRunId ? [options.parentRunId] : [],
    consultations: consultationEnvelopes,
  };

  evictOldest();
  store.set(runId, lineage);

  return { ...result, provenance: envelope };
}

export function getProvenanceByRunId(runId: string): ProvenanceLineage | null {
  return store.get(runId) ?? null;
}

export function listRecentProvenance(limit = 50): ProvenanceLineage[] {
  const entries = Array.from(store.values());
  return entries.slice(-limit).reverse();
}

export function getProvenanceStats(): {
  totalRuns: number;
  totalTokens: number;
  totalCostUsd: number;
  byAgent: Record<string, { runs: number; tokens: number; costUsd: number }>;
} {
  let totalTokens = 0;
  let totalCostUsd = 0;
  const byAgent: Record<string, { runs: number; tokens: number; costUsd: number }> = {};

  for (const lineage of store.values()) {
    const e = lineage.envelope;
    totalTokens += e.totalTokens;
    totalCostUsd += e.costEstimateUsd;
    if (!byAgent[e.agentId]) {
      byAgent[e.agentId] = { runs: 0, tokens: 0, costUsd: 0 };
    }
    byAgent[e.agentId]!.runs += 1;
    byAgent[e.agentId]!.tokens += e.totalTokens;
    byAgent[e.agentId]!.costUsd += e.costEstimateUsd;
  }

  return { totalRuns: store.size, totalTokens, totalCostUsd, byAgent };
}
