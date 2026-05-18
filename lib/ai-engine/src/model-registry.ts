// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
/**
 * Sovereign Model Registry
 *
 * Single source of truth for all supported AI models across every provider.
 * Includes per-model cost tables, token limits, capability tags, and failover chains.
 * Every lane has at least two fallback models so no query ever goes unanswered.
 */

export type ModelCapability =
  | 'reasoning'
  | 'speed'
  | 'vision'
  | 'code'
  | 'creative'
  | 'extraction'
  | 'summarization'
  | 'tool_calling'
  | 'structured_output'
  | 'long_context'
  | 'citations'
  | 'files_api'
  | 'batch_api';

export type ProviderName =
  | 'openai'
  | 'anthropic'
  | 'deepseek'
  | 'gemini'
  | 'huggingface';

export interface ModelSpec {
  id: string;
  displayName: string;
  provider: ProviderName;
  contextWindow: number;
  maxOutputTokens: number;
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
  avgLatencyMs: number;
  capabilities: ModelCapability[];
  tier: 'frontier' | 'standard' | 'fast' | 'local';
  supportsExtendedThinking: boolean;
  supportsStructuredOutput: boolean;
  supportsVision: boolean;
  /** True when the Anthropic prompt-caching API (cache_control breakpoints) is supported. */
  supportsPromptCaching?: boolean;
  /** True when this model supports the Anthropic Batch API (/v1/messages/batches). */
  supportsBatchApi?: boolean;
  /** True when this model can consume documents via the Anthropic Files API. */
  supportsFilesApi?: boolean;
  /** True when citations: { enabled: true } is supported on document blocks. */
  supportsCitations?: boolean;
  /**
   * True for first-party Claude family models (Opus/Sonnet/Haiku).
   * Used to group the Claude family under the "Mythos Tier" label in the Console.
   */
  mythosModel?: boolean;
}

export const MODEL_REGISTRY: Record<string, ModelSpec> = {
  // ── OpenAI ─────────────────────────────────────────────────────────────────
  'gpt-5.5': {
    id: 'gpt-5.5',
    displayName: 'GPT-5.5',
    provider: 'openai',
    contextWindow: 256_000,
    maxOutputTokens: 32_768,
    inputCostPer1kTokens: 0.015,
    outputCostPer1kTokens: 0.060,
    avgLatencyMs: 1_800,
    capabilities: ['reasoning', 'code', 'tool_calling', 'structured_output', 'long_context'],
    tier: 'frontier',
    supportsExtendedThinking: true,
    supportsStructuredOutput: true,
    supportsVision: true,
  },
  'gpt-5.2': {
    id: 'gpt-5.2',
    displayName: 'GPT-5.2',
    provider: 'openai',
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    inputCostPer1kTokens: 0.010,
    outputCostPer1kTokens: 0.040,
    avgLatencyMs: 1_400,
    capabilities: ['reasoning', 'code', 'tool_calling', 'structured_output'],
    tier: 'frontier',
    supportsExtendedThinking: false,
    supportsStructuredOutput: true,
    supportsVision: true,
  },
  'gpt-4o': {
    id: 'gpt-4o',
    displayName: 'GPT-4o',
    provider: 'openai',
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    inputCostPer1kTokens: 0.005,
    outputCostPer1kTokens: 0.015,
    avgLatencyMs: 900,
    capabilities: ['reasoning', 'vision', 'code', 'tool_calling', 'structured_output'],
    tier: 'standard',
    supportsExtendedThinking: false,
    supportsStructuredOutput: true,
    supportsVision: true,
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    displayName: 'GPT-4o mini',
    provider: 'openai',
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    inputCostPer1kTokens: 0.00015,
    outputCostPer1kTokens: 0.0006,
    avgLatencyMs: 350,
    capabilities: ['speed', 'extraction', 'summarization', 'structured_output'],
    tier: 'fast',
    supportsExtendedThinking: false,
    supportsStructuredOutput: true,
    supportsVision: true,
  },

  // ── Anthropic — Mythos Tier ────────────────────────────────────────────────
  'claude-opus-4-7': {
    id: 'claude-opus-4-7',
    displayName: 'Claude Opus 4.7',
    provider: 'anthropic',
    contextWindow: 200_000,
    maxOutputTokens: 32_768,
    inputCostPer1kTokens: 0.015,
    outputCostPer1kTokens: 0.075,
    avgLatencyMs: 2_200,
    capabilities: ['reasoning', 'code', 'creative', 'long_context', 'structured_output', 'tool_calling', 'citations', 'files_api', 'batch_api'],
    tier: 'frontier',
    supportsExtendedThinking: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsPromptCaching: true,
    supportsBatchApi: true,
    supportsFilesApi: true,
    supportsCitations: true,
    mythosModel: true,
  },
  'claude-sonnet-4-6': {
    id: 'claude-sonnet-4-6',
    displayName: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    contextWindow: 200_000,
    maxOutputTokens: 16_384,
    inputCostPer1kTokens: 0.003,
    outputCostPer1kTokens: 0.015,
    avgLatencyMs: 1_200,
    capabilities: ['reasoning', 'code', 'tool_calling', 'structured_output', 'citations', 'files_api', 'batch_api'],
    tier: 'standard',
    supportsExtendedThinking: true,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsPromptCaching: true,
    supportsBatchApi: true,
    supportsFilesApi: true,
    supportsCitations: true,
    mythosModel: true,
  },
  'claude-haiku-4-5': {
    id: 'claude-haiku-4-5',
    displayName: 'Claude Haiku 4.5',
    provider: 'anthropic',
    contextWindow: 200_000,
    maxOutputTokens: 8_192,
    inputCostPer1kTokens: 0.0008,
    outputCostPer1kTokens: 0.004,
    avgLatencyMs: 500,
    capabilities: ['speed', 'extraction', 'summarization', 'tool_calling', 'structured_output', 'citations', 'files_api', 'batch_api'],
    tier: 'fast',
    supportsExtendedThinking: false,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsPromptCaching: true,
    supportsBatchApi: true,
    supportsFilesApi: true,
    supportsCitations: true,
    mythosModel: true,
  },
  'claude-3-5-sonnet-20241022': {
    id: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet (Legacy)',
    provider: 'anthropic',
    contextWindow: 200_000,
    maxOutputTokens: 8_192,
    inputCostPer1kTokens: 0.003,
    outputCostPer1kTokens: 0.015,
    avgLatencyMs: 1_000,
    capabilities: ['reasoning', 'code', 'tool_calling', 'structured_output', 'citations', 'files_api', 'batch_api'],
    tier: 'standard',
    supportsExtendedThinking: false,
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsPromptCaching: true,
    supportsBatchApi: true,
    supportsFilesApi: true,
    supportsCitations: true,
    mythosModel: true,
  },

  // ── DeepSeek ───────────────────────────────────────────────────────────────
  'deepseek-r1': {
    id: 'deepseek-r1',
    displayName: 'DeepSeek R1',
    provider: 'deepseek',
    contextWindow: 128_000,
    maxOutputTokens: 32_768,
    inputCostPer1kTokens: 0.00055,
    outputCostPer1kTokens: 0.00219,
    avgLatencyMs: 1_600,
    capabilities: ['reasoning', 'code', 'structured_output'],
    tier: 'frontier',
    supportsExtendedThinking: true,
    supportsStructuredOutput: true,
    supportsVision: false,
  },
  'deepseek-v3': {
    id: 'deepseek-v3',
    displayName: 'DeepSeek V3',
    provider: 'deepseek',
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    inputCostPer1kTokens: 0.00027,
    outputCostPer1kTokens: 0.00110,
    avgLatencyMs: 700,
    capabilities: ['speed', 'extraction', 'code', 'structured_output'],
    tier: 'standard',
    supportsExtendedThinking: false,
    supportsStructuredOutput: true,
    supportsVision: false,
  },

  // ── Gemini ─────────────────────────────────────────────────────────────────
  'gemini-2.0-flash-exp': {
    id: 'gemini-2.0-flash-exp',
    displayName: 'Gemini 3.1 Pro',
    provider: 'gemini',
    contextWindow: 2_000_000,
    maxOutputTokens: 32_768,
    inputCostPer1kTokens: 0.00125,
    outputCostPer1kTokens: 0.005,
    avgLatencyMs: 1_100,
    capabilities: ['reasoning', 'creative', 'vision', 'long_context', 'structured_output'],
    tier: 'frontier',
    supportsExtendedThinking: false,
    supportsStructuredOutput: true,
    supportsVision: true,
  },
  'gemini-2.0-flash-lite': {
    id: 'gemini-2.0-flash-lite',
    displayName: 'Gemini 3 Flash',
    provider: 'gemini',
    contextWindow: 1_000_000,
    maxOutputTokens: 8_192,
    inputCostPer1kTokens: 0.000075,
    outputCostPer1kTokens: 0.0003,
    avgLatencyMs: 300,
    capabilities: ['speed', 'creative', 'summarization'],
    tier: 'fast',
    supportsExtendedThinking: false,
    supportsStructuredOutput: false,
    supportsVision: true,
  },

  // ── Qwen / HuggingFace ─────────────────────────────────────────────────────
  'Qwen/Qwen3-8B': {
    id: 'Qwen/Qwen3-8B',
    displayName: 'Qwen3 8B',
    provider: 'huggingface',
    contextWindow: 32_768,
    maxOutputTokens: 4_096,
    inputCostPer1kTokens: 0.0002,
    outputCostPer1kTokens: 0.0002,
    avgLatencyMs: 400,
    capabilities: ['speed', 'extraction', 'summarization'],
    tier: 'local',
    supportsExtendedThinking: false,
    supportsStructuredOutput: false,
    supportsVision: false,
  },
  'Qwen/Qwen3-0.6B': {
    id: 'Qwen/Qwen3-0.6B',
    displayName: 'Qwen3 0.6B',
    provider: 'huggingface',
    contextWindow: 8_192,
    maxOutputTokens: 1_024,
    inputCostPer1kTokens: 0.00005,
    outputCostPer1kTokens: 0.00005,
    avgLatencyMs: 150,
    capabilities: ['speed', 'extraction'],
    tier: 'local',
    supportsExtendedThinking: false,
    supportsStructuredOutput: false,
    supportsVision: false,
  },
};

export type RoutingLane =
  | 'heavy_reasoning'
  | 'fast_extraction'
  | 'creative'
  | 'code'
  | 'vision'
  | 'long_context'
  | 'batch'
  | 'general';

export interface FailoverChain {
  lane: RoutingLane;
  primary: string;
  fallbacks: string[];
}

export const FAILOVER_CHAINS: FailoverChain[] = [
  {
    lane: 'heavy_reasoning',
    primary: 'claude-opus-4-7',
    fallbacks: ['deepseek-r1', 'gpt-5.5', 'claude-sonnet-4-6'],
  },
  {
    lane: 'fast_extraction',
    primary: 'deepseek-v3',
    fallbacks: ['gpt-4o-mini', 'Qwen/Qwen3-8B', 'Qwen/Qwen3-0.6B'],
  },
  {
    lane: 'creative',
    primary: 'gemini-2.0-flash-exp',
    fallbacks: ['claude-opus-4-7', 'gpt-5.5', 'gemini-2.0-flash-lite'],
  },
  {
    lane: 'code',
    primary: 'deepseek-r1',
    fallbacks: ['claude-sonnet-4-6', 'gpt-5.5', 'gpt-4o'],
  },
  {
    lane: 'vision',
    primary: 'gemini-2.0-flash-exp',
    fallbacks: ['gpt-5.5', 'gpt-4o', 'claude-sonnet-4-6'],
  },
  {
    lane: 'long_context',
    primary: 'gemini-2.0-flash-exp',
    fallbacks: ['claude-opus-4-7', 'claude-sonnet-4-6'],
  },
  {
    lane: 'batch',
    primary: 'Qwen/Qwen3-8B',
    fallbacks: ['gpt-4o-mini', 'Qwen/Qwen3-0.6B'],
  },
  {
    lane: 'general',
    primary: 'gpt-5.2',
    fallbacks: ['claude-sonnet-4-6', 'gpt-4o', 'deepseek-v3'],
  },
];

export function getModelSpec(modelId: string): ModelSpec | undefined {
  return MODEL_REGISTRY[modelId];
}

export function getFailoverChain(lane: RoutingLane): FailoverChain {
  return (
    FAILOVER_CHAINS.find((c) => c.lane === lane) ??
    FAILOVER_CHAINS.find((c) => c.lane === 'general')!
  );
}

export function estimateCostUsd(modelId: string, inputTokens: number, outputTokens: number): number {
  const spec = MODEL_REGISTRY[modelId];
  if (!spec) return 0;
  return (
    (inputTokens / 1000) * spec.inputCostPer1kTokens +
    (outputTokens / 1000) * spec.outputCostPer1kTokens
  );
}

export function getModelsByCapability(cap: ModelCapability): ModelSpec[] {
  return Object.values(MODEL_REGISTRY).filter((m) => m.capabilities.includes(cap));
}

export function getCostPerformanceScore(spec: ModelSpec, prioritizeCost: boolean): number {
  const normalizedCost = 1 / (1 + spec.inputCostPer1kTokens * 100);
  const normalizedLatency = 1 / (1 + spec.avgLatencyMs / 1000);
  const capScore = spec.capabilities.length / 10;
  if (prioritizeCost) {
    return normalizedCost * 0.6 + normalizedLatency * 0.3 + capScore * 0.1;
  }
  return capScore * 0.5 + normalizedCost * 0.25 + normalizedLatency * 0.25;
}
