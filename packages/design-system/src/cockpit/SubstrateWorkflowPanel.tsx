async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, { credentials: 'include', ...options });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  const body = await res.json();
  return (body?.data ?? body) as T;
}
import { AlertTriangle, ChevronDown, ChevronUp, Cpu, Loader, Play, Shield } from 'lucide-react';
import { useState } from 'react';

export interface SubstrateWorkflowPanelProps {
  workflowId: string;
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  workflowInput: Record<string, unknown>;
  dryRunNote?: string;
  pendingApprovalNote?: string;
  extraMetrics?: { label: string; value: string | number }[];
  defaultConfidence?: number;
}

type RunMode = 'dry-run' | 'live';
type PanelStatus = 'idle' | 'running' | 'completed' | 'pending-approval' | 'failed';

interface StageTrace {
  stageId: string;
  stageName: string;
  stageType: string;
  status: string;
  confidence?: number;
}

interface RunResult {
  runId: string;
  status: string;
  mode: string;
  finalConfidence: number;
  stageCount: number;
  stages: StageTrace[];
  retriever: RetrieverSourceMeta | null;
}

type PipelineStageResult = {
  stageId: string;
  stageName?: string;
  stageType?: string;
  status: string;
  confidence?: number;
  output?: unknown;
};

const STATUS_STYLE: Record<string, { text: string; cls: string }> = {
  completed: { text: '✓ COMPLETED', cls: 'color:var(--gi-state-allowed)' },
  'dry-run-complete': { text: 'DRY-RUN COMPLETE', cls: '' },
  failed: { text: '✗ FAILED', cls: 'color:var(--gi-state-blocked)' },
  'pending-approval': { text: '⏳ PENDING APPROVAL', cls: 'color:var(--gi-state-requires-approval)' },
  running: { text: '● RUNNING', cls: '' },
};

type RetrieverSource = 'adapter' | 'synthetic' | 'inline' | 'dry-run';
interface RetrieverSourceMeta {
  source: RetrieverSource;
  adapterId: string | null;
}

const RETRIEVER_SOURCE_STYLE: Record<RetrieverSource, { label: string; cls: string; tip: string }> = {
  adapter: {
    label: 'LIVE INDEX',
    cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    tip: 'Backed by the configured live retriever adapter.',
  },
  synthetic: {
    label: 'SYNTHETIC',
    cls: 'border-amber-400/50 bg-amber-400/10 text-amber-200',
    tip: 'Demo-only synthetic corpus — not real evidence.',
  },
  inline: {
    label: 'INLINE CORPUS',
    cls: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
    tip: 'Caller supplied an inline corpus instead of querying an index.',
  },
  'dry-run': {
    label: 'DRY-RUN',
    cls: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
    tip: 'Dry-run — no retrieval was performed.',
  },
};

function extractRetrieverSource(stages: PipelineStageResult[]): RetrieverSourceMeta | null {
  const r = stages.find((s) => s.stageType === 'Retrieve');
  if (!r || typeof r.output !== 'object' || r.output === null) return null;
  const out = r.output as { retrieverSource?: string; retrieverAdapterId?: string | null };
  if (!out.retrieverSource || !(out.retrieverSource in RETRIEVER_SOURCE_STYLE)) return null;
  return {
    source: out.retrieverSource as RetrieverSource,
    adapterId: out.retrieverAdapterId ?? null,
  };
}

function parsePipelineRun(
  run: Record<string, unknown>,
  defaultConfidence: number,
): RunResult {
  const rawStages = (run.stageResults as PipelineStageResult[]) ?? [];
  const stages: StageTrace[] = rawStages.map((sr) => ({
    stageId: sr.stageId,
    stageName: sr.stageName ?? sr.stageId,
    stageType: sr.stageType ?? 'Stage',
    status: sr.status,
    confidence: sr.confidence,
  }));
  return {
    runId: run.runId as string,
    status: run.status as string,
    mode: run.mode as string,
    finalConfidence:
      typeof run.finalConfidence === 'number' ? run.finalConfidence : defaultConfidence,
    stageCount: stages.length,
    stages,
    retriever: extractRetrieverSource(rawStages),
  };
}

function statusColor(s: string, fallback: string): string {
  const map: Record<string, string> = {
    completed: 'var(--gi-state-allowed)',
    'dry-run-complete': 'var(--gi-accent-blue)',
    failed: 'var(--gi-state-blocked)',
    'pending-approval': 'var(--gi-state-requires-approval)',
    running: 'var(--gi-state-requires-approval)',
  };
  return map[s] ?? fallback;
}

export function SubstrateWorkflowPanel({
  workflowId,
  title,
  subtitle,
  description,
  accentColor,
  workflowInput,
  dryRunNote,
  pendingApprovalNote,
  extraMetrics,
  defaultConfidence = 0.82,
}: SubstrateWorkflowPanelProps) {
  const [mode, setMode] = useState<RunMode>('dry-run');
  const [status, setStatus] = useState<PanelStatus>('idle');
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function handleRun() {
    setStatus('running');
    setResult(null);
    setError(null);
    try {
      const run = await apiFetch<Record<string, unknown>>('/control-tower/substrate/run', {
        method: 'POST',
        body: JSON.stringify({ workflowId, input: workflowInput, mode }),
        headers: { 'Content-Type': 'application/json' },
      });
      const parsed = parsePipelineRun(run, defaultConfidence);
      setResult(parsed);
      setStatus(parsed.status === 'pending-approval' ? 'pending-approval' : 'completed');
      setExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Substrate run failed');
      setStatus('failed');
    }
  }

  const accentRgba = (alpha: string) => `color-mix(in srgb, ${accentColor} ${alpha}, transparent)`;

  return (
    <div
      className="rounded-lg p-4 space-y-3"
      style={{
        border: `1px solid ${accentRgba('20%')}`,
        background: `color-mix(in srgb, ${accentColor} 4%, var(--gi-bg-base))`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded flex items-center justify-center shrink-0"
          style={{
            background: accentRgba('10%'),
            border: `1px solid ${accentRgba('20%')}`,
          }}
        >
          <Cpu className="w-4 h-4" style={{ color: accentColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--gi-text-primary)' }}>
                {title}
              </p>
              <p className="text-[10px] mt-0.5 font-mono" style={{ color: `${accentColor}80` }}>
                {subtitle}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as RunMode)}
                disabled={status === 'running'}
                className="text-[10px] font-mono rounded px-1.5 py-0.5 focus:outline-none"
                style={{
                  background: 'var(--gi-bg-overlay)',
                  border: `1px solid ${accentRgba('20%')}`,
                  color: accentColor,
                }}
              >
                <option value="dry-run">dry-run</option>
                <option value="live">live</option>
              </select>
              <button
                onClick={handleRun}
                disabled={status === 'running'}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono transition-colors disabled:opacity-40"
                style={{
                  background: accentRgba('15%'),
                  border: `1px solid ${accentRgba('30%')}`,
                  color: accentColor,
                }}
              >
                {status === 'running' ? (
                  <>
                    <Loader className="w-3 h-3 animate-spin" />
                    Running…
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    Run on Substrate
                  </>
                )}
              </button>
            </div>
          </div>

          <p
            className="text-[10px] mt-1.5 leading-relaxed"
            style={{ color: 'var(--gi-text-secondary)' }}
          >
            {description}
          </p>

          {status !== 'idle' && (
            <div className="mt-2 flex items-center gap-2">
              {status === 'running' && (
                <span
                  className="text-[9px] font-mono animate-pulse"
                  style={{ color: accentColor }}
                >
                  ● RUNNING
                </span>
              )}
              {status === 'completed' && (
                <span
                  className="text-[9px] font-mono"
                  style={{ color: 'var(--gi-state-allowed)' }}
                >
                  ✓ COMPLETED
                </span>
              )}
              {status === 'pending-approval' && (
                <span
                  className="text-[9px] font-mono"
                  style={{ color: 'var(--gi-state-requires-approval)' }}
                >
                  ⏳ PENDING APPROVAL
                </span>
              )}
              {status === 'failed' && (
                <span
                  className="text-[9px] font-mono"
                  style={{ color: 'var(--gi-state-blocked)' }}
                >
                  ✗ FAILED
                </span>
              )}
              {result && (
                <span
                  className="text-[9px] font-mono"
                  style={{ color: 'var(--gi-text-muted)' }}
                >
                  {result.runId}
                </span>
              )}
              {(result || error) && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="ml-auto transition-colors"
                  style={{ color: 'var(--gi-text-muted)' }}
                >
                  {expanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {expanded && error && (
        <div
          className="border-t pt-2"
          style={{ borderColor: 'var(--gi-state-blocked)20' }}
        >
          <div
            className="flex items-center gap-2 text-[9px] font-mono"
            style={{ color: 'var(--gi-state-blocked)' }}
          >
            <AlertTriangle className="w-3 h-3 shrink-0" />
            {error}
          </div>
        </div>
      )}

      {expanded && result && (
        <div
          className="border-t pt-3 space-y-3"
          style={{ borderColor: `${accentColor}15` }}
        >
          <div className="grid grid-cols-3 gap-3">
            <div
              className="rounded p-2"
              style={{
                border: '1px solid var(--gi-border-subtle)',
                background: 'var(--gi-bg-surface)',
              }}
            >
              <p
                className="text-[9px] font-mono uppercase mb-0.5"
                style={{ color: 'var(--gi-text-muted)' }}
              >
                Stages
              </p>
              <p className="text-sm font-mono font-bold" style={{ color: accentColor }}>
                {result.stageCount}
              </p>
            </div>
            <div
              className="rounded p-2"
              style={{
                border: '1px solid var(--gi-border-subtle)',
                background: 'var(--gi-bg-surface)',
              }}
            >
              <p
                className="text-[9px] font-mono uppercase mb-0.5"
                style={{ color: 'var(--gi-text-muted)' }}
              >
                Confidence
              </p>
              <p className="text-sm font-mono font-bold" style={{ color: accentColor }}>
                {(result.finalConfidence * 100).toFixed(0)}%
              </p>
            </div>
            {extraMetrics && extraMetrics.length > 0 ? (
              extraMetrics.slice(0, 1).map((m) => (
                <div
                  key={m.label}
                  className="rounded p-2"
                  style={{
                    border: '1px solid var(--gi-border-subtle)',
                    background: 'var(--gi-bg-surface)',
                  }}
                >
                  <p
                    className="text-[9px] font-mono uppercase mb-0.5"
                    style={{ color: 'var(--gi-text-muted)' }}
                  >
                    {m.label}
                  </p>
                  <p className="text-sm font-mono font-bold" style={{ color: accentColor }}>
                    {m.value}
                  </p>
                </div>
              ))
            ) : (
              <div
                className="rounded p-2"
                style={{
                  border: '1px solid var(--gi-border-subtle)',
                  background: 'var(--gi-bg-surface)',
                }}
              >
                <p
                  className="text-[9px] font-mono uppercase mb-0.5"
                  style={{ color: 'var(--gi-text-muted)' }}
                >
                  Status
                </p>
                <p
                  className="text-sm font-mono font-bold truncate"
                  style={{ color: statusColor(result.status, accentColor) }}
                >
                  {result.status}
                </p>
              </div>
            )}
          </div>

          {result.stages.length > 0 && (
            <div className="space-y-1">
              <p
                className="text-[9px] font-mono uppercase"
                style={{ color: 'var(--gi-text-muted)' }}
              >
                Pipeline Trace
              </p>
              {result.stages.map((s) => (
                <div
                  key={s.stageId}
                  className="rounded px-2.5 py-1.5 flex items-start justify-between"
                  style={{
                    border: '1px solid var(--gi-border-subtle)',
                    background: 'var(--gi-bg-overlay)',
                  }}
                >
                  <div>
                    <p
                      className="text-[10px] font-mono"
                      style={{ color: 'var(--gi-text-primary)' }}
                    >
                      {s.stageName}
                    </p>
                    <p
                      className="text-[9px] font-mono mt-0.5"
                      style={{ color: `${accentColor}60` }}
                    >
                      {s.stageType}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-[9px] font-mono font-bold"
                      style={{ color: statusColor(s.status, 'var(--gi-text-secondary)') }}
                    >
                      {s.status}
                    </p>
                    {s.confidence !== undefined && (
                      <p
                        className="text-[9px] font-mono"
                        style={{ color: 'var(--gi-text-secondary)' }}
                      >
                        {(s.confidence * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.retriever && (
            <div className="flex items-center gap-2">
              <span
                title={RETRIEVER_SOURCE_STYLE[result.retriever.source].tip}
                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-mono font-bold ${RETRIEVER_SOURCE_STYLE[result.retriever.source].cls}`}
              >
                RETRIEVAL · {RETRIEVER_SOURCE_STYLE[result.retriever.source].label}
              </span>
              {result.retriever.adapterId && (
                <span
                  className="text-[9px] font-mono"
                  style={{ color: 'var(--gi-text-muted)' }}
                >
                  adapter:{result.retriever.adapterId}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span
              className="text-[9px] font-mono"
              style={{ color: 'var(--gi-text-muted)' }}
            >
              mode:{result.mode} · inbox:{workflowId}
            </span>
            <span
              className="flex items-center gap-1 text-[9px] font-mono"
              style={{ color: 'var(--gi-state-allowed)' }}
            >
              <Shield className="w-2.5 h-2.5" />
              evidence-signed
            </span>
          </div>

          {mode === 'dry-run' && (
            <div
              className="rounded border p-2"
              style={{
                border: '1px solid var(--gi-accent-blue)25',
                background: 'color-mix(in srgb, var(--gi-accent-blue) 5%, transparent)',
              }}
            >
              <p
                className="text-[9px] font-mono"
                style={{ color: 'var(--gi-accent-blue)' }}
              >
                {dryRunNote ?? 'DRY-RUN — all writes suppressed.'}
              </p>
            </div>
          )}

          {status === 'pending-approval' && (
            <div
              className="rounded border p-2"
              style={{
                border: '1px solid var(--gi-state-requires-approval)30',
                background: 'color-mix(in srgb, var(--gi-state-requires-approval) 5%, transparent)',
              }}
            >
              <p
                className="text-[9px] font-mono"
                style={{ color: 'var(--gi-state-requires-approval)' }}
              >
                {pendingApprovalNote ??
                  'PENDING APPROVAL — paused at approval gate. Review the approvals inbox to resume.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
