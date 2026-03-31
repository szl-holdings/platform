import { useState } from "react";
import { ActivityFeed } from "@workspace/shared-ui/collaboration";
import { DataProvenance, ActionLoop, RoleSelector } from "@workspace/shared-ui";
import type { DataProvenanceInfo } from "@workspace/shared-ui";
import { Link } from "wouter";
import {
  TrendingDown, TrendingUp, ChevronRight, Clock, Zap, Target, Activity,
  ArrowUpRight, RefreshCw, Shield, CheckCircle2, AlertTriangle, Radio,
  Eye, Gauge, Heart, Users, FileText, GitBranch,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { api, type LyteSignal, type LyteDashboard } from "@/lib/api";
import { severityColors } from "@/lib/business-data";
import type { SignalSeverity } from "@/lib/business-data";

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function SeverityDot({ severity, pulse }: { severity: string; pulse?: boolean }) {
  const sev = (["critical", "high", "medium", "low", "stable"].includes(severity) ? severity : "medium") as SignalSeverity;
  const c = severityColors[sev];
  return <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot, pulse && sev === "critical" && "animate-pulse")} />;
}

function SeverityBadge({ severity }: { severity: string }) {
  const sev = (["critical", "high", "medium", "low", "stable"].includes(severity) ? severity : "medium") as SignalSeverity;
  const c = severityColors[sev];
  return (
    <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider", c.text, c.bg, c.border)}>
      {severity}
    </span>
  );
}

const PRISM_CARDS = [
  { key: "P", name: "Pulse", icon: Heart, color: "#d4a054", href: "/prism/pulse", desc: "Health & tempo" },
  { key: "R", name: "Risk", icon: AlertTriangle, color: "#c45a4a", href: "/prism/risk", desc: "Exposures & gaps" },
  { key: "I", name: "Intelligence", icon: Eye, color: "#8b7ac8", href: "/prism/intelligence", desc: "Evidence & reasoning" },
  { key: "S", name: "Signals", icon: Radio, color: "#c8953c", href: "/prism/signals", desc: "Anomalies & state changes" },
  { key: "M", name: "Motion", icon: Gauge, color: "#4a90b8", href: "/prism/motion", desc: "Actions & execution" },
];

export default function Dashboard() {
  const [activeRole, setActiveRole] = useState("operator");

  const { data: dashboardData, isLoading: dashLoading, error: dashError, refetch: refetchDash } = useQuery<LyteDashboard>({
    queryKey: ["lyte-dashboard"],
    queryFn: () => api.dashboard(),
    refetchInterval: 60_000,
  });

  const { data: insightsData } = useQuery({
    queryKey: ["lyte-insights-narratives"],
    queryFn: () => api.insights(),
    refetchInterval: 120_000,
  });

  const { data: signals = [], isLoading: signalsLoading } = useQuery({
    queryKey: ["lyte-signals-feed"],
    queryFn: () => api.signals.list(),
    refetchInterval: 30_000,
  });

  const summary = dashboardData?.summary;
  const recentSignals = dashboardData?.recentSignals ?? signals.slice(0, 8);
  const criticalSignals = signals.filter(s => s.severity === "critical" && s.status !== "resolved");
  const highSignals = signals.filter(s => s.severity === "high" && s.status !== "resolved");
  const mediumSignals = signals.filter(s => s.severity === "medium" && s.status !== "resolved");
  const isLoading = dashLoading || signalsLoading;

  const signalTrendData = (() => {
    const buckets: Record<string, { critical: number; high: number; medium: number; low: number; date: string }> = {};
    const now = Date.now();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      buckets[key] = { date: key, critical: 0, high: 0, medium: 0, low: 0 };
    }
    for (const s of signals) {
      const d = new Date(s.receivedAt ?? s.createdAt);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (buckets[key]) {
        const sev = s.severity as keyof typeof buckets[string];
        if (sev === "critical" || sev === "high" || sev === "medium" || sev === "low") {
          buckets[key][sev]++;
        }
      }
    }
    return Object.values(buckets);
  })();

  const narratives = (insightsData as any)?.events?.filter((e: any) => e.type === "narrative_generated") ?? [];

  const topExposures = [
    { label: "Urgent Exposures", value: isLoading ? "—" : (summary?.criticalUnresolved ?? criticalSignals.length), color: "#c45a4a", critical: true },
    { label: "Aged Approvals", value: isLoading ? "—" : "14", color: "#c8953c" },
    { label: "Ownership Gaps", value: isLoading ? "—" : "8", color: "#d4a054" },
    { label: "Active Signals", value: isLoading ? "—" : (summary?.totalSignals ?? signals.length), color: "rgba(255,255,255,0.5)" },
    { label: "Value at Risk", value: isLoading ? "—" : "$5.03M", color: "#c45a4a" },
    { label: "Decision Latency", value: isLoading ? "—" : "34h", color: "#c8953c", sub: "avg" },
  ];

  const actionQueue = [
    ...criticalSignals.slice(0, 3).map(s => ({
      item: s.title,
      reason: `${s.severity} severity — ${s.source}`,
      owner: (s.metadata as any)?.affectedFunction ?? "Unassigned",
      timeAtRisk: timeAgo(s.receivedAt ?? s.createdAt),
      confidence: "high",
      evidence: s.source,
      action: "Investigate",
      severity: s.severity,
    })),
    ...highSignals.slice(0, 2).map(s => ({
      item: s.title,
      reason: `${s.severity} — ${s.source}`,
      owner: (s.metadata as any)?.affectedFunction ?? "Unassigned",
      timeAtRisk: timeAgo(s.receivedAt ?? s.createdAt),
      confidence: "medium",
      evidence: s.source,
      action: "Review",
      severity: s.severity,
    })),
  ];

  const correlations = [
    { cluster: "Revenue pipeline stall", entities: ["Salesforce", "Slack"], impact: "$400K", severity: "critical" },
    { cluster: "Approval bottleneck — procurement", entities: ["ServiceNow", "Workday"], impact: "$120K/mo", severity: "high" },
    { cluster: "Delivery velocity degradation", entities: ["Jira", "GitHub"], impact: "SLA risk", severity: "high" },
    { cluster: "Vendor renewal gap", entities: ["Contracts", "Finance"], impact: "$2.1M exposure", severity: "medium" },
  ];

  return (
    <div className="p-4 lg:p-5 space-y-4 max-w-[1500px]">

      {/* HEADER ROW */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-[15px] text-white tracking-tight">Command Overview</h1>
          <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <RoleSelector currentRole={activeRole} onRoleChange={setActiveRole} />
          <button onClick={() => refetchDash()} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] transition-all" style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
            <RefreshCw className={cn("w-3 h-3", dashLoading && "animate-spin")} />
            Refresh
          </button>
          <DataProvenance
            compact
            provenance={{
              source: "SZL Platform API",
              lastUpdated: dashboardData?.fetchedAt || new Date().toISOString(),
              freshness: dashLoading ? "unknown" : "minutes",
              confidence: "high",
              dataState: dashError ? "demo" : "live",
              owner: "Lyte Operations",
              nextRefresh: "Auto · 60s",
            } as DataProvenanceInfo}
          />
        </div>
      </div>

      {/* TOP EXPOSURE STRIP */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-px rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
        {topExposures.map((exp) => (
          <div key={exp.label} className="px-3 py-2.5" style={{ background: "#0c1018" }}>
            <div className="text-[9px] uppercase tracking-wider font-medium mb-1" style={{ color: "rgba(255,255,255,0.2)" }}>{exp.label}</div>
            <div className="flex items-baseline gap-1">
              <span className="text-[18px] font-bold font-mono" style={{ color: exp.color }}>{exp.value}</span>
              {exp.sub && <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>{exp.sub}</span>}
              {exp.critical && typeof exp.value === "number" && exp.value > 0 && (
                <span className="w-1.5 h-1.5 rounded-full animate-pulse ml-1" style={{ background: "#c45a4a" }} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* PRISM OPERATIONAL STRIP */}
      <div className="grid grid-cols-5 gap-2">
        {PRISM_CARDS.map((p) => (
          <Link key={p.key} href={p.href}>
            <div className="rounded-lg px-3 py-2.5 border cursor-pointer transition-all hover:border-opacity-40 group" style={{ borderColor: `${p.color}18`, background: `${p.color}04` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[14px] font-extrabold font-mono" style={{ color: p.color }}>{p.key}</span>
                <span className="text-[11px] font-semibold text-white">{p.name}</span>
                <p.icon size={12} style={{ color: p.color, opacity: 0.4 }} className="ml-auto shrink-0" />
              </div>
              <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>{p.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ROLE BRIEFING — compact */}
      {activeRole === "executive" && (
        <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(212,160,84,0.12)", background: "rgba(212,160,84,0.03)" }}>
          <span className="text-[9px] uppercase tracking-wider font-semibold mr-2" style={{ color: "rgba(212,160,84,0.4)" }}>Executive</span>
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            {criticalSignals.length > 0 ? `${criticalSignals.length} critical exposure${criticalSignals.length > 1 ? "s" : ""}. ` : "No critical exposures. "}
            {highSignals.length} high-severity in queue. Readiness {summary?.readinessScore ?? 0}%. Decision latency 34h avg.
          </span>
        </div>
      )}
      {activeRole === "operator" && (
        <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(212,160,84,0.12)", background: "rgba(212,160,84,0.03)" }}>
          <span className="text-[9px] uppercase tracking-wider font-semibold mr-2" style={{ color: "rgba(212,160,84,0.4)" }}>Operator</span>
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            {criticalSignals.length} critical in triage. {(summary?.openActions ?? 0)} open actions. {(summary?.openIncidents ?? 0)} active incidents. Readiness {summary?.readinessScore ?? 0}%.
          </span>
        </div>
      )}
      {activeRole === "analyst" && (
        <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(139,122,200,0.12)", background: "rgba(139,122,200,0.03)" }}>
          <span className="text-[9px] uppercase tracking-wider font-semibold mr-2" style={{ color: "rgba(139,122,200,0.4)" }}>Analyst</span>
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            {signals.length} signals. {criticalSignals.length} critical, {highSignals.length} high, {mediumSignals.length} medium. {new Set(signals.map(s => s.source)).size} source connectors. Check 7-day trend.
          </span>
        </div>
      )}
      {activeRole === "buyer" && (
        <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(74,144,184,0.12)", background: "rgba(74,144,184,0.03)" }}>
          <span className="text-[9px] uppercase tracking-wider font-semibold mr-2" style={{ color: "rgba(74,144,184,0.4)" }}>Demo</span>
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            You're viewing Lyte with sample data. Signals, risks, and actions demonstrate intelligence Lyte surfaces from your existing tools.
          </span>
        </div>
      )}

      {/* MAIN GRID: 3 columns */}
      <div className="grid grid-cols-12 gap-3">

        {/* LEFT: Priority Action Queue + Signal Timeline */}
        <div className="col-span-12 lg:col-span-5 space-y-3">
          <div className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[12px] font-semibold text-white flex items-center gap-2">
                <Target className="w-3.5 h-3.5" style={{ color: "#c45a4a" }} />
                Priority Action Queue
              </h2>
              <Link href="/action-center" className="text-[10px] flex items-center gap-0.5 transition-colors" style={{ color: "rgba(212,160,84,0.5)" }}>
                All <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-1">
              {actionQueue.length > 0 ? actionQueue.map((a, i) => (
                <div key={i} className="rounded-md p-2.5 border transition-all hover:border-opacity-30 cursor-pointer" style={{ borderColor: "rgba(255,255,255,0.03)", background: "rgba(255,255,255,0.01)" }}>
                  <div className="flex items-start gap-2">
                    <SeverityDot severity={a.severity} pulse />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-white/85 leading-tight line-clamp-1 mb-1">{a.item}</div>
                      <div className="flex items-center gap-2 text-[9px] flex-wrap" style={{ color: "rgba(255,255,255,0.25)" }}>
                        <SeverityBadge severity={a.severity} />
                        <span className="font-mono">{a.timeAtRisk}</span>
                        <span style={{ color: "rgba(255,255,255,0.08)" }}>|</span>
                        <span>{a.owner}</span>
                        <span style={{ color: "rgba(255,255,255,0.08)" }}>|</span>
                        <span className="font-mono" style={{ color: a.confidence === "high" ? "rgba(212,160,84,0.5)" : "rgba(255,255,255,0.2)" }}>
                          {a.confidence} conf
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.15)" }}>via {a.evidence}</span>
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded" style={{ color: "#d4a054", background: "rgba(212,160,84,0.06)" }}>{a.action}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="flex items-center gap-2 p-3 rounded-md" style={{ background: "rgba(74,144,184,0.04)", border: "1px solid rgba(74,144,184,0.1)" }}>
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#4a90b8" }} />
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>No priority actions — system nominal</span>
                </div>
              )}
            </div>
          </div>

          {/* SIGNAL TIMELINE */}
          <div className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)" }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[12px] font-semibold text-white flex items-center gap-2">
                <Radio className="w-3.5 h-3.5" style={{ color: "#c8953c" }} />
                Signal Timeline
              </h2>
              <Link href="/signals" className="text-[10px] flex items-center gap-0.5" style={{ color: "rgba(212,160,84,0.5)" }}>
                Feed <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-0.5">
              {recentSignals.slice(0, 8).map(s => {
                const sev = (["critical", "high", "medium", "low"].includes(s.severity) ? s.severity : "medium") as SignalSeverity;
                const c = severityColors[sev];
                return (
                  <div key={s.id} className="flex items-center gap-2 py-1.5 text-[10px]" style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                    <SeverityDot severity={s.severity} pulse={s.severity === "critical"} />
                    <span className="text-white/70 truncate flex-1 min-w-0">{s.title}</span>
                    <span className="font-mono shrink-0" style={{ color: "rgba(255,255,255,0.15)" }}>{timeAgo(s.receivedAt ?? s.createdAt)}</span>
                    <span className={cn("text-[8px] font-mono px-1 py-0.5 rounded border uppercase",
                      s.status === "resolved" ? "" : s.status === "acknowledged" ? "" : ""
                    )} style={{
                      color: s.status === "resolved" ? "rgba(74,144,184,0.5)" : s.status === "acknowledged" ? "rgba(139,122,200,0.5)" : "rgba(255,255,255,0.15)",
                      borderColor: s.status === "resolved" ? "rgba(74,144,184,0.12)" : s.status === "acknowledged" ? "rgba(139,122,200,0.12)" : "rgba(255,255,255,0.04)",
                      background: s.status === "resolved" ? "rgba(74,144,184,0.04)" : s.status === "acknowledged" ? "rgba(139,122,200,0.04)" : "rgba(255,255,255,0.015)"
                    )}>{s.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER: Trend + Active Signals */}
        <div className="col-span-12 lg:col-span-4 space-y-3">
          <div className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)" }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[12px] font-semibold text-white flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" style={{ color: "#c8953c" }} />
                Signal Volume
              </h2>
              <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>7 days</span>
            </div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signalTrendData}>
                  <defs>
                    <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c45a4a" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#c45a4a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c8953c" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#c8953c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.15)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, fontSize: 10 }} labelStyle={{ color: "rgba(255,255,255,0.3)" }} />
                  <Area type="monotone" dataKey="critical" stroke="#c45a4a" strokeWidth={1.5} fill="url(#critGrad)" dot={false} />
                  <Area type="monotone" dataKey="high" stroke="#c8953c" strokeWidth={1} fill="url(#highGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ACTIVE SIGNALS */}
          <div className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)" }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[12px] font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#c45a4a" }} />
                Active Critical
                <span className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase" style={{ color: "#d4a054", background: "rgba(212,160,84,0.06)", border: "1px solid rgba(212,160,84,0.1)" }}>Live</span>
              </h2>
            </div>
            {signalsLoading ? (
              <div className="space-y-1.5">{[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded-md animate-pulse" style={{ background: "rgba(255,255,255,0.02)" }} />)}</div>
            ) : (
              <div className="space-y-1.5">
                {criticalSignals.slice(0, 4).map(s => (
                  <Link key={s.id} href="/signals">
                    <div className="rounded-md p-2 border cursor-pointer transition-all group" style={{ borderColor: "rgba(196,90,74,0.1)", background: "rgba(196,90,74,0.02)" }}>
                      <div className="flex items-start gap-2">
                        <SeverityDot severity="critical" pulse />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-medium text-white/80 line-clamp-1">{s.title}</div>
                          <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                            {s.source} · {timeAgo(s.receivedAt ?? s.createdAt)}
                          </div>
                        </div>
                        <ChevronRight className="w-3 h-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: "rgba(255,255,255,0.3)" }} />
                      </div>
                    </div>
                  </Link>
                ))}
                {highSignals.slice(0, 2).map(s => (
                  <Link key={s.id} href="/signals">
                    <div className="rounded-md p-2 border cursor-pointer transition-all group" style={{ borderColor: "rgba(200,149,60,0.08)", background: "rgba(200,149,60,0.015)" }}>
                      <div className="flex items-start gap-2">
                        <SeverityDot severity="high" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-medium text-white/70 line-clamp-1">{s.title}</div>
                          <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.15)" }}>
                            {s.source} · {timeAgo(s.receivedAt ?? s.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                {criticalSignals.length === 0 && highSignals.length === 0 && (
                  <div className="flex items-center gap-2 p-2.5 rounded-md" style={{ background: "rgba(74,144,184,0.04)", border: "1px solid rgba(74,144,184,0.08)" }}>
                    <CheckCircle2 className="w-3 h-3" style={{ color: "#4a90b8" }} />
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>System nominal</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* NARRATIVE INTELLIGENCE */}
          <div className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)" }}>
            <h2 className="text-[12px] font-semibold text-white flex items-center gap-2 mb-2">
              <Eye className="w-3.5 h-3.5" style={{ color: "#8b7ac8" }} />
              Intelligence
            </h2>
            <div className="space-y-1.5">
              {narratives.slice(0, 3).map((n: any, i: number) => (
                <div key={i} className="p-2 rounded-md" style={{ background: "rgba(139,122,200,0.03)", border: "1px solid rgba(139,122,200,0.06)" }}>
                  <div className="text-[10px] text-white/60 leading-relaxed line-clamp-2">{n.summary || n.title || "Intelligence insight pending analysis"}</div>
                  <div className="text-[8px] font-mono mt-1" style={{ color: "rgba(139,122,200,0.3)" }}>
                    {n.priority ?? "medium"} priority · {n.timestamp ? timeAgo(n.timestamp) : "recent"}
                  </div>
                </div>
              ))}
              {narratives.length === 0 && (
                <div className="text-[10px] p-2" style={{ color: "rgba(255,255,255,0.15)" }}>Intelligence engine processing signals...</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Correlations + Platform Health + System State */}
        <div className="col-span-12 lg:col-span-3 space-y-3">

          {/* CORRELATIONS */}
          <div className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)" }}>
            <h2 className="text-[12px] font-semibold text-white flex items-center gap-2 mb-2">
              <GitBranch className="w-3.5 h-3.5" style={{ color: "#d4a054" }} />
              Correlations
            </h2>
            <div className="space-y-1.5">
              {correlations.map((c, i) => (
                <div key={i} className="rounded-md p-2 cursor-pointer transition-all" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <SeverityDot severity={c.severity} />
                    <span className="text-[10px] font-medium text-white/70 truncate">{c.cluster}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px]">
                    <span style={{ color: "rgba(255,255,255,0.2)" }}>{c.entities.join(" + ")}</span>
                    <span className="ml-auto font-mono shrink-0" style={{ color: c.severity === "critical" ? "#c45a4a" : "#c8953c" }}>{c.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PLATFORM HEALTH */}
          <div className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)" }}>
            <h2 className="text-[12px] font-semibold text-white flex items-center gap-2 mb-2">
              <Shield className="w-3.5 h-3.5" style={{ color: "#8b7ac8" }} />
              Platform Health
            </h2>
            <div className="space-y-1">
              {[
                { label: "API Server", count: signals.filter(s => s.source.toLowerCase().includes("api") && s.status !== "resolved").length },
                { label: "Vessels", count: signals.filter(s => s.source.toLowerCase().includes("vessel") && s.status !== "resolved").length },
                { label: "Aegis SOC", count: signals.filter(s => (s.source.toLowerCase().includes("firestorm") || s.source.toLowerCase().includes("aegis")) && s.status !== "resolved").length },
                { label: "Aegis Ops", count: signals.filter(s => (s.source.toLowerCase().includes("msp") || s.source.toLowerCase().includes("rosie")) && s.status !== "resolved").length },
                { label: "Terra", count: signals.filter(s => (s.source.toLowerCase().includes("terra") || s.source.toLowerCase().includes("beacon")) && s.status !== "resolved").length },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-[10px] py-1">
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>{item.label}</span>
                  <span className="font-mono text-[9px]" style={{ color: item.count === 0 ? "#4a90b8" : item.count <= 2 ? "#c8953c" : "#c45a4a" }}>
                    {signalsLoading ? "—" : item.count === 0 ? "nominal" : `${item.count} signal${item.count > 1 ? "s" : ""}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SYSTEM STATE */}
          <div className="rounded-lg border p-3" style={{ borderColor: "rgba(212,160,84,0.06)", background: "rgba(212,160,84,0.02)" }}>
            <h2 className="text-[12px] font-semibold text-white flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5" style={{ color: "#d4a054" }} />
              System State
            </h2>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span style={{ color: "rgba(255,255,255,0.25)" }}>Mode</span>
                <span className="font-mono" style={{ color: dashError ? "#c8953c" : "#4a90b8" }}>{dashError ? "Demo" : "Live"}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "rgba(255,255,255,0.25)" }}>Last sync</span>
                <span className="font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{dashboardData?.fetchedAt ? timeAgo(dashboardData.fetchedAt) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "rgba(255,255,255,0.25)" }}>Confidence</span>
                <span className="font-mono" style={{ color: "rgba(212,160,84,0.5)" }}>High</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "rgba(255,255,255,0.25)" }}>Sources</span>
                <span className="font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{signalsLoading ? "—" : `${new Set(signals.map(s => s.source)).size} connectors`}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "rgba(255,255,255,0.25)" }}>Refresh</span>
                <span className="font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>Auto · 60s</span>
              </div>
            </div>
          </div>

          {/* ACTIVITY */}
          <div className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)" }}>
            <ActivityFeed teamName="Operations" maxItems={4} compact />
          </div>
        </div>
      </div>

      {/* BOTTOM: ACTION LOOP */}
      <ActionLoop
        platformColor="#d4a054"
        actions={[
          { id: "1", label: "Investigate API heap memory alert", severity: "critical", type: "investigate" },
          { id: "2", label: "Resolve aged procurement approvals (14)", severity: "high", type: "approve" },
          { id: "3", label: "Assign owner to 8 orphaned processes", severity: "high", type: "assign" },
          { id: "4", label: "Review Salesforce pipeline stall ($400K)", severity: "critical", type: "review" },
          { id: "5", label: "Escalate vendor renewal gap to COO", severity: "medium", type: "escalate" },
        ]}
      />
    </div>
  );
}
