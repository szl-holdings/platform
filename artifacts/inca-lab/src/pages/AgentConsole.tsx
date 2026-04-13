import { useState, useEffect } from "react";
import { Activity, Cpu, DollarSign, Clock, CheckCircle, XCircle, RefreshCw, Zap, Brain, BarChart3, MessageSquare, Shield, Radio } from "lucide-react";
import { AIInsightCard } from "@szl-holdings/shared-ui/ai-insight-card";
import { useAgentStatus, useAgentTraces, type AgentTrace } from "@szl-holdings/shared-ui/use-ai-agent";

interface AgentStatus {
  id: string;
  name: string;
  domain: string;
  status: "active" | "idle" | "error" | "paused";
  model: string;
  tokensUsed: number;
  costLast24h: number;
  successRate: number;
  avgLatency: number;
  lastAction: string;
  lastActionTime: string;
  decisionsToday: number;
}

const AGENTS: AgentStatus[] = [
  { id: "sentinel-01", name: "Sentinel", domain: "Maritime", status: "active", model: "GPT-4o", tokensUsed: 142_800, costLast24h: 4.28, successRate: 97.3, avgLatency: 1240, lastAction: "Flagged MV Aurora Star — AIS gap in Hormuz corridor", lastActionTime: "2 min ago", decisionsToday: 47 },
  { id: "watchdog-01", name: "Watchdog", domain: "Security", status: "active", model: "Claude 3.5", tokensUsed: 98_400, costLast24h: 3.15, successRate: 99.1, avgLatency: 890, lastAction: "Correlated APT-29 indicators across 3 endpoints", lastActionTime: "5 min ago", decisionsToday: 31 },
  { id: "docminer-01", name: "DocMiner", domain: "Legal", status: "active", model: "GPT-4o-mini", tokensUsed: 256_000, costLast24h: 2.56, successRate: 94.8, avgLatency: 2100, lastAction: "Extracted 14 deadlines from Apex Mutual filing", lastActionTime: "8 min ago", decisionsToday: 23 },
  { id: "prospector-01", name: "Prospector", domain: "Real Estate", status: "idle", model: "Gemini 1.5", tokensUsed: 67_200, costLast24h: 1.34, successRate: 96.2, avgLatency: 1580, lastAction: "Scored 8 distressed properties in Miami-Dade", lastActionTime: "22 min ago", decisionsToday: 12 },
  { id: "nexus-fuse", name: "Nexus Fuse", domain: "Cross-Domain", status: "active", model: "GPT-4o", tokensUsed: 184_600, costLast24h: 5.54, successRate: 98.7, avgLatency: 1840, lastAction: "Linked maritime sanctions flag to legal counterparty", lastActionTime: "1 min ago", decisionsToday: 18 },
  { id: "compliance-bot", name: "Compliance Guard", domain: "Governance", status: "active", model: "Claude 3.5", tokensUsed: 45_200, costLast24h: 1.45, successRate: 99.8, avgLatency: 640, lastAction: "Validated HITL gate on Watchdog escalation", lastActionTime: "3 min ago", decisionsToday: 56 },
  { id: "forecast-01", name: "Oracle", domain: "Predictive", status: "paused", model: "Mixtral 8x22B", tokensUsed: 34_800, costLast24h: 0.70, successRate: 91.4, avgLatency: 3200, lastAction: "Generated 72h risk forecast for Gulf corridor", lastActionTime: "1 hr ago", decisionsToday: 4 },
  { id: "crew-lead", name: "Crew Orchestrator", domain: "Meta", status: "active", model: "GPT-4o", tokensUsed: 52_400, costLast24h: 1.57, successRate: 99.5, avgLatency: 320, lastAction: "Routed maritime anomaly to Sentinel + Nexus Fuse crew", lastActionTime: "30 sec ago", decisionsToday: 89 },
];

const DECISION_LOG = [
  { time: "17:47:42", agent: "Crew Orchestrator", action: "ROUTE", detail: "Maritime anomaly signal → assigned to [Sentinel, Nexus Fuse] crew", approved: true },
  { time: "17:47:05", agent: "Nexus Fuse", action: "CORRELATE", detail: "Linked MV Aurora Star owner to Apex Mutual legal counterparty — confidence 0.87", approved: true },
  { time: "17:46:31", agent: "Compliance Guard", action: "GATE", detail: "Validated HITL approval on Watchdog → IR escalation (SOC ticket #4812)", approved: true },
  { time: "17:45:18", agent: "Sentinel", action: "FLAG", detail: "AIS gap detected: MV Aurora Star, 4.2h dark window, Strait of Hormuz", approved: true },
  { time: "17:44:02", agent: "DocMiner", action: "EXTRACT", detail: "14 deadlines parsed from Apex Mutual Q2 filing (3 critical)", approved: true },
  { time: "17:42:55", agent: "Watchdog", action: "DETECT", detail: "APT-29 TTPs matched on endpoint cluster — lateral movement indicators", approved: true },
  { time: "17:41:30", agent: "Prospector", action: "SCORE", detail: "Miami-Dade distress batch scored: 3 properties >85 likelihood", approved: true },
  { time: "17:39:12", agent: "Oracle", action: "FORECAST", detail: "Gulf corridor: 72h risk elevated (sanctions enforcement + naval activity)", approved: false },
];

function StatusBadge({ status }: { status: AgentStatus["status"] }) {
  const colors = { active: "#22c55e", idle: "#6b7280", error: "#ef4444", paused: "#f59e0b" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 8px", borderRadius: "4px", fontSize: "0.625rem",
      fontFamily: "monospace", fontWeight: 600, textTransform: "uppercase",
      background: `${colors[status]}15`, color: colors[status], letterSpacing: "0.06em",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: colors[status], display: "inline-block", boxShadow: status === "active" ? `0 0 6px ${colors[status]}55` : "none" }} />
      {status}
    </span>
  );
}

export default function AgentConsolePage() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const totalTokens = AGENTS.reduce((a, b) => a + b.tokensUsed, 0);
  const totalCost = AGENTS.reduce((a, b) => a + b.costLast24h, 0);
  const totalDecisions = AGENTS.reduce((a, b) => a + b.decisionsToday, 0);
  const avgSuccess = AGENTS.reduce((a, b) => a + b.successRate, 0) / AGENTS.length;

  const liveStatus = useAgentStatus(30_000);
  const { traces, isLoading: tracesLoading, refresh: refreshTraces } = useAgentTraces(15, 30_000);

  const isLive = liveStatus.totalAgents > 0;

  return (
    <div style={{ padding: "24px 32px", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <Brain size={20} style={{ color: "#a78bfa" }} />
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f0f0f0", margin: 0 }}>Agent Console</h1>
            <span style={{ fontSize: "0.625rem", fontFamily: "monospace", color: "#4b5563", background: "hsla(0,0%,100%,0.04)", padding: "2px 8px", borderRadius: "4px" }}>
              INCA Lab v3.0
            </span>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "#6b7280", margin: 0 }}>
            Unified health, cost, and decision oversight for all Nuro Mesh agents.
          </p>
        </div>
        <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#4b5563" }}>
          {now.toISOString().replace("T", " ").slice(0, 19)} UTC
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { icon: Cpu, label: "Active Agents", value: `${AGENTS.filter(a => a.status === "active").length}/${AGENTS.length}`, color: "#22c55e" },
          { icon: MessageSquare, label: "Tokens (24h)", value: `${(totalTokens / 1000).toFixed(0)}K`, color: "#22d3ee" },
          { icon: DollarSign, label: "Cost (24h)", value: `$${totalCost.toFixed(2)}`, color: "#f59e0b" },
          { icon: Zap, label: "Decisions Today", value: String(totalDecisions), color: "#a78bfa" },
          { icon: Shield, label: "Avg Success", value: `${avgSuccess.toFixed(1)}%`, color: "#22c55e" },
        ].map(s => (
          <div key={s.label} style={{ background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px", padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <s.icon size={13} style={{ color: s.color }} />
              <span style={{ fontSize: "0.625rem", fontFamily: "monospace", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</span>
            </div>
            <div style={{ fontSize: "1.375rem", fontWeight: 700, fontFamily: "monospace", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <AIInsightCard domain="inca" accentColor="hsl(160, 70%, 50%)" maxInsights={2} compact title="AI Research Signals" />
      </div>

      {/* Live Agent Traces — Nuro Mesh */}
      <div style={{ marginBottom: "20px", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid hsla(0,0%,100%,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Radio size={13} style={{ color: "#a78bfa" }} />
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#e5e7eb" }}>Live Agent Traces</span>
            {isLive && (
              <span style={{ fontSize: "0.6rem", fontFamily: "monospace", color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", padding: "1px 6px", borderRadius: "4px" }}>
                LIVE · {liveStatus.totalAgents} agents · {(liveStatus.avgSuccessRate * 100).toFixed(0)}% success · avg {liveStatus.avgLatencyMs}ms
              </span>
            )}
            {!isLive && (
              <span style={{ fontSize: "0.6rem", fontFamily: "monospace", color: "#6b7280", background: "hsla(0,0%,100%,0.04)", padding: "1px 6px", borderRadius: "4px" }}>
                DEGRADED — API unavailable
              </span>
            )}
          </div>
          <button onClick={refreshTraces} style={{ fontSize: "0.65rem", color: "#6b7280", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
            <RefreshCw size={10} /> Refresh
          </button>
        </div>
        <div style={{ overflow: "auto", maxHeight: "180px" }}>
          {tracesLoading ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#6b7280", fontSize: "0.75rem" }}>Connecting to Nuro Mesh…</div>
          ) : traces.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#4b5563", fontSize: "0.75rem" }}>No recent traces — agent network is idle or API is offline. Copilot and decision logs are still available.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid hsla(0,0%,100%,0.05)" }}>
                  {["Agent", "Status", "Latency", "Started"].map(h => (
                    <th key={h} style={{ padding: "6px 14px", textAlign: "left", fontSize: "0.625rem", fontFamily: "monospace", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {traces.map((tr: AgentTrace, i: number) => (
                  <tr key={tr.id ?? i} style={{ borderBottom: "1px solid hsla(0,0%,100%,0.03)" }}>
                    <td style={{ padding: "6px 14px", color: "#c4b5fd", fontFamily: "monospace", fontSize: "0.75rem" }}>{tr.agentId}</td>
                    <td style={{ padding: "6px 14px" }}>
                      <span style={{ fontSize: "0.6rem", padding: "2px 8px", borderRadius: "4px", background: tr.status === "success" ? "rgba(34,197,94,0.08)" : tr.status === "error" ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)", color: tr.status === "success" ? "#22c55e" : tr.status === "error" ? "#ef4444" : "#9ca3af", border: `1px solid ${tr.status === "success" ? "rgba(34,197,94,0.2)" : tr.status === "error" ? "rgba(239,68,68,0.2)" : "hsla(0,0%,100%,0.08)"}` }}>{tr.status}</span>
                    </td>
                    <td style={{ padding: "6px 14px", color: tr.latencyMs > 3000 ? "#f59e0b" : "#9ca3af", fontFamily: "monospace" }}>{tr.latencyMs ? `${tr.latencyMs}ms` : "—"}</td>
                    <td style={{ padding: "6px 14px", color: "#4b5563", fontFamily: "monospace", fontSize: "0.65rem" }}>{tr.startedAt ? new Date(tr.startedAt).toLocaleTimeString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={{ background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid hsla(0,0%,100%,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={14} style={{ color: "#a78bfa" }} />
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#e5e7eb" }}>Agent Health</span>
          </div>
          <div style={{ overflow: "auto", maxHeight: "480px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid hsla(0,0%,100%,0.06)" }}>
                  {["Agent", "Domain", "Status", "Model", "Latency", "Success", "Cost/24h"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.625rem", fontFamily: "monospace", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AGENTS.map(agent => (
                  <tr key={agent.id} style={{ borderBottom: "1px solid hsla(0,0%,100%,0.03)", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "hsla(270, 40%, 20%, 0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600, color: "#e5e7eb" }}>{agent.name}</div>
                      <div style={{ fontSize: "0.625rem", color: "#4b5563", fontFamily: "monospace" }}>{agent.id}</div>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#9ca3af" }}>{agent.domain}</td>
                    <td style={{ padding: "10px 12px" }}><StatusBadge status={agent.status} /></td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "0.75rem", color: "#9ca3af" }}>{agent.model}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "0.75rem", color: agent.avgLatency > 2000 ? "#f59e0b" : "#9ca3af" }}>{agent.avgLatency}ms</td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "0.75rem", color: agent.successRate > 97 ? "#22c55e" : "#f59e0b" }}>{agent.successRate}%</td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "0.75rem", color: "#9ca3af" }}>${agent.costLast24h.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid hsla(0,0%,100%,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BarChart3 size={14} style={{ color: "#22d3ee" }} />
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#e5e7eb" }}>Decision Replay</span>
            </div>
            <span style={{ fontSize: "0.625rem", fontFamily: "monospace", color: "#4b5563" }}>Last {DECISION_LOG.length} decisions</span>
          </div>
          <div style={{ overflow: "auto", maxHeight: "480px" }}>
            {DECISION_LOG.map((d, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 18px",
                  borderBottom: "1px solid hsla(0,0%,100%,0.03)",
                  cursor: "pointer",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "hsla(192, 40%, 20%, 0.06)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "0.625rem", fontFamily: "monospace", color: "#4b5563" }}>{d.time}</span>
                  <span style={{
                    fontSize: "0.5625rem", fontFamily: "monospace", fontWeight: 700,
                    padding: "1px 6px", borderRadius: "3px", letterSpacing: "0.08em",
                    background: d.action === "FLAG" ? "hsla(0,80%,55%,0.12)" : d.action === "CORRELATE" ? "hsla(192,70%,55%,0.12)" : d.action === "GATE" ? "hsla(270,60%,60%,0.12)" : "hsla(0,0%,100%,0.05)",
                    color: d.action === "FLAG" ? "#ef4444" : d.action === "CORRELATE" ? "#22d3ee" : d.action === "GATE" ? "#a78bfa" : "#9ca3af",
                  }}>{d.action}</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#d1d5db" }}>{d.agent}</span>
                  <span style={{ marginLeft: "auto" }}>
                    {d.approved ? <CheckCircle size={12} style={{ color: "#22c55e" }} /> : <Clock size={12} style={{ color: "#f59e0b" }} />}
                  </span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0, paddingLeft: "0" }}>{d.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
