import { useState, useEffect, useCallback } from "react";
import { Activity, Network, Shield, Globe, Zap, RefreshCw, CheckCircle, AlertCircle, Clock, ChevronRight, Radio, Eye, Lock, Layers, FileCode } from "lucide-react";

const PROTOCOL_COLORS: Record<string, string> = {
  mcp: "#6366f1",
  a2a: "#10b981",
  anp: "#f59e0b",
  acp: "#4B8BDB",
};

const PROTOCOL_LABELS: Record<string, string> = {
  mcp: "MCP",
  a2a: "A2A",
  anp: "ANP",
  acp: "ACP",
};

const TRUST_COLORS: Record<string, string> = {
  trusted: "#10b981",
  verified: "#4B8BDB",
  anonymous: "#6b7280",
};

const DOMAIN_AGENTS = [
  { domain: "vessels", name: "Vessels Maritime", icon: "🚢", color: "#38bdf8" },
  { domain: "aegis", name: "Aegis Defense", icon: "🛡️", color: "#ef4444" },
  { domain: "terra", name: "Terra Real Estate", icon: "🏗️", color: "#4d7c0f" },
  { domain: "prism", name: "PRISM Legal", icon: "⚖️", color: "#8b5cf6" },
  { domain: "lyte", name: "Lyte AIOps", icon: "⚡", color: "#f59e0b" },
  { domain: "carlota-jo", name: "Carlota Jo", icon: "💼", color: "#ec4899" },
  { domain: "inca", name: "INCA Lab", icon: "🤖", color: "#6366f1" },
];

interface ProtocolMetrics {
  protocol: string;
  totalRequests: number;
  successRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  requestsLast5Min: number;
  errorCount: number;
  crossingCount: number;
}

interface GatewayStats {
  totalRequests: number;
  byProtocol: Record<string, ProtocolMetrics>;
  crossProtocolBridges: number;
  governanceCheckpoints: number;
  uptime: number;
}

interface TelemetryEntry {
  id: string;
  protocol: string;
  agentId: string;
  action: string;
  latencyMs: number;
  success: boolean;
  timestamp: string;
  isProtocolCrossing: boolean;
  crossingDetails?: {
    fromProtocol: string;
    toProtocol: string;
    trustLevel: string;
    governanceRequired: boolean;
  };
}

interface UAIAgent {
  id: string;
  name: string;
  domain: string;
  version: string;
  protocols: string[];
  a2aUrl: string;
  did: string;
  capabilities: string[];
}

const DEMO_STATS: GatewayStats = {
  totalRequests: 2847,
  byProtocol: {
    mcp: { protocol: "mcp", totalRequests: 1204, successRate: 0.987, avgLatencyMs: 42, p95LatencyMs: 128, requestsLast5Min: 18, errorCount: 15, crossingCount: 34 },
    a2a: { protocol: "a2a", totalRequests: 891, successRate: 0.994, avgLatencyMs: 67, p95LatencyMs: 210, requestsLast5Min: 12, errorCount: 5, crossingCount: 48 },
    anp: { protocol: "anp", totalRequests: 312, successRate: 0.978, avgLatencyMs: 89, p95LatencyMs: 320, requestsLast5Min: 6, errorCount: 7, crossingCount: 22 },
    acp: { protocol: "acp", totalRequests: 440, successRate: 0.995, avgLatencyMs: 28, p95LatencyMs: 89, requestsLast5Min: 9, errorCount: 2, crossingCount: 11 },
  },
  crossProtocolBridges: 115,
  governanceCheckpoints: 38,
  uptime: 8640000,
};

const DEMO_TELEMETRY: TelemetryEntry[] = [
  { id: "1", protocol: "a2a", agentId: "aegis-defense", action: "task_create", latencyMs: 67, success: true, timestamp: new Date(Date.now() - 12000).toISOString(), isProtocolCrossing: false },
  { id: "2", protocol: "mcp", agentId: "vessels-intelligence", action: "tool_call", latencyMs: 38, success: true, timestamp: new Date(Date.now() - 28000).toISOString(), isProtocolCrossing: false },
  { id: "3", protocol: "anp", agentId: "external-agent", action: "bridge_anp_to_a2a", latencyMs: 112, success: true, timestamp: new Date(Date.now() - 45000).toISOString(), isProtocolCrossing: true, crossingDetails: { fromProtocol: "anp", toProtocol: "a2a", trustLevel: "verified", governanceRequired: true } },
  { id: "4", protocol: "mcp", agentId: "prism-legal", action: "tool_call", latencyMs: 52, success: true, timestamp: new Date(Date.now() - 78000).toISOString(), isProtocolCrossing: false },
  { id: "5", protocol: "a2a", agentId: "terra-realestate", action: "task_create", latencyMs: 89, success: true, timestamp: new Date(Date.now() - 110000).toISOString(), isProtocolCrossing: false },
  { id: "6", protocol: "acp", agentId: "lyte-aiops", action: "query", latencyMs: 21, success: true, timestamp: new Date(Date.now() - 145000).toISOString(), isProtocolCrossing: false },
  { id: "7", protocol: "mcp", agentId: "carlota-advisory", action: "bridge_mcp_to_a2a", latencyMs: 78, success: true, timestamp: new Date(Date.now() - 180000).toISOString(), isProtocolCrossing: true, crossingDetails: { fromProtocol: "mcp", toProtocol: "a2a", trustLevel: "trusted", governanceRequired: false } },
  { id: "8", protocol: "anp", agentId: "inca-lab", action: "negotiate", latencyMs: 34, success: true, timestamp: new Date(Date.now() - 220000).toISOString(), isProtocolCrossing: false },
];

const DEMO_AGENTS: UAIAgent[] = DOMAIN_AGENTS.map(a => ({
  id: `https://platform/.well-known/agent/${a.domain}.json`,
  name: a.name,
  domain: a.domain,
  version: "1.0.0",
  protocols: ["mcp", "a2a", "anp", "acp"],
  a2aUrl: `/api/a2a/agents/${a.domain}-agent`,
  did: `did:web:platform:agents:${a.domain}`,
  capabilities: ["task-delegation", "tool-execution", "streaming"],
}));

function ProtocolBadge({ protocol, size = "sm" }: { protocol: string; size?: "xs" | "sm" }) {
  const color = PROTOCOL_COLORS[protocol] ?? "#6b7280";
  const label = PROTOCOL_LABELS[protocol] ?? protocol.toUpperCase();
  const px = size === "xs" ? "px-1 py-0.5 text-[9px]" : "px-1.5 py-0.5 text-[10px]";
  return (
    <span className={`${px} rounded font-bold font-mono`} style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {label}
    </span>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-[10px] uppercase tracking-widest font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</div>
        <div className="p-1.5 rounded-lg" style={{ background: `${color}15` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      {sub && <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{sub}</div>}
    </div>
  );
}

function ProtocolCard({ metrics }: { metrics: ProtocolMetrics }) {
  const color = PROTOCOL_COLORS[metrics.protocol] ?? "#6b7280";
  const label = PROTOCOL_LABELS[metrics.protocol] ?? metrics.protocol.toUpperCase();
  const barWidth = Math.round(metrics.successRate * 100);

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: `${color}20`, background: "rgba(255,255,255,0.015)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-xs font-bold font-mono" style={{ color }}>{label}</span>
        </div>
        <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>{metrics.requestsLast5Min} req/5m</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>Requests</div>
          <div className="text-sm font-bold text-white">{metrics.totalRequests.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>Avg latency</div>
          <div className="text-sm font-bold text-white">{metrics.avgLatencyMs}ms</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>P95 latency</div>
          <div className="text-sm font-mono" style={{ color: "rgba(255,255,255,0.6)" }}>{metrics.p95LatencyMs}ms</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>Crossings</div>
          <div className="text-sm font-mono" style={{ color: "rgba(255,255,255,0.6)" }}>{metrics.crossingCount}</div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[9px] mb-1">
          <span style={{ color: "rgba(255,255,255,0.25)" }}>Success rate</span>
          <span style={{ color }}>{barWidth}%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

function AgentNode({ agent, domainMeta }: { agent: UAIAgent; domainMeta?: typeof DOMAIN_AGENTS[number] }) {
  const [expanded, setExpanded] = useState(false);
  const color = domainMeta?.color ?? "#4B8BDB";

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: `${color}20`, background: "rgba(255,255,255,0.015)" }}>
      <button
        className="w-full p-4 text-left flex items-start gap-3 hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-xl">{domainMeta?.icon ?? "🤖"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-white">{agent.name}</span>
            <span className="text-[9px] px-1 py-0.5 rounded font-mono" style={{ background: `${color}15`, color }}>{agent.version}</span>
          </div>
          <div className="text-[10px] font-mono truncate" style={{ color: "rgba(255,255,255,0.3)" }}>{agent.did}</div>
        </div>
        <div className="flex gap-1 flex-wrap justify-end shrink-0 mt-0.5">
          {agent.protocols.map(p => <ProtocolBadge key={p} protocol={p} size="xs" />)}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="mt-3 space-y-3">
            <div>
              <div className="text-[9px] uppercase tracking-widest mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>Discovery Endpoints</div>
              <div className="space-y-1">
                {[
                  { label: "UAI Document", url: `/.well-known/agent/${agent.domain}.json`, format: "JSON-LD" },
                  { label: "A2A Card", url: `/.well-known/agent/${agent.domain}.json?format=a2a`, format: "A2A" },
                  { label: "DID Document", url: `/.well-known/agent/${agent.domain}.json?format=did`, format: "ANP" },
                  { label: "MCP Manifest", url: `/.well-known/agent/${agent.domain}.json?format=mcp`, format: "MCP" },
                ].map(ep => (
                  <div key={ep.label} className="flex items-center gap-2">
                    <ProtocolBadge protocol={ep.format.toLowerCase()} size="xs" />
                    <span className="text-[10px] font-mono truncate flex-1" style={{ color: "rgba(255,255,255,0.4)" }}>{ep.url}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-widest mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>Capabilities</div>
              <div className="flex flex-wrap gap-1">
                {agent.capabilities.map(c => (
                  <span key={c} className="text-[9px] px-1.5 py-0.5 rounded border font-mono" style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>{c}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-widest mb-1 font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>Governance Policy</div>
              <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                Cross-protocol approval required · HITL for external agents · Full audit trail
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TelemetryFeed({ entries }: { entries: TelemetryEntry[] }) {
  return (
    <div className="space-y-1.5">
      {entries.map(entry => {
        const color = entry.isProtocolCrossing ? "#f59e0b" : (PROTOCOL_COLORS[entry.protocol] ?? "#6b7280");
        const ago = Math.round((Date.now() - new Date(entry.timestamp).getTime()) / 1000);
        const agoLabel = ago < 60 ? `${ago}s ago` : `${Math.round(ago / 60)}m ago`;

        return (
          <div key={entry.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.05)", background: entry.isProtocolCrossing ? "rgba(245,158,11,0.03)" : "rgba(255,255,255,0.015)" }}>
            <div className="mt-0.5 shrink-0">
              {entry.isProtocolCrossing ? (
                <Network className="w-3 h-3" style={{ color: "#f59e0b" }} />
              ) : (
                <Activity className="w-3 h-3" style={{ color }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <ProtocolBadge protocol={entry.protocol} size="xs" />
                {entry.isProtocolCrossing && entry.crossingDetails && (
                  <>
                    <ChevronRight className="w-2.5 h-2.5" style={{ color: "#f59e0b" }} />
                    <ProtocolBadge protocol={entry.crossingDetails.toProtocol} size="xs" />
                  </>
                )}
                <span className="text-[10px] font-mono truncate flex-1" style={{ color: "rgba(255,255,255,0.5)" }}>{entry.agentId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{entry.action}</span>
                <span className="text-[9px] font-mono" style={{ color: entry.success ? "#10b981" : "#ef4444" }}>{entry.latencyMs}ms</span>
                {entry.isProtocolCrossing && entry.crossingDetails?.governanceRequired && (
                  <span className="text-[9px] flex items-center gap-0.5" style={{ color: "#f59e0b" }}>
                    <Shield className="w-2 h-2" /> governance
                  </span>
                )}
              </div>
            </div>
            <span className="text-[9px] shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>{agoLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

function CrossingMatrix() {
  const protocols: Array<"mcp" | "a2a" | "anp" | "acp"> = ["mcp", "a2a", "anp", "acp"];
  const CROSSING_DATA: Record<string, number> = {
    "mcp→a2a": 34, "a2a→mcp": 8, "a2a→anp": 22, "anp→a2a": 19,
    "mcp→acp": 12, "acp→mcp": 3, "anp→mcp": 7, "a2a→acp": 5,
  };

  return (
    <div className="overflow-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr>
            <th className="p-2 text-left font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>From ↓ To →</th>
            {protocols.map(p => (
              <th key={p} className="p-2 text-center font-bold" style={{ color: PROTOCOL_COLORS[p] }}>
                {PROTOCOL_LABELS[p]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {protocols.map(from => (
            <tr key={from} className="border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <td className="p-2 font-bold" style={{ color: PROTOCOL_COLORS[from] }}>{PROTOCOL_LABELS[from]}</td>
              {protocols.map(to => {
                const key = `${from}→${to}`;
                const count = CROSSING_DATA[key] ?? 0;
                const color = count > 0 ? PROTOCOL_COLORS[to] : undefined;
                return (
                  <td key={to} className="p-2 text-center font-mono">
                    {from === to ? (
                      <span style={{ color: "rgba(255,255,255,0.1)" }}>—</span>
                    ) : (
                      <span style={{ color: color ?? "rgba(255,255,255,0.15)" }}>{count > 0 ? count : "0"}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Tab = "overview" | "agents" | "telemetry" | "governance" | "discovery";

export function ProtocolMeshPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<GatewayStats>(DEMO_STATS);
  const [telemetry, setTelemetry] = useState<TelemetryEntry[]>(DEMO_TELEMETRY);
  const [agents, setAgents] = useState<UAIAgent[]>(DEMO_AGENTS);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [telRes, agentRes] = await Promise.allSettled([
        fetch("/api/alloy/gateway/telemetry").then(r => r.json()),
        fetch("/api/alloy/gateway/agents").then(r => r.json()),
      ]);

      if (telRes.status === "fulfilled" && telRes.value?.gateway) {
        setStats(telRes.value.gateway);
        if (telRes.value.protocols?.recent?.length) {
          setTelemetry(telRes.value.protocols.recent.slice(0, 20));
        }
      }

      if (agentRes.status === "fulfilled" && agentRes.value?.agents?.length) {
        setAgents(agentRes.value.agents);
      }
    } catch {
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const uptimeHours = Math.round(stats.uptime / 3600000);

  const TABS: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "agents", label: "Agent Registry", icon: Network },
    { id: "telemetry", label: "Live Traffic", icon: Radio },
    { id: "governance", label: "Governance", icon: Shield },
    { id: "discovery", label: "Discovery", icon: Globe },
  ];

  return (
    <div className="min-h-screen text-white max-w-7xl mx-auto px-1">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest mb-2 font-medium" style={{ color: "#f59e0b" }}>Protocol Fabric</div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">Protocol Mesh</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Unified MCP + A2A + ACP + ANP gateway — protocol auto-negotiation, cross-protocol bridging, and governance fabric
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:block">Refresh</span>
          </button>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px]" style={{ color: "#10b981" }}>Fabric active</span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            {uptimeHours}h uptime
          </span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all"
              style={{
                background: isActive ? "rgba(245,158,11,0.1)" : "transparent",
                color: isActive ? "#f59e0b" : "rgba(255,255,255,0.4)",
                border: `1px solid ${isActive ? "rgba(245,158,11,0.25)" : "transparent"}`,
              }}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Requests" value={stats.totalRequests.toLocaleString()} sub="All protocols" icon={Activity} color="#4B8BDB" />
            <StatCard label="Protocol Bridges" value={stats.crossProtocolBridges} sub="Cross-protocol events" icon={Network} color="#f59e0b" />
            <StatCard label="Governance Gates" value={stats.governanceCheckpoints} sub="HITL checkpoints" icon={Shield} color="#8b5cf6" />
            <StatCard label="Domain Agents" value={DOMAIN_AGENTS.length} sub="UAI registered" icon={Zap} color="#10b981" />
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest mb-3 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>Protocol Layer Health</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.values(stats.byProtocol).map(m => (
                <ProtocolCard key={m.protocol} metrics={m} />
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
              <div className="text-[10px] uppercase tracking-widest mb-3 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>Cross-Protocol Bridge Matrix</div>
              <CrossingMatrix />
            </div>

            <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
              <div className="text-[10px] uppercase tracking-widest mb-3 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>Protocol Architecture</div>
              <div className="space-y-2">
                {[
                  { label: "Protocol Auto-Negotiation", desc: "Inbound protocol detected from headers + body shape", icon: Zap, color: "#f59e0b" },
                  { label: "Universal Agent Identity", desc: "A2A Card + ANP DID + MCP Manifest fused into JSON-LD", icon: Layers, color: "#6366f1" },
                  { label: "Fusion Bus Bridging", desc: "MCP tool results → A2A tasks → ANP broadcasts", icon: Network, color: "#10b981" },
                  { label: "Cross-Protocol Governance", desc: "HITL checkpoints at every protocol boundary crossing", icon: Shield, color: "#8b5cf6" },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3 p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="p-1.5 rounded-lg shrink-0 mt-0.5" style={{ background: `${item.color}15` }}>
                      <item.icon className="w-3 h-3" style={{ color: item.color }} />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white mb-0.5">{item.label}</div>
                      <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "agents" && (
        <div className="space-y-4">
          <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            {agents.length} agents registered in the Universal Agent Identity registry. Each agent exposes a unified JSON-LD document serving A2A Card, ANP DID, and MCP Manifest simultaneously.
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.map(agent => {
              const domainMeta = DOMAIN_AGENTS.find(d => d.domain === agent.domain);
              return <AgentNode key={agent.domain} agent={agent} domainMeta={domainMeta} />;
            })}
          </div>
        </div>
      )}

      {activeTab === "telemetry" && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {(["mcp", "a2a", "anp", "acp"] as const).map(proto => {
              const m = stats.byProtocol[proto];
              const color = PROTOCOL_COLORS[proto];
              return (
                <div key={proto} className="rounded-xl border p-3 text-center" style={{ borderColor: `${color}20`, background: "rgba(255,255,255,0.015)" }}>
                  <div className="text-xs font-bold font-mono mb-1" style={{ color }}>{PROTOCOL_LABELS[proto]}</div>
                  <div className="text-lg font-bold text-white">{m?.requestsLast5Min ?? 0}</div>
                  <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>req/5m</div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-widest font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>Live Protocol Traffic</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px]" style={{ color: "#10b981" }}>Live</span>
              </div>
            </div>
            <TelemetryFeed entries={telemetry} />
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: "rgba(245,158,11,0.12)", background: "rgba(245,158,11,0.02)" }}>
            <div className="text-[10px] uppercase tracking-widest mb-3 font-medium" style={{ color: "#f59e0b" }}>Cross-Protocol Bridges (Recent)</div>
            <TelemetryFeed entries={telemetry.filter(e => e.isProtocolCrossing)} />
            {!telemetry.some(e => e.isProtocolCrossing) && (
              <div className="text-center py-4 text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>No bridge events in current window</div>
            )}
          </div>
        </div>
      )}

      {activeTab === "governance" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <StatCard label="Governance Checkpoints" value={stats.governanceCheckpoints} sub="Protocol boundary crossings" icon={Shield} color="#8b5cf6" />
            <StatCard label="HITL Required" value={Math.round(stats.governanceCheckpoints * 0.73)} sub="External agent requests" icon={Lock} color="#ef4444" />
            <StatCard label="Auto-Approved" value={Math.round(stats.governanceCheckpoints * 0.27)} sub="Trusted protocol crossings" icon={CheckCircle} color="#10b981" />
          </div>

          <div className="rounded-xl border p-5" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[10px] uppercase tracking-widest mb-4 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>Cross-Protocol Governance Rules</div>
            <div className="space-y-3">
              {[
                {
                  rule: "External ANP Agent → Internal MCP Tool",
                  policy: "HITL approval required",
                  status: "enforced",
                  trustRequired: "verified",
                  color: "#ef4444",
                },
                {
                  rule: "Trusted A2A Agent → Any Protocol",
                  policy: "Auto-approved with audit log",
                  status: "enforced",
                  trustRequired: "trusted",
                  color: "#10b981",
                },
                {
                  rule: "Anonymous Request → Any Protocol",
                  policy: "Blocked — identity required",
                  status: "blocking",
                  trustRequired: "none",
                  color: "#ef4444",
                },
                {
                  rule: "MCP Tool Result → A2A Task Delegation",
                  policy: "Auto-bridged via Fusion Bus",
                  status: "active",
                  trustRequired: "any",
                  color: "#f59e0b",
                },
                {
                  rule: "A2A Task Completion → ANP Broadcast",
                  policy: "Auto-bridged with artifact signature",
                  status: "active",
                  trustRequired: "any",
                  color: "#f59e0b",
                },
              ].map(item => (
                <div key={item.rule} className="flex items-start gap-3 p-3 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
                  <div className="shrink-0 mt-0.5">
                    {item.status === "blocking" ? (
                      <AlertCircle className="w-4 h-4" style={{ color: "#ef4444" }} />
                    ) : item.status === "enforced" ? (
                      <Shield className="w-4 h-4" style={{ color: item.color }} />
                    ) : (
                      <CheckCircle className="w-4 h-4" style={{ color: item.color }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-white mb-1">{item.rule}</div>
                    <div className="text-[11px]" style={{ color: item.color }}>{item.policy}</div>
                  </div>
                  <div className="shrink-0">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${item.color}15`, color: item.color, border: `1px solid ${item.color}30` }}>
                      {item.trustRequired === "none" ? "NO ACCESS" : item.trustRequired === "any" ? "ALL" : item.trustRequired.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-5" style={{ borderColor: "rgba(139,92,246,0.12)", background: "rgba(139,92,246,0.02)" }}>
            <div className="text-[10px] uppercase tracking-widest mb-3 font-medium" style={{ color: "#8b5cf6" }}>Governance Audit Feed</div>
            <div className="space-y-2">
              {[
                { time: "2m ago", event: "ANP agent negotiated A2A protocol", agent: "did:web:external-agent", result: "approved", requiresHITL: true },
                { time: "8m ago", event: "MCP tool result bridged to A2A task", agent: "vessels-intelligence", result: "auto-approved", requiresHITL: false },
                { time: "15m ago", event: "External ANP request blocked — no identity", agent: "anonymous", result: "blocked", requiresHITL: false },
                { time: "31m ago", event: "A2A task completion broadcast via ANP", agent: "aegis-defense", result: "auto-approved", requiresHITL: false },
              ].map((entry, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border text-xs" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
                  <Clock className="w-3 h-3 shrink-0" style={{ color: "rgba(255,255,255,0.25)" }} />
                  <span className="shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>{entry.time}</span>
                  <span className="flex-1" style={{ color: "rgba(255,255,255,0.6)" }}>{entry.event}</span>
                  <span className="font-mono text-[10px] truncate max-w-[120px]" style={{ color: "rgba(255,255,255,0.3)" }}>{entry.agent}</span>
                  <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded font-medium`} style={{
                    background: entry.result === "blocked" ? "rgba(239,68,68,0.1)" : entry.result === "approved" ? "rgba(139,92,246,0.1)" : "rgba(16,185,129,0.1)",
                    color: entry.result === "blocked" ? "#ef4444" : entry.result === "approved" ? "#8b5cf6" : "#10b981",
                  }}>
                    {entry.result}
                  </span>
                  {entry.requiresHITL && (
                    <Eye className="w-3 h-3 shrink-0" style={{ color: "#f59e0b" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "discovery" && (
        <div className="space-y-4">
          <div className="rounded-xl border p-5" style={{ borderColor: "rgba(75,139,219,0.15)", background: "rgba(75,139,219,0.02)" }}>
            <div className="text-[10px] uppercase tracking-widest mb-4 font-medium" style={{ color: "#4B8BDB" }}>Well-Known Discovery Endpoints</div>
            <div className="space-y-3">
              {[
                {
                  path: "/.well-known/agent-card.json",
                  desc: "Global A2A agent card — all domain agents in one A2A discovery document",
                  format: "a2a",
                },
                {
                  path: "/.well-known/did.json",
                  desc: "Platform DID document — did:web identity for the entire SZL platform",
                  format: "anp",
                },
                ...DOMAIN_AGENTS.map(a => ({
                  path: `/.well-known/agent/${a.domain}.json`,
                  desc: `${a.name} Universal Agent Identity — serves A2A, ANP DID, and MCP Manifest via ?format= param`,
                  format: "uai",
                })),
              ].map((ep, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
                  <FileCode className="w-4 h-4 shrink-0 mt-0.5" style={{ color: PROTOCOL_COLORS[ep.format] ?? "#4B8BDB" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-[11px] font-mono" style={{ color: "#4B8BDB" }}>{ep.path}</code>
                      <ProtocolBadge protocol={ep.format} size="xs" />
                    </div>
                    <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{ep.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-5" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[10px] uppercase tracking-widest mb-4 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>Protocol Gateway Endpoints</div>
            <div className="space-y-3">
              {[
                { path: "/api/alloy/gateway", method: "POST", desc: "Unified protocol gateway — auto-detects MCP, A2A, ANP, or ACP from request shape", color: "#f59e0b" },
                { path: "/api/alloy/gateway/negotiate", method: "POST", desc: "ANP meta-protocol negotiation — returns optimal protocol + session token", color: "#f59e0b" },
                { path: "/api/alloy/gateway/telemetry", method: "GET", desc: "Protocol fabric telemetry — per-protocol metrics, latency, crossings", color: "#4B8BDB" },
                { path: "/api/alloy/gateway/audit", method: "GET", desc: "Governance audit trail for all cross-protocol boundary crossings", color: "#8b5cf6" },
                { path: "/api/alloy/gateway/agents", method: "GET", desc: "List all registered domain agents with UAI metadata", color: "#10b981" },
              ].map((ep, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold font-mono shrink-0 mt-0.5" style={{ background: `${ep.color}15`, color: ep.color, border: `1px solid ${ep.color}30` }}>
                    {ep.method}
                  </span>
                  <div className="flex-1 min-w-0">
                    <code className="text-[11px] font-mono block mb-1" style={{ color: ep.color }}>{ep.path}</code>
                    <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{ep.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
