/**
 * @deprecated `@szl-holdings/evals-core` is deprecated. Use `@workspace/eval-forge` instead.
 *
 * This package is now a compatibility shim. Metrics, precision/recall, and
 * comparison functions remain available. For new evaluation work, use
 * `@workspace/eval-forge` which provides all 10 eval types and 9 metric categories.
 */
export * from "./metrics.ts";
export * from "./runner.ts";
export * from "./regression.ts";
export * from "./compare.ts";
export * from "./grader-primitives.ts";

export {
  computeAllMetrics,
  computeCorrectnessMetrics,
  computeConfidenceCalibration,
  computeLatencyMetrics,
  computeCostMetrics,
  runEvalSuite as runForgeEvalSuite,
  checkRunRegression as checkForgeRunRegression,
  runNightlyEvals as runForgeNightlyEvals,
  FORGE_SUITES,
  ALL_EVAL_TYPES,
  type EvalForgeMetrics,
  type EvalRunReport as ForgeEvalRunReport,
  type EvalSuiteDef as ForgeEvalSuiteDef,
} from "@workspace/eval-forge";

// Consumers seeking createToolEvalSuite, createPromptEvalSuite, replayRunAsEval, etc.
// should import directly from @workspace/agents-evals (Phase 4 migration target).
