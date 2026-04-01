import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@workspace/shared-ui";
import {
  Brain, Activity, Play, Pause, CheckCircle, AlertTriangle, Clock,
  RefreshCw, Zap, GitBranch, ArrowRight, MoreHorizontal, Search,
  Filter, Plus, ChevronDown, Eye, StopCircle, RotateCcw, Wifi, WifiOff
} from "lucide-react";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };
const ACCENT = "#d4a054";

type RunStatus = "running" | "completed" | "failed" | "pending" | "cancelled";

interface AlloyWorkflow {
  id: number;
  name: string;
  description?: string;
  status: string;
  triggerType?: string;
  stepCount?: number;
  lastRunAt?: string;
  createdAt?: string;
}
interface AlloyRun {
  id: number;
  workflowId?: number;
  status: RunStatus;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  stepResults?: Record<string, unknown>[];
}
interface AlloyDashboard {
  totalWorkflows?: number;
  totalRuns?: number;
  runningRuns?: number;
  successRate?: number;
  avgDurationMs?: number;
  recentWorkflows?: AlloyWorkflow[];
  recentRuns?: AlloyRun[];
}

interface WorkflowsResponse { data: { workflows: AlloyWorkflow[]; total?: number; fetchedAt?: string } }
interface RunsResponse { data: { runs: AlloyRun[]; total?: number; fetchedAt?: string } }
interface DashboardResponse { data: AlloyDashboard }

const STATUS_CONFIG: Record<RunStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  running: { label: "Running", color: "#d4a054", bg: "rgba(212,160,84,0.12)", icon: Activity },
  completed: { label: "Completed", color: "#6b8f71", bg: "rgba(107,143,113,0.12)", icon: CheckCircle },
  failed: { label: "Failed", color: "#c45a4a", bg: "rgba(196,90,74,0.12)", icon: AlertTriangle },
  pending: { label: "Pending", color: "#7c85a0", bg: "rgba(124,133,160,0.1)", icon: Clock },
  cancelled: { label: "Cancelled", color: "#6b7280", bg: "rgba(107,114,128,0.08)", icon: StopCircle },
};

const STATIC_WORKFLOWS: AlloyWorkflow[] = [
  { id: 1, name: "Incident Triage Pipeline", description: "Ingest alert → classify → route → page on-call", status: "active", triggerType: "event", stepCount: 7, lastRunAt: "2026-04-01T03:22:41Z" },
  { id: 2, name: "SLO Burn-Rate Response", description: "Monitor SLO budget → auto-scale → notify SRE", status: "active", triggerType: "metric", stepCount: 5, lastRunAt: "2026-04-01T02:55:18Z" },
  { id: 3, name: "Compliance Evidence Collector", description: "Pull audit trails → compile artifacts → push to GRC", status: "active", triggerType: "schedule", stepCount: 12, lastRunAt: "2026-03-31T23:00:00Z" },
  { id: 4, name: "Entity Resolution Engine", description: "Cross-ref vendor data → deduplicate → enrich CRM", status: "active", triggerType: "api", stepCount: 8, lastRunAt: "2026-04-01T01:04:22Z" },
  { id: 5, name: "Capital Readiness Briefing", description: "Aggregate KPIs → format exec brief → route for approval", status: "draft", triggerType: "schedule", stepCount: 6, lastRunAt: undefined },
];

const STATIC_RUNS: AlloyRun[] = [
  { id: 101, workflowId: 1, status: "completed", startedAt: "2026-04-01T03:22:41Z", completedAt: "2026-04-01T03:22:48Z" },
  { id: 102, workflowId: 2, status: "running", startedAt: "2026-04-01T03:21:00Z" },
  { id: 103, workflowId: 3, status: "completed", startedAt: "2026-03-31T23:00:00Z", completedAt: "2026-03-31T23:01:42Z" },
  { id: 104, workflowId: 1, status: "failed", startedAt: "2026-04-01T02:10:00Z", completedAt: "2026-04-01T02:10:04Z", errorMessage: "Step 4: API timeout — retrying" },
  { id: 105, workflowId: 4, status: "completed", startedAt: "2026-04-01T01:04:22Z", completedAt: "2026-04-01T01:04:38Z" },
  { id: 106, workflowId: 2, status: "completed", startedAt: "2026-04-01T00:15:00Z", completedAt: "2026-04-01T00:15:11Z" },
];

function RunBadge({ status }: { status: RunStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold font-mono"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}25` }}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

function fmtTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toISOString().slice(11, 19) + " UTC";
}

function fmtAgo(iso?: string) {
  if (!iso) return "—";
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

export default function AlloyWorkflowCanvas() {
  const [location] = useLocation();
  const [view, setView] = useState<"canvas" | "runs">(
    location.includes("/alloy/runs") ? "runs" : "canvas"
  );
  const [searchQ, setSearchQ] = useState("");
  const qc = useQueryClient();

  const { data: dashData, isError: isDashError } = useQuery<DashboardResponse>({
    queryKey: ["alloy-dashboard"],
    queryFn: () => apiFetch<DashboardResponse>("/alloy/dashboard"),
    refetchInterval: 20000,
    retry: 1,
  });

  const { data: workflowsData } = useQuery<WorkflowsResponse>({
    queryKey: ["alloy-workflows"],
    queryFn: () => apiFetch<WorkflowsResponse>("/alloy/workflows"),
    refetchInterval: 30000,
    retry: 1,
  });

  const { data: runsData } = useQuery<RunsResponse>({
    queryKey: ["alloy-runs"],
    queryFn: () => apiFetch<RunsResponse>("/alloy/runs"),
    refetchInterval: 10000,
    retry: 1,
  });

  const triggerMutation = useMutation({
    mutationFn: (workflowId: number) =>
      apiFetch(`/alloy/workflows/${workflowId}/run`, { method: "POST", body: JSON.stringify({}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alloy-runs"] });
      qc.invalidateQueries({ queryKey: ["alloy-dashboard"] });
    },
  });

  const retryMutation = useMutation({
    mutationFn: (runId: number) =>
      apiFetch(`/alloy/runs/${runId}/retry`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alloy-runs"] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (runId: number) =>
      apiFetch(`/alloy/runs/${runId}/cancel`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alloy-runs"] }),
  });

  const dash = dashData?.data;
  const isLive = !isDashError && !!dash;

  const liveWorkflows = workflowsData?.data?.workflows ?? [];
  const liveRuns = runsData?.data?.runs ?? [];

  const workflows = liveWorkflows.length > 0 ? liveWorkflows : STATIC_WORKFLOWS;
  const runs = liveRuns.length > 0 ? liveRuns : STATIC_RUNS;

  const filteredWorkflows = searchQ
    ? workflows.filter(w => w.name.toLowerCase().includes(searchQ.toLowerCase()))
    : workflows;

  const running = runs.filter(r => r.status === "running").length;
  const failed = runs.filter(r => r.status === "failed").length;
  const completed = runs.filter(r => r.status === "completed").length;
  const successRate = dash?.successRate ?? (runs.length > 0 ? Math.round((completed / runs.length) * 100) : 100);

  return (
    <div className="p-4 space-y-4" style={{ background: BG.page, minHeight: "100vh", color: TEXT.primary }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,160,84,0.12)", border: "1px solid rgba(212,160,84,0.2)" }}>
            <Brain className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              Alloy Workflow Canvas
            </h1>
            <p className="text-[10px] mt-0.5" style={{ color: TEXT.tertiary }}>AI orchestration engine — multi-step workflow automation & monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLive ? (
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3" style={{ color: ACCENT }} />
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
              <span className="text-[10px] font-mono" style={{ color: ACCENT }}>Live — Alloy Engine</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <WifiOff className="w-3 h-3" style={{ color: TEXT.tertiary }} />
              <span className="text-[10px] font-mono" style={{ color: TEXT.tertiary }}>Simulation Mode</span>
            </div>
          )}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium"
            style={{ background: "rgba(212,160,84,0.1)", border: "1px solid rgba(212,160,84,0.2)", color: ACCENT }}
          >
            <Plus className="w-3 h-3" />
            New Workflow
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total Workflows", value: dash?.totalWorkflows ?? workflows.length, color: TEXT.primary },
          { label: "Total Runs", value: dash?.totalRuns ?? runs.length, color: TEXT.primary },
          { label: "Currently Running", value: dash?.runningRuns ?? running, color: running > 0 ? ACCENT : TEXT.secondary },
          { label: "Failed", value: failed, color: failed > 0 ? "#c45a4a" : "#6b8f71" },
          { label: "Success Rate", value: `${successRate}%`, color: successRate >= 95 ? "#6b8f71" : successRate >= 80 ? "#c8953c" : "#c45a4a" },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-lg px-3 py-2.5" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
            <p className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: TEXT.tertiary }}>{kpi.label}</p>
            <p className="text-xl font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 p-1 rounded w-fit" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
        {(["canvas", "runs"] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-3 py-1.5 rounded text-[11px] font-medium transition-colors"
            style={{
              background: view === v ? "rgba(212,160,84,0.12)" : "transparent",
              color: view === v ? ACCENT : TEXT.secondary,
              border: view === v ? "1px solid rgba(212,160,84,0.2)" : "1px solid transparent",
            }}
          >
            {v === "canvas" ? "Workflow Canvas" : "Run Monitor"}
          </button>
        ))}
      </div>

      {view === "canvas" ? (
        <div className="space-y-3">
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: TEXT.tertiary }} />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search workflows..."
                className="w-full pl-7 pr-3 py-1.5 text-[11px] rounded outline-none"
                style={{ background: BG.surface, border: `1px solid ${BORDER.muted}`, color: TEXT.primary }}
              />
            </div>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px]" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}`, color: TEXT.secondary }}>
              <Filter className="w-3 h-3" />
              Filter
            </button>
          </div>

          {/* Workflow list */}
          <div className="space-y-2">
            {filteredWorkflows.map(wf => (
              <div key={wf.id} className="rounded-lg p-3" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded shrink-0 flex items-center justify-center mt-0.5" style={{ background: "rgba(212,160,84,0.08)", border: "1px solid rgba(212,160,84,0.15)" }}>
                      <GitBranch className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] font-semibold text-white truncate">{wf.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{
                          color: wf.status === "active" ? "#6b8f71" : "#7c85a0",
                          background: wf.status === "active" ? "rgba(107,143,113,0.1)" : "rgba(124,133,160,0.08)",
                          border: `1px solid ${wf.status === "active" ? "rgba(107,143,113,0.2)" : "rgba(124,133,160,0.15)"}`,
                        }}>
                          {wf.status?.toUpperCase()}
                        </span>
                        {wf.triggerType && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER.subtle}` }}>
                            ⚡ {wf.triggerType}
                          </span>
                        )}
                      </div>
                      {wf.description && (
                        <p className="text-[10px] mt-0.5 truncate" style={{ color: TEXT.secondary }}>{wf.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-[9px] font-mono" style={{ color: TEXT.muted }}>
                        {wf.stepCount && <span>{wf.stepCount} steps</span>}
                        {wf.lastRunAt && <span>Last run {fmtAgo(wf.lastRunAt)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="p-1.5 rounded text-[10px]" style={{ background: "rgba(255,255,255,0.04)", color: TEXT.secondary, border: `1px solid ${BORDER.subtle}` }}>
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => triggerMutation.mutate(wf.id)}
                      disabled={triggerMutation.isPending}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-medium transition-opacity disabled:opacity-50"
                      style={{ background: "rgba(212,160,84,0.1)", border: "1px solid rgba(212,160,84,0.2)", color: ACCENT }}
                    >
                      <Play className="w-3 h-3" />
                      Run
                    </button>
                  </div>
                </div>

                {/* Step visualizer */}
                {wf.stepCount && (
                  <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
                    {Array.from({ length: wf.stepCount }).map((_, si) => (
                      <div key={si} className="flex items-center gap-1 shrink-0">
                        <div
                          className="h-5 w-5 rounded flex items-center justify-center text-[8px] font-mono font-bold"
                          style={{
                            background: si < 3 ? "rgba(107,143,113,0.15)" : si === 3 ? "rgba(212,160,84,0.15)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${si < 3 ? "rgba(107,143,113,0.25)" : si === 3 ? "rgba(212,160,84,0.25)" : BORDER.subtle}`,
                            color: si < 3 ? "#6b8f71" : si === 3 ? ACCENT : TEXT.muted,
                          }}
                        >{si + 1}</div>
                        {si < wf.stepCount - 1 && <ArrowRight className="w-2 h-2 shrink-0" style={{ color: TEXT.muted }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {filteredWorkflows.length === 0 && (
              <div className="text-center py-10 text-[11px]" style={{ color: TEXT.tertiary }}>
                No workflows match "{searchQ}"
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Run Monitor */
        <div className="space-y-3">
          <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: TEXT.tertiary }}>
            Recent Workflow Runs — {runs.length} total
          </p>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER.muted}` }}>
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ background: BG.elevated, borderBottom: `1px solid ${BORDER.muted}` }}>
                  <th className="text-left px-3 py-2 text-[9px] uppercase tracking-wider font-semibold" style={{ color: TEXT.tertiary }}>Run ID</th>
                  <th className="text-left px-3 py-2 text-[9px] uppercase tracking-wider font-semibold" style={{ color: TEXT.tertiary }}>Workflow</th>
                  <th className="text-left px-3 py-2 text-[9px] uppercase tracking-wider font-semibold" style={{ color: TEXT.tertiary }}>Status</th>
                  <th className="text-left px-3 py-2 text-[9px] uppercase tracking-wider font-semibold" style={{ color: TEXT.tertiary }}>Started</th>
                  <th className="text-left px-3 py-2 text-[9px] uppercase tracking-wider font-semibold" style={{ color: TEXT.tertiary }}>Duration</th>
                  <th className="text-left px-3 py-2 text-[9px] uppercase tracking-wider font-semibold" style={{ color: TEXT.tertiary }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run, idx) => {
                  const wf = workflows.find(w => w.id === run.workflowId);
                  const dur = run.completedAt && run.startedAt
                    ? `${((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000).toFixed(1)}s`
                    : run.status === "running" ? "—" : "—";
                  return (
                    <tr key={run.id} style={{ borderBottom: idx < runs.length - 1 ? `1px solid ${BORDER.subtle}` : undefined, background: idx % 2 === 0 ? BG.surface : BG.elevated }}>
                      <td className="px-3 py-2 font-mono text-[10px]" style={{ color: TEXT.tertiary }}>#{run.id}</td>
                      <td className="px-3 py-2 font-medium" style={{ color: TEXT.primary }}>{wf?.name ?? `Workflow #${run.workflowId}`}</td>
                      <td className="px-3 py-2"><RunBadge status={run.status} /></td>
                      <td className="px-3 py-2 font-mono text-[10px]" style={{ color: TEXT.secondary }}>{fmtAgo(run.startedAt)}</td>
                      <td className="px-3 py-2 font-mono text-[10px]" style={{ color: TEXT.secondary }}>{dur}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {run.status === "failed" && (
                            <button
                              onClick={() => retryMutation.mutate(run.id)}
                              disabled={retryMutation.isPending}
                              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] disabled:opacity-50"
                              style={{ color: ACCENT, background: "rgba(212,160,84,0.08)", border: "1px solid rgba(212,160,84,0.2)" }}
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              Retry
                            </button>
                          )}
                          {run.status === "running" && (
                            <button
                              onClick={() => cancelMutation.mutate(run.id)}
                              disabled={cancelMutation.isPending}
                              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] disabled:opacity-50"
                              style={{ color: "#c45a4a", background: "rgba(196,90,74,0.08)", border: "1px solid rgba(196,90,74,0.2)" }}
                            >
                              <StopCircle className="w-2.5 h-2.5" />
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Error messages */}
          {runs.some(r => r.errorMessage) && (
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: TEXT.tertiary }}>Error Details</p>
              {runs.filter(r => r.errorMessage).map(run => (
                <div key={run.id} className="rounded px-3 py-2.5 flex items-start gap-2" style={{ background: "rgba(196,90,74,0.06)", border: "1px solid rgba(196,90,74,0.15)" }}>
                  <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] font-mono" style={{ color: "#c45a4a" }}>Run #{run.id}</span>
                    <span className="text-[10px] ml-2" style={{ color: TEXT.secondary }}>{run.errorMessage}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
