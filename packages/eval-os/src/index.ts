/**
 * @deprecated `@workspace/eval-os` is deprecated. Use `@workspace/eval-forge` instead.
 *
 * This package is now a compatibility shim. Core runtime functions (runEvalSuite,
 * checkRunRegression, runNightlyEvals) are forwarded to `@workspace/eval-forge`.
 * Domain suites, dataset, scorer, and trace-grader remain for backward compatibility.
 *
 * Migrate to `@workspace/eval-forge` for all new evaluation work.
 */

export * from "./types.js";
export * from "./dataset.js";
export * from "./scorer.js";
export * from "./regression.js";
export * from "./cli.js";
export * from "./trace-grader.js";
export * from "./suites/index.js";

export {
  runEvalSuite,
  checkRunRegression,
  computeAllMetrics,
  getGrader,
  runNightlyEvals,
  scheduleNightlyRun,
  runCli as runForgeCli,
  FORGE_SUITES,
  FORGE_SUITE_BY_ID,
  FORGE_SUITE_BY_DOMAIN,
  ALL_EVAL_TYPES,
  EVAL_FORGE_VERSION,
  type EvalRunReport as ForgeRunReport,
  type EvalForgeMetrics,
  type NightlyRunSummary as ForgeNightlyRunSummary,
  type NightlyRunOptions as ForgeNightlyRunOptions,
} from "@workspace/eval-forge";

export const EVAL_OS_VERSION = "1.0.0" as const;
