import { evalRegistry } from './eval-selector.js';
import { createLogger } from './logger.js';

const logger = createLogger('ai-control-plane:router');

export type ProviderType = 'openai' | 'anthropic' | 'local' | 'self-hosted' | 'nim' | 'substrate';

export type RouteClass =
  | 'reasoning'
  | 'triage'
  | 'extraction'
  | 'planning'
  | 'embedding'
  | 'classification'
  | 'summarization'
  | 'generation'
  | 'code';

export interface ModelEndpoint {
  provider: ProviderType;
  model: string;
  baseUrl?: string;
  apiKeyEnvVar?: string;
  priority: number;
  maxTokens?: number;
  costPerInputToken?: number;
  costPerOutputToken?: number;
  tags?: string[];
  evalScore?: number;
  enabled: boolean;
}

export interface RouteRequest {
  routeClass: RouteClass;
  promptTokenEstimate?: number;
  preferredProvider?: ProviderType;
  orgId?: string;
  agentTier?: AgentTierName;
  maxBudgetUsd?: number;
  evalThreshold?: number;
}

export interface RouteResult {
  endpoint: ModelEndpoint;
  fallbackChain: ModelEndpoint[];
  estimatedCostUsd?: number;
  selectedBy: 'eval' | 'cost' | 'priority' | 'preferred';
}

export type AgentTierName = 'assistant' | 'analyst' | 'operator' | 'autonomous';

const DEFAULT_ENDPOINTS: ModelEndpoint[] = [
  {
    provider: 'openai',
    model: 'gpt-4o',
    priority: 10,
    maxTokens: 128000,
    costPerInputToken: 0.0000025,
    costPerOutputToken: 0.00001,
    tags: ['reasoning', 'planning', 'generation'],
    evalScore: 0.92,
    enabled: true,
  },
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    priority: 20,
    maxTokens: 128000,
    costPerInputToken: 0.00000015,
    costPerOutputToken: 0.0000006,
    tags: ['triage', 'classification', 'extraction', 'summarization'],
    evalScore: 0.84,
    enabled: true,
  },
  {
    provider: 'anthropic',
    model: 'claude-opus-4-5',
    priority: 11,
    maxTokens: 200000,
    costPerInputToken: 0.000015,
    costPerOutputToken: 0.000075,
    tags: ['reasoning', 'planning', 'generation'],
    evalScore: 0.93,
    enabled: true,
  },
  {
    provider: 'anthropic',
    model: 'claude-haiku-3-5',
    priority: 21,
    maxTokens: 200000,
    costPerInputToken: 0.00000025,
    costPerOutputToken: 0.00000125,
    tags: ['triage', 'summarization', 'extraction'],
    evalScore: 0.82,
    enabled: true,
  },
  {
    provider: 'local',
    model: 'llama-3.3-70b-instruct',
    baseUrl: 'http://localhost:11434/v1',
    apiKeyEnvVar: 'LOCAL_MODEL_API_KEY',
    priority: 30,
    maxTokens: 32000,
    costPerInputToken: 0,
    costPerOutputToken: 0,
    tags: ['reasoning', 'generation', 'triage'],
    evalScore: 0.78,
    enabled: true,
  },
  {
    provider: 'substrate',
    model: 'llama-3.3-70b-instruct',
    baseUrl: 'http://localhost:8070/v1',
    priority: 40,
    maxTokens: 131072,
    costPerInputToken: 0,
    costPerOutputToken: 0,
    tags: ['reasoning', 'generation', 'planning'],
    evalScore: 0.78,
    enabled: true,
  },
  {
    provider: 'substrate',
    model: 'qwen3-next-80b',
    baseUrl: 'http://localhost:8070/v1',
    priority: 41,
    maxTokens: 131072,
    costPerInputToken: 0,
    costPerOutputToken: 0,
    tags: ['reasoning', 'generation', 'planning'],
    evalScore: 0.80,
    enabled: true,
  },
  {
    provider: 'substrate',
    model: 'gemma3-12b',
    baseUrl: 'http://localhost:8070/v1',
    priority: 42,
    maxTokens: 32768,
    costPerInputToken: 0,
    costPerOutputToken: 0,
    tags: ['reasoning', 'generation', 'summarization'],
    evalScore: 0.75,
    enabled: true,
  },
  {
    provider: 'substrate',
    model: 'gpt-oss-20b',
    baseUrl: 'http://localhost:8070/v1',
    priority: 43,
    maxTokens: 65536,
    costPerInputToken: 0,
    costPerOutputToken: 0,
    tags: ['reasoning', 'generation', 'triage'],
    evalScore: 0.74,
    enabled: true,
  },
  {
    provider: 'substrate',
    model: 'voxtral-small-24b',
    baseUrl: 'http://localhost:8070/v1',
    priority: 44,
    maxTokens: 32768,
    costPerInputToken: 0,
    costPerOutputToken: 0,
    tags: ['generation', 'summarization'],
    evalScore: 0.73,
    enabled: true,
  },
  {
    provider: 'substrate',
    model: 'llama-3.1-8b-instruct',
    baseUrl: 'http://localhost:8070/v1',
    priority: 45,
    maxTokens: 131072,
    costPerInputToken: 0,
    costPerOutputToken: 0,
    tags: ['triage', 'classification', 'extraction', 'summarization'],
    evalScore: 0.70,
    enabled: true,
  },
];

const ROUTE_CLASS_TAGS: Record<RouteClass, string[]> = {
  reasoning: ['reasoning'],
  triage: ['triage', 'classification'],
  extraction: ['extraction'],
  planning: ['planning', 'reasoning'],
  embedding: ['embedding'],
  classification: ['classification', 'triage'],
  summarization: ['summarization'],
  generation: ['generation', 'reasoning'],
  code: ['code', 'generation', 'reasoning'],
};

class ModelRouter {
  private endpoints: ModelEndpoint[];
  private circuitBreakers: Map<string, { failures: number; openedAt?: number }> = new Map();
  private readonly CIRCUIT_OPEN_MS = 30_000;
  private readonly FAILURE_THRESHOLD = 5;

  constructor(endpoints: ModelEndpoint[] = DEFAULT_ENDPOINTS) {
    this.endpoints = endpoints;
  }

  addEndpoint(endpoint: ModelEndpoint): void {
    this.endpoints.push(endpoint);
    logger.info({ provider: endpoint.provider, model: endpoint.model }, 'Endpoint registered');
  }

  removeEndpoint(provider: ProviderType, model: string): void {
    this.endpoints = this.endpoints.filter((e) => !(e.provider === provider && e.model === model));
  }

  listEndpoints(): ModelEndpoint[] {
    return [...this.endpoints];
  }

  route(req: RouteRequest): RouteResult {
    const tags = ROUTE_CLASS_TAGS[req.routeClass] ?? [];
    const candidates = this.endpoints.filter((e) => {
      if (!e.enabled) return false;
      if (this.isCircuitOpen(e)) return false;
      if (e.tags && !e.tags.some((t) => tags.includes(t))) return false;
      return true;
    });

    if (candidates.length === 0) {
      const fallback = this.endpoints.find((e) => e.enabled);
      if (!fallback) throw new Error('No available model endpoints');
      return { endpoint: fallback, fallbackChain: [], selectedBy: 'priority' };
    }

    let selected: ModelEndpoint;
    let selectedBy: RouteResult['selectedBy'] = 'priority';

    if (req.preferredProvider) {
      const preferred = candidates.find((e) => e.provider === req.preferredProvider);
      if (preferred) {
        selected = preferred;
        selectedBy = 'preferred';
      } else {
        selected = this.selectByEvalOrCost(candidates, req);
        selectedBy = req.evalThreshold ? 'eval' : 'cost';
      }
    } else {
      selected = this.selectByEvalOrCost(candidates, req);
      selectedBy = req.evalThreshold ? 'eval' : 'cost';
    }

    const fallbackChain = candidates
      .filter((e) => e !== selected)
      .sort((a, b) => a.priority - b.priority);

    const estimatedCostUsd =
      req.promptTokenEstimate && selected.costPerInputToken
        ? req.promptTokenEstimate * selected.costPerInputToken
        : undefined;

    logger.debug(
      {
        provider: selected.provider,
        model: selected.model,
        routeClass: req.routeClass,
        selectedBy,
      },
      'Route resolved',
    );

    return {
      endpoint: selected,
      fallbackChain,
      selectedBy,
      ...(estimatedCostUsd !== undefined ? { estimatedCostUsd } : {}),
    };
  }

  private liveEvalScore(endpoint: ModelEndpoint, routeClass: RouteClass): number {
    const live = evalRegistry.get(endpoint.provider, endpoint.model, routeClass);
    return live?.score ?? endpoint.evalScore ?? 0;
  }

  private selectByEvalOrCost(candidates: ModelEndpoint[], req: RouteRequest): ModelEndpoint {
    if (req.evalThreshold) {
      const evalCandidates = candidates.filter(
        (e) => this.liveEvalScore(e, req.routeClass) >= req.evalThreshold!,
      );
      if (evalCandidates.length > 0) {
        return evalCandidates.sort(
          (a, b) => this.liveEvalScore(b, req.routeClass) - this.liveEvalScore(a, req.routeClass),
        )[0]!;
      }
    }
    if (req.maxBudgetUsd && req.promptTokenEstimate) {
      const budgetCandidates = candidates.filter((e) => {
        const cost = (e.costPerInputToken ?? 0) * req.promptTokenEstimate!;
        return cost <= req.maxBudgetUsd!;
      });
      if (budgetCandidates.length > 0) {
        return budgetCandidates.sort((a, b) => a.priority - b.priority)[0]!;
      }
    }
    return candidates.sort((a, b) => a.priority - b.priority)[0]!;
  }

  recordSuccess(endpoint: ModelEndpoint): void {
    const key = `${endpoint.provider}:${endpoint.model}`;
    this.circuitBreakers.delete(key);
  }

  recordFailure(endpoint: ModelEndpoint): void {
    const key = `${endpoint.provider}:${endpoint.model}`;
    const state = this.circuitBreakers.get(key) ?? { failures: 0 };
    state.failures++;
    if (state.failures >= this.FAILURE_THRESHOLD) {
      state.openedAt = Date.now();
      logger.warn({ provider: endpoint.provider, model: endpoint.model }, 'Circuit breaker opened');
    }
    this.circuitBreakers.set(key, state);
  }

  private isCircuitOpen(endpoint: ModelEndpoint): boolean {
    const key = `${endpoint.provider}:${endpoint.model}`;
    const state = this.circuitBreakers.get(key);
    if (!state || state.failures < this.FAILURE_THRESHOLD) return false;
    if (state.openedAt && Date.now() - state.openedAt > this.CIRCUIT_OPEN_MS) {
      delete state.openedAt;
      state.failures = 0;
      return false;
    }
    return true;
  }

  getCircuitStatus(): Array<{ key: string; failures: number; open: boolean }> {
    return Array.from(this.circuitBreakers.entries()).map(([key, state]) => ({
      key,
      failures: state.failures,
      open: state.failures >= this.FAILURE_THRESHOLD && !!state.openedAt,
    }));
  }
}

export const modelRouter = new ModelRouter();

export function createRouter(endpoints?: ModelEndpoint[]): ModelRouter {
  return new ModelRouter(endpoints);
}

export { ModelRouter };
