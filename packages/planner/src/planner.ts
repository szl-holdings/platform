import { randomUUID } from "crypto";
import {
  PlanContextSchema,
  type PlanContext,
  type PlanGraph,
  type PlanStep,
} from "./types.js";
import { decomposeObjective } from "./decomposer.js";
import { routePlanSteps } from "./router.js";
import { estimateRiskAndApprovals, levelForRisk, topoSort } from "./risk-estimator.js";
import { generateFallbackPlans } from "./fallback-generator.js";
import { rankFallbacks } from "./ranker.js";
import { defaultPlanStore, type PlanStore } from "./store.js";

/**
 * Result of {@link createPlan}.
 *
 * NOTE: createPlan returns BOTH the primary plan graph AND the ranked
 * counterfactual fallback graphs. The primary's `fallbacks` field contains
 * the ids of the returned fallback graphs in priority order — callers that
 * only want the primary can read `result.primary`.
 */
export interface CreatePlanResult {
  primary: PlanGraph;
  fallbacks: PlanGraph[];
}

/**
 * Build a plan graph for the given objective:
 *   1. Decompose into steps (or use caller-provided seeds).
 *   2. Route each step to a model/tool via @szl-holdings/ai-control-plane.
 *   3. Estimate per-step risk, gate high-risk steps with approvals + rollbacks.
 *   4. Topologically sort by dependencies — throws on cycles.
 *   5. Generate counterfactual fallback plans.
 *   6. Rank fallbacks via @szl-holdings/decision-engine priority scoring.
 *   7. Persist primary + fallbacks to the configured PlanStore.
 */
export async function createPlan(
  objective: string,
  context: PlanContext = {},
  options: { store?: PlanStore; persist?: boolean } = {},
): Promise<CreatePlanResult> {
  if (!objective || !objective.trim()) {
    throw new Error("objective must be a non-empty string");
  }
  const ctx = PlanContextSchema.parse(context);
  const store = options.store ?? defaultPlanStore;
  const persist = options.persist ?? true;

  const decomposed = decomposeObjective(objective, ctx);
  const routed = routePlanSteps(decomposed, ctx);
  const risked = estimateRiskAndApprovals(routed, ctx);
  const order = topoSort(risked);

  const now = Date.now();
  const planId = randomUUID();
  const aggregateRisk = avg(risked.map((s) => s.estimatedRisk));
  const aggregateValue = avg(risked.map((s) => s.estimatedValue));
  const aggregateCost = risked.reduce((sum, s) => sum + s.route.estimatedCostUsd, 0);

  const primary: PlanGraph = {
    planId,
    rank: 0,
    title: deriveTitle(objective),
    objective,
    status: "draft",
    steps: risked,
    executionOrder: order,
    estimatedCostUsd: aggregateCost,
    estimatedValue: aggregateValue,
    estimatedRisk: aggregateRisk,
    riskLevel: levelForRisk(aggregateRisk),
    confidence: deriveConfidence(risked),
    fallbacks: [],
    context: contextSnapshot(ctx),
    metadata: ctx.metadata,
    createdAt: now,
    updatedAt: now,
  };

  const rawFallbacks = generateFallbackPlans(primary, { count: ctx.fallbackCount });
  const fallbacks = rankFallbacks(primary, rawFallbacks);
  primary.fallbacks = fallbacks.map((f) => f.planId);
  // Re-sort fallbacks (faster fallback drops deps so order needs recompute).
  for (const fb of fallbacks) {
    try {
      fb.executionOrder = topoSort(fb.steps);
    } catch {
      // leave default order if cycle introduced (shouldn't happen)
    }
  }

  if (persist) {
    await store.put(primary);
    for (const fb of fallbacks) await store.put(fb);
  }

  return { primary, fallbacks };
}

function deriveTitle(objective: string): string {
  const cleaned = objective.trim().replace(/\s+/g, " ");
  return cleaned.length <= 80 ? cleaned : cleaned.slice(0, 77) + "…";
}

function deriveConfidence(steps: PlanStep[]): number {
  if (steps.length === 0) return 0.5;
  const value = avg(steps.map((s) => s.estimatedValue));
  const risk = avg(steps.map((s) => s.estimatedRisk));
  const score = 0.4 + 0.6 * value - 0.4 * risk;
  return Math.max(0, Math.min(1, score));
}

function avg(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

function contextSnapshot(ctx: ReturnType<typeof PlanContextSchema.parse>): Record<string, unknown> {
  return {
    agentId: ctx.agentId,
    sessionId: ctx.sessionId,
    workflowId: ctx.workflowId,
    traceId: ctx.traceId,
    orgId: ctx.orgId,
    agentTier: ctx.agentTier,
    approvalThreshold: ctx.approvalThreshold,
    maxBudgetUsd: ctx.maxBudgetUsd,
  };
}

/**
 * Replay a plan: returns the planned execution order along with the route +
 * approval decisions. Useful for "what would I do?" questions and trace diffs.
 */
export async function replayPlan(
  planId: string,
  options: { store?: PlanStore } = {},
): Promise<{
  plan: PlanGraph;
  steps: Array<{
    stepId: string;
    title: string;
    routeProvider?: string;
    routeModel?: string;
    requiredApproval: boolean;
    riskLevel: PlanStep["riskLevel"];
  }>;
}> {
  const store = options.store ?? defaultPlanStore;
  const plan = await store.get(planId);
  if (!plan) {
    const { PlanNotFoundError } = await import("./types.js");
    throw new PlanNotFoundError(planId);
  }
  const byId = new Map(plan.steps.map((s) => [s.stepId, s] as const));
  const steps = plan.executionOrder
    .map((id) => byId.get(id))
    .filter((s): s is PlanStep => Boolean(s))
    .map((s) => ({
      stepId: s.stepId,
      title: s.title,
      routeProvider: s.route.modelProvider,
      routeModel: s.route.model,
      requiredApproval: s.requiredApproval,
      riskLevel: s.riskLevel,
    }));
  return { plan, steps };
}
