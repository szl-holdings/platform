/**
 * Governed Evaluation Harness — core TypeScript types.
 *
 * Mirrors the Python runner's Pydantic schemas so the TS facade and the
 * REST API share a single source of truth for report shapes.
 */

export type EvalProvider = 'openai' | 'anthropic' | 'gemini' | 'huggingface' | 'substrate';

export type EvalGrader =
  | 'exact_match'
  | 'exact_match_case_insensitive'
  | 'contains_match'
  | 'word_count_max'
  | 'json_key_value'
  | 'starts_with_dash_count'
  | 'word_not_present'
  | 'safety_refusal'
  | 'numeric_tolerance';

export interface EvalCase {
  id: string;
  category: string;
  label: string;
  prompt: string;
  grader: EvalGrader;
  expected: unknown;
  weight?: number;
  tolerance?: number;
}

export interface EvalSuiteManifest {
  suite_id: string;
  name: string;
  description?: string;
  domain: string;
  version: number;
  cases: EvalCase[];
  content_hash: string;
}

export interface EvalCaseResult {
  case_id: string;
  category: string;
  label: string;
  passed: boolean;
  score: number;
  weight: number;
  latency_ms: number;
  detail: string;
  response_preview: string;
}

export interface CategoryBreakdown {
  total: number;
  passed: number;
  pass_rate: number;
  weighted_score: number;
}

export interface EvalRunReport {
  run_id: string;
  suite_id: string;
  suite_name: string;
  suite_content_hash: string;
  model_id: string;
  provider: EvalProvider;
  triggered_by: string;
  baseline_run_id?: string | null;
  seed?: number | null;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  total_cases: number;
  passed_cases: number;
  failed_cases: number;
  pass_rate: number;
  aggregate_score: number;
  categories: Record<string, CategoryBreakdown>;
  case_results: EvalCaseResult[];
  content_hash: string;
  signature: string;
  started_at: number;
  completed_at: number;
  duration_ms: number;
}

export interface EvalRunSummary {
  run_id: string;
  suite_id: string;
  model_id: string;
  provider: EvalProvider;
  status: 'pending' | 'completed' | 'failed';
  pass_rate: number;
  aggregate_score: number;
  total_cases: number;
  passed_cases: number;
  triggered_by: string;
  started_at: number;
  completed_at: number;
  content_hash: string;
}

export interface EvalSubmitResponse {
  run_id: string;
  suite_id: string;
  model_id: string;
  provider: EvalProvider;
  status: 'pending';
  submitted_at: number;
}

export interface EvalReproduceResult {
  original_run_id: string;
  reproduce_run_id: string;
  /** True when the pinned dataset inputs are unchanged between original and reproduce runs. */
  suite_reproduced: boolean;
  suite_content_hash: string;
  original_suite_content_hash: string;
  /** Legacy fields — kept for backward compatibility */
  hashes_match: boolean;
  original_content_hash: string;
  reproduced_content_hash: string;
  original_signature: string;
  reproduced_signature: string;
  /** HMAC-signed manifest covering non-stochastic fields (suite_content_hash, model_id, provider). */
  manifest_hash: string;
  manifest_signature: string;
  /** Shell command an external auditor can run to reproduce the suite manifest. */
  cli_invocation: string;
  report: EvalRunReport;
}

export interface RegressionAnalysis {
  run_id: string;
  baseline_run_id: string;
  suite_id: string;
  model_id: string;
  regressed: boolean;
  regression_categories: string[];
  pass_rate_delta: number;
  aggregate_score_delta: number;
  baseline_pass_rate: number;
  current_pass_rate: number;
  baseline_aggregate_score: number;
  current_aggregate_score: number;
  analysed_at: number;
}

export interface HarnessRunOptions {
  suiteId: string;
  modelId: string;
  provider: EvalProvider;
  triggeredBy?: string;
  baselineRunId?: string;
  /** Deterministic seed — omit for live run */
  seed?: number;
  /** How long to poll for completion (ms). Default 120 000. */
  pollTimeoutMs?: number;
}

export interface HarnessConfig {
  /** Base URL of the eval runner service. Default reads EVAL_RUNNER_URL env var. */
  runnerUrl?: string;
  /** Signing key for local report verification. Default reads EVAL_RUNNER_SIGNING_KEY. */
  signingKey?: string;
}
