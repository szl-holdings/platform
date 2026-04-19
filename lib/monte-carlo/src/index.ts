export { sample, sampleBatch, distributionStats, buildHistogram, buildCDF } from "./distributions.js";
export type { Distribution, DistributionType, DistributionStats, HistogramBucket, CDFPoint } from "./distributions.js";

export { runSimulation, runSerializableSimulation, compareScenarios, buildScenarioCalculate } from "./engine.js";
export type { SimulationResult, MetricResult, SimulationProgress, ScenarioComparison, DecisionMatrixRow, ProgressCallback } from "./engine.js";

export { computeSensitivity } from "./sensitivity.js";
export type { TornadoEntry, SensitivityReport, CriticalAssumption } from "./sensitivity.js";

export { calibrate, backtest } from "./calibration.js";
export type { CalibrationResult, BacktestResult, HistoricalDataPoint, CalibrationSuggestion } from "./calibration.js";

export type { ScenarioDefinition, InputVariable, OutputMetric, ScenarioConstraint, RunConfig, Domain, ScenarioVariant, ScenarioLibraryEntry, ScenarioLibrary, PartialOutputSnapshot, PartialResultCallback } from "./schema.js";
export { DEFAULT_RUN_CONFIG } from "./schema.js";

export {
  evalExpr,
  buildScenarioCalculate as buildCalculateFromDsl,
  validateSerializableScenario,
  DSL_HELPERS,
} from "./dsl.js";
export type {
  Expr, BoolExpr, SerializableScenario, SerializableInput, SerializableOutput,
  OutputExprDef, IntermediateDef, NumberExpr, VariableExpr, BinaryExpr, UnaryExpr,
  CallExpr, ConditionalExpr,
} from "./dsl.js";

export { runParallelChunks, isWorkerAvailable } from "./parallel.js";

export { runScenarioSimulation } from "./scenario-simulation.js";
export type { MonteCarloResult, MonteCarloOutputStat } from "./scenario-simulation.js";

export {
  applyTweak,
  tweakedInputs,
  tweakSummary,
  isIdentityTweak,
  distributionSupportsSpread,
  IDENTITY_TWEAK,
} from "./tweaks.js";
export type { DriverTweak } from "./tweaks.js";

export {
  VESSELS_VOYAGE_COST,
  TERRA_PROPERTY_RETURNS,
  SZL_FUND_EXIT,
  PRISM_LITIGATION_OUTCOME,
  AEGIS_CYBER_RISK,
  NEXUS_GEOPOLITICAL_CASCADE,
  LYTE_CAPACITY_PLANNING,
  DOMAIN_SCENARIO_LIBRARY,
  SCENARIO_VARIANTS,
  getScenarioById,
} from "./scenarios.js";
