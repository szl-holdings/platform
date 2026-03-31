import { useQuery } from "@tanstack/react-query";
import { apiFetch, DataStateBadge, isAuthError } from "@workspace/shared-ui";
import { Activity, CheckCircle, XCircle, Clock, AlertTriangle, ChevronRight, Zap, TrendingUp, Timer } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface WorkflowStat {
  workflow: {
    id: number;
    name: string;
    description: string | null;
    trigger: string;
    outputType: string;
    requiresApproval: boolean;
    runCount: number;
    lastRunAt: string | null;
    isActive: boolean;
  };
  counts: {
    running: number;
    queued: number;
    completed: number;
    failed: number;
    waiting_approval: number;
    canceled: number;
  };
  totalRuns: number;
  successRate: number;
  avgDurationMs: number | null;
  sparkline: number[];
  lastRunAt: string | null;
  lastRunState: string | null;
  recentRuns: Array<{ id: number; state: string; queuedAt: string }>;
}

interface FactoryFloorData {
  workflows: WorkflowStat[];
  globalCounts: {
    running: number;
    queued: number;
    completed: number;
    failed: number;
    waiting_approval: number;
  };
  fetchedAt: string;
}

function useFactoryFloor() {
  return useQuery({
    queryKey: ["alloyFactoryFloor"],
    queryFn: async () => {
      const resp = await apiFetch<FactoryFloorData | { data: FactoryFloorData }>("/alloy/factory-floor");
      if (resp && typeof resp === "object" && "data" in resp) return resp.data as FactoryFloorData;
      return resp as FactoryFloorData;
    },
    refetchInterval: (query) => {
      if (isAuthError(query.state.error)) return false;
      return 10000;
    },
    retry: (failureCount, error) => {
      if (isAuthError(error)) return false;
      return failureCount < 1;
    },
  });
}

const STATE_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  running: { color: "#00d4ff", label: "Running", bg: "rgba(0,212,255,0.12)" },
  queued: { color: "#f59e0b", label: "Queued", bg: "rgba(245,158,11,0.12)" },
  completed: { color: "#10b981", label: "Completed", bg: "rgba(16,185,129,0.12)" },
  failed: { color: "#ef4444", label: "Failed", bg: "rgba(239,68,68,0.12)" },
  waiting_approval: { color: "#8b5cf6", label: "Pending Approval", bg: "rgba(139,92,246,0.12)" },
  canceled: { color: "#6b7280", label: "Canceled", bg: "rgba(107,114,128,0.12)" },
};

const TRIGGER_LABELS: Record<string, string> = {
  schedule: "Scheduled",
  webhook: "Webhook",
  api: "API",
  manual: "Manual",
  signal: "Signal",
};

const OUTPUT_LABELS: Record<string, string> = {
  report: "Report",
  alert: "Alert",
  notification: "Notification",
  action: "Action",
  document: "Document",
  data_export: "Export",
  none: "None",
};

function Sparkline({ data, color = "#00d4ff" }: { data: number[]; color?: string }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const width = 56;
  const height = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (v / max) * (height - 4) - 2;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="1.5"
            fill={color}
            opacity={i === data.length - 1 ? 1 : 0.4}
          />
        );
      })}
    </svg>
  );
}

function formatDuration(ms: number | null) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.round((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

function formatRelative(ts: string | null) {
  if (!ts) return "never";
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return "just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function WorkflowCard({ stat, onClick }: { stat: WorkflowStat; onClick: () => void }) {
  const { workflow, counts, successRate, avgDurationMs, sparkline, lastRunAt, lastRunState, totalRuns } = stat;

  const isRunning = counts.running > 0;
  const hasFailed = counts.failed > 0;
  const borderColor = isRunning ? "rgba(0,212,255,0.25)" : hasFailed ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)";
  const bgGlow = isRunning ? "rgba(0,212,255,0.02)" : hasFailed ? "rgba(239,68,68,0.015)" : "transparent";

  return (
    <div
      className="rounded-xl border cursor-pointer transition-all duration-200 group hover:border-opacity-50"
      style={{
        borderColor,
        background: `rgba(12,18,30,0.95)`,
        boxShadow: isRunning ? `0 0 0 1px rgba(0,212,255,0.08), 0 4px 24px ${bgGlow}` : undefined,
      }}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isRunning && (
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              )}
              <span className="text-sm font-semibold text-white truncate">{workflow.name}</span>
            </div>
            <div className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
              {workflow.description}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" style={{ color: "rgba(255,255,255,0.2)" }} />
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-medium" style={{
            color: "#00d4ff",
            borderColor: "rgba(0,212,255,0.2)",
            background: "rgba(0,212,255,0.06)",
          }}>
            {TRIGGER_LABELS[workflow.trigger] ?? workflow.trigger}
          </span>
          <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border" style={{
            color: "rgba(255,255,255,0.4)",
            borderColor: "rgba(255,255,255,0.08)",
          }}>
            {OUTPUT_LABELS[workflow.outputType] ?? workflow.outputType}
          </span>
          {workflow.requiresApproval && (
            <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border" style={{
              color: "#8b5cf6",
              borderColor: "rgba(139,92,246,0.2)",
              background: "rgba(139,92,246,0.06)",
            }}>
              Requires Approval
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {[
            { label: "Running", value: counts.running, color: "#00d4ff" },
            { label: "Queued", value: counts.queued, color: "#f59e0b" },
            { label: "OK", value: counts.completed, color: "#10b981" },
            { label: "Failed", value: counts.failed, color: "#ef4444" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg p-2 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="text-sm font-bold" style={{ color }}>{value}</div>
              <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xs font-bold" style={{ color: successRate >= 80 ? "#10b981" : successRate >= 60 ? "#f59e0b" : "#ef4444" }}>
                {successRate}%
              </div>
              <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>success rate</div>
            </div>
            <div>
              <div className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>
                {formatDuration(avgDurationMs)}
              </div>
              <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>avg duration</div>
            </div>
            <div>
              <div className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>{totalRuns}</div>
              <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>total runs</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Sparkline data={sparkline} color={successRate >= 80 ? "#10b981" : successRate >= 60 ? "#f59e0b" : "#ef4444"} />
            <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>7-day success %</div>
          </div>
        </div>

        {lastRunAt && (
          <div className="mt-2 pt-2 border-t flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>Last run {formatRelative(lastRunAt)}</span>
            {lastRunState && (
              <span className="text-[9px] font-medium" style={{ color: STATE_CONFIG[lastRunState]?.color ?? "rgba(255,255,255,0.4)" }}>
                {STATE_CONFIG[lastRunState]?.label ?? lastRunState}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FactoryFloor() {
  const { data, isLoading, error } = useFactoryFloor();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<"all" | "running" | "failed" | "queued">("all");

  const workflows = data?.workflows ?? [];
  const global = data?.globalCounts;

  const filtered = filter === "all" ? workflows
    : filter === "running" ? workflows.filter(w => w.counts.running > 0)
    : filter === "failed" ? workflows.filter(w => w.counts.failed > 0)
    : workflows.filter(w => w.counts.queued > 0);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4" style={{ color: "#00d4ff" }} />
              <h1 className="text-base font-bold text-white">Factory Floor</h1>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Real-time overview of all workflow types and execution health.
            </p>
          </div>
          <DataStateBadge state="live" />
        </div>

        {global && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Running", value: global.running, color: "#00d4ff", icon: <Activity className="w-3.5 h-3.5" /> },
              { label: "Queued", value: global.queued, color: "#f59e0b", icon: <Clock className="w-3.5 h-3.5" /> },
              { label: "Completed", value: global.completed, color: "#10b981", icon: <CheckCircle className="w-3.5 h-3.5" /> },
              { label: "Failed", value: global.failed, color: "#ef4444", icon: <XCircle className="w-3.5 h-3.5" /> },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className="rounded-xl border p-4" style={{
                borderColor: `${color}20`,
                background: `${color}06`,
              }}>
                <div className="flex items-center gap-2 mb-2" style={{ color }}>
                  {icon}
                  <span className="text-[10px] uppercase tracking-widest font-semibold">{label}</span>
                </div>
                <div className="text-2xl font-bold" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {(["all", "running", "failed", "queued"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={{
                background: filter === f ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.02)",
                borderColor: filter === f ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.08)",
                color: filter === f ? "#00d4ff" : "rgba(255,255,255,0.4)",
              }}
            >
              {f === "all" ? "All workflows" : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== "all" && global && (
                <span className="ml-1 opacity-60">
                  ({f === "running" ? global.running : f === "failed" ? global.failed : global.queued})
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/5 p-4 animate-pulse" style={{ background: "rgba(12,18,30,0.95)" }}>
                <div className="h-4 bg-white/5 rounded mb-2 w-2/3" />
                <div className="h-3 bg-white/5 rounded mb-4 w-full" />
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {[0,1,2,3].map(j => <div key={j} className="h-10 bg-white/5 rounded" />)}
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            No workflows match this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(stat => (
              <WorkflowCard
                key={stat.workflow.id}
                stat={stat}
                onClick={() => navigate(`/alloy/runs?workflowId=${stat.workflow.id}&name=${encodeURIComponent(stat.workflow.name)}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
