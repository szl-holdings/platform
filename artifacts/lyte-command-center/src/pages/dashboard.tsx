import { useState } from "react";
import { DataProvenance, ActionLoop, RoleSelector } from "@workspace/shared-ui";
import type { DataProvenanceInfo } from "@workspace/shared-ui";
import { Link } from "wouter";
import {
  TrendingDown, TrendingUp, ChevronRight, Clock, Zap, Target, Activity,
  ArrowUpRight, RefreshCw, Shield, CheckCircle2, AlertTriangle, Radio,
  Eye, Gauge, Heart, Users, FileText, GitBranch, ExternalLink,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { api, type LyteSignal, type LyteDashboard } from "@/lib/api";
import { severityColors } from "@/lib/business-data";
import type { SignalSeverity } from "@/lib/business-data";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e", panel: "#0e1219" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.06)", accent: "rgba(212,160,84,0.12)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function Dot({ sev, pulse }: { sev: string; pulse?: boolean }) {
  const colors: Record<string, string> = { critical: "#c45a4a", high: "#c8953c", medium: "#d4a054", low: "#4a90b8", stable: "#6b8f71" };
  return <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", pulse && "animate-pulse")} style={{ background: colors[sev] ?? colors.medium }} />;
}

function Badge({ sev }: { sev: string }) {
  const colors: Record<string, { fg: string; bg: string; bd: string }> = {
    critical: { fg: "#c45a4a", bg: "rgba(196,90,74,0.08)", bd: "rgba(196,90,74,0.18)" },
    high: { fg: "#c8953c", bg: "rgba(200,149,60,0.08)", bd: "rgba(200,149,60,0.18)" },
    medium: { fg: "#d4a054", bg: "rgba(212,160,84,0.08)", bd: "rgba(212,160,84,0.18)" },
    low: { fg: "#4a90b8", bg: "rgba(74,144,184,0.08)", bd: "rgba(74,144,184,0.18)" },
  };
  const c = colors[sev] ?? colors.medium;
  return <span className="text-[8px] font-mono px-1.5 py-px rounded uppercase tracking-wider" style={{ color: c.fg, background: c.bg, border: `1px solid ${c.bd}` }}>{sev}</span>;
}

function Panel({ children, accent, className = "" }: { children: React.ReactNode; accent?: string; className?: string }) {
  return (
    <div className={cn("rounded-md overflow-hidden", className)} style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
      {accent && <div className="h-px" style={{ background: accent }} />}
      {children}
    </div>
  );
}

function PanelHead({ icon: Icon, title, right, accent }: { icon: any; title: string; right?: React.ReactNode; accent?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" style={{ color: accent ?? TEXT.tertiary }} />
        <span className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

const PRISM = [
  { key: "P", name: "Pulse", icon: Heart, color: "#d4a054", href: "/prism/pulse" },
  { key: "R", name: "Risk", icon: AlertTriangle, color: "#c45a4a", href: "/prism/risk" },
  { key: "I", name: "Intelligence", icon: Eye, color: "#8b7ac8", href: "/prism/intelligence" },
  { key: "S", name: "Signals", icon: Radio, color: "#c8953c", href: "/prism/signals" },
  { key: "M", name: "Motion", icon: Gauge, color: "#4a90b8", href: "/prism/motion" },
];

export default function Dashboard() {
  const [activeRole, setActiveRole] = useState("operator");

  const { data: dashboardData, isLoading: dashLoading, error: dashError, refetch } = useQuery<LyteDashboard>({
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
        if (sev === "critical" || sev === "high" || sev === "medium" || sev === "low") buckets[key][sev]++;
      }
    }
    return Object.values(buckets);
  })();

  const narratives = (insightsData as any)?.events?.filter((e: any) => e.type === "narrative_generated") ?? [];

  const metrics = [
    { label: "Urgent Exposures", value: isLoading ? "—" : (summary?.criticalUnresolved ?? criticalSignals.length), color: "#c45a4a", pulse: true },
    { label: "Aged Approvals", value: isLoading ? "—" : "14", color: "#c8953c" },
    { label: "Ownership Gaps", value: isLoading ? "—" : "8", color: "#d4a054" },
    { label: "Active Signals", value: isLoading ? "—" : (summary?.totalSignals ?? signals.length), color: TEXT.secondary },
    { label: "Value at Risk", value: isLoading ? "—" : "$5.03M", color: "#c45a4a" },
    { label: "Decision Latency", value: isLoading ? "—" : "34h", color: "#c8953c", sub: "avg" },
  ];

  const queue = [
    ...criticalSignals.slice(0, 4).map(s => ({
      title: s.title, severity: s.severity, owner: (s.metadata as any)?.affectedFunction ?? "Unassigned",
      time: timeAgo(s.receivedAt ?? s.createdAt), confidence: "high", source: s.source, action: "Investigate",
    })),
    ...highSignals.slice(0, 2).map(s => ({
      title: s.title, severity: s.severity, owner: (s.metadata as any)?.affectedFunction ?? "Unassigned",
      time: timeAgo(s.receivedAt ?? s.createdAt), confidence: "medium", source: s.source, action: "Review",
    })),
  ];

  const correlations = [
    { cluster: "Revenue pipeline stall", entities: ["Salesforce", "Slack"], impact: "$400K", sev: "critical" },
    { cluster: "Approval bottleneck — procurement", entities: ["ServiceNow", "Workday"], impact: "$120K/mo", sev: "high" },
    { cluster: "Delivery velocity degradation", entities: ["Jira", "GitHub"], impact: "SLA risk", sev: "high" },
    { cluster: "Vendor renewal gap", entities: ["Contracts", "Finance"], impact: "$2.1M", sev: "medium" },
  ];

  const platforms = [
    { label: "API Server", count: signals.filter(s => s.source.toLowerCase().includes("api") && s.status !== "resolved").length },
    { label: "Vessels", count: signals.filter(s => s.source.toLowerCase().includes("vessel") && s.status !== "resolved").length },
    { label: "Aegis SOC", count: signals.filter(s => (s.source.toLowerCase().includes("firestorm") || s.source.toLowerCase().includes("aegis")) && s.status !== "resolved").length },
    { label: "Terra", count: signals.filter(s => (s.source.toLowerCase().includes("terra") || s.source.toLowerCase().includes("beacon")) && s.status !== "resolved").length },
  ];

  return (
    <div className="p-3 lg:p-4 space-y-3" style={{ maxWidth: 1440 }}>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-[13px] font-semibold tracking-tight" style={{ color: TEXT.primary }}>Command Overview</h1>
          <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <RoleSelector currentRole={activeRole} onRoleChange={setActiveRole} />
          <button onClick={() => refetch()} className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono transition-all hover:bg-white/[0.03]" style={{ border: `1px solid ${BORDER.subtle}`, color: TEXT.tertiary }}>
            <RefreshCw className={cn("w-3 h-3", dashLoading && "animate-spin")} />
            Sync
          </button>
          <DataProvenance compact provenance={{ source: "SZL Platform API", lastUpdated: dashboardData?.fetchedAt || new Date().toISOString(), freshness: dashLoading ? "unknown" : "minutes", confidence: "high", dataState: dashError ? "demo" : "live", owner: "Lyte Operations", nextRefresh: "Auto · 60s" } as DataProvenanceInfo} />
        </div>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-px rounded overflow-hidden" style={{ background: BORDER.subtle }}>
        {metrics.map(m => (
          <div key={m.label} className="px-3 py-2" style={{ background: BG.surface }}>
            <div className="text-[8px] uppercase tracking-widest font-medium mb-0.5" style={{ color: TEXT.muted }}>{m.label}</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold font-mono leading-none" style={{ color: m.color }}>{m.value}</span>
              {m.sub && <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>{m.sub}</span>}
              {m.pulse && typeof m.value === "number" && m.value > 0 && <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: "#c45a4a" }} />}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {PRISM.map(p => (
          <Link key={p.key} href={p.href}>
            <div className="rounded px-3 py-2 cursor-pointer transition-all group relative overflow-hidden" style={{ background: BG.surface, border: `1px solid ${p.color}12` }}>
              <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: p.color, opacity: 0.4 }} />
              <div className="flex items-center gap-2">
                <span className="text-sm font-black font-mono" style={{ color: p.color }}>{p.key}</span>
                <span className="text-[10px] font-semibold" style={{ color: TEXT.primary }}>{p.name}</span>
                <p.icon size={11} className="ml-auto opacity-30 group-hover:opacity-60 transition-opacity" style={{ color: p.color }} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {activeRole && (
        <div className="rounded px-3 py-1.5" style={{ background: BG.surface, borderLeft: `2px solid ${activeRole === "analyst" ? "#8b7ac8" : activeRole === "buyer" ? "#4a90b8" : "#d4a054"}` }}>
          <span className="text-[8px] uppercase tracking-widest font-mono mr-2" style={{ color: TEXT.muted }}>{activeRole === "buyer" ? "demo" : activeRole}</span>
          <span className="text-[10px]" style={{ color: TEXT.secondary }}>
            {activeRole === "executive" && `${criticalSignals.length} critical. ${highSignals.length} high. Readiness ${summary?.readinessScore ?? 0}%. Decision latency 34h.`}
            {activeRole === "operator" && `${criticalSignals.length} critical in triage. ${summary?.openActions ?? 0} open actions. ${summary?.openIncidents ?? 0} incidents.`}
            {activeRole === "analyst" && `${signals.length} signals across ${new Set(signals.map(s => s.source)).size} sources. ${criticalSignals.length} critical, ${highSignals.length} high.`}
            {activeRole === "buyer" && "Viewing Lyte with sample data. Signals and actions demonstrate intelligence from your existing tools."}
          </span>
        </div>
      )}

      <div className="grid grid-cols-12 gap-3">

        <div className="col-span-12 lg:col-span-5 space-y-3">
          <Panel accent="#c45a4a">
            <PanelHead icon={Target} title="Priority Action Queue" accent="#c45a4a" right={
              <Link href="/action-center" className="text-[9px] font-mono flex items-center gap-0.5 hover:opacity-80" style={{ color: TEXT.tertiary }}>All <ArrowUpRight className="w-2.5 h-2.5" /></Link>
            } />
            <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
              {queue.length > 0 ? queue.map((a, i) => (
                <div key={i} className="px-3 py-2.5 hover:bg-white/[0.015] transition-colors cursor-pointer">
                  <div className="flex items-start gap-2">
                    <Dot sev={a.severity} pulse={a.severity === "critical"} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium leading-snug line-clamp-1 mb-1" style={{ color: TEXT.primary }}>{a.title}</div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge sev={a.severity} />
                        <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>{a.time}</span>
                        <span style={{ color: TEXT.muted }}>·</span>
                        <span className="text-[8px]" style={{ color: TEXT.tertiary }}>{a.owner}</span>
                        <span style={{ color: TEXT.muted }}>·</span>
                        <span className="text-[8px] font-mono" style={{ color: a.confidence === "high" ? "rgba(212,160,84,0.45)" : TEXT.muted }}>{a.confidence}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>via {a.source}</span>
                        <span className="text-[8px] font-semibold px-1.5 py-px rounded" style={{ color: "#d4a054", background: "rgba(212,160,84,0.06)", border: `1px solid rgba(212,160,84,0.1)` }}>{a.action}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="flex items-center gap-2 px-3 py-3">
                  <CheckCircle2 className="w-3 h-3" style={{ color: "#4a90b8" }} />
                  <span className="text-[10px]" style={{ color: TEXT.secondary }}>No priority actions — system nominal</span>
                </div>
              )}
            </div>
          </Panel>

          <Panel accent="#c8953c">
            <PanelHead icon={Radio} title="Signal Timeline" accent="#c8953c" right={
              <Link href="/signals" className="text-[9px] font-mono flex items-center gap-0.5 hover:opacity-80" style={{ color: TEXT.tertiary }}>Feed <ArrowUpRight className="w-2.5 h-2.5" /></Link>
            } />
            <div className="px-3">
              {recentSignals.slice(0, 7).map(s => (
                <div key={s.id} className="flex items-center gap-2 py-1.5" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
                  <Dot sev={s.severity} pulse={s.severity === "critical"} />
                  <span className="text-[9px] truncate flex-1 min-w-0" style={{ color: TEXT.secondary }}>{s.title}</span>
                  <span className="text-[8px] font-mono shrink-0" style={{ color: TEXT.muted }}>{timeAgo(s.receivedAt ?? s.createdAt)}</span>
                  <span className="text-[7px] font-mono px-1 py-px rounded uppercase shrink-0" style={{
                    color: s.status === "resolved" ? "rgba(74,144,184,0.5)" : s.status === "acknowledged" ? "rgba(139,122,200,0.4)" : TEXT.muted,
                    background: s.status === "resolved" ? "rgba(74,144,184,0.04)" : s.status === "acknowledged" ? "rgba(139,122,200,0.04)" : "rgba(255,255,255,0.02)",
                  }}>{s.status}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-3">
          <Panel>
            <PanelHead icon={Activity} title="Signal Volume" accent="#c8953c" right={<span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>7d</span>} />
            <div className="px-3 py-2 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signalTrendData}>
                  <defs>
                    <linearGradient id="cG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c45a4a" stopOpacity={0.3} /><stop offset="100%" stopColor="#c45a4a" stopOpacity={0} /></linearGradient>
                    <linearGradient id="hG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c8953c" stopOpacity={0.2} /><stop offset="100%" stopColor="#c8953c" stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: TEXT.muted }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: BG.elevated, border: `1px solid ${BORDER.muted}`, borderRadius: 4, fontSize: 9 }} labelStyle={{ color: TEXT.tertiary }} />
                  <Area type="monotone" dataKey="critical" stroke="#c45a4a" strokeWidth={1.5} fill="url(#cG)" dot={false} />
                  <Area type="monotone" dataKey="high" stroke="#c8953c" strokeWidth={1} fill="url(#hG)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel accent="#c45a4a">
            <PanelHead icon={AlertTriangle} title="Active Critical" accent="#c45a4a" right={
              <span className="text-[7px] font-mono uppercase px-1.5 py-px rounded" style={{ color: "#d4a054", background: "rgba(212,160,84,0.06)", border: `1px solid rgba(212,160,84,0.08)` }}>Live</span>
            } />
            <div className="px-3">
              {signalsLoading ? (
                <div className="py-3 space-y-1.5">{[...Array(3)].map((_, i) => <div key={i} className="h-8 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.02)" }} />)}</div>
              ) : (
                <>
                  {criticalSignals.slice(0, 3).map(s => (
                    <Link key={s.id} href="/signals">
                      <div className="py-2 cursor-pointer group" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
                        <div className="flex items-start gap-2">
                          <Dot sev="critical" pulse />
                          <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-medium line-clamp-1" style={{ color: TEXT.primary }}>{s.title}</div>
                            <div className="text-[8px] mt-0.5 font-mono" style={{ color: TEXT.muted }}>{s.source} · {timeAgo(s.receivedAt ?? s.createdAt)}</div>
                          </div>
                          <ChevronRight className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-30 transition-opacity" style={{ color: TEXT.tertiary }} />
                        </div>
                      </div>
                    </Link>
                  ))}
                  {highSignals.slice(0, 2).map(s => (
                    <Link key={s.id} href="/signals">
                      <div className="py-2 cursor-pointer group" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
                        <div className="flex items-start gap-2">
                          <Dot sev="high" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-medium line-clamp-1" style={{ color: "rgba(255,255,255,0.7)" }}>{s.title}</div>
                            <div className="text-[8px] mt-0.5 font-mono" style={{ color: TEXT.muted }}>{s.source} · {timeAgo(s.receivedAt ?? s.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {criticalSignals.length === 0 && highSignals.length === 0 && (
                    <div className="flex items-center gap-2 py-3">
                      <CheckCircle2 className="w-3 h-3" style={{ color: "#4a90b8" }} />
                      <span className="text-[9px]" style={{ color: TEXT.secondary }}>System nominal</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </Panel>

          <Panel accent="#8b7ac8">
            <PanelHead icon={Eye} title="Intelligence" accent="#8b7ac8" />
            <div className="px-3 py-1">
              {narratives.slice(0, 3).map((n: any, i: number) => (
                <div key={i} className="py-2" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
                  <div className="text-[9px] leading-relaxed line-clamp-2" style={{ color: TEXT.secondary }}>{n.summary || n.title || "Intelligence insight pending"}</div>
                  <div className="text-[7px] font-mono mt-1" style={{ color: "rgba(139,122,200,0.3)" }}>{n.priority ?? "medium"} · {n.timestamp ? timeAgo(n.timestamp) : "recent"}</div>
                </div>
              ))}
              {narratives.length === 0 && <div className="text-[9px] py-3" style={{ color: TEXT.muted }}>Intelligence engine processing...</div>}
            </div>
          </Panel>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-3">
          <Panel accent="#d4a054">
            <PanelHead icon={GitBranch} title="Correlations" accent="#d4a054" />
            <div className="px-3">
              {correlations.map((c, i) => (
                <div key={i} className="py-2 cursor-pointer hover:bg-white/[0.01] transition-colors" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Dot sev={c.sev} />
                    <span className="text-[9px] font-medium truncate" style={{ color: TEXT.secondary }}>{c.cluster}</span>
                    <span className="text-[8px] font-mono ml-auto shrink-0" style={{ color: c.sev === "critical" ? "#c45a4a" : "#c8953c" }}>{c.impact}</span>
                  </div>
                  <div className="flex gap-1 ml-3">
                    {c.entities.map(e => (
                      <span key={e} className="text-[7px] font-mono px-1 py-px rounded" style={{ color: TEXT.tertiary, background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER.subtle}` }}>{e}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHead icon={Shield} title="Platform Health" accent="#8b7ac8" />
            <div className="px-3 py-1">
              {platforms.map(p => (
                <div key={p.label} className="flex items-center justify-between py-1.5 text-[9px]" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
                  <span style={{ color: TEXT.tertiary }}>{p.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full" style={{ background: signalsLoading ? TEXT.muted : p.count === 0 ? "#6b8f71" : p.count <= 2 ? "#c8953c" : "#c45a4a" }} />
                    <span className="font-mono" style={{ color: signalsLoading ? TEXT.muted : p.count === 0 ? "#6b8f71" : p.count <= 2 ? "#c8953c" : "#c45a4a" }}>
                      {signalsLoading ? "—" : p.count === 0 ? "nominal" : `${p.count}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel accent="rgba(212,160,84,0.4)">
            <PanelHead icon={Zap} title="System State" accent="#d4a054" />
            <div className="px-3 py-1">
              {[
                { k: "Mode", v: dashError ? "Demo" : "Live", c: dashError ? "#c8953c" : "#6b8f71" },
                { k: "Last sync", v: dashboardData?.fetchedAt ? timeAgo(dashboardData.fetchedAt) : "—", c: TEXT.tertiary },
                { k: "Confidence", v: "High", c: "rgba(212,160,84,0.45)" },
                { k: "Sources", v: signalsLoading ? "—" : `${new Set(signals.map(s => s.source)).size}`, c: TEXT.tertiary },
                { k: "Refresh", v: "60s auto", c: TEXT.muted },
              ].map(r => (
                <div key={r.k} className="flex justify-between py-1.5 text-[9px]" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
                  <span style={{ color: TEXT.muted }}>{r.k}</span>
                  <span className="font-mono" style={{ color: r.c }}>{r.v}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <ActionLoop platformColor="#d4a054" actions={[
        { id: "1", label: "Investigate API heap memory alert", severity: "critical", type: "investigate" },
        { id: "2", label: "Resolve aged procurement approvals (14)", severity: "high", type: "approve" },
        { id: "3", label: "Assign owner to 8 orphaned processes", severity: "high", type: "assign" },
        { id: "4", label: "Review Salesforce pipeline stall ($400K)", severity: "critical", type: "investigate" },
        { id: "5", label: "Escalate vendor renewal gap to COO", severity: "medium", type: "escalate" },
      ]} />
    </div>
  );
}
