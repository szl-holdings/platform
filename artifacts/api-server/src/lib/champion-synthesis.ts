import { logger } from "./logger";
import { services } from "@szl-holdings/services";
import type { ChatMessage } from "@szl-holdings/services";
import { inferenceTelemetry, estimateCost } from "./inference-telemetry";
import type { InferenceProvider } from "./inference-telemetry";
import type { TaskCategory } from "./champion-registry";
import { championRegistry } from "./champion-registry";

export interface SynthesisConfig {
  category: TaskCategory;
  maxModels?: number;
  timeoutMs?: number;
  costGuardUsd?: number;
  agentId?: string;
  domain?: string;
}

export interface ModelResponse {
  modelId: string;
  modelName: string;
  provider: string;
  content: string;
  latencyMs: number;
  costUsd: number;
  tokens: { prompt: number; completion: number };
  success: boolean;
  error?: string;
}

export interface SynthesisResult {
  fusedContent: string;
  modelResponses: ModelResponse[];
  fusionStrategy: "consensus" | "best_of" | "complementary";
  contributionMap: Record<string, string[]>;
  totalCostUsd: number;
  totalLatencyMs: number;
  championsQueried: string[];
  synthesisConfidence: number;
}

const SUPPORTED_TEXT_PROVIDERS = new Set<InferenceProvider>(["openai", "anthropic", "gemini", "replit-proxy"]);

function isTextProvider(provider: string): provider is InferenceProvider {
  return SUPPORTED_TEXT_PROVIDERS.has(provider as InferenceProvider);
}

async function queryChampion(
  champion: { model: string; provider: string; name: string; id: string },
  messages: ChatMessage[],
  timeoutMs: number,
  agentId: string,
  domain: string
): Promise<ModelResponse> {
  const start = Date.now();

  const providerRaw = champion.provider;

  if (!isTextProvider(providerRaw)) {
    return {
      modelId: champion.id,
      modelName: champion.name,
      provider: providerRaw,
      content: "",
      latencyMs: 0,
      costUsd: 0,
      tokens: { prompt: 0, completion: 0 },
      success: false,
      error: `Provider ${providerRaw} not supported for text synthesis`,
    };
  }

  type ServiceProvider = "openai" | "anthropic" | "gemini" | "huggingface" | "replit-proxy";
  const provider = providerRaw as ServiceProvider;

  if (!services.ai.isProviderConfigured(provider)) {
    return {
      modelId: champion.id,
      modelName: champion.name,
      provider,
      content: "",
      latencyMs: 0,
      costUsd: 0,
      tokens: { prompt: 0, completion: 0 },
      success: false,
      error: `Provider ${provider} not configured`,
    };
  }

  try {
    const inferencePromise = services.ai.chatCompletionForProvider(
      provider,
      messages,
      { model: champion.model, maxTokens: 2048 }
    );

    const result = await Promise.race([
      inferencePromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Synthesis timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);

    const latencyMs = Date.now() - start;
    const costUsd = estimateCost(result.model, result.usage.promptTokens, result.usage.completionTokens);

    inferenceTelemetry.record({
      provider,
      model: result.model,
      agentId,
      domain,
      latencyMs,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      success: true,
      routingStrategy: "preferred",
      retryCount: 0,
      cached: false,
    });

    return {
      modelId: champion.id,
      modelName: champion.name,
      provider,
      content: result.content,
      latencyMs,
      costUsd,
      tokens: { prompt: result.usage.promptTokens, completion: result.usage.completionTokens },
      success: true,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);

    inferenceTelemetry.record({
      provider,
      model: champion.model,
      agentId,
      domain,
      latencyMs,
      promptTokens: 0,
      completionTokens: 0,
      success: false,
      errorType: error.slice(0, 100),
      routingStrategy: "preferred",
      retryCount: 0,
      cached: false,
    });

    return {
      modelId: champion.id,
      modelName: champion.name,
      provider,
      content: "",
      latencyMs,
      costUsd: 0,
      tokens: { prompt: 0, completion: 0 },
      success: false,
      error,
    };
  }
}

function extractKeyInsights(content: string): string[] {
  const lines = content.split("\n").filter(l => l.trim().length > 20);
  const insights: string[] = [];

  for (const line of lines.slice(0, 20)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("-") || trimmed.startsWith("•") || trimmed.match(/^\d+\./)) {
      insights.push(trimmed.replace(/^[-•\d.]\s*/, "").trim());
    } else if (trimmed.match(/\b(key|important|critical|note|finding|conclusion)\b/i)) {
      insights.push(trimmed);
    }
  }

  return insights.slice(0, 5);
}

function synthesizeResponses(responses: ModelResponse[]): {
  content: string;
  strategy: SynthesisResult["fusionStrategy"];
  contributionMap: Record<string, string[]>;
  confidence: number;
} {
  const successful = responses.filter(r => r.success && r.content.length > 50);

  if (successful.length === 0) {
    return {
      content: "No champion models were able to respond. Please try again.",
      strategy: "best_of",
      contributionMap: {},
      confidence: 0,
    };
  }

  if (successful.length === 1) {
    const single = successful[0]!;
    return {
      content: single.content,
      strategy: "best_of",
      contributionMap: { [single.modelName]: ["Primary response"] },
      confidence: 0.75,
    };
  }

  const contributionMap: Record<string, string[]> = {};
  let fusedContent = "";
  let confidence = 0.85;

  const longestResponse = successful.reduce((a, b) => a.content.length > b.content.length ? a : b);
  const otherResponses = successful.filter(r => r.modelId !== longestResponse.modelId);

  const primary = longestResponse;
  contributionMap[primary.modelName] = ["Primary analysis and structure"];

  const additionalInsights: Array<{ model: string; insights: string[] }> = [];
  for (const resp of otherResponses) {
    const insights = extractKeyInsights(resp.content);
    if (insights.length > 0) {
      additionalInsights.push({ model: resp.modelName, insights });
      contributionMap[resp.modelName] = insights.slice(0, 3).map(i => i.slice(0, 80));
    } else {
      contributionMap[resp.modelName] = ["Supporting validation"];
    }
  }

  fusedContent = primary.content;

  if (additionalInsights.length > 0) {
    const supplementSection = additionalInsights.map(({ model, insights }) => {
      const insightText = insights.map(i => `- ${i}`).join("\n");
      return `**${model} supplementary insights:**\n${insightText}`;
    }).join("\n\n");

    fusedContent += `\n\n---\n## Multi-Champion Synthesis\n\n${supplementSection}`;
    confidence = 0.92;
  }

  return {
    content: fusedContent,
    strategy: "complementary",
    contributionMap,
    confidence,
  };
}

export async function runMultiChampionSynthesis(
  messages: ChatMessage[],
  config: SynthesisConfig
): Promise<SynthesisResult> {
  const startTime = Date.now();
  const maxModels = config.maxModels ?? 3;
  const timeoutMs = config.timeoutMs ?? 25000;
  const costGuardUsd = config.costGuardUsd ?? 0.5;
  const agentId = config.agentId ?? "synthesis";
  const domain = config.domain ?? "general";

  const champions = championRegistry.getTop3ForCategory(config.category)
    .slice(0, maxModels)
    .filter(c => isTextProvider(c.provider));

  if (champions.length === 0) {
    throw new Error(`No text-capable champions found for category: ${config.category}`);
  }

  logger.info(
    { category: config.category, champions: champions.map(c => c.id), maxModels },
    "Starting multi-champion synthesis"
  );

  let estimatedCostCheck = 0;
  const selectedChampions = [];
  for (const c of champions) {
    const approxCost = c.costPerRun;
    if (estimatedCostCheck + approxCost > costGuardUsd) {
      logger.warn({ champion: c.id, estimatedCostCheck, costGuardUsd }, "Cost guard triggered, skipping champion");
      continue;
    }
    estimatedCostCheck += approxCost;
    selectedChampions.push(c);
  }

  if (selectedChampions.length === 0) {
    selectedChampions.push(champions[0]!);
  }

  const queryPromises = selectedChampions.map(c =>
    queryChampion(
      { model: c.model, provider: c.provider as string, name: c.name, id: c.id },
      messages,
      timeoutMs,
      agentId,
      domain
    )
  );

  const modelResponses = await Promise.all(queryPromises);
  const totalCostUsd = modelResponses.reduce((s, r) => s + r.costUsd, 0);
  const totalLatencyMs = Date.now() - startTime;

  const { content, strategy, contributionMap, confidence } = synthesizeResponses(modelResponses);

  logger.info(
    {
      category: config.category,
      strategy,
      modelsQueried: modelResponses.length,
      successful: modelResponses.filter(r => r.success).length,
      totalCostUsd: totalCostUsd.toFixed(4),
      totalLatencyMs,
    },
    "Multi-champion synthesis complete"
  );

  return {
    fusedContent: content,
    modelResponses,
    fusionStrategy: strategy,
    contributionMap,
    totalCostUsd: parseFloat(totalCostUsd.toFixed(6)),
    totalLatencyMs,
    championsQueried: selectedChampions.map(c => c.name),
    synthesisConfidence: confidence,
  };
}
