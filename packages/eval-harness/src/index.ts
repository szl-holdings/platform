/**
 * @workspace/eval-harness
 *
 * TypeScript facade for the Governed Evaluation Harness.
 * Provides typed access to the Python eval runner service.
 */

export type {
  EvalCase,
  EvalCaseResult,
  EvalGrader,
  EvalProvider,
  EvalReproduceResult,
  EvalRunReport,
  EvalRunSummary,
  EvalSubmitResponse,
  EvalSuiteManifest,
  HarnessConfig,
  HarnessRunOptions,
  RegressionAnalysis,
  CategoryBreakdown,
} from './types.js';

export { EvalHarnessClient, EvalHarnessError, evalHarness } from './client.js';
export { signContentHash, verifyReport, verifyReportSignature } from './sign.js';

export {
  STANDARD_SUITE_ID,
  DOMAIN_SUITE_IDS,
  ALL_SUITE_IDS,
  REGRESSION_THRESHOLD,
  MIN_PASS_RATE_STANDARD,
  MIN_PASS_RATE_DOMAIN,
} from './constants.js';
