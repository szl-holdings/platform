import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  GitBranch,
  Play,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { MOCK_RUNS } from './mock-data';
import type { CounterfactualDiff } from './types';
import { runCounterfactual, useSubstrateClient } from './use-substrate';

const ACCENT = '#22d3ee';

const MODEL_ADAPTERS = [
  'gpt-4o',
  'gpt-4o-mini',
  'claude-3-5-sonnet',
  'claude-3-haiku',
  'gemini-1.5-pro',
];
const POLICY_PROFILES: Record<string, string[]> = {
  vessels: ['vessels-standard-v2', 'vessels-conservative-v1', 'vessels-aggressive-v1'],
  terra: ['terra-standard-v1', 'terra-conservative-v1'],
  continuum: ['continuum-orchestrator-v3', 'continuum-standard-v1'],
  prism: ['prism-standard-v1', 'prism-strict-v1'],
  lyte: ['lyte-standard-v1'],
  firestorm: ['firestorm-standard-v1', 'firestorm-conservative-v1'],
  'carlota-jo': ['carlota-standard-v1'],
};

function PolicyBadge({ result }: { result: 'pass' | 'fail' | 'warn' }) {
  const config = {
    pass: { color: '#22c55e', label: 'PASS' },
    fail: { color: '#ef4444', label: 'FAIL' },
    warn: { color: '#f59e0b', label: 'WARN' },
  }[result];
  return (
    <span
      className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
      style={{ background: `${config.color}15`, color: config.color }}
    >
      {config.label}
    </span>
  );
}

function DiffRow({ diff }: { diff: CounterfactualDiff['stages'][number] }) {
  const [expanded, setExpanded] = useState(false);
  const changed = diff.changed;
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: changed ? 'rgba(249,115,22,0.25)' : 'hsla(0,0%,100%,0.08)',
        background: changed ? 'rgba(249,115,22,0.03)' : 'hsl(214,12%,8%)',
      }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          {changed ? (
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#f97316' }} />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#22c55e' }} />
          )}
          <span className="text-xs font-medium" style={{ color: 'hsl(38,8%,92%)' }}>
            {diff.stageName}
          </span>
          {changed && (
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}
            >
              DIVERGED
            </span>
          )}
          {!changed && (
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(34,197,94,0.10)', color: '#22c55e' }}
            >
              IDENTICAL
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          style={{ color: 'hsl(214,7%,35%)' }}
        />
      </button>

      {expanded && (
        <div
          className="px-4 pb-4 grid grid-cols-2 gap-4 border-t"
          style={{ borderColor: 'hsla(0,0%,100%,0.06)' }}
        >
          {/* Original */}
          <div className="pt-3">
            <p
              className="text-[10px] font-mono uppercase tracking-wider mb-2"
              style={{ color: 'hsl(214,7%,35%)' }}
            >
              Original
            </p>
            <div className="space-y-2">
              <div>
                <p className="text-[9px] font-mono mb-0.5" style={{ color: 'hsl(214,7%,35%)' }}>
                  Recommendation
                </p>
                <p className="text-[11px]" style={{ color: 'hsl(38,8%,92%)' }}>
                  {diff.original.recommendation}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[9px] font-mono mb-0.5" style={{ color: 'hsl(214,7%,35%)' }}>
                    Confidence
                  </p>
                  <p
                    className="text-xs font-mono tabular-nums"
                    style={{ color: diff.original.confidence >= 0.85 ? '#22c55e' : '#f59e0b' }}
                  >
                    {Math.round(diff.original.confidence * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-mono mb-0.5" style={{ color: 'hsl(214,7%,35%)' }}>
                    Policy
                  </p>
                  <PolicyBadge result={diff.original.policyResult} />
                </div>
                <div>
                  <p className="text-[9px] font-mono mb-0.5" style={{ color: 'hsl(214,7%,35%)' }}>
                    Approval
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: diff.original.requiresApproval ? '#f59e0b' : '#22c55e' }}
                  >
                    {diff.original.requiresApproval ? 'Required' : 'None'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-mono mb-1" style={{ color: 'hsl(214,7%,35%)' }}>
                  Key Evidence
                </p>
                <ul className="space-y-0.5">
                  {diff.original.keyEvidence.map((e, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-[10px]"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      <span style={{ color: ACCENT }}>›</span> {e}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Counterfactual */}
          <div className="pt-3">
            <p
              className="text-[10px] font-mono uppercase tracking-wider mb-2"
              style={{ color: ACCENT }}
            >
              Counterfactual
            </p>
            <div className="space-y-2">
              <div>
                <p className="text-[9px] font-mono mb-0.5" style={{ color: 'hsl(214,7%,35%)' }}>
                  Recommendation
                </p>
                <p className="text-[11px]" style={{ color: changed ? ACCENT : 'hsl(38,8%,92%)' }}>
                  {diff.counterfactual.recommendation}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[9px] font-mono mb-0.5" style={{ color: 'hsl(214,7%,35%)' }}>
                    Confidence
                  </p>
                  <p
                    className="text-xs font-mono tabular-nums"
                    style={{
                      color: diff.counterfactual.confidence >= 0.85 ? '#22c55e' : '#f59e0b',
                    }}
                  >
                    {Math.round(diff.counterfactual.confidence * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-mono mb-0.5" style={{ color: 'hsl(214,7%,35%)' }}>
                    Policy
                  </p>
                  <PolicyBadge result={diff.counterfactual.policyResult} />
                </div>
                <div>
                  <p className="text-[9px] font-mono mb-0.5" style={{ color: 'hsl(214,7%,35%)' }}>
                    Approval
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: diff.counterfactual.requiresApproval ? '#f59e0b' : '#22c55e' }}
                  >
                    {diff.counterfactual.requiresApproval ? 'Required' : 'None'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-mono mb-1" style={{ color: 'hsl(214,7%,35%)' }}>
                  Key Evidence
                </p>
                <ul className="space-y-0.5">
                  {diff.counterfactual.keyEvidence.map((e, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-[10px]"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      <span style={{ color: ACCENT }}>›</span> {e}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CounterfactualViewer() {
  const [selectedRun, setSelectedRun] = useState(MOCK_RUNS[0]?.id ?? '');
  const [modelAdapter, setModelAdapter] = useState('claude-3-5-sonnet');
  const [policyProfile, setPolicyProfile] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CounterfactualDiff | null>(null);
  const [_gatewayUsed, setGatewayUsed] = useState(false);
  const client = useSubstrateClient();

  const run = MOCK_RUNS.find((r) => r.id === selectedRun);
  const profiles = run ? (POLICY_PROFILES[run.vertical] ?? []) : [];

  async function handleReplay() {
    if (!selectedRun || !modelAdapter) return;
    setRunning(true);
    setResult(null);
    const resolvedWorkflow = run?.workflow ?? selectedRun;
    const resolvedModel = modelAdapter !== 'default' ? modelAdapter : undefined;
    const resolvedPolicy =
      policyProfile !== 'default' && policyProfile !== '' ? policyProfile : undefined;
    const diff = await runCounterfactual(
      client,
      selectedRun,
      resolvedWorkflow,
      resolvedModel,
      resolvedPolicy,
    );
    setGatewayUsed(true);
    setRunning(false);
    setResult({
      ...diff,
      modelAdapter,
      policyProfile: policyProfile || 'default',
      replayedAt: new Date().toISOString(),
    });
  }

  const selectClass = 'text-[11px] rounded-md px-3 py-2 border outline-none w-full';
  const selectStyle = {
    background: 'hsl(214,12%,8%)',
    borderColor: 'hsla(0,0%,100%,0.12)',
    color: 'hsl(38,8%,92%)',
  };

  const changedCount = result?.stages.filter((s) => s.changed).length ?? 0;

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-1" style={{ color: 'hsl(38,8%,92%)' }}>
          Counterfactual Diff Viewer
        </h1>
        <p className="text-xs" style={{ color: 'hsl(214,7%,55%)' }}>
          Replay any past run with a different model adapter or policy profile and compare decisions
          side-by-side
        </p>
      </div>

      {/* Config Panel */}
      <div
        className="rounded-lg border p-4 mb-6 space-y-4"
        style={{ background: 'hsl(214,12%,8%)', borderColor: 'hsla(0,0%,100%,0.08)' }}
      >
        <p className="text-xs font-semibold" style={{ color: 'hsl(38,8%,92%)' }}>
          Replay Configuration
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label
              className="text-[10px] font-mono uppercase tracking-wider block mb-1.5"
              style={{ color: 'hsl(214,7%,35%)' }}
            >
              Source Run
            </label>
            <select
              value={selectedRun}
              onChange={(e) => {
                setSelectedRun(e.target.value);
                setResult(null);
              }}
              className={selectClass}
              style={selectStyle}
            >
              {MOCK_RUNS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.workflow} ({r.id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="text-[10px] font-mono uppercase tracking-wider block mb-1.5"
              style={{ color: 'hsl(214,7%,35%)' }}
            >
              Model Adapter
            </label>
            <select
              value={modelAdapter}
              onChange={(e) => {
                setModelAdapter(e.target.value);
                setResult(null);
              }}
              className={selectClass}
              style={selectStyle}
            >
              {MODEL_ADAPTERS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="text-[10px] font-mono uppercase tracking-wider block mb-1.5"
              style={{ color: 'hsl(214,7%,35%)' }}
            >
              Policy Profile
            </label>
            <select
              value={policyProfile}
              onChange={(e) => {
                setPolicyProfile(e.target.value);
                setResult(null);
              }}
              className={selectClass}
              style={selectStyle}
            >
              <option value="">Default (unchanged)</option>
              {profiles.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {run && (
          <div
            className="flex items-center gap-3 p-2.5 rounded"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="text-[11px] space-y-0.5">
              <p style={{ color: 'hsl(214,7%,55%)' }}>
                Original: <span style={{ color: 'hsl(38,8%,92%)' }}>{run.modelAdapter}</span> +{' '}
                <span style={{ color: 'hsl(38,8%,92%)' }}>{run.policyProfile}</span>
              </p>
              <p style={{ color: 'hsl(214,7%,35%)' }}>{run.objectiveText.slice(0, 100)}…</p>
            </div>
            <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />
            <div className="text-[11px] space-y-0.5">
              <p style={{ color: ACCENT }}>
                Counterfactual: <span>{modelAdapter}</span> +{' '}
                <span>{policyProfile || run.policyProfile}</span>
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleReplay}
          disabled={running || !selectedRun}
          className="flex items-center gap-2 px-4 py-2 rounded text-xs font-medium transition-colors disabled:opacity-50"
          style={{ background: running ? `${ACCENT}30` : ACCENT, color: running ? ACCENT : '#000' }}
        >
          {running ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {running ? 'Replaying…' : 'Run Counterfactual'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'hsl(38,8%,92%)' }}>
                Diff Result
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(214,7%,55%)' }}>
                Replayed at {new Date(result.replayedAt).toLocaleTimeString()} · {changedCount} of{' '}
                {result.stages.length} stages diverged
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded"
                style={{
                  background: changedCount > 0 ? 'rgba(249,115,22,0.12)' : 'rgba(34,197,94,0.12)',
                  color: changedCount > 0 ? '#f97316' : '#22c55e',
                }}
              >
                {changedCount > 0
                  ? `${changedCount} divergence${changedCount !== 1 ? 's' : ''}`
                  : 'No divergence'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {result.stages.map((stage, i) => (
              <DiffRow key={i} diff={stage} />
            ))}
          </div>

          {changedCount > 0 && (
            <div
              className="mt-4 rounded-lg border p-4"
              style={{ background: 'rgba(249,115,22,0.05)', borderColor: 'rgba(249,115,22,0.2)' }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: '#f97316' }}>
                Counterfactual Summary
              </p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                With <strong style={{ color: 'hsl(38,8%,92%)' }}>{result.modelAdapter}</strong> +{' '}
                <strong style={{ color: 'hsl(38,8%,92%)' }}>{result.policyProfile}</strong>,{' '}
                {changedCount} stage{changedCount !== 1 ? 's' : ''} produced different outputs.
                {result.stages.find(
                  (s) =>
                    s.changed && !s.counterfactual.requiresApproval && s.original.requiresApproval,
                ) &&
                  ' Notably, the approval gate would not have been triggered — the alternative adapter would have completed autonomously.'}
              </p>
            </div>
          )}
        </div>
      )}

      {!result && !running && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <GitBranch className="w-10 h-10 opacity-20" style={{ color: ACCENT }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              No replay result yet
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Configure a source run and adapter, then press Run Counterfactual
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
