/**
 * Agent Eval Runner
 *
 * Executes a dataset of test cases against a registered model version.
 * Scores outputs across 6 correctness dimensions, records results in the
 * Decision Ledger, and enforces the model promotion gate.
 *
 * Per spec: docs/AGENT_EVAL_AND_REPLAY.md
 *
 * Parallelism: up to CONCURRENCY (default 10) cases run simultaneously.
 */

import { getDataset, getLatestDatasetForAgent } from './agent-eval-dataset.js';
import { recordEvalRunToLedger } from './agent-eval-ledger.js';
import { checkPromotionGate } from './agent-eval-promotion.js';
import { computeAggregateDimensionScores, scoreCase } from './agent-eval-scorer.js';
import type {
  AgentEvalRunRecord,
  AgentId,
  CaseFailureSummary,
  CaseScoringResult,
  EvalRunType,
} from './agent-eval-types.js';

const CONCURRENCY = 10;

const evalRunHistory: AgentEvalRunRecord[] = [];

export type AgentEvalExecutor = (input: {
  case_id: string;
  agent_id: AgentId;
  model_version: string;
  input: Record<string, unknown>;
}) => Promise<{
  output: Record<string, unknown>;
  latency_ms: number;
}>;

export interface RunAgentEvalsOptions {
  agent_id: AgentId;
  model_version: string;
  dataset_id?: string;
  run_type?: EvalRunType;
  triggered_by?: string;
  baseline_eval_id?: string;
  parallelism?: number;
}

function generateEvalId(): string {
  return `eval_run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function runInBatches<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

export async function runAgentEvals(
  executor: AgentEvalExecutor,
  options: RunAgentEvalsOptions,
): Promise<AgentEvalRunRecord> {
  const {
    agent_id,
    model_version,
    dataset_id,
    run_type = 'on_demand',
    triggered_by = 'system:eval-runner',
    baseline_eval_id,
    parallelism = CONCURRENCY,
  } = options;

  const dataset = dataset_id ? getDataset(dataset_id) : getLatestDatasetForAgent(agent_id);

  if (!dataset) {
    throw new Error(
      `No eval dataset found for agent '${agent_id}'${dataset_id ? ` (dataset_id: ${dataset_id})` : ''}`,
    );
  }

  const eval_id = generateEvalId();
  const started_at = new Date().toISOString();

  const caseResults = await runInBatches(
    dataset.cases,
    parallelism,
    async (evalCase): Promise<CaseScoringResult> => {
      const start = Date.now();
      try {
        const { output, latency_ms } = await executor({
          case_id: evalCase.case_id,
          agent_id,
          model_version,
          input: evalCase.input,
        });

        const scoring = scoreCase({ evalCase, actualOutput: output });

        return {
          case_id: evalCase.case_id,
          name: evalCase.name,
          difficulty: evalCase.difficulty,
          tags: evalCase.tags,
          passed: scoring.passed,
          partial: scoring.partial,
          dimension_scores: scoring.dimension_scores,
          aggregate_score: scoring.aggregate_score,
          safety_passed: scoring.safety_passed,
          failure_summary: scoring.failure_summary,
          actual_output: output,
          latency_ms,
          model_version,
          evaluated_at: new Date().toISOString(),
        };
      } catch (err) {
        const latency_ms = Date.now() - start;
        return {
          case_id: evalCase.case_id,
          name: evalCase.name,
          difficulty: evalCase.difficulty,
          tags: evalCase.tags,
          passed: false,
          partial: false,
          dimension_scores: {
            semantic_accuracy: 0,
            recommendation_quality: 0,
            evidence_completeness: 0,
            confidence_calibration: 0,
            format_compliance: 0,
            safety_flag: 0,
          },
          aggregate_score: 0,
          safety_passed: false,
          failure_summary: {
            case_id: evalCase.case_id,
            failure_reason: 'schema_violation',
            dimension: 'format_compliance',
            detail: `Executor error: ${err instanceof Error ? err.message : String(err)}`,
          },
          actual_output: {},
          latency_ms,
          model_version,
          evaluated_at: new Date().toISOString(),
        };
      }
    },
  );

  const completed_at = new Date().toISOString();

  const cases_passed = caseResults.filter((r) => r.passed).length;
  const cases_partial = caseResults.filter((r) => !r.passed && r.partial).length;
  const cases_failed = caseResults.filter((r) => !r.passed && !r.partial).length;
  const pass_rate = caseResults.length > 0 ? cases_passed / caseResults.length : 0;

  const dimension_scores = computeAggregateDimensionScores(
    caseResults.map((r) => r.dimension_scores),
  );

  const aggregate_score =
    caseResults.length > 0
      ? caseResults.reduce((s, r) => s + r.aggregate_score, 0) / caseResults.length
      : 0;

  const failure_summary: CaseFailureSummary[] = caseResults
    .filter((r) => r.failure_summary)
    .map((r) => r.failure_summary!);

  const baselineRun = baseline_eval_id
    ? evalRunHistory.find((r) => r.eval_id === baseline_eval_id)
    : undefined;

  const delta_aggregate_score = baselineRun
    ? aggregate_score - baselineRun.aggregate_score
    : undefined;

  const regression_cases = baselineRun
    ? caseResults.filter((r) => {
        const baselineCase = baselineRun.case_results.find((bc) => bc.case_id === r.case_id);
        return baselineCase?.passed && !r.passed;
      }).length
    : 0;

  const gate = checkPromotionGate({
    eval_id,
    agent_id,
    model_version,
    aggregate_score,
    safety_flag_score: dimension_scores.safety_flag,
    regression_cases,
  });

  const evalRun: AgentEvalRunRecord = {
    eval_id,
    dataset_id: dataset.dataset_id,
    agent_id,
    model_version,
    run_type,
    triggered_by,
    started_at,
    completed_at,
    cases_total: caseResults.length,
    cases_passed,
    cases_partial,
    cases_failed,
    pass_rate,
    dimension_scores,
    aggregate_score,
    failure_summary,
    case_results: caseResults,
    comparison_baseline_eval_id: baseline_eval_id,
    delta_aggregate_score,
    regression_cases,
    promotion_approved: gate.approved,
    promotion_decision: gate.decision,
    promotion_blocked_reasons: gate.blocked_reasons,
    promotion_pending_reasons: gate.pending_reasons,
  };

  recordEvalRunToLedger(evalRun);

  evalRunHistory.unshift(evalRun);
  if (evalRunHistory.length > 1000) evalRunHistory.length = 1000;

  return evalRun;
}

export function getEvalRun(eval_id: string): AgentEvalRunRecord | undefined {
  return evalRunHistory.find((r) => r.eval_id === eval_id);
}

export function listEvalRuns(
  options: {
    agent_id?: AgentId;
    model_version?: string;
    run_type?: EvalRunType;
    promotion_approved?: boolean;
    limit?: number;
  } = {},
): AgentEvalRunRecord[] {
  let runs = evalRunHistory;
  if (options.agent_id) runs = runs.filter((r) => r.agent_id === options.agent_id);
  if (options.model_version) runs = runs.filter((r) => r.model_version === options.model_version);
  if (options.run_type) runs = runs.filter((r) => r.run_type === options.run_type);
  if (options.promotion_approved != null)
    runs = runs.filter((r) => r.promotion_approved === options.promotion_approved);
  return runs.slice(0, options.limit ?? 100);
}

export interface AgentEvalTrend {
  agent_id: AgentId;
  runs: Array<{
    eval_id: string;
    model_version: string;
    aggregate_score: number;
    pass_rate: number;
    promotion_approved: boolean;
    completed_at: string;
  }>;
  trend: 'improving' | 'stable' | 'degrading' | 'insufficient_data';
  latest_aggregate_score: number | null;
  average_aggregate_score: number | null;
}

export function getAgentEvalTrend(agent_id: AgentId, limit = 10): AgentEvalTrend {
  const runs = listEvalRuns({ agent_id, limit });

  if (runs.length < 2) {
    return {
      agent_id,
      runs: runs.map((r) => ({
        eval_id: r.eval_id,
        model_version: r.model_version,
        aggregate_score: r.aggregate_score,
        pass_rate: r.pass_rate,
        promotion_approved: r.promotion_approved,
        completed_at: r.completed_at,
      })),
      trend: 'insufficient_data',
      latest_aggregate_score: runs[0]?.aggregate_score ?? null,
      average_aggregate_score: runs.length > 0 ? runs[0].aggregate_score : null,
    };
  }

  const scores = runs.map((r) => r.aggregate_score);
  const avg = scores.reduce((s, x) => s + x, 0) / scores.length;
  const latest = scores[0];
  const oldest = scores[scores.length - 1];
  const delta = latest - oldest;

  let trend: AgentEvalTrend['trend'];
  if (delta > 0.02) trend = 'improving';
  else if (delta < -0.02) trend = 'degrading';
  else trend = 'stable';

  return {
    agent_id,
    runs: runs.map((r) => ({
      eval_id: r.eval_id,
      model_version: r.model_version,
      aggregate_score: r.aggregate_score,
      pass_rate: r.pass_rate,
      promotion_approved: r.promotion_approved,
      completed_at: r.completed_at,
    })),
    trend,
    latest_aggregate_score: latest,
    average_aggregate_score: avg,
  };
}
