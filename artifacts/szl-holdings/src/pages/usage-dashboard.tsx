import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { m } from "framer-motion";
import {
  BarChart3, Users, Activity, HardDrive, Zap, ArrowLeft,
  Loader2, TrendingUp, Calendar, ChevronDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";

const API = "/api";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

type UsageSummary = {
  org: { id: number; name: string; slug: string; plan: string };
  period: { from: string; to: string };
  summary: {
    totalMembers: number;
    activeUsers: number;
    apiCalls: number;
    storageBytes: number;
    storageMB: number;
  };
  featureUtilization: { feature: string; quantity: number; events: number }[];
};

type UsageHistory = {
  period: { days: number; from: string };
  usageByDay: { date: string; feature_key: string; total_quantity: number; event_count: number }[];
  activeUsersByDay: { date: string; active_users: number }[];
};

const PERIOD_OPTIONS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function UsageDashboardPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [, navigate] = useLocation();
  const [days, setDays] = useState(30);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  const resolvedOrgQuery = useQuery<{ orgs?: { slug: string }[] }>({
    queryKey: ["me-orgs"],
    queryFn: () => apiFetch<{ orgs?: { slug: string }[] }>("/auth/me"),
    enabled: !orgSlug,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!orgSlug && resolvedOrgQuery.data) {
      const firstSlug = resolvedOrgQuery.data.orgs?.[0]?.slug;
      if (firstSlug) navigate(`/usage/${firstSlug}`);
    }
  }, [orgSlug, resolvedOrgQuery.data, navigate]);

  const slug = orgSlug ?? resolvedOrgQuery.data?.orgs?.[0]?.slug ?? "";
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const to = new Date().toISOString();

  const summaryQuery = useQuery<UsageSummary>({
    queryKey: ["usage-summary", slug, days],
    queryFn: () => apiFetch(`/orgs/${slug}/usage?from=${from}&to=${to}`),
    enabled: !!slug,
    staleTime: 60_000,
  });

  const historyQuery = useQuery<UsageHistory>({
    queryKey: ["usage-history", slug, days],
    queryFn: () => apiFetch(`/orgs/${slug}/usage/history?days=${days}`),
    enabled: !!slug,
    staleTime: 60_000,
  });

  const summary = summaryQuery.data?.summary;
  const features = summaryQuery.data?.featureUtilization ?? [];

  const activeUserData = historyQuery.data?.activeUsersByDay
    .slice(0, 14)
    .reverse()
    .map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      users: d.active_users,
    })) ?? [];

  const featureData = features.slice(0, 8).map((f) => ({
    name: f.feature.replace("api.", "").replace(/[._]/g, " "),
    calls: f.quantity,
  }));

  const STAT_CARDS = [
    {
      label: "Active Users",
      value: summary ? fmt(summary.activeUsers) : "—",
      sub: `of ${summary ? fmt(summary.totalMembers) : "—"} total members`,
      icon: Users,
      color: "#6366f1",
    },
    {
      label: "API Calls",
      value: summary ? fmt(summary.apiCalls) : "—",
      sub: `in the last ${days} days`,
      icon: Activity,
      color: "#c9a84c",
    },
    {
      label: "Storage Used",
      value: summary ? fmtBytes(summary.storageBytes) : "—",
      sub: "across all files",
      icon: HardDrive,
      color: "#10b981",
    },
    {
      label: "Features Used",
      value: features.length.toString(),
      sub: "unique feature keys",
      icon: Zap,
      color: "#f59e0b",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="w-8 h-8 rounded-lg bg-[#6366f1]/20 flex items-center justify-center">
          <BarChart3 size={16} className="text-[#6366f1]" />
        </div>
        <div>
          <h1 className="text-sm font-semibold">{summaryQuery.data?.org.name ?? "Organization"} — Usage</h1>
          <p className="text-xs text-white/40">Platform utilization and feature adoption</p>
        </div>
        <div className="ml-auto relative">
          <button
            onClick={() => setShowPeriodMenu(!showPeriodMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/60 hover:text-white hover:border-white/20 transition-colors"
          >
            <Calendar size={12} />
            {PERIOD_OPTIONS.find((p) => p.days === days)?.label ?? "Custom"}
            <ChevronDown size={12} />
          </button>
          {showPeriodMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-[#111] border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p.days}
                  className="w-full text-left px-3 py-2.5 text-xs hover:bg-white/5 transition-colors"
                  onClick={() => { setDays(p.days); setShowPeriodMenu(false); }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {summaryQuery.isLoading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-white/40">
            <Loader2 size={20} className="animate-spin" />
            Loading usage data...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {STAT_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <m.div
                    key={card.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/4 border border-white/10 rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-white/40 font-medium">{card.label}</span>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${card.color}20` }}
                      >
                        <Icon size={14} style={{ color: card.color }} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold font-mono">{card.value}</p>
                    <p className="text-xs text-white/30 mt-1">{card.sub}</p>
                  </m.div>
                );
              })}
            </div>

            {activeUserData.length > 0 && (
              <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp size={16} className="text-[#6366f1]" />
                  <h2 className="text-sm font-semibold">Daily Active Users</h2>
                  <span className="text-xs text-white/30">last {Math.min(14, days)} days</span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={activeUserData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                    />
                    <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {featureData.length > 0 && (
              <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Zap size={16} className="text-[#c9a84c]" />
                  <h2 className="text-sm font-semibold">Feature Utilization</h2>
                  <span className="text-xs text-white/30">top features by usage</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={featureData} layout="vertical">
                    <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip
                      contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="calls" fill="#c9a84c" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {features.length === 0 && !summaryQuery.isLoading && (
              <div className="bg-white/4 border border-white/10 rounded-2xl p-10 text-center">
                <Activity size={32} className="mx-auto text-white/20 mb-3" />
                <p className="text-sm text-white/40">No usage data for the selected period.</p>
                <p className="text-xs text-white/25 mt-1">Usage events will appear here as your team uses the platform.</p>
              </div>
            )}

            <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
              <h2 className="text-sm font-semibold mb-4">All Feature Usage</h2>
              <div className="space-y-2">
                {features.map((f) => (
                  <div key={f.feature} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm text-white/60 font-mono">{f.feature}</span>
                    <div className="flex items-center gap-6 text-xs">
                      <span className="text-white/40">{f.events} events</span>
                      <span className="text-white font-semibold">{fmt(f.quantity)} calls</span>
                    </div>
                  </div>
                ))}
                {features.length === 0 && (
                  <p className="text-sm text-white/30 text-center py-4">No feature data available</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
