export type RouteClass =
  | 'classification'
  | 'triage'
  | 'reasoning'
  | 'planning'
  | 'tool_calling'
  | 'vision_understanding'
  | 'background_batch'
  | 'extraction'
  | 'summarization';

export interface ModelSlot {
  model: string;
  role: 'primary' | 'secondary' | 'fallback' | 'vision' | 'embed' | 'rerank';
  provider: string;
}

export interface RouteResult {
  model: string;
  role: string;
  provider: string;
  maxTokens: number;
  temperature: number;
  structuredOutput: boolean;
}

const ENV = {
  primary: () => process.env.HF_PRIMARY_LLM || 'Qwen/Qwen3-8B',
  secondary: () => process.env.HF_SECONDARY_LLM || 'Qwen/Qwen3-8B',
  fallback: () => process.env.HF_FALLBACK_LLM || 'Qwen/Qwen3-0.6B',
  vision: () => process.env.HF_VISION_MODEL || 'Qwen/Qwen2.5-VL-7B-Instruct',
  embed: () => process.env.HF_EMBED_MODEL || 'BAAI/bge-m3',
  rerank: () => process.env.HF_RERANK_MODEL || 'BAAI/bge-reranker-v2-m3',
  provider: () => process.env.HF_PROVIDER || 'huggingface',
  useStructured: () => (process.env.HF_USE_STRUCTURED_OUTPUTS ?? 'true') === 'true',
};

const ROUTE_DEFAULTS: Record<
  RouteClass,
  { modelFn: () => string; maxTokens: number; temperature: number }
> = {
  classification: { modelFn: ENV.fallback, maxTokens: 256, temperature: 0.1 },
  triage: { modelFn: ENV.secondary, maxTokens: 1024, temperature: 0.2 },
  reasoning: { modelFn: ENV.primary, maxTokens: 2048, temperature: 0.3 },
  planning: { modelFn: ENV.primary, maxTokens: 2048, temperature: 0.3 },
  tool_calling: { modelFn: ENV.secondary, maxTokens: 1024, temperature: 0.1 },
  vision_understanding: { modelFn: ENV.vision, maxTokens: 1024, temperature: 0.3 },
  background_batch: { modelFn: ENV.fallback, maxTokens: 512, temperature: 0.1 },
  extraction: { modelFn: ENV.secondary, maxTokens: 1024, temperature: 0.1 },
  summarization: { modelFn: ENV.secondary, maxTokens: 1024, temperature: 0.3 },
};

export function routeModel(
  routeClass: RouteClass,
  overrides?: { model?: string; maxTokens?: number; temperature?: number },
): RouteResult {
  const defaults = ROUTE_DEFAULTS[routeClass];
  return {
    model: overrides?.model || defaults.modelFn(),
    role: routeClass,
    provider: ENV.provider(),
    maxTokens: overrides?.maxTokens || defaults.maxTokens,
    temperature: overrides?.temperature ?? defaults.temperature,
    structuredOutput: ENV.useStructured(),
  };
}

export function getModelSlots(): ModelSlot[] {
  return [
    { model: ENV.primary(), role: 'primary', provider: ENV.provider() },
    { model: ENV.secondary(), role: 'secondary', provider: ENV.provider() },
    { model: ENV.fallback(), role: 'fallback', provider: ENV.provider() },
    { model: ENV.vision(), role: 'vision', provider: ENV.provider() },
    { model: ENV.embed(), role: 'embed', provider: ENV.provider() },
    { model: ENV.rerank(), role: 'rerank', provider: ENV.provider() },
  ];
}

export function getRouteConfig() {
  return {
    routes: Object.fromEntries(
      (Object.keys(ROUTE_DEFAULTS) as RouteClass[]).map((rc) => [rc, routeModel(rc)]),
    ),
    models: getModelSlots(),
    config: {
      useStructuredOutputs: ENV.useStructured(),
      useFunctionCalling: (process.env.HF_USE_FUNCTION_CALLING ?? 'true') === 'true',
      enableStreaming: (process.env.HF_ENABLE_STREAMING ?? 'true') === 'true',
      requireApprovalForHighRisk:
        (process.env.AI_REQUIRE_APPROVAL_FOR_HIGH_RISK ?? 'true') === 'true',
      executionMode: process.env.AI_EXECUTION_MODE || 'propose_only',
      retrievalTopK: parseInt(process.env.AI_RETRIEVAL_TOP_K || '12', 10),
      rerankTopK: parseInt(process.env.AI_RERANK_TOP_K || '5', 10),
    },
  };
}
