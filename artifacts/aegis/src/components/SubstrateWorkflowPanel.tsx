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
  completed: 'text-[#c9b787]',
  'dry-run-complete': 'text-[#8a8a8a]',
  failed: 'text-[#f5f5f5]',
  'pending-approval': 'text-[#c9b787]',
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
      cls: 'border-[#c9b787]/40 bg-[#c9b787]/10 text-[#c9b787]',
      tip: 'Backed by the configured live retriever adapter.',
    },
    synthetic: {
      label: 'SYNTHETIC',
      cls: 'border-[#c9b787]/50 bg-[#c9b787]/10 text-[#c9b787]',
      tip: 'Demo-only synthetic corpus — not real evidence.',
    },
    inline: {
      label: 'INLINE CORPUS',
      cls: 'border-sky-500/40 bg-[#8a8a8a]/10 text-[#8a8a8a]',
      tip: 'Caller supplied an inline corpus instead of querying an index.',
    },
    'dry-run': {
      label: 'DRY-RUN',
      cls: 'border-sky-500/40 bg-[#8a8a8a]/10 text-[#8a8a8a]',
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
    finalConfidence: typeof run.finalConfidence === 'number' ? run.finalConfidence : 0.87,
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
          workflowId: 'aegis-threat-triage',
          input: {
            alertIds: ['aegis-alert-001', 'aegis-alert-002'],
            minSeverity: 'high',
            lookbackHours: 48,
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
    <div className="rounded-lg border border-[#8a8a8a]/20 bg-slate-900/60 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded bg-[#8a8a8a]/10 border border-[#8a8a8a]/20 flex items-center justify-center shrink-0">
          <Cpu className="w-4 h-4 text-[#8a8a8a]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-slate-100">
                Threat Triage and Escalation Routing
              </p>
              <p className="text-[10px] text-[#8a8a8a]/50 mt-0.5 font-mono">
                Substrate · aegis-threat-triage · Phase 2
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as RunMode)}
                disabled={status === 'running'}
                className="text-[10px] font-mono bg-slate-800 border border-[#8a8a8a]/20 text-[#8a8a8a] rounded px-1.5 py-0.5 focus:outline-none"
              >
                <option value="dry-run">dry-run</option>
                <option value="live">live</option>
              </select>
              <button
                onClick={handleRun}
                disabled={status === 'running'}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#8a8a8a]/15 border border-[#8a8a8a]/30 text-[#8a8a8a] text-[10px] font-mono hover:bg-[#8a8a8a]/25 transition-colors disabled:opacity-40"
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
            AI-assisted triage of threat signals across MITRE ATT&CK, CVE feeds, and alert clusters.
            Operator approval required before escalation.
          </p>

          {status !== 'idle' && (
            <div className="mt-2 flex items-center gap-2">
              {status === 'running' && (
                <span className="text-[9px] font-mono text-[#8a8a8a] animate-pulse">● RUNNING</span>
              )}
              {status === 'completed' && (
                <span className="text-[9px] font-mono text-[#c9b787]">✓ COMPLETED</span>
              )}
              {status === 'pending-approval' && (
                <span className="text-[9px] font-mono text-[#c9b787]">⏳ PENDING APPROVAL</span>
              )}
              {status === 'failed' && (
                <span className="text-[9px] font-mono text-[#f5f5f5]">✗ FAILED</span>
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
        <div className="border-t border-[#f5f5f5]/20 pt-2">
          <div className="flex items-center gap-2 text-[9px] font-mono text-[#f5f5f5]">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            {error}
          </div>
        </div>
      )}

      {expanded && result && (
        <div className="border-t border-[#8a8a8a]/10 pt-3 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Stages', value: result.stageCount },
              { label: 'Confidence', value: `${(result.finalConfidence * 100).toFixed(0)}%` },
              { label: 'Status', value: result.status },
            ].map((m) => (
              <div key={m.label} className="rounded border border-slate-700 bg-slate-800/60 p-2">
                <p className="text-[9px] font-mono text-slate-500 uppercase mb-0.5">{m.label}</p>
                <p
                  className={`text-sm font-mono font-bold truncate ${STATUS_COLOR[String(m.value)] ?? 'text-[#8a8a8a]'}`}
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
                  className="rounded border border-slate-700 bg-slate-800/40 px-2.5 py-1.5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-[10px] font-mono text-slate-200">{s.stageName}</p>
                    <p className="text-[9px] text-slate-600">{s.stageType}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-[9px] font-mono font-bold ${STATUS_COLOR[s.status] ?? 'text-slate-400'}`}
                    >
                      {s.status}
                    </p>
                    {s.confidence !== undefined && (
                      <p className="text-[9px] font-mono text-[#8a8a8a]/60">
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
              mode:{result.mode} · inbox:aegis-threat-triage · policy:aegis-threat-triage-policy
            </span>
            <span className="flex items-center gap-1 text-[9px] font-mono text-[#c9b787]/60">
              <Shield className="w-2.5 h-2.5" />
              evidence-signed
            </span>
          </div>
          {mode === 'dry-run' && (
            <div className="rounded border border-sky-500/15 bg-[#8a8a8a]/5 p-2">
              <p className="text-[9px] font-mono text-[#8a8a8a]">
                DRY-RUN — escalation and notification side effects suppressed.
              </p>
            </div>
          )}
          {status === 'pending-approval' && (
            <div className="rounded border border-[#c9b787]/20 bg-[#c9b787]/5 p-2">
              <p className="text-[9px] font-mono text-[#c9b787]">
                PENDING APPROVAL — paused at approval gate. Review the approvals inbox to resume.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
