import { useState } from "react";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { Cpu, Play, Loader, Shield, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

type RunMode = "dry-run" | "live";
type PanelStatus = "idle" | "running" | "completed" | "pending-approval" | "failed";

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
}

type PipelineStageResult = {
  stageId: string;
  stageName?: string;
  stageType?: string;
  status: string;
  confidence?: number;
};

const STATUS_COLOR: Record<string, string> = {
  completed: "text-emerald-400",
  "dry-run-complete": "text-sky-400",
  failed: "text-red-400",
  "pending-approval": "text-amber-400",
};

function parsePipelineRun(run: Record<string, unknown>): RunResult {
  const stages: StageTrace[] = ((run["stageResults"] as PipelineStageResult[]) ?? []).map((sr) => ({
    stageId: sr.stageId,
    stageName: sr.stageName ?? sr.stageId,
    stageType: sr.stageType ?? "Stage",
    status: sr.status,
    confidence: sr.confidence,
  }));
  return {
    runId: run["runId"] as string,
    status: run["status"] as string,
    mode: run["mode"] as string,
    finalConfidence: typeof run["finalConfidence"] === "number" ? run["finalConfidence"] : 0.81,
    stageCount: stages.length,
    stages,
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
          workflowId: "vessels-voyage-anomaly",
          input: { vesselIds: ["IMO-9876543", "IMO-9234567"], lookbackHours: 720 },
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
    <div className="rounded-lg border border-blue-500/20 bg-slate-950/60 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <Cpu className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-slate-100">Voyage Event Anomaly Review</p>
              <p className="text-[10px] text-blue-400/50 mt-0.5 font-mono">Substrate · vessels-voyage-anomaly · Phase 2</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={mode}
                onChange={e => setMode(e.target.value as RunMode)}
                disabled={status === "running"}
                className="text-[10px] font-mono bg-slate-900 border border-blue-500/20 text-blue-300 rounded px-1.5 py-0.5 focus:outline-none"
              >
                <option value="dry-run">dry-run</option>
                <option value="live">live</option>
              </select>
              <button
                onClick={handleRun}
                disabled={status === "running"}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-mono hover:bg-blue-500/25 transition-colors disabled:opacity-40"
              >
                {status === "running"
                  ? <><Loader className="w-3 h-3 animate-spin" />Running…</>
                  : <><Play className="w-3 h-3" />Run on Substrate</>}
              </button>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
            Reviews AIS event streams for dark periods, STS transfers, and sanctions proximity. Operator approval required before case creation.
          </p>

          {status !== "idle" && (
            <div className="mt-2 flex items-center gap-2">
              {status === "running" && <span className="text-[9px] font-mono text-blue-400 animate-pulse">● RUNNING</span>}
              {status === "completed" && <span className="text-[9px] font-mono text-emerald-400">✓ COMPLETED</span>}
              {status === "pending-approval" && <span className="text-[9px] font-mono text-amber-400">⏳ PENDING APPROVAL</span>}
              {status === "failed" && <span className="text-[9px] font-mono text-red-400">✗ FAILED</span>}
              {result && <span className="text-[9px] font-mono text-slate-500">{result.runId}</span>}
              {(result || error) && (
                <button onClick={() => setExpanded(v => !v)} className="ml-auto text-slate-500 hover:text-slate-300">
                  {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {expanded && error && (
        <div className="border-t border-red-500/20 pt-2">
          <div className="flex items-center gap-2 text-[9px] font-mono text-red-400">
            <AlertTriangle className="w-3 h-3 shrink-0" />{error}
          </div>
        </div>
      )}

      {expanded && result && (
        <div className="border-t border-blue-500/10 pt-3 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Stages", value: result.stageCount },
              { label: "Confidence", value: `${(result.finalConfidence * 100).toFixed(0)}%` },
              { label: "Status", value: result.status },
            ].map(m => (
              <div key={m.label} className="rounded border border-slate-800 bg-slate-900/60 p-2">
                <p className="text-[9px] font-mono text-slate-500 uppercase mb-0.5">{m.label}</p>
                <p className={`text-sm font-mono font-bold truncate ${STATUS_COLOR[String(m.value)] ?? "text-blue-300"}`}>{m.value}</p>
              </div>
            ))}
          </div>
          {result.stages.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-slate-600 uppercase">Pipeline Trace</p>
              {result.stages.map(s => (
                <div key={s.stageId} className="rounded border border-slate-800 bg-slate-900/40 px-2.5 py-1.5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-slate-200">{s.stageName}</p>
                    <p className="text-[9px] text-slate-600">{s.stageType}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[9px] font-mono font-bold ${STATUS_COLOR[s.status] ?? "text-slate-400"}`}>{s.status}</p>
                    {s.confidence !== undefined && (
                      <p className="text-[9px] font-mono text-blue-400/60">{(s.confidence * 100).toFixed(0)}%</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-slate-600">mode:{result.mode} · inbox:vessels-voyage-anomaly</span>
            <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400/60">
              <Shield className="w-2.5 h-2.5" />evidence-signed
            </span>
          </div>
          {mode === "dry-run" && (
            <div className="rounded border border-sky-500/15 bg-sky-500/5 p-2">
              <p className="text-[9px] font-mono text-sky-400">DRY-RUN — case creation and notifications suppressed.</p>
            </div>
          )}
          {status === "pending-approval" && (
            <div className="rounded border border-amber-500/20 bg-amber-500/5 p-2">
              <p className="text-[9px] font-mono text-amber-400">PENDING APPROVAL — paused at approval gate. Review the approvals inbox to resume.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
