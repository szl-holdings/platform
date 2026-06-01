/**
 * Intelligent Cost-Performance Router
 *
 * Analyzes query complexity in real time and selects the optimal model based on
 * a cost-performance Pareto curve. Respects per-tenant cost budgets and provider
 * preferences. Logs every routing decision with rationale for observability.
 */

import {
  type ModelCapability,
  type ModelSpec,
  type ProviderName,
  type RoutingLane,
  estimateCostUsd,
  FAILOVER_CHAINS,
  getFailoverChain,
  MODEL_REGISTRY,
} from './model-registry.js';
export interface QueryComplexityScore {
  tokenEstimate: number;
  domainCount: number;
  stakesLevel: 'low' | 'medium' | 'high' | 'critical';
  requiredCapabilities: ModelCapability[];
  isLongContext: boolean;
  requiresVision: boolean;
  lane: RoutingLane;
  complexityScore: number;
}

export interface RoutingDecision {
  decisionId: string;
  query: string;
  complexity: QueryComplexityScore;
  selectedModel: string;
  selectedProvider: ProviderName;
  fallbackChain: string[];
  rationale: string;
  estimatedCostUsd: number;
  estimatedLatencyMs: number;
  tenantId?: number | string;
  timestamp: string;
}

export interface CostPerformanceRouterOptions {
  tenantId?: number | string;
  maxCostPerCallUsd?: number;
  allowedProviders?: ProviderName[];
  overrideModel?: string;
  preferenceHints?: {
    prioritizeCost?: boolean;
    prioritizeSpeed?: boolean;
    prioritizeQuality?: boolean;
  };
}

const STAKES_KEYWORDS: Record<QueryComplexityScore['stakesLevel'], string[]> = {
  critical: [
    'emergency',
    'breach',
    'sanctions violation',
    'litigation',
    'regulatory violation',
    'critical',
    'immediate action',
  ],
  high: ['risk', 'compliance', 'legal', 'financial', 'security', 'urgent', 'alert', 'warning'],
  medium: ['analysis', 'review', 'assess', 'evaluate', 'monitor'],
  low: ['summarize', 'list', 'describe', 'what is', 'overview'],
};

const VISION_KEYWORDS = ['image', 'photo', 'screenshot', 'diagram', 'chart', 'visual', 'picture'];

const DOMAIN_INDICATORS = [
  'maritime',
  'vessel',
  'ship',
  'security',
  'threat',
  'legal',
  'compliance',
  'financial',
  'investment',
  'real estate',
  'property',
  'analytics',
  'research',
  'creative',
  'client',
  'infrastructure',
];

export function analyzeQueryComplexity(
  query: string,
  contextTokens: number = 0,
  activeDomains: string[] = [],
): QueryComplexityScore {
  const lower = query.toLowerCase();
  const wordCount = query.split(/\s+/).length;
  const tokenEstimate = Math.ceil(wordCount * 1.3) + contextTokens;

  let domainCount = activeDomains.length;
  for (const indicator of DOMAIN_INDICATORS) {
    if (lower.includes(indicator) && !activeDomains.some((d) => d.includes(indicator))) {
      domainCount++;
    }
  }

  let stakesLevel: QueryComplexityScore['stakesLevel'] = 'low';
  for (const level of ['critical', 'high', 'medium'] as const) {
    if (STAKES_KEYWORDS[level].some((kw) => lower.includes(kw))) {
      stakesLevel = level;
      break;
    }
  }

  const requiresVision = VISION_KEYWORDS.some((kw) => lower.includes(kw));
  const isLongContext = tokenEstimate > 20_000;

  const requiredCapabilities: ModelCapability[] = [];
  if (lower.includes('code') || lower.includes('implement') || lower.includes('function')) {
    requiredCapabilities.push('code');
  }
  if (requiresVision) requiredCapabilities.push('vision');
  if (isLongContext) requiredCapabilities.push('long_context');
  if (
    lower.includes('reason') ||
    lower.includes('analyze') ||
    lower.includes('infer') ||
    stakesLevel === 'critical'
  ) {
    requiredCapabilities.push('reasoning');
  }
  if (
    lower.includes('create') ||
    lower.includes('write') ||
    lower.includes('draft') ||
    lower.includes('generate')
  ) {
    requiredCapabilities.push('creative');
  }

  const stakesWeight = { low: 0, medium: 0.25, high: 0.5, critical: 1 }[stakesLevel];
  const complexityScore = Math.min(
    1,
    (tokenEstimate / 50_000) * 0.3 +
      (domainCount / 10) * 0.25 +
      stakesWeight * 0.3 +
      (requiredCapabilities.length / 5) * 0.15,
  );

  let lane: RoutingLane = 'general';
  if (requiresVision) {
    lane = 'vision';
  } else if (isLongContext) {
    lane = 'long_context';
  } else if (requiredCapabilities.includes('code')) {
    lane = 'code';
  } else if (requiredCapabilities.includes('creative')) {
    lane = 'creative';
  } else if (complexityScore > 0.6 || stakesLevel === 'critical' || stakesLevel === 'high') {
    lane = 'heavy_reasoning';
  } else if (complexityScore < 0.2 && stakesLevel === 'low') {
    lane = 'fast_extraction';
  }

  return {
    tokenEstimate,
    domainCount,
    stakesLevel,
    requiredCapabilities,
    isLongContext,
    requiresVision,
    lane,
    complexityScore,
  };
}

function selectOptimalModel(
  complexity: QueryComplexityScore,
  options: CostPerformanceRouterOptions,
): { model: ModelSpec; rationale: string } {
  if (options.overrideModel && MODEL_REGISTRY[options.overrideModel]) {
    return {
      model: MODEL_REGISTRY[options.overrideModel]!,
      rationale: `Tenant override: using ${options.overrideModel}`,
    };
  }

  const chain = getFailoverChain(complexity.lane);
  const candidates = [chain.primary, ...chain.fallbacks]
    .map((id) => MODEL_REGISTRY[id])
    .filter((s): s is ModelSpec => {
      if (!s) return false;
      if (options.allowedProviders?.length && !options.allowedProviders.includes(s.provider)) {
        return false;
      }
      if (complexity.requiresVision && !s.supportsVision) return false;
      if (
        complexity.requiredCapabilities.includes('reasoning') &&
        !s.capabilities.includes('reasoning')
      ) {
        return false;
      }
      return true;
    });

  if (candidates.length === 0) {
    const fallback = MODEL_REGISTRY['gpt-4o-mini']!;
    return { model: fallback, rationale: 'No eligible candidates — falling back to gpt-4o-mini' };
  }

  const prioritizeCost = options.preferenceHints?.prioritizeCost ?? false;
  const prioritizeSpeed = options.preferenceHints?.prioritizeSpeed ?? false;

  let selected = candidates[0]!;
  let rationale = `Lane: ${complexity.lane}, complexity: ${(complexity.complexityScore * 100).toFixed(0)}%`;

  if (options.maxCostPerCallUsd !== undefined) {
    const affordable = candidates.filter(
      (c) =>
        estimateCostUsd(
          c.id,
          complexity.tokenEstimate,
          Math.min(complexity.tokenEstimate * 0.5, c.maxOutputTokens),
        ) <= options.maxCostPerCallUsd!,
    );
    if (affordable.length > 0) {
      selected = affordable[0]!;
      rationale += `, cost-capped at $${options.maxCostPerCallUsd}`;
    }
  } else if (prioritizeSpeed) {
    selected = candidates.sort((a, b) => a.avgLatencyMs - b.avgLatencyMs)[0]!;
    rationale += ', optimized for speed';
  } else if (prioritizeCost) {
    selected = candidates.sort((a, b) => a.inputCostPer1kTokens - b.inputCostPer1kTokens)[0]!;
    rationale += ', optimized for cost';
  } else {
    rationale += `, primary for lane ${complexity.lane}`;
  }

  return { model: selected, rationale };
}

const _decisionLog: RoutingDecision[] = [];
const MAX_DECISION_LOG = 1_000;

export function routeQuery(
  query: string,
  options: CostPerformanceRouterOptions = {},
  contextTokens = 0,
  activeDomains: string[] = [],
): RoutingDecision {
  const complexity = analyzeQueryComplexity(query, contextTokens, activeDomains);
  const { model, rationale } = selectOptimalModel(complexity, options);
  const chain = getFailoverChain(complexity.lane);
  const fallbackChain = [chain.primary, ...chain.fallbacks].filter((id) => id !== model.id);

  const estimatedOutputTokens = Math.min(model.maxOutputTokens, complexity.tokenEstimate * 0.5);
  const estimatedCostUsd = estimateCostUsd(
    model.id,
    complexity.tokenEstimate,
    estimatedOutputTokens,
  );

  const decision: RoutingDecision = {
    decisionId: `route_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    query: query.slice(0, 200),
    complexity,
    selectedModel: model.id,
    selectedProvider: model.provider,
    fallbackChain,
    rationale,
    estimatedCostUsd,
    estimatedLatencyMs: model.avgLatencyMs,
    ...(options.tenantId !== undefined ? { tenantId: options.tenantId } : {}),
    timestamp: new Date().toISOString(),
  };

  _decisionLog.push(decision);
  if (_decisionLog.length > MAX_DECISION_LOG) {
    _decisionLog.splice(0, _decisionLog.length - MAX_DECISION_LOG);
  }

  return decision;
}

export function getRoutingDecisionLog(limit = 50): RoutingDecision[] {
  return _decisionLog.slice(-limit).reverse();
}

export function getRoutingStats(): {
  totalDecisions: number;
  modelDistribution: Record<string, number>;
  laneDistribution: Record<string, number>;
  avgComplexityScore: number;
  avgEstimatedCostUsd: number;
} {
  const total = _decisionLog.length;
  const modelDist: Record<string, number> = {};
  const laneDist: Record<string, number> = {};
  let totalComplexity = 0;
  let totalCost = 0;

  for (const d of _decisionLog) {
    modelDist[d.selectedModel] = (modelDist[d.selectedModel] ?? 0) + 1;
    laneDist[d.complexity.lane] = (laneDist[d.complexity.lane] ?? 0) + 1;
    totalComplexity += d.complexity.complexityScore;
    totalCost += d.estimatedCostUsd;
  }

  return {
    totalDecisions: total,
    modelDistribution: modelDist,
    laneDistribution: laneDist,
    avgComplexityScore: total > 0 ? totalComplexity / total : 0,
    avgEstimatedCostUsd: total > 0 ? totalCost / total : 0,
  };
}

export function buildFailoverSequence(
  lane: RoutingLane,
  allowedProviders?: ProviderName[],
): string[] {
  const chain =
    FAILOVER_CHAINS.find((c) => c.lane === lane) ??
    FAILOVER_CHAINS.find((c) => c.lane === 'general')!;
  const all = [chain.primary, ...chain.fallbacks];
  if (!allowedProviders?.length) return all;
  return all.filter((id) => {
    const spec = MODEL_REGISTRY[id];
    return spec && allowedProviders.includes(spec.provider);
  });
}
