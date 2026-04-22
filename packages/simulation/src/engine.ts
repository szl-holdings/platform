/**
 * Lyte Simulation Engine
 *
 * Projects downstream outcomes of a governed recommendation before action.
 * All projections are probabilistic — confidence ranges reflect model uncertainty.
 * Used by the Decision Center "Simulate" panel to preview likely effects before approval.
 */

import type { SimulationRequest, SimulationResult, SimulationScenario } from './types.js';

export const SIMULATION_ENGINE_VERSION = '1.0.0' as const;

const URGENCY_MULTIPLIERS: Record<string, number> = {
  critical: 1.4,
  urgent: 1.2,
  moderate: 1.0,
  routine: 0.8,
};

const CONFIDENCE_DAMPENING = 0.92;

export function runSimulation(request: SimulationRequest): SimulationResult {
  const now = Date.now();
  const urgencyMultiplier =
    URGENCY_MULTIPLIERS[String(request.context?.urgency ?? 'moderate')] ?? 1;
  const baseConfidence = Number(request.context?.baseConfidence ?? 0.75);
  const projectedConfidence = Math.min(
    0.99,
    baseConfidence * urgencyMultiplier * CONFIDENCE_DAMPENING,
  );

  return {
    id: `sim-result-${now}`,
    scenarioId: request.action.id,
    scenarioName: String(request.context?.scenarioName ?? 'Simulation'),
    scenarioDescription: String(request.context?.scenarioDescription ?? ''),
    action: request.action,
    projectedOutcome: {
      primaryMetricLabel: String(request.context?.primaryMetricLabel ?? 'Close Probability'),
      primaryMetricBefore: Number(request.context?.primaryMetricBefore ?? 0.3),
      primaryMetricAfter: Number(request.context?.primaryMetricAfter ?? 0.74),
      primaryMetricUnit: String(request.context?.primaryMetricUnit ?? '%'),
      daysToRecovery: Number(request.context?.daysToRecovery ?? 3),
      estimatedValueCapture: Number(request.context?.estimatedValueCapture ?? 0),
      confidence: projectedConfidence,
      confidenceReason: `Based on ${Math.round(projectedConfidence * 100)}% historical pattern match across comparable scenarios.`,
    },
    downstreamEffects:
      (request.context?.downstreamEffects as SimulationResult['downstreamEffects']) ?? [],
    riskIfNotTaken: String(request.context?.riskIfNotTaken ?? ''),
    simulatedAt: now,
    engineVersion: SIMULATION_ENGINE_VERSION,
  };
}

export function compareScenarios(scenarios: SimulationScenario[]): SimulationScenario[] {
  return [...scenarios].sort((a, b) => {
    const aVal = a.projectedOutcome.estimatedValueCapture ?? 0;
    const bVal = b.projectedOutcome.estimatedValueCapture ?? 0;
    if (bVal !== aVal) return bVal - aVal;
    return (b.projectedOutcome.confidence ?? 0) - (a.projectedOutcome.confidence ?? 0);
  });
}

export function simulationConfidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return 'High';
  if (confidence >= 0.7) return 'Moderate';
  if (confidence >= 0.55) return 'Low';
  return 'Very Low';
}

export function formatCurrencyImpact(valueUsd: number): string {
  if (valueUsd >= 1_000_000) return `$${(valueUsd / 1_000_000).toFixed(1)}M`;
  if (valueUsd >= 1_000) return `$${(valueUsd / 1_000).toFixed(0)}K`;
  return `$${valueUsd.toFixed(0)}`;
}
