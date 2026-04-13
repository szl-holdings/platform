import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import {
  BarChart3, Eye, UserPlus, FileText, Send, TrendingUp,
  Monitor, Smartphone, Tablet, Globe, ArrowDown, Layers,
  Users, Activity, RefreshCw, ChevronRight, Clock, Funnel
} from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

interface RealtimeData {
  activeNow: number;
  sessions24h: number;
  sessions7d: number;
  conversions7d: number;
  conversionRate7d: string;
  leads7d: number;
  topPages: Array<{ path: string; count: number }>;
  sourceBreakdown: Array<{ source: string; count: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  dailySessions: Array<{ date: string; sessions: string; conversions: string }>;
}

interface CohortRow {
  week: string;
  cohortSize: number;
  d1Retention: number;
  d7Retention: number;
  d30Retention: number;
}

interface Stats {
  visitsThisWeek: number;
  leadsThisWeek: number;
  publishedArticles: number;
  xQueued: number;
  xSentTotal: number;
  xFailed: number;
  newslettersReady: number;
  automationsCompletedThisWeek: number;
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: typeof Eye; color: string }) {
  return (
    <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "10px" }}>
      <Icon size={18} style={{ color, marginBottom: "0.75rem" }} />
      <div style={{ fontSize: "2rem", fontWeight: 700, color: "#e8e4de", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: "0.8125rem", color: "#8b8579", marginTop: "0.25rem" }}>{label}</div>
      {sub && <div style={{ fontSize: "0.6875rem", color: "#4a4540", marginTop: "0.125rem" }}>{sub}</div>}
    </div>
  );
}

function retentionColor(pct: number) {
  if (pct >= 40) return "#5a9c5a";
  if (pct >= 20) return "#d4a054";
  return "#c45a4a";
}

type Tab = "realtime" | "cohorts" | "funnels";

export default function AnalyticsDashboardPage() {
  const [location] = useLocation();
  const [tab, setTab] = useState<Tab>("realtime");
  const [rt, setRt] = useState<RealtimeData | null>(null);
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [funnelSteps, setFunnelSteps] = useState([
    { name: "Landing Page", event: "page_view", path: "/" },
    { name: "Pricing", event: "page_view", path: "/lyte" },
    { name: "Subscribe", event: "signup", path: "" },
  ]);
  const [funnelResult, setFunnelResult] = useState<Array<{
    step: string; count: number; dropOff: number; dropOffRate: number; conversionRate: number;
    breakdown?: Record<string, number>;
    sampleSessions?: Array<{ sessionId: string; pages: Array<{ path: string; ts: number }> }>;
  }> | null>(null);
  const [breakdownBy, setBreakdownBy] = useState<"source" | "device">("source");
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/distribution-os/analytics/dashboard`).then(r => r.json()).then(setStats).catch(() => {});
    if (tab === "realtime") loadRealtime();
    if (tab === "cohorts") loadCohorts();
  }, [tab]);

  async function loadRealtime() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/distribution-os/realtime`);
      setRt(await r.json());
    } catch {}
    setLoading(false);
  }

  async function loadCohorts() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/distribution-os/cohorts?weeks=8`);
      setCohorts(await r.json());
    } catch {}
    setLoading(false);
  }

  async function runFunnel() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/distribution-os/funnels/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: funnelSteps, days: 30, breakdownBy }),
      });
      const data = await r.json();
      setFunnelResult(data.funnel);
    } catch {}
    setLoading(false);
  }

  const s = stats || { visitsThisWeek: 0, leadsThisWeek: 0, publishedArticles: 0, xQueued: 0, xSentTotal: 0, xFailed: 0, newslettersReady: 0, automationsCompletedThisWeek: 0 };

  const tabStyle = (t: Tab) => ({
    padding: "0.5rem 1rem",
    background: tab === t ? "hsla(0,0%,100%,0.08)" : "transparent",
    border: `1px solid ${tab === t ? "hsla(0,0%,100%,0.12)" : "transparent"}`,
    borderRadius: "6px",
    color: tab === t ? "#e8e4de" : "#6b6560",
    fontSize: "0.8125rem",
    fontWeight: tab === t ? 600 : 400,
    cursor: "pointer",
  });

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Analytics</h1>
            <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>Session intelligence, retention curves, and funnel analysis</p>
          </div>
          <button onClick={tab === "realtime" ? loadRealtime : tab === "cohorts" ? loadCohorts : undefined} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#8b8579", fontSize: "0.75rem", cursor: "pointer" }}>
            <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>

        {/* Summary KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <StatCard icon={Eye} label="Page Views (7d)" value={rt?.sessions7d ?? s.visitsThisWeek} color="#4a90b8" />
          <StatCard icon={UserPlus} label="New Leads (7d)" value={rt?.leads7d ?? s.leadsThisWeek} color="#5a9c5a" sub="Newsletter + contact forms" />
          <StatCard icon={Activity} label="Active Now" value={rt?.activeNow ?? 0} color="#d4a054" sub="Last 5 minutes" />
          <StatCard icon={TrendingUp} label="Conversion Rate" value={`${rt?.conversionRate7d ?? "0.0"}%`} color="#8b7ac8" sub="7-day window" />
          <StatCard icon={FileText} label="Published Articles" value={s.publishedArticles} color="#d4a054" />
          <StatCard icon={Send} label="X Posts Sent" value={s.xSentTotal} color="#4a90b8" />
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <button style={tabStyle("realtime")} onClick={() => setTab("realtime")}><Eye size={12} style={{ display: "inline", marginRight: "0.375rem" }} />Real-time</button>
          <button style={tabStyle("cohorts")} onClick={() => setTab("cohorts")}><Users size={12} style={{ display: "inline", marginRight: "0.375rem" }} />Cohort Retention</button>
          <button style={tabStyle("funnels")} onClick={() => setTab("funnels")}><Layers size={12} style={{ display: "inline", marginRight: "0.375rem" }} />Funnels</button>
        </div>

        {/* REALTIME TAB */}
        {tab === "realtime" && rt && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {/* Top pages */}
            <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem" }}>Top Pages (7d)</h3>
              {rt.topPages.map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
                  <span style={{ fontSize: "0.8125rem", color: "#8b8579", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>{p.path || "/"}</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#d4a054" }}>{p.count}</span>
                </div>
              ))}
              {rt.topPages.length === 0 && <p style={{ color: "#4a4540", fontSize: "0.8125rem" }}>No page view data yet. Session tracking is active.</p>}
            </div>

            {/* Sources */}
            <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem" }}>Traffic Sources (7d)</h3>
              {rt.sourceBreakdown.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
                  <span style={{ fontSize: "0.8125rem", color: "#8b8579" }}>{s.source}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: "60px", height: "4px", background: "hsla(0,0%,100%,0.06)", borderRadius: "2px" }}>
                      <div style={{ width: `${Math.min(100, (s.count / (rt.sessions7d || 1)) * 100)}%`, height: "100%", background: "#4a90b8", borderRadius: "2px" }} />
                    </div>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#4a90b8" }}>{s.count}</span>
                  </div>
                </div>
              ))}
              {rt.sourceBreakdown.length === 0 && <p style={{ color: "#4a4540", fontSize: "0.8125rem" }}>No source data yet.</p>}
            </div>

            {/* Device breakdown */}
            <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem" }}>Device Types (7d)</h3>
              {rt.deviceBreakdown.map((d, i) => {
                const Icon = d.device === "mobile" ? Smartphone : d.device === "tablet" ? Tablet : Monitor;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.625rem" }}>
                    <Icon size={14} style={{ color: "#8b8579" }} />
                    <span style={{ fontSize: "0.8125rem", color: "#8b8579", textTransform: "capitalize", flex: 1 }}>{d.device}</span>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#8b7ac8" }}>{d.count}</span>
                  </div>
                );
              })}
              {rt.deviceBreakdown.length === 0 && <p style={{ color: "#4a4540", fontSize: "0.8125rem" }}>No device data yet.</p>}
            </div>

            {/* Daily trend */}
            <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem" }}>Daily Sessions (30d)</h3>
              {rt.dailySessions.length > 0 ? (
                <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "80px" }}>
                  {rt.dailySessions.slice(-30).map((d, i) => {
                    const maxSessions = Math.max(...rt.dailySessions.map(dd => Number(dd.sessions)), 1);
                    const h = Math.max(4, (Number(d.sessions) / maxSessions) * 80);
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                        <div style={{ width: "100%", height: `${h}px`, background: "#4a90b8", borderRadius: "2px 2px 0 0", opacity: 0.7 }} title={`${d.date}: ${d.sessions} sessions`} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: "#4a4540", fontSize: "0.8125rem" }}>No session trend data yet.</p>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                <span style={{ fontSize: "0.625rem", color: "#4a4540" }}>30 days ago</span>
                <span style={{ fontSize: "0.625rem", color: "#4a4540" }}>Today</span>
              </div>
            </div>
          </div>
        )}

        {/* COHORT TAB */}
        {tab === "cohorts" && (
          <div>
            <div style={{ marginBottom: "1rem", padding: "1rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "8px" }}>
              <p style={{ fontSize: "0.8125rem", color: "#8b8579", lineHeight: 1.6 }}>
                Cohort analysis groups leads by their first-visit week and tracks how many return at D1, D7, and D30.
                Retention is calculated based on session activity linked to lead email addresses.
              </p>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Week", "Cohort Size", "D1 Retention", "D7 Retention", "D30 Retention"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.6875rem", fontWeight: 600, color: "#6b6560", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid hsla(0,0%,100%,0.06)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "#8b8579" }}>{row.week}</td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de" }}>{row.cohortSize}</td>
                      {[row.d1Retention, row.d7Retention, row.d30Retention].map((pct, j) => (
                        <td key={j} style={{ padding: "0.75rem 1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: "48px", height: "4px", background: "hsla(0,0%,100%,0.06)", borderRadius: "2px" }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: retentionColor(pct), borderRadius: "2px" }} />
                            </div>
                            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: retentionColor(pct) }}>{pct}%</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                  {cohorts.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "#4a4540", fontSize: "0.8125rem" }}>
                        No cohort data yet. Cohorts populate as session tracking data accumulates.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FUNNELS TAB */}
        {tab === "funnels" && (
          <div>
            <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem" }}>Configure Funnel</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                {funnelSteps.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.6875rem", color: "#6b6560", width: "20px", textAlign: "right" }}>{i + 1}.</span>
                    <input
                      value={step.name}
                      onChange={e => setFunnelSteps(prev => prev.map((s, j) => j === i ? { ...s, name: e.target.value } : s))}
                      placeholder="Step name"
                      style={{ flex: "0 0 140px", padding: "0.5rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "5px", color: "#e8e4de", fontSize: "0.8125rem" }}
                    />
                    <input
                      value={step.path}
                      onChange={e => setFunnelSteps(prev => prev.map((s, j) => j === i ? { ...s, path: e.target.value } : s))}
                      placeholder="/path or empty"
                      style={{ flex: 1, padding: "0.5rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "5px", color: "#e8e4de", fontSize: "0.8125rem" }}
                    />
                    {funnelSteps.length > 2 && (
                      <button onClick={() => setFunnelSteps(prev => prev.filter((_, j) => j !== i))} style={{ padding: "0.375rem 0.5rem", background: "none", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "4px", color: "#c45a4a", cursor: "pointer", fontSize: "0.75rem" }}>✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => setFunnelSteps(prev => [...prev, { name: "", event: "page_view", path: "" }])} style={{ alignSelf: "flex-start", padding: "0.375rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "5px", color: "#8b8579", fontSize: "0.75rem", cursor: "pointer" }}>+ Add Step</button>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#6b6560" }}>Breakdown:</label>
                  <select value={breakdownBy} onChange={e => setBreakdownBy(e.target.value as "source" | "device")} style={{ padding: "0.375rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "5px", color: "#8b8579", fontSize: "0.75rem" }}>
                    <option value="source">By Source</option>
                    <option value="device">By Device</option>
                  </select>
                </div>
                <button onClick={runFunnel} disabled={loading} style={{ padding: "0.5rem 1.25rem", background: "linear-gradient(135deg, #d4a054, #c8953c)", color: "#070a10", border: "none", borderRadius: "6px", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Analyzing…" : "Analyze Funnel"}
                </button>
              </div>
            </div>

            {funnelResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {funnelResult.map((step, i) => (
                  <div key={i}>
                    <div style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "hsla(0,0%,100%,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: "#e8e4de", fontWeight: 700 }}>{i + 1}</span>
                          <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#e8e4de" }}>{step.step}</span>
                          {i > 0 && step.dropOffRate > 0 && (
                            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "#c45a4a" }}>
                              <ArrowDown size={10} /> {step.dropOffRate}% drop-off
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "1.5rem" }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#e8e4de" }}>{step.count.toLocaleString()}</div>
                            <div style={{ fontSize: "0.6875rem", color: "#6b6560" }}>sessions</div>
                          </div>
                          {i > 0 && (
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: step.conversionRate >= 50 ? "#5a9c5a" : "#d4a054" }}>{step.conversionRate}%</div>
                              <div style={{ fontSize: "0.6875rem", color: "#6b6560" }}>conversion</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ marginTop: "0.75rem", height: "4px", background: "hsla(0,0%,100%,0.06)", borderRadius: "2px" }}>
                        <div style={{ width: `${i === 0 ? 100 : step.conversionRate}%`, height: "100%", background: "#4a90b8", borderRadius: "2px", transition: "width 0.5s ease" }} />
                      </div>

                      {/* Breakdown */}
                      {step.breakdown && Object.keys(step.breakdown).length > 0 && (
                        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          {Object.entries(step.breakdown).slice(0, 5).map(([key, val]) => (
                            <span key={key} style={{ padding: "0.25rem 0.5rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "4px", fontSize: "0.6875rem", color: "#8b8579" }}>
                              {key}: {val}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Session drill-down */}
                      {step.sampleSessions && step.sampleSessions.length > 0 && (
                        <div style={{ marginTop: "0.75rem" }}>
                          <button
                            onClick={() => setExpandedSession(expandedSession === `${i}` ? null : `${i}`)}
                            style={{ display: "flex", alignItems: "center", gap: "0.375rem", background: "none", border: "none", color: "#6b6560", fontSize: "0.75rem", cursor: "pointer", padding: 0 }}
                          >
                            <ChevronRight size={12} style={{ transform: expandedSession === `${i}` ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                            Inspect {step.sampleSessions.length} sample sessions
                          </button>
                          {expandedSession === `${i}` && (
                            <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                              {step.sampleSessions.map((sess, si) => (
                                <div key={si} style={{ padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.04)", borderRadius: "6px" }}>
                                  <div style={{ fontSize: "0.6875rem", color: "#4a4540", marginBottom: "0.375rem" }}>Session {sess.sessionId.slice(0, 12)}…</div>
                                  <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                                    {sess.pages.map((pg, pi) => (
                                      <span key={pi} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                        <span style={{ fontSize: "0.6875rem", fontFamily: "monospace", color: "#8b8579", padding: "0.125rem 0.375rem", background: "hsla(0,0%,100%,0.04)", borderRadius: "3px" }}>{pg.path}</span>
                                        {pi < sess.pages.length - 1 && <ChevronRight size={10} style={{ color: "#4a4540" }} />}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </m.div>
    </DistributionOsLayout>
  );
}
