/**
 * A11oy — Codex Receipts.
 *
 * The policy/receipt library surface for the @workspace/codex-kernel.
 * - Shows the receipt schema as live source of truth.
 * - Lists the built-in validators with their severity contracts.
 * - Renders a sample run (Dresden Venus, drift +1d/cycle) with each
 *   committed step's receipt, evidence, and approval status.
 *
 * Where Sentra answers "did the chain reproduce?" and Amaru answers
 * "what does the loop look like?", A11oy answers "what does each
 * decision say it relied on, and what policy governed it?".
 */

import { useMemo, useState } from 'react';
import {
  type DecisionReceipt,
  DRESDEN_DEFAULT_CONFIG,
  DRESDEN_INITIAL_STATE,
  dresdenSteps,
  type ProofLedgerEntry,
  runLoop,
  shortHash,
  type VenusState,
} from '@workspace/codex-kernel';
import {
  BookOpen,
  CheckCircle2,
  FileBadge,
  Lock,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface SampleRun {
  receipts: DecisionReceipt[];
  ledger: ProofLedgerEntry[];
  finalHash: string;
  policy_version: string;
}

function buildSample(): SampleRun {
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
    receipts: result.receipts,
    ledger: [...result.ledger],
    finalHash: result.summary.final_state_hash,
    policy_version: 'covenant-v1',
  };
}

const POLICY_FIELDS: Array<{ name: string; type: string; note: string }> = [
  { name: 'receipt_id', type: 'string', note: 'rcpt-{experiment}-{step:0000}' },
  { name: 'step', type: 'number', note: '1-indexed kernel step' },
  { name: 'decision_type', type: 'string', note: 'cycle_advance | drift_correction | …' },
  { name: 'summary', type: 'string', note: 'human-readable rationale' },
  { name: 'assumptions', type: 'string[]', note: 'declared at decision time' },
  {
    name: 'evidence',
    type: '{ kind, ref, mocked? }[]',
    note: 'each entry traceable; mocked=true is a soft fail',
  },
  { name: 'policy_version', type: 'string', note: 'frozen at run start' },
  {
    name: 'approval_status',
    type: 'not_required|pending|approved|rejected',
    note: 'human_gate validator demands approval for sensitive scopes',
  },
  { name: 'approval_ref', type: 'string?', note: 'links to approval event' },
  { name: 'mocked', type: 'boolean', note: 'true if any evidence is mocked' },
  { name: 'timestamp', type: 'ISO8601', note: 'kernel.now() at commit' },
];

const VALIDATORS: Array<{
  name: string;
  severity: 'hard_fail' | 'soft_fail';
  rule: string;
}> = [
  {
    name: 'state_transition_rule',
    severity: 'hard_fail',
    rule: 'proposed_delta must be a non-empty plain object',
  },
  {
    name: 'drift_bounds',
    severity: 'hard_fail',
    rule: '|drift| ≥ hard_threshold halts; ≥ warning_threshold without correction is soft',
  },
  {
    name: 'evidence_provenance',
    severity: 'hard_fail',
    rule: 'non-trivial step requires assumptions[] + evidence[] + policy_version',
  },
  {
    name: 'human_gate',
    severity: 'hard_fail',
    rule: 'pending or rejected approval halts the loop',
  },
];

export function CodexReceipts() {
  const sample = useMemo(buildSample, []);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string>(
    sample.receipts[0]?.receipt_id ?? '',
  );
  const selectedReceipt = sample.receipts.find(
    (r) => r.receipt_id === selectedReceiptId,
  );

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <FileBadge className="h-3.5 w-3.5" /> Codex-Kernel · receipt library
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Codex Receipts
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Every committed step in a governed loop carries a receipt — the
          decision's "why" frozen at commit time. This is the schema, the
          validator policy, and a live sample run from the Dresden Venus
          reference.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat
          label="active policy_version"
          value={sample.policy_version}
          icon={<Lock className="h-4 w-4 text-emerald-400" />}
        />
        <Stat
          label="receipts in sample run"
          value={String(sample.receipts.length)}
          icon={<FileBadge className="h-4 w-4 text-sky-400" />}
        />
        <Stat
          label="final_state_hash"
          value={shortHash(sample.finalHash)}
          icon={<ShieldCheck className="h-4 w-4 text-amber-400" />}
        />
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          icon={<BookOpen className="h-4 w-4" />}
          title="Decision receipt schema"
        >
          <table className="w-full text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-1 text-left">field</th>
                <th className="py-1 text-left">type</th>
                <th className="py-1 text-left">note</th>
              </tr>
            </thead>
            <tbody>
              {POLICY_FIELDS.map((f) => (
                <tr key={f.name} className="border-t border-border/40">
                  <td className="py-1 font-mono">{f.name}</td>
                  <td className="py-1 font-mono text-muted-foreground">
                    {f.type}
                  </td>
                  <td className="py-1 text-muted-foreground">{f.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel
          icon={<Scale className="h-4 w-4" />}
          title="Validator policy"
        >
          <ul className="space-y-3 text-xs">
            {VALIDATORS.map((v) => (
              <li key={v.name} className="rounded border border-border/40 p-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">{v.name}</span>
                  <span
                    className={`rounded border px-1 text-[10px] ${
                      v.severity === 'hard_fail'
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                        : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {v.severity}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{v.rule}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="mb-2 text-sm font-semibold">Sample receipts</h2>
          <ul className="space-y-1 rounded border border-border/40">
            {sample.receipts.map((r) => (
              <li key={r.receipt_id}>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptId(r.receipt_id)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-muted/30 ${
                    selectedReceiptId === r.receipt_id ? 'bg-primary/10' : ''
                  }`}
                >
                  <div>
                    <div className="font-mono">{r.receipt_id}</div>
                    <div className="text-muted-foreground">
                      step {r.step} · {r.decision_type}
                    </div>
                  </div>
                  {r.approval_status === 'approved' && (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  )}
                  {r.mocked && <Sparkles className="h-3 w-3 text-amber-400" />}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          {selectedReceipt && <ReceiptDetail receipt={selectedReceipt} />}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Proof ledger (JSONL)</h2>
        <div className="overflow-auto rounded border border-border/40 bg-background/40 p-3">
          <pre className="text-[11px] leading-snug">
            {sample.ledger
              .map((e) =>
                JSON.stringify({
                  ...e,
                  state_hash: shortHash(e.state_hash),
                  delta_hash: shortHash(e.delta_hash),
                }),
              )
              .join('\n')}
          </pre>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 truncate font-mono text-sm">{value}</div>
    </div>
  );
}

function Panel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

function ReceiptDetail({ receipt }: { receipt: DecisionReceipt }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-4 text-xs">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold font-mono">
            {receipt.receipt_id}
          </div>
          <div className="text-muted-foreground">
            step {receipt.step} · {receipt.decision_type} ·{' '}
            {receipt.timestamp}
          </div>
        </div>
        <span
          className={`rounded border px-2 py-0.5 text-[10px] ${
            receipt.approval_status === 'approved'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : receipt.approval_status === 'not_required'
                ? 'border-border bg-muted/30 text-muted-foreground'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
          }`}
        >
          approval={receipt.approval_status}
        </span>
      </div>
      <p>{receipt.summary}</p>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <div className="text-muted-foreground uppercase tracking-wider">
            assumptions
          </div>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {receipt.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-muted-foreground uppercase tracking-wider">
            evidence
          </div>
          <ul className="mt-1 space-y-1">
            {receipt.evidence.map((ev, i) => (
              <li key={i} className="font-mono">
                <span className="text-muted-foreground">{ev.kind}:</span>{' '}
                {ev.ref}
                {ev.mocked && (
                  <span className="ml-1 text-amber-400">(mocked)</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border/40 pt-3">
        <div>
          <div className="text-muted-foreground uppercase tracking-wider">
            policy_version
          </div>
          <div className="font-mono">{receipt.policy_version}</div>
        </div>
        <div>
          <div className="text-muted-foreground uppercase tracking-wider">
            mocked
          </div>
          <div className="font-mono">{String(receipt.mocked)}</div>
        </div>
      </div>
    </div>
  );
}

export default CodexReceipts;
