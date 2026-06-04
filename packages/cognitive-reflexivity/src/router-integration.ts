/**
 * Router integration — turns active reflexive strategies into concrete
 * adaptations the model router can apply on a given decision.
 *
 * The model router calls `applyStrategiesToDecision` before dispatch.
 * Active 'router.constraint' strategies are translated into resolved
 * lane / model / minConfidence overrides; 'router.retrieval-bias'
 * strategies bump retrieval depth.
 *
 * Every applied strategy is recorded as a StrategyDecisionTrace so the
 * reflexivity panel can show "this run was influenced by these
 * strategies" with a click-through to provenance.
 */

import { randomUUID } from 'node:crypto';
import { defaultStrategyRegistry, type StrategyRegistry } from './strategies';
import type { ReflexiveStrategy } from './types';

export interface RouterDecisionInput {
  decisionId?: string;
  agentId?: string;
  routeClass: string; // matches lib/ai-engine route class
  // Defaults the router computed before strategies were applied
  defaults: {
    lane?: string;
    model?: string;
    retrievalDepth?: number;
    minConfidence?: number;
  };
}

export interface RouterDecisionResult {
  decisionId: string;
  lane?: string;
  model?: string;
  retrievalDepth?: number;
  minConfidence?: number;
  appliedStrategyIds: string[];
  influencedDimensions: ('lane' | 'model' | 'retrieval-depth' | 'confidence-floor')[];
}

export function applyStrategiesToDecision(
  input: RouterDecisionInput,
  registry: StrategyRegistry = defaultStrategyRegistry,
): RouterDecisionResult {
  const decisionId = input.decisionId ?? randomUUID();
  const result: RouterDecisionResult = {
    decisionId,
    lane: input.defaults.lane,
    model: input.defaults.model,
    retrievalDepth: input.defaults.retrievalDepth,
    minConfidence: input.defaults.minConfidence,
    appliedStrategyIds: [],
    influencedDimensions: [],
  };

  const candidates = registry
    .active()
    .filter((s) => isApplicable(s, input));

  for (const strat of candidates) {
    const before = { ...result };
    if (strat.class === 'router.constraint') {
      const lane = strat.params['suggestedLane'];
      const model = strat.params['suggestedModel'];
      const minConf = strat.params['minConfidence'];
      if (typeof lane === 'string' && lane.length > 0) {
        result.lane = lane;
        result.influencedDimensions.push('lane');
      }
      if (typeof model === 'string' && model.length > 0) {
        result.model = model;
        result.influencedDimensions.push('model');
      }
      if (typeof minConf === 'number' && Number.isFinite(minConf)) {
        result.minConfidence = Math.max(result.minConfidence ?? 0, minConf);
        result.influencedDimensions.push('confidence-floor');
      }
    } else if (strat.class === 'router.retrieval-bias') {
      const delta = strat.params['depthDelta'];
      if (typeof delta === 'number' && Number.isFinite(delta)) {
        result.retrievalDepth = (result.retrievalDepth ?? 0) + delta;
        result.influencedDimensions.push('retrieval-depth');
      }
    }
    // record only if this strategy actually moved something
    const moved =
      before.lane !== result.lane ||
      before.model !== result.model ||
      before.minConfidence !== result.minConfidence ||
      before.retrievalDepth !== result.retrievalDepth;
    if (moved) {
      result.appliedStrategyIds.push(strat.strategyId);
      registry.reinforce(strat.strategyId, true);
    }
  }

  // de-dupe influenced dimensions
  result.influencedDimensions = Array.from(new Set(result.influencedDimensions));

  registry.recordDecisionTrace({
    decisionId: result.decisionId,
    agentId: input.agentId,
    appliedStrategyIds: result.appliedStrategyIds,
    influencedDimensions: result.influencedDimensions,
    resolved: {
      lane: result.lane,
      model: result.model,
      retrievalDepth: result.retrievalDepth,
      minConfidence: result.minConfidence,
    },
    occurredAt: new Date().toISOString(),
  });

  return result;
}

function isApplicable(strategy: ReflexiveStrategy, input: RouterDecisionInput): boolean {
  if (strategy.applicableContexts.length === 0) return true;
  const agentTag = input.agentId ? `agent:${input.agentId}` : null;
  const routeTag = `route:${input.routeClass}`;
  return strategy.applicableContexts.some(
    (ctx) =>
      (agentTag && ctx === agentTag) ||
      ctx === routeTag ||
      ctx.startsWith('subtype:'),
  );
}
