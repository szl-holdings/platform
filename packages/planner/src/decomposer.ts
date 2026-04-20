import { randomUUID } from 'crypto';
import type { PlanStep, ResolvedPlanContext, RouteDecision } from './types.js';

/**
 * Heuristic objective decomposer. Splits an objective into a baseline
 * Perceive → Plan → Act → Verify → Reflect skeleton, then layers in any
 * explicit seeds the caller provided. Pure & deterministic given inputs.
 */
export function decomposeObjective(objective: string, context: ResolvedPlanContext): PlanStep[] {
  if (context.seeds.length > 0) {
    return seedSteps(context);
  }
  return baselineSteps(objective);
}

function defaultRoute(routeClass: RouteDecision['routeClass']): RouteDecision {
  return {
    routeClass,
    selectedBy: 'priority',
    estimatedCostUsd: 0,
    fallbackChain: [],
  };
}

function baselineSteps(objective: string): PlanStep[] {
  const trimmed = objective.trim().replace(/[.\s]+$/, '');
  const steps: Array<Omit<PlanStep, 'stepId' | 'index' | 'dependsOn'> & { dependsOn?: string[] }> =
    [
      {
        title: 'Perceive',
        description: `Gather signals and context relevant to: ${trimmed}.`,
        status: 'pending',
        route: defaultRoute('extraction'),
        estimatedValue: 0.5,
        estimatedRisk: 0.05,
        riskLevel: 'low',
        requiredEvidence: [],
        requiredApproval: false,
        rollbackPoints: [],
        inputs: { objective: trimmed },
        metadata: { phase: 'perceive' },
      },
      {
        title: 'Plan',
        description: `Reason over context and propose action(s) to satisfy: ${trimmed}.`,
        status: 'pending',
        route: defaultRoute('planning'),
        estimatedValue: 0.6,
        estimatedRisk: 0.1,
        riskLevel: 'low',
        requiredEvidence: [],
        requiredApproval: false,
        rollbackPoints: [],
        inputs: {},
        metadata: { phase: 'plan' },
      },
      {
        title: 'Act',
        description: `Execute the recommended action(s). High-impact change point.`,
        status: 'pending',
        route: defaultRoute('generation'),
        estimatedValue: 0.9,
        estimatedRisk: 0.55,
        riskLevel: 'high',
        requiredEvidence: ['plan-output'],
        requiredApproval: false,
        rollbackPoints: [],
        inputs: {},
        metadata: { phase: 'act' },
      },
      {
        title: 'Verify',
        description: `Strict pre/post checks against the action's effects.`,
        status: 'pending',
        route: defaultRoute('classification'),
        estimatedValue: 0.7,
        estimatedRisk: 0.05,
        riskLevel: 'low',
        requiredEvidence: ['act-output'],
        requiredApproval: false,
        rollbackPoints: [],
        inputs: {},
        metadata: { phase: 'verify' },
      },
      {
        title: 'Reflect',
        description: `Score the run and emit lessons / candidate skills.`,
        status: 'pending',
        route: defaultRoute('summarization'),
        estimatedValue: 0.4,
        estimatedRisk: 0.02,
        riskLevel: 'low',
        requiredEvidence: ['verify-output'],
        requiredApproval: false,
        rollbackPoints: [],
        inputs: {},
        metadata: { phase: 'reflect' },
      },
    ];

  const ids: string[] = [];
  return steps.map((s, i) => {
    const stepId = randomUUID();
    ids.push(stepId);
    return {
      ...s,
      stepId,
      index: i,
      dependsOn: i === 0 ? [] : [ids[i - 1]!],
    };
  });
}

function seedSteps(context: ResolvedPlanContext): PlanStep[] {
  // First pass: assign ids by seed-index so seed.dependsOn (which uses indices
  // OR titles) can be resolved.
  const ids = context.seeds.map(() => randomUUID());
  const titleToIndex = new Map<string, number>();
  context.seeds.forEach((s, i) => titleToIndex.set(s.title, i));

  return context.seeds.map((seed, i) => {
    const dependsOn = (seed.dependsOn ?? [])
      .map((d) => {
        const asIdx = Number(d);
        if (Number.isFinite(asIdx) && asIdx >= 0 && asIdx < ids.length) return ids[asIdx]!;
        const byTitle = titleToIndex.get(d);
        if (byTitle !== undefined) return ids[byTitle]!;
        return d; // already an id
      })
      .filter((id, idx, arr) => arr.indexOf(id) === idx);

    return {
      stepId: ids[i]!,
      index: i,
      title: seed.title,
      description: seed.description ?? '',
      dependsOn,
      status: 'pending',
      route: {
        ...defaultRoute(seed.routeClass ?? 'generation'),
        toolId: seed.toolId,
      },
      estimatedValue: seed.estimatedValue ?? 0.5,
      estimatedRisk: seed.estimatedRisk ?? 0.1,
      riskLevel: 'low',
      requiredEvidence: seed.requiredEvidence ?? [],
      requiredApproval: seed.requiredApproval ?? false,
      rollbackPoints: [],
      inputs: {},
      metadata: { phase: 'custom' },
    };
  });
}
