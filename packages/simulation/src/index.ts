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

export * from "./types.js";
export { runSimulation, compareScenarios, simulationConfidenceLabel, formatCurrencyImpact, SIMULATION_ENGINE_VERSION } from "./engine.js";
export {
  runDecisionTwin,
  runAllDecisionTwinScenarios,
  getBestScenario,
  riskLabel,
  deltaLabel,
  DECISION_TWIN_ENGINE_VERSION,
  DECISION_TWIN_ACTION_LABELS,
  DECISION_TWIN_ACTION_DESCRIPTIONS,
  PRISM_DIMENSION_LABELS,
  PRISM_DIMENSION_ICONS,
  type PRISMDimension,
  type DecisionTwinAction,
  type ConfidenceBand,
  type PRISMImpact,
  type DecisionTwinScenario,
  type DecisionTwinAuditEvent,
  type TwinAuditPersistenceAdapter,
  type SignalProfile,
} from "./decision-twin.js";
