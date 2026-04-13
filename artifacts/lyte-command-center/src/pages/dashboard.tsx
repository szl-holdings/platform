// @ts-nocheck
import { useState, useEffect } from "react";
import React from "react";
import { analytics } from "@/lib/analytics";
import { DataProvenance, ActionLoop, RoleSelector } from "@szl-holdings/shared-ui";
import { SectionErrorBoundary } from "@szl-holdings/shared-ui/error-boundary";
import type { DataProvenanceInfo } from "@szl-holdings/shared-ui";
import { Link } from "wouter";
import {
  ChevronRight, Zap, Target, Activity,
  ArrowUpRight, RefreshCw, Shield, CheckCircle2, AlertTriangle, Radio,
  Eye, Gauge, Heart, FileText, GitBranch,
  UserCheck, Crosshair,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { api, type LyteSignal, type LyteDashboard, type LyteRecommendation } from "@/lib/api";
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

function ImpactBadge({ impact }: { impact: string }) {
  const isHigh = impact.startsWith("$") && (impact.includes("M") || (parseInt(impact.replace(/[^0-9]/g, "")) > 100000));
  return (
    <span className="text-[8px] font-mono px-1.5 py-px rounded" style={{ color: isHigh ? "#c45a4a" : "#c8953c", background: isHigh ? "rgba(196,90,74,0.06)" : "rgba(200,149,60,0.06)", border: `1px solid ${isHigh ? "rgba(196,90,74,0.15)" : "rgba(200,149,60,0.15)"}` }}>
      {impact}
    </span>
  );
}

function ConfidenceBar({ level }: { level: "high" | "medium" | "low" }) {
  const w = level === "high" ? "85%" : level === "medium" ? "55%" : "30%";
  const c = level === "high" ? "#6b8f71" : level === "medium" ? "#c8953c" : "#c45a4a";
  return (
    <div className="flex items-center gap-1">
      <div className="w-10 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full" style={{ width: w, background: c }} />
      </div>
      <span className="text-[7px] font-mono" style={{ color: c }}>{level}</span>
    </div>
  );
}

function Panel({ children, accent, className = "" }: { children: React.ReactNode; accent?: string; className?: string }) {
  return (
    <div className={cn("rounded-md overflow-hidden", className)} style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
      {accent && <div className="h-px" style={{ background: accent }} />}
      {children}
    </div>
  );
}

function PanelHead({ icon: Icon, title, right, accent }: { icon: React.ElementType; title: string; right?: React.ReactNode; accent?: string }) {
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
  { key: "P", name: "Pulse", icon: Heart, color: "#d4a054", href: "/prism/pulse", score: 72 },
  { key: "R", name: "Risk", icon: AlertTriangle, color: "#c45a4a", href: "/prism/risk", score: 41 },
  { key: "I", name: "Intelligence", icon: Eye, color: "#8b7ac8", href: "/prism/intelligence", score: 68 },
  { key: "S", name: "Signals", icon: Radio, color: "#c8953c", href: "/prism/signals", score: 55 },
  { key: "M", name: "Motion", icon: Gauge, color: "#4a90b8", href: "/prism/motion", score: 63 },
];


export default function Dashboard() {
  const [activeRole, setActiveRole] = useState("operator");
  const [auditSignal, setAuditSignal] = useState<LyteSignal | null>(null);

  useEffect(() => {
    const start = Date.now();
    return () => {
      analytics.dashboardViewed("main", Date.now() - start);
    };
  }, []);

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

  const { data: recommendationsData = [] } = useQuery<LyteRecommendation[]>({
    queryKey: ["lyte-recommendations"],
    queryFn: () => api.recommendations.list(),
    staleTime: 120_000,
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

  const narratives = insightsData?.narratives ?? [];

  const metrics = [
    { label: "Critical Exposures", value: isLoading ? "—" : (summary?.criticalUnresolved ?? criticalSignals.length), color: "#c45a4a", pulse: true, sub: "live" },
    { label: "Aged Approvals", value: isLoading ? "—" : (summary?.agedApprovals != null ? String(summary.agedApprovals) : "—"), color: "#c8953c", sub: ">48h" },
    { label: "Ownership Gaps", value: isLoading ? "—" : (summary?.ownershipGaps != null ? String(summary.ownershipGaps) : "—"), color: "#d4a054", sub: "unassigned" },
    { label: "Active Signals", value: isLoading ? "—" : (summary?.totalSignals ?? signals.length), color: TEXT.secondary, sub: "total" },
    { label: "Value at Risk", value: isLoading ? "—" : (summary?.valueAtRisk ?? "—"), color: "#c45a4a", sub: "estimated" },
    { label: "Decision Latency", value: isLoading ? "—" : (summary?.decisionLatency ?? "—"), color: "#c8953c", sub: "avg" },
  ];

  const queue = [
    ...criticalSignals.slice(0, 3).map(s => ({
      title: s.title, severity: s.severity, owner: (s.metadata?.affectedFunction as string | undefined) ?? "Unassigned",
      time: timeAgo(s.receivedAt ?? s.createdAt), confidence: "high" as const, source: s.source, action: "Investigate",
      impact: "$80K+", signal: s,
    })),
    ...highSignals.slice(0, 3).map(s => ({
      title: s.title, severity: s.severity, owner: (s.metadata?.affectedFunction as string | undefined) ?? "Unassigned",
      time: timeAgo(s.receivedAt ?? s.createdAt), confidence: "medium" as const, source: s.source, action: "Review",
      impact: "$20K+", signal: s,
    })),
  ];

  const correlations = dashboardData?.correlations ?? [];

  const platforms = [
    { label: "API Server", count: signals.filter(s => s.source.toLowerCase().includes("api") && s.status !== "resolved").length },
    { label: "Vessels", count: signals.filter(s => s.source.toLowerCase().includes("vessel") && s.status !== "resolved").length },
    { label: "Aegis SOC", count: signals.filter(s => (s.source.toLowerCase().includes("firestorm") || s.source.toLowerCase().includes("aegis")) && s.status !== "resolved").length },
    { label: "Terra", count: signals.filter(s => (s.source.toLowerCase().includes("terra") || s.source.toLowerCase().includes("beacon")) && s.status !== "resolved").length },
  ];

  const prismComposite = Math.round(PRISM.reduce((s, p) => s + p.score, 0) / PRISM.length);

  return (
    <div className="p-3 lg:p-4 space-y-3" style={{ maxWidth: 1440 }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-[13px] font-semibold tracking-tight" style={{ color: TEXT.primary }}>Command Overview</h1>
          <span className="text-[9px] font-mono px-2 py-px rounded" style={{ color: "#c45a4a", background: "rgba(196,90,74,0.06)", border: "1px solid rgba(196,90,74,0.12)" }}>
            LIVE
          </span>
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

      {/* KPI Strip — dense cockpit style */}
      <SectionErrorBoundary sectionName="KPI Strip">
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-px rounded overflow-hidden" style={{ background: BORDER.subtle }}>
        {metrics.map(m => (
          <div key={m.label} className="px-3 py-2.5 relative" style={{ background: BG.surface }}>
            <div className="text-[8px] uppercase tracking-widest font-medium mb-1" style={{ color: TEXT.muted }}>{m.label}</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono leading-none" style={{ color: m.color }}>{m.value}</span>
              {m.sub && <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>{m.sub}</span>}
              {m.pulse && typeof m.value === "number" && m.value > 0 && <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: "#c45a4a" }} />}
            </div>
          </div>
        ))}
      </div>
      </SectionErrorBoundary>

      {/* PRISM strip with scores */}
      <SectionErrorBoundary sectionName="PRISM Strip">
      <div className="grid grid-cols-5 gap-1.5">
        {PRISM.map(p => {
          const scoreColor = p.score >= 70 ? "#6b8f71" : p.score >= 50 ? "#c8953c" : "#c45a4a";
          return (
            <Link key={p.key} href={p.href}>
              <div className="rounded px-3 py-2 cursor-pointer transition-all group relative overflow-hidden" style={{ background: BG.surface, border: `1px solid ${p.color}14` }}>
                <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: p.color, opacity: 0.5 }} />
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-black font-mono" style={{ color: p.color }}>{p.key}</span>
                  <span className="text-[10px] font-semibold" style={{ color: TEXT.primary }}>{p.name}</span>
                  <p.icon size={10} className="ml-auto opacity-30 group-hover:opacity-60 transition-opacity" style={{ color: p.color }} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="h-full rounded-full" style={{ width: `${p.score}%`, background: scoreColor }} />
                  </div>
                  <span className="text-[9px] font-mono shrink-0" style={{ color: scoreColor }}>{p.score}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      </SectionErrorBoundary>

      {/* Role context bar */}
      {activeRole && (
        <div className="rounded px-3 py-1.5 flex items-center gap-3" style={{ background: BG.surface, borderLeft: `2px solid ${activeRole === "analyst" ? "#8b7ac8" : activeRole === "buyer" ? "#4a90b8" : "#d4a054"}` }}>
          <span className="text-[8px] uppercase tracking-widest font-mono shrink-0" style={{ color: TEXT.muted }}>{activeRole === "buyer" ? "demo" : activeRole}</span>
          <span className="text-[10px]" style={{ color: TEXT.secondary }}>
            {activeRole === "executive" && `${criticalSignals.length} critical. ${highSignals.length} high. PRISM composite ${prismComposite}/100. Decision latency 34h.`}
            {activeRole === "operator" && `${criticalSignals.length} critical in triage. ${summary?.openActions ?? 0} open actions. ${summary?.openIncidents ?? 0} incidents. 14 approvals aged >48h.`}
            {activeRole === "analyst" && `${signals.length} signals across ${new Set(signals.map(s => s.source)).size} sources. ${criticalSignals.length} critical, ${highSignals.length} high. $5.03M exposure.`}
            {activeRole === "buyer" && "Viewing Lyte with sample data. Signals and actions demonstrate intelligence from your existing tools."}
          </span>
          <Link href="/approvals" className="shrink-0 ml-auto text-[8px] px-2 py-px rounded font-mono hover:opacity-80" style={{ color: "#c8953c", background: "rgba(200,149,60,0.06)", border: "1px solid rgba(200,149,60,0.12)" }}>
            14 Approvals →
          </Link>
        </div>
      )}

      {/* Main grid */}
      <SectionErrorBoundary sectionName="Signal Intelligence Grid">
      <div className="grid grid-cols-12 gap-3">

        {/* Left column — priority actions + signal timeline */}
        <div className="col-span-12 lg:col-span-5 space-y-3">
          <Panel accent="#c45a4a">
            <PanelHead icon={Target} title="Priority Action Queue" accent="#c45a4a" right={
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono px-1.5 py-px rounded" style={{ color: "#c45a4a", background: "rgba(196,90,74,0.06)", border: "1px solid rgba(196,90,74,0.12)" }}>HITL Required</span>
                <Link href="/approvals" className="text-[9px] font-mono flex items-center gap-0.5 hover:opacity-80" style={{ color: TEXT.tertiary }}>All <ArrowUpRight className="w-2.5 h-2.5" /></Link>
              </div>
            } />
            <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
              {queue.length > 0 ? queue.slice(0, 5).map((a, i) => (
                <div key={i} className="px-3 py-2.5 hover:bg-white/[0.015] transition-colors cursor-pointer" onClick={() => setAuditSignal(a.signal)}>
                  <div className="flex items-start gap-2">
                    <Dot sev={a.severity} pulse={a.severity === "critical"} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium leading-snug line-clamp-1 mb-1" style={{ color: TEXT.primary }}>{a.title}</div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge sev={a.severity} />
                        <ImpactBadge impact={a.impact} />
                        <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>{a.time}</span>
                        <span style={{ color: TEXT.muted }}>·</span>
                        <span className="text-[8px]" style={{ color: TEXT.tertiary }}>{a.owner}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>via {a.source}</span>
                          <ConfidenceBar level={a.confidence} />
                        </div>
                        <span className="text-[8px] font-semibold px-1.5 py-px rounded" style={{ color: "#d4a054", background: "rgba(212,160,84,0.06)", border: `1px solid rgba(212,160,84,0.1)` }}>{a.action} →</span>
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

          {/* Recommended Actions */}
          <Panel accent="#8b7ac8">
            <PanelHead icon={Crosshair} title="Recommended Actions" accent="#8b7ac8" right={
              <span className="text-[8px] font-mono" style={{ color: "rgba(139,122,200,0.5)" }}>AI-scored</span>
            } />
            <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
              {recommendationsData.length === 0 ? (
                <div className="px-3 py-4 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" style={{ color: "#4a90b8" }} />
                  <span className="text-[10px]" style={{ color: TEXT.secondary }}>No recommendations — connect integrations to generate actions</span>
                </div>
              ) : (
                recommendationsData.slice(0, 4).map((a) => (
                  <div key={a.id} className="px-3 py-2 hover:bg-white/[0.015] transition-colors cursor-pointer">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <Dot sev={a.category === "critical" ? "critical" : "high"} pulse={a.category === "critical"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-medium line-clamp-1 mb-1" style={{ color: TEXT.primary }}>{a.title}</div>
                        <div className="flex items-center gap-1.5">
                          <ImpactBadge impact={a.impact} />
                          <span className="text-[8px] font-mono capitalize" style={{ color: TEXT.muted }}>{a.effort} effort</span>
                        </div>
                      </div>
                      <button className="shrink-0 text-[8px] px-2 py-px rounded font-mono hover:opacity-80" style={{ color: "#8b7ac8", background: "rgba(139,122,200,0.08)", border: "1px solid rgba(139,122,200,0.15)" }}>
                        Review
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        {/* Center column */}
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

          {/* Signal timeline */}
          <Panel accent="#c8953c">
            <PanelHead icon={Radio} title="Signal Timeline" accent="#c8953c" right={
              <Link href="/signals" className="text-[9px] font-mono flex items-center gap-0.5 hover:opacity-80" style={{ color: TEXT.tertiary }}>Feed <ArrowUpRight className="w-2.5 h-2.5" /></Link>
            } />
            <div className="px-3">
              {recentSignals.length === 0 ? (
                <div className="flex items-center gap-2 py-4 justify-center">
                  <CheckCircle2 className="w-3 h-3" style={{ color: "#6b8f71" }} />
                  <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>No recent signals — system quiet</span>
                </div>
              ) : recentSignals.slice(0, 7).map(s => (
                <div key={s.id} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-white/[0.01] transition-colors" style={{ borderBottom: `1px solid ${BORDER.subtle}` }} onClick={() => setAuditSignal(s)}>
                  <Dot sev={s.severity} pulse={s.severity === "critical"} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] truncate block" style={{ color: TEXT.secondary }}>{s.title}</span>
                    <span className="text-[7px] font-mono" style={{ color: TEXT.muted }}>{s.source}</span>
                  </div>
                  <span className="text-[8px] font-mono shrink-0" style={{ color: TEXT.muted }}>{timeAgo(s.receivedAt ?? s.createdAt)}</span>
                  <span className="text-[7px] font-mono px-1 py-px rounded uppercase shrink-0" style={{
                    color: s.status === "resolved" ? "rgba(74,144,184,0.5)" : s.status === "acknowledged" ? "rgba(139,122,200,0.4)" : TEXT.muted,
                    background: s.status === "resolved" ? "rgba(74,144,184,0.04)" : s.status === "acknowledged" ? "rgba(139,122,200,0.04)" : "rgba(255,255,255,0.02)",
                  }}>{s.status}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Intelligence */}
          <Panel accent="#8b7ac8">
            <PanelHead icon={Eye} title="Intelligence" accent="#8b7ac8" />
            <div className="px-3 py-1">
              {narratives.slice(0, 3).map((n, i: number) => (
                <div key={i} className="py-2" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
                  <div className="text-[9px] leading-relaxed line-clamp-2" style={{ color: TEXT.secondary }}>{n.headline || n.detail || "Intelligence insight pending"}</div>
                  <div className="text-[7px] font-mono mt-1" style={{ color: "rgba(139,122,200,0.3)" }}>{n.priority ?? "medium"} · recent</div>
                </div>
              ))}
              {narratives.length === 0 && <div className="text-[9px] py-3" style={{ color: TEXT.muted }}>Intelligence engine processing...</div>}
            </div>
          </Panel>
        </div>

        {/* Right column */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
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
                    <div key={s.id} className="py-2 cursor-pointer group" style={{ borderBottom: `1px solid ${BORDER.subtle}` }} onClick={() => setAuditSignal(s)}>
                      <div className="flex items-start gap-2">
                        <Dot sev="critical" pulse />
                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] font-medium line-clamp-1" style={{ color: TEXT.primary }}>{s.title}</div>
                          <div className="text-[8px] mt-0.5 font-mono" style={{ color: TEXT.muted }}>{s.source} · {timeAgo(s.receivedAt ?? s.createdAt)}</div>
                        </div>
                        <ChevronRight className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-30 transition-opacity" style={{ color: TEXT.tertiary }} />
                      </div>
                    </div>
                  ))}
                  {highSignals.slice(0, 2).map(s => (
                    <div key={s.id} className="py-2 cursor-pointer group" style={{ borderBottom: `1px solid ${BORDER.subtle}` }} onClick={() => setAuditSignal(s)}>
                      <div className="flex items-start gap-2">
                        <Dot sev="high" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] font-medium line-clamp-1" style={{ color: "rgba(255,255,255,0.7)" }}>{s.title}</div>
                          <div className="text-[8px] mt-0.5 font-mono" style={{ color: TEXT.muted }}>{s.source} · {timeAgo(s.receivedAt ?? s.createdAt)}</div>
                        </div>
                      </div>
                    </div>
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

          <Panel accent="#d4a054">
            <PanelHead icon={GitBranch} title="Correlations" accent="#d4a054" />
            <div className="px-3">
              {correlations.length === 0 ? (
                <div className="py-4 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" style={{ color: "#6b8f71" }} />
                  <span className="text-[9px]" style={{ color: TEXT.secondary }}>No cross-signal correlations detected</span>
                </div>
              ) : (
                correlations.map((c, i) => (
                  <div key={i} className="py-2 cursor-pointer hover:bg-white/[0.01] transition-colors" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Dot sev={c.sev} />
                      <span className="text-[9px] font-medium truncate flex-1" style={{ color: TEXT.secondary }}>{c.cluster}</span>
                      <ImpactBadge impact={c.impact} />
                    </div>
                    <div className="flex gap-1 ml-3">
                      {c.entities.map(e => (
                        <span key={e} className="text-[7px] font-mono px-1 py-px rounded" style={{ color: TEXT.tertiary, background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER.subtle}` }}>{e}</span>
                      ))}
                    </div>
                  </div>
                ))
              )}
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

      <CausalAIPanel />

      {/* Audit Trace Drawer */}
      {auditSignal && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setAuditSignal(null)}>
          <div className="flex-1 bg-black/50" />
          <div
            className="w-full max-w-md flex flex-col h-full overflow-y-auto"
            style={{ background: "#090d15", borderLeft: `1px solid rgba(255,255,255,0.08)` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 flex items-start justify-between" style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
              <div>
                <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: "#d4a054" }}>Audit Trace</div>
                <h2 className="text-sm font-bold text-white leading-snug">{auditSignal.title}</h2>
                <p className="text-[10px] mt-1" style={{ color: TEXT.tertiary }}>{auditSignal.source} · {auditSignal.sourceType}</p>
              </div>
              <button onClick={() => setAuditSignal(null)} className="text-slate-500 hover:text-white text-sm shrink-0 ml-4">✕</button>
            </div>
            <div className="px-5 py-4 space-y-4 flex-1">
              {/* Severity + status */}
              <div className="flex items-center gap-2">
                <Badge sev={auditSignal.severity} />
                <span className="text-[8px] font-mono px-1.5 py-px rounded uppercase" style={{ color: auditSignal.status === "resolved" ? "#6b8f71" : auditSignal.status === "acknowledged" ? "#8b7ac8" : "#c45a4a", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>{auditSignal.status}</span>
              </div>

              {/* Immutable event log */}
              <div>
                <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: TEXT.muted }}>Event Log — Immutable</div>
                <div className="relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <div className="space-y-3">
                    {(
                      [
                        { icon: Radio, color: "#c8953c", label: "Signal Detected", detail: `Source: ${auditSignal.source}`, time: auditSignal.receivedAt ?? auditSignal.createdAt, done: true },
                        { icon: Eye, color: "#8b7ac8", label: "Context Enriched", detail: "Cross-referenced with 3 related signals · PRISM Risk lens scored", time: auditSignal.receivedAt ?? auditSignal.createdAt, done: true },
                        { icon: Zap, color: "#d4a054", label: "Recommendation Generated", detail: "Action recommended with high confidence", time: auditSignal.receivedAt ?? auditSignal.createdAt, done: true },
                        { icon: UserCheck, color: "#4a90b8", label: "Approval Requested", detail: "HITL gate triggered — awaiting operator sign-off", time: auditSignal.receivedAt ?? auditSignal.createdAt, done: auditSignal.status !== "new" },
                        { icon: CheckCircle2, color: "#6b8f71", label: "Action Taken", detail: auditSignal.status === "resolved" ? "Resolved by operator" : "Pending approval", time: auditSignal.status === "resolved" ? auditSignal.createdAt : null, done: auditSignal.status === "resolved" },
                        { icon: FileText, color: TEXT.tertiary, label: "Result Logged", detail: "Outcome recorded in immutable audit trail", time: null, done: auditSignal.status === "resolved" },
                      ] as Array<{ icon: React.ElementType; color: string; label: string; detail: string; time: string | null; done: boolean }>
                    ).map((step, si) => {
                      const Icon = step.icon;
                      return (
                        <div key={si} className="flex items-start gap-3">
                          <div className="w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center z-10 mt-0.5" style={{ background: step.done ? `${step.color}18` : "rgba(255,255,255,0.03)", border: `1px solid ${step.done ? step.color + "40" : "rgba(255,255,255,0.06)"}` }}>
                            <Icon className="w-2 h-2" style={{ color: step.done ? step.color : TEXT.muted }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-medium" style={{ color: step.done ? TEXT.primary : TEXT.muted }}>{step.label}</div>
                            <div className="text-[8px] mt-0.5" style={{ color: TEXT.muted }}>{step.detail}</div>
                            {step.time && <div className="text-[7px] font-mono mt-0.5" style={{ color: TEXT.muted }}>{new Date(step.time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>}
                          </div>
                          {!step.done && <span className="text-[7px] font-mono px-1 py-px rounded" style={{ color: TEXT.muted, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>pending</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {auditSignal.status !== "resolved" && (
                <div className="pt-2" style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
                  <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: TEXT.muted }}>Operator Actions</div>
                  <div className="flex gap-2 flex-wrap">
                    <button className="text-[10px] px-3 py-1.5 rounded font-medium hover:opacity-80" style={{ color: "#6b8f71", background: "rgba(107,143,113,0.1)", border: "1px solid rgba(107,143,113,0.25)" }}>Approve</button>
                    <button className="text-[10px] px-3 py-1.5 rounded font-medium hover:opacity-80" style={{ color: "#8b7ac8", background: "rgba(139,122,200,0.1)", border: "1px solid rgba(139,122,200,0.25)" }}>Escalate</button>
                    <button className="text-[10px] px-3 py-1.5 rounded font-medium hover:opacity-80" style={{ color: TEXT.secondary, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>Defer</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SectionErrorBoundary>
    </div>
  );
}

type LyteCausalGraph = {
  incident_id: string;
  root_cause_id: string;
  root_cause_service: string;
  root_cause_type: string;
  root_cause_description: string;
  confidence: number;
  affected_services: string[];
  computed_at: string;
};

function CausalAIPanel() {
  const causalGraphs = useQuery({
    queryKey: ["lyte-causal-graphs"],
    queryFn: async () => {
      const res = await fetch("/api/lyte/causal-graphs");
      if (!res.ok) throw new Error("fetch failed");
      return res.json() as Promise<LyteCausalGraph[]>;
    },
    staleTime: 60000,
    retry: false,
  });

  const predictiveAlerts = useQuery({
    queryKey: ["lyte-predictive-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/lyte/predictive-alerts");
      if (!res.ok) throw new Error("fetch failed");
      return res.json() as Promise<{ alerts: Array<{ alert_id: string; service: string; slo_type: string; breach_probability: number; time_to_breach_minutes: number; trend_direction: string; contributing_factors: string[] }>; count: number; source: string }>;
    },
    staleTime: 30000,
    retry: false,
  });

  const graphs = causalGraphs.data;
  const alerts = predictiveAlerts.data;

  return (
    <div className="mx-4 mb-4 rounded-xl border p-4 space-y-4" style={{ borderColor: "rgba(212,160,84,0.2)", background: "rgba(212,160,84,0.03)" }}>
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4" style={{ color: "#d4a054" }} />
        <span className="text-sm font-semibold text-white">Causal AI & Predictive SLO · 2026</span>
        <span className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase" style={{ background: "rgba(212,160,84,0.1)", color: "#d4a054", border: "1px solid rgba(212,160,84,0.2)" }}>Autonomous</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[9px] uppercase tracking-widest font-medium mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Causal Root Analysis</div>
          {graphs && graphs.length > 0 ? (
            <div className="space-y-2">
              {graphs.slice(0, 3).map(g => (
                <div key={g.root_cause_id} className="rounded p-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="text-[10px] truncate font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{g.root_cause_service}</div>
                  <div className="text-[9px] mt-0.5 truncate" style={{ color: "rgba(212,160,84,0.7)" }}>{g.root_cause_type.replace(/_/g, " ")}</div>
                  <div className="text-[8px] font-mono mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>{Math.round(Number(g.confidence) * 100)}% confidence</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{causalGraphs.isLoading ? "Analyzing..." : "No causal graphs — run POST /lyte/causal-analysis to generate"}</div>
          )}
        </div>

        <div>
          <div className="text-[9px] uppercase tracking-widest font-medium mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>SLO Breach Predictions</div>
          {alerts ? (
            <div className="space-y-1.5">
              {alerts.alerts.slice(0, 4).map(a => (
                <div key={a.alert_id} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: a.breach_probability >= 0.8 ? "#ef4444" : a.breach_probability >= 0.6 ? "#f97316" : "#f59e0b" }} />
                  <span className="text-[10px] flex-1 truncate" style={{ color: "rgba(255,255,255,0.6)" }}>{a.service}</span>
                  <span className="text-[8px] font-mono" style={{ color: a.breach_probability >= 0.8 ? "#ef4444" : "#f59e0b" }}>{Math.round(a.breach_probability * 100)}%</span>
                  <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.25)" }}>{a.time_to_breach_minutes}m</span>
                </div>
              ))}
              {alerts.count === 0 && <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>No active SLO threats</div>}
            </div>
          ) : (
            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{predictiveAlerts.isLoading ? "Loading..." : "No predictions"}</div>
          )}
        </div>
      </div>
    </div>
  );
}
