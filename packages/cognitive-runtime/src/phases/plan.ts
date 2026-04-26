import { createPlan, type PlanContext, type PlanGraph } from '@workspace/planner';
import { globalCollector } from '@workspace/cognitive-observability';
import type { ToolRegistry } from '@workspace/tool-mesh';
import type { PhaseResult } from '../types.js';
import type { OrientOutput } from './orient.js';

export interface PlanRevisionContext {
  revision: number;
  verifierFindings: string;
  reflectionLesson: string;
}

export interface PlanPhaseOptions {
  agentId?: string;
  sessionId?: string;
  traceId?: string;
  agentTier?: PlanContext['agentTier'];
  maxBudgetUsd?: number;
  maxRetries?: number;
  domain?: string;
  revisionContext?: PlanRevisionContext;
  // Optional pinning of routing — used by callers (e.g. eval variant replay)
  // that want every plan step to use a specific provider/model and prompt
  // version. Overrides are applied AFTER the planner's normal routing so they
  // win deterministically regardless of router heuristics.
  preferredProvider?: string;
  preferredModel?: string;
  promptVersionId?: string;
  /**
   * Tool registry for progressive discovery. When provided and the registry
   * contains more tools than the discovery threshold, `createPlan` will
   * annotate each step with discovered tool IDs via BM25 keyword search so
   * the execute phase can generate typed stubs and route tool calls accurately.
   */
  toolRegistry?: ToolRegistry;
  discoveryThresholdCount?: number;
  maxToolsPerStep?: number;
}

export interface PlanPhaseOutput {
  planId: string;
  stepCount: number;
  executionOrder: string[];
  riskLevel: PlanGraph['riskLevel'];
  confidence: PlanGraph['confidence'];
  estimatedCostUsd: number;
  fallbackCount: number;
  plan: PlanGraph;
  summary: string;
  revision: number;
}

export async function planPhase(
  objective: string,
  orientOutput: OrientOutput,
  opts: PlanPhaseOptions = {},
): Promise<PhaseResult & { output?: PlanPhaseOutput }> {
  const startedAt = Date.now();
  const revision = opts.revisionContext?.revision ?? 0;

  const planObjective = opts.revisionContext
    ? `${objective}\n\n[REVISION ${revision} — Verifier feedback: ${opts.revisionContext.verifierFindings}. Lesson: ${opts.revisionContext.reflectionLesson}]`
    : objective;

  const planContext: PlanContext = {
    agentId: opts.agentId,
    sessionId: opts.sessionId,
    traceId: opts.traceId,
    agentTier: opts.agentTier ?? 'analyst',
    maxBudgetUsd: opts.maxBudgetUsd,
    fallbackCount: 2,
    approvalThreshold: orientOutput.riskScore > 0.7 ? 'medium' : 'high',
    metadata: {
      domain: opts.domain,
      noveltyScore: orientOutput.noveltyScore,
      riskScore: orientOutput.riskScore,
      worldModelEntities: orientOutput.entityCount,
      revision,
    },
  };

  let plan: PlanGraph;
  let retryCount = 0;
  const maxRetries = opts.maxRetries ?? 2;

  while (true) {
    try {
      plan = await createPlan(planObjective, planContext, {
        persist: true,
        ...(opts.toolRegistry ? { toolRegistry: opts.toolRegistry } : {}),
        ...(opts.discoveryThresholdCount !== undefined
          ? { discoveryThresholdCount: opts.discoveryThresholdCount }
          : {}),
        ...(opts.maxToolsPerStep !== undefined ? { maxToolsPerStep: opts.maxToolsPerStep } : {}),
      });
      break;
    } catch (err) {
      retryCount++;
      if (retryCount > maxRetries) {
        const completedAt = Date.now();
        return {
          phase: 'plan',
          status: 'error',
          startedAt,
          completedAt,
          durationMs: completedAt - startedAt,
          error: err instanceof Error ? err.message : String(err),
          retryCount,
          metadata: { revision },
        };
      }
    }
  }

  // ── Observability: BM25 progressive discovery coverage ───────────────────
  // Measure what fraction of plan steps received discoveredToolIds from BM25
  // search. A ratio of 1.0 means every step had relevant tools pre-discovered;
  // 0.0 means the registry was below the discovery threshold.
  if (plan?.steps && plan.steps.length > 0) {
    const stepsWithDiscovery = plan.steps.filter(
      (s) => Array.isArray(s.metadata?.discoveredToolIds) && (s.metadata?.discoveredToolIds as string[]).length > 0,
    ).length;
    globalCollector.recordKnown('discovery_cache_hit_rate', stepsWithDiscovery / plan.steps.length, {
      planId: plan.planId,
      agentId: opts.agentId ?? 'unknown',
      revision: String(opts.revisionContext?.revision ?? 0),
    });
  }

  // Apply caller-pinned routing overrides. This is what allows eval variant
  // replay to actually exercise a specific provider/model + prompt version
  // through the cognitive loop (rather than only influencing observability
  // metadata).
  if (opts.preferredProvider || opts.preferredModel || opts.promptVersionId) {
    plan!.steps = plan?.steps.map((step) => ({
      ...step,
      route: {
        ...step.route,
        modelProvider: opts.preferredProvider ?? step.route.modelProvider,
        model: opts.preferredModel ?? step.route.model,
        selectedBy:
          opts.preferredProvider || opts.preferredModel ? 'preferred' : step.route.selectedBy,
      },
      metadata: {
        ...step.metadata,
        ...(opts.promptVersionId ? { promptVersionId: opts.promptVersionId } : {}),
      },
    }));
  }

  const output: PlanPhaseOutput = {
    planId: plan?.planId,
    stepCount: plan?.steps.length,
    executionOrder: plan?.executionOrder,
    riskLevel: plan?.riskLevel,
    confidence: plan?.confidence,
    estimatedCostUsd: plan?.estimatedCostUsd,
    fallbackCount: plan?.fallbacks.length,
    plan: plan!,
    revision,
    summary:
      `Plan '${plan?.title}' created (revision ${revision}) with ${plan?.steps.length} step(s), ` +
      `risk=${plan?.riskLevel}, confidence=${plan?.confidence.toFixed(2)}, ` +
      `estimated cost=$${plan?.estimatedCostUsd.toFixed(4)}.`,
  };

  const completedAt = Date.now();
  return {
    phase: 'plan',
    status: 'ok',
    startedAt,
    completedAt,
    durationMs: completedAt - startedAt,
    output,
    retryCount,
    metadata: { planId: plan?.planId, stepCount: plan?.steps.length, revision },
  };
}
