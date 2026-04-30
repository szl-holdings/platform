import { createHash } from 'crypto';
import type {
  ProvenanceEnvelope,
  ProvenanceLineage,
} from '@szl-holdings/shared-contracts';

const store = new Map<string, ProvenanceLineage>();
const MAX_ENTRIES = 5000;

export function generateRunId(): string {
  return `prov_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function hashPrompt(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex').slice(0, 16);
}

export function estimateCostFromTokens(model: string, tokens: number): number {
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

export function buildEnvelope(params: {
  agentId: string;
  domain: string;
  model: string;
  provider: string;
  prompt: string;
  totalTokens: number;
  confidence: number;
  latencyMs: number;
  governanceVerdict: 'allowed' | 'blocked';
  runId?: string;
  metadata?: Record<string, unknown>;
}): ProvenanceEnvelope {
  return {
    runId: params.runId ?? generateRunId(),
    agentId: params.agentId,
    domain: params.domain,
    model: params.model,
    provider: params.provider,
    promptHash: hashPrompt(params.prompt),
    promptTokens: Math.round(params.totalTokens * 0.3),
    completionTokens: Math.round(params.totalTokens * 0.7),
    totalTokens: params.totalTokens,
    costEstimateUsd: estimateCostFromTokens(params.model, params.totalTokens),
    confidence: params.confidence,
    latencyMs: params.latencyMs,
    sources: [],
    toolCalls: [],
    governanceVerdict: params.governanceVerdict,
    generatedAt: new Date().toISOString(),
    ...(params.metadata !== undefined ? { metadata: params.metadata } : {}),
  };
}

export function storeProvenance(lineage: ProvenanceLineage): void {
  evictOldest();
  store.set(lineage.runId, lineage);
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
