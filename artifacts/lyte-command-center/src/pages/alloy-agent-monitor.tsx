import { useState } from "react";
import {
  AlertTriangle, RefreshCw, Play, Pause, Radio,
} from "lucide-react";
import { EnvironmentLabel } from "@szl-holdings/shared-ui";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e" } as const;
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" } as const;
const TEXT = {
  primary: "rgba(255,255,255,0.88)",
  secondary: "rgba(255,255,255,0.55)",
  tertiary: "rgba(255,255,255,0.28)",
  muted: "rgba(255,255,255,0.14)",
} as const;
const ACCENT = "#d4a054";

type AgentStatus = "running" | "idle" | "degraded" | "stopped";

interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  type: string;
  uptime: string;
  runsToday: number;
  avgDuration: string;
  lastRun: string;
  successRate: number;
  findings: number;
  pendingActions: number;
  model: string;
  tokens: number;
  cost: string;
  alert?: string;
}

interface RunEntry {
  time: string;
  outcome: "ok" | "warn";
  duration: string;
  findings: number;
}

interface MetricRow {
  label: string;
  value: string;
  color: string;
}

const MOCK_AGENTS: Agent[] = [
  {
    id: "lyte-autonomous", name: "Lyte Autonomous Agent", status: "running",
    type: "Business Observability", uptime: "14d 6h", runsToday: 48, avgDuration: "1.4s",
    lastRun: "32s ago", successRate: 97.8, findings: 3, pendingActions: 1,
    model: "gpt-4o", tokens: 142800, cost: "$0.43",
  },
  {
    id: "signal-processor", name: "Signal Processor", status: "running",
    type: "Signal Intelligence", uptime: "14d 6h", runsToday: 312, avgDuration: "0.3s",
    lastRun: "4s ago", successRate: 99.2, findings: 18, pendingActions: 0,
    model: "internal", tokens: 0, cost: "$0.00",
  },
  {
    id: "ownership-validator", name: "Ownership Validator", status: "idle",
    type: "Ownership Intelligence", uptime: "14d 6h", runsToday: 24, avgDuration: "2.1s",
    lastRun: "5m ago", successRate: 96.1, findings: 7, pendingActions: 2,
    model: "gpt-4o-mini", tokens: 38400, cost: "$0.08",
  },
  {
    id: "correlation-engine", name: "Correlation Engine", status: "running",
    type: "Cross-Signal Analysis", uptime: "14d 6h", runsToday: 204, avgDuration: "0.8s",
    lastRun: "12s ago", successRate: 98.5, findings: 22, pendingActions: 0,
    model: "internal", tokens: 0, cost: "$0.00",
  },
  {
    id: "risk-scorer", name: "Risk Scorer", status: "running",
    type: "Risk Assessment", uptime: "14d 6h", runsToday: 96, avgDuration: "0.6s",
    lastRun: "28s ago", successRate: 99.8, findings: 5, pendingActions: 0,
    model: "internal", tokens: 0, cost: "$0.00",
  },
  {
    id: "action-router", name: "Action Router", status: "degraded",
    type: "Action Dispatch", uptime: "2h 14m", runsToday: 31, avgDuration: "1.8s",
    lastRun: "2m ago", successRate: 82.3, findings: 0, pendingActions: 4,
    model: "gpt-4o", tokens: 24100, cost: "$0.07",
    alert: "Elevated failure rate — upstream webhook timeout",
  },
];

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; dot: string }> = {
  running: { label: "Running", color: "#22c55e", dot: "#22c55e" },
  idle: { label: "Idle", color: "#7ba3d4", dot: "#7ba3d4" },
  degraded: { label: "Degraded", color: "#f97316", dot: "#f97316" },
  stopped: { label: "Stopped", color: "#6b7280", dot: "#6b7280" },
};

function AgentRow({ agent, selected, onClick }: { agent: Agent; selected: boolean; onClick: () => void }) {
  const status = STATUS_CONFIG[agent.status];
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3.5 transition-all hover:bg-white/[0.02]"
      style={{
        borderBottom: `1px solid ${BORDER.subtle}`,
        background: selected ? "rgba(212,160,84,0.04)" : undefined,
        borderLeft: selected ? `2px solid ${ACCENT}` : "2px solid transparent",
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-2 h-2 rounded-full shrink-0 animate-pulse"
            style={{ background: status.dot, animationPlayState: agent.status === "running" ? "running" : "paused" }}
          />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold truncate" style={{ color: TEXT.primary }}>{agent.name}</p>
            <p className="text-[10px]" style={{ color: TEXT.tertiary }}>{agent.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-[11px] font-mono" style={{ color: ACCENT }}>{agent.successRate}%</p>
            <p className="text-[10px]" style={{ color: TEXT.muted }}>success</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-mono" style={{ color: TEXT.secondary }}>{agent.runsToday}</p>
            <p className="text-[10px]" style={{ color: TEXT.muted }}>runs today</p>
          </div>
          <div
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: `${status.color}18`, color: status.color }}
          >
            {status.label}
          </div>
        </div>
      </div>
      {agent.alert && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px]" style={{ color: "#f97316" }}>
          <AlertTriangle className="w-3 h-3 shrink-0" />
          {agent.alert}
        </div>
      )}
    </button>
  );
}

function AgentDetail({ agent }: { agent: Agent }) {
  const status = STATUS_CONFIG[agent.status];
  const metrics: MetricRow[] = [
    { label: "Status", value: agent.status, color: status.color },
    { label: "Uptime", value: agent.uptime, color: TEXT.secondary },
    { label: "Runs today", value: String(agent.runsToday), color: TEXT.secondary },
    { label: "Avg duration", value: agent.avgDuration, color: TEXT.secondary },
    { label: "Last run", value: agent.lastRun, color: TEXT.secondary },
    { label: "Success rate", value: `${agent.successRate}%`, color: agent.successRate > 95 ? "#22c55e" : "#f97316" },
    { label: "Active findings", value: String(agent.findings), color: agent.findings > 0 ? ACCENT : TEXT.secondary },
    { label: "Pending actions", value: String(agent.pendingActions), color: agent.pendingActions > 0 ? "#f97316" : TEXT.secondary },
  ];

  const recentRuns: RunEntry[] = [
    { time: "2s ago", outcome: "ok", duration: "1.3s", findings: 0 },
    { time: "32s ago", outcome: "ok", duration: "1.4s", findings: 1 },
    { time: "1m ago", outcome: "ok", duration: "1.5s", findings: 0 },
    { time: "2m ago", outcome: "warn", duration: "2.8s", findings: 2 },
    { time: "3m ago", outcome: "ok", duration: "1.2s", findings: 0 },
  ];

  const modelConfig: Array<{ label: string; value: string }> = [
    { label: "Model", value: agent.model },
    { label: "Tokens today", value: agent.tokens > 0 ? agent.tokens.toLocaleString() : "N/A (internal)" },
    { label: "Cost today", value: agent.cost },
    { label: "Temperature", value: "0.2" },
    { label: "Max context", value: "128k" },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ background: BG.surface }}>
      <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold mb-0.5" style={{ color: TEXT.primary }}>{agent.name}</p>
            <p className="text-[11px]" style={{ color: TEXT.tertiary }}>{agent.type} · ID: {agent.id}</p>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-lg px-3 py-1.5 text-[11px] font-medium flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              style={{ background: "rgba(255,255,255,0.05)", color: TEXT.secondary }}
            >
              <RefreshCw className="w-3 h-3" />Restart
            </button>
            {agent.status === "running" ? (
              <button
                className="rounded-lg px-3 py-1.5 text-[11px] font-medium flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                style={{ background: "rgba(249,115,22,0.12)", color: "#f97316" }}
              >
                <Pause className="w-3 h-3" />Pause
              </button>
            ) : (
              <button
                className="rounded-lg px-3 py-1.5 text-[11px] font-medium flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                style={{ background: `${ACCENT}18`, color: ACCENT }}
              >
                <Play className="w-3 h-3" />Start
              </button>
            )}
          </div>
        </div>
      </div>

      {agent.alert && (
        <div className="mx-4 mt-4 rounded-lg px-4 py-3 flex items-start gap-2.5" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#f97316" }} />
          <p className="text-[11px] leading-relaxed" style={{ color: "#f97316" }}>{agent.alert}</p>
        </div>
      )}

      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-md px-3 py-2.5" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
            <p className="text-[10px] mb-1" style={{ color: TEXT.muted }}>{m.label}</p>
            <p className="text-[12px] font-semibold font-mono" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4">
        <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: TEXT.muted }}>Model Configuration</p>
        <div className="rounded-md px-4 py-3 space-y-2" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
          {modelConfig.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-[11px]" style={{ color: TEXT.tertiary }}>{row.label}</span>
              <span className="text-[11px] font-mono" style={{ color: TEXT.secondary }}>{row.value}</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] uppercase tracking-widest mb-3 mt-4" style={{ color: TEXT.muted }}>Recent Run Log</p>
        <div className="space-y-1.5">
          {recentRuns.map((run, i) => (
            <div key={i} className="flex items-center justify-between rounded px-3 py-2" style={{ background: BG.elevated }}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: run.outcome === "ok" ? "#22c55e" : "#f97316" }} />
                <span className="text-[11px] font-mono" style={{ color: TEXT.tertiary }}>{run.time}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-mono" style={{ color: TEXT.secondary }}>{run.duration}</span>
                <span className="text-[11px]" style={{ color: run.findings > 0 ? ACCENT : TEXT.muted }}>{run.findings} findings</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type FilterValue = "all" | AgentStatus;

export default function AlloyAgentMonitorPage() {
  const [selected, setSelected] = useState<string>("lyte-autonomous");
  const [filter, setFilter] = useState<FilterValue>("all");
  const selectedAgent = MOCK_AGENTS.find((a) => a.id === selected);

  const statusCounts: Record<AgentStatus, number> = {
    running: MOCK_AGENTS.filter((a) => a.status === "running").length,
    idle: MOCK_AGENTS.filter((a) => a.status === "idle").length,
    degraded: MOCK_AGENTS.filter((a) => a.status === "degraded").length,
    stopped: MOCK_AGENTS.filter((a) => a.status === "stopped").length,
  };

  const filtered = filter === "all" ? MOCK_AGENTS : MOCK_AGENTS.filter((a) => a.status === filter);
  const filterOptions: FilterValue[] = ["all", "running", "idle", "degraded"];

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: BG.page }}>
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center gap-2.5">
          <Radio className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="text-[13px] font-semibold" style={{ color: TEXT.primary }}>Agent Monitor</span>
          <EnvironmentLabel environment="demo" />
        </div>
        <div className="flex gap-2">
          {filterOptions.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-full px-2.5 py-1 text-[10px] font-medium capitalize transition-all"
              style={{
                background: filter === f ? `${ACCENT}18` : "rgba(255,255,255,0.04)",
                color: filter === f ? ACCENT : TEXT.tertiary,
                border: `1px solid ${filter === f ? `${ACCENT}30` : "transparent"}`,
              }}
            >
              {f}{f !== "all" && ` (${statusCounts[f as AgentStatus]})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[320px_1fr] overflow-hidden">
        <div className="overflow-y-auto" style={{ borderRight: `1px solid ${BORDER.subtle}` }}>
          <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${BORDER.subtle}`, background: BG.elevated }}>
            <div className="flex gap-4 text-[11px]">
              <span style={{ color: "#22c55e" }}>{statusCounts.running} running</span>
              <span style={{ color: "#7ba3d4" }}>{statusCounts.idle} idle</span>
              {statusCounts.degraded > 0 && <span style={{ color: "#f97316" }}>{statusCounts.degraded} degraded</span>}
            </div>
          </div>
          {filtered.map((agent) => (
            <AgentRow
              key={agent.id}
              agent={agent}
              selected={selected === agent.id}
              onClick={() => setSelected(agent.id)}
            />
          ))}
        </div>
        {selectedAgent && <AgentDetail agent={selectedAgent} />}
      </div>
    </div>
  );
}
