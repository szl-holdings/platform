import { useStandardQuery } from "@szl-holdings/api-client-react";
import React, { useState } from "react";
import {
  TrendingUp, AlertTriangle, CheckCircle2,
  Users, BarChart3, Activity, Zap, RefreshCw, ExternalLink,
  AlertCircle, ChevronRight,
  ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

async function adminFetch<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

interface InquiryItem {
  id: number;
  formKey: string;
  product: string;
  fullName: string;
  email: string;
  company: string | null;
  message: string | null;
  createdAt: string;
  status: string;
  hoursAgo?: number;
}

interface ProductCount {
  product: string;
  count: number;
}

interface GrowthData {
  thisWeek: {
    count: number;
    delta: number;
    submissions: InquiryItem[];
  };
  openTotal: number;
  unresponded: InquiryItem[];
  productBreakdown: ProductCount[];
  recent: InquiryItem[];
}

interface HealthData {
  status: string;
  uptime: number;
  checks: {
    database?: { status: string; latencyMs?: number; details?: string };
    job_queue?: { status: string; details?: string };
    telemetry?: { status: string; details?: string };
  };
  memory: { heapUsedMb: number; heapTotalMb: number; rssMb: number };
}

function parseTelemetryDetail(details?: string): { p95: string; errorRate: string; alerts: string } {
  if (!details) return { p95: "—", errorRate: "—", alerts: "0" };
  const p95m = details.match(/p95=([\d.]+)ms/);
  const errm = details.match(/error_rate=([\d.]+)%/);
  const alm = details.match(/active_alerts=(\d+)/);
  return {
    p95: p95m ? `${p95m[1]}ms` : "—",
    errorRate: errm ? `${errm[1]}%` : "—",
    alerts: alm ? alm[1] : "0",
  };
}

function parseQueueDetail(details?: string): { pending: string; failed: string } {
  if (!details) return { pending: "0", failed: "0" };
  const pm = details.match(/pending=(\d+)/);
  const fm = details.match(/failed=(\d+)/);
  return { pending: pm ? pm[1] : "0", failed: fm ? fm[1] : "0" };
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "< 1h ago";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "ok" || status === "connected" || status === "healthy"
      ? "bg-emerald-400"
      : status === "backpressure" || status === "warning" || status === "elevated_errors"
      ? "bg-amber-400"
      : status === "degraded" || status === "unreachable" || status === "unavailable"
      ? "bg-red-400"
      : "bg-zinc-500";
  return <span className={cn("inline-block w-2 h-2 rounded-full shrink-0", color)} />;
}

function KpiCard({
  label,
  value,
  delta,
  sub,
  icon: Icon,
  alert,
}: {
  label: string;
  value: string | number;
  delta?: number;
  sub?: string;
  icon: React.ElementType;
  alert?: boolean;
}) {
  const hasUp = typeof delta === "number" && delta > 0;
  const hasDown = typeof delta === "number" && delta < 0;
  const neutral = typeof delta === "number" && delta === 0;
  return (
    <div
      className={cn(
        "relative rounded-xl border p-5 space-y-3",
        alert
          ? "bg-red-950/30 border-red-500/30"
          : "bg-zinc-900/60 border-zinc-800/60",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400 font-medium tracking-wide uppercase">{label}</span>
        <Icon className="w-4 h-4 text-zinc-500" />
      </div>
      <div className="text-3xl font-bold text-zinc-100 tabular-nums">{value}</div>
      <div className="flex items-center gap-2">
        {typeof delta === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded",
              hasUp ? "text-emerald-400 bg-emerald-400/10" : hasDown ? "text-red-400 bg-red-400/10" : "text-zinc-400 bg-zinc-800",
            )}
          >
            {hasUp ? <ArrowUpRight className="w-3 h-3" /> : hasDown ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(delta)} WoW
          </span>
        )}
        {sub && <span className="text-xs text-zinc-500">{sub}</span>}
      </div>
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold text-zinc-200 tracking-wide">{title}</h2>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  );
}

const PLAUSIBLE_SHARED_URL = import.meta.env.VITE_PLAUSIBLE_SHARED_URL as string | undefined;

interface FunnelStageRow {
  key: string;
  label: string;
  count: number;
  conversionFromPrev: number | null;
  conversionFromTop: number | null;
}

interface FunnelData {
  window: string;
  windowStart: string;
  stages: FunnelStageRow[];
  hasClientData: boolean;
  hasServerData: boolean;
}

const TOP_CONTENT = [
  { path: "/platform", views: 540 },
  { path: "/demo", views: 210 },
  { path: "/solutions", views: 480 },
  { path: "/trust", views: 160 },
  { path: "/insights", views: 340 },
  { path: "/pricing", views: 140 },
];

export default function AdminGrowthCommandPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const growthQuery = useStandardQuery<GrowthData>({
    queryKey: ["admin-growth-inquiries", refreshKey],
    queryFn: () => adminFetch<GrowthData>("/admin/inquiries"),
    refetchInterval: 60_000,
  });

  const funnelQuery = useStandardQuery<FunnelData>({
    queryKey: ["admin-funnel", refreshKey],
    queryFn: () => adminFetch<FunnelData>("/admin/analytics/funnel?window=7d"),
    refetchInterval: 60_000,
  });

  const healthQuery = useStandardQuery<HealthData>({
    queryKey: ["admin-health-detailed", refreshKey],
    queryFn: () => adminFetch<HealthData>("/health/detailed"),
    refetchInterval: 30_000,
  });

  const growth = growthQuery.data;
  const health = healthQuery.data;
  const funnel = funnelQuery.data;

  const telemetry = parseTelemetryDetail(health?.checks?.telemetry?.details);
  const queue = parseQueueDetail(health?.checks?.job_queue?.details);

  const totalThisWeek = growth?.thisWeek.count ?? 0;
  const delta = growth?.thisWeek.delta ?? 0;
  const unrespondedCount = growth?.unresponded.length ?? 0;
  const dbStatus = health?.checks?.database?.status ?? "—";
  const dbLatency = health?.checks?.database?.latencyMs;

  const maxProduct = Math.max(...(growth?.productBreakdown.map((p) => p.count) ?? [1]), 1);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Founder Command</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Web &amp; conversion metrics · Last 7 days ·{" "}
              <span className="font-medium text-zinc-400">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unrespondedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                <AlertTriangle className="w-3 h-3" />
                {unrespondedCount} unresponded &gt; 48h
              </span>
            )}
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", growthQuery.isFetching && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Primary KPIs ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Site Visits (7d)"
            value="—"
            sub="Plausible"
            icon={BarChart3}
          />
          <KpiCard
            label="Demo Requests"
            value={growthQuery.isLoading ? "…" : totalThisWeek}
            delta={growthQuery.isLoading ? undefined : delta}
            sub="this week"
            icon={Users}
          />
          <KpiCard
            label="Visit → Demo Conv."
            value="—"
            sub="Plausible + DB"
            icon={TrendingUp}
          />
          <KpiCard
            label="Unresponded > 48h"
            value={growthQuery.isLoading ? "…" : unrespondedCount}
            sub="open inquiries"
            icon={AlertCircle}
            alert={unrespondedCount > 0}
          />
        </div>

        {/* ── Plausible embedded dashboard ────────────────────────── */}
        {PLAUSIBLE_SHARED_URL ? (
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-200">Web Analytics</h2>
              <a
                href={PLAUSIBLE_SHARED_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
              >
                Open in Plausible <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <iframe
              src={PLAUSIBLE_SHARED_URL}
              title="Plausible Analytics Dashboard"
              className="w-full border-0"
              style={{ height: "600px" }}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-700/50 bg-zinc-900/20 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-400">Web Analytics — Plausible not configured</p>
              <p className="text-xs text-zinc-600 mt-0.5">
                Set <code className="text-zinc-500 bg-zinc-800 px-1 py-0.5 rounded text-[10px]">VITE_PLAUSIBLE_SHARED_URL</code> to embed your Plausible shared dashboard here.
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-zinc-700 shrink-0" />
          </div>
        )}

        {/* ── Two-column middle ───────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Demo requests by product */}
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5">
            <SectionHeader
              title="Demo Requests This Week"
              sub="All inquiry form submissions, grouped by product"
            />
            {growthQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 rounded-lg bg-zinc-800/40 animate-pulse" />
                ))}
              </div>
            ) : growthQuery.isError ? (
              <p className="text-xs text-red-400">Failed to load — {(growthQuery.error as Error).message}</p>
            ) : (growth?.productBreakdown.length ?? 0) === 0 ? (
              <p className="text-xs text-zinc-500">No submissions this week.</p>
            ) : (
              <div className="space-y-2.5">
                {growth!.productBreakdown.map((p) => (
                  <div key={p.product} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300 font-medium">{p.product}</span>
                      <span className="text-zinc-200 font-semibold tabular-nums">{p.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-500/70"
                        style={{ width: `${Math.round((p.count / maxProduct) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* API health */}
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5">
            <SectionHeader title="Platform Health" sub="Live API diagnostics" />
            {healthQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 rounded-lg bg-zinc-800/40 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-zinc-400">
                    <StatusDot status={dbStatus} />
                    Database
                  </span>
                  <span className="text-zinc-200 text-xs font-mono">
                    {dbStatus}
                    {dbLatency != null ? ` · ${dbLatency}ms` : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-zinc-400">
                    <StatusDot status={health?.checks?.job_queue?.status ?? "unavailable"} />
                    Job Queue
                  </span>
                  <span className="text-zinc-200 text-xs font-mono">
                    {queue.pending} pending · {queue.failed} failed
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-zinc-400">
                    <StatusDot status={health?.checks?.telemetry?.status ?? "unavailable"} />
                    API Error Rate
                  </span>
                  <span
                    className={cn(
                      "text-xs font-mono",
                      telemetry.errorRate !== "—" && parseFloat(telemetry.errorRate) > 1
                        ? "text-red-400"
                        : "text-zinc-200",
                    )}
                  >
                    {telemetry.errorRate}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-zinc-400">
                    <Zap className="w-2 h-2" />
                    API p95 Latency
                  </span>
                  <span
                    className={cn(
                      "text-xs font-mono",
                      telemetry.p95 !== "—" && parseInt(telemetry.p95) > 750
                        ? "text-amber-400"
                        : "text-zinc-200",
                    )}
                  >
                    {telemetry.p95}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-zinc-400">
                    <Activity className="w-2 h-2" />
                    Active Alerts
                  </span>
                  <span
                    className={cn(
                      "text-xs font-mono",
                      parseInt(telemetry.alerts) > 0 ? "text-amber-400" : "text-zinc-200",
                    )}
                  >
                    {telemetry.alerts}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-zinc-400">
                    <Activity className="w-2 h-2" />
                    Memory (heap)
                  </span>
                  <span className="text-xs font-mono text-zinc-200">
                    {health?.memory.heapUsedMb ?? "—"} / {health?.memory.heapTotalMb ?? "—"} MB
                  </span>
                </div>
                <div className="pt-1 border-t border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={health?.status ?? "unavailable"} />
                    <span className="text-xs text-zinc-400 capitalize">
                      Overall: <span className="font-semibold text-zinc-300">{health?.status ?? "—"}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Funnel Breakdown ─────────────────────────────────────── */}
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5">
          <SectionHeader
            title="Funnel Breakdown"
            sub={
              funnelQuery.isLoading
                ? "Loading…"
                : funnel
                ? `Visits → Product → Trust → Demo CTA → Form Submit → Confirmed · last 7 days${
                    !funnel.hasClientData
                      ? " · waiting for first client-side events"
                      : ""
                  }`
                : "Funnel data unavailable"
            }
          />
          {funnelQuery.isLoading ? (
            <div className="h-32 rounded-lg bg-zinc-800/40 animate-pulse" />
          ) : !funnel || funnel.stages.length === 0 ? (
            <p className="text-xs text-zinc-500">No funnel data yet.</p>
          ) : (
            <div className="flex items-end gap-1 overflow-x-auto pb-1">
              {funnel.stages.map((stage, i) => {
                const top = funnel.stages[0]?.count ?? 0;
                const heightPct = top > 0 ? (stage.count / top) * 100 : 0;
                return (
                  <React.Fragment key={stage.key}>
                    <div className="flex flex-col items-center gap-2 min-w-[100px] flex-1">
                      <div className="text-xs font-medium text-zinc-400 text-center">{stage.label}</div>
                      <div
                        className="w-full rounded-lg bg-sky-600/30 border border-sky-600/20 flex flex-col items-center justify-center px-2 py-1"
                        style={{ height: `${Math.max(heightPct * 0.9, 28)}px` }}
                        title={`${stage.count.toLocaleString()} sessions`}
                      >
                        <span className="text-sm text-sky-300 font-semibold tabular-nums">
                          {stage.count.toLocaleString()}
                        </span>
                        {stage.conversionFromPrev != null && i > 0 && (
                          <span className="text-[10px] text-sky-400/80 tabular-nums">
                            {stage.conversionFromPrev}% step
                          </span>
                        )}
                      </div>
                      {stage.conversionFromTop != null && i > 0 && (
                        <span className="text-[10px] text-zinc-500 tabular-nums">
                          {stage.conversionFromTop}% of top
                        </span>
                      )}
                    </div>
                    {i < funnel.stages.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-zinc-600 mb-6 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Top content + Unresponded ─────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Top content */}
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5">
            <SectionHeader
              title="Top Content This Week"
              sub="Indicative — connect Plausible for live page views"
            />
            <div className="space-y-2">
              {TOP_CONTENT.map((page, i) => (
                <div key={page.path} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600 text-xs w-4 tabular-nums">{i + 1}</span>
                    <code className="text-sky-400 text-xs">{page.path}</code>
                  </div>
                  <span className="text-zinc-300 text-xs font-medium tabular-nums">
                    {page.views.toLocaleString()} views
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Unresponded inquiries */}
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5">
            <SectionHeader
              title="Unresponded Inquiries > 48h"
              sub="Open submissions with no follow-up status"
            />
            {growthQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-zinc-800/40 animate-pulse" />
                ))}
              </div>
            ) : (growth?.unresponded.length ?? 0) === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                No overdue inquiries — inbox is clear.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {growth!.unresponded.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-red-500/20 bg-red-950/20 px-3 py-2.5 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{item.fullName}</p>
                        <p className="text-xs text-zinc-500 truncate">{item.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-medium">
                          {item.hoursAgo}h ago
                        </span>
                        <span className="text-[10px] text-zinc-500">{item.product}</span>
                      </div>
                    </div>
                    {item.message && (
                      <p className="text-xs text-zinc-500 line-clamp-1">{item.message}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {(growth?.unresponded.length ?? 0) > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-800">
                <Link
                  href="/admin/command-center"
                  className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors"
                >
                  View all in Command Center <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Recent submissions ────────────────────────────────── */}
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5">
          <SectionHeader title="Recent Inquiries" sub="All form submissions — newest first" />
          {growthQuery.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-zinc-800/40 animate-pulse" />
              ))}
            </div>
          ) : (growth?.recent.length ?? 0) === 0 ? (
            <p className="text-xs text-zinc-500">No submissions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800">
                    <th className="text-left py-2 pr-4 font-medium">Name</th>
                    <th className="text-left py-2 pr-4 font-medium">Company</th>
                    <th className="text-left py-2 pr-4 font-medium">Product</th>
                    <th className="text-left py-2 pr-4 font-medium">Status</th>
                    <th className="text-left py-2 font-medium">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {growth!.recent.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="py-2.5 pr-4 text-zinc-200 font-medium">{item.fullName}</td>
                      <td className="py-2.5 pr-4 text-zinc-400">{item.company ?? "—"}</td>
                      <td className="py-2.5 pr-4">
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[10px] font-medium">
                          {item.product}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-medium",
                            item.status === "qualified"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : item.status === "contacted"
                              ? "bg-sky-500/10 text-sky-400"
                              : item.status === "closed" || item.status === "lost"
                              ? "bg-zinc-700/50 text-zinc-500"
                              : "bg-amber-500/10 text-amber-400",
                          )}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-zinc-500">{formatTimeAgo(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
            <Link
              href="/admin/command-center"
              className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              Manage all inquiries in Command Center <ExternalLink className="w-3 h-3" />
            </Link>
            <span className="text-[10px] text-zinc-600">Auto-refreshes every 60s</span>
          </div>
        </div>

        {/* ── Investor funnel strip ─────────────────────────────── */}
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Investor Funnel</span>
            <div className="flex items-center gap-6 text-xs">
              <div className="text-center">
                <div className="text-zinc-200 font-semibold">—</div>
                <div className="text-zinc-600 text-[10px]">Visits</div>
              </div>
              <div className="text-center">
                <div className="text-zinc-200 font-semibold">—</div>
                <div className="text-zinc-600 text-[10px]">Deck Views</div>
              </div>
              <div className="text-center">
                <div className="text-zinc-200 font-semibold">—</div>
                <div className="text-zinc-600 text-[10px]">Inquiries</div>
              </div>
              <span className="text-zinc-600 text-[10px]">Connect Plausible for live data</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
