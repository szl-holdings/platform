import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, DataStateBadge } from "@workspace/shared-ui";
import { Activity, Clock, CheckCircle, XCircle, RotateCcw, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface WorkflowRun {
  id: number;
  orgId: number;
  workflowId?: number | null;
  status: string;
  triggeredBy?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  errorMessage?: string | null;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

function useRuns(status?: string) {
  return useQuery({
    queryKey: ["alloyRuns", status],
    queryFn: async () => {
      const qs = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
      const resp = await apiFetch<WorkflowRun[] | { data: WorkflowRun[] }>(`/alloy/runs${qs}`);
      if (resp && typeof resp === "object" && "data" in resp) return resp.data;
      return resp as WorkflowRun[];
    },
  });
}

function useRetryRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await apiFetch<{ run: WorkflowRun }>(`/alloy/runs/${id}/retry`, { method: "POST" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alloyRuns"] }),
  });
}

function useCancelRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await apiFetch<{ run: WorkflowRun }>(`/alloy/runs/${id}/cancel`, { method: "POST" });
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["alloyRuns"] });
      const previous = qc.getQueriesData({ queryKey: ["alloyRuns"] });
      qc.setQueriesData({ queryKey: ["alloyRuns"] }, (old: WorkflowRun[] | undefined) => {
        if (!old) return old;
        return old.map(r => r.id === id ? { ...r, status: "cancelled" } : r);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => qc.setQueryData(key, data));
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alloyRuns"] }),
  });
}

type RunStatus = "completed" | "failed" | "running" | "retrying" | "cancelled" | "queued";

const STATUS_STYLES: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  completed: { color: "#10b981", icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Completed" },
  failed: { color: "#ef4444", icon: <XCircle className="w-3.5 h-3.5" />, label: "Failed" },
  running: { color: "#00d4ff", icon: <Activity className="w-3.5 h-3.5" />, label: "Running" },
  retrying: { color: "#8b5cf6", icon: <RotateCcw className="w-3.5 h-3.5" />, label: "Retrying" },
  queued: { color: "#f59e0b", icon: <Clock className="w-3.5 h-3.5" />, label: "Queued" },
  cancelled: { color: "#6b7280", icon: <XCircle className="w-3.5 h-3.5" />, label: "Cancelled" },
};

function RunDrawer({ run, onClose, onRetry, onCancel }: { run: WorkflowRun; onClose: () => void; onRetry: (id: number) => void; onCancel: (id: number) => void }) {
  const s = STATUS_STYLES[run.status] ?? { color: "#fff", icon: null, label: run.status };
  const durationMs = run.startedAt && run.completedAt
    ? new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()
    : null;
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/40" />
      <div className="w-full max-w-lg bg-[#0c1420] border-l border-white/10 flex flex-col h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-white/5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: s.color, background: `${s.color}12`, border: `1px solid ${s.color}25` }}>
              {s.icon} {s.label}
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>
          <h2 className="text-sm font-semibold text-white">Run #{run.id}</h2>
          <p className="text-[11px] text-slate-500 mt-1">Workflow {run.workflowId ?? "N/A"} · Retries: {run.retryCount}/{run.maxRetries}</p>
        </div>
        <div className="p-5 border-b border-white/5 space-y-2">
          {run.startedAt && <div className="text-[11px] text-slate-400">Started: {new Date(run.startedAt).toLocaleString()}</div>}
          {run.completedAt && <div className="text-[11px] text-slate-400">Completed: {new Date(run.completedAt).toLocaleString()}</div>}
          {durationMs && <div className="text-[11px] text-slate-400">Duration: {Math.round(durationMs / 1000)}s</div>}
        </div>
        {run.errorMessage && (
          <div className="p-5 border-b border-white/5">
            <div className="text-[10px] font-medium text-red-400 mb-1">Error</div>
            <div className="text-[11px] text-slate-300 font-mono bg-red-500/5 rounded p-2 border border-red-500/15">{run.errorMessage}</div>
          </div>
        )}
        {run.input && Object.keys(run.input).length > 0 && (
          <div className="p-5 border-b border-white/5">
            <div className="text-[10px] font-medium text-slate-500 mb-1">Input</div>
            <pre className="text-[10px] text-slate-400 overflow-auto bg-white/3 rounded p-2 border border-white/5">{JSON.stringify(run.input, null, 2)}</pre>
          </div>
        )}
        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            {run.status === "failed" && run.retryCount < run.maxRetries && (
              <button onClick={() => { onRetry(run.id); onClose(); }} className="text-[10px] px-3 py-1.5 rounded-lg font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:opacity-80 transition-all flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Retry
              </button>
            )}
            {["queued", "running", "retrying"].includes(run.status) && (
              <button onClick={() => { onCancel(run.id); onClose(); }} className="text-[10px] px-3 py-1.5 rounded-lg font-medium text-slate-400 bg-slate-500/10 border border-slate-500/20 hover:opacity-80 transition-all">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExecutionRuns() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const { data: runs = [], isLoading, isError, refetch } = useRuns(statusFilter !== "all" ? statusFilter : undefined);
  const retryRun = useRetryRun();
  const cancelRun = useCancelRun();

  const failed = runs.filter(r => r.status === "failed");
  const running = runs.filter(r => r.status === "running");
  const completed = runs.filter(r => r.status === "completed");
  const retrying = runs.filter(r => r.status === "retrying");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4" style={{ color: "#00d4ff" }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#00d4ff" }}>Alloy · Execution Runs</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Execution Runs</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Live and historical workflow runs with retry logic and exception handling.</p>
        </div>
        <div className="flex items-center gap-3">
          <DataStateBadge state={isError ? "stub" : "live"} pulse={!isError} />
          <button onClick={() => refetch()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Failed", value: failed.length, color: "#ef4444" },
          { label: "Running", value: running.length, color: "#00d4ff" },
          { label: "Retrying", value: retrying.length, color: "#8b5cf6" },
          { label: "Completed", value: completed.length, color: "#10b981" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[10px] font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Filter:</span>
        {["all", "running", "queued", "completed", "failed", "retrying", "cancelled"].map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className="text-[10px] px-2.5 py-1.5 rounded-lg border capitalize transition-all"
            style={{
              background: statusFilter === f ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.02)",
              borderColor: statusFilter === f ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.07)",
              color: statusFilter === f ? "#00d4ff" : "rgba(255,255,255,0.4)",
            }}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{runs.length} runs</span>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Loading runs…</span>
        </div>
      )}
      {isError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Failed to load runs. Check API connectivity.
        </div>
      )}
      {!isLoading && !isError && runs.length === 0 && (
        <div className="rounded-xl border p-12 text-center" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(16,185,129,0.2)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No runs found</p>
        </div>
      )}

      <div className="space-y-3">
        {runs.map(run => {
          const s = STATUS_STYLES[run.status] ?? { color: "#fff", icon: null, label: run.status };
          const durationMs = run.startedAt && run.completedAt
            ? new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()
            : null;

          return (
            <div
              key={run.id}
              className="rounded-xl border p-5 cursor-pointer hover:bg-white/[0.02] transition-all"
              style={{
                borderColor: run.status === "failed" ? "rgba(239,68,68,0.15)" : run.status === "running" ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.01)",
              }}
              onClick={() => setSelectedRun(run)}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: s.color, background: `${s.color}12`, border: `1px solid ${s.color}25` }}>
                      {s.icon} {s.label}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white mb-0.5">Run #{run.id} · Workflow {run.workflowId ?? "N/A"}</div>
                  <div className="text-[10px] flex items-center gap-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {run.startedAt && <span>Started: {new Date(run.startedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
                    {durationMs && <span>Duration: {Math.round(durationMs / 1000)}s</span>}
                    <span>Retries: {run.retryCount}/{run.maxRetries}</span>
                  </div>
                </div>
              </div>

              {run.errorMessage && (
                <div className="rounded-lg p-3 mb-3" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div className="text-[10px] font-medium mb-0.5" style={{ color: "#ef4444" }}>Exception</div>
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{run.errorMessage}</div>
                </div>
              )}

              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                {run.status === "failed" && run.retryCount < run.maxRetries && (
                  <button
                    onClick={() => retryRun.mutate(run.id)}
                    disabled={retryRun.isPending}
                    className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1"
                    style={{ color: "#8b5cf6", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}
                  >
                    <RotateCcw className="w-3 h-3" /> Retry
                  </button>
                )}
                {["queued", "running", "retrying"].includes(run.status) && (
                  <button
                    onClick={() => cancelRun.mutate(run.id)}
                    disabled={cancelRun.isPending}
                    className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
                    style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    Cancel
                  </button>
                )}
                <button className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80" style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Audit Log
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedRun && (
        <RunDrawer
          run={selectedRun}
          onClose={() => setSelectedRun(null)}
          onRetry={id => retryRun.mutate(id)}
          onCancel={id => cancelRun.mutate(id)}
        />
      )}
    </div>
  );
}
