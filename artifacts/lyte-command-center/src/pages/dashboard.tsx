import { useState } from "react";
import { ActivityFeed } from "@workspace/shared-ui/collaboration";
import { DataProvenance, ActionLoop, RoleSelector } from "@workspace/shared-ui";
import type { DataProvenanceInfo } from "@workspace/shared-ui";
import { Link } from "wouter";
import { TrendingDown, TrendingUp, ChevronRight, Clock, Zap, Target, Activity, ArrowUpRight, RefreshCw, Shield, CheckCircle2 } from "lucide-react";
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

function SeverityBadge({ severity }: { severity: string }) {
  const sev = (["critical", "high", "medium", "low", "stable"].includes(severity) ? severity : "medium") as SignalSeverity;
  const c = severityColors[sev];
  return (
    <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wide", c.text, c.bg, c.border)}>
      {severity}
    </span>
  );
}

function LiveSignalCard({ signal }: { signal: LyteSignal }) {
  const sev = (["critical", "high", "medium", "low"].includes(signal.severity) ? signal.severity : "medium") as SignalSeverity;
  const c = severityColors[sev];
  const meta = (signal.metadata ?? {}) as Record<string, unknown>;
  return (
    <Link href={`/signals`}>
      <div className={cn("rounded-lg p-3 border bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer group", c.border)}>
        <div className="flex items-start gap-2.5">
          <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", c.dot, sev === "critical" && "animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]")} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-[11px] font-medium text-white/90 leading-tight line-clamp-2">{signal.title}</span>
              <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 shrink-0 mt-0.5 transition-colors" />
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className={c.text}>{signal.source}</span>
              <span className="text-slate-600">•</span>
              <span>{(meta.affectedFunction as string) ?? signal.sourceType}</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-slate-400">{timeAgo(signal.receivedAt ?? signal.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [showDetails, setShowDetails] = useState(false);
  const [activeRole, setActiveRole] = useState("operator");

  const { data: dashboardData, isLoading: dashLoading, error: dashError, refetch: refetchDash } = useQuery<LyteDashboard>({
    queryKey: ["lyte-dashboard"],
    queryFn: () => api.dashboard(),
    refetchInterval: 60_000,
  });

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
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

  const isLoading = dashLoading || signalsLoading;

  const kpiCards = [
    {
      label: "Total Signals",
      value: isLoading ? "—" : (summary?.totalSignals ?? signals.length),
      sublabel: `${criticalSignals.length} critical unresolved`,
      severity: criticalSignals.length > 0 ? "critical" : "low" as SignalSeverity,
      trend: criticalSignals.length > 2 ? "up" : "down",
      trendLabel: criticalSignals.length > 2 ? "Needs attention" : "Under control",
    },
    {
      label: "Open Incidents",
      value: isLoading ? "—" : (summary?.openIncidents ?? "—"),
      sublabel: "Active investigations",
      severity: (summary?.openIncidents ?? 0) > 3 ? "high" : "medium" as SignalSeverity,
      trend: (summary?.openIncidents ?? 0) > 2 ? "up" : "down",
      trendLabel: (summary?.openIncidents ?? 0) > 2 ? "Rising" : "Stable",
    },
    {
      label: "Open Actions",
      value: isLoading ? "—" : (summary?.openActions ?? "—"),
      sublabel: "Requiring resolution",
      severity: (summary?.openActions ?? 0) > 5 ? "high" : "medium" as SignalSeverity,
      trend: "neutral",
      trendLabel: "In progress",
    },
    {
      label: "Readiness Score",
      value: isLoading ? "—" : `${summary?.readinessScore ?? 0}%`,
      sublabel: "Platform readiness",
      severity: (summary?.readinessScore ?? 0) > 80 ? "low" : (summary?.readinessScore ?? 0) > 60 ? "medium" : "high" as SignalSeverity,
      trend: (summary?.readinessScore ?? 0) > 70 ? "down" : "up",
      trendLabel: (summary?.readinessScore ?? 0) > 70 ? "Healthy" : "Needs work",
    },
    {
      label: "Pending Recommendations",
      value: isLoading ? "—" : (summary?.pendingRecommendations ?? "—"),
      sublabel: "Awaiting action",
      severity: "medium" as SignalSeverity,
      trend: "neutral",
      trendLabel: "Review queue",
    },
  ];

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">Command Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Live SZL platform health · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            {dashboardData?.fetchedAt && (
              <span className="ml-2 text-slate-600">· updated {timeAgo(dashboardData.fetchedAt)}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dashError && (
            <span className="text-[10px] text-red-400 font-mono bg-red-500/10 border border-red-500/20 px-2 py-1 rounded">Dashboard API error</span>
          )}
          <button
            onClick={() => refetchDash()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
          >
            <RefreshCw className={cn("w-3 h-3", dashLoading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <RoleSelector currentRole={activeRole} onRoleChange={setActiveRole} />
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

      {activeRole === "executive" && (
        <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
          <div className="text-[10px] uppercase tracking-wider text-amber-400/60 font-semibold mb-2">Executive Briefing</div>
          <div className="text-[13px] text-white/80 leading-relaxed">
            {criticalSignals.length > 0
              ? `${criticalSignals.length} critical signal${criticalSignals.length > 1 ? "s" : ""} require immediate attention. ${highSignals.length} high-severity items in queue. Portfolio readiness at ${summary?.readinessScore ?? 0}%.`
              : `No critical signals active. ${highSignals.length > 0 ? `${highSignals.length} high-severity items under monitoring.` : "All systems nominal."} Portfolio readiness at ${summary?.readinessScore ?? 0}%.`}
          </div>
        </div>
      )}

      {activeRole === "operator" && (
        <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
          <div className="text-[10px] uppercase tracking-wider text-amber-400/60 font-semibold mb-2">Operator Focus</div>
          <div className="text-[13px] text-white/80 leading-relaxed">
            {criticalSignals.length > 0 ? `${criticalSignals.length} critical signal${criticalSignals.length > 1 ? "s" : ""} in triage queue.` : "No critical signals in queue."} {highSignals.length > 0 ? `${highSignals.length} high-severity items under active monitoring.` : ""} {(summary?.openActions ?? 0) > 0 ? `${summary?.openActions} open actions requiring resolution.` : "No pending actions."} Platform readiness at {summary?.readinessScore ?? 0}%.
          </div>
        </div>
      )}

      {activeRole === "analyst" && (
        <div className="rounded-xl border border-violet-500/15 bg-violet-500/5 p-4">
          <div className="text-[10px] uppercase tracking-wider text-violet-400/60 font-semibold mb-2">Signal Analysis</div>
          <div className="text-[13px] text-white/80 leading-relaxed">
            {signals.length} total signals ingested. Distribution: {criticalSignals.length} critical, {highSignals.length} high, {signals.filter(s => s.severity === "medium").length} medium. Source diversity across {new Set(signals.map(s => s.source)).size} connectors. Review 7-day trend for volume anomalies and emerging patterns.
          </div>
        </div>
      )}

      {activeRole === "buyer" && (
        <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-4">
          <div className="text-[10px] uppercase tracking-wider text-blue-400/60 font-semibold mb-2">Product Demo View</div>
          <div className="text-[13px] text-white/80 leading-relaxed">
            You're viewing Lyte's Business Observability platform with sample data. Every signal, risk, and action you see represents the kind of operational intelligence Lyte surfaces from your existing tools — Salesforce, ServiceNow, Jira, Slack, and more.
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {kpiCards.map((kpi, i) => {
          const c = severityColors[kpi.severity];
          const isNeg = kpi.trend === "up";
          return (
            <div key={i} className={cn("rounded-xl p-4 border bg-white/[0.03] hover:bg-white/[0.05] transition-all", c.border)}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-[11px] text-slate-400 font-medium leading-tight">{kpi.label}</span>
                {kpi.trend !== "neutral" && (
                  <span className={cn("text-[10px] font-mono flex items-center gap-0.5", isNeg ? "text-red-400" : "text-emerald-400")}>
                    {isNeg ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  </span>
                )}
              </div>
              <div className={cn("text-xl font-display font-bold mb-1", c.text)}>{kpi.value}</div>
              {kpi.sublabel && <div className="text-[10px] text-slate-500">{kpi.sublabel}</div>}
              <div className="text-[10px] text-slate-600 mt-1">{kpi.trendLabel}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-400" />
                Active Signals
                <span className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono uppercase">Live</span>
              </h2>
              <Link href="/signals" className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {signalsLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-white/[0.02] border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {criticalSignals.slice(0, 4).map(s => <LiveSignalCard key={s.id} signal={s} />)}
                {highSignals.slice(0, 3).map(s => <LiveSignalCard key={s.id} signal={s} />)}
                {criticalSignals.length === 0 && highSignals.length === 0 && (
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[12px] text-emerald-300">No critical or high severity signals — system nominal</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                Signal Volume Trend
              </h2>
              <span className="text-[10px] text-slate-500">Past 7 days</span>
            </div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signalTrendData}>
                  <defs>
                    <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <Area type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={1.5} fill="url(#critGrad)" dot={false} />
                  <Area type="monotone" dataKey="high" stroke="#f97316" strokeWidth={1.5} fill="url(#highGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                Recent Signals
              </h2>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showDetails ? "Less" : "More"} details
              </button>
            </div>
            <div className="space-y-2">
              {recentSignals.slice(0, 6).map(s => {
                const sev = (["critical", "high", "medium", "low"].includes(s.severity) ? s.severity : "medium") as SignalSeverity;
                const c = severityColors[sev];
                return (
                  <div key={s.id} className="flex items-center justify-between text-[11px] p-2.5 rounded-lg border border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot)} />
                      <SeverityBadge severity={s.severity} />
                      <span className="text-slate-300 truncate">{s.title}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2 text-slate-500">
                      {showDetails && <span className="hidden xl:block">{s.source}</span>}
                      <span className="font-mono">{timeAgo(s.receivedAt ?? s.createdAt)}</span>
                      <span className={cn(
                        "text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase",
                        s.status === "resolved" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                        s.status === "acknowledged" ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" :
                        "text-slate-400 bg-white/5 border-white/10"
                      )}>{s.status}</span>
                    </div>
                  </div>
                );
              })}
              {recentSignals.length === 0 && !isLoading && (
                <div className="text-center py-4 text-slate-500 text-sm">No signals yet</div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                Actions Required
              </h2>
              <Link href="/action-center" className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                All <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg border border-amber-500/15 bg-amber-500/5">
                <div className="text-[10px] text-slate-400 mb-1">Open</div>
                <div className="font-display font-bold text-xl text-amber-300">{isLoading ? "—" : (summary?.openActions ?? "—")}</div>
              </div>
              <div className="p-3 rounded-lg border border-red-500/15 bg-red-500/5">
                <div className="text-[10px] text-slate-400 mb-1">Critical</div>
                <div className="font-display font-bold text-xl text-red-300">{isLoading ? "—" : (summary?.criticalUnresolved ?? criticalSignals.length)}</div>
              </div>
              <div className="p-3 rounded-lg border border-violet-500/15 bg-violet-500/5">
                <div className="text-[10px] text-slate-400 mb-1">Incidents</div>
                <div className="font-display font-bold text-xl text-violet-300">{isLoading ? "—" : (summary?.openIncidents ?? "—")}</div>
              </div>
              <div className="p-3 rounded-lg border border-cyan-500/15 bg-cyan-500/5">
                <div className="text-[10px] text-slate-400 mb-1">Readiness</div>
                <div className="font-display font-bold text-xl text-cyan-300">{isLoading ? "—" : `${summary?.readinessScore ?? 0}%`}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-violet-400" />
                Platform Health
              </h2>
              <Link href="/signals" className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                Signals <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {[
                { label: "API Server", count: signals.filter(s => s.source.toLowerCase().includes("api") && s.status !== "resolved").length },
                { label: "Vessels", count: signals.filter(s => s.source.toLowerCase().includes("vessel") && s.status !== "resolved").length },
                { label: "Aegis SOC", count: signals.filter(s => (s.source.toLowerCase().includes("firestorm") || s.source.toLowerCase().includes("aegis")) && s.status !== "resolved").length },
                { label: "Aegis Ops", count: signals.filter(s => (s.source.toLowerCase().includes("msp") || s.source.toLowerCase().includes("rosie")) && s.status !== "resolved").length },
                { label: "Aegis Intel", count: signals.filter(s => s.source.toLowerCase().includes("inca") && s.status !== "resolved").length },
                { label: "Terra/Beacon", count: signals.filter(s => (s.source.toLowerCase().includes("terra") || s.source.toLowerCase().includes("beacon")) && s.status !== "resolved").length },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{item.label}</span>
                  <span className={cn(
                    "font-mono font-medium",
                    item.count === 0 ? "text-emerald-400" : item.count <= 2 ? "text-amber-400" : "text-red-400"
                  )}>
                    {signalsLoading ? "—" : item.count === 0 ? "nominal" : `${item.count} signal${item.count > 1 ? "s" : ""}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-400" />
                Narrative Intelligence
              </h2>
              <Link href="/insights" className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                All <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {insightsLoading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-white/[0.02] border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : insightsData?.narratives.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] text-emerald-300">No narrative events — system nominal</span>
              </div>
            ) : (
              <div className="space-y-3">
                {insightsData?.narratives.slice(0, 2).map((ins, i) => {
                  const sev = (ins.priority === "critical" ? "critical" : ins.priority === "high" ? "high" : ins.priority === "medium" ? "medium" : "low") as SignalSeverity;
                  const c = severityColors[sev];
                  return (
                    <div key={i} className={cn("p-3 rounded-lg border", c.border, c.bg)}>
                      <div className="flex items-start gap-2 mb-1.5">
                        <div className={cn("w-1 h-1 rounded-full mt-1.5 shrink-0", c.dot)} />
                        <span className="text-[11px] font-semibold text-white/90 leading-tight">{ins.headline}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2 pl-3">{ins.detail}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ActionLoop
        title="Next Best Actions"
        actions={[
          { id: "1", label: "Triage critical signals", type: "investigate" },
          { id: "2", label: "Approve pending workflows", type: "approve" },
          { id: "3", label: "Escalate SLA breaches", type: "escalate" },
          { id: "4", label: "Assign ownership gaps", type: "assign" },
          { id: "5", label: "Remediate aging approvals", type: "remediate" },
        ]}
      />

      <ActivityFeed entityType="incident" title="Operations Team Activity" limit={8} compact />
    </div>
  );
}
