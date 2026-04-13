import { logger } from "./logger";
import { inferenceTelemetry, estimateCost, type InferenceProvider } from "./inference-telemetry";
import { providerHealth } from "./provider-health";
import { services } from "@szl-holdings/services";
import type { ChatMessage, ChatCompletionResult } from "@szl-holdings/services";
import { classifyTaskCategory, shouldUseFusion, selectCostMode } from "./category-classifier";
import { championRegistry } from "./champion-registry";
import type { TaskCategory } from "./champion-registry";
import { runMultiChampionSynthesis } from "./champion-synthesis";

export type RoutingStrategy = "fastest" | "cheapest" | "preferred" | "fallback" | "champion" | "fusion";

const VALID_STRATEGIES = new Set<RoutingStrategy>(["fastest", "cheapest", "preferred", "fallback", "champion", "fusion"]);
const VALID_PROVIDERS = new Set<InferenceProvider>(["openai", "anthropic", "replit-proxy", "gemini", "huggingface", "mock"]);

export interface GatewayRequest {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  agentId?: string;
  domain?: string;
  preferredProvider?: InferenceProvider;
  strategy?: RoutingStrategy;
  timeoutMs?: number;
  maxRetries?: number;
  categoryHint?: TaskCategory;
  riskLevel?: "low" | "medium" | "high" | "critical";
  enableFusion?: boolean;
}

export interface GatewayResponse {
  content: string;
  model: string;
  provider: InferenceProvider;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  estimatedCostUsd: number;
  confidence: number | null;
  routing: {
    strategy: RoutingStrategy;
    selectedProvider: InferenceProvider;
    attemptedProviders: InferenceProvider[];
    retryCount: number;
    totalLatencyMs: number;
    cached: boolean;
    taskCategory?: TaskCategory;
    categoryConfidence?: number;
    championUsed?: string;
    fusionUsed?: boolean;
    costMode?: string;
  };
  telemetryId: string;
}

interface ProviderCandidate {
  provider: InferenceProvider;
  model: string;
  score: number;
  reason: string;
}

type TargetableProvider = "replit-proxy" | "openai" | "anthropic" | "gemini" | "huggingface";

const CHAMPION_PROVIDER_MAP: Record<TaskCategory, Array<{ provider: InferenceProvider; model: string }>> = {
  writing: [
    { provider: "anthropic", model: "claude-opus-4-6" },
    { provider: "openai", model: "gpt-5.4" },
    { provider: "replit-proxy", model: "gpt-5.2" },
  ],
  research: [
    { provider: "gemini", model: "gemini-3.1-pro" },
    { provider: "openai", model: "chatgpt-deep-research" },
    { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  ],
  analysis: [
    { provider: "anthropic", model: "claude-opus-4-6" },
    { provider: "anthropic", model: "claude-sonnet-4-20250514" },
    { provider: "openai", model: "gpt-5.4" },
  ],
  coding: [
    { provider: "anthropic", model: "claude-sonnet-4-20250514" },
    { provider: "gemini", model: "gemini-3-pro-preview" },
    { provider: "openai", model: "gpt-5.4" },
  ],
  speed: [
    { provider: "gemini", model: "gemini-2.5-flash" },
    { provider: "replit-proxy", model: "gpt-4o-mini" },
    { provider: "anthropic", model: "claude-3-haiku-20240307" },
  ],
  image_gen: [
    { provider: "openai", model: "dall-e-3" },
    { provider: "replit-proxy", model: "gpt-5.2" },
  ],
  multimodal: [
    { provider: "openai", model: "gpt-5.4" },
    { provider: "anthropic", model: "claude-opus-4-6" },
    { provider: "gemini", model: "gemini-3.1-pro" },
  ],
};

const LEGACY_PROVIDER_MODELS: Record<string, { provider: InferenceProvider; model: string }[]> = {
  reasoning: [
    { provider: "replit-proxy", model: "gpt-5.2" },
    { provider: "anthropic", model: "claude-sonnet-4-20250514" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openai", model: "gpt-5.2" },
  ],
  analysis: [
    { provider: "anthropic", model: "claude-sonnet-4-20250514" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "replit-proxy", model: "gpt-4o-mini" },
    { provider: "openai", model: "gpt-4o" },
  ],
  generation: [
    { provider: "replit-proxy", model: "gpt-5.2" },
    { provider: "anthropic", model: "claude-sonnet-4-20250514" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "huggingface", model: "mistralai/Mixtral-8x7B-Instruct-v0.1" },
  ],
  fast: [
    { provider: "replit-proxy", model: "gpt-4o-mini" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "anthropic", model: "claude-3-haiku-20240307" },
    { provider: "huggingface", model: "mistralai/Mixtral-8x7B-Instruct-v0.1" },
  ],
  default: [
    { provider: "replit-proxy", model: "gpt-5.2" },
    { provider: "anthropic", model: "claude-sonnet-4-20250514" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openai", model: "gpt-5.2" },
    { provider: "huggingface", model: "mistralai/Mixtral-8x7B-Instruct-v0.1" },
  ],
};

function isTargetableProvider(provider: InferenceProvider): provider is TargetableProvider {
  return provider !== "mock";
}

function isProviderAvailable(provider: InferenceProvider): boolean {
  if (provider === "mock") return false;
  if (!isTargetableProvider(provider)) return false;
  return services.ai.isProviderConfigured(provider);
}

function selectCandidates(request: GatewayRequest): ProviderCandidate[] {
  const strategy = request.strategy ?? "fastest";
  const candidates: ProviderCandidate[] = [];

  const classification = classifyTaskCategory(request.messages, request.categoryHint);
  const costMode = selectCostMode(classification, strategy);

  let modelList: { provider: InferenceProvider; model: string }[];

  if (strategy === "champion" || strategy === "fusion") {
    const championList = CHAMPION_PROVIDER_MAP[classification.category];
    if (costMode === "budget") {
      modelList = CHAMPION_PROVIDER_MAP.speed;
    } else {
      modelList = championList ?? LEGACY_PROVIDER_MODELS["default"]!;
    }
  } else {
    const legacyType = classification.category === "speed" ? "fast"
      : classification.category === "coding" || classification.category === "writing" ? "generation"
      : classification.category === "analysis" || classification.category === "research" ? "analysis"
      : "default";
    modelList = LEGACY_PROVIDER_MODELS[legacyType] ?? LEGACY_PROVIDER_MODELS["default"]!;
  }

  if (strategy === "preferred" && request.preferredProvider) {
    const preferred = request.preferredProvider;
    if (isProviderAvailable(preferred)) {
      const preferredEntry = modelList.find(e => e.provider === preferred);
      const model = request.model ?? preferredEntry?.model ?? modelList[0]?.model ?? "gpt-5.2";
      const health = providerHealth.getStatus(preferred);

      if (health.status !== "down") {
        candidates.push({
          provider: preferred,
          model,
          score: 200,
          reason: `preferred: provider=${preferred}, health=${health.status}`,
        });
      }
    }
  }

  for (const { provider, model } of modelList) {
    if (candidates.some(c => c.provider === provider)) continue;
    if (!isProviderAvailable(provider)) continue;

    const health = providerHealth.getStatus(provider);
    if (health.status === "down") continue;

    let score = 100;

    if (strategy === "fastest" || strategy === "champion") {
      const avgLatency = inferenceTelemetry.getProviderLatencyForModel(provider, model);
      score -= Math.min(avgLatency / 10, 80);
    } else if (strategy === "cheapest") {
      if (model.includes("mini") || model.includes("haiku") || model.includes("flash") || model.includes("Mixtral")) score += 40;
    }

    if (health.status === "degraded") score -= 30;

    const errorRate = inferenceTelemetry.getProviderErrorRate(provider);
    score -= errorRate * 100;

    candidates.push({
      provider,
      model: request.model ?? model,
      score,
      reason: `${strategy}: score=${Math.round(score)}, health=${health.status}, category=${classification.category}`,
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

function isValidTaskType(type: string): type is TaskCategory {
  return ["writing", "research", "analysis", "coding", "speed", "image_gen", "multimodal"].includes(type);
}

async function executeProviderInference(
  provider: InferenceProvider,
  messages: ChatMessage[],
  model: string,
  maxTokens: number,
  timeoutMs: number,
): Promise<ChatCompletionResult> {
  if (!isTargetableProvider(provider)) {
    throw new Error(`Provider "${provider}" cannot be targeted for inference`);
  }

  const inferencePromise = services.ai.chatCompletionForProvider(provider, messages, { model, maxTokens });

  const result = await Promise.race([
    inferencePromise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Inference timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
  return result;
}

export async function gatewayInfer(request: GatewayRequest): Promise<GatewayResponse> {
  const startTime = Date.now();
  const strategy = request.strategy ?? "fastest";
  const maxRetries = request.maxRetries ?? 2;
  const timeoutMs = request.timeoutMs ?? 30000;
  const agentId = request.agentId ?? "anonymous";
  const domain = request.domain ?? "general";

  const classification = classifyTaskCategory(request.messages, request.categoryHint);
  const costMode = selectCostMode(classification, strategy);

  const useFusion = (strategy as string) === "fusion" || (strategy === "champion" && shouldUseFusion(classification, request.riskLevel) && request.enableFusion !== false);
  const telemetryStrategy: "fastest" | "cheapest" | "preferred" | "fallback" = (strategy === "champion" || (strategy as string) === "fusion") ? "preferred" : strategy as "fastest" | "cheapest" | "preferred" | "fallback";

  if (useFusion) {
    logger.info({ agentId, domain, category: classification.category, confidence: classification.confidence }, "Gateway: activating multi-champion fusion");

    const synthesis = await runMultiChampionSynthesis(request.messages, {
      category: classification.category,
      maxModels: 3,
      timeoutMs,
      costGuardUsd: request.maxTokens ? request.maxTokens * 0.00003 * 5 : 0.25,
      agentId,
      domain,
    });

    const totalPromptTokens = synthesis.modelResponses.reduce((s, r) => s + r.tokens.prompt, 0);
    const totalCompletionTokens = synthesis.modelResponses.reduce((s, r) => s + r.tokens.completion, 0);

    const primaryProvider = (synthesis.modelResponses.find(r => r.success)?.provider ?? "anthropic") as InferenceProvider;

    return {
      content: synthesis.fusedContent,
      model: synthesis.championsQueried[0] ?? "fusion",
      provider: primaryProvider,
      usage: {
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        totalTokens: totalPromptTokens + totalCompletionTokens,
      },
      estimatedCostUsd: synthesis.totalCostUsd,
      confidence: synthesis.synthesisConfidence,
      routing: {
        strategy,
        selectedProvider: primaryProvider,
        attemptedProviders: synthesis.modelResponses.map(r => r.provider as InferenceProvider),
        retryCount: 0,
        totalLatencyMs: Date.now() - startTime,
        cached: false,
        taskCategory: classification.category,
        categoryConfidence: classification.confidence,
        championUsed: synthesis.championsQueried.join(", "),
        fusionUsed: true,
        costMode,
      },
      telemetryId: `fusion-${Date.now()}-${agentId}`,
    };
  }

  const candidates = selectCandidates(request);
  if (candidates.length === 0) {
    throw new Error("No healthy providers available for inference");
  }

  const championForCategory = championRegistry.getChampionForCategory(classification.category);

  const attemptedProviders: InferenceProvider[] = [];
  let lastError: Error | null = null;

  for (const candidate of candidates) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      attemptedProviders.push(candidate.provider);
      const attemptStart = Date.now();

      try {
        const result = await executeProviderInference(
          candidate.provider,
          request.messages,
          candidate.model,
          request.maxTokens ?? 1024,
          timeoutMs,
        );

        const latencyMs = Date.now() - attemptStart;

        if (result.provider !== candidate.provider) {
          logger.warn({
            expected: candidate.provider,
            actual: result.provider,
            model: result.model,
          }, "Provider mismatch — recording against actual provider");
        }

        const actualProvider = result.provider as InferenceProvider;

        const telemetryRecord = inferenceTelemetry.record({
          provider: actualProvider,
          model: result.model,
          agentId,
          domain,
          latencyMs,
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          success: true,
          routingStrategy: telemetryStrategy,
          retryCount: attempt,
          cached: false,
        });

        providerHealth.recordSuccess(actualProvider, latencyMs);

        const totalTokens = result.usage.promptTokens + result.usage.completionTokens;
        const costUsd = estimateCost(result.model, result.usage.promptTokens, result.usage.completionTokens);

        return {
          content: result.content,
          model: result.model,
          provider: actualProvider,
          usage: {
            promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens,
            totalTokens,
          },
          estimatedCostUsd: costUsd,
          confidence: null,
          routing: {
            strategy,
            selectedProvider: candidate.provider,
            attemptedProviders,
            retryCount: attempt,
            totalLatencyMs: Date.now() - startTime,
            cached: false,
            taskCategory: classification.category,
            categoryConfidence: classification.confidence,
            championUsed: championForCategory?.name,
            fusionUsed: false,
            costMode,
          },
          telemetryId: telemetryRecord.id,
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const latencyMs = Date.now() - attemptStart;

        inferenceTelemetry.record({
          provider: candidate.provider,
          model: candidate.model,
          agentId,
          domain,
          latencyMs,
          promptTokens: 0,
          completionTokens: 0,
          success: false,
          errorType: lastError.message.slice(0, 100),
          routingStrategy: telemetryStrategy,
          retryCount: attempt,
          cached: false,
        });

        providerHealth.recordFailure(candidate.provider, lastError.message);

        if (attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt) * 500;
          logger.warn({ provider: candidate.provider, model: candidate.model, attempt, backoffMs, error: lastError.message }, "Gateway inference attempt failed, retrying");
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }
  }

  logger.error({ agentId, domain, attemptedProviders, error: lastError?.message }, "All gateway inference attempts exhausted");
  throw new Error(`All providers exhausted after ${attemptedProviders.length} attempts: ${lastError?.message ?? "unknown error"}`);
}

export function getGatewayStatus(): {
  availableProviders: Array<{ provider: InferenceProvider; status: string; configured: boolean; avgLatencyMs: number }>;
  defaultStrategy: RoutingStrategy;
  supportedStrategies: RoutingStrategy[];
  taskTypes: string[];
  championMap: Record<string, string>;
} {
  const providers: TargetableProvider[] = ["replit-proxy", "openai", "anthropic", "gemini", "huggingface"];
  const availableProviders = providers.map(p => {
    const health = providerHealth.getStatus(p);
    const stats = inferenceTelemetry.getProviderStats(300000).find(s => s.provider === p);
    return {
      provider: p as InferenceProvider,
      status: health.status,
      configured: services.ai.isProviderConfigured(p),
      avgLatencyMs: stats?.avgLatencyMs ?? 0,
    };
  });

  const categories: TaskCategory[] = ["writing", "research", "analysis", "coding", "speed", "image_gen", "multimodal"];
  const championMap: Record<string, string> = {};
  for (const cat of categories) {
    const c = championRegistry.getChampionForCategory(cat);
    if (c) championMap[cat] = c.name;
  }

  return {
    availableProviders,
    defaultStrategy: "fastest",
    supportedStrategies: ["fastest", "cheapest", "preferred", "fallback", "champion", "fusion"],
    taskTypes: categories,
    championMap,
  };
}

export function isValidStrategy(s: string): s is RoutingStrategy {
  return VALID_STRATEGIES.has(s as RoutingStrategy);
}

export function isValidProvider(p: string): p is InferenceProvider {
  return VALID_PROVIDERS.has(p as InferenceProvider);
}
