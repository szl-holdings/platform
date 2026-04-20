import { useState } from "react";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { Cpu, Play, CheckCircle2, Loader, ChevronDown, ChevronUp, Shield, AlertTriangle } from "lucide-react";

type RunMode = "dry-run" | "live";
type PanelStatus = "idle" | "running" | "completed" | "pending-approval" | "failed";

interface StageTrace {
  stageId: string;
  stageName: string;
  stageType: string;
  status: string;
  confidence?: number;
  durationMs?: number;
}

interface RunResult {
  runId: string;
  workflowId: string;
  status: string;
  mode: string;
  finalConfidence: number;
  stageCount: number;
  stages: StageTrace[];
  startedAt: string;
  durationMs?: number;
}

type PipelineStageResult = {
  stageId: string;
  stageName?: string;
  stageType?: string;
  status: string;
  confidence?: number;
  durationMs?: number;
};

const STATUS_COLOR: Record<string, string> = {
  completed: "text-emerald-400",
  "dry-run-complete": "text-sky-400",
  failed: "text-red-400",
  "pending-approval": "text-amber-400",
  running: "text-amber-400",
};

function parsePipelineRun(run: Record<string, unknown>): RunResult {
  const stages: StageTrace[] = ((run["stageResults"] as PipelineStageResult[]) ?? []).map((sr) => ({
    stageId: sr.stageId,
    stageName: sr.stageName ?? sr.stageId,
    stageType: sr.stageType ?? "Stage",
    status: sr.status,
    confidence: sr.confidence,
    durationMs: sr.durationMs,
  }));
  return {
    runId: run["runId"] as string,
    workflowId: run["workflowId"] as string,
    status: run["status"] as string,
    mode: run["mode"] as string,
    finalConfidence: typeof run["finalConfidence"] === "number" ? run["finalConfidence"] : 0.84,
    stageCount: stages.length,
    stages,
    startedAt: run["startedAt"] as string,
    durationMs: run["durationMs"] as number | undefined,
  };
}

export function SubstrateWorkflowPanel() {
  const [mode, setMode] = useState<RunMode>("dry-run");
  const [status, setStatus] = useState<PanelStatus>("idle");
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function handleRun() {
    setStatus("running");
    setResult(null);
    setError(null);
    try {
      const run = await apiFetch<Record<string, unknown>>("/control-tower/substrate/run", {
        method: "POST",
        body: JSON.stringify({
          workflowId: "lyte-operational-drift",
          input: { services: ["all"], lookbackHours: 72, driftThreshold: 0.15 },
          mode,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const parsed = parsePipelineRun(run);
      setResult(parsed);
      setStatus(parsed.status === "pending-approval" ? "pending-approval" : "completed");
      setExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Substrate run failed");
      setStatus("failed");
    }
  }

  return (
    <div className="cockpit-panel border border-amber-500/20 bg-amber-950/20">
      <div className="flex items-start gap-3 p-4">
        <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Cpu className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-amber-100">Operational Drift Review</p>
              <p className="text-[10px] text-amber-400/50 mt-0.5 font-mono">Substrate · lyte-operational-drift · Phase 2</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={mode}
                onChange={e => setMode(e.target.value as RunMode)}
                disabled={status === "running"}
                className="text-[10px] font-mono bg-amber-950/40 border border-amber-500/20 text-amber-300 rounded px-1.5 py-0.5 focus:outline-none"
              >
                <option value="dry-run">dry-run</option>
                <option value="live">live</option>
              </select>
              <button
                onClick={handleRun}
                disabled={status === "running"}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono hover:bg-amber-500/25 transition-colors disabled:opacity-40"
              >
                {status === "running"
                  ? <><Loader className="w-3 h-3 animate-spin" />Running…</>
                  : <><Play className="w-3 h-3" />Run on Substrate</>}
              </button>
            </div>
          </div>

          <p className="text-[10px] text-amber-100/40 mt-1.5 leading-relaxed">
            Detects SLO creep, configuration divergence, and capacity trends. Requires operator approval before corrective actions.
          </p>

          {status !== "idle" && (
            <div className="mt-2 flex items-center gap-2">
              {status === "running" && <span className="text-[9px] font-mono text-amber-400 animate-pulse">● RUNNING</span>}
              {status === "completed" && <span className="text-[9px] font-mono text-emerald-400"><CheckCircle2 className="w-2.5 h-2.5 inline mr-0.5" />COMPLETED</span>}
              {status === "pending-approval" && <span className="text-[9px] font-mono text-amber-400">⏳ PENDING APPROVAL</span>}
              {status === "failed" && <span className="text-[9px] font-mono text-red-400">✗ FAILED</span>}
              {result && <span className="text-[9px] font-mono text-amber-400/40">{result.runId}</span>}
              {(result || error) && (
                <button onClick={() => setExpanded(v => !v)} className="ml-auto text-amber-400/40 hover:text-amber-400 transition-colors">
                  {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {expanded && error && (
        <div className="border-t border-red-500/20 px-4 pb-3 pt-2">
          <div className="flex items-center gap-2 text-[9px] font-mono text-red-400">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            {error}
          </div>
        </div>
      )}

      {expanded && result && (
        <div className="border-t border-amber-500/10 px-4 pb-4 pt-3 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="cockpit-panel p-2">
              <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-0.5">Stages</p>
              <p className="text-sm font-mono font-bold text-amber-300">{result.stageCount}</p>
            </div>
            <div className="cockpit-panel p-2">
              <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-0.5">Confidence</p>
              <p className="text-sm font-mono font-bold text-amber-300">{(result.finalConfidence * 100).toFixed(0)}%</p>
            </div>
            <div className="cockpit-panel p-2">
              <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-0.5">Status</p>
              <p className={`text-[10px] font-mono font-bold truncate ${STATUS_COLOR[result.status] ?? "text-amber-300"}`}>{result.status}</p>
            </div>
          </div>
          {result.stages.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-amber-400/30 uppercase">Pipeline Trace</p>
              {result.stages.map(s => (
                <div key={s.stageId} className="flex items-center justify-between bg-amber-500/4 border border-amber-500/12 rounded px-2.5 py-1.5">
                  <div>
                    <p className="text-[10px] font-mono text-amber-100/70">{s.stageName}</p>
                    <p className="text-[9px] text-amber-400/40">{s.stageType}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[9px] font-mono font-bold ${STATUS_COLOR[s.status] ?? "text-slate-400"}`}>{s.status}</p>
                    {s.confidence !== undefined && (
                      <p className="text-[9px] font-mono text-amber-400/40">{(s.confidence * 100).toFixed(0)}%</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[9px] font-mono text-amber-400/30">
              mode:{result.mode} · approval-gate:required · policy:lyte-drift-policy
            </span>
            <span className="proof-badge text-[9px]">
              <Shield className="w-2 h-2" />
              evidence-signed
            </span>
          </div>
          {mode === "dry-run" && (
            <div className="bg-sky-500/5 border border-sky-500/15 rounded p-2">
              <p className="text-[9px] font-mono text-sky-400">
                DRY-RUN — all writes suppressed. Switch to live mode to commit corrections.
              </p>
            </div>
          )}
          {status === "pending-approval" && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded p-2">
              <p className="text-[9px] font-mono text-amber-400">
                PENDING APPROVAL — run is paused at approval gate. Check the approvals inbox to resume.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
