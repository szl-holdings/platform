/**
 * Model Router — Centralized AI task routing with telemetry, failover, and per-tenant toggles.
 *
 * Extends the base hf-router.ts with:
 *  - Latency/cost logging per request
 *  - Failover between providers
 *  - Per-tenant/per-pack feature toggles
 *  - Approval gate enforcement for high-risk tasks
 */

import {
  substrateEndpointManager,
  type SubstrateCompletionResult,
} from '@szl-holdings/substrate-adapters';
import {
  chatCompletion,
  type HFChatMessage,
  type HFCompletionResult,
  type HFToolDef,
} from './providers/hf-client.js';
import { type RouteClass, type RouteResult, routeModel } from './providers/hf-router.js';
import { resolveModelForAgent } from './fine-tuning/model-registry-extension.js';

/**
 * Dispatch a chat completion to the OpenAI API directly.
 * Used when a fine-tuned model's provider is 'openai' so inference is sent
 * to the correct endpoint instead of the HuggingFace router.
 */
async function openaiChatCompletion(
  messages: HFChatMessage[],
  route: RouteResult,
  options?: { tools?: HFToolDef[]; responseFormat?: { type: 'json_object' } | { type: 'text' } },
): Promise<HFCompletionResult> {
  const apiKey = process.env.OPENAI_FINE_TUNING_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!apiKey) throw new Error('No OpenAI API key configured for cross-provider fine-tuned dispatch');
  const baseUrl = process.env.OPENAI_FINE_TUNING_BASE_URL ?? 'https://api.openai.com/v1';

  const start = Date.now();
  const body: Record<string, unknown> = {
    model: route.model,
    messages,
    max_tokens: route.maxTokens,
    temperature: route.temperature,
  };
  if (options?.tools?.length) body.tools = options.tools;
  if (options?.responseFormat) body.response_format = options.responseFormat;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`OpenAI fine-tuned dispatch error ${response.status}: ${errText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };

  const choice = data.choices?.[0];
  return {
    content: choice?.message?.content ?? '',
    model: route.model,
    provider: route.provider,
    finishReason: choice?.finish_reason ?? 'stop',
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens ?? 0,
          completionTokens: data.usage.completion_tokens ?? 0,
          totalTokens: data.usage.total_tokens ?? 0,
        }
      : null,
    latencyMs: Date.now() - start,
    toolCalls: [],
    raw: data,
  };
}

async function substrateEnsureModelLoaded(modelId: string): Promise<void> {
  const health = await substrateEndpointManager.checkHealth();
  if (health.loadedModels.includes(modelId)) return;
  if (health.status === 'offline') {
    throw new Error('Substrate service unreachable');
  }

  const result = await substrateEndpointManager.loadModel(modelId);
  if (!result.success) {
    throw new Error(`Substrate auto-load failed for '${modelId}': ${result.message}`);
  }
}

async function substrateChatCompletion(
  messages: HFChatMessage[],
  route: RouteResult,
  options?: { tools?: HFToolDef[]; responseFormat?: { type: 'json_object' } | { type: 'text' } },
): Promise<HFCompletionResult> {
  await substrateEnsureModelLoaded(route.model);

  const endpointId = `substrate-${route.model}`;
  const substrateMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
    ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
  }));

  let result: SubstrateCompletionResult;
  try {
    result = await substrateEndpointManager.complete({
      endpointId,
      messages: substrateMessages,
      temperature: route.temperature,
      maxTokens: route.maxTokens,
      tools: options?.tools,
      responseFormat: options?.responseFormat,
    });
  } catch (err: unknown) {
    throw new Error(
      `Substrate inference error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return {
    content: result.content,
    model: result.model,
    provider: 'substrate',
    finishReason: result.finishReason ?? 'stop',
    usage: result.usage
      ? {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
        }
      : null,
    latencyMs: result.latencyMs,
    toolCalls: [],
    raw: result,
  };
}

export type { RouteClass, RouteResult };

export interface ModelRouterTelemetry {
  routeClass: RouteClass;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  costEstimateUsd: number;
  usedFallback: boolean;
  correlationId?: string;
  tenantId?: number | string;
  packSlug?: string;
  taskId?: string;
  kernelId?: string;
  kernelSource?: string;
  kernelCategory?: string;
  kernelStrategy?: string;
  kernelLatencyMs?: number;
  kernelMemoryMB?: number;
}

export type TelemetryHandler = (telemetry: ModelRouterTelemetry) => void | Promise<void>;

export interface TenantFeatureToggles {
  tenantId?: number | string;
  packSlug?: string;
  disabledLanes?: RouteClass[];
  maxCostPerCallUsd?: number;
  requireApprovalForLanes?: RouteClass[];
  allowedProviders?: string[];
  overrideModel?: Partial<Record<RouteClass, string>>;
}

const HIGH_RISK_LANES: RouteClass[] = ['planning', 'reasoning', 'tool_calling'];

const COST_PER_TOKEN_USD: Record<string, number> = {
  // OpenAI
  'gpt-5.5': 0.000015,
  'gpt-5.2': 0.000010,
  'gpt-4o': 0.000005,
  'gpt-4o-mini': 0.00000015,
  // Anthropic
  'claude-opus-4-7': 0.000015,
  'claude-sonnet-4-6': 0.000003,
  'claude-3-5-sonnet-20241022': 0.000003,
  // DeepSeek
  'deepseek-r1': 0.00000055,
  'deepseek-v3': 0.00000027,
  // Gemini
  'gemini-3.1-pro-preview': 0.00000125,
  'gemini-2.0-flash-exp': 0.00000125,
  'gemini-3-flash-preview': 0.000000075,
  'gemini-2.0-flash-lite': 0.000000075,
  // HuggingFace / Qwen
  'Qwen/Qwen3-8B': 0.0000002,
  'Qwen/Qwen3-0.6B': 0.00000005,
  'Qwen/Qwen2.5-VL-7B-Instruct': 0.0000002,
  // Substrate Edge Inference (oLLM) — zero cost, local GPU
  'llama-3.3-70b-instruct': 0,
  'llama-3.1-8b-instruct': 0,
  'qwen3-next-80b': 0,
  'gemma3-12b': 0,
  'gpt-oss-20b': 0,
  'voxtral-small-24b': 0,
  default: 0.0000002,
};

function estimateCost(model: string, totalTokens: number): number {
  const ratePerToken = COST_PER_TOKEN_USD[model] ?? COST_PER_TOKEN_USD.default!;
  return ratePerToken * totalTokens;
}

const _telemetryHandlers: TelemetryHandler[] = [];

export function registerTelemetryHandler(handler: TelemetryHandler): void {
  _telemetryHandlers.push(handler);
}

async function emitTelemetry(t: ModelRouterTelemetry): Promise<void> {
  for (const handler of _telemetryHandlers) {
    try {
      await handler(t);
    } catch {}
  }
}

export function checkTenantPolicy(
  routeClass: RouteClass,
  toggles: TenantFeatureToggles | undefined,
): { allowed: boolean; reason?: string } {
  if (!toggles) return { allowed: true };

  if (toggles.disabledLanes?.includes(routeClass)) {
    return {
      allowed: false,
      reason: `Lane '${routeClass}' is disabled for tenant ${toggles.tenantId ?? 'global'}`,
    };
  }

  const requiresApproval =
    toggles.requireApprovalForLanes?.includes(routeClass) ||
    (process.env.AI_REQUIRE_APPROVAL_FOR_HIGH_RISK === 'true' &&
      HIGH_RISK_LANES.includes(routeClass));

  if (requiresApproval) {
    return {
      allowed: false,
      reason: `Lane '${routeClass}' requires explicit approval before execution`,
    };
  }

  return { allowed: true };
}

export interface RouterCallOptions {
  messages: HFChatMessage[];
  routeClass: RouteClass;
  tools?: HFToolDef[];
  responseFormat?: { type: 'json_object' } | { type: 'text' };
  overrideModel?: string;
  overrideMaxTokens?: number;
  overrideTemperature?: number;
  tenantToggles?: TenantFeatureToggles;
  correlationId?: string;
  taskId?: string;
  useFallback?: boolean;
  agentId?: string;
}

export interface RouterCallResult {
  completion: HFCompletionResult;
  route: RouteResult;
  telemetry: ModelRouterTelemetry;
}

export async function routerCall(options: RouterCallOptions): Promise<RouterCallResult> {
  const {
    messages,
    routeClass,
    tools,
    responseFormat,
    overrideModel,
    overrideMaxTokens,
    overrideTemperature,
    tenantToggles,
    correlationId,
    taskId,
    useFallback = true,
    agentId,
  } = options;

  const policyCheck = checkTenantPolicy(routeClass, tenantToggles);
  if (!policyCheck.allowed) {
    throw Object.assign(
      new Error(policyCheck.reason ?? `Route class '${routeClass}' not allowed`),
      { code: 'POLICY_DENIED', routeClass },
    );
  }

  const baseRoute = routeModel(routeClass);

  let resolvedFineTunedModel: string | undefined;
  let resolvedFineTunedProvider: string | undefined;
  if (agentId && !overrideModel) {
    const resolution = await resolveModelForAgent(agentId, baseRoute.model, {
      preferFineTuned: true,
      minLifecycle: 'canary',
    }).catch(() => null);
    if (resolution?.isFineTuned) {
      resolvedFineTunedModel = resolution.model;
      resolvedFineTunedProvider = resolution.provider;
    }
  }

  const modelOverride = resolvedFineTunedModel ?? overrideModel ?? tenantToggles?.overrideModel?.[routeClass];

  const route = {
    ...routeModel(routeClass, {
      ...(modelOverride !== undefined ? { model: modelOverride } : {}),
      ...(overrideMaxTokens !== undefined ? { maxTokens: overrideMaxTokens } : {}),
      ...(overrideTemperature !== undefined ? { temperature: overrideTemperature } : {}),
    }),
    // Reflect the effective provider in the route for telemetry and policy checks.
    ...(resolvedFineTunedProvider !== undefined ? { provider: resolvedFineTunedProvider } : {}),
  };

  // Apply allowedProviders policy against the effective resolved provider, not
  // the static default lane provider, so fine-tuned routing is evaluated fairly.
  if (
    tenantToggles?.allowedProviders?.length &&
    !tenantToggles.allowedProviders.includes(route.provider)
  ) {
    throw Object.assign(
      new Error(`Provider '${route.provider}' not in allowed providers for tenant`),
      { code: 'PROVIDER_NOT_ALLOWED' },
    );
  }

  const start = Date.now();
  let completion: HFCompletionResult;
  let usedFallback = false;

  const _chatOpts = {
    ...(tools !== undefined ? { tools } : {}),
    ...(responseFormat !== undefined ? { responseFormat } : {}),
  };

  // Dispatch to the correct inference client based on the effective provider.
  // OpenAI fine-tuned models must be sent to the OpenAI API directly since
  // the HuggingFace router cannot serve them.
  // Substrate endpoints use the same OpenAI-compatible API surface (local GPU).
  const dispatchCompletion = async (r: RouteResult): Promise<HFCompletionResult> => {
    if (r.provider === 'openai') return openaiChatCompletion(messages, r, _chatOpts);
    if (r.provider === 'substrate') return substrateChatCompletion(messages, r, _chatOpts);
    return chatCompletion(messages, r, _chatOpts);
  };

  if (useFallback) {
    try {
      completion = await dispatchCompletion(route);
    } catch (primaryErr) {
      const fallbackRoute = routeModel('background_batch', (modelOverride !== undefined ? { model: modelOverride } : {}));
      try {
        completion = await dispatchCompletion(fallbackRoute);
        usedFallback = true;
      } catch {
        throw primaryErr;
      }
    }
  } else {
    completion = await dispatchCompletion(route);
  }

  const latencyMs = Date.now() - start;
  const totalTokens = completion.usage?.totalTokens ?? 0;
  const costUsd = estimateCost(route.model, totalTokens);

  if (tenantToggles?.maxCostPerCallUsd != null && costUsd > tenantToggles.maxCostPerCallUsd) {
    throw Object.assign(
      new Error(
        `Cost ceiling exceeded: ${costUsd.toFixed(6)} USD > ${tenantToggles.maxCostPerCallUsd} USD limit`,
      ),
      { code: 'COST_CEILING_EXCEEDED' },
    );
  }

  const telemetry: ModelRouterTelemetry = {
    routeClass,
    model: route.model,
    provider: route.provider,
    promptTokens: completion.usage?.promptTokens ?? 0,
    completionTokens: completion.usage?.completionTokens ?? 0,
    totalTokens,
    latencyMs,
    costEstimateUsd: costUsd,
    usedFallback,
    ...(correlationId !== undefined ? { correlationId } : {}),
    ...(tenantToggles?.tenantId !== undefined ? { tenantId: tenantToggles.tenantId } : {}),
    ...(tenantToggles?.packSlug !== undefined ? { packSlug: tenantToggles.packSlug } : {}),
    ...(taskId !== undefined ? { taskId } : {}),
  };

  void emitTelemetry(telemetry);

  return { completion, route, telemetry };
}

export interface RouterConfig {
  routes: Record<string, RouteResult>;
  highRiskLanes: RouteClass[];
  requireApprovalForHighRisk: boolean;
  executionMode: string;
}

export function getRouterConfig(): RouterConfig {
  return {
    routes: Object.fromEntries(
      (
        [
          'classification',
          'triage',
          'reasoning',
          'planning',
          'tool_calling',
          'vision_understanding',
          'background_batch',
          'extraction',
          'summarization',
        ] as RouteClass[]
      ).map((rc) => [rc, routeModel(rc)]),
    ),
    highRiskLanes: HIGH_RISK_LANES,
    requireApprovalForHighRisk: process.env.AI_REQUIRE_APPROVAL_FOR_HIGH_RISK !== 'false',
    executionMode: process.env.AI_EXECUTION_MODE ?? 'propose_only',
  };
}
