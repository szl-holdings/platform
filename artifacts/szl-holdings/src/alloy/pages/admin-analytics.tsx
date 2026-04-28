import { useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { DataStateBadge } from '@szl-holdings/shared-ui/data-state-badge';
import {
  Activity,
  BarChart2,
  Clock,
  DollarSign,
  Radio,
  Shield,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
  Cell,
  Pie,
  PieChart,
} from 'recharts';

interface TenantSummary {
  id: number;
  name: string;
  agentRuns: number;
  skillInvocations: number;
  costUsd: number;
  budgetUsd: number;
  policyViolations: number;
  approvalLatencyAvgMin: number;
  activeUsers: number;
  modelUsage: Record<string, number>;
}

const DEMO_TENANTS: TenantSummary[] = [
  {
    id: 1,
    name: 'Acme Corp',
    agentRuns: 847,
    skillInvocations: 2341,
    costUsd: 412.5,
    budgetUsd: 500,
    policyViolations: 3,
    approvalLatencyAvgMin: 18,
    activeUsers: 12,
    modelUsage: { 'claude-sonnet-4-6': 441, 'gpt-5.2': 289, 'gpt-4o': 117 },
  },
  {
    id: 2,
    name: 'Meridian Financial',
    agentRuns: 1204,
    skillInvocations: 3892,
    costUsd: 287.2,
    budgetUsd: 1000,
    policyViolations: 1,
    approvalLatencyAvgMin: 42,
    activeUsers: 28,
    modelUsage: { 'claude-sonnet-4-6': 680, 'gpt-5.2': 420, 'gpt-4o': 104 },
  },
  {
    id: 3,
    name: 'Cascade Health',
    agentRuns: 320,
    skillInvocations: 940,
    costUsd: 178.0,
    budgetUsd: 750,
    policyViolations: 0,
    approvalLatencyAvgMin: 7,
    activeUsers: 9,
    modelUsage: { 'claude-sonnet-4-6': 210, 'gpt-5.2': 88, 'gpt-4o': 22 },
  },
];

const MODEL_COLORS: Record<string, string> = {
  'claude-sonnet-4-6': '#8b5cf6',
  'gpt-5.2': '#4B8BDB',
  'gpt-4o': 'var(--gi-accent-blue)',
  'gemini-3.1-pro-preview': '#10b981',
};

const PIE_COLORS = ['#8b5cf6', '#4B8BDB', 'var(--gi-accent-blue)', '#10b981', '#f59e0b'];

function formatUsd(n: number) {
  return `$${n.toFixed(2)}`;
}

function BudgetBar({ used, total }: { used: number; total: number }) {
  const pct = Math.min(100, Math.round((used / total) * 100));
  const color = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {pct}% used
        </span>
        <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {formatUsd(used)} / {formatUsd(total)}
        </span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function _TenantRow({ tenant }: { tenant: TenantSummary }) {
  const budgetPct = Math.min(100, Math.round((tenant.costUsd / tenant.budgetUsd) * 100));
  const budgetColor = budgetPct >= 100 ? '#ef4444' : budgetPct >= 80 ? '#f59e0b' : '#10b981';

  const topModel = Object.entries(tenant.modelUsage).sort((a, b) => b[1] - a[1])[0];

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="text-sm font-semibold text-white mb-0.5">{tenant.name}</div>
          <div
            className="flex items-center gap-2 text-[10px]"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <span className="flex items-center gap-1">
              <Users className="w-2.5 h-2.5" />
              {tenant.activeUsers} users
            </span>
            <span className="flex items-center gap-1">
              <Activity className="w-2.5 h-2.5" />
              {tenant.agentRuns.toLocaleString()} runs
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" />
              {tenant.skillInvocations.toLocaleString()} skills
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold" style={{ color: budgetColor }}>
            {formatUsd(tenant.costUsd)}
          </div>
          <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            of {formatUsd(tenant.budgetUsd)} budget
          </div>
        </div>
      </div>

      <BudgetBar used={tenant.costUsd} total={tenant.budgetUsd} />

      <div className="grid grid-cols-3 gap-2 mt-3">
        <div
          className="rounded-lg p-2 text-center"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div
            className="text-base font-bold"
            style={{ color: tenant.policyViolations > 0 ? '#f59e0b' : '#6b7280' }}
          >
            {tenant.policyViolations}
          </div>
          <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Violations
          </div>
        </div>
        <div
          className="rounded-lg p-2 text-center"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div className="text-base font-bold text-white">{tenant.approvalLatencyAvgMin}m</div>
          <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Avg Approval
          </div>
        </div>
        <div
          className="rounded-lg p-2 text-center"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div
            className="text-[10px] font-semibold"
            style={{ color: MODEL_COLORS[topModel?.[0] ?? ''] ?? '#6b7280' }}
          >
            {topModel?.[0]
              ?.replace('claude-sonnet-4-6', 'Claude')
              .replace('gpt-5.2', 'GPT-5.2')
              .replace('gpt-4o', 'GPT-4o') ?? '—'}
          </div>
          <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Top Model
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [tab, setTab] = useState<'overview' | 'tenants' | 'models'>('overview');

  const { data: liveAnalytics } = useStandardQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      try {
        return await apiFetch<{
          runCount7d: number;
          totalCostMtdUsd: number;
          openIncidents: number;
          activePolicies: number;
          skillInvocationsMtd: number;
          avgApprovalLatencyMin: number;
          modelUsage: Array<{ model: string; calls: number; costUsd: number }>;
          tenantBreakdown: Array<{
            orgId: number | null;
            totalCostMtdUsd: number;
            eventCount: number;
          }>;
          recentIncidents: unknown[];
        }>('/alloy/admin/analytics');
      } catch {
        return null;
      }
    },
    retry: 1,
    staleTime: 60000,
  });

  const isDemo = !liveAnalytics;

  // Use live API data when available; fall back to demo constants only when isDemo
  const DEMO_TOTAL_RUNS = DEMO_TENANTS.reduce((s, t) => s + t.agentRuns, 0);
  const DEMO_TOTAL_COST = DEMO_TENANTS.reduce((s, t) => s + t.costUsd, 0);
  const DEMO_TOTAL_VIOLATIONS = DEMO_TENANTS.reduce((s, t) => s + t.policyViolations, 0);
  const DEMO_AVG_LATENCY = Math.round(
    DEMO_TENANTS.reduce((s, t) => s + t.approvalLatencyAvgMin, 0) / DEMO_TENANTS.length,
  );

  const totalRuns = isDemo ? DEMO_TOTAL_RUNS : liveAnalytics.runCount7d;
  const totalCost = isDemo ? DEMO_TOTAL_COST : liveAnalytics.totalCostMtdUsd;
  const totalViolations = isDemo ? DEMO_TOTAL_VIOLATIONS : liveAnalytics.openIncidents;
  const avgApprovalLatency = isDemo ? DEMO_AVG_LATENCY : (liveAnalytics.avgApprovalLatencyMin ?? 0);

  const DEMO_MODEL_AGGS = DEMO_TENANTS.reduce(
    (acc, t) => {
      for (const [model, count] of Object.entries(t.modelUsage)) {
        acc[model] = (acc[model] ?? 0) + count;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const modelPieData = isDemo
    ? Object.entries(DEMO_MODEL_AGGS)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({
          name: name.replace('claude-sonnet-4-6', 'Claude').replace('gpt-5.2', 'GPT-5.2'),
          value,
        }))
    : (liveAnalytics.modelUsage ?? [])
        .sort((a, b) => b.calls - a.calls)
        .map((m) => ({ name: m.model, value: m.calls }));

  const totalModelCalls = isDemo
    ? Object.values(DEMO_MODEL_AGGS).reduce((s, v) => s + v, 0)
    : (liveAnalytics.modelUsage ?? []).reduce((s, m) => s + m.calls, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-5 p-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-3.5 h-3.5" style={{ color: '#4B8BDB' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: '#4B8BDB' }}
            >
              Counsel · Admin Analytics
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Admin Analytics</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Platform-wide: runs, costs, policy violations, approval latency, and model usage by
            tenant.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DataStateBadge state={isDemo ? 'demo' : 'live'} />
        </div>
      </div>

      {isDemo && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-medium border"
          style={{
            background: 'rgba(75,139,219,0.04)',
            borderColor: 'rgba(75,139,219,0.1)',
            color: 'rgba(75,139,219,0.6)',
          }}
        >
          <Radio className="w-3 h-3 shrink-0 animate-pulse" />
          Demo Mode — Showing illustrative tenant analytics. Connect to live data for real metrics.
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: 'Total Agent Runs',
            value: totalRuns.toLocaleString(),
            color: '#4B8BDB',
            icon: Activity,
          },
          {
            label: 'Platform Cost (MTD)',
            value: formatUsd(totalCost),
            color: '#f59e0b',
            icon: DollarSign,
          },
          {
            label: 'Policy Violations',
            value: totalViolations,
            color: totalViolations > 0 ? '#ef4444' : '#6b7280',
            icon: Shield,
          },
          {
            label: 'Avg Approval Latency',
            value: `${avgApprovalLatency}m`,
            color: avgApprovalLatency > 30 ? '#f59e0b' : '#10b981',
            icon: Clock,
          },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-xl border p-4"
              style={{
                borderColor: 'rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <div className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {c.label}
                </div>
              </div>
              <div className="text-2xl font-bold" style={{ color: c.color }}>
                {c.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {(['overview', 'tenants', 'models'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize"
            style={{
              borderColor: tab === t ? 'rgba(75,139,219,0.3)' : 'rgba(255,255,255,0.08)',
              background: tab === t ? 'rgba(75,139,219,0.08)' : 'transparent',
              color: tab === t ? '#4B8BDB' : 'rgba(255,255,255,0.4)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-xl border p-5"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="text-sm font-semibold text-white mb-4">Agent Runs — 7 Days</div>
            <div className="h-48 flex items-center justify-center">
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Per-day run history requires time-series aggregation API
              </span>
            </div>
          </div>

          <div
            className="rounded-xl border p-5"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="text-sm font-semibold text-white mb-4">Cost by Tenant (MTD)</div>
            <div className="space-y-4">
              {(liveAnalytics?.tenantBreakdown ?? []).length === 0 ? (
                <div
                  className="text-center py-4 text-[11px]"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  No tenant cost data available
                </div>
              ) : (
                (liveAnalytics?.tenantBreakdown ?? []).map((t) => (
                  <div key={t.orgId ?? 0}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-white">Org #{t.orgId ?? '—'}</span>
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                      >
                        ${t.totalCostMtdUsd.toFixed(2)}
                      </span>
                    </div>
                    <BudgetBar used={t.totalCostMtdUsd} total={Math.max(t.totalCostMtdUsd, 100)} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className="rounded-xl border p-5"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="text-sm font-semibold text-white mb-4">Model Usage Distribution</div>
            <div className="flex items-center gap-4">
              <div className="h-32 w-32 shrink-0">
                <PieChart width={128} height={128}>
                  <Pie
                    data={modelPieData}
                    cx={60}
                    cy={60}
                    innerRadius={32}
                    outerRadius={58}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {modelPieData.map((entry, idx) => (
                      <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </div>
              <div className="space-y-2 flex-1">
                {modelPieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-[10px] text-white">{d.name}</span>
                    </div>
                    <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {Math.round((d.value / totalModelCalls) * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="rounded-xl border p-5"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-white">Policy Violations by Type</div>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-mono border"
                style={{
                  color: 'rgba(75,139,219,0.6)',
                  borderColor: 'rgba(75,139,219,0.2)',
                  background: 'rgba(75,139,219,0.04)',
                }}
              >
                Demo Data
              </span>
            </div>
            <div className="space-y-3">
              {[
                { type: 'Cost Threshold Alert', count: 2, color: '#f59e0b' },
                { type: 'Policy Violation (Blocked)', count: 1, color: '#ef4444' },
                { type: 'User Override Attempts', count: 1, color: '#8b5cf6' },
                { type: 'Model Routing Blocked', count: 0, color: '#6b7280' },
              ].map((v) => (
                <div key={v.type} className="flex items-center gap-3">
                  <div
                    className="w-16 text-[10px] font-mono text-right shrink-0"
                    style={{ color: v.color }}
                  >
                    {v.count}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-white">{v.type}</span>
                    </div>
                    <div
                      className="h-1.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(v.count / 4) * 100}%`, background: v.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'tenants' && (
        <div className="space-y-3">
          {(liveAnalytics?.tenantBreakdown ?? []).length === 0 ? (
            <div
              className="rounded-xl border p-8 text-center"
              style={{
                borderColor: 'rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.01)',
              }}
            >
              <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                No tenant data available — usage events will populate this view
              </div>
            </div>
          ) : (
            (liveAnalytics?.tenantBreakdown ?? []).map((t) => (
              <div
                key={t.orgId ?? 0}
                className="rounded-xl border p-4"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.01)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">Org #{t.orgId ?? '—'}</div>
                  <div
                    className="flex gap-4 text-[10px] font-mono"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    <span>{t.eventCount} events</span>
                    <span>${t.totalCostMtdUsd.toFixed(2)} MTD</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'models' && (
        <div className="space-y-3">
          <div
            className="rounded-xl border p-5"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="text-sm font-semibold text-white mb-4">Model Invocations Breakdown</div>
            <div className="space-y-4">
              {(isDemo
                ? Object.entries(DEMO_MODEL_AGGS)
                    .sort((a, b) => b[1] - a[1])
                    .map(([model, count]) => ({ model, count }))
                : (liveAnalytics?.modelUsage ?? []).map((m) => ({ model: m.model, count: m.calls }))
              ).map(({ model, count }) => {
                const pct = totalModelCalls > 0 ? Math.round((count / totalModelCalls) * 100) : 0;
                const color = MODEL_COLORS[model] ?? '#6b7280';
                return (
                  <div key={model}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-white">{model}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {count.toLocaleString()} calls
                        </span>
                        <span className="text-[10px] font-bold" style={{ color }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div
                      className="h-2 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Lowest Cost Model',
                value: 'GPT-4o',
                sub: '$0.0024/call avg',
                color: 'var(--gi-accent-blue)',
              },
              {
                label: 'Highest Quality (Eval)',
                value: 'Claude Sonnet',
                sub: '92% user satisfaction',
                color: '#8b5cf6',
              },
              {
                label: 'Most Used (7d)',
                value: 'Claude Sonnet',
                sub: `${(isDemo ? DEMO_MODEL_AGGS['claude-sonnet-4-6'] : (liveAnalytics?.modelUsage?.[0]?.calls ?? 0))?.toLocaleString()} calls`,
                color: '#8b5cf6',
              },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-xl border p-4"
                style={{
                  borderColor: 'rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {c.label}
                </div>
                <div className="text-sm font-bold" style={{ color: c.color }}>
                  {c.value}
                </div>
                <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {c.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
