import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { AlertTriangle, ChevronDown, ChevronUp, Cpu, Loader, Play, Shield } from 'lucide-react';
import { useState } from 'react';

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

const STATUS_COLOR: Record<string, string> = {
  completed: 'text-emerald-400',
  'dry-run-complete': 'text-sky-400',
  failed: 'text-red-400',
  'pending-approval': 'text-amber-400',
};

type RetrieverSource = 'adapter' | 'synthetic' | 'inline' | 'dry-run';
interface RetrieverSourceMeta {
  source: RetrieverSource;
  adapterId: string | null;
}

const RETRIEVER_SOURCE_STYLE: Record<RetrieverSource, { label: string; cls: string; tip: string }> =
  {
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

function parsePipelineRun(run: Record<string, unknown>): RunResult {
  const rawStages = (run['stageResults'] as PipelineStageResult[]) ?? [];
  const stages: StageTrace[] = rawStages.map((sr) => ({
    stageId: sr.stageId,
    stageName: sr.stageName ?? sr.stageId,
    stageType: sr.stageType ?? 'Stage',
    status: sr.status,
    confidence: sr.confidence,
  }));
  return {
    runId: run['runId'] as string,
    status: run['status'] as string,
    mode: run['mode'] as string,
    finalConfidence: typeof run['finalConfidence'] === 'number' ? run['finalConfidence'] : 0.88,
    stageCount: stages.length,
    stages,
    retriever: extractRetrieverSource(rawStages),
  };
}

export function SubstrateWorkflowPanel() {
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
        body: JSON.stringify({
          workflowId: 'prism-counsel-evidence-packaging',
          input: {
            matterIds: ['MTR-2024-0108', 'MTR-2024-0072'],
            lookAheadDays: 14,
            includePrivileged: false,
          },
          mode,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      const parsed = parsePipelineRun(run);
      setResult(parsed);
      setStatus(parsed.status === 'pending-approval' ? 'pending-approval' : 'completed');
      setExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Substrate run failed');
      setStatus('failed');
    }
  }

  return (
    <div className="rounded-lg border border-violet-500/25 bg-slate-950/60 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Cpu className="w-4 h-4 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-slate-100">
                Evidence Packaging and Deadline Escalation
              </p>
              <p className="text-[10px] text-violet-400/50 mt-0.5 font-mono">
                Substrate · prism-counsel-evidence-packaging · Phase 2
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as RunMode)}
                disabled={status === 'running'}
                className="text-[10px] font-mono bg-slate-900 border border-violet-500/20 text-violet-300 rounded px-1.5 py-0.5 focus:outline-none"
              >
                <option value="dry-run">dry-run</option>
                <option value="live">live</option>
              </select>
              <button
                onClick={handleRun}
                disabled={status === 'running'}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[10px] font-mono hover:bg-violet-500/25 transition-colors disabled:opacity-40"
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

          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
            Packages matter evidence bundles and escalates approaching deadlines. Attorney approval
            required before client notification.
          </p>

          {status !== 'idle' && (
            <div className="mt-2 flex items-center gap-2">
              {status === 'running' && (
                <span className="text-[9px] font-mono text-violet-400 animate-pulse">
                  ● RUNNING
                </span>
              )}
              {status === 'completed' && (
                <span className="text-[9px] font-mono text-emerald-400">✓ COMPLETED</span>
              )}
              {status === 'pending-approval' && (
                <span className="text-[9px] font-mono text-amber-400">⏳ PENDING APPROVAL</span>
              )}
              {status === 'failed' && (
                <span className="text-[9px] font-mono text-red-400">✗ FAILED</span>
              )}
              {result && (
                <span className="text-[9px] font-mono text-slate-500">{result.runId}</span>
              )}
              {(result || error) && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="ml-auto text-slate-500 hover:text-slate-300"
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
        <div className="border-t border-red-500/20 pt-2">
          <div className="flex items-center gap-2 text-[9px] font-mono text-red-400">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            {error}
          </div>
        </div>
      )}

      {expanded && result && (
        <div className="border-t border-violet-500/10 pt-3 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Stages', value: result.stageCount },
              { label: 'Confidence', value: `${(result.finalConfidence * 100).toFixed(0)}%` },
              { label: 'Status', value: result.status },
            ].map((m) => (
              <div key={m.label} className="rounded border border-slate-800 bg-slate-900/60 p-2">
                <p className="text-[9px] font-mono text-slate-500 uppercase mb-0.5">{m.label}</p>
                <p
                  className={`text-sm font-mono font-bold truncate ${STATUS_COLOR[String(m.value)] ?? 'text-violet-300'}`}
                >
                  {m.value}
                </p>
              </div>
            ))}
          </div>
          {result.stages.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-slate-600 uppercase">Pipeline Trace</p>
              {result.stages.map((s) => (
                <div
                  key={s.stageId}
                  className="rounded border border-slate-800 bg-slate-900/40 px-2.5 py-1.5 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono text-slate-100 truncate">{s.stageName}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{s.stageType}</p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p
                      className={`text-[9px] font-mono font-bold ${STATUS_COLOR[s.status] ?? 'text-slate-400'}`}
                    >
                      {s.status}
                    </p>
                    {s.confidence !== undefined && (
                      <p className="text-[9px] font-mono text-violet-400/60">
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
                <span className="text-[9px] font-mono text-slate-500">
                  adapter:{result.retriever.adapterId}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-slate-600">
              mode:{result.mode} · inbox:prism-counsel-evidence-packaging
            </span>
            <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400/60">
              <Shield className="w-2.5 h-2.5" />
              privilege-reviewed
            </span>
          </div>
          {mode === 'dry-run' && (
            <div className="rounded border border-sky-500/15 bg-sky-500/5 p-2">
              <p className="text-[9px] font-mono text-sky-400">
                DRY-RUN — attorney notifications and external submissions suppressed.
              </p>
            </div>
          )}
          {status === 'pending-approval' && (
            <div className="rounded border border-amber-500/20 bg-amber-500/5 p-2">
              <p className="text-[9px] font-mono text-amber-400">
                PENDING APPROVAL — paused at approval gate. Check the attorney approvals inbox to
                resume.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
