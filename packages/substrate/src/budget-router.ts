/**
 * @szl/substrate — Confidence-Budget Router
 *
 * Every pipeline runs against a declared confidence budget. Stages that fall
 * below threshold auto-route to a stronger model adapter, a human approver,
 * or a verifier — declaratively, not via ad-hoc if-statements in agent code.
 */

import type { AnyStage, ConfidenceBudget, PipelineRun } from './types.js';

export type RoutingDecision =
  | { action: 'accept'; reason: string }
  | { action: 'escalate-model'; reason: string; targetAdapterId: string }
  | { action: 'escalate-human'; reason: string; approvalRequired: true }
  | { action: 'verify'; reason: string; verifierAdapterId: string }
  | { action: 'fail'; reason: string };

/**
 * Given a stage's emitted confidence score, return the routing decision
 * driven entirely by the declared budget configuration.
 *
 * Decision logic (evaluated in order, first match wins):
 * 1. confidence < requireHumanBelow  → escalate-human
 * 2. confidence < escalateAt         → escalate-model (stronger adapter)
 * 3. confidence >= escalateAt        → accept
 *
 * The verifier is invoked post-accept by the engine when a Verify stage
 * is present in the graph; this router handles pre-accept routing only.
 */
export function routeByBudget(
  confidence: number,
  stage: AnyStage,
  budget: ConfidenceBudget,
  _run: PipelineRun,
): RoutingDecision {
  if (confidence < budget.requireHumanBelow) {
    return {
      action: 'escalate-human',
      reason:
        `Confidence ${(confidence * 100).toFixed(1)}% is below the human-review threshold ` +
        `${(budget.requireHumanBelow * 100).toFixed(1)}% for stage '${stage.id}'.`,
      approvalRequired: true,
    };
  }

  if (confidence < budget.escalateAt) {
    return {
      action: 'escalate-model',
      reason:
        `Confidence ${(confidence * 100).toFixed(1)}% is below the model-escalation threshold ` +
        `${(budget.escalateAt * 100).toFixed(1)}% for stage '${stage.id}'. ` +
        `Escalating to '${budget.escalationModelAdapterId}'.`,
      targetAdapterId: budget.escalationModelAdapterId,
    };
  }

  return {
    action: 'accept',
    reason: `Confidence ${(confidence * 100).toFixed(1)}% meets budget threshold for stage '${stage.id}'.`,
  };
}

/**
 * Validate that the final pipeline confidence meets the minimum threshold.
 * Returns null if valid, or a string reason if the pipeline should be failed.
 */
export function validateFinalConfidence(
  finalConfidence: number,
  budget: ConfidenceBudget,
): string | null {
  if (finalConfidence < budget.minFinalConfidence) {
    return (
      `Final pipeline confidence ${(finalConfidence * 100).toFixed(1)}% is below the minimum ` +
      `required ${(budget.minFinalConfidence * 100).toFixed(1)}%.`
    );
  }
  return null;
}

/**
 * Compute the aggregate pipeline confidence from individual stage confidences.
 * Uses a weighted arithmetic mean, giving more weight to Decide and Verify stages.
 */
export function aggregatePipelineConfidence(
  stageConfidences: Array<{ stageId: string; stageType: string; confidence: number }>,
): number {
  if (stageConfidences.length === 0) return 0;

  const STAGE_WEIGHTS: Record<string, number> = {
    Decide: 3,
    Verify: 2.5,
    Reason: 2,
    ToolCall: 1.5,
    Retrieve: 1,
    ApprovalGate: 0,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const { stageType, confidence } of stageConfidences) {
    const weight = STAGE_WEIGHTS[stageType] ?? 1;
    if (weight === 0) continue;
    totalWeight += weight;
    weightedSum += weight * confidence;
  }

  if (totalWeight === 0) return 1;
  return Math.max(0, Math.min(1, weightedSum / totalWeight));
}
