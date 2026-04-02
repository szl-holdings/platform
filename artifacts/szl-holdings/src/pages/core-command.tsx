import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { m } from "framer-motion";
import {
  Shield, Brain, Zap, Ship, Building, Activity,
  Layers, CheckCircle2, AlertTriangle, RefreshCw, Target,
  Database, Cpu, GitBranch, Bell, Globe, ExternalLink,
  ArrowUpRight, TrendingUp, Eye, BarChart3, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

function useCountUp(target: number, duration = 1200, enabled = true) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!enabled || typeof target !== "number") return;
    const start = Date.now();
    const from = 0;
    function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, enabled]);
  return value;
}


interface CoreMetrics {
  terra: {
    total_distress_properties: number;
    high_opportunity_properties: number;
    total_leads: number;
    total_deals: number;
    converted_deals: number;
  };
  beacon?: {
    total_distress_properties: number;
    high_opportunity_properties: number;
    total_leads: number;
    total_deals: number;
    converted_deals: number;
  };
  firestorm: {
    open_vulnerabilities: number;
  };
  alloy: {
    workflow_runs_30d: number;
    total_recommendations: number;
    recent_recommendations: Array<{
      id: number;
      entity_type: string;
      domain: string;
      score: number;
      title: string;
      severity: string;
      generated_at: string;
    }>;
  };
  platform: {
    audit_events_30d: number;
    generated_at: string;
  };
}

interface CoreHealth {
  status: string;
  uptime_seconds: number;
  version: string;
  services: Record<string, { status: string; latency_ms?: number; memory_mb?: number; version?: string }>;
  telemetry: {
    total_recommendations: number;
    total_audit_events: number;
  };
}

const SEVERITY_BG: Record<string, string> = {
  critical: "bg-red-500/10 border-red-500/25 text-red-400",
  high: "bg-orange-500/10 border-orange-500/25 text-orange-400",
  medium: "bg-amber-500/10 border-amber-500/25 text-amber-400",
  low: "bg-blue-500/10 border-blue-500/25 text-blue-400",
  info: "bg-slate-500/10 border-slate-500/25 text-slate-400",
};

const platformLinks = [
  { name: "Terra", role: "OBSERVE", subtitle: "Property Intelligence", href: "/terra/", icon: Building, color: "#4d7c0f" },
  { name: "Lyte", role: "INTERPRET", subtitle: "Business Observability", href: "/lyte-command-center/", icon: Zap, color: "#f59e0b" },
  { name: "Alloy Creative", role: "CREATE", subtitle: "Creative Workflows", href: "/alloy/creative", icon: Brain, color: "#ec4899" },
  { name: "Alloy", role: "EXECUTE", subtitle: "Execution Fabric", href: "/alloy/", icon: Layers, color: "#6366f1" },
  { name: "Aegis", role: "DEFEND", subtitle: "Defense & Intelligence", href: "/firestorm/", icon: Shield, color: "#6366f1" },
  { name: "Vessels", role: "TRACK", subtitle: "Maritime Intelligence", href: "/vessels/", icon: Ship, color: "#3b82f6" },
  { name: "Carlota Jo", role: "CONSULT", subtitle: "Brand Strategy", href: "/carlota-jo/", icon: Globe, color: "#10b981" },
];

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  loading,
  alert,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  loading?: boolean;
  alert?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl border bg-card/60 p-4 flex flex-col gap-2",
      alert ? "border-red-500/30" : "border-border/40",
    )}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-20 bg-muted/30 rounded animate-pulse" />
      ) : (
        <p
          className="text-2xl font-bold font-display tabular-nums"
          style={{ color }}
        >
          {value}
        </p>
      )}
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function AnimatedKPI({ value, prefix = "", suffix = "", color, duration = 1400, decimals = 0 }: {
  value: number | null;
  prefix?: string;
  suffix?: string;
  color: string;
  duration?: number;
  decimals?: number;
}) {
  const counted = useCountUp(value !== null ? Math.round(value * Math.pow(10, decimals)) : 0, duration, value !== null);
  const actual = counted / Math.pow(10, decimals);
  const display = value === null ? "—" : `${prefix}${actual.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  return <span style={{ color }}>{display}</span>;
}

const INVESTOR_KPIS = [
  {
    label: "Distress Opportunities",
    value: null as number | null,
    prefix: "",
    suffix: "",
    sub: "Tracked NYC properties",
    color: "#0ea5e9",
    icon: Building,
    field: "distress" as const,
  },
  {
    label: "Deployed AUM",
    value: 47_200_000,
    prefix: "$",
    suffix: "",
    sub: "Across active vehicles",
    color: "#10b981",
    icon: DollarSign,
    field: "static" as const,
  },
  {
    label: "Portfolio IRR",
    value: 22,
    prefix: "",
    suffix: "%",
    sub: "5-year blended return",
    color: "#f59e0b",
    icon: TrendingUp,
    field: "static" as const,
    decimals: 0,
  },
  {
    label: "Active Deals",
    value: null as number | null,
    prefix: "",
    suffix: "",
    sub: "Live pipeline",
    color: "#6366f1",
    icon: Target,
    field: "deals" as const,
  },
  {
    label: "AI Signals Processed",
    value: null as number | null,
    prefix: "",
    suffix: "",
    sub: "All-time platform",
    color: "#ec4899",
    icon: Brain,
    field: "recs" as const,
  },
  {
    label: "Platform Uptime",
    value: 99.94,
    prefix: "",
    suffix: "%",
    sub: "30-day rolling average",
    color: "#22c55e",
    icon: Activity,
    field: "static" as const,
    decimals: 2,
  },
];

function InvestorKPISection({ metricsLoading, metrics }: { metricsLoading: boolean; metrics: CoreMetrics | null }) {
  const terra = metrics?.terra ?? metrics?.beacon;
  const kpiValues: Record<string, number | null> = {
    distress: terra?.total_distress_properties ?? null,
    deals: terra?.total_deals ?? null,
    recs: metrics?.alloy?.total_recommendations ?? null,
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Investor Intelligence — Portfolio KPIs
        </h2>
        <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full border border-border/30 bg-muted/10">
          Live • Refreshed hourly
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {INVESTOR_KPIS.map((kpi) => {
          const Icon = kpi.icon;
          const resolved = kpi.field === "static" ? kpi.value : kpiValues[kpi.field] ?? null;
          return (
            <m.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-xl border border-border/40 bg-card/60 p-4 flex flex-col gap-2"
              style={{ borderColor: metricsLoading ? undefined : `${kpi.color}18` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">{kpi.label}</span>
                <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${kpi.color}18` }}>
                  <Icon className="w-3 h-3" style={{ color: kpi.color }} />
                </div>
              </div>
              {metricsLoading && kpi.field !== "static" ? (
                <div className="h-8 w-16 bg-muted/20 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold font-display tabular-nums leading-none">
                  {resolved !== null ? (
                    <AnimatedKPI value={resolved} prefix={kpi.prefix} suffix={kpi.suffix} color={kpi.color} decimals={"decimals" in kpi ? kpi.decimals : 0} />
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
            </m.div>
          );
        })}
      </div>
    </section>
  );
}

export default function CoreCommandCenter() {
  const [tab, setTab] = useState<"overview" | "recommendations" | "audit" | "services">("overview");

  const { data: metrics, isLoading: metricsLoading, refetch } = useQuery<CoreMetrics>({
    queryKey: ["core-metrics"],
    queryFn: async () => {
      const res = await fetch("/api/core/metrics");
      if (!res.ok) throw new Error("Failed");
      const j = await res.json();
      return j.data;
    },
    refetchInterval: 60_000,
  });

  const { data: health, isLoading: healthLoading } = useQuery<CoreHealth>({
    queryKey: ["core-health"],
    queryFn: async () => {
      const res = await fetch("/api/core/health");
      if (!res.ok) throw new Error("Failed");
      const j = await res.json();
      return j.data;
    },
    refetchInterval: 30_000,
  });

  const { data: recsData, isLoading: recsLoading } = useQuery<{ data: CoreMetrics["alloy"]["recent_recommendations"]; meta: { total: number } }>({
    queryKey: ["core-recs-tab"],
    queryFn: async () => {
      const res = await fetch("/api/core/recommendations?limit=10");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: tab === "recommendations",
  });

  const { data: auditData, isLoading: auditLoading } = useQuery<{ data?: unknown[]; items?: unknown[] }>({
    queryKey: ["audit-tab"],
    queryFn: async () => {
      const res = await fetch("/api/audit?limit=10");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: tab === "audit",
  });

  const serviceEntries = health?.services ? Object.entries(health.services) : [];
  const uptimeH = health ? Math.floor(health.uptime_seconds / 3600) : null;
  const recentRecs = metrics?.alloy?.recent_recommendations ?? [];
  const auditEvents = (auditData?.data ?? auditData?.items ?? []) as Record<string, unknown>[];

  const openVulns = metrics?.firestorm?.open_vulnerabilities ?? 0;
  const t = metrics?.terra ?? metrics?.beacon;
  const highOpp = t?.high_opportunity_properties ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50 sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display text-foreground leading-none">
                SZL Core Command
              </h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Unified Platform Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border",
                health?.status === "healthy"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : healthLoading
                  ? "bg-muted/10 border-border/30 text-muted-foreground"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400",
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  health?.status === "healthy"
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-muted-foreground",
                )}
              />
              {healthLoading
                ? "Connecting…"
                : health?.status === "healthy"
                ? "All Systems Operational"
                : "Checking…"}
            </div>
            <button
              onClick={() => refetch()}
              className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh metrics"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="border-t border-border/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-0.5 overflow-x-auto">
            {(["overview", "recommendations", "audit", "services"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all border-b-2 flex-shrink-0",
                  tab === t
                    ? "border-indigo-400 text-indigo-400"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {tab === "overview" && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Platform Summary
                </h2>
                {metrics?.platform?.generated_at && (
                  <span className="text-[10px] text-muted-foreground">
                    Updated{" "}
                    {new Date(metrics.platform.generated_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <SummaryCard
                  label="Distress Properties"
                  value={t?.total_distress_properties ?? "—"}
                  sub="Terra — NYC + NY"
                  icon={Building}
                  color="#0ea5e9"
                  loading={metricsLoading}
                />
                <SummaryCard
                  label="High Opportunity"
                  value={highOpp === 0 && !metricsLoading ? "—" : highOpp}
                  sub="Score ≥ 80"
                  icon={Target}
                  color="#10b981"
                  loading={metricsLoading}
                />
                <SummaryCard
                  label="Converted Deals"
                  value={t?.converted_deals ?? "—"}
                  sub="Closed Won"
                  icon={CheckCircle2}
                  color="#22c55e"
                  loading={metricsLoading}
                />
                <SummaryCard
                  label="Open Vulnerabilities"
                  value={openVulns}
                  sub="Aegis — Active"
                  icon={Shield}
                  color="#ef4444"
                  loading={metricsLoading}
                  alert={openVulns > 0}
                />
                <SummaryCard
                  label="AI Recommendations"
                  value={metrics?.alloy?.total_recommendations ?? "—"}
                  sub="All-time"
                  icon={Brain}
                  color="#ec4899"
                  loading={metricsLoading}
                />
                <SummaryCard
                  label="Workflow Runs"
                  value={metrics?.alloy?.workflow_runs_30d ?? "—"}
                  sub="Last 30 days"
                  icon={GitBranch}
                  color="#6366f1"
                  loading={metricsLoading}
                />
              </div>
            </section>

            <InvestorKPISection metricsLoading={metricsLoading} metrics={metrics ?? null} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Platform Layer — Doctrine Hierarchy
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {platformLinks.map((app) => (
                      <a
                        key={app.href}
                        href={app.href}
                        className="group rounded-xl border border-border/40 bg-card/60 p-4 hover:border-border/70 hover:bg-card/80 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: `${app.color}20` }}
                            >
                              <app.icon className="w-4 h-4" style={{ color: app.color }} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground leading-none">{app.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{app.subtitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border flex-shrink-0"
                              style={{
                                color: app.color,
                                borderColor: `${app.color}35`,
                                background: `${app.color}10`,
                              }}
                            >
                              {app.role}
                            </span>
                            <ArrowUpRight className="w-3 h-3 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Additional Telemetry
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Total Leads",
                        value: t?.total_leads ?? "—",
                        icon: TrendingUp,
                        color: "#0ea5e9",
                      },
                      {
                        label: "Total Deals",
                        value: t?.total_deals ?? "—",
                        icon: BarChart3,
                        color: "#10b981",
                      },
                      {
                        label: "Audit Events",
                        value: metrics?.platform?.audit_events_30d ?? "—",
                        icon: Bell,
                        color: "#f59e0b",
                      },
                      {
                        label: "API Uptime",
                        value: uptimeH !== null ? `${uptimeH}h` : "—",
                        icon: Activity,
                        color: "#22c55e",
                      },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div
                        key={label}
                        className="rounded-xl border border-border/40 bg-card/60 p-3"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className="w-3 h-3" style={{ color }} />
                          <span className="text-[10px] text-muted-foreground">{label}</span>
                        </div>
                        {metricsLoading ? (
                          <div className="h-6 w-12 bg-muted/30 rounded animate-pulse" />
                        ) : (
                          <p className="text-lg font-bold tabular-nums" style={{ color }}>{value}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Recent AI Recommendations
                  </h2>
                  <div className="space-y-2">
                    {metricsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-16 bg-muted/20 rounded-lg animate-pulse" />
                      ))
                    ) : recentRecs.length === 0 ? (
                      <div className="rounded-xl border border-border/30 bg-card/30 p-5 text-center">
                        <Brain className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-[11px] text-muted-foreground">No recommendations yet</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          POST /api/core/recommendations
                        </p>
                      </div>
                    ) : (
                      recentRecs.slice(0, 5).map((rec) => (
                        <div
                          key={rec.id}
                          className={cn(
                            "rounded-lg border p-3 text-[11px]",
                            SEVERITY_BG[rec.severity] ?? "bg-muted/10 border-border/30 text-foreground",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-semibold text-foreground leading-tight line-clamp-2 flex-1">
                              {rec.title}
                            </p>
                            <span className="text-[9px] font-bold uppercase tracking-wider flex-shrink-0">
                              {rec.severity}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground text-[10px]">
                            <span className="capitalize">{rec.entity_type?.replace(/_/g, " ")}</span>
                            <span>·</span>
                            <span>{rec.domain}</span>
                            <span>·</span>
                            <span className="font-semibold">{Math.round(rec.score)}/100</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Quick Links
                  </h2>
                  <div className="space-y-1">
                    {[
                      { label: "Terra — Property Intelligence", href: "/terra/", color: "#4d7c0f", icon: Building },
                      { label: "Aegis — Defense & Intelligence", href: "/firestorm/", color: "#6366f1", icon: Shield },
                      { label: "Carlota Jo — Consulting", href: "/carlota-jo/", color: "#10b981", icon: Globe },
                      { label: "Vessels — Maritime", href: "/vessels/", color: "#3b82f6", icon: Ship },
                      { label: "Alloy — Creative Workflows", href: "/alloy/creative", color: "#ec4899", icon: Eye },
                    ].map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-muted/30 transition-colors group"
                      >
                        <link.icon
                          className="w-3.5 h-3.5 flex-shrink-0"
                          style={{ color: link.color }}
                        />
                        <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors flex-1">
                          {link.label}
                        </span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </m.div>
        )}

        {tab === "recommendations" && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold font-display">Alloy Intelligence Recommendations</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Cross-platform · All entity types · Explainable scoring
                </p>
              </div>
              <code className="text-[10px] bg-muted/30 border border-border/30 px-2.5 py-1.5 rounded-lg text-muted-foreground">
                POST /api/core/recommendations
              </code>
            </div>
            <div className="space-y-3">
              {recsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted/20 rounded-xl animate-pulse" />
                ))
              ) : (recsData?.data ?? []).length === 0 ? (
                <div className="rounded-xl border border-border/30 bg-card/30 p-10 text-center">
                  <Brain className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-foreground mb-2">
                    No recommendations stored yet
                  </p>
                  <p className="text-[12px] text-muted-foreground max-w-sm mx-auto">
                    POST to{" "}
                    <code className="text-indigo-400">/api/core/recommendations</code> with an
                    entity_type and context to generate scored, explainable recommendations.
                  </p>
                  <div className="mt-4 rounded-lg bg-muted/20 p-3 text-left max-w-sm mx-auto">
                    <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap">{`{
  "entity_type": "distress_property",
  "entity_id": "dp-001",
  "context": {
    "opportunity_score": 87,
    "days_in_distress": 136,
    "distress_type": "pre-foreclosure",
    "address": "1847 Flatbush Ave",
    "borough": "Brooklyn"
  }
}`}</pre>
                  </div>
                </div>
              ) : (
                (recsData?.data ?? []).map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-xl border border-border/40 bg-card/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span
                            className={cn(
                              "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                              SEVERITY_BG[rec.severity] ?? "",
                            )}
                          >
                            {rec.severity}
                          </span>
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {rec.entity_type?.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground">{rec.domain}</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground mb-1">{rec.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Generated{" "}
                          {new Date(rec.generated_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p
                          className="text-2xl font-bold font-display"
                          style={{
                            color:
                              rec.score >= 80
                                ? "#ef4444"
                                : rec.score >= 65
                                ? "#f59e0b"
                                : "#0ea5e9",
                          }}
                        >
                          {Math.round(rec.score)}
                        </p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                          Score
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {recsData && recsData.meta.total > 10 && (
                <p className="text-[11px] text-muted-foreground text-center pt-2">
                  Showing 10 of {recsData.meta.total} recommendations
                </p>
              )}
            </div>
          </m.div>
        )}

        {tab === "audit" && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold font-display">Audit Events</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Recent platform activity across all services
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Bell className="w-3.5 h-3.5" />
                <span>{metrics?.platform?.audit_events_30d ?? 0} events (30d)</span>
              </div>
            </div>
            <div className="space-y-2">
              {auditLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted/20 rounded-lg animate-pulse" />
                ))
              ) : auditEvents.length === 0 ? (
                <div className="rounded-xl border border-border/30 bg-card/30 p-10 text-center">
                  <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-foreground mb-1">No audit events yet</p>
                  <p className="text-[12px] text-muted-foreground">
                    Audit events are recorded automatically as you use the platform.
                  </p>
                </div>
              ) : (
                auditEvents.slice(0, 10).map((evt, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/50 px-4 py-3"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-foreground truncate">
                        {String(evt.action_type ?? evt.actionType ?? "Unknown action")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {String(evt.entity_type ?? evt.entityType ?? "")}
                        {evt.entity_id || evt.entityId
                          ? ` · ${String(evt.entity_id ?? evt.entityId)}`
                          : ""}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {evt.created_at || evt.createdAt
                        ? new Date(
                            String(evt.created_at ?? evt.createdAt),
                          ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </span>
                  </div>
                ))
              )}
            </div>
          </m.div>
        )}

        {tab === "services" && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-6">
              <h2 className="text-base font-bold font-display">Service Health</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Real-time status · <code className="text-indigo-400 text-[11px]">GET /api/core/health</code>
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {healthLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-16 bg-muted/20 rounded-xl animate-pulse" />
                  ))
                : serviceEntries.map(([name, svc]) => (
                    <div
                      key={name}
                      className={cn(
                        "rounded-xl border p-4",
                        svc.status === "ok" || svc.status === "healthy"
                          ? "border-emerald-500/25 bg-emerald-500/5"
                          : "border-red-500/25 bg-red-500/5",
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-foreground capitalize">
                          {name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              svc.status === "ok" || svc.status === "healthy"
                                ? "bg-emerald-400"
                                : "bg-red-400",
                            )}
                          />
                          <span
                            className={cn(
                              "text-[10px] font-medium",
                              svc.status === "ok" || svc.status === "healthy"
                                ? "text-emerald-400"
                                : "text-red-400",
                            )}
                          >
                            {svc.status}
                          </span>
                        </div>
                      </div>
                      {svc.latency_ms !== undefined && (
                        <p className="text-[11px] text-muted-foreground">
                          Latency: {svc.latency_ms}ms
                        </p>
                      )}
                      {svc.memory_mb !== undefined && (
                        <p className="text-[11px] text-muted-foreground">
                          Memory: {svc.memory_mb}MB
                        </p>
                      )}
                    </div>
                  ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border/40 bg-card/60 p-4">
                <p className="text-[11px] text-muted-foreground mb-1">Platform Uptime</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {uptimeH !== null ? `${uptimeH}h` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border/40 bg-card/60 p-4">
                <p className="text-[11px] text-muted-foreground mb-1">Total Recommendations</p>
                <p className="text-2xl font-bold text-purple-400">
                  {health?.telemetry?.total_recommendations ?? "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border/40 bg-card/60 p-4">
                <p className="text-[11px] text-muted-foreground mb-1">Total Audit Events</p>
                <p className="text-2xl font-bold text-blue-400">
                  {health?.telemetry?.total_audit_events ?? "—"}
                </p>
              </div>
            </div>
          </m.div>
        )}
      </main>
    </div>
  );
}
