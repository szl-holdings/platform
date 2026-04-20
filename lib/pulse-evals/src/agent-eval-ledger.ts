/**
 * Agent Eval Decision Ledger Integration
 *
 * Every eval run is recorded in the Decision Ledger with a unique eval_id.
 * Per spec: docs/AGENT_EVAL_AND_REPLAY.md + docs/DECISION_LEDGER.md
 *
 * The ledger entry captures aggregate results, promotion outcome, and links
 * the eval back to the agent and model version for traceability.
 */

import type { AgentEvalRunRecord, EvalLedgerEntry } from './agent-eval-types.js';

const ledgerEntries: EvalLedgerEntry[] = [];
const MAX_LEDGER_ENTRIES = 10000;

let externalLedgerSink: ((entry: EvalLedgerEntry) => Promise<void>) | null = null;

export function registerLedgerSink(sink: (entry: EvalLedgerEntry) => Promise<void>): void {
  externalLedgerSink = sink;
}

export function recordEvalRunToLedger(run: AgentEvalRunRecord): EvalLedgerEntry {
  const entry: EvalLedgerEntry = {
    ledger_entry_type: 'eval_run',
    eval_id: run.eval_id,
    agent_id: run.agent_id,
    model_version: run.model_version,
    dataset_id: run.dataset_id,
    aggregate_score: run.aggregate_score,
    pass_rate: run.pass_rate,
    safety_flag_score: run.dimension_scores.safety_flag,
    promotion_approved: run.promotion_approved,
    triggered_by: run.triggered_by,
    recorded_at: new Date().toISOString(),
  };

  ledgerEntries.unshift(entry);
  if (ledgerEntries.length > MAX_LEDGER_ENTRIES) {
    ledgerEntries.length = MAX_LEDGER_ENTRIES;
  }

  if (externalLedgerSink) {
    externalLedgerSink(entry).catch(() => {});
  }

  return entry;
}

export function getLedgerEntry(eval_id: string): EvalLedgerEntry | undefined {
  return ledgerEntries.find((e) => e.eval_id === eval_id);
}

export function listLedgerEntries(
  options: {
    agent_id?: string;
    model_version?: string;
    promotion_approved?: boolean;
    since?: Date;
    limit?: number;
  } = {},
): EvalLedgerEntry[] {
  let entries = ledgerEntries;
  if (options.agent_id) entries = entries.filter((e) => e.agent_id === options.agent_id);
  if (options.model_version)
    entries = entries.filter((e) => e.model_version === options.model_version);
  if (options.promotion_approved != null)
    entries = entries.filter((e) => e.promotion_approved === options.promotion_approved);
  if (options.since) entries = entries.filter((e) => new Date(e.recorded_at) >= options.since!);
  return entries.slice(0, options.limit ?? 100);
}

export interface LedgerSummary {
  total_eval_runs: number;
  promoted: number;
  blocked: number;
  avg_aggregate_score: number;
  avg_pass_rate: number;
  safety_violation_runs: number;
  by_agent: Record<string, { total: number; promoted: number; latest_score: number }>;
}

export function getLedgerSummary(): LedgerSummary {
  const entries = ledgerEntries;

  const byAgent: Record<string, { total: number; promoted: number; latest_score: number }> = {};
  for (const entry of entries) {
    if (!byAgent[entry.agent_id]) {
      byAgent[entry.agent_id] = { total: 0, promoted: 0, latest_score: 0 };
    }
    byAgent[entry.agent_id].total++;
    if (entry.promotion_approved) byAgent[entry.agent_id].promoted++;
    byAgent[entry.agent_id].latest_score = entry.aggregate_score;
  }

  const avgAggregateScore =
    entries.length > 0 ? entries.reduce((s, e) => s + e.aggregate_score, 0) / entries.length : 0;

  const avgPassRate =
    entries.length > 0 ? entries.reduce((s, e) => s + e.pass_rate, 0) / entries.length : 0;

  const safetyViolationRuns = entries.filter((e) => e.safety_flag_score < 1.0).length;

  return {
    total_eval_runs: entries.length,
    promoted: entries.filter((e) => e.promotion_approved).length,
    blocked: entries.filter((e) => !e.promotion_approved).length,
    avg_aggregate_score: avgAggregateScore,
    avg_pass_rate: avgPassRate,
    safety_violation_runs: safetyViolationRuns,
    by_agent: byAgent,
  };
}
