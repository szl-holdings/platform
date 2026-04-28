/**
 * Gateway Adapter — typed, domain-context-aware wrapper over the governed inference pipeline.
 *
 * Vertical apps import `createGatewayAdapter` and call respond/triage/extract/plan
 * without knowing about routing, fallback chains, or governance internals.
 *
 * - `respond()` calls `chatCompletionWithFallback` for unstructured text replies.
 * - `triage()`, `extract()`, `plan()` call `governedStructuredCall` with the canonical
 *   domain schemas (TriageDecisionZ, ExtractedEntitiesZ, PlanningResultZ). This means:
 *   • Output is validated against the Zod schema — no manual parsing
 *   • Refusals are first-class governance events recorded in the Proof Chain
 *   • Covenant policy is checked before the result is returned
 *
 * Strategy influence on model routing:
 *   - `cheapest`  → Qwen3-0.6B, capped token budget
 *   - `fastest`   → same primary model, reduced token limit
 *   - `fallback`  → secondary model (Qwen3-8B)
 *   - `preferred` → primary model configured per route class (default)
 *
 * Usage:
 *   const ai = createGatewayAdapter({ domain: 'vessels', agentId: 'maritime-triage' });
 *   const result = await ai.triage('Review this AIS alert for vessel XYZ...');
 *   if (result.outcome === 'success') console.log(result.payload.priority);
 */

import {
  extractedEntitiesSchema,
  type ExtractedEntitiesZ,
  planningResultSchema,
  type PlanningResultZ,
  triageDecisionSchema,
  type TriageDecisionZ,
} from '@szl-holdings/schemas/ai';
import { chatCompletionWithFallback, type HFChatMessage } from './providers/hf-client.js';
import { governedStructuredCall, type GovernedCallResult } from './governed-structured-call.js';
import { routeModel, type RouteClass } from './providers/hf-router.js';

export type AdapterRoutingStrategy = 'fastest' | 'cheapest' | 'preferred' | 'fallback';

export interface AdapterContext {
  domain: string;
  agentId: string;
  strategy?: AdapterRoutingStrategy;
  systemPrompt?: string;
}

export interface RespondResult {
  content: string;
  model: string;
  provider: string;
  domain: string;
  agentId: string;
  routeClass: 'reasoning';
  strategy: AdapterRoutingStrategy;
  latencyMs: number;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
}

export type TriageResult =
  | { outcome: 'success'; payload: TriageDecisionZ; runId: string; provenance: GovernedCallResult<TriageDecisionZ>['provenance'] }
  | { outcome: 'refusal'; runId: string; incidentId: string; reason: string }
  | { outcome: 'policy_block'; runId: string; failedRules: string[] };

export type ExtractResult =
  | { outcome: 'success'; payload: ExtractedEntitiesZ; runId: string; provenance: GovernedCallResult<ExtractedEntitiesZ>['provenance'] }
  | { outcome: 'refusal'; runId: string; incidentId: string; reason: string }
  | { outcome: 'policy_block'; runId: string; failedRules: string[] };

export type PlanResult =
  | { outcome: 'success'; payload: PlanningResultZ; runId: string; provenance: GovernedCallResult<PlanningResultZ>['provenance'] }
  | { outcome: 'refusal'; runId: string; incidentId: string; reason: string }
  | { outcome: 'policy_block'; runId: string; failedRules: string[] };

export interface StructuredAdapterResult<T> {
  outcome: 'success' | 'refusal' | 'policy_block';
  payload?: T;
  runId: string;
}

function resolveStrategyOverrides(
  strategy: AdapterRoutingStrategy,
  baseMaxTokens: number,
): { model?: string; maxTokens?: number } {
  switch (strategy) {
    case 'cheapest':
      return {
        model: process.env.HF_FALLBACK_LLM || 'Qwen/Qwen3-0.6B',
        maxTokens: Math.min(baseMaxTokens, 512),
      };
    case 'fastest':
      return { maxTokens: Math.min(baseMaxTokens, 768) };
    case 'fallback':
      return { model: process.env.HF_SECONDARY_LLM || 'Qwen/Qwen3-8B' };
    case 'preferred':
    default:
      return {};
  }
}

function buildRoute(
  routeClass: RouteClass,
  strategy: AdapterRoutingStrategy,
  baseMaxTokens: number,
  overrides?: { maxTokens?: number; temperature?: number },
) {
  const strategyOverrides = resolveStrategyOverrides(strategy, baseMaxTokens);
  return routeModel(routeClass, {
    ...strategyOverrides,
    maxTokens: overrides?.maxTokens ?? strategyOverrides.maxTokens,
    temperature: overrides?.temperature,
  });
}

function buildMessages(
  ctx: AdapterContext,
  userContent: string,
  taskPrompt: string,
): HFChatMessage[] {
  const systemContent =
    ctx.systemPrompt ??
    `You are ${ctx.agentId}, an AI agent operating in the ${ctx.domain} domain. ` +
      `${taskPrompt} Produce concise, structured, actionable output.`;

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];
}

export interface GatewayAdapter {
  respond(userContent: string, options?: { maxTokens?: number }): Promise<RespondResult>;
  triage(userContent: string, options?: { maxTokens?: number }): Promise<TriageResult>;
  extract(userContent: string, options?: { maxTokens?: number }): Promise<ExtractResult>;
  plan(userContent: string, options?: { maxTokens?: number }): Promise<PlanResult>;
}

export function createGatewayAdapter(ctx: AdapterContext): GatewayAdapter {
  const strategy: AdapterRoutingStrategy = ctx.strategy ?? 'preferred';

  return {
    async respond(userContent, options) {
      const messages = buildMessages(
        ctx,
        userContent,
        'Answer the question or request directly with domain expertise.',
      );
      const route = buildRoute('reasoning', strategy, options?.maxTokens ?? 2048, options);
      const result = await chatCompletionWithFallback(messages, route);

      return {
        content: result.content,
        model: result.model,
        provider: result.provider,
        domain: ctx.domain,
        agentId: ctx.agentId,
        routeClass: 'reasoning',
        strategy,
        latencyMs: result.latencyMs,
        usage: result.usage,
      };
    },

    async triage(userContent, options) {
      const messages = buildMessages(
        ctx,
        userContent,
        'Triage the input: assign priority (P0–P4), urgency (immediate/urgent/standard/deferred), ' +
          'category, routeTo, summary, keyEntities (with confidence scores), suggestedActions, ' +
          'requiresHumanReview, and overall confidence (0–1).',
      );
      const route = buildRoute('triage', strategy, options?.maxTokens ?? 1024, options);

      try {
        const governed = await governedStructuredCall(messages, route, triageDecisionSchema, {
          domain: ctx.domain,
          schemaName: 'triageDecision',
          agentId: ctx.agentId,
          riskTier: 'medium',
        });
        return {
          outcome: 'success',
          payload: governed.result,
          runId: governed.runId,
          provenance: governed.provenance,
        };
      } catch (err: unknown) {
        const e = err as { name?: string; runId?: string; incidentId?: string; reason?: string; failedRules?: string[]; message?: string };
        if (e?.name === 'RefusalError') {
          return { outcome: 'refusal', runId: e.runId ?? '', incidentId: e.incidentId ?? '', reason: e.message ?? 'Refusal' };
        }
        if (e?.name === 'PolicyBlockError') {
          return { outcome: 'policy_block', runId: e.runId ?? '', failedRules: e.failedRules ?? [] };
        }
        throw err;
      }
    },

    async extract(userContent, options) {
      const messages = buildMessages(
        ctx,
        userContent,
        'Extract all named entities, relationships, and key facts from the input. ' +
          'For each entity include type (person/organization/location/asset/vulnerability/indicator/date/amount/reference), ' +
          'value, confidence (0–1), and context. Include a summary and overall confidence.',
      );
      const route = buildRoute('extraction', strategy, options?.maxTokens ?? 1024, options);

      try {
        const governed = await governedStructuredCall(messages, route, extractedEntitiesSchema, {
          domain: ctx.domain,
          schemaName: 'extractedEntities',
          agentId: ctx.agentId,
          riskTier: 'low',
        });
        return {
          outcome: 'success',
          payload: governed.result,
          runId: governed.runId,
          provenance: governed.provenance,
        };
      } catch (err: unknown) {
        const e = err as { name?: string; runId?: string; incidentId?: string; reason?: string; failedRules?: string[]; message?: string };
        if (e?.name === 'RefusalError') {
          return { outcome: 'refusal', runId: e.runId ?? '', incidentId: e.incidentId ?? '', reason: e.message ?? 'Refusal' };
        }
        if (e?.name === 'PolicyBlockError') {
          return { outcome: 'policy_block', runId: e.runId ?? '', failedRules: e.failedRules ?? [] };
        }
        throw err;
      }
    },

    async plan(userContent, options) {
      const messages = buildMessages(
        ctx,
        userContent,
        'Recommend a specific action to take. Provide: action (what to do), ' +
          'actionType (approve/escalate/defer/route/close/investigate), confidence (0–1), ' +
          'evidence items (source, sourceType, content, relevanceScore), impactedOwner, ' +
          'approvalRequired (bool), approvalLevel (none/operator/manager/executive), ' +
          'reasoning (why this action), and alternatives with tradeoffs.',
      );
      const route = buildRoute('planning', strategy, options?.maxTokens ?? 2048, options);

      try {
        const governed = await governedStructuredCall(messages, route, planningResultSchema, {
          domain: ctx.domain,
          schemaName: 'planningResult',
          agentId: ctx.agentId,
          riskTier: 'high',
        });
        return {
          outcome: 'success',
          payload: governed.result,
          runId: governed.runId,
          provenance: governed.provenance,
        };
      } catch (err: unknown) {
        const e = err as { name?: string; runId?: string; incidentId?: string; reason?: string; failedRules?: string[]; message?: string };
        if (e?.name === 'RefusalError') {
          return { outcome: 'refusal', runId: e.runId ?? '', incidentId: e.incidentId ?? '', reason: e.message ?? 'Refusal' };
        }
        if (e?.name === 'PolicyBlockError') {
          return { outcome: 'policy_block', runId: e.runId ?? '', failedRules: e.failedRules ?? [] };
        }
        throw err;
      }
    },
  };
}
