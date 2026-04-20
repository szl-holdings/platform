import { useStandardQuery } from '@szl-holdings/api-client-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
const API = `${BASE}/api`;

async function apiFetch(path: string) {
  const res = await fetch(`${API}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const GOLD = '#c2a55a';
const EMERALD = '#10b981';
const BLUE = '#3b82f6';
const ROSE = '#f43f5e';
const VIOLET = '#8b5cf6';
const AMBER = '#f59e0b';
const MUTED = '#52525b';

function fmt(n: number | null | undefined, prefix = '', suffix = '') {
  if (n == null || !isFinite(n)) return '—';
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M${suffix}`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K${suffix}`;
  return `${prefix}${n.toFixed(0)}${suffix}`;
}

function fmtCurrency(n: number | null | undefined) {
  if (n == null || !isFinite(n)) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtPct(n: number | null | undefined, decimals = 1) {
  if (n == null || !isFinite(n)) return '—';
  return `${n.toFixed(decimals)}%`;
}

function fmtRatio(n: number | null | undefined, suffix = 'x', decimals = 2) {
  if (n == null || !isFinite(n)) return '—';
  return `${n.toFixed(decimals)}${suffix}`;
}

function fmtMonths(n: number | null | undefined) {
  if (n == null || !isFinite(n)) return '—';
  return `${n.toFixed(1)} mo`;
}

const NO_DATA = '—';

function MetricCard({
  label,
  value,
  sub,
  trend,
  trendUp,
  color = GOLD,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}) {
  const isNoData = value === NO_DATA;
  return (
    <div className="bg-[#111318] border border-[#1e2230] rounded-xl p-5">
      <p className="text-xs text-[#7a8099] uppercase tracking-widest mb-2">{label}</p>
      <p className="text-2xl font-bold mb-1" style={{ color: isNoData ? '#52525b' : color }}>
        {value}
      </p>
      {!isNoData && trend && (
        <p className={`text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trendUp ? '▲' : '▼'} {trend}
        </p>
      )}
      {isNoData && <p className="text-xs text-[#3a3d4a]">Insufficient data to compute</p>}
      {!isNoData && sub && !trend && <p className="text-xs text-[#7a8099]">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-zinc-100 tracking-wide">{title}</h2>
      {sub && <p className="text-xs text-[#7a8099] mt-0.5">{sub}</p>}
    </div>
  );
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#111318',
    border: '1px solid #1e2230',
    borderRadius: 8,
    fontSize: 12,
    color: '#e8e0d0',
  },
  labelStyle: { color: '#7a8099' },
};

function MrrChart({ data }: { data: Array<{ month: string; mrr: number; arr?: number }> }) {
  const augmented = data.map((d) => ({ ...d, arr: d.mrr * 12 }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={augmented} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={GOLD} stopOpacity={0.25} />
            <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: MUTED }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: MUTED }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => fmtCurrency(v)}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v: number, name: string) => [fmtCurrency(v), name === 'mrr' ? 'MRR' : 'ARR']}
        />
        <Area
          type="monotone"
          dataKey="mrr"
          stroke={GOLD}
          strokeWidth={2}
          fill="url(#mrrGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CustomerChart({
  data,
}: {
  data: Array<{ month: string; customers: number; newCustomers: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: MUTED }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis tick={{ fontSize: 10, fill: MUTED }} tickLine={false} axisLine={false} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Bar
          dataKey="customers"
          name="Total Customers"
          fill={BLUE}
          radius={[2, 2, 0, 0]}
          opacity={0.6}
        />
        <Bar dataKey="newCustomers" name="New Customers" fill={EMERALD} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChurnChart({ data }: { data: Array<{ month: string; churnRate: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: MUTED }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: MUTED }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, 'Churn Rate']} />
        <ReferenceLine
          y={5}
          stroke={AMBER}
          strokeDasharray="4 2"
          label={{ value: '5% target', fontSize: 9, fill: AMBER }}
        />
        <Line
          type="monotone"
          dataKey="churnRate"
          stroke={ROSE}
          strokeWidth={2}
          dot={{ fill: ROSE, r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function FunnelChart({
  stages,
}: {
  stages: Array<{ stage: string; count: number; rate: number; dropOff?: number }>;
}) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);
  const colors = [GOLD, BLUE, VIOLET, AMBER, EMERALD];

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => (
        <div key={stage.stage} className="group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-300">{stage.stage}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#7a8099]">{fmt(stage.count)}</span>
              <span className="text-xs font-medium" style={{ color: colors[i] }}>
                {stage.rate}%
              </span>
            </div>
          </div>
          <div className="h-7 bg-[#1e2230] rounded-md overflow-hidden">
            <div
              className="h-full rounded-md transition-all duration-500"
              style={{
                width: `${(stage.count / maxCount) * 100}%`,
                backgroundColor: colors[i],
                opacity: 0.75,
              }}
            />
          </div>
          {i < stages.length - 1 && (
            <p className="text-xs text-[#7a8099] mt-1 text-right">
              ↓ drop-off: {fmt(stage.dropOff ?? 0)} ({(100 - stages[i + 1].rate).toFixed(1)}%)
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function CohortMatrix({
  cohorts,
  avgRetention,
  periodLabels,
}: {
  cohorts: Array<{ cohort: string; size: number; retention: number[] }>;
  avgRetention: number[];
  periodLabels: string[];
}) {
  function cellColor(pct: number) {
    if (pct >= 80) return '#10b981';
    if (pct >= 60) return '#22c55e';
    if (pct >= 40) return '#f59e0b';
    if (pct >= 20) return '#f97316';
    return '#f43f5e';
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-xs w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left text-[#7a8099] py-1.5 pr-3 font-normal whitespace-nowrap">
              Cohort
            </th>
            <th className="text-right text-[#7a8099] py-1.5 px-2 font-normal">Size</th>
            {periodLabels.map((l) => (
              <th
                key={l}
                className="text-center text-[#7a8099] py-1.5 px-2 font-normal whitespace-nowrap"
              >
                {l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort) => (
            <tr key={cohort.cohort} className="border-t border-[#1e2230]">
              <td className="py-1.5 pr-3 text-zinc-400 whitespace-nowrap">{cohort.cohort}</td>
              <td className="py-1.5 px-2 text-right text-zinc-500">{cohort.size}</td>
              {cohort.retention.map((pct, pi) => (
                <td key={pi} className="py-1.5 px-2 text-center">
                  <span
                    className="inline-block px-2 py-0.5 rounded text-[10px] font-medium"
                    style={{
                      backgroundColor: `${cellColor(pct)}22`,
                      color: cellColor(pct),
                    }}
                  >
                    {pct}%
                  </span>
                </td>
              ))}
            </tr>
          ))}
          {/* Avg row */}
          <tr className="border-t-2 border-[#1e2230] bg-[#0d0f14]">
            <td className="py-1.5 pr-3 text-[#c2a55a] font-medium">Average</td>
            <td className="py-1.5 px-2" />
            {avgRetention.map((pct, pi) => (
              <td key={pi} className="py-1.5 px-2 text-center">
                <span className="text-[10px] font-semibold" style={{ color: GOLD }}>
                  {pct}%
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function MonthlyFunnelChart({
  data,
}: {
  data: Array<{ month: string; signups: number; activations: number; paid: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: MUTED }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis tick={{ fontSize: 10, fill: MUTED }} tickLine={false} axisLine={false} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Bar dataKey="signups" name="Signups" fill={BLUE} radius={[2, 2, 0, 0]} />
        <Bar dataKey="activations" name="Activations" fill={VIOLET} radius={[2, 2, 0, 0]} />
        <Bar dataKey="paid" name="Paid Conversions" fill={EMERALD} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function InvestorAnalytics() {
  const [tab, setTab] = useState<'metrics' | 'funnel' | 'cohort' | 'diffs'>('metrics');
  const [cohortGranularity, setCohortGranularity] = useState<'month' | 'week'>('month');

  const { data: metricsRaw, isLoading: mLoading } = useStandardQuery({
    queryKey: ['investor-metrics'],
    queryFn: () => apiFetch('/investor-analytics/metrics'),
    refetchInterval: 60_000,
  });

  const { data: funnelRaw } = useStandardQuery({
    queryKey: ['investor-funnel'],
    queryFn: () => apiFetch('/investor-analytics/funnel'),
    enabled: tab === 'funnel' || tab === 'metrics',
  });

  const { data: cohortRaw } = useStandardQuery({
    queryKey: ['investor-cohort', cohortGranularity],
    queryFn: () => apiFetch(`/investor-analytics/cohort?granularity=${cohortGranularity}`),
    enabled: tab === 'cohort',
  });

  const { data: diffsRaw, isLoading: diffsLoading } = useStandardQuery({
    queryKey: ['investor-audit-diffs'],
    queryFn: () => apiFetch('/investor-analytics/audit-diffs?limit=50'),
    enabled: tab === 'diffs',
  });

  const metrics = metricsRaw?.data;
  const funnel = funnelRaw?.data;
  const cohort = cohortRaw?.data;
  const diffs: Array<{
    id: number;
    action: string;
    entityType: string;
    entityId: string;
    oldValues: unknown;
    newValues: unknown;
    userEmail: string | null;
    userName: string | null;
    createdAt: string;
  }> = diffsRaw?.data?.diffs ?? [];

  const timeSeries = metrics?.timeSeries ?? [];
  const summary = metrics?.summary ?? {};

  const TABS = [
    { key: 'metrics', label: 'Business Metrics' },
    { key: 'funnel', label: 'Funnel Analytics' },
    { key: 'cohort', label: 'Cohort Retention' },
    { key: 'diffs', label: 'Change Audit' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0c10] text-zinc-200">
      {/* Header */}
      <div className="border-b border-[#1e2230] px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-[#c2a55a] tracking-widest mb-0.5 uppercase">SZL Holdings</p>
            <h1 className="text-xl font-bold text-zinc-100">Investor Analytics</h1>
            <p className="text-xs text-[#7a8099] mt-0.5">
              Unit economics, funnel conversion & cohort retention
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={`${BASE}/reports`}
              className="px-3 py-1.5 text-xs border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
            >
              Reports Hub
            </a>
            <a
              href={`${BASE}/reports/export-builder`}
              className="px-3 py-1.5 text-xs border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
            >
              Export Builder
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#1e2230] px-6">
        <div className="max-w-7xl mx-auto flex gap-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-3 text-sm border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-[#c2a55a] text-[#c2a55a] font-medium'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">
        {/* ── Business Metrics Tab ── */}
        {tab === 'metrics' && (
          <>
            {mLoading ? (
              <div className="text-center py-20 text-zinc-600">Computing metrics...</div>
            ) : (
              <>
                {/* KPI Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <MetricCard
                    label="MRR"
                    value={fmtCurrency(summary.mrr)}
                    trend={
                      summary.mrrGrowth != null
                        ? `${Math.abs(summary.mrrGrowth)}% vs last month`
                        : undefined
                    }
                    trendUp={(summary.mrrGrowth ?? 0) >= 0}
                    color={GOLD}
                  />
                  <MetricCard
                    label="ARR"
                    value={fmtCurrency(summary.arr)}
                    sub="Annualized run rate"
                    color={GOLD}
                  />
                  <MetricCard
                    label="Total Customers"
                    value={fmt(summary.totalCustomers)}
                    trend={
                      summary.customerGrowth != null
                        ? `${Math.abs(summary.customerGrowth)}% vs last month`
                        : undefined
                    }
                    trendUp={(summary.customerGrowth ?? 0) >= 0}
                    color={BLUE}
                  />
                  <MetricCard
                    label="Churn Rate"
                    value={fmtPct(summary.churnRate, 2)}
                    sub="Monthly customer churn"
                    color={(summary.churnRate ?? 0) < 5 ? EMERALD : ROSE}
                  />
                  <MetricCard
                    label="NRR"
                    value={fmtPct(summary.nrr)}
                    sub={summary.nrr != null ? 'Net revenue retention' : undefined}
                    color={summary.nrr != null ? (summary.nrr >= 100 ? EMERALD : AMBER) : MUTED}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <MetricCard
                    label="CAC Payback"
                    value={fmtMonths(summary.cacPayback)}
                    sub={
                      summary.cacPayback != null ? 'Months to recoup acquisition cost' : undefined
                    }
                    color={AMBER}
                  />
                  <MetricCard
                    label="LTV/CAC Ratio"
                    value={fmtRatio(summary.ltvCacRatio)}
                    sub={summary.ltvCacRatio != null ? 'Customer lifetime value vs CAC' : undefined}
                    color={
                      summary.ltvCacRatio != null
                        ? summary.ltvCacRatio >= 3
                          ? EMERALD
                          : AMBER
                        : MUTED
                    }
                  />
                  <MetricCard
                    label="MAU"
                    value={fmt(summary.activeUsers30d ?? 0)}
                    sub="Active users last 30 days"
                    color={VIOLET}
                  />
                  <MetricCard
                    label="WAU"
                    value={fmt(summary.activeUsers7d ?? 0)}
                    sub="Active users last 7 days"
                    color={VIOLET}
                  />
                </div>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-[#111318] border border-[#1e2230] rounded-xl p-5">
                    <SectionHeader
                      title="MRR Trajectory"
                      sub="Monthly recurring revenue over 12 months"
                    />
                    <MrrChart data={timeSeries} />
                  </div>
                  <div className="bg-[#111318] border border-[#1e2230] rounded-xl p-5">
                    <SectionHeader title="Customer Growth" sub="Total and new customers by month" />
                    <CustomerChart data={timeSeries} />
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-[#111318] border border-[#1e2230] rounded-xl p-5">
                    <SectionHeader
                      title="Monthly Churn Rate"
                      sub="Percentage of customers lost each month"
                    />
                    <ChurnChart data={timeSeries} />
                  </div>
                  <div className="bg-[#111318] border border-[#1e2230] rounded-xl p-5">
                    <SectionHeader
                      title="Plan Distribution"
                      sub="Active subscriptions by plan tier"
                    />
                    {metrics?.planDistribution?.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart
                          data={metrics.planDistribution}
                          layout="vertical"
                          margin={{ top: 4, right: 4, left: 40, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#1e2230"
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 10, fill: MUTED }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            dataKey="plan"
                            type="category"
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            tickLine={false}
                            axisLine={false}
                            width={80}
                          />
                          <Tooltip {...TOOLTIP_STYLE} />
                          <Bar dataKey="count" name="Subscriptions" radius={[0, 4, 4, 0]}>
                            {(
                              metrics.planDistribution as Array<{ plan: string; count: number }>
                            ).map((_, i) => (
                              <Cell key={i} fill={[GOLD, BLUE, VIOLET, EMERALD, AMBER][i % 5]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">
                        No subscription data yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Active user trend */}
                <div className="bg-[#111318] border border-[#1e2230] rounded-xl p-5">
                  <SectionHeader title="Active User Trends" sub="7-day vs 30-day active users" />
                  <div className="grid grid-cols-3 gap-6 mt-2">
                    <div className="text-center">
                      <p className="text-3xl font-bold" style={{ color: VIOLET }}>
                        {fmt(summary.totalUsers ?? 0)}
                      </p>
                      <p className="text-xs text-[#7a8099] mt-1">Total Users</p>
                    </div>
                    <div className="text-center border-x border-[#1e2230]">
                      <p className="text-3xl font-bold" style={{ color: BLUE }}>
                        {fmt(summary.activeUsers30d ?? 0)}
                      </p>
                      <p className="text-xs text-[#7a8099] mt-1">Monthly Active (MAU)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold" style={{ color: EMERALD }}>
                        {fmt(summary.newUsersThisMonth ?? 0)}
                      </p>
                      <p className="text-xs text-[#7a8099] mt-1">New This Month</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── Funnel Analytics Tab ── */}
        {tab === 'funnel' && (
          <>
            {!funnel ? (
              <div className="text-center py-20 text-zinc-600">Loading funnel data...</div>
            ) : (
              <>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-[#111318] border border-[#1e2230] rounded-xl p-5">
                    <SectionHeader
                      title="Conversion Funnel"
                      sub={`Overall conversion: ${funnel.funnel?.overallConversionRate ?? 0}%`}
                    />
                    <FunnelChart stages={funnel.funnel?.stages ?? []} />
                  </div>
                  <div className="bg-[#111318] border border-[#1e2230] rounded-xl p-5">
                    <SectionHeader title="Stage Summary" sub="Key funnel metrics" />
                    <div className="space-y-3 mt-2">
                      {(funnel.funnel?.stages ?? []).map(
                        (stage: {
                          stage: string;
                          count: number;
                          rate: number;
                          dropOff?: number;
                        }) => (
                          <div
                            key={stage.stage}
                            className="flex items-center justify-between border-b border-[#1e2230] pb-2"
                          >
                            <span className="text-sm text-zinc-300">{stage.stage}</span>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-zinc-100">
                                {fmt(stage.count)}
                              </p>
                              <p className="text-xs text-[#7a8099]">{stage.rate}% of total</p>
                            </div>
                          </div>
                        ),
                      )}
                      <div className="pt-1">
                        <p className="text-xs text-[#7a8099]">Overall conversion rate</p>
                        <p className="text-lg font-bold" style={{ color: EMERALD }}>
                          {funnel.funnel?.overallConversionRate ?? 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111318] border border-[#1e2230] rounded-xl p-5">
                  <SectionHeader
                    title="Monthly Funnel Trends"
                    sub="Signups, activations & paid conversions by month"
                  />
                  <MonthlyFunnelChart data={funnel.monthlyFunnel ?? []} />
                </div>
              </>
            )}
          </>
        )}

        {/* ── Cohort Retention Tab ── */}
        {tab === 'cohort' && (
          <>
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-1 bg-[#111318] border border-[#1e2230] rounded-lg p-1">
                <button
                  onClick={() => setCohortGranularity('month')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    cohortGranularity === 'month'
                      ? 'bg-[#1e2230] text-zinc-100 font-medium'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setCohortGranularity('week')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    cohortGranularity === 'week'
                      ? 'bg-[#1e2230] text-zinc-100 font-medium'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Weekly
                </button>
              </div>
            </div>
            {!cohort ? (
              <div className="text-center py-20 text-zinc-600">Loading cohort data...</div>
            ) : (
              <>
                <div className="bg-[#111318] border border-[#1e2230] rounded-xl p-5">
                  <SectionHeader
                    title="Cohort Retention Matrix"
                    sub={`User retention by signup cohort and ${cohortGranularity === 'week' ? 'week' : 'month'}`}
                  />
                  {cohort.cohorts?.length > 0 ? (
                    <CohortMatrix
                      cohorts={cohort.cohorts}
                      avgRetention={cohort.averageRetentionCurve ?? []}
                      periodLabels={cohort.periodLabels ?? []}
                    />
                  ) : (
                    <div className="text-center py-12 text-zinc-600 text-sm">
                      Not enough user data for cohort analysis yet.
                      <br />
                      Cohorts appear once users have login history across multiple periods.
                    </div>
                  )}
                </div>

                {(cohort.averageRetentionCurve?.length ?? 0) > 0 && (
                  <div className="bg-[#111318] border border-[#1e2230] rounded-xl p-5">
                    <SectionHeader
                      title="Average Retention Curve"
                      sub={`Aggregate retention across all cohorts — by ${cohortGranularity === 'week' ? 'week' : 'month'}`}
                    />
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart
                        data={(cohort.periodLabels ?? []).map((label: string, i: number) => ({
                          period: label,
                          retention: cohort.averageRetentionCurve[i] ?? 0,
                        }))}
                        margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={EMERALD} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={EMERALD} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" />
                        <XAxis
                          dataKey="period"
                          tick={{ fontSize: 10, fill: MUTED }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: MUTED }}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          {...TOOLTIP_STYLE}
                          formatter={(v: number) => [`${v}%`, 'Retention']}
                        />
                        <ReferenceLine
                          y={40}
                          stroke={AMBER}
                          strokeDasharray="4 2"
                          label={{ value: '40% target', fontSize: 9, fill: AMBER }}
                        />
                        <Area
                          type="monotone"
                          dataKey="retention"
                          stroke={EMERALD}
                          strokeWidth={2}
                          fill="url(#retGrad)"
                          dot={{ fill: EMERALD, r: 3 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Change Audit Tab ── */}
        {tab === 'diffs' && (
          <>
            <div className="bg-[#111318] border border-[#1e2230] rounded-xl p-5">
              <SectionHeader
                title="Change Audit Report"
                sub="Before/after diff view for entity mutations tracked in audit events"
              />
              {diffsLoading ? (
                <div className="text-center py-20 text-zinc-600">Loading audit diffs...</div>
              ) : diffs.length === 0 ? (
                <div className="text-center py-12 text-zinc-600 text-sm">
                  No audit diffs found.
                  <br />
                  Diffs appear when entities are updated with old value tracking enabled.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="text-xs w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[#1e2230]">
                        {[
                          'Timestamp',
                          'Actor',
                          'Action',
                          'Entity Type',
                          'Entity ID',
                          'Changes',
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left text-zinc-500 uppercase tracking-widest pb-2 pr-4 font-normal whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {diffs.map((diff) => {
                        const oldVals =
                          diff.oldValues && typeof diff.oldValues === 'object'
                            ? (diff.oldValues as Record<string, unknown>)
                            : {};
                        const newVals =
                          diff.newValues && typeof diff.newValues === 'object'
                            ? (diff.newValues as Record<string, unknown>)
                            : {};
                        const changedKeys = Array.from(
                          new Set([...Object.keys(oldVals), ...Object.keys(newVals)]),
                        ).filter((k) => JSON.stringify(oldVals[k]) !== JSON.stringify(newVals[k]));
                        return (
                          <tr
                            key={diff.id}
                            className="border-b border-[#1a1d27] hover:bg-[#131620] transition-colors"
                          >
                            <td className="py-2 pr-4 text-zinc-500 whitespace-nowrap">
                              {diff.createdAt ? new Date(diff.createdAt).toLocaleString() : '—'}
                            </td>
                            <td className="py-2 pr-4 text-zinc-300">
                              {diff.userEmail ?? diff.userName ?? 'system'}
                            </td>
                            <td className="py-2 pr-4">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
                                {diff.action}
                              </span>
                            </td>
                            <td className="py-2 pr-4 text-zinc-400 font-mono">{diff.entityType}</td>
                            <td className="py-2 pr-4 text-zinc-500 font-mono">{diff.entityId}</td>
                            <td className="py-2">
                              <div className="space-y-0.5">
                                {changedKeys.length === 0 ? (
                                  <span className="text-zinc-600">no field changes</span>
                                ) : (
                                  changedKeys.slice(0, 4).map((k) => (
                                    <div key={k} className="flex items-center gap-1 text-[10px]">
                                      <span className="text-zinc-500">{k}:</span>
                                      <span className="text-red-400 line-through">
                                        {JSON.stringify(oldVals[k])?.slice(0, 20)}
                                      </span>
                                      <span className="text-zinc-600">→</span>
                                      <span className="text-emerald-400">
                                        {JSON.stringify(newVals[k])?.slice(0, 20)}
                                      </span>
                                    </div>
                                  ))
                                )}
                                {changedKeys.length > 4 && (
                                  <span className="text-zinc-600 text-[10px]">
                                    +{changedKeys.length - 4} more
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
