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
import { resolveViaPassport } from './passport-resolver.js';

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
  /** Cognitive Reflexivity strategies that influenced this decision. */
  reflexiveStrategyIds?: string[];
  /** Dimensions modified by the strategies (lane / model / etc.). */
  reflexiveInfluencedDimensions?: string[];
  /**
   * Effective lane after reflexive strategy reassignment. Differs from
   * `routeClass` only when a strategy successfully re-routed the call to a
   * different lane (e.g. `triage` → `reasoning`). Recorded so audits can
   * answer "what lane did this run actually use?".
   */
  effectiveLane?: string;
  /** Reflexive retrieval-depth bias the strategy applied (delta or absolute). */
  reflexiveRetrievalDepth?: number;
  /** Reflexive minimum confidence floor the strategy required. */
  reflexiveMinConfidence?: number;
  /**
   * True when the completion's reported confidence (if any) was below the
   * reflexive minConfidence floor. Surfaced for downstream gating without
   * forcing the router to throw — callers decide what to do.
   */
  reflexiveConfidenceBelowFloor?: boolean;
  /**
   * Model Passport id that governed this call. Set when the passport resolver
   * is installed (api-server boot) and a matching active passport was found.
   * Absent when routing falls back to the static lane→model map.
   */
  passportId?: string;
  /**
   * SHA-256 digest (first 32 hex chars) of the Ed25519 signature from the
   * governing passport. Carried in every audit log row so proof of which
   * exact policy envelope governed a decision can be verified offline.
   */
  passportSignatureDigest?: string;
  /** Quantization tier from the governing passport (e.g. 'hosted', 'int8'). */
  passportQuantTier?: string;
  /** Autonomy tier declared in the governing passport's policy envelope. */
  passportAutonomyTier?: string;
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

const KNOWN_ROUTE_CLASSES = new Set<RouteClass>([
  'classification',
  'triage',
  'reasoning',
  'planning',
  'tool_calling',
  'vision_understanding',
  'background_batch',
  'extraction',
  'summarization',
]);

const _telemetryHandlers: TelemetryHandler[] = [];

export function registerTelemetryHandler(handler: TelemetryHandler): void {
  _telemetryHandlers.push(handler);
}

/**
 * RouterStrategyHook — pluggable seam used by the Cognitive Reflexivity
 * Engine (#4570–#4572) to bias router decisions with operator-approved
 * reflexive strategies (lane / model / retrieval-depth / confidence-floor).
 *
 * The hook receives the resolved defaults the router computed from
 * routeModel(routeClass) + tenant overrides and returns adaptations the
 * router will fold back in BEFORE dispatching the chat completion. The
 * hook MUST be synchronous-friendly (returns void or a promise) and MUST
 * NEVER throw — on error the router proceeds with defaults.
 *
 * api-server installs the hook from
 * `artifacts/api-server/src/lib/cognitive-reflexivity-runtime.ts` so this
 * package has zero compile-time dependency on the reflexivity engine.
 */
export interface RouterStrategyDecisionInput {
  routeClass: string;
  agentId?: string;
  defaults: {
    lane?: string;
    model?: string;
    retrievalDepth?: number;
    minConfidence?: number;
  };
}

export interface RouterStrategyDecisionResult {
  lane?: string;
  model?: string;
  retrievalDepth?: number;
  minConfidence?: number;
  appliedStrategyIds: string[];
  influencedDimensions: string[];
}

export type RouterStrategyHook = (
  input: RouterStrategyDecisionInput,
) => RouterStrategyDecisionResult | undefined;

let _strategyHook: RouterStrategyHook | null = null;

export function registerRouterStrategyHook(hook: RouterStrategyHook | null): void {
  _strategyHook = hook;
}

export function getRouterStrategyHook(): RouterStrategyHook | null {
  return _strategyHook;
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
  /** Passport id governing this call — attached by the passport-resolver middleware at api-server level. */
  _passportId?: string;
  /** Ed25519 signature digest from the governing passport — forwarded to telemetry for audit trails. */
  _passportSignatureDigest?: string;
  /** Quant tier from the governing passport (e.g. 'hosted', 'int8'). */
  _passportQuantTier?: string;
  /** Autonomy tier from the governing passport's policy envelope. */
  _passportAutonomyTier?: string;
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

  // ── Passport-governed routing (primary selection) ──────────────────────
  // Attempt to resolve a signed, active Model Passport for this lane before
  // falling through to the static hf-router map. When a passport is found its
  // declared provider + model override the static defaults, so callers always
  // get the policy-approved model. Operator overrides (overrideModel,
  // fine-tuned resolution, strategy overrides) still take precedence over the
  // passport — the passport is the baseline, not a hard lock.
  // The call is intentionally non-blocking on error: if the resolver throws or
  // the DB is unreachable, routing falls back silently to the static map.
  let _resolvedPassportId: string | undefined;
  let _resolvedPassportDigest: string | undefined;
  let _resolvedPassportQuantTier: string | undefined;
  let _resolvedPassportAutonomyTier: string | undefined;
  let _passportDerivedModel: string | undefined;
  let _passportDerivedProvider: string | undefined;
  let _passportDowngradeLadder: Array<{ passportId: string; displayName: string; reason: string }> = [];

  if (!overrideModel) {
    try {
      const passportResult = await resolveViaPassport({
        lane: routeClass,
        tenantId: tenantToggles?.tenantId,
        budgetUsdPerCall: tenantToggles?.maxCostPerCallUsd,
      });
      if (passportResult) {
        _resolvedPassportId = passportResult.passportId;
        _resolvedPassportDigest = passportResult.signatureDigest;
        _passportDerivedModel = passportResult.model;
        _passportDerivedProvider = passportResult.provider;
        _passportDowngradeLadder = passportResult.downgradeLadder;
        _resolvedPassportQuantTier = passportResult.quantTier;
        _resolvedPassportAutonomyTier = passportResult.autonomyTier;
      }
    } catch {
      // Resolver failures MUST NOT break routing. Fall through to static map.
    }
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

  // ── Cognitive Reflexivity bias ────────────────────────────────────────
  // Apply operator-approved reflexive strategies to the routing decision.
  // The hook is registered by api-server at boot; if absent, this is a
  // pure no-op and routing proceeds with normal defaults. Operator
  // overrides (overrideModel, fine-tuned resolution) take precedence over
  // strategy suggestions — the engine only fills in gaps where the
  // operator has not pinned a value.
  //
  // Strategies can adapt FOUR dimensions and the router consumes ALL of
  // them (not just `model`):
  //   1. lane              → re-route via routeModel(decision.lane)
  //   2. model             → override the model on the resolved route
  //   3. retrievalDepth    → surfaced on telemetry for retrieval consumers
  //   4. minConfidence     → enforced post-dispatch via a soft warning
  //                          (callers escalate; the router never throws on
  //                          a low-confidence completion to avoid silently
  //                          dropping a useful response).
  let strategyOverride: { lane?: string; model?: string } = {};
  let appliedStrategyIds: string[] = [];
  let influencedDimensions: string[] = [];
  let strategyRetrievalDepth: number | undefined;
  let strategyMinConfidence: number | undefined;
  let effectiveLane: string = routeClass;
  try {
    const hook = _strategyHook;
    if (hook) {
      const decision = hook({
        routeClass,
        agentId,
        defaults: {
          lane: routeClass,
          model: resolvedFineTunedModel ?? overrideModel ?? baseRoute.model,
        },
      });
      if (decision) {
        appliedStrategyIds = decision.appliedStrategyIds ?? [];
        influencedDimensions = decision.influencedDimensions ?? [];
        // (1) Lane reassignment. Only adopt the suggested lane when it is a
        // recognised RouteClass — defensive guard against an upstream typo
        // re-routing every call into 'background_batch' or similar.
        if (
          decision.lane &&
          decision.lane !== routeClass &&
          KNOWN_ROUTE_CLASSES.has(decision.lane as RouteClass)
        ) {
          strategyOverride.lane = decision.lane;
          effectiveLane = decision.lane;
        }
        // (2) Model override.
        if (
          decision.model &&
          !overrideModel &&
          !resolvedFineTunedModel &&
          decision.model !== baseRoute.model
        ) {
          strategyOverride.model = decision.model;
        }
        // (3) Retrieval depth — clamp into a sane band; callers may treat
        // this as "depth delta" or "absolute depth" depending on context.
        if (typeof decision.retrievalDepth === 'number' && Number.isFinite(decision.retrievalDepth)) {
          strategyRetrievalDepth = Math.max(-5, Math.min(20, decision.retrievalDepth));
        }
        // (4) Minimum confidence floor — clamp into [0, 1].
        if (typeof decision.minConfidence === 'number' && Number.isFinite(decision.minConfidence)) {
          strategyMinConfidence = Math.max(0, Math.min(1, decision.minConfidence));
        }
      }
    }
  } catch {
    // Strategy hook MUST NOT break routing; swallow and proceed.
  }

  // Effective route class drives the lane (and therefore the default model
  // pool, max tokens, temperature). When a strategy reassigned the lane the
  // route is re-resolved against the new lane so all downstream defaults
  // line up. Falls back to the original routeClass on any guard failure.
  const effectiveRouteClass = (strategyOverride.lane ?? routeClass) as RouteClass;

  // Precedence: fine-tuned > explicit override > strategy > tenant override > passport > static map
  const modelOverride =
    resolvedFineTunedModel ??
    overrideModel ??
    strategyOverride.model ??
    tenantToggles?.overrideModel?.[effectiveRouteClass] ??
    tenantToggles?.overrideModel?.[routeClass] ??
    _passportDerivedModel;

  const providerOverride = resolvedFineTunedProvider ?? _passportDerivedProvider;

  const route = {
    ...routeModel(effectiveRouteClass, {
      ...(modelOverride !== undefined ? { model: modelOverride } : {}),
      ...(overrideMaxTokens !== undefined ? { maxTokens: overrideMaxTokens } : {}),
      ...(overrideTemperature !== undefined ? { temperature: overrideTemperature } : {}),
    }),
    // Reflect the effective provider in the route for telemetry and policy checks.
    ...(providerOverride !== undefined ? { provider: providerOverride } : {}),
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

  // Updated to the downgraded route on failure/budget-breach; cost and telemetry
  // use this so audit records name the model that actually produced the response.
  let effectiveRoute = route;
  let _effectivePassportId: string | undefined;
  let _effectivePassportDigest: string | undefined;
  let _effectivePassportQuantTier: string | undefined;
  let _effectivePassportAutonomyTier: string | undefined;

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
      // Walk passport downgrade ladder before background_batch sentinel.
      let didDowngradeFallback = false;
      for (const rung of _passportDowngradeLadder) {
        try {
          const downgradedPassport = await resolveViaPassport({
            lane: routeClass,
            passportId: rung.passportId,
            tenantId: tenantToggles?.tenantId,
          }).catch(() => null);

          if (downgradedPassport) {
            const downgradedRoute = {
              ...routeModel(effectiveRouteClass, { model: downgradedPassport.model }),
              provider: downgradedPassport.provider,
            };
            completion = await dispatchCompletion(downgradedRoute);
            effectiveRoute = downgradedRoute;
            _effectivePassportId = downgradedPassport.passportId;
            _effectivePassportDigest = downgradedPassport.signatureDigest;
            _effectivePassportQuantTier = downgradedPassport.quantTier;
            _effectivePassportAutonomyTier = downgradedPassport.autonomyTier;
            usedFallback = true;
            didDowngradeFallback = true;
            break;
          }
        } catch {
          // Try next rung.
        }
      }

      if (!didDowngradeFallback) {
        const fallbackRoute = routeModel('background_batch', (modelOverride !== undefined ? { model: modelOverride } : {}));
        try {
          completion = await dispatchCompletion(fallbackRoute);
          usedFallback = true;
        } catch {
          throw primaryErr;
        }
      }
    }
  } else {
    completion = await dispatchCompletion(route);
  }

  const latencyMs = Date.now() - start;
  const totalTokens = completion.usage?.totalTokens ?? 0;
  let costUsd = estimateCost(effectiveRoute.model, totalTokens);

  // On budget breach, walk the downgrade ladder before throwing.
  if (tenantToggles?.maxCostPerCallUsd != null && costUsd > tenantToggles.maxCostPerCallUsd) {
    let budgetResolved = false;
    for (const rung of _passportDowngradeLadder) {
      try {
        const budgetPassport = await resolveViaPassport({
          lane: routeClass,
          passportId: rung.passportId,
          tenantId: tenantToggles?.tenantId,
          budgetUsdPerCall: tenantToggles.maxCostPerCallUsd,
        }).catch(() => null);

        if (budgetPassport) {
          const budgetRoute = {
            ...routeModel(effectiveRouteClass, { model: budgetPassport.model }),
            provider: budgetPassport.provider,
          };
          const budgetCompletion = await dispatchCompletion(budgetRoute);
          const budgetTotalTokens = budgetCompletion.usage?.totalTokens ?? 0;
          const budgetCostUsd = estimateCost(budgetRoute.model, budgetTotalTokens);
          if (budgetCostUsd <= tenantToggles.maxCostPerCallUsd) {
            completion = budgetCompletion;
            effectiveRoute = budgetRoute;
            costUsd = budgetCostUsd;
            _effectivePassportId = budgetPassport.passportId;
            _effectivePassportDigest = budgetPassport.signatureDigest;
            _effectivePassportQuantTier = budgetPassport.quantTier;
            _effectivePassportAutonomyTier = budgetPassport.autonomyTier;
            usedFallback = true;
            budgetResolved = true;
            break;
          }
        }
      } catch {
        // Try next rung.
      }
    }

    if (!budgetResolved) {
      throw Object.assign(
        new Error(
          `Cost ceiling exceeded: ${costUsd.toFixed(6)} USD > ${tenantToggles.maxCostPerCallUsd} USD limit`,
        ),
        { code: 'COST_CEILING_EXCEEDED' },
      );
    }
  }

  // ── Post-dispatch reflexive confidence floor check ────────────────────
  // The router NEVER throws on a low-confidence completion — that would
  // silently discard a useful response. We surface the breach on telemetry
  // so callers (and the Cognitive Reflexivity Engine itself, via the
  // signal mesh) can react: re-route, escalate, or annotate the trace.
  let confidenceBelowFloor: boolean | undefined;
  if (typeof strategyMinConfidence === 'number') {
    const completionConfidence = extractCompletionConfidence(completion);
    if (completionConfidence !== null && completionConfidence < strategyMinConfidence) {
      confidenceBelowFloor = true;
      // Best-effort warn so the breach is visible in logs even before the
      // signal-mesh telemetry consumer wires up.
      try {
        // eslint-disable-next-line no-console
        console.warn(
          `[model-router] reflexive minConfidence breached: completion=${completionConfidence.toFixed(
            3,
          )} floor=${strategyMinConfidence.toFixed(3)} routeClass=${routeClass} model=${route.model}`,
        );
      } catch {}
    }
  }

  // Prefer effective (downgraded) passport over primary; fall back to caller pre-resolved.
  const passportId =
    _effectivePassportId ?? _resolvedPassportId ?? options._passportId;
  const passportSignatureDigest =
    _effectivePassportDigest ?? _resolvedPassportDigest ?? options._passportSignatureDigest;
  const passportQuantTier =
    _effectivePassportQuantTier ?? _resolvedPassportQuantTier ?? options._passportQuantTier;
  const passportAutonomyTier =
    _effectivePassportAutonomyTier ?? _resolvedPassportAutonomyTier ?? options._passportAutonomyTier;

  const telemetry: ModelRouterTelemetry = {
    routeClass,
    model: effectiveRoute.model,
    provider: effectiveRoute.provider,
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
    ...(appliedStrategyIds.length > 0 ? { reflexiveStrategyIds: appliedStrategyIds } : {}),
    ...(influencedDimensions.length > 0
      ? { reflexiveInfluencedDimensions: influencedDimensions }
      : {}),
    ...(effectiveLane !== routeClass ? { effectiveLane } : {}),
    ...(strategyRetrievalDepth !== undefined ? { reflexiveRetrievalDepth: strategyRetrievalDepth } : {}),
    ...(strategyMinConfidence !== undefined ? { reflexiveMinConfidence: strategyMinConfidence } : {}),
    ...(confidenceBelowFloor ? { reflexiveConfidenceBelowFloor: true } : {}),
    ...(passportId !== undefined ? { passportId } : {}),
    ...(passportSignatureDigest !== undefined ? { passportSignatureDigest } : {}),
    ...(passportQuantTier !== undefined ? { passportQuantTier } : {}),
    ...(passportAutonomyTier !== undefined ? { passportAutonomyTier } : {}),
  };

  void emitTelemetry(telemetry);

  return { completion, route, telemetry };
}

/**
 * Best-effort extraction of a confidence-like signal from a completion.
 * HF/OpenAI completions don't carry a first-class confidence field, so we
 * probe the common shapes used by our adapters: explicit `confidence`,
 * logprobs averages, or a JSON body whose top-level has `confidence`.
 * Returns null when no signal is available — caller should not treat that
 * as a breach.
 */
function extractCompletionConfidence(c: HFCompletionResult): number | null {
  // Direct confidence field on the result (some providers populate this).
  const direct = (c as unknown as { confidence?: unknown }).confidence;
  if (typeof direct === 'number' && Number.isFinite(direct)) {
    return clamp01(direct);
  }
  // logprobs.avg (substrate / oLLM)
  const lp = (c.raw as { logprobs?: { avg?: unknown } } | undefined)?.logprobs?.avg;
  if (typeof lp === 'number' && Number.isFinite(lp)) {
    // logprob is non-positive; map exp(avg) into a probability proxy.
    return clamp01(Math.exp(lp));
  }
  // JSON body with a top-level confidence (common for our planners).
  const txt = (c.content ?? '').trim();
  if (txt.startsWith('{')) {
    try {
      const obj = JSON.parse(txt) as { confidence?: unknown };
      if (typeof obj.confidence === 'number' && Number.isFinite(obj.confidence)) {
        return clamp01(obj.confidence);
      }
    } catch {}
  }
  return null;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
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
