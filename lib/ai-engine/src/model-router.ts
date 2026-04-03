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
  routeModel,
  type RouteClass,
  type RouteResult,
} from "./providers/hf-router.js";
import { chatCompletion, chatCompletionWithFallback, type HFChatMessage, type HFToolDef, type HFCompletionResult } from "./providers/hf-client.js";

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

const HIGH_RISK_LANES: RouteClass[] = ["planning", "reasoning", "tool_calling"];

const COST_PER_TOKEN_USD: Record<string, number> = {
  "Qwen/Qwen3-8B": 0.0000002,
  "Qwen/Qwen3-0.6B": 0.00000005,
  "Qwen/Qwen2.5-VL-7B-Instruct": 0.0000002,
  default: 0.0000002,
};

function estimateCost(model: string, totalTokens: number): number {
  const ratePerToken = COST_PER_TOKEN_USD[model] ?? COST_PER_TOKEN_USD["default"]!;
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
    } catch {
    }
  }
}

export function checkTenantPolicy(
  routeClass: RouteClass,
  toggles: TenantFeatureToggles | undefined,
): { allowed: boolean; reason?: string } {
  if (!toggles) return { allowed: true };

  if (toggles.disabledLanes?.includes(routeClass)) {
    return { allowed: false, reason: `Lane '${routeClass}' is disabled for tenant ${toggles.tenantId ?? "global"}` };
  }

  const requiresApproval =
    toggles.requireApprovalForLanes?.includes(routeClass) ||
    (process.env["AI_REQUIRE_APPROVAL_FOR_HIGH_RISK"] === "true" && HIGH_RISK_LANES.includes(routeClass));

  if (requiresApproval) {
    return { allowed: false, reason: `Lane '${routeClass}' requires explicit approval before execution` };
  }

  return { allowed: true };
}

export interface RouterCallOptions {
  messages: HFChatMessage[];
  routeClass: RouteClass;
  tools?: HFToolDef[];
  responseFormat?: { type: "json_object" } | { type: "text" };
  overrideModel?: string;
  overrideMaxTokens?: number;
  overrideTemperature?: number;
  tenantToggles?: TenantFeatureToggles;
  correlationId?: string;
  taskId?: string;
  useFallback?: boolean;
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
  } = options;

  const policyCheck = checkTenantPolicy(routeClass, tenantToggles);
  if (!policyCheck.allowed) {
    throw Object.assign(
      new Error(policyCheck.reason ?? `Route class '${routeClass}' not allowed`),
      { code: "POLICY_DENIED", routeClass },
    );
  }

  let modelOverride = overrideModel ?? tenantToggles?.overrideModel?.[routeClass];

  if (tenantToggles?.allowedProviders?.length && !tenantToggles.allowedProviders.includes(
    routeModel(routeClass).provider,
  )) {
    throw Object.assign(
      new Error(`Provider '${routeModel(routeClass).provider}' not in allowed providers for tenant`),
      { code: "PROVIDER_NOT_ALLOWED" },
    );
  }

  const route = routeModel(routeClass, {
    model: modelOverride,
    maxTokens: overrideMaxTokens,
    temperature: overrideTemperature,
  });

  const start = Date.now();
  let completion: HFCompletionResult;
  let usedFallback = false;

  if (useFallback) {
    try {
      completion = await chatCompletion(messages, route, { tools, responseFormat });
    } catch (primaryErr) {
      const fallbackRoute = routeModel("background_batch", { model: modelOverride });
      try {
        completion = await chatCompletion(messages, fallbackRoute, { tools, responseFormat });
        usedFallback = true;
      } catch {
        throw primaryErr;
      }
    }
  } else {
    completion = await chatCompletion(messages, route, { tools, responseFormat });
  }

  const latencyMs = Date.now() - start;
  const totalTokens = completion.usage?.totalTokens ?? 0;
  const costUsd = estimateCost(route.model, totalTokens);

  if (tenantToggles?.maxCostPerCallUsd != null && costUsd > tenantToggles.maxCostPerCallUsd) {
    throw Object.assign(
      new Error(`Cost ceiling exceeded: ${costUsd.toFixed(6)} USD > ${tenantToggles.maxCostPerCallUsd} USD limit`),
      { code: "COST_CEILING_EXCEEDED" },
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
    correlationId,
    tenantId: tenantToggles?.tenantId,
    packSlug: tenantToggles?.packSlug,
    taskId,
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
      (["classification", "triage", "reasoning", "planning", "tool_calling", "vision_understanding", "background_batch", "extraction", "summarization"] as RouteClass[]).map(rc => [rc, routeModel(rc)])
    ),
    highRiskLanes: HIGH_RISK_LANES,
    requireApprovalForHighRisk: process.env["AI_REQUIRE_APPROVAL_FOR_HIGH_RISK"] !== "false",
    executionMode: process.env["AI_EXECUTION_MODE"] ?? "propose_only",
  };
}
