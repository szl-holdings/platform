/**
 * Codex-Kernel runner — payload contract.
 *
 * This is the runtime shape of `runner/payload.json`. The CLI entry
 * (`src/cli/run.ts`) loads + validates the payload, then drives the kernel.
 */

export interface CodexPayload {
  experiment_id: string;
  title: string;
  version: string;
  platform: {
    target: string;
    runner_type: string;
    runtime: string;
    entry_behavior: string;
    mode: string;
    environment: {
      allow_file_write: boolean;
      allow_network: boolean;
      allow_external_actions: boolean;
      require_human_for_material_actions: boolean;
    };
    output_paths: {
      final_table_preview: string;
      trace_jsonl: string;
      decision_receipt: string;
      proof_ledger_jsonl: string;
      final_state: string;
      run_summary: string;
    };
  };
  artifact_anchor: {
    name: string;
    section_focus: string;
    use: string;
    mapping_mode: string;
  };
  thesis_anchor: { source: string; claims: string[] };
  pipeline: string[];
  goal: {
    task: string;
    deliverables: string[];
    target_rows: number;
    success_condition: string;
  };
  initial_state: {
    codex_emulation: {
      epoch_label: string;
      day_index: number;
      cycle_position: number;
      expected_period_days: number;
      drift_days: number;
      table_rows_emitted: number;
      row_history: unknown[];
    };
    governance: {
      human_approval_required: boolean;
      policy_version: string;
      review_mode: string;
      no_bypass: boolean;
    };
    proof_ledger: {
      mode: 'append_only';
      entries: number;
      last_state_hash: string | null;
    };
    runner_state: {
      current_step: number;
      validator_score: number;
      stable_validator_pass_streak: number;
      retries_used: number;
      status: string;
      stop_reason: string | null;
    };
  };
  loop_policy: {
    max_steps: number;
    adaptive_depth: {
      enabled: boolean;
      increase_depth_on: string[];
      decrease_depth_on: string[];
    };
    entropy_regularized_exit: { enabled: boolean; exit_when: string };
    stop_conditions: Array<{ type: string; rule?: string }>;
  };
  budgets: {
    time_budget_ms: number;
    token_budget: number;
    step_budget: number;
    retry_budget: number;
  };
  transition_model: {
    emulator_type: string;
    row_emission_rule: string;
    base_transition_rule: {
      cycle_position_increment: number;
      day_index_increment: number;
    };
    drift_model: {
      enabled: boolean;
      default_drift_increment: number;
      warning_threshold: number;
      hard_threshold: number;
      schedule: { type: string; n: number; increment: number };
    };
    correction_rule: {
      allowed_only_when: string[];
      requires_justification: boolean;
      requires_decision_receipt: boolean;
    };
  };
  validators: Array<{
    name: string;
    type: 'deterministic' | 'governance';
    hard_stop: boolean;
  }>;
  approval_flow: {
    mode: string;
    approval_required_for: string[];
  };
}

/**
 * Deep structural validator (no extra deps). Walks the payload and asserts
 * the runtime types/shapes the runner depends on. Throws with a path-prefixed
 * message on the first breach (so a malformed payload fails fast, not deep
 * inside the loop).
 */
export function assertPayload(p: unknown): asserts p is CodexPayload {
  const ctx = 'payload';
  asObject(p, ctx);
  const o = p as Record<string, unknown>;

  asString(o.experiment_id, `${ctx}.experiment_id`);
  asString(o.title, `${ctx}.title`);
  asString(o.version, `${ctx}.version`);

  // platform.output_paths — the six declared deliverables, all relative paths.
  const platform = asObject(o.platform, `${ctx}.platform`);
  const env = asObject(platform.environment, `${ctx}.platform.environment`);
  asBoolean(env.allow_file_write, `${ctx}.platform.environment.allow_file_write`);
  asBoolean(env.allow_network, `${ctx}.platform.environment.allow_network`);
  const paths = asObject(platform.output_paths, `${ctx}.platform.output_paths`);
  for (const key of [
    'final_table_preview',
    'trace_jsonl',
    'decision_receipt',
    'proof_ledger_jsonl',
    'final_state',
    'run_summary',
  ] as const) {
    const v = paths[key];
    asString(v, `${ctx}.platform.output_paths.${key}`);
    if ((v as string).length === 0) {
      throw new Error(`${ctx}.platform.output_paths.${key}: empty string`);
    }
  }

  // goal.target_rows — must be a positive integer.
  const goal = asObject(o.goal, `${ctx}.goal`);
  asString(goal.task, `${ctx}.goal.task`);
  asNumber(goal.target_rows, `${ctx}.goal.target_rows`);
  if (!Number.isInteger(goal.target_rows) || (goal.target_rows as number) <= 0) {
    throw new Error(`${ctx}.goal.target_rows: must be a positive integer`);
  }

  // initial_state — runner reads codex_emulation, governance, runner_state.
  const init = asObject(o.initial_state, `${ctx}.initial_state`);
  const ce = asObject(init.codex_emulation, `${ctx}.initial_state.codex_emulation`);
  asString(ce.epoch_label, `${ctx}.initial_state.codex_emulation.epoch_label`);
  asNumber(ce.day_index, `${ctx}.initial_state.codex_emulation.day_index`);
  asNumber(ce.cycle_position, `${ctx}.initial_state.codex_emulation.cycle_position`);
  asNumber(ce.drift_days, `${ctx}.initial_state.codex_emulation.drift_days`);
  asNumber(
    ce.table_rows_emitted,
    `${ctx}.initial_state.codex_emulation.table_rows_emitted`,
  );
  const gov = asObject(init.governance, `${ctx}.initial_state.governance`);
  asString(gov.policy_version, `${ctx}.initial_state.governance.policy_version`);
  asBoolean(gov.no_bypass, `${ctx}.initial_state.governance.no_bypass`);

  // loop_policy
  const lp = asObject(o.loop_policy, `${ctx}.loop_policy`);
  asNumber(lp.max_steps, `${ctx}.loop_policy.max_steps`);
  asObject(lp.adaptive_depth, `${ctx}.loop_policy.adaptive_depth`);
  asObject(lp.entropy_regularized_exit, `${ctx}.loop_policy.entropy_regularized_exit`);

  // budgets
  const b = asObject(o.budgets, `${ctx}.budgets`);
  asNumber(b.time_budget_ms, `${ctx}.budgets.time_budget_ms`);
  asNumber(b.step_budget, `${ctx}.budgets.step_budget`);
  asNumber(b.retry_budget, `${ctx}.budgets.retry_budget`);

  // transition_model — drift_model schedule must validate so the
  // payload→Dresden mapping is faithful (no fractional collapse).
  const tm = asObject(o.transition_model, `${ctx}.transition_model`);
  const btr = asObject(tm.base_transition_rule, `${ctx}.transition_model.base_transition_rule`);
  asNumber(
    btr.cycle_position_increment,
    `${ctx}.transition_model.base_transition_rule.cycle_position_increment`,
  );
  asNumber(
    btr.day_index_increment,
    `${ctx}.transition_model.base_transition_rule.day_index_increment`,
  );
  const dm = asObject(tm.drift_model, `${ctx}.transition_model.drift_model`);
  asBoolean(dm.enabled, `${ctx}.transition_model.drift_model.enabled`);
  asNumber(
    dm.default_drift_increment,
    `${ctx}.transition_model.drift_model.default_drift_increment`,
  );
  asNumber(dm.warning_threshold, `${ctx}.transition_model.drift_model.warning_threshold`);
  asNumber(dm.hard_threshold, `${ctx}.transition_model.drift_model.hard_threshold`);
  const sched = asObject(dm.schedule, `${ctx}.transition_model.drift_model.schedule`);
  asString(sched.type, `${ctx}.transition_model.drift_model.schedule.type`);
  if (sched.type !== 'every_n_rows') {
    throw new Error(
      `${ctx}.transition_model.drift_model.schedule.type: only 'every_n_rows' is supported (got ${String(sched.type)})`,
    );
  }
  asNumber(sched.n, `${ctx}.transition_model.drift_model.schedule.n`);
  if (!Number.isInteger(sched.n) || (sched.n as number) <= 0) {
    throw new Error(`${ctx}.transition_model.drift_model.schedule.n: must be a positive integer`);
  }
  asNumber(sched.increment, `${ctx}.transition_model.drift_model.schedule.increment`);

  if (!Array.isArray(o.validators)) {
    throw new Error(`${ctx}.validators: must be an array`);
  }
}

function asObject(v: unknown, ctx: string): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) {
    throw new Error(`${ctx}: must be an object`);
  }
  return v as Record<string, unknown>;
}
function asString(v: unknown, ctx: string): void {
  if (typeof v !== 'string') throw new Error(`${ctx}: must be a string`);
}
function asNumber(v: unknown, ctx: string): void {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new Error(`${ctx}: must be a finite number`);
  }
}
function asBoolean(v: unknown, ctx: string): void {
  if (typeof v !== 'boolean') throw new Error(`${ctx}: must be a boolean`);
}
