/**
 * @workspace/simulation
 *
 * Lyte Simulation Engine — projects downstream outcomes of a governed
 * recommendation before action is taken. Powers the Decision Center
 * "Simulate" panel for risk-free preview of intervention effects.
 *
 * Usage:
 *   import { runSimulation, compareScenarios } from "@workspace/simulation";
 *
 * All projections are probabilistic. Confidence ranges reflect model
 * uncertainty and historical pattern match quality.
 */

export {
  type ConfidenceBand,
  DECISION_TWIN_ACTION_DESCRIPTIONS,
  DECISION_TWIN_ACTION_LABELS,
  DECISION_TWIN_ENGINE_VERSION,
  type DecisionTwinAction,
  type DecisionTwinAuditEvent,
  type DecisionTwinScenario,
  deltaLabel,
  getBestScenario,
  PRISM_DIMENSION_ICONS,
  PRISM_DIMENSION_LABELS,
  type PRISMDimension,
  type PRISMImpact,
  riskLabel,
  runAllDecisionTwinScenarios,
  runDecisionTwin,
  type SignalProfile,
  type TwinAuditPersistenceAdapter,
} from './decision-twin.js';
export {
  compareScenarios,
  formatCurrencyImpact,
  runSimulation,
  SIMULATION_ENGINE_VERSION,
  simulationConfidenceLabel,
} from './engine.js';
export * from './types.js';
