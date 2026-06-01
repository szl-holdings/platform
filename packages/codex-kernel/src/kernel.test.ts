/**
 * Codex-Kernel — round-trip integration tests.
 * Demonstrates: deterministic Dresden Venus run → trace serialization →
 * replay verification → governance A/B comparison.
 */

import { describe, expect, test } from 'vitest';
import {
  DRESDEN_DEFAULT_CONFIG,
  DRESDEN_INITIAL_STATE,
  dresdenSteps,
  parseTraceJsonl,
  replay,
  runLoop,
  serializeTraceJsonl,
  type VenusState,
} from './index.js';

const FIXED_NOW = (() => {
  let n = 0;
  return () => `2026-04-29T00:00:${String(n++).padStart(2, '0')}.000Z`;
})();

describe('Codex-Kernel — Dresden Venus reference', () => {
  test('runs to convergence with no drift', () => {
    const result = runLoop<VenusState>({
      experiment_id: 'E4',
      initial_state: DRESDEN_INITIAL_STATE,
      policy_version: 'covenant-v1',
      budgets: { time_budget_ms: 5_000, step_budget: 30, retry_budget: 0 },
      loop_policy: { max_steps: 30, adaptive_depth: { enabled: false }, entropy_regularized_exit: { enabled: false } },
      governance_enabled: true,
      steps: dresdenSteps({ ...DRESDEN_DEFAULT_CONFIG, rows_to_emit: 5 }),
      now: FIXED_NOW,
    });
    expect(result.summary.status).toBe('ok');
    expect(result.summary.steps_executed).toBe(5);
    expect(result.summary.hard_stop_failures).toBe(0);
    expect(result.final_state.table_rows_emitted).toBe(5);
    expect(result.final_state.day_index).toBe(5 * 584);
    expect(result.receipts).toHaveLength(5);
    expect(result.ledger).toHaveLength(5);
  });

  test('triggers a correction when drift accumulates', () => {
    const result = runLoop<VenusState>({
      experiment_id: 'E4',
      initial_state: DRESDEN_INITIAL_STATE,
      policy_version: 'covenant-v1',
      budgets: { time_budget_ms: 5_000, step_budget: 30, retry_budget: 0 },
      loop_policy: { max_steps: 30, adaptive_depth: { enabled: false }, entropy_regularized_exit: { enabled: false } },
      governance_enabled: true,
      steps: dresdenSteps({
        ...DRESDEN_DEFAULT_CONFIG,
        drift_per_cycle: 1,
        rows_to_emit: 8,
      }),
    });
    expect(result.summary.status).toBe('ok');
    const corrections = result.final_state.row_history.filter(
      (r) => r.correction_applied !== 0,
    );
    expect(corrections.length).toBeGreaterThan(0);
  });

  test('replay verifies the trace exactly', () => {
    const result = runLoop<VenusState>({
      experiment_id: 'E4',
      initial_state: DRESDEN_INITIAL_STATE,
      policy_version: 'covenant-v1',
      budgets: { time_budget_ms: 5_000, step_budget: 30, retry_budget: 0 },
      loop_policy: { max_steps: 30, adaptive_depth: { enabled: false }, entropy_regularized_exit: { enabled: false } },
      governance_enabled: true,
      steps: dresdenSteps({ ...DRESDEN_DEFAULT_CONFIG, rows_to_emit: 7 }),
    });
    const jsonl = serializeTraceJsonl(result.trace);
    const parsed = parseTraceJsonl(jsonl);
    const report = replay(
      DRESDEN_INITIAL_STATE,
      parsed,
      result.summary.final_state_hash,
    );
    expect(report.ok).toBe(true);
    expect(report.failed_step).toBeNull();
    expect(report.steps_replayed).toBe(7);
  });

  test('a tampered trace fails replay deterministically', () => {
    const result = runLoop<VenusState>({
      experiment_id: 'E4',
      initial_state: DRESDEN_INITIAL_STATE,
      policy_version: 'covenant-v1',
      budgets: { time_budget_ms: 5_000, step_budget: 30, retry_budget: 0 },
      loop_policy: { max_steps: 30, adaptive_depth: { enabled: false }, entropy_regularized_exit: { enabled: false } },
      governance_enabled: true,
      steps: dresdenSteps({ ...DRESDEN_DEFAULT_CONFIG, rows_to_emit: 4 }),
    });
    const tampered = result.trace.map((e, i) => {
      if (i === 1) {
        const delta = e.proposed_delta as Record<string, number>;
        return {
          ...e,
          proposed_delta: { ...delta, day_index: delta.day_index + 1 },
        };
      }
      return e;
    });
    const report = replay(DRESDEN_INITIAL_STATE, tampered);
    expect(report.ok).toBe(false);
    expect(report.failed_step).not.toBeNull();
  });

  test('replay rejects events appended after a terminal stop_reason', () => {
    const result = runLoop<VenusState>({
      experiment_id: 'E4',
      initial_state: DRESDEN_INITIAL_STATE,
      policy_version: 'covenant-v1',
      budgets: { time_budget_ms: 5_000, step_budget: 30, retry_budget: 0 },
      loop_policy: { max_steps: 30, adaptive_depth: { enabled: false }, entropy_regularized_exit: { enabled: false } },
      governance_enabled: true,
      steps: dresdenSteps({ ...DRESDEN_DEFAULT_CONFIG, rows_to_emit: 3 }),
    });
    // Inject a synthetic terminal event mid-trace, then keep the original tail.
    const cut = 1;
    const fakeTerminal = {
      ...result.trace[cut],
      stop_reason: 'manual_stop' as const,
      state_next_hash: result.trace[cut].state_prev_hash,
    };
    const tampered = [
      ...result.trace.slice(0, cut),
      fakeTerminal,
      ...result.trace.slice(cut + 1),
    ];
    const report = replay(DRESDEN_INITIAL_STATE, tampered);
    expect(report.ok).toBe(false);
    expect(report.failure_reason).toMatch(/appended-after-stop/);
  });

  test('approval declared without an ApprovalEvent is treated as pending and halts', () => {
    function* unbackedApproveSteps() {
      yield {
        pipeline_stage: 'Execution' as const,
        observation: {},
        proposeDelta: () => ({ x: 1 }),
        validators: [],
        buildReceipt: () => ({
          decision_type: 'forge',
          summary: 'forged approval',
          assumptions: ['none'],
          evidence: [{ kind: 'doc', ref: 'ref://x' }],
          policy_version: 'covenant-v1',
          approval_status: 'approved' as const,
          mocked: false,
        }),
        // Step lies and says it is already approved.
        requireApproval: () => 'approved' as const,
      };
    }
    const out = runLoop({
      experiment_id: 'BYPASS',
      initial_state: { x: 0 } as { x: number },
      policy_version: 'covenant-v1',
      budgets: { time_budget_ms: 5_000, step_budget: 5, retry_budget: 0 },
      loop_policy: { max_steps: 5, adaptive_depth: { enabled: false }, entropy_regularized_exit: { enabled: false } },
      governance_enabled: true,
      steps: unbackedApproveSteps(),
      // No resolveApproval supplied — so the kernel cannot back the claim.
    });
    expect(out.summary.hard_stop_failures).toBe(1);
    expect(out.summary.stop_reason).toBe('human_gate_required');
    expect(out.approvals).toHaveLength(0);
  });

  test('governance_enabled = false demotes evidence_provenance hard fails to soft', () => {
    function* missingReceiptSteps() {
      yield {
        pipeline_stage: 'Execution' as const,
        observation: {},
        proposeDelta: () => ({ x: 1 }),
        validators: [],
        buildReceipt: () => null,
      };
      yield {
        pipeline_stage: 'Execution' as const,
        observation: {},
        proposeDelta: () => ({ x: 2 }),
        validators: [],
        buildReceipt: () => null,
      };
    }
    const off = runLoop({
      experiment_id: 'AB',
      initial_state: { x: 0 } as { x: number },
      policy_version: 'covenant-v1',
      budgets: { time_budget_ms: 5_000, step_budget: 5, retry_budget: 0 },
      loop_policy: { max_steps: 5, adaptive_depth: { enabled: false }, entropy_regularized_exit: { enabled: false } },
      governance_enabled: false,
      steps: missingReceiptSteps(),
    });
    expect(off.summary.hard_stop_failures).toBe(0);
    expect(off.summary.soft_failures).toBeGreaterThan(0);

    const on = runLoop({
      experiment_id: 'AB',
      initial_state: { x: 0 } as { x: number },
      policy_version: 'covenant-v1',
      budgets: { time_budget_ms: 5_000, step_budget: 5, retry_budget: 0 },
      loop_policy: { max_steps: 5, adaptive_depth: { enabled: false }, entropy_regularized_exit: { enabled: false } },
      governance_enabled: true,
      steps: missingReceiptSteps(),
    });
    expect(on.summary.hard_stop_failures).toBe(1);
    expect(on.summary.steps_executed).toBe(1);
  });
});
