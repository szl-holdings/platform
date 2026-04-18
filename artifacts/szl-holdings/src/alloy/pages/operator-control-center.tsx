import { DataStateBadge } from "@szl-holdings/shared-ui/data-state-badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { useState } from "react";
import {
  Shield, RefreshCw, Activity, AlertTriangle, CheckCircle, Clock,
  XCircle, Radio, Zap, BarChart2, TrendingUp, Play, RotateCcw,
  ChevronRight, Server, Brain, Layers, Eye, ChevronUp, ChevronDown,
} from "lucide-react";

function formatRelative(ts: string | null) {
  if (!ts) return "Never";
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return "just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function formatDuration(ms: number | null) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}


const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string; icon: React.ReactNode; pulse?: boolean }> = {
  running: { color: "#4B8BDB", bg: "rgba(75,139,219,0.08)", border: "rgba(75,139,219,0.2)", label: "Running", icon: <Activity className="w-3 h-3" />, pulse: true },
  idle: { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", label: "Idle", icon: <CheckCircle className="w-3 h-3" /> },
  failed: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", label: "Failed", icon: <XCircle className="w-3 h-3" /> },
  stalled: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", label: "Stalled", icon: <AlertTriangle className="w-3 h-3" /> },
};

const PROVIDER_STATUS: Record<string, { color: string; label: string }> = {
  healthy: { color: "#10b981", label: "Healthy" },
  degraded: { color: "#f59e0b", label: "Degraded" },
  down: { color: "#ef4444", label: "Down" },
};

function StatCard({ label, value, color, icon, sub, alert }: { label: string; value: number | string; color: string; icon: React.ReactNode; sub?: string; alert?: boolean }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: alert ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)", background: alert ? "rgba(239,68,68,0.02)" : "rgba(12,18,30,0.95)" }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{sub}</div>}
    </div>
  );
}

interface AgentHealth {
  id: string;
  name: string;
  status: string;
  violations: number;
  successRate: number;
  avgLatencyMs: number;
  queueDepth: number;
  cost24h: number;
  lastRunAt: string;
}

const DEMO_STATE = {
  agentHealth: [
    {
      id: "stub-agent",
      name: "Stub Agent",
      status: "idle",
      violations: 0,
      successRate: 99.9,
      avgLatencyMs: 95,
      queueDepth: 0,
      cost24h: 0.01,
      lastRunAt: new Date().toISOString(),
    },
  ],
  executionQueue: {
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
  },
} as const;

function AgentHealthRow({ agent, onRestart }: { agent: AgentHealth; onRestart: (id: string) => void }) {
  const cfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle;
  const hasAlert = agent.violations > 0 || agent.status === "failed";

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-colors hover:bg-white/2" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
      <span className="flex items-center gap-1 shrink-0" style={{ color: cfg.color }}>
        {cfg.icon}
        {cfg.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: hasAlert ? "#ef4444" : "#fff" }}>{agent.name}</span>
          {agent.violations > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
              {agent.violations} violations
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          <span>SR: <span style={{ color: agent.successRate >= 95 ? "#10b981" : agent.successRate >= 80 ? "#f59e0b" : "#ef4444" }}>{agent.successRate}%</span></span>
          <span>P50: {formatDuration(agent.avgLatencyMs)}</span>
          <span>Q: {agent.queueDepth}</span>
          <span>Cost: ${agent.cost24h.toFixed(2)}/24h</span>
          <span>{formatRelative(agent.lastRunAt)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border" style={{ color: cfg.color, borderColor: cfg.border, background: cfg.bg }}>
          {cfg.label}
        </span>
        {agent.status === "failed" && (
          <button
            onClick={() => onRestart(agent.id)}
            className="p-1.5 rounded border transition-colors hover:bg-white/5"
            style={{ borderColor: "rgba(16,185,129,0.2)", color: "#10b981" }}
            title="Restart Agent"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function OperatorControlCenter() {
  const [alertThresholds, _setAlertThresholds] = useState({ timeMs: 120000, costUsd: 20 });
  const qc = useQueryClient();

  const { data: agentStats } = useQuery({
    queryKey: ["alloyOperatorAgents"],
    queryFn: async () => {
      try { return await apiFetch("/agent-os/agent-stats"); } catch { return null; }
    },
    refetchInterval: 15000,
  });

  const { data: factoryFloor } = useQuery({
    queryKey: ["alloyFactoryFloorOperator"],
    queryFn: async () => {
      try { return await apiFetch<{ globalCounts: unknown[] }>("/alloy/factory-floor"); } catch { return null; }
    },
    refetchInterval: 15000,
  });

  const { data: violationsData } = useQuery({
    queryKey: ["alloyPolicyViolations"],
    queryFn: async (): Promise<{ violations: any[] } | null> => {
      try { return await apiFetch<{ violations: any[] }>("/alloy/policy-violations"); } catch { return null; }
    },
    refetchInterval: 15000,
  });

  const { data: bottlenecksData } = useQuery({
    queryKey: ["alloyApprovalBottlenecks"],
    queryFn: async (): Promise<{ bottlenecks: any[] } | null> => {
      try { return await apiFetch<{ bottlenecks: any[] }>("/alloy/approval-bottlenecks"); } catch { return null; }
    },
    refetchInterval: 15000,
  });

  const { data: providersData } = useQuery({
    queryKey: ["alloyProviderHealth"],
    queryFn: async (): Promise<{ providers: any[] } | null> => {
      try { return await apiFetch<{ providers: any[] }>("/alloy/provider-health"); } catch { return null; }
    },
    refetchInterval: 30000,
  });

  const queueData = (factoryFloor as any)?.globalCounts ?? { running: 0, queued: 0, waitingApproval: 0, failed: 0, totalToday: 0 };
  const agentHealth: any[] = (agentStats as any)?.agents ?? [];
  const violations: any[] = (violationsData as any)?.violations ?? [];
  const bottlenecks: any[] = (bottlenecksData as any)?.bottlenecks ?? [];
  const providers: any[] = (providersData as any)?.providers ?? [];

  const failedAgents = agentHealth.filter(a => a.status === "failed").length;
  const totalViolations = violations.length;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3.5 h-3.5" style={{ color: "#4B8BDB" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "#4B8BDB" }}>Alloy · Operator Control</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Operator Control Center</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Real-time agent health, execution queue, policy violations, and provider status.</p>
        </div>
        <div className="flex items-center gap-2">
          <DataStateBadge state="demo" />
          <button onClick={() => qc.invalidateQueries()} className="flex items-center gap-1.5 text-[11px] border px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5 shrink-0" style={{ color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.08)" }}>
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Runs" value={queueData.running ?? 14} color="#4B8BDB" icon={<Activity className="w-3.5 h-3.5" />} sub="Right now" />
        <StatCard label="Queue Depth" value={queueData.queued ?? 8} color="#f59e0b" icon={<Clock className="w-3.5 h-3.5" />} sub="Pending" />
        <StatCard label="Failed Agents" value={failedAgents} color={failedAgents > 0 ? "#ef4444" : "#10b981"} icon={<XCircle className="w-3.5 h-3.5" />} sub={failedAgents > 0 ? "Needs attention" : "All healthy"} alert={failedAgents > 0} />
        <StatCard label="Policy Violations" value={totalViolations} color={totalViolations > 0 ? "#ef4444" : "#10b981"} icon={<Shield className="w-3.5 h-3.5" />} sub="Last 24h" alert={totalViolations > 0} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(12,18,30,0.95)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" style={{ color: "rgba(75,139,219,0.7)" }} />
              <span className="text-xs font-semibold text-white">Agent Health Grid</span>
            </div>
            <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{agentHealth.length} agents</span>
          </div>
          <div>
            {agentHealth.map(agent => (
              <AgentHealthRow
                key={agent.id}
                agent={agent}
                onRestart={id => {
                  qc.invalidateQueries({ queryKey: ["alloyOperatorAgents"] });
                }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(239,68,68,0.15)", background: "rgba(12,18,30,0.95)" }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <AlertTriangle className="w-4 h-4" style={{ color: "#ef4444" }} />
              <span className="text-xs font-semibold text-white">Policy Violations</span>
              {violations.length > 0 && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>{violations.length}</span>
              )}
            </div>
            <div className="p-3 space-y-2">
              {violations.map(v => (
                <div key={v.id} className="rounded-lg p-3 border" style={{ borderColor: v.severity === "critical" ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.2)", background: v.severity === "critical" ? "rgba(239,68,68,0.04)" : "rgba(245,158,11,0.04)" }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[10px] font-semibold" style={{ color: v.severity === "critical" ? "#ef4444" : "#f59e0b" }}>{v.action}</span>
                    <span className="text-[9px] font-mono shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>{formatRelative(v.blockedAt)}</span>
                  </div>
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>{v.reason}</div>
                  <div className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>Agent: {v.agentName}</div>
                </div>
              ))}
              {violations.length === 0 && (
                <div className="text-center py-4 text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>No policy violations</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(245,158,11,0.1)", background: "rgba(12,18,30,0.95)" }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <Clock className="w-4 h-4" style={{ color: "#f59e0b" }} />
              <span className="text-xs font-semibold text-white">Approval Bottlenecks</span>
            </div>
            <div className="p-3 space-y-2">
              {bottlenecks.map(b => {
                const hours = Math.floor(b.waitingMs / 3600000);
                const urgent = hours >= 4;
                return (
                  <div key={b.id} className="flex items-center gap-3 rounded-lg p-2.5 border" style={{ borderColor: urgent ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium text-white truncate">{b.label}</div>
                      <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>Role: {b.role}</div>
                    </div>
                    <span className="text-[9px] font-mono shrink-0 font-bold" style={{ color: urgent ? "#ef4444" : "#f59e0b" }}>{hours}h waiting</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(12,18,30,0.95)" }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <Server className="w-4 h-4" style={{ color: "rgba(75,139,219,0.7)" }} />
            <span className="text-xs font-semibold text-white">AI Provider Health</span>
          </div>
          <div className="p-3 space-y-2">
            {providers.map(p => {
              const pCfg = PROVIDER_STATUS[p.status] ?? PROVIDER_STATUS.healthy;
              return (
                <div key={p.provider} className="rounded-lg p-3 border" style={{ borderColor: p.status === "degraded" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-[11px] font-semibold text-white">{p.provider}</span>
                      <span className="text-[9px] ml-1.5 font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{p.model}</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: pCfg.color, background: `${pCfg.color}15` }}>{pCfg.label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                    <span>Latency: <span className="font-mono" style={{ color: p.avgLatencyMs < 2000 ? "#10b981" : p.avgLatencyMs < 4000 ? "#f59e0b" : "#ef4444" }}>{p.avgLatencyMs}ms</span></span>
                    <span>Errors: <span className="font-mono" style={{ color: p.errorRate < 1 ? "#10b981" : p.errorRate < 5 ? "#f59e0b" : "#ef4444" }}>{p.errorRate}%</span></span>
                    <span>Cost: <span className="font-mono">${p.cost24h}/24h</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(12,18,30,0.95)" }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <BarChart2 className="w-4 h-4" style={{ color: "rgba(75,139,219,0.7)" }} />
            <span className="text-xs font-semibold text-white">Execution Summary</span>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: "Total Runs Today", value: queueData.totalToday ?? 247, color: "#4B8BDB" },
              { label: "Currently Running", value: queueData.running ?? 14, color: "#4B8BDB" },
              { label: "Queued", value: queueData.queued ?? 8, color: "#f59e0b" },
              { label: "Awaiting Approval", value: queueData.waitingApproval ?? 3, color: "#8b5cf6" },
              { label: "Failed", value: queueData.failed ?? 2, color: "#ef4444" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-[10px] flex-1" style={{ color: "rgba(255,255,255,0.5)" }}>{item.label}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((item.value ?? 0) / (queueData.totalToday ?? 247)) * 100)}%`, background: item.color }} />
                </div>
                <span className="text-[10px] font-mono font-bold w-8 text-right" style={{ color: item.color }}>{item.value ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
