import { logger } from "./logger";
import { inferenceTelemetry, type InferenceProvider } from "./inference-telemetry";
import { providerHealth } from "./provider-health";
import { services } from "@workspace/services";
import type { ChatMessage, ChatCompletionResult } from "@workspace/services";

export type RoutingStrategy = "fastest" | "cheapest" | "preferred" | "fallback";

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

function selectCandidates(request: GatewayRequest): ProviderCandidate[] {
  const strategy = request.strategy ?? "fastest";
  const candidates: ProviderCandidate[] = [];
  const taskType = detectTaskType(request.messages);
  const modelList = PROVIDER_MODELS[taskType] ?? PROVIDER_MODELS["default"]!;

  for (const { provider, model } of modelList) {
    const health = providerHealth.getStatus(provider);
    if (health.status === "down") continue;

    let score = 100;

    if (request.preferredProvider === provider) score += 50;

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

async function executeInference(
  messages: ChatMessage[],
  model: string,
  maxTokens: number,
  timeoutMs: number,
): Promise<ChatCompletionResult> {
  const result = await Promise.race([
    services.ai.chatCompletion(messages, { model, maxTokens }),
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
    candidates.push({ provider: "mock", model: "mock-model", score: 0, reason: "No healthy providers available" });
  }

  const attemptedProviders: InferenceProvider[] = [];
  let lastError: Error | null = null;

  for (const candidate of candidates) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      attemptedProviders.push(candidate.provider);
      const attemptStart = Date.now();

      try {
        const result = await executeInference(
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

  const mockResult = await services.ai.chatCompletion(request.messages, { model: "mock-model" });
  const telemetryRecord = inferenceTelemetry.record({
    provider: "mock",
    model: "mock-model",
    agentId,
    domain,
    latencyMs: Date.now() - startTime,
    promptTokens: 0,
    completionTokens: 0,
    success: true,
    routingStrategy: "fallback",
    retryCount: 0,
    cached: false,
  });

  return {
    content: mockResult.content,
    model: "mock-model",
    provider: "mock",
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    routing: {
      strategy: "fallback",
      selectedProvider: "mock",
      attemptedProviders,
      retryCount: 0,
      totalLatencyMs: Date.now() - startTime,
      cached: false,
    },
    telemetryId: telemetryRecord.id,
  };
}

export function getGatewayStatus(): {
  availableProviders: Array<{ provider: InferenceProvider; status: string; avgLatencyMs: number }>;
  defaultStrategy: RoutingStrategy;
  supportedStrategies: RoutingStrategy[];
  taskTypes: string[];
} {
  const providers: InferenceProvider[] = ["replit-proxy", "openai", "anthropic", "huggingface"];
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
