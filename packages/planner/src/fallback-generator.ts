import { randomUUID } from 'crypto';
import type { PlanGraph, PlanStep } from './types.js';

export interface FallbackOptions {
  /** number of fallback plans to generate (0..5) */
  count: number;
  /** how aggressive to make each fallback (0=identical, 1=very different) */
  intensity?: number;
}

/**
 * Generate top-N counterfactual plans. Each fallback flips one or more
 * characteristics of the primary plan (model preference, parallelism, approval
 * strictness) so the orchestrator can choose a different trade-off when the
 * primary plan is blocked / over-budget / fails verification.
 */
export function generateFallbackPlans(primary: PlanGraph, opts: FallbackOptions): PlanGraph[] {
  const count = Math.max(0, Math.min(5, opts.count));
  if (count === 0) return [];
  const strategies: Array<(p: PlanGraph) => PlanGraph> = [
    cheaperFallback,
    safeFallback,
    fasterFallback,
    moreEvidenceFallback,
    isolatedFallback,
  ];
  return strategies.slice(0, count).map((make, i) => {
    const fb = make(primary);
    return {
      ...fb,
      planId: randomUUID(),
      parentPlanId: undefined,
      fallbackOf: primary.planId,
      rank: i + 1,
      title: `${primary.title} — fallback ${i + 1}`,
      fallbacks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });
}

function withSteps(primary: PlanGraph, mapStep: (s: PlanStep) => PlanStep): PlanGraph {
  const steps = primary.steps.map(mapStep);
  const estimatedCostUsd = steps.reduce((sum, s) => sum + s.route.estimatedCostUsd, 0);
  const estimatedRisk = avg(steps.map((s) => s.estimatedRisk));
  const estimatedValue = avg(steps.map((s) => s.estimatedValue));
  return {
    ...primary,
    steps,
    estimatedCostUsd,
    estimatedRisk,
    estimatedValue,
  };
}

function avg(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

function cheaperFallback(p: PlanGraph): PlanGraph {
  // Halve estimated cost; bias triage/summarization classes downward.
  return withSteps(p, (s) => ({
    ...s,
    route: {
      ...s.route,
      estimatedCostUsd: s.route.estimatedCostUsd * 0.5,
      selectedBy: 'cost',
    },
    metadata: { ...s.metadata, fallbackKind: 'cheaper' },
  }));
}

function safeFallback(p: PlanGraph): PlanGraph {
  // Force approval for any non-low risk step; keeps risk distribution intact.
  return withSteps(p, (s) => ({
    ...s,
    requiredApproval: s.requiredApproval || s.estimatedRisk >= 0.25,
    approvalReason:
      s.requiredApproval || s.estimatedRisk >= 0.25
        ? (s.approvalReason ?? 'safe-fallback policy')
        : s.approvalReason,
    metadata: { ...s.metadata, fallbackKind: 'safer' },
  }));
}

function fasterFallback(p: PlanGraph): PlanGraph {
  // Drop dependencies between non-critical steps so they can run in parallel.
  return withSteps(p, (s) => ({
    ...s,
    dependsOn: s.estimatedRisk >= 0.5 ? s.dependsOn : [],
    metadata: { ...s.metadata, fallbackKind: 'faster' },
  }));
}

function moreEvidenceFallback(p: PlanGraph): PlanGraph {
  return withSteps(p, (s) => ({
    ...s,
    requiredEvidence:
      s.requiredEvidence.length === 0
        ? ['citation', 'verifier-pass']
        : Array.from(new Set([...s.requiredEvidence, 'citation'])),
    metadata: { ...s.metadata, fallbackKind: 'more-evidence' },
  }));
}

function isolatedFallback(p: PlanGraph): PlanGraph {
  // Force every step through its own approval; assumes worst-case context.
  return withSteps(p, (s) => ({
    ...s,
    requiredApproval: true,
    approvalReason: s.approvalReason ?? 'isolated-fallback policy',
    metadata: { ...s.metadata, fallbackKind: 'isolated' },
  }));
}
