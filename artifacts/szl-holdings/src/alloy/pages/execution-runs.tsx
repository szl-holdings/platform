import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, isAuthError, DataStateBadge, useRealtimeChannel } from "@workspace/shared-ui";
import { Activity, Clock, CheckCircle, XCircle, RotateCcw, RefreshCw, AlertTriangle, Zap, Terminal, ChevronRight, Play, Filter } from "lucide-react";
import { useState, useEffect, useRef } from "react";

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
    refetchInterval: (query) => {
      if (isAuthError(query.state.error)) return false;
      return 120_000;
    },
    retry: (failureCount, error) => {
      if (isAuthError(error)) return false;
      return failureCount < 1;
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

function generateDemoRuns(): WorkflowRun[] {
  const now = Date.now();
  const h = (hrs: number) => new Date(now - hrs * 3600000).toISOString();
  const m = (mins: number) => new Date(now - mins * 60000).toISOString();
  return [
    { id: 1042, orgId: 1, workflowId: 7, status: "running", triggeredBy: 1, startedAt: m(4), completedAt: null, input: { trigger: "schedule" }, output: null, errorMessage: null, retryCount: 0, maxRetries: 3, metadata: { workflowName: "Daily ETL Pipeline", owner: "Platform" }, createdAt: m(5), updatedAt: m(4) },
    { id: 1041, orgId: 1, workflowId: 3, status: "running", triggeredBy: 1, startedAt: m(12), completedAt: null, input: { trigger: "webhook" }, output: null, errorMessage: null, retryCount: 0, maxRetries: 3, metadata: { workflowName: "Client Onboarding Sync", owner: "Ops" }, createdAt: m(13), updatedAt: m(12) },
    { id: 1040, orgId: 1, workflowId: 5, status: "queued", triggeredBy: null, startedAt: null, completedAt: null, input: { trigger: "manual" }, output: null, errorMessage: null, retryCount: 0, maxRetries: 3, metadata: { workflowName: "Compliance Report Gen", owner: "Governance" }, createdAt: m(2), updatedAt: m(2) },
    { id: 1039, orgId: 1, workflowId: 2, status: "completed", triggeredBy: 1, startedAt: h(1), completedAt: m(48), input: { trigger: "schedule" }, output: { rows: 14200 }, errorMessage: null, retryCount: 0, maxRetries: 3, metadata: { workflowName: "Revenue Reconciliation", owner: "Finance" }, createdAt: h(1.1), updatedAt: m(48) },
    { id: 1038, orgId: 1, workflowId: 8, status: "completed", triggeredBy: 1, startedAt: h(2), completedAt: h(1.8), input: { trigger: "api" }, output: { signals: 847 }, errorMessage: null, retryCount: 0, maxRetries: 3, metadata: { workflowName: "PRISM Signal Ingest", owner: "Lyte" }, createdAt: h(2.1), updatedAt: h(1.8) },
    { id: 1037, orgId: 1, workflowId: 4, status: "completed", triggeredBy: 1, startedAt: h(3), completedAt: h(2.7), input: { trigger: "schedule" }, output: { vessels: 312 }, errorMessage: null, retryCount: 0, maxRetries: 3, metadata: { workflowName: "AIS Position Batch", owner: "Vessels" }, createdAt: h(3.1), updatedAt: h(2.7) },
    { id: 1036, orgId: 1, workflowId: 1, status: "failed", triggeredBy: 1, startedAt: h(4), completedAt: h(3.9), input: { trigger: "webhook" }, output: null, errorMessage: "Connection timeout: upstream provider did not respond within 30s (salesforce-connector-v2)", retryCount: 2, maxRetries: 3, metadata: { workflowName: "CRM Contact Sync", owner: "Connectors" }, createdAt: h(4.1), updatedAt: h(3.9) },
    { id: 1035, orgId: 1, workflowId: 6, status: "completed", triggeredBy: 1, startedAt: h(5), completedAt: h(4.6), input: { trigger: "schedule" }, output: { properties: 89 }, errorMessage: null, retryCount: 0, maxRetries: 3, metadata: { workflowName: "Terra Distress Scanner", owner: "Terra" }, createdAt: h(5.1), updatedAt: h(4.6) },
    { id: 1034, orgId: 1, workflowId: 9, status: "retrying", triggeredBy: 1, startedAt: m(8), completedAt: null, input: { trigger: "api" }, output: null, errorMessage: "Rate limit exceeded — backing off 60s", retryCount: 1, maxRetries: 3, metadata: { workflowName: "GitHub Webhook Relay", owner: "Platform" }, createdAt: m(10), updatedAt: m(8) },
    { id: 1033, orgId: 1, workflowId: 10, status: "completed", triggeredBy: 1, startedAt: h(6), completedAt: h(5.5), input: { trigger: "schedule" }, output: { threats: 23 }, errorMessage: null, retryCount: 0, maxRetries: 3, metadata: { workflowName: "Threat Feed Aggregation", owner: "Aegis" }, createdAt: h(6.1), updatedAt: h(5.5) },
    { id: 1032, orgId: 1, workflowId: 7, status: "completed", triggeredBy: 1, startedAt: h(24), completedAt: h(23.5), input: { trigger: "schedule" }, output: { rows: 28400 }, errorMessage: null, retryCount: 0, maxRetries: 3, metadata: { workflowName: "Daily ETL Pipeline", owner: "Platform" }, createdAt: h(24.1), updatedAt: h(23.5) },
    { id: 1031, orgId: 1, workflowId: 11, status: "failed", triggeredBy: 1, startedAt: h(8), completedAt: h(7.9), input: { trigger: "manual" }, output: null, errorMessage: "Schema validation failed: missing required field 'campaign_id' in creative payload", retryCount: 0, maxRetries: 3, metadata: { workflowName: "Creative Asset Pipeline", owner: "Alloy Creative" }, createdAt: h(8.1), updatedAt: h(7.9) },
    { id: 1030, orgId: 1, workflowId: 2, status: "completed", triggeredBy: 1, startedAt: h(25), completedAt: h(24.5), input: { trigger: "schedule" }, output: { rows: 13800 }, errorMessage: null, retryCount: 0, maxRetries: 3, metadata: { workflowName: "Revenue Reconciliation", owner: "Finance" }, createdAt: h(25.1), updatedAt: h(24.5) },
    { id: 1029, orgId: 1, workflowId: 12, status: "completed", triggeredBy: 1, startedAt: h(10), completedAt: h(9.2), input: { trigger: "schedule" }, output: { models: 4 }, errorMessage: null, retryCount: 0, maxRetries: 3, metadata: { workflowName: "Model Health Check", owner: "AI Gateway" }, createdAt: h(10.1), updatedAt: h(9.2) },
  ];
}

const STATUS_STYLES: Record<string, { color: string; icon: React.ReactNode; label: string; pulse?: boolean }> = {
  completed: { color: "#10b981", icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Completed" },
  failed: { color: "#ef4444", icon: <XCircle className="w-3.5 h-3.5" />, label: "Failed" },
  running: { color: "#00d4ff", icon: <Activity className="w-3.5 h-3.5" />, label: "Running", pulse: true },
  retrying: { color: "#8b5cf6", icon: <RotateCcw className="w-3.5 h-3.5" />, label: "Retrying", pulse: true },
  queued: { color: "#f59e0b", icon: <Clock className="w-3.5 h-3.5" />, label: "Queued" },
  cancelled: { color: "#6b7280", icon: <XCircle className="w-3.5 h-3.5" />, label: "Cancelled" },
};

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-[10px]" style={{ color: "rgba(0,212,255,0.5)" }}>
      {time.toLocaleTimeString("en-US", { hour12: false })} UTC
    </span>
  );
}

function RunDurationBadge({ startedAt, completedAt, status }: { startedAt?: string | null; completedAt?: string | null; status: string }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<Date | null>(startedAt ? new Date(startedAt) : null);

  useEffect(() => {
    if (status !== "running" && status !== "retrying") return;
    const id = setInterval(() => {
      if (startRef.current) setElapsed(Math.floor((Date.now() - startRef.current.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  if (status === "running" || status === "retrying") {
    const m = Math.floor(elapsed / 60), s = elapsed % 60;
    return <span className="font-mono text-[10px]" style={{ color: "#00d4ff" }}>{m > 0 ? `${m}m ` : ""}{s}s running</span>;
  }
  if (startedAt && completedAt) {
    const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
    const sec = Math.round(ms / 1000);
    return <span className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${sec % 60}s`}</span>;
  }
  return null;
}

function ExecutionTimeline({ run }: { run: WorkflowRun }) {
  const phases = [
    { label: "Queued", done: true },
    { label: "Started", done: !!run.startedAt },
    { label: "Processing", done: ["completed", "failed", "cancelled"].includes(run.status) },
    { label: "Complete", done: run.status === "completed" },
  ];
  return (
    <div className="flex items-center gap-0 mt-3">
      {phases.map((p, i) => (
        <div key={p.label} className="flex items-center">
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-2 h-2 rounded-full" style={{
              background: p.done
                ? (run.status === "failed" && i === 2 ? "#ef4444" : "#00d4ff")
                : "rgba(255,255,255,0.08)",
              border: p.done ? "none" : "1px solid rgba(255,255,255,0.12)",
            }} />
            <span className="text-[8px] whitespace-nowrap" style={{ color: p.done ? "rgba(0,212,255,0.6)" : "rgba(255,255,255,0.2)" }}>{p.label}</span>
          </div>
          {i < phases.length - 1 && (
            <div className="w-8 h-px mb-3 mx-0.5" style={{ background: phases[i + 1].done ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.06)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function RunDrawer({ run, onClose, onRetry, onCancel }: { run: WorkflowRun; onClose: () => void; onRetry: (id: number) => void; onCancel: (id: number) => void }) {
  const s = STATUS_STYLES[run.status] ?? { color: "#fff", icon: null, label: run.status };
  const durationMs = run.startedAt && run.completedAt
    ? new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()
    : null;
  const meta = run.metadata as Record<string, unknown> ?? {};
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/50 backdrop-blur-sm" />
      <div className="w-full max-w-lg bg-[#0c1420] border-l border-white/10 flex flex-col h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-white/5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: s.color, background: `${s.color}14`, border: `1px solid ${s.color}30` }}>
                <span className={s.pulse ? "animate-pulse" : ""}>{s.icon}</span> {s.label}
              </span>
              {(run.status === "running" || run.status === "retrying") && (
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.color }} />
              )}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xs p-1 rounded hover:bg-white/5 transition-colors">✕</button>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-bold text-white">Run #{run.id}</h2>
            {run.workflowId && <span className="text-[10px] font-mono" style={{ color: "rgba(0,212,255,0.5)" }}>WF-{run.workflowId}</span>}
          </div>
          <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            Retries: {run.retryCount}/{run.maxRetries}
            {run.triggeredBy && <> · Triggered by user {run.triggeredBy}</>}
          </p>
          <ExecutionTimeline run={run} />
        </div>

        <div className="p-5 border-b border-white/5 grid grid-cols-2 gap-3">
          {run.startedAt && (
            <div className="bg-white/3 rounded-lg p-3 border border-white/5">
              <div className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Started</div>
              <div className="text-[11px] text-white">{new Date(run.startedAt).toLocaleString()}</div>
            </div>
          )}
          {run.completedAt && (
            <div className="bg-white/3 rounded-lg p-3 border border-white/5">
              <div className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Completed</div>
              <div className="text-[11px] text-white">{new Date(run.completedAt).toLocaleString()}</div>
            </div>
          )}
          {durationMs !== null && (
            <div className="bg-white/3 rounded-lg p-3 border border-white/5">
              <div className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Duration</div>
              <div className="text-[11px] font-mono text-white">{Math.round(durationMs / 1000)}s</div>
            </div>
          )}
          <div className="bg-white/3 rounded-lg p-3 border border-white/5">
            <div className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Created</div>
            <div className="text-[11px] text-white">{new Date(run.createdAt).toLocaleString()}</div>
          </div>
        </div>

        {run.errorMessage && (
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-red-400 mb-2">
              <AlertTriangle className="w-3 h-3" /> Exception Details
            </div>
            <div className="text-[11px] text-red-300 font-mono bg-red-500/5 rounded-lg p-3 border border-red-500/15 leading-relaxed">{run.errorMessage}</div>
          </div>
        )}

        {run.input && Object.keys(run.input).length > 0 && (
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center gap-1.5 text-[10px] font-medium mb-2" style={{ color: "rgba(0,212,255,0.7)" }}>
              <Terminal className="w-3 h-3" /> Input Payload
            </div>
            <pre className="text-[10px] text-slate-400 overflow-auto bg-white/3 rounded-lg p-3 border border-white/5 max-h-48">{JSON.stringify(run.input, null, 2)}</pre>
          </div>
        )}

        {Object.keys(meta).length > 0 && (
          <div className="p-5 border-b border-white/5">
            <div className="text-[10px] font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Metadata</div>
            <pre className="text-[10px] text-slate-400 overflow-auto bg-white/3 rounded-lg p-3 border border-white/5 max-h-32">{JSON.stringify(meta, null, 2)}</pre>
          </div>
        )}

        <div className="p-5 mt-auto">
          <div className="flex flex-wrap gap-2">
            {run.status === "failed" && run.retryCount < run.maxRetries && (
              <button onClick={() => { onRetry(run.id); onClose(); }} className="text-[10px] px-3 py-1.5 rounded-lg font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:opacity-80 transition-all flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Retry Run
              </button>
            )}
            {["queued", "running", "retrying"].includes(run.status) && (
              <button onClick={() => { onCancel(run.id); onClose(); }} className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80" style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Cancel Run
              </button>
            )}
            <button className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1 ml-auto" style={{ color: "rgba(0,212,255,0.6)", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)" }}>
              <ChevronRight className="w-3 h-3" /> Audit Trail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonRun() {
  return (
    <div className="rounded-xl border p-5 animate-pulse" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-16 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
          <div className="h-4 w-48 rounded mb-1" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="h-3 w-32 rounded" style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>
        <div className="h-8 w-16 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>
    </div>
  );
}

export default function ExecutionRuns() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const { data: apiRuns, isLoading, isError, refetch, dataUpdatedAt } = useRuns(statusFilter !== "all" ? statusFilter : undefined);
  const retryRun = useRetryRun();
  const cancelRun = useCancelRun();

  const qcRuns = useQueryClient();
  const { lastMessage: wsMsg } = useRealtimeChannel("workflow-runs");
  useEffect(() => {
    if (!wsMsg) return;
    qcRuns.invalidateQueries({ queryKey: ["alloyRuns"] });
  }, [wsMsg, qcRuns]);

  const [demoRuns] = useState(() => generateDemoRuns());
  const usingDemo = isError || (!isLoading && (!apiRuns || apiRuns.length === 0));
  const runs = usingDemo ? demoRuns : (apiRuns ?? []);

  const failed = runs.filter(r => r.status === "failed");
  const running = runs.filter(r => r.status === "running");
  const completed = runs.filter(r => r.status === "completed");
  const retrying = runs.filter(r => r.status === "retrying");
  const queued = runs.filter(r => r.status === "queued");

  const freshnessAge = dataUpdatedAt ? Math.floor((Date.now() - dataUpdatedAt) / 1000) : null;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5" style={{ color: "#00d4ff" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "#00d4ff" }}>Alloy · Execution Fabric</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Execution Runs</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Live and historical workflow runs with retry logic and exception handling.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DataStateBadge state={usingDemo ? "stub" : "live"} pulse={!usingDemo} />
          {freshnessAge !== null && (
            <span className="text-[9px] font-mono" style={{ color: freshnessAge < 15 ? "rgba(16,185,129,0.7)" : "rgba(255,255,255,0.25)" }}>
              {freshnessAge < 5 ? "● live" : `↻ ${freshnessAge}s ago`}
            </span>
          )}
          <LiveClock />
          <button onClick={() => refetch()} className="flex items-center gap-1.5 text-[11px] border px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.08)" }}>
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* Status command strip */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
        <div className="flex items-stretch divide-x" style={{ borderLeftColor: "rgba(255,255,255,0.05)" }}>
          {[
            { label: "Running", value: running.length, color: "#00d4ff", pulse: running.length > 0 },
            { label: "Retrying", value: retrying.length, color: "#8b5cf6", pulse: retrying.length > 0 },
            { label: "Queued", value: queued.length, color: "#f59e0b" },
            { label: "Failed", value: failed.length, color: "#ef4444", urgent: failed.length > 0 },
            { label: "Completed", value: completed.length, color: "#10b981" },
            { label: "Total", value: runs.length, color: "rgba(255,255,255,0.5)" },
          ].map((c, i) => (
            <div key={c.label} className="flex-1 px-4 py-3 text-center" style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className="text-xl font-bold font-mono" style={{ color: c.color }}>{c.value}</span>
                {c.pulse && c.value > 0 && <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: c.color }} />}
              </div>
              <div className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          <Filter className="w-3 h-3" /> Filter:
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {["all", "running", "queued", "completed", "failed", "retrying", "cancelled"].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className="text-[10px] px-2.5 py-1 rounded-lg border capitalize transition-all"
              style={{
                background: statusFilter === f ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.02)",
                borderColor: statusFilter === f ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.06)",
                color: statusFilter === f ? "#00d4ff" : "rgba(255,255,255,0.35)",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>{runs.length} runs</span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <SkeletonRun key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && runs.length === 0 && (
        <div className="rounded-xl border p-12 text-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <Play className="w-5 h-5" style={{ color: "rgba(16,185,129,0.4)" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
            {statusFilter === "all" ? "No runs found" : `No ${statusFilter} runs`}
          </p>
          <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>
            {statusFilter === "all" ? "Trigger a workflow run to see execution details here." : `Switch filter to see other run states.`}
          </p>
        </div>
      )}

      {/* Run list */}
      <div className="space-y-2">
        {runs.map(run => {
          const s = STATUS_STYLES[run.status] ?? { color: "#fff", icon: null, label: run.status };
          const meta = run.metadata as Record<string, unknown> ?? {};
          const workflow = meta.workflowName as string ?? (run.workflowId ? `Workflow #${run.workflowId}` : "Unnamed");
          const owner = meta.owner as string ?? undefined;
          const isActive = run.status === "running" || run.status === "retrying";

          return (
            <div
              key={run.id}
              className="rounded-xl border cursor-pointer transition-all group"
              style={{
                borderColor: run.status === "failed" ? "rgba(239,68,68,0.2)" : isActive ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.06)",
                background: run.status === "failed" ? "rgba(239,68,68,0.02)" : isActive ? "rgba(0,212,255,0.02)" : "rgba(255,255,255,0.01)",
              }}
              onClick={() => setSelectedRun(run)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: s.color, background: `${s.color}14`, border: `1px solid ${s.color}28` }}>
                        <span className={isActive ? "animate-pulse" : ""}>{s.icon}</span> {s.label}
                      </span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.color }} />}
                      {owner && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          {owner}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-white">Run #{run.id}</span>
                      <span className="text-[11px] font-mono" style={{ color: "rgba(0,212,255,0.5)" }}>{workflow}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {run.startedAt && (
                        <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
                          {new Date(run.startedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                      <RunDurationBadge startedAt={run.startedAt} completedAt={run.completedAt} status={run.status} />
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>Retries: {run.retryCount}/{run.maxRetries}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "rgba(0,212,255,0.4)" }} />
                </div>

                {run.errorMessage && (
                  <div className="mt-3 rounded-lg p-2.5" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-red-400">Exception</span>
                    </div>
                    <p className="text-[10px] font-mono line-clamp-2" style={{ color: "rgba(255,255,255,0.45)" }}>{run.errorMessage}</p>
                  </div>
                )}
              </div>

              {/* Bottom action bar */}
              <div className="px-4 py-2.5 border-t flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
                {run.status === "failed" && run.retryCount < run.maxRetries && (
                  <button
                    onClick={() => retryRun.mutate(run.id)}
                    disabled={retryRun.isPending}
                    className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1"
                    style={{ color: "#8b5cf6", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}
                  >
                    <RotateCcw className="w-3 h-3" /> Retry
                  </button>
                )}
                {["queued", "running", "retrying"].includes(run.status) && (
                  <button
                    onClick={() => cancelRun.mutate(run.id)}
                    disabled={cancelRun.isPending}
                    className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all hover:opacity-80"
                    style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    Cancel
                  </button>
                )}
                <button className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all hover:opacity-80 ml-auto" style={{ color: "rgba(0,212,255,0.5)", background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.1)" }}>
                  Audit Log
                </button>
                <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>#{run.id}</span>
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
