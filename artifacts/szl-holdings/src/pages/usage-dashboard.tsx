import { useStandardQuery } from '@szl-holdings/api-client-react';
import { m } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Building2,
  Calendar,
  ChevronDown,
  Filter,
  HardDrive,
  Loader2,
  Search,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLocation, useParams } from 'wouter';

const API = '/api';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { credentials: 'include' });
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

type AdminUsageRow = {
  orgId: number;
  orgName: string;
  orgSlug: string;
  plan: string;
  status: string;
  createdAt: string;
  members: number;
  activeUsers: number;
  apiCalls: number;
  featureCount: number;
  storageBytes: number;
  storageMB: number;
  storageDataAvailable: boolean;
  overages: {
    apiCalls: 'none' | 'warn' | 'over';
    members: 'none' | 'warn' | 'over';
    storage: 'none' | 'warn' | 'over';
  };
  planLimits: { apiCalls: number | null; members: number | null; storageMB: number | null };
};

type AdminUsageResponse = {
  period: { from: string; to: string };
  totals: {
    orgs: number;
    apiCalls: number;
    activeUsers: number;
    overageCount: number;
    warnCount: number;
  };
  rows: AdminUsageRow[];
  pagination: { limit: number; offset: number; total: number; hasMore: boolean };
};

type CurrentUser = {
  id: number;
  email: string;
  roles: string[];
  orgs?: { slug: string; name: string }[];
};

const PERIOD_OPTIONS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

const PLAN_OPTIONS = [
  { value: '', label: 'All plans' },
  { value: 'free', label: 'Free' },
  { value: 'starter', label: 'Starter' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
];

const PLAN_COLOR: Record<string, string> = {
  free: '#6b7280',
  starter: '#3b82f6',
  professional: '#8b5cf6',
  enterprise: '#c9a84c',
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function OverageBadge({ level }: { level: 'none' | 'warn' | 'over' }) {
  if (level === 'none') return null;
  if (level === 'over')
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-400">
        <AlertCircle size={10} />
        OVER
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400">
      <AlertTriangle size={10} />
      80%+
    </span>
  );
}

function AdminUsageView({ days }: { days: number }) {
  const [planFilter, setPlanFilter] = useState('');
  const [orgSearch, setOrgSearch] = useState('');
  const [showPlanMenu, setShowPlanMenu] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(orgSearch), 300);
    return () => clearTimeout(t);
  }, [orgSearch]);

  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const to = new Date().toISOString();

  const params = new URLSearchParams({ from, to });
  if (planFilter) params.set('plan', planFilter);
  if (debouncedSearch) params.set('org', debouncedSearch);
  params.set('limit', '200');

  const adminQuery = useStandardQuery<AdminUsageResponse>({
    queryKey: ['admin-usage', days, planFilter, debouncedSearch],
    queryFn: () => apiFetch(`/admin/usage?${params}`),
    staleTime: 60_000,
  });

  const rows = adminQuery.data?.rows ?? [];
  const totals = adminQuery.data?.totals;

  const avgApiCalls = rows.length > 0 ? rows.reduce((s, r) => s + r.apiCalls, 0) / rows.length : 0;

  const processedRows = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        isSpike: r.apiCalls > avgApiCalls * 3 && r.apiCalls > 100,
      })),
    [rows, avgApiCalls],
  );

  return (
    <div className="space-y-6">
      {totals && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Tenants', value: totals.orgs, icon: Building2, color: '#6366f1' },
            {
              label: 'Platform API Calls',
              value: fmt(totals.apiCalls),
              icon: Activity,
              color: '#c9a84c',
            },
            {
              label: 'Active Users',
              value: fmt(totals.activeUsers),
              icon: Users,
              color: '#10b981',
            },
            {
              label: 'Plan Overages',
              value: totals.overageCount,
              sub: `${totals.warnCount} approaching`,
              icon: AlertCircle,
              color: totals.overageCount > 0 ? '#ef4444' : '#6b7280',
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <m.div
                key={card.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/4 border border-white/10 rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40">{card.label}</span>
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${card.color}20` }}
                  >
                    <Icon size={12} style={{ color: card.color }} />
                  </div>
                </div>
                <p className="text-xl font-bold font-mono">{card.value}</p>
                {'sub' in card && card.sub && (
                  <p className="text-xs text-white/30 mt-0.5">{card.sub}</p>
                )}
              </m.div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={orgSearch}
            onChange={(e) => setOrgSearch(e.target.value)}
            placeholder="Search by org name or slug…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#6366f1]/50"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowPlanMenu(!showPlanMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white/60 hover:text-white hover:border-white/20 transition-colors"
          >
            <Filter size={12} />
            {PLAN_OPTIONS.find((p) => p.value === planFilter)?.label ?? 'All plans'}
            <ChevronDown size={12} />
          </button>
          {showPlanMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-[#111] border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden">
              {PLAN_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  className={`w-full text-left px-3 py-2.5 text-xs hover:bg-white/5 transition-colors ${planFilter === p.value ? 'text-[#6366f1]' : ''}`}
                  onClick={() => {
                    setPlanFilter(p.value);
                    setShowPlanMenu(false);
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="text-xs text-white/30 ml-auto">
          {rows.length} tenant{rows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {adminQuery.isLoading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-white/40">
          <Loader2 size={20} className="animate-spin" />
          Loading cross-tenant usage…
        </div>
      ) : adminQuery.isError ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
          <AlertCircle size={28} className="mx-auto text-red-400 mb-3" />
          <p className="text-sm text-red-400 font-medium">Unable to load cross-tenant usage</p>
          <p className="text-xs text-white/30 mt-1">
            {(adminQuery.error as Error)?.message?.includes('403')
              ? "You don't have permission to view platform-wide usage data."
              : 'An error occurred fetching usage data. Please try again.'}
          </p>
        </div>
      ) : (
        <div className="bg-white/4 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium">Organization</th>
                  <th className="text-left px-3 py-3 text-white/40 font-medium">Plan</th>
                  <th className="text-right px-3 py-3 text-white/40 font-medium">Members</th>
                  <th className="text-right px-3 py-3 text-white/40 font-medium">Active Users</th>
                  <th className="text-right px-3 py-3 text-white/40 font-medium">API Calls</th>
                  <th className="text-right px-3 py-3 text-white/40 font-medium">Features</th>
                  <th className="text-right px-4 py-3 text-white/40 font-medium">Storage</th>
                  <th className="text-right px-4 py-3 text-white/40 font-medium">Flags</th>
                </tr>
              </thead>
              <tbody>
                {processedRows.map((row, i) => {
                  const hasAnyOverage = Object.values(row.overages).some((v) => v !== 'none');
                  return (
                    <tr
                      key={row.orgId}
                      className={`border-b border-white/5 last:border-0 transition-colors hover:bg-white/3 ${
                        row.isSpike
                          ? 'bg-amber-500/5'
                          : hasAnyOverage && Object.values(row.overages).some((v) => v === 'over')
                            ? 'bg-red-500/5'
                            : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-[#6366f1]/20 flex items-center justify-center shrink-0">
                            <Building2 size={11} className="text-[#6366f1]" />
                          </div>
                          <div>
                            <p className="font-medium text-white/80">{row.orgName}</p>
                            <p className="text-white/30 font-mono">{row.orgSlug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                          style={{
                            backgroundColor: `${PLAN_COLOR[row.plan] ?? '#6b7280'}20`,
                            color: PLAN_COLOR[row.plan] ?? '#6b7280',
                          }}
                        >
                          {row.plan}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-white/70">{fmt(row.members)}</span>
                          <OverageBadge level={row.overages.members} />
                        </div>
                        {row.planLimits.members != null && (
                          <p className="text-white/25">/{fmt(row.planLimits.members)}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-white/70">{fmt(row.activeUsers)}</td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span
                            className={`font-semibold ${row.isSpike ? 'text-amber-400' : 'text-white'}`}
                          >
                            {fmt(row.apiCalls)}
                          </span>
                          {row.isSpike && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400">
                              <TrendingUp size={9} />
                              SPIKE
                            </span>
                          )}
                          {!row.isSpike && <OverageBadge level={row.overages.apiCalls} />}
                        </div>
                        {row.planLimits.apiCalls != null && (
                          <p className="text-white/25">/{fmt(row.planLimits.apiCalls)} limit</p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-white/70">{row.featureCount}</td>
                      <td className="px-4 py-3 text-right">
                        {row.storageDataAvailable ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-white/70">{fmtBytes(row.storageBytes)}</span>
                            <OverageBadge level={row.overages.storage} />
                          </div>
                        ) : (
                          <span className="text-white/25">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {hasAnyOverage ? (
                          Object.values(row.overages).some((v) => v === 'over') ? (
                            <span className="inline-flex items-center gap-1 text-red-400">
                              <AlertCircle size={12} />
                              <span>Over limit</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400">
                              <AlertTriangle size={12} />
                              <span>Near limit</span>
                            </span>
                          )
                        ) : (
                          <span className="text-white/25">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {processedRows.length === 0 && !adminQuery.isLoading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-white/30">
                      No tenants match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UsageDashboardPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [, navigate] = useLocation();
  const [days, setDays] = useState(30);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [view, setView] = useState<'tenant' | 'admin'>('tenant');

  const meQuery = useStandardQuery<CurrentUser>({
    queryKey: ['me'],
    queryFn: () => apiFetch<CurrentUser>('/auth/me'),
    staleTime: Infinity,
  });

  const isAdmin = meQuery.data?.roles?.some((r) => r === 'super_admin') ?? false;

  const resolvedOrgQuery = useStandardQuery<{ orgs?: { slug: string }[] }>({
    queryKey: ['me-orgs'],
    queryFn: () => apiFetch<{ orgs?: { slug: string }[] }>('/auth/me'),
    enabled: !orgSlug,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!orgSlug && resolvedOrgQuery.data) {
      const firstSlug = resolvedOrgQuery.data.orgs?.[0]?.slug;
      if (firstSlug) navigate(`/usage/${firstSlug}`);
    }
  }, [orgSlug, resolvedOrgQuery.data, navigate]);

  const slug = orgSlug ?? resolvedOrgQuery.data?.orgs?.[0]?.slug ?? '';
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const to = new Date().toISOString();

  const summaryQuery = useStandardQuery<UsageSummary>({
    queryKey: ['usage-summary', slug, days],
    queryFn: () => apiFetch(`/orgs/${slug}/usage?from=${from}&to=${to}`),
    enabled: !!slug && view === 'tenant',
    staleTime: 60_000,
  });

  const historyQuery = useStandardQuery<UsageHistory>({
    queryKey: ['usage-history', slug, days],
    queryFn: () => apiFetch(`/orgs/${slug}/usage/history?days=${days}`),
    enabled: !!slug && view === 'tenant',
    staleTime: 60_000,
  });

  const summary = summaryQuery.data?.summary;
  const features = summaryQuery.data?.featureUtilization ?? [];

  const activeUserData =
    historyQuery.data?.activeUsersByDay
      .slice(0, 14)
      .reverse()
      .map((d) => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: d.active_users,
      })) ?? [];

  const featureData = features.slice(0, 8).map((f) => ({
    name: f.feature.replace('api.', '').replace(/[._]/g, ' '),
    calls: f.quantity,
  }));

  const STAT_CARDS = [
    {
      label: 'Active Users',
      value: summary ? fmt(summary.activeUsers) : '—',
      sub: `of ${summary ? fmt(summary.totalMembers) : '—'} total members`,
      icon: Users,
      color: '#6366f1',
    },
    {
      label: 'API Calls',
      value: summary ? fmt(summary.apiCalls) : '—',
      sub: `in the last ${days} days`,
      icon: Activity,
      color: '#c9a84c',
    },
    {
      label: 'Storage Used',
      value: summary ? fmtBytes(summary.storageBytes) : '—',
      sub: 'across all files',
      icon: HardDrive,
      color: '#10b981',
    },
    {
      label: 'Features Used',
      value: features.length.toString(),
      sub: 'unique feature keys',
      icon: Zap,
      color: '#f59e0b',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="w-8 h-8 rounded-lg bg-[#6366f1]/20 flex items-center justify-center">
          <BarChart3 size={16} className="text-[#6366f1]" />
        </div>
        <div>
          <h1 className="text-sm font-semibold">
            {view === 'admin'
              ? 'Platform Usage — All Tenants'
              : `${summaryQuery.data?.org.name ?? 'Organization'} — Usage`}
          </h1>
          <p className="text-xs text-white/40">
            {view === 'admin'
              ? 'Cross-tenant usage overview for platform admins'
              : 'Platform utilization and feature adoption'}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {isAdmin && (
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
              <button
                onClick={() => setView('tenant')}
                className={`px-3 py-1.5 rounded-md text-xs transition-colors ${view === 'tenant' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
              >
                My Org
              </button>
              <button
                onClick={() => setView('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${view === 'admin' ? 'bg-[#6366f1]/20 text-[#6366f1]' : 'text-white/40 hover:text-white/70'}`}
              >
                <Shield size={11} />
                All Tenants
              </button>
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowPeriodMenu(!showPeriodMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/60 hover:text-white hover:border-white/20 transition-colors"
            >
              <Calendar size={12} />
              {PERIOD_OPTIONS.find((p) => p.days === days)?.label ?? 'Custom'}
              <ChevronDown size={12} />
            </button>
            {showPeriodMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-[#111] border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden">
                {PERIOD_OPTIONS.map((p) => (
                  <button
                    key={p.days}
                    className="w-full text-left px-3 py-2.5 text-xs hover:bg-white/5 transition-colors"
                    onClick={() => {
                      setDays(p.days);
                      setShowPeriodMenu(false);
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {view === 'admin' ? (
          <AdminUsageView days={days} />
        ) : summaryQuery.isLoading ? (
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
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#111',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                    />
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
                    <XAxis
                      type="number"
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#111',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
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
                <p className="text-xs text-white/25 mt-1">
                  Usage events will appear here as your team uses the platform.
                </p>
              </div>
            )}

            <div className="bg-white/4 border border-white/10 rounded-2xl p-6">
              <h2 className="text-sm font-semibold mb-4">All Feature Usage</h2>
              <div className="space-y-2">
                {features.map((f) => (
                  <div
                    key={f.feature}
                    className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                  >
                    <span className="text-sm text-white/60 font-mono">{f.feature}</span>
                    <div className="flex items-center gap-6 text-xs">
                      <span className="text-white/40">{f.events} events</span>
                      <span className="text-white font-semibold">{fmt(f.quantity)} calls</span>
                    </div>
                  </div>
                ))}
                {features.length === 0 && (
                  <p className="text-sm text-white/30 text-center py-4">
                    No feature data available
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
