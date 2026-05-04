import { randomUUID } from 'node:crypto';
import type { CognitiveWorker, RouteDecision, ScoringMode, SlaConstraints } from './types.js';
import { newId } from './types.js';

export interface CortexCandidate {
  workerId: string;
  model: string;
  provider: string;
  avgLatencyMs: number;
  costPerKToken: number;
  confidenceRating: number;
  healthy: boolean;
}

const BUILT_IN_CANDIDATES: CortexCandidate[] = [
  { workerId: 'w-opus', model: 'claude-opus-4', provider: 'anthropic', avgLatencyMs: 4200, costPerKToken: 0.015, confidenceRating: 0.97, healthy: true },
  { workerId: 'w-sonnet', model: 'claude-sonnet-4', provider: 'anthropic', avgLatencyMs: 2100, costPerKToken: 0.003, confidenceRating: 0.93, healthy: true },
  { workerId: 'w-gpt5', model: 'gpt-5.1', provider: 'openai', avgLatencyMs: 2800, costPerKToken: 0.010, confidenceRating: 0.95, healthy: true },
  { workerId: 'w-o3', model: 'o3', provider: 'openai', avgLatencyMs: 5500, costPerKToken: 0.060, confidenceRating: 0.98, healthy: true },
  { workerId: 'w-o4mini', model: 'o4-mini', provider: 'openai', avgLatencyMs: 900, costPerKToken: 0.0011, confidenceRating: 0.88, healthy: true },
  { workerId: 'w-deepseek', model: 'deepseek-v4-pro', provider: 'deepseek', avgLatencyMs: 3100, costPerKToken: 0.00028, confidenceRating: 0.91, healthy: true },
  { workerId: 'w-llama', model: 'llama-4-maverick', provider: 'meta', avgLatencyMs: 1200, costPerKToken: 0.0003, confidenceRating: 0.85, healthy: true },
];

function scoreLatency(c: CortexCandidate, constraints: SlaConstraints): number {
  const cap = constraints.maxLatencyMs ?? 10000;
  if (c.avgLatencyMs > cap) return 0;
  return 1 - c.avgLatencyMs / cap;
}

function scoreCost(c: CortexCandidate, constraints: SlaConstraints): number {
  const cap = constraints.maxCostUsd ? constraints.maxCostUsd * 1000 : 0.1;
  if (c.costPerKToken > cap) return 0;
  return 1 - c.costPerKToken / cap;
}

function scoreConfidence(c: CortexCandidate, constraints: SlaConstraints): number {
  const min = constraints.minConfidence ?? 0;
  if (c.confidenceRating < min) return 0;
  return c.confidenceRating;
}

function compositeScore(
  c: CortexCandidate,
  mode: ScoringMode,
  constraints: SlaConstraints,
): number {
  const l = scoreLatency(c, constraints);
  const co = scoreCost(c, constraints);
  const cf = scoreConfidence(c, constraints);
  switch (mode) {
    case 'latency': return l * 0.7 + co * 0.15 + cf * 0.15;
    case 'cost': return co * 0.7 + l * 0.15 + cf * 0.15;
    case 'confidence': return cf * 0.7 + l * 0.15 + co * 0.15;
    case 'sla': return l * 0.4 + co * 0.3 + cf * 0.3;
    default: return l * 0.33 + co * 0.33 + cf * 0.34;
  }
}

function isSensitivityAllowed(c: CortexCandidate, tier?: string): boolean {
  if (!tier || tier === 'public' || tier === 'internal') return true;
  if (tier === 'confidential') return c.provider === 'anthropic' || c.provider === 'openai';
  if (tier === 'restricted' || tier === 'top-secret') return c.provider === 'anthropic';
  return true;
}

function filterCandidates(
  candidates: CortexCandidate[],
  workers: CognitiveWorker[],
  constraints: SlaConstraints,
): CortexCandidate[] {
  const healthyWorkerIds = new Set(
    workers.filter((w) => w.status === 'active' && !w.isDraining).map((w) => w.workerId),
  );

  return candidates.filter((c) => {
    if (!c.healthy) return false;
    if (workers.length > 0 && !healthyWorkerIds.has(c.workerId)) return false;
    if (!isSensitivityAllowed(c, constraints.sensitivityTier)) return false;
    if (constraints.maxLatencyMs !== undefined && c.avgLatencyMs > constraints.maxLatencyMs) return false;
    if (constraints.maxCostUsd !== undefined && c.costPerKToken > constraints.maxCostUsd * 1000) return false;
    if (constraints.minConfidence !== undefined && c.confidenceRating < constraints.minConfidence) return false;
    return true;
  });
}

export function decideCortexRoute(opts: {
  requestId: string;
  tenantId: string;
  scoringMode?: ScoringMode;
  constraints?: SlaConstraints;
  workers?: CognitiveWorker[];
  domain?: string;
  extraCandidates?: CortexCandidate[];
}): RouteDecision {
  const {
    requestId,
    tenantId,
    scoringMode = 'balanced',
    constraints = {},
    workers = [],
    domain,
  } = opts;

  const candidates = [...BUILT_IN_CANDIDATES, ...(opts.extraCandidates ?? [])];
  const eligible = filterCandidates(candidates, workers, constraints);
  const scored = eligible
    .map((c) => ({ c, score: compositeScore(c, scoringMode, constraints) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const now = new Date().toISOString();
  const routeDecisionId = newId('rd');

  if (scored.length === 0) {
    const fallback = BUILT_IN_CANDIDATES.find((c) => c.provider === 'anthropic' && c.healthy) ??
      BUILT_IN_CANDIDATES[0]!;
    return {
      routeDecisionId,
      requestId,
      tenantId,
      workerId: fallback.workerId,
      selectedModel: fallback.model,
      selectedProvider: fallback.provider,
      scoringMode,
      compositeScore: 0,
      isFallback: true,
      fallbackReason: 'no_eligible_candidates',
      candidatesEvaluated: candidates.length,
      estimatedLatencyMs: fallback.avgLatencyMs,
      estimatedCostUsd: fallback.costPerKToken / 1000,
      domain,
      sensitivityTier: constraints.sensitivityTier ?? 'internal',
      decidedAt: now,
    };
  }

  const best = scored[0]!;
  let isFallback = false;
  let fallbackReason: string | undefined;

  if (scored.length > 0 && scored[0]!.score < 0.15) {
    isFallback = true;
    fallbackReason = 'best_score_below_threshold';
  }

  return {
    routeDecisionId,
    requestId,
    tenantId,
    workerId: best.c.workerId,
    selectedModel: best.c.model,
    selectedProvider: best.c.provider,
    scoringMode,
    latencyScore: scoreLatency(best.c, constraints),
    costScore: scoreCost(best.c, constraints),
    confidenceScore: scoreConfidence(best.c, constraints),
    compositeScore: best.score,
    isFallback,
    fallbackReason,
    candidatesEvaluated: candidates.length,
    estimatedLatencyMs: best.c.avgLatencyMs,
    estimatedCostUsd: best.c.costPerKToken / 1000,
    domain,
    sensitivityTier: constraints.sensitivityTier ?? 'internal',
    decidedAt: now,
  };
}

export { BUILT_IN_CANDIDATES };
