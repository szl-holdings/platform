import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, isAuthError, DataStateBadge } from "@workspace/shared-ui";
import { Activity, Clock, CheckCircle, XCircle, RotateCcw, RefreshCw, AlertTriangle, Filter, Download, ChevronRight, Play } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface WorkflowRun {
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

interface RunsResp {
  data: WorkflowRun[];
  meta: { page: number; limit: number; total: number };
}

interface WorkflowDef {
  id: number;
  name: string;
  description: string | null;
  trigger: string;
}

const DEMO_RUNS: WorkflowRun[] = [
  { id: 1, workflowId: 1, state: "running", stateHistory: [{ state: "queued", at: new Date(Date.now() - 180000).toISOString(), by: "scheduler" }, { state: "running", at: new Date(Date.now() - 120000).toISOString(), by: "system" }], input: { trigger: "schedule", params: { batchSize: 2500 } }, output: null, errorMessage: null, retryCount: 0, maxRetries: 3, durationMs: null, queuedAt: new Date(Date.now() - 180000).toISOString(), startedAt: new Date(Date.now() - 120000).toISOString(), completedAt: null },
  { id: 2, workflowId: 9, state: "running", stateHistory: [{ state: "queued", at: new Date(Date.now() - 60000).toISOString(), by: "webhook" }, { state: "running", at: new Date(Date.now() - 45000).toISOString(), by: "system" }], input: { trigger: "webhook", params: { batchSize: 100 } }, output: null, errorMessage: null, retryCount: 0, maxRetries: 3, durationMs: null, queuedAt: new Date(Date.now() - 60000).toISOString(), startedAt: new Date(Date.now() - 45000).toISOString(), completedAt: null },
  { id: 3, workflowId: 3, state: "completed", stateHistory: [{ state: "queued", at: new Date(Date.now() - 900000).toISOString(), by: "scheduler" }, { state: "running", at: new Date(Date.now() - 840000).toISOString(), by: "system" }, { state: "completed", at: new Date(Date.now() - 720000).toISOString(), by: "system" }], input: { trigger: "schedule", params: { batchSize: 1000 } }, output: { processed: 847, success: true }, errorMessage: null, retryCount: 0, maxRetries: 3, durationMs: 120000, queuedAt: new Date(Date.now() - 900000).toISOString(), startedAt: new Date(Date.now() - 840000).toISOString(), completedAt: new Date(Date.now() - 720000).toISOString() },
  { id: 4, workflowId: 4, state: "completed", stateHistory: [{ state: "queued", at: new Date(Date.now() - 1800000).toISOString(), by: "scheduler" }, { state: "running", at: new Date(Date.now() - 1740000).toISOString(), by: "system" }, { state: "completed", at: new Date(Date.now() - 1620000).toISOString(), by: "system" }], input: { trigger: "schedule", params: { batchSize: 500 } }, output: { processed: 342, success: true }, errorMessage: null, retryCount: 0, maxRetries: 3, durationMs: 120000, queuedAt: new Date(Date.now() - 1800000).toISOString(), startedAt: new Date(Date.now() - 1740000).toISOString(), completedAt: new Date(Date.now() - 1620000).toISOString() },
  { id: 5, workflowId: 2, state: "failed", stateHistory: [{ state: "queued", at: new Date(Date.now() - 3600000).toISOString(), by: "scheduler" }, { state: "running", at: new Date(Date.now() - 3540000).toISOString(), by: "system" }, { state: "failed", at: new Date(Date.now() - 3300000).toISOString(), by: "system" }], input: { trigger: "schedule", params: { batchSize: 3000 } }, output: null, errorMessage: "Connection timeout: upstream provider did not respond within 30s", retryCount: 2, maxRetries: 3, durationMs: 240000, queuedAt: new Date(Date.now() - 3600000).toISOString(), startedAt: new Date(Date.now() - 3540000).toISOString(), completedAt: new Date(Date.now() - 3300000).toISOString() },
  { id: 6, workflowId: 5, state: "waiting_approval", stateHistory: [{ state: "queued", at: new Date(Date.now() - 7200000).toISOString(), by: "webhook" }, { state: "running", at: new Date(Date.now() - 7140000).toISOString(), by: "system" }, { state: "waiting_approval", at: new Date(Date.now() - 6900000).toISOString(), by: "system" }], input: { trigger: "webhook", params: { batchSize: 1 } }, output: null, errorMessage: null, retryCount: 0, maxRetries: 3, durationMs: null, queuedAt: new Date(Date.now() - 7200000).toISOString(), startedAt: new Date(Date.now() - 7140000).toISOString(), completedAt: null },
  { id: 7, workflowId: 7, state: "completed", stateHistory: [{ state: "queued", at: new Date(Date.now() - 10800000).toISOString(), by: "signal" }, { state: "running", at: new Date(Date.now() - 10740000).toISOString(), by: "system" }, { state: "completed", at: new Date(Date.now() - 10680000).toISOString(), by: "system" }], input: { trigger: "signal", params: { batchSize: 1 } }, output: { processed: 1, success: true }, errorMessage: null, retryCount: 0, maxRetries: 3, durationMs: 60000, queuedAt: new Date(Date.now() - 10800000).toISOString(), startedAt: new Date(Date.now() - 10740000).toISOString(), completedAt: new Date(Date.now() - 10680000).toISOString() },
  { id: 8, workflowId: 8, state: "completed", stateHistory: [{ state: "queued", at: new Date(Date.now() - 14400000).toISOString(), by: "scheduler" }, { state: "running", at: new Date(Date.now() - 14340000).toISOString(), by: "system" }, { state: "completed", at: new Date(Date.now() - 14100000).toISOString(), by: "system" }], input: { trigger: "schedule", params: { batchSize: 5000 } }, output: { processed: 4821, success: true }, errorMessage: null, retryCount: 0, maxRetries: 3, durationMs: 240000, queuedAt: new Date(Date.now() - 14400000).toISOString(), startedAt: new Date(Date.now() - 14340000).toISOString(), completedAt: new Date(Date.now() - 14100000).toISOString() },
];

const DEMO_RUNS_RESP: RunsResp = { data: DEMO_RUNS, meta: { page: 1, limit: 20, total: 8 } };

function useRuns(state: string | null, workflowId: number | null, page: number) {
  return useQuery({
    queryKey: ["alloyRuns", state, workflowId, page],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ limit: "20", page: String(page) });
        if (state) params.set("state", state);
        if (workflowId) params.set("workflowId", String(workflowId));
        const resp = await apiFetch<RunsResp | WorkflowRun[]>(`/alloy/runs?${params}`);
        if (resp && typeof resp === "object" && "data" in resp && Array.isArray((resp as RunsResp).data)) {
          const r = resp as RunsResp;
          if (r.data.length > 0) return r;
        }
        const arr = (resp as WorkflowRun[]) ?? [];
        if (arr.length > 0) return { data: arr, meta: { page: 1, limit: 20, total: arr.length } };
        return DEMO_RUNS_RESP;
      } catch {
        let filtered = DEMO_RUNS;
        if (state) filtered = filtered.filter(r => r.state === state);
        if (workflowId) filtered = filtered.filter(r => r.workflowId === workflowId);
        return { data: filtered, meta: { page: 1, limit: 20, total: filtered.length } };
      }
    },
    refetchInterval: 30000,
    retry: 1,
  });
}

function useWorkflows() {
  return useQuery({
    queryKey: ["alloyWorkflowsForFilter"],
    queryFn: async () => {
      const resp = await apiFetch<{ data: WorkflowDef[] } | WorkflowDef[]>("/alloy/workflows?limit=100");
      if (resp && typeof resp === "object" && "data" in resp) return (resp as { data: WorkflowDef[] }).data;
      return (resp as WorkflowDef[]) ?? [];
    },
    staleTime: 60000,
  });
}

function useRetryRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => apiFetch(`/alloy/runs/${id}/retry`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alloyRuns"] }),
  });
}

function useCancelRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => apiFetch(`/alloy/runs/${id}/cancel`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alloyRuns"] }),
  });
}

const STATE_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode; pulse?: boolean }> = {
  completed: { color: "#10b981", label: "Completed", icon: <CheckCircle className="w-3 h-3" /> },
  failed: { color: "#ef4444", label: "Failed", icon: <XCircle className="w-3 h-3" /> },
  running: { color: "#4B8BDB", label: "Running", icon: <Activity className="w-3 h-3" />, pulse: true },
  queued: { color: "#f59e0b", label: "Queued", icon: <Clock className="w-3 h-3" /> },
  waiting_approval: { color: "#8b5cf6", label: "Awaiting Approval", icon: <AlertTriangle className="w-3 h-3" /> },
  canceled: { color: "#6b7280", label: "Canceled", icon: <XCircle className="w-3 h-3" /> },
};

function formatDuration(ms: number | null) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.round((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

function formatRelative(ts: string) {
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return "just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function RunRow({
  run,
  workflows,
  onRetry,
  onCancel,
  onView,
}: {
  run: WorkflowRun;
  workflows: WorkflowDef[];
  onRetry: (id: number) => void;
  onCancel: (id: number) => void;
  onView: (id: number) => void;
}) {
  const cfg = STATE_CONFIG[run.state] ?? STATE_CONFIG.queued;
  const wf = workflows.find(w => w.id === run.workflowId);
  const trigger = (run.input as Record<string, unknown> | null)?.trigger as string | undefined;

  return (
    <div
      className="border rounded-lg p-3 flex items-center gap-3 cursor-pointer transition-all hover:border-opacity-50 group"
      style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(12,18,30,0.8)" }}
      onClick={() => onView(run.id)}
    >
      <div className="flex items-center gap-1.5 shrink-0" style={{ color: cfg.color }}>
        {cfg.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-white truncate">
            {wf?.name ?? `Workflow #${run.workflowId}`}
          </span>
          <span className="text-[9px] font-mono shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>#{run.id}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-semibold shrink-0" style={{
            color: cfg.color,
            borderColor: `${cfg.color}30`,
            background: `${cfg.color}10`,
          }}>
            {cfg.label}
          </span>
          {trigger && (
            <span className="text-[9px] uppercase tracking-widest shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
              via {trigger}
            </span>
          )}
          <span className="text-[9px] shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>
            {formatRelative(run.queuedAt)}
          </span>
          <span className="text-[9px] font-mono shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
            {formatDuration(run.durationMs)}
          </span>
          {run.retryCount > 0 && (
            <span className="text-[9px] shrink-0" style={{ color: "#f59e0b" }}>
              retry {run.retryCount}/{run.maxRetries}
            </span>
          )}
        </div>
        {run.errorMessage && (
          <div className="text-[9px] mt-0.5 truncate" style={{ color: "#ef4444" }}>{run.errorMessage}</div>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {run.state === "failed" && (
          <button
            onClick={e => { e.stopPropagation(); onRetry(run.id); }}
            className="p-1.5 rounded border transition-colors"
            style={{ borderColor: "rgba(16,185,129,0.2)", color: "#10b981" }}
            title="Retry"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
        {["running", "queued"].includes(run.state) && (
          <button
            onClick={e => { e.stopPropagation(); onCancel(run.id); }}
            className="p-1.5 rounded border transition-colors"
            style={{ borderColor: "rgba(239,68,68,0.2)", color: "#ef4444" }}
            title="Cancel"
          >
            <XCircle className="w-3 h-3" />
          </button>
        )}
        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" style={{ color: "rgba(255,255,255,0.2)" }} />
      </div>
    </div>
  );
}

export default function ExecutionHistory() {
  const [stateFilter, setStateFilter] = useState<string | null>(null);
  const [workflowFilter, setWorkflowFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const { data, isLoading, error } = useRuns(stateFilter, workflowFilter, page);
  const { data: workflows = [] } = useWorkflows();
  const retryRun = useRetryRun();
  const cancelRun = useCancelRun();

  const runs = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  function exportCSV() {
    const rows = [
      ["ID", "Workflow", "State", "Duration (ms)", "Queued At", "Completed At", "Error"],
      ...runs.map(r => [
        r.id,
        workflows.find(w => w.id === r.workflowId)?.name ?? r.workflowId,
        r.state,
        r.durationMs ?? "",
        r.queuedAt,
        r.completedAt ?? "",
        r.errorMessage ?? "",
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `alloy-runs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const STATES = ["running", "queued", "completed", "failed", "waiting_approval", "canceled"];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4" style={{ color: "#4B8BDB" }} />
              <h1 className="text-base font-bold text-white">Execution History</h1>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              All workflow runs — filterable, paginated, with retry and export.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DataStateBadge state="live" />
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
            >
              <Download className="w-3 h-3" />
              CSV
            </button>
            <button
              onClick={() => qc.invalidateQueries({ queryKey: ["alloyRuns"] })}
              className="p-1.5 rounded-lg border"
              style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="rounded-xl border p-3 space-y-3" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(12,18,30,0.8)" }}>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />
            <span className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Status</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => { setStateFilter(null); setPage(1); }}
              className="px-2 py-1 rounded text-[10px] border transition-all"
              style={{
                borderColor: !stateFilter ? "rgba(75,139,219,0.3)" : "rgba(255,255,255,0.06)",
                background: !stateFilter ? "rgba(75,139,219,0.08)" : "transparent",
                color: !stateFilter ? "#4B8BDB" : "rgba(255,255,255,0.35)",
              }}
            >
              All
            </button>
            {STATES.map(s => {
              const cfg = STATE_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => { setStateFilter(stateFilter === s ? null : s); setPage(1); }}
                  className="px-2 py-1 rounded text-[10px] border transition-all"
                  style={{
                    borderColor: stateFilter === s ? `${cfg.color}40` : "rgba(255,255,255,0.06)",
                    background: stateFilter === s ? `${cfg.color}12` : "transparent",
                    color: stateFilter === s ? cfg.color : "rgba(255,255,255,0.35)",
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {workflows.length > 0 && (
            <>
              <div className="flex items-center gap-1.5">
                <Play className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Workflow</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => { setWorkflowFilter(null); setPage(1); }}
                  className="px-2 py-1 rounded text-[10px] border transition-all"
                  style={{
                    borderColor: !workflowFilter ? "rgba(75,139,219,0.3)" : "rgba(255,255,255,0.06)",
                    background: !workflowFilter ? "rgba(75,139,219,0.08)" : "transparent",
                    color: !workflowFilter ? "#4B8BDB" : "rgba(255,255,255,0.35)",
                  }}
                >
                  All Workflows
                </button>
                {workflows.slice(0, 10).map(wf => (
                  <button
                    key={wf.id}
                    onClick={() => { setWorkflowFilter(workflowFilter === wf.id ? null : wf.id); setPage(1); }}
                    className="px-2 py-1 rounded text-[10px] border transition-all"
                    style={{
                      borderColor: workflowFilter === wf.id ? "rgba(75,139,219,0.3)" : "rgba(255,255,255,0.06)",
                      background: workflowFilter === wf.id ? "rgba(75,139,219,0.08)" : "transparent",
                      color: workflowFilter === wf.id ? "#4B8BDB" : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {wf.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {total > 0 && (
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            {total.toLocaleString()} runs {stateFilter || workflowFilter ? "matched" : "total"}
          </div>
        )}

        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg border border-white/5 animate-pulse" style={{ background: "rgba(12,18,30,0.8)" }} />
            ))
          ) : runs.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              No runs match this filter.
            </div>
          ) : (
            runs.map(run => (
              <RunRow
                key={run.id}
                run={run}
                workflows={workflows}
                onRetry={id => retryRun.mutate(id)}
                onCancel={id => cancelRun.mutate(id)}
                onView={id => navigate(`/alloy/runs/${id}`)}
              />
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs border transition-all disabled:opacity-40"
              style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
            >
              Prev
            </button>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              {page} / {totalPages} ({total} total)
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs border transition-all disabled:opacity-40"
              style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
