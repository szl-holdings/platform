/**
 * Sentra — Replay Attestation.
 *
 * The auditor surface for the @workspace/codex-kernel: paste a trace.jsonl
 * (e.g. exported from Amaru's Codex Loop) plus the expected initial state
 * and final state hash, and the page reconstructs the chain step by step.
 *
 * Green attestation = every transition recomputes exactly. Red = the chain
 * was tampered with, and the page tells you the failing step.
 */

import { useMemo, useState } from 'react';
import {
  DRESDEN_DEFAULT_CONFIG,
  DRESDEN_INITIAL_STATE,
  dresdenSteps,
  type Json,
  parseTraceJsonl,
  replay,
  runLoop,
  serializeTraceJsonl,
  shortHash,
  type VenusState,
} from '@workspace/codex-kernel';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardPaste,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';

interface AttestationInputs {
  initial_state_json: string;
  trace_jsonl: string;
  expected_final_state_hash: string;
}

const EMPTY: AttestationInputs = {
  initial_state_json: '',
  trace_jsonl: '',
  expected_final_state_hash: '',
};

function generateReferenceBundle(): AttestationInputs {
  const result = runLoop<VenusState>({
    experiment_id: 'E4',
    initial_state: DRESDEN_INITIAL_STATE,
    policy_version: 'covenant-v1',
    budgets: { time_budget_ms: 5_000, step_budget: 30, retry_budget: 0 },
    loop_policy: {
      max_steps: 30,
      adaptive_depth: { enabled: false },
      entropy_regularized_exit: { enabled: false },
    },
    governance_enabled: true,
    steps: dresdenSteps({
      ...DRESDEN_DEFAULT_CONFIG,
      drift_per_cycle: 1,
      rows_to_emit: 6,
    }),
  });
  return {
    initial_state_json: JSON.stringify(DRESDEN_INITIAL_STATE, null, 2),
    trace_jsonl: serializeTraceJsonl(result.trace),
    expected_final_state_hash: result.summary.final_state_hash,
  };
}

/**
 * SZL Holdings — private governed-ops bundle.
 *
 * Mirrors `runner/szl-private-governed-ops-001.payload.json` in the
 * @workspace/codex-kernel package: 12 rows, drift schedule of +1d every 5
 * rows, warning_threshold 3, hard_threshold 5, validator-triggered correction.
 *
 * Because the kernel is deterministic, this bundle reproduces byte-identical
 * to what `pnpm codex:run:szl` produces from the JSON payload — same trace,
 * same final_state_hash. Auditors can paste the CLI bundle here and get
 * the same ATTESTED verdict.
 */
function generateSzlBundle(): AttestationInputs {
  const initial: VenusState = {
    ...DRESDEN_INITIAL_STATE,
    epoch_label: 'private-governed-loop',
  };
  const result = runLoop<VenusState>({
    experiment_id: 'szl-private-governed-ops-001',
    initial_state: initial,
    policy_version: '1.1.0-private-szl',
    budgets: { time_budget_ms: 120_000, step_budget: 30, retry_budget: 2 },
    loop_policy: {
      max_steps: 30,
      adaptive_depth: { enabled: true },
      entropy_regularized_exit: { enabled: true },
    },
    governance_enabled: true,
    steps: dresdenSteps({
      cycle_days: 584,
      drift_per_cycle: 0,
      drift_schedule: { type: 'every_n_rows', n: 5, increment: 1 },
      warning_threshold: 3,
      hard_threshold: 5,
      rows_to_emit: 12,
      correct_when_drift_ge: 3,
    }),
  });
  return {
    initial_state_json: JSON.stringify(initial, null, 2),
    trace_jsonl: serializeTraceJsonl(result.trace),
    expected_final_state_hash: result.summary.final_state_hash,
  };
}

function generateTamperedBundle(): AttestationInputs {
  const ref = generateReferenceBundle();
  const lines = ref.trace_jsonl.split('\n').filter(Boolean);
  if (lines.length >= 2) {
    const obj = JSON.parse(lines[1]) as { proposed_delta: Record<string, Json> };
    const di = obj.proposed_delta as Record<string, number>;
    if (typeof di.day_index === 'number') di.day_index += 1;
    lines[1] = JSON.stringify(obj);
  }
  return { ...ref, trace_jsonl: lines.join('\n') };
}

interface AttestationOutcome {
  ok: boolean;
  reason: string | null;
  failed_step: number | null;
  steps_replayed: number;
  computed_final_hash: string | null;
  expected_final_hash: string | null;
  trace_step_count: number;
  parse_error: string | null;
}

function attest(inputs: AttestationInputs): AttestationOutcome {
  let initial: Json;
  try {
    initial = inputs.initial_state_json.trim()
      ? JSON.parse(inputs.initial_state_json)
      : null;
  } catch (err) {
    return {
      ok: false,
      reason: `initial_state JSON parse error: ${(err as Error).message}`,
      failed_step: null,
      steps_replayed: 0,
      computed_final_hash: null,
      expected_final_hash: inputs.expected_final_state_hash || null,
      trace_step_count: 0,
      parse_error: (err as Error).message,
    };
  }
  let trace;
  try {
    trace = parseTraceJsonl(inputs.trace_jsonl);
  } catch (err) {
    return {
      ok: false,
      reason: `trace JSONL parse error: ${(err as Error).message}`,
      failed_step: null,
      steps_replayed: 0,
      computed_final_hash: null,
      expected_final_hash: inputs.expected_final_state_hash || null,
      trace_step_count: 0,
      parse_error: (err as Error).message,
    };
  }
  const report = replay(
    initial,
    trace,
    inputs.expected_final_state_hash || undefined,
  );
  return {
    ok: report.ok,
    reason: report.failure_reason,
    failed_step: report.failed_step,
    steps_replayed: report.steps_replayed,
    computed_final_hash: report.final_state_hash,
    expected_final_hash: report.expected_final_state_hash,
    trace_step_count: trace.length,
    parse_error: null,
  };
}

export default function ReplayAttestation() {
  const [inputs, setInputs] = useState<AttestationInputs>(EMPTY);
  const outcome = useMemo(() => {
    if (!inputs.trace_jsonl.trim()) return null;
    return attest(inputs);
  }, [inputs]);

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Codex-Kernel · auditor surface
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Replay Attestation
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Paste an initial-state JSON and a trace JSONL exported from a governed
          loop run, and Sentra recomputes the hash chain step by step. A green
          attestation means every transition reproduces exactly — the EU AI Act
          Article 12 logging contract, verified.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <ToolbarCard
          icon={<Sparkles className="h-4 w-4 text-emerald-400" />}
          title="Load reference bundle"
          subtitle="Dresden Venus, drift +1d/cycle, 6 rows"
          onClick={() => setInputs(generateReferenceBundle())}
        />
        <ToolbarCard
          icon={<ShieldCheck className="h-4 w-4 text-cyan-400" />}
          title="Load SZL governed-ops bundle"
          subtitle="szl-private-governed-ops-001 · 12 rows · drift +1d/5 rows"
          onClick={() => setInputs(generateSzlBundle())}
        />
        <ToolbarCard
          icon={<AlertTriangle className="h-4 w-4 text-rose-400" />}
          title="Load tampered bundle"
          subtitle="Same trace with step 2 day_index mutated"
          onClick={() => setInputs(generateTamperedBundle())}
        />
        <ToolbarCard
          icon={<RotateCcw className="h-4 w-4 text-muted-foreground" />}
          title="Clear inputs"
          subtitle="Reset all fields"
          onClick={() => setInputs(EMPTY)}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Field
          label="initial_state.json"
          rows={10}
          placeholder='{"epoch_label":"demo_epoch","day_index":0,...}'
          value={inputs.initial_state_json}
          onChange={(v) => setInputs((p) => ({ ...p, initial_state_json: v }))}
        />
        <div className="space-y-3">
          <Field
            label="expected_final_state_hash"
            rows={2}
            placeholder="32 hex chars (optional)"
            value={inputs.expected_final_state_hash}
            onChange={(v) =>
              setInputs((p) => ({ ...p, expected_final_state_hash: v }))
            }
          />
          <Field
            label="trace.jsonl"
            rows={12}
            placeholder='one JSON object per line — paste from Amaru Codex Loop "trace.jsonl" download'
            value={inputs.trace_jsonl}
            onChange={(v) => setInputs((p) => ({ ...p, trace_jsonl: v }))}
          />
        </div>
      </section>

      {outcome && <AttestationPanel outcome={outcome} />}
    </div>
  );
}

interface ToolbarCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}

function ToolbarCard({ icon, title, subtitle, onClick }: ToolbarCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-3 text-left hover:bg-muted/30"
    >
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </button>
  );
}

interface FieldProps {
  label: string;
  rows: number;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}

function Field({ label, rows, placeholder, value, onChange }: FieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
        <button
          type="button"
          onClick={async () => {
            try {
              const text = await navigator.clipboard.readText();
              onChange(text);
            } catch {
              /* ignore */
            }
          }}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <ClipboardPaste className="h-3 w-3" /> paste
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        spellCheck={false}
        className="mt-1 w-full rounded-md border border-border bg-background p-2 font-mono text-[11px] leading-snug"
      />
    </div>
  );
}

function AttestationPanel({ outcome }: { outcome: AttestationOutcome }) {
  const banner = outcome.ok
    ? 'border-emerald-500/40 bg-emerald-500/5'
    : 'border-rose-500/40 bg-rose-500/5';
  const Icon = outcome.ok ? CheckCircle2 : XCircle;
  const tint = outcome.ok ? 'text-emerald-300' : 'text-rose-300';
  return (
    <section className={`rounded-lg border p-5 ${banner}`}>
      <div className={`flex items-center gap-2 text-base font-semibold ${tint}`}>
        <Icon className="h-5 w-5" />
        {outcome.ok
          ? 'ATTESTED — chain reproduces exactly'
          : 'FAILED — chain integrity broken'}
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
        <dt className="text-muted-foreground">trace_step_count</dt>
        <dd className="font-mono">{outcome.trace_step_count}</dd>
        <dt className="text-muted-foreground">steps_replayed</dt>
        <dd className="font-mono">{outcome.steps_replayed}</dd>
        <dt className="text-muted-foreground">failed_step</dt>
        <dd className="font-mono">{outcome.failed_step ?? '—'}</dd>
        <dt className="text-muted-foreground">computed_final_hash</dt>
        <dd className="font-mono">
          {outcome.computed_final_hash
            ? shortHash(outcome.computed_final_hash)
            : '—'}
        </dd>
        <dt className="text-muted-foreground">expected_final_hash</dt>
        <dd className="font-mono">
          {outcome.expected_final_hash
            ? shortHash(outcome.expected_final_hash)
            : '(none provided)'}
        </dd>
      </dl>
      {outcome.reason && (
        <div className="mt-4 rounded border border-border/50 bg-background/40 p-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            reason
          </div>
          <p className="mt-1 font-mono text-xs">{outcome.reason}</p>
        </div>
      )}
    </section>
  );
}
