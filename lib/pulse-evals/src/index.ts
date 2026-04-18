export type {
  EvalDomain,
  RedTeamCategory,
  AssertionOperator,
  EvalAssertion,
  GoldenDatasetCase,
  EvalCaseResult,
  EvalSuiteReport,
  ComparisonEntry,
  SideBySideComparison,
  RegressionBaseline,
  RegressionCheckResult,
  PulseEvalConfig,
} from "./types.js";

export {
  ALL_DATASETS,
  DOMAIN_DATASETS,
  RANKING_DATASET,
  ROUTING_DATASET,
  DECISION_DATASET,
  ARTIFACT_DATASET,
  HALLUCINATION_DATASET,
  CALIBRATION_DATASET,
  RED_TEAM_DATASET,
} from "./golden-datasets.js";

export {
  runPulseEvals,
  runDomainEvals,
  runRedTeamEvals,
} from "./runner.js";

export {
  compareSuites,
  recordBaseline,
  injectBaseline,
  checkRegression,
  getRegressionBaselines,
  getRegressionDashboard,
} from "./comparison.js";

export type {
  AgentId,
  EvalRunType,
  ReplayMode,
  FailureReason,
  CaseDifficulty,
  PromotionDecision,
  EvalDimensionScores,
  EvalCaseInput,
  EvalCaseExpectedOutput,
  AgentEvalCase,
  AgentEvalDataset,
  CaseFailureSummary,
  CaseScoringResult,
  AgentEvalRunRecord,
  ReplayChainRecord,
  ReplayOutputDiff,
  AgentReplayRunRecord,
  DimensionDelta,
  RegressionAnalysis,
  VersionComparisonRecord,
  PromotionGateResult,
  EvalLedgerEntry,
} from "./agent-eval-types.js";

export { DIMENSION_WEIGHTS } from "./agent-eval-types.js";

export {
  registerDataset,
  getDataset,
  listDatasets,
  getLatestDatasetForAgent,
} from "./agent-eval-dataset.js";

export type { ScoringInput, ScoringOutput } from "./agent-eval-scorer.js";
export { scoreCase, computeAggregateDimensionScores } from "./agent-eval-scorer.js";

export {
  PROMOTION_AGGREGATE_THRESHOLD,
  PROMOTION_SAFETY_FLAG_REQUIREMENT,
  checkPromotionGate,
  approvePromotion,
  formatPromotionReport,
} from "./agent-eval-promotion.js";
export type { PromotionGateInput } from "./agent-eval-promotion.js";

export {
  registerLedgerSink,
  recordEvalRunToLedger,
  getLedgerEntry,
  listLedgerEntries,
  getLedgerSummary,
} from "./agent-eval-ledger.js";

export type { AgentEvalExecutor, RunAgentEvalsOptions, AgentEvalTrend } from "./agent-eval-runner.js";
export {
  runAgentEvals,
  getEvalRun,
  listEvalRuns,
  getAgentEvalTrend,
} from "./agent-eval-runner.js";

export type { ReplayExecutor, RunReplayOptions } from "./agent-replay-runner.js";
export {
  runReplay,
  getReplayRun,
  listReplayRuns,
  approveReplayRun,
  rejectReplayRun,
  formatReplaySummary,
} from "./agent-replay-runner.js";

export {
  compareEvalRuns,
  getVersionComparison,
  listVersionComparisons,
  formatVersionComparisonReport,
} from "./agent-version-comparison.js";
