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
import {
  assertTraceIdentity,
  auditSecrets,
  buildRunIdentityManifest,
  computeTraceIdentity,
  extractRawContracts,
  resolveDeploymentContract,
  resolveVersionLineage,
  type RawContractsBlock,
} from './contracts.js';
import { normalizeRawPayload } from './normalize.js';
import { confineOutput, PACKAGE_ROOT, resolveOutputRoot } from './paths.js';
import { assertPayload, type CodexPayload } from './payload.js';

function loadPayload(): {
  payload: CodexPayload;
  payload_path: string;
  raw_contracts: RawContractsBlock;
  raw_payload_version: string;
} {
  const cliPath = process.argv[2];
  const payload_path = cliPath
    ? resolve(process.cwd(), cliPath)
    : join(PACKAGE_ROOT, 'runner', 'payload.json');
  const raw = readFileSync(payload_path, 'utf-8');
  const parsed = JSON.parse(raw) as unknown;
  // Pull the four operational contracts off the raw lean payload BEFORE
  // normalization — normalize.ts maps to the strict E4 shape and drops
  // unknown top-level fields. Defaults apply when blocks are absent so a
  // pre-v1.6 payload still runs.
  const raw_contracts = extractRawContracts(parsed);
  const raw_payload_version =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? ((parsed as Record<string, unknown>).payload_version as string | undefined) ??
        ((parsed as Record<string, unknown>).version as string | undefined) ??
        'unknown'
      : 'unknown';
  // Normalize lifts a lean operational payload (e.g. SZL private governed
  // ops) into the strict E4 contract; strict payloads pass through unchanged.
  const normalized = normalizeRawPayload(parsed);
  assertPayload(normalized);
  return { payload: normalized, payload_path, raw_contracts, raw_payload_version };
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
  const { payload, payload_path, raw_contracts, raw_payload_version } = loadPayload();
  const output_root = resolveOutputRoot();
  const out = (rel: string): string => confineOutput(output_root, rel);

  // ────────────────────────────────────────────────────────────────────
  // Operational contracts (real, not just declared in the payload).
  // Computed BEFORE the loop so they bind to the run that produced the
  // outputs. Hash-stable: none of these mutate state or trace events.
  // ────────────────────────────────────────────────────────────────────
  const resolved_at = new Date().toISOString();
  const payload_hash_for_identity = hashJson(
    payload as unknown as import('../types.js').Json,
  );
  const trace_identity = computeTraceIdentity(
    payload.experiment_id,
    payload_hash_for_identity,
    payload.budgets.step_budget,
    raw_contracts.trace_identity,
  );
  // secrets_audit throws if a required secret is missing — that is an
  // intentional do-not-boot. Optional misses recorded as degraded.
  const secrets_audit = auditSecrets(raw_contracts.secrets_contract, resolved_at);
  const version_lineage = resolveVersionLineage({
    payload_version: raw_payload_version,
    resolved_at,
    declared: raw_contracts.version_lineage,
  });
  const deployment_contract = resolveDeploymentContract(raw_contracts.deployment_contract);

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

  // Validate trace_identity contract against the actual loop output —
  // require_span_id_per_step is only checked AFTER we know steps_executed.
  assertTraceIdentity(trace_identity, result.summary.steps_executed);

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

  // 4. Run summary — bound to the four operational contracts so any
  // consumer can verify trace identity, version lineage, secrets posture,
  // and deployment expectations from a single document.
  writeJson(out(payload.platform.output_paths.run_summary), {
    ...result.summary,
    payload_path,
    payload_version: payload.version,
    payload_experiment_id: payload.experiment_id,
    receipts_emitted: result.receipts.length,
    approvals_recorded: result.approvals.length,
    ledger_size: result.ledger.length,
    ledger_digest: ledger.digest(),
    trace_identity: {
      run_id: trace_identity.run_id,
      trace_id: trace_identity.trace_id,
      span_count: result.summary.steps_executed,
    },
    version_lineage,
    secrets_status: {
      degraded: secrets_audit.degraded,
      missing_required: secrets_audit.missing_required,
      missing_optional: secrets_audit.missing_optional,
      behavior: secrets_audit.contract.missing_secret_behavior,
    },
    deployment_contract,
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
  // Sidecar artifacts for the four operational contracts. These are
  // independently consumable: an auditor can hash the trace, hash the
  // identity manifest, and re-derive the binding from (experiment_id +
  // payload_hash) using the same deterministic seed the runner uses.
  const run_identity_manifest = buildRunIdentityManifest(
    payload.experiment_id,
    payload_hash_for_identity,
    trace_identity,
    result.summary.steps_executed,
  );
  writeJson(out('output/run_identity.json'), run_identity_manifest);
  writeJson(out('output/version_lineage.json'), version_lineage);
  writeJson(out('output/secrets_status.json'), secrets_audit);
  writeJson(out('output/deployment_contract.json'), {
    ...deployment_contract,
    healthcheck_payload: {
      ok: true,
      payload_version: version_lineage.payload_version,
      kernel_version: version_lineage.kernel_version,
      repo_commit: version_lineage.repo_commit,
      run_id: trace_identity.run_id,
    },
  });

  writeJson(out('output/run_manifest.json'), {
    experiment_id: payload.experiment_id,
    payload_version: payload.version,
    payload_hash,
    output_root,
    final_state_hash: result.summary.final_state_hash,
    ledger_digest: ledger.digest(),
    deliverables,
    // Bind the four operational contracts to this manifest so a single
    // hash check verifies (a) the bytes, (b) the identity, (c) the lineage,
    // (d) the secrets posture, (e) the deployment expectation.
    trace_identity: {
      run_id: trace_identity.run_id,
      trace_id: trace_identity.trace_id,
      manifest_hash: run_identity_manifest.manifest_hash,
    },
    version_lineage,
    secrets_status: {
      degraded: secrets_audit.degraded,
      missing_required_count: secrets_audit.missing_required.length,
      missing_optional_count: secrets_audit.missing_optional.length,
    },
    deployment_contract: {
      platform: deployment_contract.platform,
      healthcheck_path: deployment_contract.healthcheck.path,
      expected_status: deployment_contract.healthcheck.expected_status,
    },
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
