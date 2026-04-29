#!/usr/bin/env node
/**
 * Codex-Kernel runner — `pnpm codex:run`.
 *
 * Loads `runner/payload.json`, drives the kernel against the Dresden Venus
 * emulator, and writes the six deliverables to `./output/` exactly as the
 * payload's `platform.output_paths` declares:
 *
 *   - final_table_preview.json
 *   - final_state.json
 *   - run_summary.json
 *   - decision_receipt.json   (last receipt; full set is in trace.jsonl)
 *   - trace.jsonl             (one JSON event per line, append-only contract)
 *   - proof_ledger.jsonl      (one ledger entry per committed step)
 *
 * Replay contract: `pnpm codex:replay` re-derives the final state from
 * initial_state + trace.jsonl and asserts the hash chain reproduces exactly.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  DRESDEN_DEFAULT_CONFIG,
  DRESDEN_INITIAL_STATE,
  type DresdenSimConfig,
  dresdenSteps,
  hashJson,
  hashString,
  runLoop,
  serializeTraceJsonl,
  type VenusState,
} from '../index.js';
import { ProofLedger } from '../ledger.js';
import { normalizeRawPayload } from './normalize.js';
import { confineOutput, PACKAGE_ROOT, resolveOutputRoot } from './paths.js';
import { assertPayload, type CodexPayload } from './payload.js';

function loadPayload(): { payload: CodexPayload; payload_path: string } {
  const cliPath = process.argv[2];
  const payload_path = cliPath
    ? resolve(process.cwd(), cliPath)
    : join(PACKAGE_ROOT, 'runner', 'payload.json');
  const raw = readFileSync(payload_path, 'utf-8');
  const parsed = JSON.parse(raw) as unknown;
  // Normalize lifts a lean operational payload (e.g. SZL private governed
  // ops) into the strict E4 contract; strict payloads pass through unchanged.
  const normalized = normalizeRawPayload(parsed);
  assertPayload(normalized);
  return { payload: normalized, payload_path };
}

function ensureDir(file_path: string): void {
  mkdirSync(dirname(file_path), { recursive: true });
}

/**
 * Faithful payload→Dresden mapping. Preserves the discrete schedule shape
 * (`every_n_rows`) instead of collapsing it to a fractional rate, which
 * would shift correction timing and produce different rows from the same
 * payload.
 */
function payloadConfigToDresden(p: CodexPayload): DresdenSimConfig {
  const dm = p.transition_model.drift_model;
  return {
    cycle_days: p.transition_model.base_transition_rule.day_index_increment,
    drift_per_cycle: dm.enabled ? dm.default_drift_increment : 0,
    drift_schedule:
      dm.enabled && dm.schedule.type === 'every_n_rows'
        ? { type: 'every_n_rows', n: dm.schedule.n, increment: dm.schedule.increment }
        : undefined,
    warning_threshold: dm.warning_threshold,
    hard_threshold: dm.hard_threshold,
    rows_to_emit: p.goal.target_rows,
    correct_when_drift_ge: dm.warning_threshold,
  };
}

function fixedClock(_experiment_id: string): () => string {
  // Deterministic timestamps so the trace replays bit-identical across runs.
  let n = 0;
  return () => {
    const total_seconds = n++;
    const ss = String(total_seconds % 60).padStart(2, '0');
    const mm = String(Math.floor(total_seconds / 60) % 60).padStart(2, '0');
    const hh = String(Math.floor(total_seconds / 3600) % 24).padStart(2, '0');
    return `2026-04-29T${hh}:${mm}:${ss}.000Z`;
  };
}

function writeJson(file_path: string, value: unknown): void {
  ensureDir(file_path);
  writeFileSync(file_path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function writeText(file_path: string, value: string): void {
  ensureDir(file_path);
  writeFileSync(file_path, value.endsWith('\n') ? value : `${value}\n`, 'utf-8');
}

async function main(): Promise<void> {
  const { payload, payload_path } = loadPayload();
  const output_root = resolveOutputRoot();
  const out = (rel: string): string => confineOutput(output_root, rel);

  const dresdenCfg = payloadConfigToDresden(payload);
  const initial_state: VenusState = {
    ...DRESDEN_INITIAL_STATE,
    epoch_label: payload.initial_state.codex_emulation.epoch_label,
    day_index: payload.initial_state.codex_emulation.day_index,
    cycle_position: payload.initial_state.codex_emulation.cycle_position,
    drift_days: payload.initial_state.codex_emulation.drift_days,
    table_rows_emitted: payload.initial_state.codex_emulation.table_rows_emitted,
    row_history: [],
  };
  void DRESDEN_DEFAULT_CONFIG;

  const result = runLoop<VenusState>({
    experiment_id: payload.experiment_id,
    initial_state,
    policy_version: payload.initial_state.governance.policy_version,
    budgets: {
      time_budget_ms: payload.budgets.time_budget_ms,
      step_budget: payload.budgets.step_budget,
      retry_budget: payload.budgets.retry_budget,
    },
    loop_policy: {
      max_steps: payload.loop_policy.max_steps,
      adaptive_depth: { enabled: payload.loop_policy.adaptive_depth.enabled },
      entropy_regularized_exit: {
        enabled: payload.loop_policy.entropy_regularized_exit.enabled,
      },
    },
    governance_enabled: payload.initial_state.governance.no_bypass,
    steps: dresdenSteps(dresdenCfg),
    now: fixedClock(payload.experiment_id),
  });

  const ledger = new ProofLedger();
  for (const e of result.ledger) ledger.append(e);

  // 1. Trace JSONL — one event per line, append-only.
  writeText(out(payload.platform.output_paths.trace_jsonl), serializeTraceJsonl(result.trace));

  // 2. Proof ledger JSONL.
  writeText(out(payload.platform.output_paths.proof_ledger_jsonl), ledger.toJsonl());

  // 3. Final state.
  writeJson(out(payload.platform.output_paths.final_state), {
    final_state: result.final_state,
    final_state_hash: result.summary.final_state_hash,
    ledger_digest: ledger.digest(),
  });

  // 4. Run summary.
  writeJson(out(payload.platform.output_paths.run_summary), {
    ...result.summary,
    payload_path,
    payload_version: payload.version,
    payload_experiment_id: payload.experiment_id,
    receipts_emitted: result.receipts.length,
    approvals_recorded: result.approvals.length,
    ledger_size: result.ledger.length,
    ledger_digest: ledger.digest(),
  });

  // 5. Last decision receipt (full set is embedded in trace.jsonl).
  const last_receipt = result.receipts.length > 0
    ? result.receipts[result.receipts.length - 1]
    : null;
  writeJson(out(payload.platform.output_paths.decision_receipt), {
    last_receipt,
    receipt_count: result.receipts.length,
  });

  // 6. Final table preview — the externally checkable Dresden surface.
  const preview = result.final_state.row_history.map((row) => ({
    row_index: row.row_index,
    epoch_label: row.epoch_label,
    cycle_position: row.cycle_position,
    day_index: row.day_index,
    drift_days: row.drift_days,
    correction_applied: row.correction_applied,
    notes: row.notes,
  }));
  writeJson(out(payload.platform.output_paths.final_table_preview), {
    target_rows: payload.goal.target_rows,
    rows_emitted: preview.length,
    rows: preview,
  });

  // 7. Run manifest — binds the deliverables to the contract that produced
  // them. Anyone receiving the output bundle can: (a) hash the payload they
  // believe was used and check it against payload_hash; (b) hash each
  // deliverable file and check it against deliverables[*].sha. Mismatch ⇒
  // tamper or wrong contract.
  const payload_hash = hashJson(payload as unknown as import('../types.js').Json);
  const deliverable_files: Array<{ name: string; rel: string; abs: string }> = [
    { name: 'trace_jsonl', rel: payload.platform.output_paths.trace_jsonl, abs: out(payload.platform.output_paths.trace_jsonl) },
    { name: 'proof_ledger_jsonl', rel: payload.platform.output_paths.proof_ledger_jsonl, abs: out(payload.platform.output_paths.proof_ledger_jsonl) },
    { name: 'final_state', rel: payload.platform.output_paths.final_state, abs: out(payload.platform.output_paths.final_state) },
    { name: 'run_summary', rel: payload.platform.output_paths.run_summary, abs: out(payload.platform.output_paths.run_summary) },
    { name: 'decision_receipt', rel: payload.platform.output_paths.decision_receipt, abs: out(payload.platform.output_paths.decision_receipt) },
    { name: 'final_table_preview', rel: payload.platform.output_paths.final_table_preview, abs: out(payload.platform.output_paths.final_table_preview) },
  ];
  const deliverables = deliverable_files.map((f) => ({
    name: f.name,
    rel: f.rel,
    sha: hashString(readFileSync(f.abs, 'utf-8')),
  }));
  writeJson(out('output/run_manifest.json'), {
    experiment_id: payload.experiment_id,
    payload_version: payload.version,
    payload_hash,
    output_root,
    final_state_hash: result.summary.final_state_hash,
    ledger_digest: ledger.digest(),
    deliverables,
  });

  // Console summary so the run is legible at a glance.
  // eslint-disable-next-line no-console
  console.log(
    [
      `codex-kernel runner — ${payload.experiment_id}`,
      `  status:           ${result.summary.status}`,
      `  steps_executed:   ${result.summary.steps_executed}`,
      `  hard_failures:    ${result.summary.hard_stop_failures}`,
      `  soft_failures:    ${result.summary.soft_failures}`,
      `  stop_reason:      ${result.summary.stop_reason}`,
      `  rows_emitted:     ${preview.length}`,
      `  final_state_hash: ${result.summary.final_state_hash}`,
      `  ledger_digest:    ${ledger.digest()}`,
      `  outputs written under: ${out('output')}`,
    ].join('\n'),
  );

  if (result.summary.status !== 'ok') {
    process.exitCode = 2;
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('codex-kernel runner failed:', err);
  process.exit(1);
});
