import { useQuery } from "@tanstack/react-query";
import { apiFetch, DataStateBadge, isAuthError } from "@workspace/shared-ui";
import { CheckCircle, XCircle, Clock, Activity, ChevronLeft, RotateCcw, AlertTriangle, Terminal, GitBranch } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

interface RunStep {
  id: string;
  label: string;
  deps: string[];
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  logs: string[];
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
}

interface Run {
  id: number;
  workflowId: number;
  state: string;
  stateHistory: Array<{ state: string; at: string; by: string }>;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  durationMs: number | null;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

interface RunDetailData {
  run: Run;
  workflow: { id: number; name: string; description: string | null; steps: RunStep[] };
  steps: RunStep[];
}

function useRunDetail(id: number) {
  return useQuery({
    queryKey: ["alloyRunDetail", id],
    queryFn: async () => {
      const resp = await apiFetch<RunDetailData | { data: RunDetailData }>(`/alloy/runs/${id}/steps`);
      if (resp && typeof resp === "object" && "data" in resp) return resp.data as RunDetailData;
      return resp as RunDetailData;
    },
    refetchInterval: (query) => {
      if (isAuthError(query.state.error)) return false;
      return 5000;
    },
    retry: (failureCount, error) => {
      if (isAuthError(error)) return false;
      return failureCount < 1;
    },
  });
}

const STATE_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  completed: { color: "#10b981", label: "Completed", icon: <CheckCircle className="w-4 h-4" /> },
  failed: { color: "#ef4444", label: "Failed", icon: <XCircle className="w-4 h-4" /> },
  running: { color: "#4B8BDB", label: "Running", icon: <Activity className="w-4 h-4" /> },
  queued: { color: "#f59e0b", label: "Queued", icon: <Clock className="w-4 h-4" /> },
  waiting_approval: { color: "#8b5cf6", label: "Awaiting Approval", icon: <AlertTriangle className="w-4 h-4" /> },
  canceled: { color: "#6b7280", label: "Canceled", icon: <XCircle className="w-4 h-4" /> },
  pending: { color: "rgba(255,255,255,0.25)", label: "Pending", icon: <Clock className="w-4 h-4" /> },
};

const STEP_STATUS_COLORS: Record<string, string> = {
  completed: "#10b981",
  failed: "#ef4444",
  running: "#4B8BDB",
  pending: "rgba(255,255,255,0.15)",
};

function formatDuration(ms: number | null) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.round((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

function formatTime(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatRelative(ts: string | null) {
  if (!ts) return "never";
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return "just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function GanttBar({ steps, totalMs }: { steps: RunStep[]; totalMs: number | null }) {
  if (!steps || steps.length === 0) return (
    <div className="text-center py-8 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
      No step execution data available for this run.
    </div>
  );

  const hasTimings = steps.some(s => s.startedAt && s.completedAt);
  const baseMs = steps[0]?.startedAt ? new Date(steps[0].startedAt).getTime() : Date.now() - (totalMs ?? 10000);
  const endMs = steps[steps.length - 1]?.completedAt
    ? new Date(steps[steps.length - 1].completedAt!).getTime()
    : baseMs + (totalMs ?? 10000);
  const span = endMs - baseMs || 10000;

  if (!hasTimings) {
    return (
      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3">
            <div className="w-32 text-[10px] text-right truncate shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
              {step.label}
            </div>
            <div className="flex-1 h-6 rounded-md flex items-center px-2" style={{
              background: `${STEP_STATUS_COLORS[step.status]}15`,
              border: `1px solid ${STEP_STATUS_COLORS[step.status]}30`,
            }}>
              <span className="text-[9px] font-medium" style={{ color: STEP_STATUS_COLORS[step.status] }}>
                {step.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {steps.map((step) => {
        const stepStart = step.startedAt ? new Date(step.startedAt).getTime() : baseMs;
        const stepEnd = step.completedAt ? new Date(step.completedAt).getTime() : Date.now();
        const left = ((stepStart - baseMs) / span) * 100;
        const width = Math.max(((stepEnd - stepStart) / span) * 100, 1);
        const color = STEP_STATUS_COLORS[step.status];

        return (
          <div key={step.id} className="flex items-center gap-3 group">
            <div className="w-32 text-[10px] text-right truncate shrink-0 transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
              {step.label}
            </div>
            <div className="flex-1 h-7 relative rounded overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div
                className="absolute top-0.5 bottom-0.5 rounded-md flex items-center px-2 transition-all"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  background: `${color}18`,
                  border: `1px solid ${color}40`,
                  minWidth: "3px",
                }}
              >
                {width > 8 && (
                  <span className="text-[9px] font-medium truncate" style={{ color }}>
                    {formatDuration(step.durationMs)}
                  </span>
                )}
              </div>
            </div>
            <div className="w-16 text-[9px] text-right shrink-0 font-medium" style={{ color }}>
              {step.status === "running" ? "running" : formatDuration(step.durationMs)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StepDetail({ step }: { step: RunStep }) {
  const color = STEP_STATUS_COLORS[step.status];
  const cfg = STATE_CONFIG[step.status];

  return (
    <div className="rounded-xl border p-4 space-y-4" style={{
      borderColor: `${color}25`,
      background: `${color}04`,
    }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color }}>{cfg?.icon}</span>
          <span className="text-sm font-semibold text-white">{step.label}</span>
        </div>
        <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border font-semibold" style={{ color, borderColor: `${color}30`, background: `${color}10` }}>
          {step.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>{formatTime(step.startedAt)}</div>
          <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>started</div>
        </div>
        <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>{formatDuration(step.durationMs)}</div>
          <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>duration</div>
        </div>
        <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>{formatTime(step.completedAt)}</div>
          <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>completed</div>
        </div>
      </div>

      {step.logs && step.logs.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Terminal className="w-3 h-3" style={{ color: "#4B8BDB" }} />
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>Logs</span>
          </div>
          <div className="rounded-lg p-3 font-mono text-[10px] space-y-0.5" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {step.logs.map((log, i) => (
              <div key={i} style={{ color: log.includes("ERROR") ? "#ef4444" : "rgba(255,255,255,0.5)" }}>{log}</div>
            ))}
          </div>
        </div>
      )}

      {(step.input || step.output) && (
        <div className="grid grid-cols-2 gap-3">
          {step.input && (
            <div>
              <div className="text-[10px] uppercase tracking-widest mb-1.5 font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>Input</div>
              <div className="rounded-lg p-2 font-mono text-[9px] overflow-auto max-h-20" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)" }}>
                {JSON.stringify(step.input, null, 2)}
              </div>
            </div>
          )}
          {step.output && (
            <div>
              <div className="text-[10px] uppercase tracking-widest mb-1.5 font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>Output</div>
              <div className="rounded-lg p-2 font-mono text-[9px] overflow-auto max-h-20" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)" }}>
                {JSON.stringify(step.output, null, 2)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RunDetail({ id }: { id: number }) {
  const { data, isLoading, error } = useRunDetail(id);
  const [, navigate] = useLocation();
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const run = data?.run;
  const workflow = data?.workflow;
  const steps = (data?.steps as RunStep[] | undefined) ?? [];
  const stateHistory = run?.stateHistory ?? [];

  const cfg = run ? (STATE_CONFIG[run.state] ?? STATE_CONFIG.queued) : null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/alloy")}
            className="flex items-center gap-1 text-xs transition-colors hover:text-white"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Execution Runs
          </button>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
          <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>Run #{id}</span>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-6 bg-white/5 rounded w-48 animate-pulse" />
            <div className="h-32 bg-white/5 rounded animate-pulse" />
          </div>
        ) : error ? (
          <DataStateBadge state="live" />
        ) : run && workflow ? (
          <>
            <div className="rounded-xl border p-4" style={{
              borderColor: `${cfg?.color}20`,
              background: "rgba(12,18,30,0.95)",
            }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ color: cfg?.color }}>{cfg?.icon}</span>
                    <h1 className="text-base font-bold text-white">{workflow.name}</h1>
                  </div>
                  <div className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>{workflow.description}</div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Run ID</div>
                      <div className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.6)" }}>#{run.id}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Queued</div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{formatRelative(run.queuedAt)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Duration</div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{formatDuration(run.durationMs)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Retries</div>
                      <div className="text-xs" style={{ color: run.retryCount > 0 ? "#f59e0b" : "rgba(255,255,255,0.6)" }}>{run.retryCount}/{run.maxRetries}</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-lg border font-bold" style={{
                    color: cfg?.color,
                    borderColor: `${cfg?.color}30`,
                    background: `${cfg?.color}10`,
                  }}>
                    {cfg?.label}
                  </span>
                  {run.state === "failed" && run.errorMessage && (
                    <div className="text-[10px] max-w-xs text-right" style={{ color: "#ef4444" }}>
                      {run.errorMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {stateHistory.length > 0 && (
              <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(12,18,30,0.95)" }}>
                <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>State History</div>
                <div className="flex items-center gap-0 overflow-x-auto">
                  {stateHistory.map((h, i) => {
                    const color = STATE_CONFIG[h.state]?.color ?? "rgba(255,255,255,0.4)";
                    return (
                      <div key={i} className="flex items-center gap-0 shrink-0">
                        <div className="flex flex-col items-center gap-1 px-4 py-1">
                          <div className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: color, background: `${color}20` }} />
                          <div className="text-[9px] font-semibold uppercase tracking-widest" style={{ color }}>{h.state.replace("_", " ")}</div>
                          <div className="text-[8px]" style={{ color: "rgba(255,255,255,0.25)" }}>{formatTime(h.at)}</div>
                          <div className="text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>{h.by}</div>
                        </div>
                        {i < stateHistory.length - 1 && (
                          <div className="h-0.5 w-8 shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(12,18,30,0.95)" }}>
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" style={{ color: "#4B8BDB" }} />
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>Step Timeline — Gantt View</span>
              </div>
              <div className="mb-3 flex items-center justify-between text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                <span>Step</span>
                <span>Duration</span>
              </div>
              <GanttBar steps={steps} totalMs={run.durationMs} />
            </div>

            {steps.length > 0 && (
              <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(12,18,30,0.95)" }}>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5" style={{ color: "#4B8BDB" }} />
                  <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>Step Details</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {steps.map(step => {
                    const color = STEP_STATUS_COLORS[step.status];
                    return (
                      <button
                        key={step.id}
                        onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all"
                        style={{
                          borderColor: selectedStep === step.id ? `${color}50` : `${color}20`,
                          background: selectedStep === step.id ? `${color}12` : `${color}06`,
                          color: selectedStep === step.id ? color : "rgba(255,255,255,0.5)",
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                        {step.label}
                      </button>
                    );
                  })}
                </div>
                {selectedStep && steps.find(s => s.id === selectedStep) && (
                  <StepDetail step={steps.find(s => s.id === selectedStep)!} />
                )}
              </div>
            )}

            {run.input && (
              <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(12,18,30,0.95)" }}>
                <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>Run Input</div>
                <div className="rounded-lg p-3 font-mono text-[10px] overflow-auto max-h-32" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                  {JSON.stringify(run.input, null, 2)}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Run not found</div>
        )}
      </div>
    </div>
  );
}
