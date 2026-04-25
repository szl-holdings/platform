import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  Activity,
  AlertTriangle,
  Database,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { OpsLayout } from '../components/ops-layout';

interface ApiCostsResponse {
  domains: Array<{
    id: string;
    name: string;
    color: string;
    budget: number;
    spent: number;
    apiCalls: number;
    storage: number;
    compute: number;
    trend: number;
  }>;
  summary: {
    totalSpent: number;
    totalBudget: number;
    overBudget: number;
    totalApiCalls: number;
    totalStorageTb: number;
  };
  generatedAt: string;
  dataSource: string;
}

const FALLBACK_DOMAIN_BUDGETS = [
  {
    id: 'aegis',
    name: 'Aegis',
    color: '#ef4444',
    budget: 28000,
    spent: 24800,
    apiCalls: 1420000,
    storage: 4.2,
    compute: 18,
    trend: +12,
  },
  {
    id: 'vessels',
    name: 'Vessels',
    color: '#0ea5e9',
    budget: 35000,
    spent: 38200,
    apiCalls: 2100000,
    storage: 11.8,
    compute: 31,
    trend: +24,
  },
  {
    id: 'terra',
    name: 'Terra',
    color: '#22c55e',
    budget: 18000,
    spent: 15300,
    apiCalls: 840000,
    storage: 6.1,
    compute: 14,
    trend: -8,
  },
  {
    id: 'lyte',
    name: 'Lyte',
    color: '#f97316',
    budget: 22000,
    spent: 19700,
    apiCalls: 3200000,
    storage: 2.4,
    compute: 22,
    trend: +6,
  },
  {
    id: 'prism',
    name: 'PRAXIS',
    color: '#a855f7',
    budget: 12000,
    spent: 10100,
    apiCalls: 420000,
    storage: 8.9,
    compute: 9,
    trend: +3,
  },
  {
    id: 'szl',
    name: 'SZL Holdings',
    color: '#f59e0b',
    budget: 8000,
    spent: 6800,
    apiCalls: 180000,
    storage: 1.2,
    compute: 6,
    trend: -2,
  },
  {
    id: 'carlota',
    name: 'Carlota Jo',
    color: '#ec4899',
    budget: 5000,
    spent: 4100,
    apiCalls: 95000,
    storage: 0.8,
    compute: 4,
    trend: +1,
  },
];

const MONTHLY_COST = [
  { month: 'Nov', total: 98000 },
  { month: 'Dec', total: 107000 },
  { month: 'Jan', total: 112000 },
  { month: 'Feb', total: 108000 },
  { month: 'Mar', total: 115000 },
  { month: 'Apr', total: 119000, projected: true },
];

const DAILY_COST = Array.from({ length: 15 }, (_, i) => ({
  day: `Apr ${i + 1}`,
  aegis: 820 + Math.random() * 200,
  vessels: 1240 + Math.random() * 300,
  terra: 510 + Math.random() * 150,
  lyte: 660 + Math.random() * 180,
  prism: 340 + Math.random() * 100,
}));

const API_BREAKDOWN = [
  { name: 'External Market Data', cost: 18400, calls: 2400000 },
  { name: 'AI / LLM Inference', cost: 12800, calls: 890000 },
  { name: 'Satellite AIS Feeds', cost: 9200, calls: 1200000 },
  { name: 'Legal Databases', cost: 7600, calls: 420000 },
  { name: 'Geospatial APIs', cost: 4800, calls: 680000 },
  { name: 'Weather & Metocean', cost: 3100, calls: 960000 },
];

export default function CostsPage() {
  const [period, setPeriod] = useState<'mtd' | '3m' | 'ytd'>('mtd');
  const [view, setView] = useState<'overview' | 'api' | 'domains'>('overview');

  const { data: apiData } = useStandardQuery<ApiCostsResponse>({
    queryKey: ['command-costs'],
    queryFn: async () => {
      const res = await fetch('/api/command/costs', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load costs');
      const json = await res.json();
      return (json?.data ?? json) as ApiCostsResponse;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const DOMAIN_BUDGETS = apiData?.domains ?? FALLBACK_DOMAIN_BUDGETS;
  const TOTAL_BUDGET =
    apiData?.summary?.totalBudget ?? DOMAIN_BUDGETS.reduce((s, d) => s + d.budget, 0);
  const TOTAL_SPENT =
    apiData?.summary?.totalSpent ?? DOMAIN_BUDGETS.reduce((s, d) => s + d.spent, 0);
  const OVERBUDGET = DOMAIN_BUDGETS.filter((d) => d.spent > d.budget);

  return (
    <OpsLayout title="Cost & Usage Analytics">
      <div className="flex flex-col gap-6">
        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'MTD Spend',
              value: `$${(TOTAL_SPENT / 1000).toFixed(1)}k`,
              sub: `of $${(TOTAL_BUDGET / 1000).toFixed(0)}k budget`,
              icon: DollarSign,
              color: TOTAL_SPENT > TOTAL_BUDGET ? 'var(--color-critical)' : '#8b7ac8',
            },
            {
              label: 'Over Budget',
              value: OVERBUDGET.length,
              sub: `domain${OVERBUDGET.length !== 1 ? 's' : ''} exceeding`,
              icon: AlertTriangle,
              color: OVERBUDGET.length > 0 ? 'var(--color-high)' : 'var(--color-low)',
            },
            {
              label: 'Total API Calls',
              value: `${(DOMAIN_BUDGETS.reduce((s, d) => s + d.apiCalls, 0) / 1000000).toFixed(1)}M`,
              sub: 'this month',
              icon: Activity,
              color: '#0ea5e9',
            },
            {
              label: 'Total Storage',
              value: `${DOMAIN_BUDGETS.reduce((s, d) => s + d.storage, 0).toFixed(1)} TB`,
              sub: 'across ecosystem',
              icon: Database,
              color: '#22c55e',
            },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div
              key={label}
              className="p-4 rounded-xl"
              style={{
                backgroundColor: 'var(--color-surface-base)',
                border: '1px solid var(--color-surface-border)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span
                  className="text-[10px] font-mono uppercase tracking-widest"
                  style={{ color: 'var(--color-fg-muted)' }}
                >
                  {label}
                </span>
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color }}>
                {value}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-fg-muted)' }}>
                {sub}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className="flex gap-1 p-1 rounded-lg"
            style={{
              backgroundColor: 'var(--color-surface-base)',
              border: '1px solid var(--color-surface-border)',
            }}
          >
            {(['mtd', '3m', 'ytd'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-3 py-1 rounded-md text-xs font-medium uppercase"
                style={{
                  backgroundColor: period === p ? 'var(--color-bg-elevated)' : 'transparent',
                  color: period === p ? 'var(--color-fg-primary)' : 'var(--color-fg-muted)',
                }}
              >
                {p === 'mtd' ? 'MTD' : p === '3m' ? '3 Months' : 'YTD'}
              </button>
            ))}
          </div>
          <div
            className="flex gap-1 p-1 rounded-lg ml-auto"
            style={{
              backgroundColor: 'var(--color-surface-base)',
              border: '1px solid var(--color-surface-border)',
            }}
          >
            {(['overview', 'api', 'domains'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1 rounded-md text-xs font-medium capitalize"
                style={{
                  backgroundColor: view === v ? 'var(--color-bg-elevated)' : 'transparent',
                  color: view === v ? 'var(--color-fg-primary)' : 'var(--color-fg-muted)',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {view === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Trend Chart */}
              <div
                className="rounded-xl p-5"
                style={{
                  backgroundColor: 'var(--color-surface-base)',
                  border: '1px solid var(--color-surface-border)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: 'var(--color-fg-muted)' }}
                  >
                    Monthly Spend
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--color-high)' }}>
                    +3.5% vs last month
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={MONTHLY_COST}>
                    <defs>
                      <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b7ac8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b7ac8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1d2e',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                      formatter={(v: number) => [`$${v.toLocaleString()}`, 'Total']}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#8b7ac8"
                      strokeWidth={2}
                      fill="url(#costGrad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Daily Breakdown */}
              <div
                className="rounded-xl p-5"
                style={{
                  backgroundColor: 'var(--color-surface-base)',
                  border: '1px solid var(--color-surface-border)',
                }}
              >
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: 'var(--color-fg-muted)' }}
                >
                  Daily Cost by Domain (Apr)
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={DAILY_COST.slice(-10)} barSize={6} barGap={2}>
                    <XAxis
                      dataKey="day"
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1d2e',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '10px',
                      }}
                    />
                    {[
                      { key: 'vessels', color: '#0ea5e9' },
                      { key: 'aegis', color: '#ef4444' },
                      { key: 'lyte', color: '#f97316' },
                      { key: 'terra', color: '#22c55e' },
                      { key: 'prism', color: '#a855f7' },
                    ].map(({ key, color }) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        stackId="a"
                        fill={color}
                        radius={key === 'prism' ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Budget by Domain */}
            <div className="flex flex-col gap-3">
              <div
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--color-fg-muted)' }}
              >
                Budget Utilization
              </div>
              {DOMAIN_BUDGETS.map((d) => {
                const pct = Math.min((d.spent / d.budget) * 100, 100);
                const over = d.spent > d.budget;
                return (
                  <div
                    key={d.id}
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: 'var(--color-surface-base)',
                      border: `1px solid ${over ? 'var(--color-critical)' : 'var(--color-surface-border)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: d.color }}
                        />
                        <span className="text-xs font-semibold" style={{ color: d.color }}>
                          {d.name}
                        </span>
                      </div>
                      {over && (
                        <AlertTriangle
                          className="w-3 h-3"
                          style={{ color: 'var(--color-critical)' }}
                        />
                      )}
                    </div>
                    <div
                      className="h-1.5 rounded-full mb-2"
                      style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: over ? 'var(--color-critical)' : d.color,
                        }}
                      />
                    </div>
                    <div
                      className="flex justify-between text-[10px] font-mono"
                      style={{ color: 'var(--color-fg-muted)' }}
                    >
                      <span
                        style={{
                          color: over ? 'var(--color-critical)' : 'var(--color-fg-secondary)',
                        }}
                      >
                        ${(d.spent / 1000).toFixed(1)}k spent
                      </span>
                      <span>${(d.budget / 1000).toFixed(0)}k budget</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {d.trend > 0 ? (
                        <TrendingUp className="w-3 h-3" style={{ color: 'var(--color-high)' }} />
                      ) : (
                        <TrendingDown className="w-3 h-3" style={{ color: 'var(--color-low)' }} />
                      )}
                      <span
                        className="text-[10px]"
                        style={{ color: d.trend > 0 ? 'var(--color-high)' : 'var(--color-low)' }}
                      >
                        {d.trend > 0 ? '+' : ''}
                        {d.trend}% vs last month
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'api' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div
              className="rounded-xl p-5"
              style={{
                backgroundColor: 'var(--color-surface-base)',
                border: '1px solid var(--color-surface-border)',
              }}
            >
              <div
                className="text-xs font-bold uppercase tracking-widest mb-4"
                style={{ color: 'var(--color-fg-muted)' }}
              >
                External API Costs MTD
              </div>
              <div className="flex flex-col gap-3">
                {API_BREAKDOWN.map((api, i) => {
                  const maxCost = Math.max(...API_BREAKDOWN.map((a) => a.cost));
                  const pct = (api.cost / maxCost) * 100;
                  const colors = ['#8b7ac8', '#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#f59e0b'];
                  return (
                    <div key={api.name}>
                      <div className="flex justify-between mb-1">
                        <span
                          className="text-xs font-medium"
                          style={{ color: 'var(--color-fg-secondary)' }}
                        >
                          {api.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span
                            className="text-[10px] font-mono"
                            style={{ color: 'var(--color-fg-muted)' }}
                          >
                            {(api.calls / 1000000).toFixed(1)}M calls
                          </span>
                          <span
                            className="text-xs font-bold font-mono"
                            style={{ color: 'var(--color-fg-primary)' }}
                          >
                            ${(api.cost / 1000).toFixed(1)}k
                          </span>
                        </div>
                      </div>
                      <div
                        className="h-2 rounded-full"
                        style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: colors[i] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                className="mt-4 pt-4 flex justify-between"
                style={{ borderTop: '1px solid var(--color-surface-border)' }}
              >
                <span className="text-xs font-bold" style={{ color: 'var(--color-fg-muted)' }}>
                  Total API Cost
                </span>
                <span className="text-sm font-bold font-mono" style={{ color: '#8b7ac8' }}>
                  ${API_BREAKDOWN.reduce((s, a) => s + a.cost, 0).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div
                className="rounded-xl p-5"
                style={{
                  backgroundColor: 'var(--color-surface-base)',
                  border: '1px solid var(--color-surface-border)',
                }}
              >
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: 'var(--color-fg-muted)' }}
                >
                  Resource Consumption
                </div>
                {DOMAIN_BUDGETS.map((d) => (
                  <div
                    key={d.id}
                    className="grid items-center gap-3 py-2"
                    style={{
                      gridTemplateColumns: '80px 1fr 60px 60px',
                      borderBottom: '1px solid var(--color-surface-border)',
                    }}
                  >
                    <span className="text-xs" style={{ color: d.color }}>
                      {d.name}
                    </span>
                    <div className="flex gap-2">
                      <div
                        className="flex-1 h-1.5 rounded-full"
                        style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(d.compute / 35) * 100}%`, backgroundColor: d.color }}
                        />
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-mono text-right"
                      style={{ color: 'var(--color-fg-muted)' }}
                    >
                      {d.compute} vCPU
                    </span>
                    <span
                      className="text-[10px] font-mono text-right"
                      style={{ color: 'var(--color-fg-muted)' }}
                    >
                      {d.storage} TB
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="rounded-xl p-5"
                style={{
                  backgroundColor: 'var(--color-surface-base)',
                  border: '1px solid var(--color-surface-border)',
                }}
              >
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: 'var(--color-fg-muted)' }}
                >
                  Overage Alerts
                </div>
                {DOMAIN_BUDGETS.filter((d) => d.spent > d.budget).map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 p-3 rounded-lg mb-2"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-critical) 8%, transparent)',
                      border:
                        '1px solid color-mix(in srgb, var(--color-critical) 20%, transparent)',
                    }}
                  >
                    <AlertTriangle
                      className="w-4 h-4 shrink-0"
                      style={{ color: 'var(--color-critical)' }}
                    />
                    <div>
                      <div className="text-xs font-bold" style={{ color: d.color }}>
                        {d.name}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--color-fg-muted)' }}>
                        ${(d.spent - d.budget).toLocaleString()} over budget (+
                        {Math.round((d.spent / d.budget - 1) * 100)}%)
                      </div>
                    </div>
                  </div>
                ))}
                {OVERBUDGET.length === 0 && (
                  <div
                    className="text-xs text-center py-4"
                    style={{ color: 'var(--color-fg-muted)' }}
                  >
                    All domains within budget
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'domains' && (
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'var(--color-surface-base)',
              border: '1px solid var(--color-surface-border)',
            }}
          >
            <div
              className="grid px-5 py-3 text-[10px] font-mono uppercase tracking-widest"
              style={{
                gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr',
                color: 'var(--color-fg-muted)',
                borderBottom: '1px solid var(--color-surface-border)',
              }}
            >
              <span>Domain</span>
              <span>Budget</span>
              <span>Spent</span>
              <span>Utilization</span>
              <span>API Calls</span>
              <span>Trend</span>
            </div>
            {DOMAIN_BUDGETS.map((d) => {
              const pct = Math.round((d.spent / d.budget) * 100);
              const over = d.spent > d.budget;
              return (
                <div
                  key={d.id}
                  className="grid items-center px-5 py-4 transition-colors hover:bg-[var(--color-bg-elevated)]"
                  style={{
                    gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr',
                    borderBottom: '1px solid var(--color-surface-border)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-sm font-semibold" style={{ color: d.color }}>
                      {d.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono" style={{ color: 'var(--color-fg-muted)' }}>
                    ${(d.budget / 1000).toFixed(0)}k
                  </span>
                  <span
                    className="text-xs font-mono font-bold"
                    style={{ color: over ? 'var(--color-critical)' : 'var(--color-fg-primary)' }}
                  >
                    ${(d.spent / 1000).toFixed(1)}k
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-16 h-1.5 rounded-full"
                      style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: over ? 'var(--color-critical)' : d.color,
                        }}
                      />
                    </div>
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: over ? 'var(--color-critical)' : 'var(--color-fg-muted)' }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <span className="text-xs font-mono" style={{ color: 'var(--color-fg-muted)' }}>
                    {(d.apiCalls / 1000000).toFixed(1)}M
                  </span>
                  <div className="flex items-center gap-1">
                    {d.trend > 0 ? (
                      <TrendingUp className="w-3 h-3" style={{ color: 'var(--color-high)' }} />
                    ) : (
                      <TrendingDown className="w-3 h-3" style={{ color: 'var(--color-low)' }} />
                    )}
                    <span
                      className="text-xs"
                      style={{ color: d.trend > 0 ? 'var(--color-high)' : 'var(--color-low)' }}
                    >
                      {d.trend > 0 ? '+' : ''}
                      {d.trend}%
                    </span>
                  </div>
                </div>
              );
            })}
            <div
              className="grid items-center px-5 py-3 text-xs font-bold"
              style={{
                gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr',
                backgroundColor: 'var(--color-bg-elevated)',
              }}
            >
              <span style={{ color: 'var(--color-fg-muted)' }}>TOTAL</span>
              <span className="font-mono" style={{ color: 'var(--color-fg-muted)' }}>
                ${(TOTAL_BUDGET / 1000).toFixed(0)}k
              </span>
              <span className="font-mono" style={{ color: '#8b7ac8' }}>
                ${(TOTAL_SPENT / 1000).toFixed(1)}k
              </span>
              <span style={{ color: 'var(--color-fg-muted)' }}>
                {Math.round((TOTAL_SPENT / TOTAL_BUDGET) * 100)}%
              </span>
              <span className="font-mono" style={{ color: 'var(--color-fg-muted)' }}>
                {(DOMAIN_BUDGETS.reduce((s, d) => s + d.apiCalls, 0) / 1000000).toFixed(1)}M
              </span>
              <span />
            </div>
          </div>
        )}
      </div>
    </OpsLayout>
  );
}
