/**
 * Agent Evaluation and Replay — Type Definitions
 *
 * Per spec: docs/AGENT_EVAL_AND_REPLAY.md
 * Covers eval datasets, eval runs, replay runs, version comparisons,
 * correctness scoring, and the model promotion gate.
 */

export type AgentId =
  | "sentinel-maritime"
  | "helmsman-voyage"
  | "guardian-security"
  | "prism-ai"
  | string;

export type EvalRunType =
  | "scheduled"
  | "on_demand"
  | "ci_gate"
  | "pre_promotion"
  | "regression";

export type ReplayMode =
  | "shadow"
  | "historical"
  | "scenario"
  | "adversarial";

export type FailureReason =
  | "semantic_error"
  | "missing_evidence"
  | "hallucinated_evidence"
  | "wrong_recommendation"
  | "prohibited_recommendation"
  | "confidence_overstatement"
  | "confidence_understatement"
  | "schema_violation"
  | "incomplete_reasoning"
  | "policy_mismatch";

export type CaseDifficulty = "easy" | "medium" | "hard" | "adversarial";

export type PromotionDecision = "approve" | "block" | "pending_review";

export interface EvalDimensionScores {
  semantic_accuracy: number;
  recommendation_quality: number;
  evidence_completeness: number;
  confidence_calibration: number;
  format_compliance: number;
  safety_flag: number;
}

export const DIMENSION_WEIGHTS: EvalDimensionScores = {
  semantic_accuracy: 0.35,
  recommendation_quality: 0.25,
  evidence_completeness: 0.15,
  confidence_calibration: 0.10,
  format_compliance: 0.10,
  safety_flag: 0.05,
};

export interface EvalCaseInput {
  signals?: Array<Record<string, unknown>>;
  entity_context?: Record<string, unknown>;
  policy_context?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface EvalCaseExpectedOutput {
  inference_type?: string;
  confidence_min?: number;
  confidence_max?: number;
  recommended_action?: string;
  prohibited_recommendations?: string[];
  required_evidence_types?: string[];
  required_fields?: string[];
  [key: string]: unknown;
}

export interface AgentEvalCase {
  case_id: string;
  name: string;
  input: EvalCaseInput;
  expected_output: EvalCaseExpectedOutput;
  annotated_by?: string;
  difficulty: CaseDifficulty;
  tags: string[];
}

export interface AgentEvalDataset {
  dataset_id: string;
  domain: string;
  agent: AgentId;
  version: string;
  created_at: string;
  description?: string;
  cases: AgentEvalCase[];
}

export interface CaseFailureSummary {
  case_id: string;
  failure_reason: FailureReason;
  dimension: keyof EvalDimensionScores;
  detail: string;
  actual_value?: unknown;
  expected_value?: unknown;
}

export interface CaseScoringResult {
  case_id: string;
  name: string;
  difficulty: CaseDifficulty;
  tags: string[];
  passed: boolean;
  partial: boolean;
  dimension_scores: EvalDimensionScores;
  aggregate_score: number;
  safety_passed: boolean;
  failure_summary?: CaseFailureSummary;
  actual_output: Record<string, unknown>;
  latency_ms: number;
  model_version: string;
  evaluated_at: string;
}

export interface AgentEvalRunRecord {
  eval_id: string;
  dataset_id: string;
  agent_id: AgentId;
  model_version: string;
  run_type: EvalRunType;
  triggered_by: string;
  started_at: string;
  completed_at: string;
  cases_total: number;
  cases_passed: number;
  cases_partial: number;
  cases_failed: number;
  pass_rate: number;
  dimension_scores: EvalDimensionScores;
  aggregate_score: number;
  failure_summary: CaseFailureSummary[];
  case_results: CaseScoringResult[];
  comparison_baseline_eval_id?: string;
  delta_aggregate_score?: number;
  regression_cases: number;
  promotion_approved: boolean;
  promotion_decision: PromotionDecision;
  promotion_blocked_reasons: string[];
  promotion_pending_reasons: string[];
  ledger_entry_id?: string;
}

export interface ReplayChainRecord {
  chain_id: string;
  agent_id: AgentId;
  signal_ids: string[];
  inference_id: string;
  timestamp: string;
  output: Record<string, unknown>;
  model_version: string;
}

export interface ReplayOutputDiff {
  chain_id: string;
  current_output: Record<string, unknown>;
  candidate_output: Record<string, unknown>;
  current_recommendation?: string;
  candidate_recommendation?: string;
  severity_escalated: boolean;
  severity_deescalated: boolean;
  recommendation_changed: boolean;
  safety_violation_current: boolean;
  safety_violation_candidate: boolean;
}

export interface AgentReplayRunRecord {
  replay_id: string;
  replay_mode: ReplayMode;
  agent_id: AgentId;
  model_version_current: string;
  model_version_candidate: string;
  source_date_range?: { from: string; to: string };
  chains_replayed: number;
  output_diffs: ReplayOutputDiff[];
  output_changes: number;
  severity_escalations: number;
  severity_deescalations: number;
  recommendation_changes: number;
  safety_violations_current: number;
  safety_violations_candidate: number;
  reviewer?: string;
  review_status: "pending" | "approved" | "rejected";
  review_notes?: string;
  created_at: string;
}

export interface DimensionDelta {
  semantic_accuracy: number;
  recommendation_quality: number;
  evidence_completeness: number;
  confidence_calibration: number;
  format_compliance: number;
  safety_flag: number;
}

export interface RegressionAnalysis {
  new_failures: string[];
  recovered_failures: string[];
  unchanged_failures: string[];
}

export interface VersionComparisonRecord {
  comparison_id: string;
  baseline_eval: string;
  candidate_eval: string;
  aggregate_delta: number;
  dimension_deltas: DimensionDelta;
  regression_analysis: RegressionAnalysis;
  promotion_recommendation: PromotionDecision;
  promotion_notes: string;
  created_at: string;
}

export interface PromotionGateResult {
  approved: boolean;
  decision: PromotionDecision;
  agent_id: AgentId;
  model_version: string;
  eval_id: string;
  aggregate_score: number;
  safety_flag_score: number;
  regression_cases: number;
  replay_run_id?: string;
  replay_reviewed: boolean;
  human_reviewer_approved: boolean;
  blocked_reasons: string[];
  pending_reasons: string[];
  gate_evaluated_at: string;
}

export interface EvalLedgerEntry {
  ledger_entry_type: "eval_run";
  eval_id: string;
  agent_id: AgentId;
  model_version: string;
  dataset_id: string;
  aggregate_score: number;
  pass_rate: number;
  safety_flag_score: number;
  promotion_approved: boolean;
  triggered_by: string;
  recorded_at: string;
}
