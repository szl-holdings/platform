#!/usr/bin/env node
/**
 * Codex-Kernel replay verifier — `pnpm codex:replay`.
 *
 * Reads the artifacts written by `codex:run`:
 *   - ./output/trace.jsonl
 *   - ./output/final_state.json (for expected_final_state_hash)
 *   - runner/payload.json       (for initial_state)
 *
 * Re-derives the final state from initial_state + the recorded deltas, then
 * recomputes the chain hash. Any mismatch surfaces as a non-zero exit and a
 * red attestation. This is the same code path Sentra's
 * `replay-attestation` page exercises in the browser.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseTraceJsonl, replay, type VenusState } from '../index.js';
import { DRESDEN_INITIAL_STATE } from '../dresden-venus.js';
import { normalizeRawPayload } from './normalize.js';
import { PACKAGE_ROOT, resolveOutputRoot } from './paths.js';
import { assertPayload, type CodexPayload } from './payload.js';

interface CliPaths {
  payload_path: string;
  trace_path: string;
  final_state_path: string;
}

function resolvePaths(): CliPaths {
  // CLI overrides: codex:replay <trace_path> <final_state_path> <payload_path>
  // Defaults share resolveOutputRoot() with the runner so `codex:run` and
  // `codex:replay` always agree on where the deliverables live. Env-var
  // overrides (CODEX_PAYLOAD_PATH) let scripts like `codex:replay:szl`
  // point at a non-default payload without locking in absolute paths.
  const [t, f, p] = process.argv.slice(2);
  const output_root = resolveOutputRoot();
  // Relative trace/state paths resolve against output_root so a user who
  // passes "output/trace.jsonl" (the canonical bundle layout) lands on
  // the same file the runner just wrote — regardless of cwd.
  const resolveAgainstOutput = (arg: string): string =>
    resolve(output_root, arg);
  // Payload paths resolve against PACKAGE_ROOT so the npm scripts can use
  // "runner/<name>.payload.json" verbatim.
  const resolvePayload = (arg: string): string =>
    resolve(PACKAGE_ROOT, arg);
  const payload_arg = p ?? process.env.CODEX_PAYLOAD_PATH;
  return {
    payload_path: payload_arg
      ? resolvePayload(payload_arg)
      : resolve(PACKAGE_ROOT, 'runner', 'payload.json'),
    trace_path: t
      ? resolveAgainstOutput(t)
      : resolve(output_root, 'output', 'trace.jsonl'),
    final_state_path: f
      ? resolveAgainstOutput(f)
      : resolve(output_root, 'output', 'final_state.json'),
  };
}

function loadPayload(payload_path: string): CodexPayload {
  const raw = readFileSync(payload_path, 'utf-8');
  const parsed = JSON.parse(raw) as unknown;
  // Match the runner: lift lean payloads (e.g. SZL) to the strict shape so
  // run + replay always agree on what the contract says.
  const normalized = normalizeRawPayload(parsed);
  assertPayload(normalized);
  return normalized;
}

function buildInitialState(p: CodexPayload): VenusState {
  return {
    ...DRESDEN_INITIAL_STATE,
    epoch_label: p.initial_state.codex_emulation.epoch_label,
    day_index: p.initial_state.codex_emulation.day_index,
    cycle_position: p.initial_state.codex_emulation.cycle_position,
    drift_days: p.initial_state.codex_emulation.drift_days,
    table_rows_emitted: p.initial_state.codex_emulation.table_rows_emitted,
    row_history: [],
  };
}

function main(): void {
  const paths = resolvePaths();
  const payload = loadPayload(paths.payload_path);
  const trace_text = readFileSync(paths.trace_path, 'utf-8');
  const final_state_text = readFileSync(paths.final_state_path, 'utf-8');

  const trace = parseTraceJsonl(trace_text);
  const final_state_doc = JSON.parse(final_state_text) as {
    final_state_hash: string;
  };
  const initial_state = buildInitialState(payload);

  const report = replay<VenusState>(
    initial_state,
    trace,
    final_state_doc.final_state_hash,
  );

  const verdict = report.ok ? 'ATTESTED' : 'BROKEN';
  // eslint-disable-next-line no-console
  console.log(
    [
      `codex-kernel replay — ${payload.experiment_id}`,
      `  verdict:                  ${verdict}`,
      `  steps_replayed:           ${report.steps_replayed}`,
      `  failed_step:              ${report.failed_step ?? '—'}`,
      `  failure_reason:           ${report.failure_reason ?? '—'}`,
      `  recomputed_final_hash:    ${report.final_state_hash ?? '—'}`,
      `  expected_final_hash:      ${report.expected_final_state_hash ?? '—'}`,
    ].join('\n'),
  );

  if (!report.ok) process.exit(2);
}

try {
  main();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('codex-kernel replay failed:', err);
  process.exit(1);
}
