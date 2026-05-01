export type {
  BacktestResult,
  CalibrationResult,
  CalibrationSuggestion,
  HistoricalDataPoint,
} from './calibration.js';
export { backtest, calibrate } from './calibration.js';
export type {
  CDFPoint,
  Distribution,
  DistributionStats,
  DistributionType,
  HistogramBucket,
} from './distributions.js';
export {
  buildCDF,
  buildHistogram,
  distributionStats,
  sample,
  sampleBatch,
} from './distributions.js';
export type {
  BinaryExpr,
  BoolExpr,
  CallExpr,
  ConditionalExpr,
  Expr,
  IntermediateDef,
  NumberExpr,
  OutputExprDef,
  SerializableInput,
  SerializableOutput,
  SerializableScenario,
  UnaryExpr,
  VariableExpr,
} from './dsl.js';
export {
  buildScenarioCalculate as buildCalculateFromDsl,
  DSL_HELPERS,
  evalExpr,
  validateSerializableScenario,
} from './dsl.js';
export type {
  DecisionMatrixRow,
  MetricResult,
  ProgressCallback,
  ScenarioComparison,
  SimulationProgress,
  SimulationResult,
} from './engine.js';
export {
  buildScenarioCalculate,
  compareScenarios,
  runSerializableSimulation,
  runSimulation,
} from './engine.js';
export { isWorkerAvailable, runParallelChunks } from './parallel.js';
export type {
  ScenarioPoolOptions,
  WorkerFactory,
  WorkerLike,
} from './scenario-pool.js';
export {
  planPoolSize,
  planShards,
  runScenarioInPool,
} from './scenario-pool.js';
export type {
  MonteCarloOutputStat,
  MonteCarloResult,
  ScenarioShardSamples,
} from './scenario-simulation.js';
export {
  aggregateScenarioShards,
  runScenarioSimulation,
  simulateScenarioShard,
} from './scenario-simulation.js';
export {
  AEGIS_CYBER_RISK,
  DOMAIN_SCENARIO_LIBRARY,
  getScenarioById,
  LYTE_CAPACITY_PLANNING,
  NEXUS_GEOPOLITICAL_CASCADE,
  PRISM_LITIGATION_OUTCOME,
  SCENARIO_VARIANTS,
  SZL_FUND_EXIT,
  TERRA_PROPERTY_RETURNS,
  VESSELS_VOYAGE_COST,
} from './scenarios.js';
export type {
  Domain,
  InputVariable,
  OutputMetric,
  PartialOutputSnapshot,
  PartialResultCallback,
  QuantumSamplingConfig,
  RunConfig,
  ScenarioConstraint,
  ScenarioDefinition,
  ScenarioLibrary,
  ScenarioLibraryEntry,
  ScenarioVariant,
} from './schema.js';
export { DEFAULT_RUN_CONFIG } from './schema.js';
export type { CriticalAssumption, SensitivityReport, TornadoEntry } from './sensitivity.js';
export { computeSensitivity } from './sensitivity.js';
export type { DriverTweak } from './tweaks.js';
export {
  applyTweak,
  distributionSupportsSpread,
  IDENTITY_TWEAK,
  isIdentityTweak,
  tweakedInputs,
  tweakSummary,
} from './tweaks.js';
export type {
  QuantumSampleBatch,
  QuantumSimulationStats,
} from './quantum-sampler.js';
export { quantumSampleBatch, computeQuantumStats } from './quantum-sampler.js';
