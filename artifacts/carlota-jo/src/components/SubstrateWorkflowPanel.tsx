import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { AlertTriangle, ChevronDown, ChevronUp, Cpu, Loader, Play } from 'lucide-react';
import { useState } from 'react';
import {
  parsePipelineRun,
  type PanelStatus,
  type RetrieverSource,
  type RunMode,
  type RunResult,
} from './substrate-run-view';

const STATUS_COLOR: Record<string, string> = {
  completed: 'text-emerald-400',
  'dry-run-complete': 'text-sky-400',
  failed: 'text-red-400',
  'pending-approval': 'text-amber-400',
};

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

export function SubstrateWorkflowPanel({
  clientId,
  taskTitle,
}: {
  clientId?: string;
  taskTitle?: string;
}) {
  const [mode, setMode] = useState<RunMode>('dry-run');
  const [status, setStatus] = useState<PanelStatus>('idle');
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const isRunning = status === 'running';
  const isSubmitting = isRunning && result === null;

  async function handleRun() {
    if (isRunning) return;
    setStatus('running');
    setResult(null);
    setError(null);
    try {
      const run = await apiFetch<Record<string, unknown>>('/control-tower/substrate/run', {
        method: 'POST',
        body: JSON.stringify({
          workflowId: 'carlota-jo-task-routing',
          input: {
            clientId: clientId ?? 'CLIENT-MERIDIAN-001',
            taskTitle: taskTitle ?? 'Strategic diagnostic and competitive positioning review',
            taskDescription:
              'Full market positioning diagnostic with competitive benchmarking and capability gap analysis for Q3 strategic roadmap.',
            taskType: 'strategic-advisory',
            urgency: 'immediate',
          },
          mode,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      const parsed = parsePipelineRun(run, mode);
      setResult(parsed);
      setStatus(parsed.status);
      setExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Substrate run failed');
      setStatus('failed');
    }
  }

  return (
    <div className="rounded-lg border border-amber-600/25 bg-amber-950/20 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Cpu className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-amber-50">White-Glove Task Routing</p>
              <p className="text-[10px] text-amber-400/50 mt-0.5 font-mono">
                Substrate · carlota-jo-task-routing · Phase 2
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as RunMode)}
                disabled={isRunning}
                className="text-[10px] font-mono bg-amber-950/60 border border-amber-500/20 text-amber-300 rounded px-1.5 py-0.5 focus:outline-none"
              >
                <option value="dry-run">dry-run</option>
                <option value="live">live</option>
              </select>
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono hover:bg-amber-500/25 transition-colors disabled:opacity-40"
              >
                {isSubmitting ? (
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

          {(clientId || taskTitle) && (
            <div className="mt-1.5 text-[9px] font-mono text-amber-400/40">
              {clientId && <span className="mr-2">client:{clientId}</span>}
              {taskTitle && <span className="truncate block">{taskTitle}</span>}
            </div>
          )}

          <p className="text-[10px] text-amber-100/40 mt-1.5 leading-relaxed">
            Matches incoming client tasks to advisors by expertise and availability. Practice lead
            approval before assignment confirmation.
          </p>

          {status !== 'idle' && (
            <div className="mt-2 flex items-center gap-2">
              {status === 'running' && (
                <span className="text-[9px] font-mono text-amber-400 animate-pulse">● RUNNING</span>
              )}
              {status === 'completed' && (
                <span className="text-[9px] font-mono text-emerald-400">✓ COMPLETED</span>
              )}
              {status === 'dry-run-complete' && (
                <span className="text-[9px] font-mono text-sky-400">DEMO · DRY-RUN COMPLETE</span>
              )}
              {status === 'pending-approval' && (
                <span className="text-[9px] font-mono text-amber-400">
                  {result?.mode === 'dry-run' ? 'DEMO · PENDING APPROVAL' : '⏳ PENDING APPROVAL'}
                </span>
              )}
              {status === 'failed' && (
                <span className="text-[9px] font-mono text-red-400">✗ FAILED</span>
              )}
              {status === 'cancelled' && (
                <span className="text-[9px] font-mono text-slate-400">CANCELLED</span>
              )}
              {status === 'unknown' && (
                <span className="text-[9px] font-mono text-slate-400">STATE UNVERIFIED</span>
              )}
              {result?.runId && (
                <span className="text-[9px] font-mono text-amber-400/30">{result.runId}</span>
              )}
              {(result || error) && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="ml-auto text-amber-400/30 hover:text-amber-400"
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
        <div className="border-t border-amber-500/10 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Stages', value: result.stages.length },
              {
                label: 'Confidence',
                value:
                  result.finalConfidence === null
                    ? 'Not reported'
                    : `${(result.finalConfidence * 100).toFixed(0)}%`,
              },
            ].map((m) => (
              <div key={m.label} className="rounded border border-amber-500/10 bg-amber-950/30 p-2">
                <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-0.5">{m.label}</p>
                <p className="text-sm font-mono font-bold text-amber-300">{m.value}</p>
              </div>
            ))}
          </div>
          {result.stages.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-amber-400/30 uppercase">Pipeline Trace</p>
              {result.stages.map((s) => (
                <div
                  key={s.stageId}
                  className="flex items-center justify-between rounded border border-amber-500/10 bg-amber-950/20 px-2.5 py-1.5"
                >
                  <div>
                    <p className="text-[10px] font-mono text-amber-100/70">{s.stageName}</p>
                    <p className="text-[9px] text-amber-400/40">{s.stageType}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-[9px] font-mono font-bold ${STATUS_COLOR[s.status] ?? 'text-slate-400'}`}
                    >
                      {s.status}
                    </p>
                    {s.confidence !== null && (
                      <p className="text-[9px] font-mono text-amber-400/40">
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
                <span className="text-[9px] font-mono text-amber-400/40">
                  adapter:{result.retriever.adapterId}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-amber-400/20">
              requested:{result.requestedMode} · reported mode:{result.mode} · status:{result.reportedStatus}
            </span>
          </div>
          {result.error && (
            <div className="flex items-center gap-2 text-[9px] font-mono text-red-400">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              {result.error}
            </div>
          )}
          {status === 'unknown' && (
            <p className="text-[9px] font-mono text-slate-400">
              The response did not establish a matching run state. Completion and approval are unverified.
            </p>
          )}
          {status === 'dry-run-complete' && (
            <div className="rounded border border-sky-500/15 bg-sky-500/5 p-2">
              <p className="text-[9px] font-mono text-sky-400">
                DRY-RUN — assignment and client notification suppressed.
              </p>
            </div>
          )}
          {status === 'pending-approval' && (
            <div className="rounded border border-amber-500/20 bg-amber-500/5 p-2">
              <p className="text-[9px] font-mono text-amber-400">
                PENDING APPROVAL — human review is required before routing continues.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
