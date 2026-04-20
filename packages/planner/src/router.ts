import { modelRouter } from '@szl-holdings/ai-control-plane/router';
import type { PlanStep, ResolvedPlanContext, RouteDecision } from './types.js';

/**
 * Resolve a routing decision for each step using @workspace/ai-control-plane's
 * model router. If routing fails for any reason, leave the existing route in
 * place and mark `selectedBy = "manual"` so callers know it was not auto-routed.
 */
export function routePlanSteps(steps: PlanStep[], context: ResolvedPlanContext): PlanStep[] {
  return steps.map((step) => {
    try {
      const result = modelRouter.route({
        routeClass: step.route.routeClass,
        promptTokenEstimate: 1500,
        orgId: context.orgId,
        agentTier: context.agentTier,
        maxBudgetUsd: context.maxBudgetUsd,
      });
      const route: RouteDecision = {
        ...step.route,
        modelProvider: result.endpoint.provider,
        model: result.endpoint.model,
        estimatedCostUsd: result.estimatedCostUsd ?? step.route.estimatedCostUsd,
        selectedBy: result.selectedBy,
        fallbackChain: result.fallbackChain.slice(0, 3).map((e) => ({
          provider: e.provider,
          model: e.model,
        })),
      };
      return { ...step, route };
    } catch {
      return { ...step, route: { ...step.route, selectedBy: 'manual' } };
    }
  });
}
