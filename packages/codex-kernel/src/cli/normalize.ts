/**
 * Codex-Kernel runner — payload normalizer.
 *
 * The kernel CLI accepts two payload shapes:
 *
 *   1. The "strict E4 spec" (see `payload.ts` / `runner/payload.json`) —
 *      every field the runner reads is declared inline. Used for the
 *      Dresden Venus reference run.
 *
 *   2. A "lean operational spec" (see `runner/szl-private-governed-ops-001.payload.json`) —
 *      the shape a real operator writes when describing a private governed
 *      loop. It declares intent (governance posture, budgets, drift model,
 *      domain packs, source registry, expected output files) without
 *      restating runner-mechanical fields like `adaptive_depth.enabled` or
 *      `proof_ledger.mode`.
 *
 * `normalizeRawPayload` lifts the lean shape into the strict shape by
 * filling in mechanical defaults derived from the operator's intent. The
 * result is the single contract `assertPayload` then validates and the
 * runner consumes. The lift is the operationalization step: a real
 * governance spec, executable by the kernel, replayable by anyone.
 */

import type { CodexPayload } from './payload.js';

/**
 * Detects whether the parsed JSON is already a strict E4 payload (has
 * `platform.output_paths`) or a lean operational payload (has
 * `expected_outputs.files`). Returns a strict E4 payload either way.
 *
 * Throws if neither shape is recognizable so a typo can't silently fall
 * through to defaults.
 */
export function normalizeRawPayload(raw: unknown): CodexPayload {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('payload: must be a JSON object');
  }
  const o = raw as Record<string, unknown>;

  if (isStrictE4Shape(o)) {
    return o as unknown as CodexPayload;
  }
  if (isLeanOperationalShape(o)) {
    return liftLeanToStrict(o);
  }
  throw new Error(
    'payload: unrecognized shape (need either platform.output_paths or expected_outputs.files)',
  );
}

function isStrictE4Shape(o: Record<string, unknown>): boolean {
  const platform = o.platform as Record<string, unknown> | undefined;
  return Boolean(
    platform && typeof platform === 'object' && 'output_paths' in platform,
  );
}

function isLeanOperationalShape(o: Record<string, unknown>): boolean {
  const eo = o.expected_outputs as Record<string, unknown> | undefined;
  return Boolean(eo && typeof eo === 'object' && Array.isArray(eo.files));
}

/**
 * Map a lean payload's `expected_outputs.files` array into the strict
 * `platform.output_paths` keyed object. The mapping is by basename so the
 * operator can declare the bundle layout without memorizing kernel keys.
 */
function expectedOutputsToPaths(files: unknown): CodexPayload['platform']['output_paths'] {
  if (!Array.isArray(files)) {
    throw new Error('payload.expected_outputs.files: must be an array');
  }
  const by_basename = new Map<string, string>();
  for (const f of files) {
    if (typeof f !== 'string' || f.length === 0) {
      throw new Error('payload.expected_outputs.files[]: must be non-empty strings');
    }
    const rel = f.startsWith('./') || f.startsWith('/') ? f : `./${f}`;
    const base = f.split('/').pop() ?? f;
    by_basename.set(base, rel);
  }
  const required = [
    ['final_table_preview', 'final_table_preview.json'],
    ['trace_jsonl', 'trace.jsonl'],
    ['decision_receipt', 'decision_receipt.json'],
    ['proof_ledger_jsonl', 'proof_ledger.jsonl'],
    ['final_state', 'final_state.json'],
    ['run_summary', 'run_summary.json'],
  ] as const;
  const out: Partial<CodexPayload['platform']['output_paths']> = {};
  for (const [key, basename] of required) {
    const v = by_basename.get(basename);
    if (!v) {
      throw new Error(
        `payload.expected_outputs.files: missing required deliverable '${basename}'`,
      );
    }
    out[key] = v;
  }
  return out as CodexPayload['platform']['output_paths'];
}

function liftLeanToStrict(o: Record<string, unknown>): CodexPayload {
  // Anchors — the lean shape uses prose strings; the strict shape wants
  // structured anchors so receipts can cite them. We preserve the operator
  // string verbatim as the canonical claim.
  const thesis_anchor_raw = o.thesis_anchor;
  const artifact_anchor_raw = o.artifact_anchor;
  if (typeof thesis_anchor_raw !== 'string' || thesis_anchor_raw.length === 0) {
    throw new Error('payload.thesis_anchor: must be a non-empty string in lean payload');
  }
  if (typeof artifact_anchor_raw !== 'string' || artifact_anchor_raw.length === 0) {
    throw new Error('payload.artifact_anchor: must be a non-empty string in lean payload');
  }

  const env = (o.environment ?? {}) as Record<string, unknown>;
  const goal = (o.goal ?? {}) as Record<string, unknown>;
  const init = (o.initial_state ?? {}) as Record<string, unknown>;
  const ce = (init.codex_emulation ?? {}) as Record<string, unknown>;
  const init_gov = (init.governance ?? {}) as Record<string, unknown>;
  const init_runner = (init.runner_state ?? {}) as Record<string, unknown>;
  const gov_model = (o.governance_model ?? {}) as Record<string, unknown>;
  const lp = (o.loop_policy ?? {}) as Record<string, unknown>;
  const b = (o.budgets ?? {}) as Record<string, unknown>;
  const tm = (o.transition_model ?? {}) as Record<string, unknown>;
  const btr = (tm.base_transition_rule ?? {}) as Record<string, unknown>;
  const dm = (tm.drift_model ?? {}) as Record<string, unknown>;
  const sched = (dm.schedule ?? {}) as Record<string, unknown>;
  const eo = (o.expected_outputs ?? {}) as Record<string, unknown>;

  const policy_version =
    (init_gov.policy_version as string | undefined) ??
    (gov_model.policy_version as string | undefined) ??
    'covenant-v1-szl';

  const target_rows = (goal.target_rows as number | undefined) ?? 12;

  const lifted: CodexPayload = {
    experiment_id: requireString(o.experiment_id, 'payload.experiment_id'),
    title: 'SZL Holdings — Private Governed Operations',
    version: '1.0.0-szl',
    platform: {
      target: (env.runtime as string | undefined) ?? 'replit',
      runner_type: 'agentic-loop-runner',
      runtime: 'nodejs',
      entry_behavior: 'execute_payload',
      mode: 'final+trace',
      environment: {
        allow_file_write: true,
        allow_network: env.network_access === 'required',
        allow_external_actions: false,
        require_human_for_material_actions: Boolean(
          (gov_model.human_gate_policy as Record<string, unknown> | undefined)
            ?.required_for_material_actions ?? true,
        ),
      },
      output_paths: expectedOutputsToPaths(eo.files),
    },
    artifact_anchor: {
      name: 'SZL Private Operating Model',
      section_focus: 'venus_table',
      use: artifact_anchor_raw,
      mapping_mode: 'simplified_venus_cycle_emulator',
    },
    thesis_anchor: {
      source: 'payload.thesis_anchor',
      claims: [thesis_anchor_raw],
    },
    pipeline: [
      'Signal',
      'Context',
      'Recommendation',
      'Simulation',
      'Policy',
      'Approval',
      'Execution',
      'Proof',
      'Outcome',
    ],
    goal: {
      task: 'Produce auditable governed loop outputs for private SZL operations.',
      deliverables: [
        'final_table_preview',
        'trace.jsonl',
        'decision_receipt.json',
        'proof_ledger.jsonl',
        'final_state.json',
        'run_summary.json',
      ],
      target_rows,
      success_condition: 'final_state_reproducible_from_initial_state_plus_deltas',
    },
    initial_state: {
      codex_emulation: {
        epoch_label: (ce.epoch_label as string | undefined) ?? 'private-governed-loop',
        day_index: (ce.day_index as number | undefined) ?? 0,
        cycle_position: (ce.cycle_position as number | undefined) ?? 0,
        expected_period_days: 584,
        drift_days: (ce.drift_days as number | undefined) ?? 0,
        table_rows_emitted: (ce.table_rows_emitted as number | undefined) ?? 0,
        row_history: [],
      },
      governance: {
        human_approval_required: Boolean(
          init_gov.human_approval_required_for_material_actions ?? true,
        ),
        policy_version,
        review_mode: 'final+trace',
        no_bypass: true,
      },
      proof_ledger: {
        mode: 'append_only',
        entries: 0,
        last_state_hash: null,
      },
      runner_state: {
        current_step: (init_runner.current_step as number | undefined) ?? 0,
        validator_score: 0,
        stable_validator_pass_streak: 0,
        retries_used: 0,
        status: (init_runner.status as string | undefined) ?? 'initialized',
        stop_reason: null,
      },
    },
    loop_policy: {
      max_steps: (lp.max_steps as number | undefined) ?? 30,
      adaptive_depth: {
        // v3 EntropyDepthAllocator (§3.2) is opt-in: enabling it here would
        // make the canonical CLI runner exit early on entropy settling and
        // break the documented row-count baseline. Callers wanting adaptive
        // depth set this to true in their own payload.
        enabled: false,
        increase_depth_on: ['validator_soft_fail', 'drift_warning', 'contradiction_found'],
        decrease_depth_on: ['stable_validator_pass_streak'],
      },
      entropy_regularized_exit: {
        enabled: true,
        exit_when: 'additional_steps_do_not_improve_validator_score',
      },
      stop_conditions: normalizeStopConditions(lp.stop_conditions),
    },
    budgets: {
      time_budget_ms: (b.time_budget_ms as number | undefined) ?? 120000,
      token_budget: (b.token_budget as number | undefined) ?? 0,
      step_budget: (b.step_budget as number | undefined) ?? 30,
      retry_budget: 2,
    },
    transition_model: {
      emulator_type: 'simplified_venus_cycle_emulator',
      row_emission_rule: 'emit_one_row_per_step',
      base_transition_rule: {
        cycle_position_increment:
          (btr.cycle_position_increment as number | undefined) ?? 1,
        day_index_increment: (btr.day_index_increment as number | undefined) ?? 584,
      },
      drift_model: {
        enabled: true,
        default_drift_increment: 0,
        warning_threshold: (dm.warning_threshold as number | undefined) ?? 2,
        hard_threshold: (dm.hard_threshold as number | undefined) ?? 5,
        schedule: {
          type: 'every_n_rows',
          n: (sched.n as number | undefined) ?? 5,
          increment: (sched.increment as number | undefined) ?? 1,
        },
      },
      correction_rule: {
        allowed_only_when: ['drift_warning', 'drift_threshold_exceeded'],
        requires_justification: true,
        requires_decision_receipt: true,
      },
    },
    validators: [
      { name: 'state_transition_rule', type: 'deterministic', hard_stop: true },
      { name: 'drift_bounds', type: 'deterministic', hard_stop: false },
      { name: 'evidence_provenance', type: 'governance', hard_stop: true },
      { name: 'human_gate', type: 'governance', hard_stop: true },
    ],
    approval_flow: {
      mode: 'interrupt_and_wait',
      approval_required_for: [
        'material_state_change',
        'external_write_beyond_output_paths',
        'network_call',
        'execution_beyond_simulation',
        'policy_override',
      ],
    },
  };

  return lifted;
}

/**
 * Lean payloads write `stop_conditions` as `["convergence", "budget_exhausted", ...]`.
 * Strict payloads expect `[{ type: "convergence", rule?: "..." }, ...]`. Lift
 * the strings; pass objects through.
 */
function normalizeStopConditions(
  raw: unknown,
): Array<{ type: string; rule?: string }> {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      { type: 'convergence', rule: 'no_state_change_needed' },
      { type: 'budget_exhausted' },
      { type: 'human_gate_required' },
      { type: 'validator_hard_stop' },
    ];
  }
  return raw.map((c) => {
    if (typeof c === 'string') return { type: c };
    if (c && typeof c === 'object' && 'type' in c) {
      return c as { type: string; rule?: string };
    }
    throw new Error(
      'payload.loop_policy.stop_conditions[]: must be string or { type, rule? }',
    );
  });
}

function requireString(v: unknown, ctx: string): string {
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`${ctx}: must be a non-empty string`);
  }
  return v;
}
