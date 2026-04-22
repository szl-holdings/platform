export * from './fixtures/index.js';
export {
  type EvalHarnessRequest,
  type PerQueryResult,
  type EvalHarnessResult,
  runRetrievalEval,
  type LatencyBenchmarkResult,
  computeLatencyPercentiles,
} from './harness.js';
export {
  type RetrievedResult,
  recallAtK,
  precisionAtK,
  ndcgAtK,
  mrr,
  exactMatchRecoveryRate,
  computeAllMetrics,
  aggregateMetrics,
} from './metrics.js';
export { printEvalResult } from './reporters/console.js';
export { formatEvalResultAsJson, writeEvalResultJson } from './reporters/json.js';
export * from './runner.js';
export * from './smoke.js';
export * from './types.js';

export const AEF_EVALS_VERSION = '1.0.0' as const;
