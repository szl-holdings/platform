import { MODEL_REGISTRY, type ModelSpec, FAILOVER_CHAINS, type RoutingLane } from './model-registry.js';
import { resolveModelForAgent } from './fine-tuning/model-registry-extension.js';

export interface DomainModelMapping {
  domain: string;
  preferredLane: RoutingLane;
  fineTunedAgentId?: string;
  fallbackModels: string[];
  costCeiling?: number;
}

const DOMAIN_MODEL_MAPPINGS: DomainModelMapping[] = [
  {
    domain: 'terra',
    preferredLane: 'general',
    fineTunedAgentId: 'terra-analyst',
    fallbackModels: ['gpt-5.2', 'claude-sonnet-4-6', 'gpt-4o'],
  },
  {
    domain: 'vessels',
    preferredLane: 'general',
    fineTunedAgentId: 'vessels-analyst',
    fallbackModels: ['gpt-5.2', 'claude-sonnet-4-6', 'deepseek-v3'],
  },
  {
    domain: 'counsel',
    preferredLane: 'heavy_reasoning',
    fineTunedAgentId: 'counsel-analyst',
    fallbackModels: ['claude-opus-4-7', 'gpt-5.5', 'deepseek-r1'],
  },
  {
    domain: 'sentra',
    preferredLane: 'fast_extraction',
    fineTunedAgentId: 'sentra-analyst',
    fallbackModels: ['deepseek-v3', 'gpt-4o-mini', 'gpt-4o'],
  },
  {
    domain: 'aegis',
    preferredLane: 'heavy_reasoning',
    fineTunedAgentId: 'aegis-analyst',
    fallbackModels: ['claude-opus-4-7', 'deepseek-r1', 'gpt-5.5'],
  },
  {
    domain: 'holdings',
    preferredLane: 'general',
    fineTunedAgentId: 'holdings-analyst',
    fallbackModels: ['gpt-5.2', 'claude-sonnet-4-6', 'gpt-4o'],
  },
];

export interface FineTunedRouteResult {
  model: string;
  provider: string;
  isFineTuned: boolean;
  isCanary: boolean;
  domain: string;
  lane: RoutingLane;
  fallbackChain: string[];
  resolvedVia: 'fine-tuned' | 'domain-mapping' | 'lane-default' | 'fallback';
}

export async function routeForDomain(
  domain: string,
  options?: {
    agentId?: string;
    preferFineTuned?: boolean;
    lane?: RoutingLane;
    overrideMappings?: Array<{
      domain: string;
      preferredLane: string;
      fallbackModels: string[];
      fineTunedAgentId?: string;
      costCeiling?: number;
    }>;
  },
): Promise<FineTunedRouteResult> {
  const overrideMapping = options?.overrideMappings?.find((m) => m.domain === domain);
  const mapping = overrideMapping ?? DOMAIN_MODEL_MAPPINGS.find((m) => m.domain === domain);
  const lane: RoutingLane = options?.lane ?? (mapping?.preferredLane as RoutingLane) ?? 'general';
  const agentId = options?.agentId ?? mapping?.fineTunedAgentId;
  const preferFineTuned = options?.preferFineTuned ?? true;

  const chain = FAILOVER_CHAINS.find((c) => c.lane === lane) ??
    FAILOVER_CHAINS.find((c) => c.lane === 'general')!;

  if (agentId && preferFineTuned) {
    try {
      const resolution = await resolveModelForAgent(agentId, chain.primary, {
        preferFineTuned: true,
        minLifecycle: 'canary',
      });

      if (resolution.isFineTuned) {
        return {
          model: resolution.model,
          provider: resolution.provider,
          isFineTuned: true,
          isCanary: resolution.isCanary,
          domain,
          lane,
          fallbackChain: [chain.primary, ...chain.fallbacks],
          resolvedVia: 'fine-tuned',
        };
      }
    } catch {
      // Fine-tuned model unavailable, continue to fallback
    }
  }

  if (mapping) {
    const primaryModel = mapping.fallbackModels[0] ?? chain.primary;
    const spec = MODEL_REGISTRY[primaryModel];

    return {
      model: primaryModel,
      provider: spec?.provider ?? 'openai',
      isFineTuned: false,
      isCanary: false,
      domain,
      lane,
      fallbackChain: mapping.fallbackModels,
      resolvedVia: 'domain-mapping',
    };
  }

  const spec = MODEL_REGISTRY[chain.primary];
  return {
    model: chain.primary,
    provider: spec?.provider ?? 'openai',
    isFineTuned: false,
    isCanary: false,
    domain,
    lane,
    fallbackChain: chain.fallbacks,
    resolvedVia: 'lane-default',
  };
}

export async function routeWithFallback(
  domain: string,
  callFn: (model: string, provider: string) => Promise<unknown>,
  options?: { agentId?: string; lane?: RoutingLane },
): Promise<{ result: unknown; usedModel: string; usedProvider: string; attemptCount: number }> {
  const route = await routeForDomain(domain, options);
  const modelsToTry = [route.model, ...route.fallbackChain.filter((m) => m !== route.model)];

  let lastError: Error | null = null;
  let attemptCount = 0;

  for (const model of modelsToTry) {
    attemptCount++;
    const spec = MODEL_REGISTRY[model];
    const provider = spec?.provider ?? route.provider;

    try {
      const result = await callFn(model, provider);
      return { result, usedModel: model, usedProvider: provider, attemptCount };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error(`All models failed for domain ${domain}`);
}

export function getDomainMappings(): DomainModelMapping[] {
  return [...DOMAIN_MODEL_MAPPINGS];
}

export function getAvailableDomainsWithFineTuning(): string[] {
  return DOMAIN_MODEL_MAPPINGS.filter((m) => m.fineTunedAgentId).map((m) => m.domain);
}

export function registerDomainMapping(mapping: DomainModelMapping): void {
  const existingIdx = DOMAIN_MODEL_MAPPINGS.findIndex((m) => m.domain === mapping.domain);
  if (existingIdx >= 0) {
    DOMAIN_MODEL_MAPPINGS[existingIdx] = mapping;
  } else {
    DOMAIN_MODEL_MAPPINGS.push(mapping);
  }
}
