import type { PlanStep, ResolvedPlanContext, RiskLevel, RollbackPoint } from './types.js';
import { PlanCycleError } from './types.js';

const RISK_RANK: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 };

export function levelForRisk(risk: number): RiskLevel {
  if (risk >= 0.75) return 'critical';
  if (risk >= 0.5) return 'high';
  if (risk >= 0.25) return 'medium';
  return 'low';
}

/**
 * Compute riskLevel + approval gating + rollback points for every step.
 * Steps with risk at or above the configured threshold automatically get an
 * approval gate and a rollback point so the orchestrator can park / unwind.
 */
export function estimateRiskAndApprovals(
  steps: PlanStep[],
  context: ResolvedPlanContext,
): PlanStep[] {
  const threshold = RISK_RANK[context.approvalThreshold];
  return steps.map((step) => {
    const riskLevel = levelForRisk(step.estimatedRisk);
    const requiresApprovalByRisk = RISK_RANK[riskLevel] >= threshold;
    const requiredApproval = step.requiredApproval || requiresApprovalByRisk;
    const rollbackPoints: RollbackPoint[] = [...step.rollbackPoints];
    if (RISK_RANK[riskLevel] >= RISK_RANK.high && rollbackPoints.length === 0) {
      rollbackPoints.push({
        stepId: step.stepId,
        description: `pre-${step.title.toLowerCase()} snapshot`,
      });
    }
    return {
      ...step,
      riskLevel,
      requiredApproval,
      approvalReason:
        requiredApproval && !step.approvalReason
          ? requiresApprovalByRisk
            ? `risk=${riskLevel} ≥ threshold=${context.approvalThreshold}`
            : 'explicit approval required by caller'
          : step.approvalReason,
      rollbackPoints,
    };
  });
}

/**
 * Topologically sort steps so dependencies always precede dependents. Throws
 * PlanCycleError if a cycle is detected. Stable for siblings — preserves the
 * original `index` order.
 */
export function topoSort(steps: PlanStep[]): string[] {
  const byId = new Map(steps.map((s) => [s.stepId, s] as const));
  const indeg = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const s of steps) {
    indeg.set(s.stepId, 0);
    dependents.set(s.stepId, []);
  }
  for (const s of steps) {
    for (const d of s.dependsOn) {
      if (!byId.has(d)) continue;
      indeg.set(s.stepId, (indeg.get(s.stepId) ?? 0) + 1);
      dependents.get(d)!.push(s.stepId);
    }
  }
  const ready = steps
    .filter((s) => (indeg.get(s.stepId) ?? 0) === 0)
    .sort((a, b) => a.index - b.index);
  const order: string[] = [];
  while (ready.length > 0) {
    const next = ready.shift()!;
    order.push(next.stepId);
    for (const dep of dependents.get(next.stepId) ?? []) {
      const remaining = (indeg.get(dep) ?? 0) - 1;
      indeg.set(dep, remaining);
      if (remaining === 0) {
        const step = byId.get(dep)!;
        const insertAt = ready.findIndex((s) => s.index > step.index);
        if (insertAt < 0) ready.push(step);
        else ready.splice(insertAt, 0, step);
      }
    }
  }
  if (order.length !== steps.length) {
    throw new PlanCycleError(
      `Plan has a dependency cycle (${order.length}/${steps.length} steps sortable)`,
    );
  }
  return order;
}
