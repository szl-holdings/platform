import type { TraceRecord } from '@workspace/trace-graph';
import type { RouteQuality } from './types.js';

export interface QualityScore {
  overall: number;
  toolSuccessRate: number;
  guardrailHealth: number;
  retrievalQuality: number;
  efficiencyScore: number;
  breakdown: Record<string, number>;
}

const LATENCY_EXCELLENT_MS = 3000;
const LATENCY_ACCEPTABLE_MS = 10000;
const COST_EXCELLENT_USD = 0.01;
const COST_ACCEPTABLE_USD = 0.1;

export function scoreTrace(trace: TraceRecord): QualityScore {
  const breakdown: Record<string, number> = {};

  const toolSuccessRate =
    trace.toolCalls.length > 0
      ? trace.toolCalls.filter((t) => t.success).length / trace.toolCalls.length
      : 1;
  breakdown.toolSuccessRate = toolSuccessRate;

  const guardrailBlocks = trace.guardrailResults.filter(
    (g) => g.outcome === 'block' || g.outcome === 'require-approval',
  ).length;
  const guardrailHealth = Math.max(0, 1 - guardrailBlocks * 0.25);
  breakdown.guardrailHealth = guardrailHealth;

  const retrieval = trace.retrieval;
  const retrievalQuality =
    retrieval.length > 0
      ? retrieval.reduce((sum, r) => {
          const hitRatio =
            r.hitCount + r.missCount > 0 ? r.hitCount / (r.hitCount + r.missCount) : 1;
          const quality = r.qualityScore ?? hitRatio;
          return sum + quality;
        }, 0) / retrieval.length
      : 1;
  breakdown.retrievalQuality = retrievalQuality;

  const latencyMs = trace.latencyMs ?? 0;
  let latencyScore = 1;
  if (latencyMs > LATENCY_ACCEPTABLE_MS) {
    latencyScore = 0.2;
  } else if (latencyMs > LATENCY_EXCELLENT_MS) {
    latencyScore =
      0.5 +
      0.5 *
        (1 - (latencyMs - LATENCY_EXCELLENT_MS) / (LATENCY_ACCEPTABLE_MS - LATENCY_EXCELLENT_MS));
  }
  breakdown.latencyScore = latencyScore;

  const costUsd = trace.costUsd ?? 0;
  let costScore = 1;
  if (costUsd > COST_ACCEPTABLE_USD) {
    costScore = 0.2;
  } else if (costUsd > COST_EXCELLENT_USD) {
    costScore =
      0.5 + 0.5 * (1 - (costUsd - COST_EXCELLENT_USD) / (COST_ACCEPTABLE_USD - COST_EXCELLENT_USD));
  }
  breakdown.costScore = costScore;

  const efficiencyScore = (latencyScore + costScore) / 2;
  breakdown.efficiencyScore = efficiencyScore;

  const statusPenalty = trace.status === 'completed' ? 1 : trace.status === 'failed' ? 0.1 : 0.5;
  breakdown.statusPenalty = statusPenalty;

  const errorPenalty = Math.max(0, 1 - trace.errors.length * 0.2);
  breakdown.errorPenalty = errorPenalty;

  const overall =
    toolSuccessRate * 0.3 +
    guardrailHealth * 0.15 +
    retrievalQuality * 0.2 +
    efficiencyScore * 0.15 +
    statusPenalty * 0.1 +
    errorPenalty * 0.1;

  return {
    overall: Math.max(0, Math.min(1, overall)),
    toolSuccessRate,
    guardrailHealth,
    retrievalQuality,
    efficiencyScore,
    breakdown,
  };
}

export function extractBestRoute(trace: TraceRecord): RouteQuality {
  const successfulTools = trace.toolCalls.filter((t) => t.success).map((t) => t.toolName);
  const allTools = [...new Set(trace.toolCalls.map((t) => t.toolName))];

  const avgToolSuccessRate =
    trace.toolCalls.length > 0
      ? trace.toolCalls.filter((t) => t.success).length / trace.toolCalls.length
      : 1;

  const avgRetrievalQuality =
    trace.retrieval.length > 0
      ? trace.retrieval.reduce((s, r) => s + (r.qualityScore ?? 0.5), 0) / trace.retrieval.length
      : undefined;

  return {
    model: trace.model,
    promptVersion: trace.promptVersion,
    tools: successfulTools.length > 0 ? successfulTools : allTools,
    avgToolSuccessRate,
    avgRetrievalQuality,
    latencyMs: trace.latencyMs,
    costUsd: trace.costUsd,
    totalTokens: trace.totalTokens,
  };
}
