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
import { ECOSYSTEM_ACCENT } from './layout';
import { runCounterfactual, useRuns, useSubstrateClient } from '../substrate/use-substrate';
import { MOCK_RUNS } from '../substrate/mock-data';
import type { CounterfactualDiff, SubstrateRun } from '../substrate/types';

const MODEL_ADAPTERS = [
  'gpt-4o',
  'gpt-4o-mini',
  'claude-3-5-sonnet',
  'claude-3-haiku',
  'gemini-1.5-pro',
  'llama-3-70b',
];

const POLICY_PROFILES: Record<string, string[]> = {
  vessels: ['vessels-standard-v2', 'vessels-conservative-v1', 'vessels-aggressive-v1'],
  terra: ['terra-standard-v1', 'terra-conservative-v1'],
  alloy: ['alloy-orchestrator-v3', 'alloy-standard-v1'],
  prism: ['prism-standard-v1', 'prism-strict-v1'],
  lyte: ['lyte-standard-v1'],
  firestorm: ['firestorm-standard-v1', 'firestorm-conservative-v1'],
  'carlota-jo': ['carlota-standard-v1'],
};

function getAllPolicies(): string[] {
  return Object.values(POLICY_PROFILES).flat();
}

function PolicyBadge({ result }: { result: 'pass' | 'warn' | 'fail' }) {
  const config = {
    pass: { color: '#22c55e', label: 'PASS' },
    warn: { color: '#f59e0b', label: 'WARN' },
    fail: { color: '#ef4444', label: 'FAIL' },
  }[result];
  return (
    <span
      className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded"
      style={{ background: `${config.color}15`, color: config.color }}
    >
      {config.label}
    </span>
  );
}

function ConfidenceDelta({ baseline, counterfactual }: { baseline: number; counterfactual: number }) {
  const delta = counterfactual - baseline;
  const color = delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : '#6b7280';
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {Math.round(baseline * 100)}%
      </span>
      <ArrowRight className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
      <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {Math.round(counterfactual * 100)}%
      </span>
      <span className="text-[8px] font-mono font-bold" style={{ color }}>
        ({delta >= 0 ? '+' : ''}{Math.round(delta * 100)}%)
      </span>
    </div>
  );
}

function DiffRow({ diff }: { diff: CounterfactualDiff['stages'][number] }) {
  const [expanded, setExpanded] = useState(false);
  const { changed } = diff;

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: changed ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.07)',
        background: changed ? 'rgba(249,115,22,0.03)' : 'rgba(255,255,255,0.02)',
      }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          {changed ? (
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#f97316' }} />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#22c55e' }} />
          )}
          <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {diff.stageName}
          </span>
          {changed && (
            <span
              className="text-[8px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}
            >
              DIVERGED
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ConfidenceDelta
            baseline={diff.original.confidence}
            counterfactual={diff.counterfactual.confidence}
          />
          <ChevronDown
            className="w-3 h-3 transition-transform shrink-0"
            style={{
              color: 'rgba(255,255,255,0.3)',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </div>
      </button>

      {expanded && (
        <div
          className="px-4 pb-3 grid grid-cols-2 gap-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {[
            { label: 'Baseline', data: diff.original },
            { label: 'Counterfactual', data: diff.counterfactual },
          ].map(({ label, data }) => (
            <div key={label} className="pt-3">
              <div
                className="text-[8px] uppercase tracking-wide mb-2 font-semibold"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {label}
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Confidence
                  </span>
                  <span className="text-[9px] font-mono font-bold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {Math.round(data.confidence * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Policy
                  </span>
                  <PolicyBadge result={data.policyResult} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Approval
                  </span>
                  <span
                    className="text-[8px] font-mono"
                    style={{ color: data.requiresApproval ? '#f59e0b' : '#22c55e' }}
                  >
                    {data.requiresApproval ? 'required' : 'not required'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RunSelector({
  runs,
  selectedRun,
  onSelect,
}: {
  runs: SubstrateRun[];
  selectedRun: SubstrateRun | null;
  onSelect: (run: SubstrateRun) => void;
}) {
  const completedRuns = runs.filter((r) => r.status === 'completed' || r.status === 'failed');

  if (completedRuns.length === 0) {
    return (
      <div
        className="rounded-lg p-4 text-center"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          No completed substrate runs available. Use the Substrate Command Center to submit runs.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {completedRuns.slice(0, 8).map((run) => {
        const isSelected = selectedRun?.id === run.id;
        return (
          <button
            key={run.id}
            onClick={() => onSelect(run)}
            className="text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
            style={{
              background: isSelected ? `${ECOSYSTEM_ACCENT}10` : 'rgba(255,255,255,0.025)',
              border: `1px solid ${isSelected ? ECOSYSTEM_ACCENT + '35' : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: run.status === 'completed' ? '#22c55e' : '#ef4444' }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-mono font-medium truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {run.workflow}
              </div>
              <div className="text-[8px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {run.id.slice(0, 12)}… · {run.vertical} · {Math.round(run.confidence * 100)}% conf
              </div>
            </div>
            <span
              className="text-[8px] font-mono shrink-0 px-1.5 py-0.5 rounded capitalize"
              style={{
                background: run.status === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                color: run.status === 'completed' ? '#22c55e' : '#ef4444',
              }}
            >
              {run.status}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function CounterfactualStudioPage() {
  const client = useSubstrateClient();
  const { runs } = useRuns();
  const [selectedRun, setSelectedRun] = useState<SubstrateRun | null>(null);
  const [modelAdapter, setModelAdapter] = useState('');
  const [policyId, setPolicyId] = useState('');
  const [diff, setDiff] = useState<CounterfactualDiff | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changedCount = diff?.stages.filter((s) => s.changed).length ?? 0;
  const totalStages = diff?.stages.length ?? 0;
  const originalConfidence = diff?.stages[0]?.original.confidence ?? null;
  const counterfactualConfidence = diff?.stages[0]?.counterfactual.confidence ?? null;
  const deltaConfidence =
    originalConfidence != null && counterfactualConfidence != null
      ? counterfactualConfidence - originalConfidence
      : null;

  async function handleRun() {
    if (!selectedRun) return;
    setIsRunning(true);
    setError(null);
    setDiff(null);
    try {
      const result = await runCounterfactual(
        client,
        selectedRun.id,
        selectedRun.workflow,
        modelAdapter || undefined,
        policyId || undefined,
      );
      setDiff(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Counterfactual failed');
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: configuration */}
        <div className="flex flex-col gap-4">
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <h3
              className="text-[10px] font-semibold uppercase tracking-wide mb-3"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              1. Select Completed Run
            </h3>
            <RunSelector
              runs={[...MOCK_RUNS, ...runs]}
              selectedRun={selectedRun}
              onSelect={setSelectedRun}
            />
          </div>

          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <h3
              className="text-[10px] font-semibold uppercase tracking-wide mb-3"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              2. Configure Substitution
            </h3>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[8px] uppercase tracking-wide block mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Model Adapter (optional)
                </label>
                <select
                  value={modelAdapter}
                  onChange={(e) => setModelAdapter(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded text-[9px] font-mono outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: 'rgba(255,255,255,0.8)',
                  }}
                >
                  <option value="">Keep original model</option>
                  {MODEL_ADAPTERS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[8px] uppercase tracking-wide block mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Policy Profile (optional)
                </label>
                <select
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded text-[9px] font-mono outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: 'rgba(255,255,255,0.8)',
                  }}
                >
                  <option value="">Keep original policy</option>
                  {getAllPolicies().map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleRun}
            disabled={!selectedRun || isRunning}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-semibold transition-all hover:opacity-80 disabled:opacity-40"
            style={{
              background: `${ECOSYSTEM_ACCENT}18`,
              border: `1px solid ${ECOSYSTEM_ACCENT}35`,
              color: ECOSYSTEM_ACCENT,
            }}
          >
            {isRunning ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            {isRunning ? 'Running counterfactual…' : 'Run Counterfactual'}
          </button>

          {error && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded text-[9px] font-mono"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
            >
              <AlertTriangle className="w-3 h-3 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Right: results */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {diff ? (
            <>
              {/* Summary */}
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <h3
                  className="text-[10px] font-semibold uppercase tracking-wide mb-3"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  Counterfactual Summary
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: 'Stages Diverged',
                      value: `${changedCount} / ${totalStages}`,
                      color: changedCount > 0 ? '#f97316' : '#22c55e',
                    },
                    {
                      label: 'Confidence Delta',
                      value:
                        deltaConfidence != null
                          ? `${deltaConfidence >= 0 ? '+' : ''}${Math.round(deltaConfidence * 100)}%`
                          : '—',
                      color:
                        deltaConfidence == null
                          ? '#6b7280'
                          : deltaConfidence > 0
                            ? '#22c55e'
                            : '#ef4444',
                    },
                    {
                      label: 'Outcome Changed',
                      value: changedCount > 0 ? 'YES' : 'NO',
                      color: changedCount > 0 ? '#f97316' : '#22c55e',
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-lg p-3 text-center"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div className="text-[8px] uppercase tracking-wide mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {stat.label}
                      </div>
                      <div className="text-[16px] font-bold font-mono" style={{ color: stat.color }}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage diffs */}
              <div>
                <h3
                  className="text-[10px] font-semibold uppercase tracking-wide mb-3"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  Stage-by-Stage Analysis
                </h3>
                <div className="flex flex-col gap-2">
                  {diff.stages.map((stage) => (
                    <DiffRow key={stage.stageName} diff={stage} />
                  ))}
                  {diff.stages.length === 0 && (
                    <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      No stage diff data returned.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div
              className="rounded-xl flex flex-col items-center justify-center py-20"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <GitBranch className="w-10 h-10 mb-4" style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Select a completed run, configure substitution, and run the counterfactual to see a visual diff
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
