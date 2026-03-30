import { logger } from "./logger";
import { inferenceTelemetry, type InferenceProvider } from "./inference-telemetry";
import { providerHealth } from "./provider-health";
import { services } from "@workspace/services";
import type { ChatMessage, ChatCompletionResult } from "@workspace/services";

export type RoutingStrategy = "fastest" | "cheapest" | "preferred" | "fallback";

const VALID_STRATEGIES = new Set<RoutingStrategy>(["fastest", "cheapest", "preferred", "fallback"]);
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
}

export interface GatewayResponse {
  content: string;
  model: string;
  provider: InferenceProvider;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  routing: {
    strategy: RoutingStrategy;
    selectedProvider: InferenceProvider;
    attemptedProviders: InferenceProvider[];
    retryCount: number;
    totalLatencyMs: number;
    cached: boolean;
  };
  telemetryId: string;
}

interface ProviderCandidate {
  provider: InferenceProvider;
  model: string;
  score: number;
  reason: string;
}

type AdapterProvider = "replit-proxy" | "openai" | "anthropic";

const PROVIDER_MODELS: Record<string, { provider: InferenceProvider; model: string }[]> = {
  reasoning: [
    { provider: "replit-proxy", model: "gpt-5.2" },
    { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  ],
  analysis: [
    { provider: "anthropic", model: "claude-sonnet-4-20250514" },
    { provider: "replit-proxy", model: "gpt-4o-mini" },
  ],
  generation: [
    { provider: "replit-proxy", model: "gpt-5.2" },
    { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  ],
  fast: [
    { provider: "replit-proxy", model: "gpt-4o-mini" },
    { provider: "anthropic", model: "claude-3-haiku-20240307" },
  ],
  default: [
    { provider: "replit-proxy", model: "gpt-5.2" },
    { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  ],
};

const ADAPTER_PROVIDER_MAP: Record<string, AdapterProvider> = {
  "replit-proxy": "replit-proxy",
  "openai": "openai",
  "anthropic": "anthropic",
};

function isAdapterProvider(provider: InferenceProvider): provider is AdapterProvider {
  return provider in ADAPTER_PROVIDER_MAP;
}

function selectCandidates(request: GatewayRequest): ProviderCandidate[] {
  const strategy = request.strategy ?? "fastest";
  const candidates: ProviderCandidate[] = [];
  const taskType = detectTaskType(request.messages);
  const modelList = PROVIDER_MODELS[taskType] ?? PROVIDER_MODELS["default"]!;

  if (strategy === "preferred" && request.preferredProvider) {
    const preferred = request.preferredProvider;
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

  for (const { provider, model } of modelList) {
    if (candidates.some(c => c.provider === provider)) continue;
    const health = providerHealth.getStatus(provider);
    if (health.status === "down") continue;

    let score = 100;

    if (strategy === "fastest") {
      const avgLatency = inferenceTelemetry.getProviderLatencyForModel(provider, model);
      score -= Math.min(avgLatency / 10, 80);
    } else if (strategy === "cheapest") {
      if (model.includes("mini") || model.includes("haiku")) score += 40;
    }

    if (health.status === "degraded") score -= 30;

    const errorRate = inferenceTelemetry.getProviderErrorRate(provider);
    score -= errorRate * 100;

    candidates.push({
      provider,
      model: request.model ?? model,
      score,
      reason: `${strategy}: score=${Math.round(score)}, health=${health.status}`,
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

function detectTaskType(messages: ChatMessage[]): string {
  const content = messages.map(m => m.content).join(" ").toLowerCase();
  const analysisKeywords = ["analyze", "analysis", "explain", "why", "how does", "debug", "diagnose", "review", "assess", "compare", "evaluate"];
  const generationKeywords = ["generate", "create", "write", "compose", "draft", "design", "build"];
  const fastKeywords = ["quick", "brief", "short", "summarize", "classify", "tag", "label"];

  if (fastKeywords.some(k => content.includes(k))) return "fast";
  if (analysisKeywords.some(k => content.includes(k))) return "analysis";
  if (generationKeywords.some(k => content.includes(k))) return "generation";
  return "default";
}

async function executeProviderInference(
  provider: InferenceProvider,
  messages: ChatMessage[],
  model: string,
  maxTokens: number,
  timeoutMs: number,
): Promise<ChatCompletionResult> {
  const inferencePromise = isAdapterProvider(provider)
    ? services.ai.chatCompletionForProvider(ADAPTER_PROVIDER_MAP[provider]!, messages, { model, maxTokens })
    : services.ai.chatCompletion(messages, { model, maxTokens });

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

  const candidates = selectCandidates(request);
  if (candidates.length === 0) {
    throw new Error("No healthy providers available for inference");
  }

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

        const telemetryRecord = inferenceTelemetry.record({
          provider: result.provider as InferenceProvider,
          model: result.model,
          agentId,
          domain,
          latencyMs,
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          success: true,
          routingStrategy: strategy,
          retryCount: attempt,
          cached: false,
        });

        providerHealth.recordSuccess(candidate.provider, latencyMs);

        return {
          content: result.content,
          model: result.model,
          provider: result.provider as InferenceProvider,
          usage: {
            promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens,
            totalTokens: result.usage.promptTokens + result.usage.completionTokens,
          },
          routing: {
            strategy,
            selectedProvider: candidate.provider,
            attemptedProviders,
            retryCount: attempt,
            totalLatencyMs: Date.now() - startTime,
            cached: false,
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
          routingStrategy: strategy,
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
  availableProviders: Array<{ provider: InferenceProvider; status: string; avgLatencyMs: number }>;
  defaultStrategy: RoutingStrategy;
  supportedStrategies: RoutingStrategy[];
  taskTypes: string[];
} {
  const providers: InferenceProvider[] = ["replit-proxy", "openai", "anthropic", "gemini", "huggingface"];
  const availableProviders = providers.map(p => {
    const health = providerHealth.getStatus(p);
    const stats = inferenceTelemetry.getProviderStats(300000).find(s => s.provider === p);
    return {
      provider: p,
      status: health.status,
      avgLatencyMs: stats?.avgLatencyMs ?? 0,
    };
  });

  return {
    availableProviders,
    defaultStrategy: "fastest",
    supportedStrategies: ["fastest", "cheapest", "preferred", "fallback"],
    taskTypes: Object.keys(PROVIDER_MODELS),
  };
}

export function isValidStrategy(s: string): s is RoutingStrategy {
  return VALID_STRATEGIES.has(s as RoutingStrategy);
}

export function isValidProvider(p: string): p is InferenceProvider {
  return VALID_PROVIDERS.has(p as InferenceProvider);
}
