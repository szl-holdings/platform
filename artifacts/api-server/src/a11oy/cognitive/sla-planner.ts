import type { SlaPlan, SlaConstraints, SlaRoute, ScoringMode } from './types.js';

export interface SlaInput {
  targetLatencyMs?: number;
  maxCostUsd?: number;
  minConfidenceScore?: number;
  sensitivityTier?: string;
  requireApproval?: boolean;
  currentLoadFactor?: number;
  domain?: string;
}

const PROVIDER_SENSITIVITY: Record<string, string[]> = {
  anthropic: ['public', 'internal', 'confidential', 'restricted', 'top-secret'],
  openai: ['public', 'internal', 'confidential'],
  deepseek: ['public', 'internal'],
  meta: ['public', 'internal'],
  google: ['public', 'internal', 'confidential'],
  mock: ['public', 'internal'],
};

function canProviderHandleTier(provider: string, tier: string): boolean {
  const tiers = PROVIDER_SENSITIVITY[provider] ?? ['public'];
  return tiers.includes(tier);
}

function selectScoringMode(input: SlaInput): ScoringMode {
  if (input.targetLatencyMs !== undefined && input.targetLatencyMs < 1500) return 'latency';
  if (input.maxCostUsd !== undefined && input.maxCostUsd < 0.001) return 'cost';
  if (input.minConfidenceScore !== undefined && input.minConfidenceScore > 0.95) return 'confidence';
  return 'balanced';
}

const ROUTE_TEMPLATES: Array<{ model: string; provider: string; latencyMs: number; costUsd: number }> = [
  { model: 'o4-mini', provider: 'openai', latencyMs: 900, costUsd: 0.0000011 },
  { model: 'claude-sonnet-4', provider: 'anthropic', latencyMs: 2100, costUsd: 0.000003 },
  { model: 'llama-4-maverick', provider: 'meta', latencyMs: 1200, costUsd: 0.0000003 },
  { model: 'deepseek-v4-pro', provider: 'deepseek', latencyMs: 3100, costUsd: 0.00000028 },
  { model: 'gpt-5.1', provider: 'openai', latencyMs: 2800, costUsd: 0.00001 },
  { model: 'claude-opus-4', provider: 'anthropic', latencyMs: 4200, costUsd: 0.000015 },
  { model: 'o3', provider: 'openai', latencyMs: 5500, costUsd: 0.00006 },
];

export function buildSlaPlan(input: SlaInput): SlaPlan {
  const {
    targetLatencyMs,
    maxCostUsd,
    minConfidenceScore,
    sensitivityTier = 'internal',
    requireApproval = false,
    currentLoadFactor = 0.3,
  } = input;

  const scoringMode = selectScoringMode(input);
  const warnings: string[] = [];

  const eligible = ROUTE_TEMPLATES.filter((r) => {
    if (!canProviderHandleTier(r.provider, sensitivityTier)) return false;
    if (targetLatencyMs !== undefined && r.latencyMs > targetLatencyMs * 1.2) return false;
    if (maxCostUsd !== undefined && r.costUsd > maxCostUsd * 1.2) return false;
    return true;
  });

  if (eligible.length === 0) {
    warnings.push('No route satisfies all hard constraints; falling back to anthropic/claude-sonnet-4');
    eligible.push(ROUTE_TEMPLATES.find((r) => r.model === 'claude-sonnet-4')!);
  }

  const sorted = [...eligible].sort((a, b) => {
    switch (scoringMode) {
      case 'latency': return a.latencyMs - b.latencyMs;
      case 'cost': return a.costUsd - b.costUsd;
      default: return (a.latencyMs / 5500 + a.costUsd / 0.00006) - (b.latencyMs / 5500 + b.costUsd / 0.00006);
    }
  });

  const primary = sorted[0]!;
  const fallbackCandidate = sorted.find((r) => r.model !== primary.model);

  const loadAdjustedLatency = Math.round(primary.latencyMs * (1 + currentLoadFactor * 0.5));

  if (targetLatencyMs !== undefined && loadAdjustedLatency > targetLatencyMs) {
    warnings.push(
      `Under current load (${Math.round(currentLoadFactor * 100)}%), estimated latency ${loadAdjustedLatency}ms may exceed target ${targetLatencyMs}ms`,
    );
  }

  if (minConfidenceScore !== undefined && minConfidenceScore > 0.96) {
    warnings.push('High confidence requirement; only frontier models satisfy this threshold');
  }

  const slaBreachRisk: SlaPlan['slaBreachRisk'] =
    warnings.length === 0 ? 'low' : warnings.length === 1 ? 'medium' : 'high';

  const primaryRoute: SlaRoute = {
    model: primary.model,
    provider: primary.provider,
    scoringMode,
    estimatedLatencyMs: loadAdjustedLatency,
    estimatedCostUsd: primary.costUsd,
  };

  const fallbackRoute: SlaRoute | undefined = fallbackCandidate
    ? {
        model: fallbackCandidate.model,
        provider: fallbackCandidate.provider,
        scoringMode: 'balanced',
        estimatedLatencyMs: Math.round(fallbackCandidate.latencyMs * (1 + currentLoadFactor * 0.3)),
        estimatedCostUsd: fallbackCandidate.costUsd,
      }
    : undefined;

  const explanation = [
    `Scoring mode: ${scoringMode}.`,
    `Primary route: ${primary.model} (${primary.provider}), est. ${loadAdjustedLatency}ms, $${(primary.costUsd * 1000).toFixed(4)}/1K tokens.`,
    fallbackRoute
      ? `Fallback route: ${fallbackRoute.model} (${fallbackRoute.provider}).`
      : 'No fallback required.',
    requireApproval ? 'Human approval gate is active.' : 'Auto-approved.',
    slaBreachRisk !== 'low' ? `SLA breach risk: ${slaBreachRisk}.` : 'SLA compliance expected.',
  ].join(' ');

  return {
    primaryRoute,
    fallbackRoute,
    approvalRequired: requireApproval,
    explanation,
    warnings,
    slaBreachRisk,
  };
}
