import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle,
  Cloud,
  DollarSign,
  GitBranch,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const GOLD = '#d4a054';
const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

const SERVICES = [
  {
    name: 'api-gateway',
    provider: 'AWS',
    type: 'EC2',
    mtd: 4820,
    trend: '+8%',
    trendDir: 'up',
    waste: 1240,
    wastePct: 26,
    rightSize: 'm6i.xlarge → m6i.large',
    saving: 640,
    anomaly: false,
  },
  {
    name: 'ml-inference',
    provider: 'AWS',
    type: 'EC2 + GPU',
    mtd: 12400,
    trend: '+22%',
    trendDir: 'up',
    waste: 3800,
    wastePct: 31,
    rightSize: 'p3.2xlarge fleet: reduce from 4 → 2 during off-peak',
    saving: 2100,
    anomaly: true,
  },
  {
    name: 'postgres-primary',
    provider: 'AWS',
    type: 'RDS',
    mtd: 2980,
    trend: '+2%',
    trendDir: 'up',
    waste: 400,
    wastePct: 13,
    rightSize: 'db.r6i.2xlarge adequate',
    saving: 0,
    anomaly: false,
  },
  {
    name: 'order-processor',
    provider: 'GCP',
    type: 'GKE',
    mtd: 8100,
    trend: '-3%',
    trendDir: 'down',
    waste: 2200,
    wastePct: 27,
    rightSize: 'Consolidate 4 node pools → 2',
    saving: 1400,
    anomaly: false,
  },
  {
    name: 'notification-svc',
    provider: 'AWS',
    type: 'Lambda',
    mtd: 340,
    trend: '+5%',
    trendDir: 'up',
    waste: 80,
    wastePct: 24,
    rightSize: 'Reduce memory 1024MB → 512MB on 3 functions',
    saving: 120,
    anomaly: false,
  },
  {
    name: 'elasticsearch',
    provider: 'AWS',
    type: 'OpenSearch',
    mtd: 5600,
    trend: '+15%',
    trendDir: 'up',
    waste: 1900,
    wastePct: 34,
    rightSize: 'Reduce replica count from 3 → 2, enable ILM',
    saving: 1200,
    anomaly: true,
  },
  {
    name: 'cdn-edge',
    provider: 'AWS',
    type: 'CloudFront',
    mtd: 1820,
    trend: '+1%',
    trendDir: 'up',
    waste: 200,
    wastePct: 11,
    rightSize: 'Optimal',
    saving: 0,
    anomaly: false,
  },
  {
    name: 'auth-service',
    provider: 'AWS',
    type: 'EC2',
    mtd: 1240,
    trend: '-5%',
    trendDir: 'down',
    waste: 320,
    wastePct: 26,
    rightSize: 't3.medium → t3.small adequate',
    saving: 280,
    anomaly: false,
  },
];

const MONTH_DATA = [
  { month: 'Oct', cost: 28400, budget: 32000 },
  { month: 'Nov', cost: 30100, budget: 32000 },
  { month: 'Dec', cost: 34800, budget: 35000 },
  { month: 'Jan', cost: 33200, budget: 35000 },
  { month: 'Feb', cost: 35900, budget: 36000 },
  { month: 'Mar', cost: 37300, budget: 36000 },
];

const ANOMALIES = [
  {
    service: 'ml-inference',
    detected: 'Today 14:22',
    event: 'Cost spike +340% — correlated with v2.8.1 deploy at 14:18',
    impact: '+$2,200 projected MoM',
    severity: 'high',
  },
  {
    service: 'elasticsearch',
    detected: 'Yesterday 09:11',
    event: 'Storage cost +180% after log retention policy misconfiguration',
    impact: '+$880 projected MoM',
    severity: 'medium',
  },
  {
    service: 'api-gateway',
    detected: '3 days ago',
    event: 'NAT Gateway egress spike — unoptimized data transfer pattern',
    impact: '+$340 this month',
    severity: 'low',
  },
];

const DEPLOYS = [
  {
    version: 'v2.8.1',
    service: 'ml-inference',
    time: 'Today 14:18',
    costDelta: '+$2,200/mo',
    direction: 'up',
    status: 'anomaly',
  },
  {
    version: 'v4.0.2',
    service: 'order-processor',
    time: 'Yesterday 11:42',
    costDelta: '-$340/mo',
    direction: 'down',
    status: 'ok',
  },
  {
    version: 'v1.9.8',
    service: 'auth-service',
    time: '2 days ago',
    costDelta: '-$120/mo',
    direction: 'down',
    status: 'ok',
  },
  {
    version: 'v3.1.0',
    service: 'notification-svc',
    time: '3 days ago',
    costDelta: '+$80/mo',
    direction: 'up',
    status: 'ok',
  },
  {
    version: 'v6.2.4',
    service: 'api-gateway',
    time: '4 days ago',
    costDelta: '+$40/mo',
    direction: 'up',
    status: 'ok',
  },
];

const RECS = [
  {
    action: 'Right-size ml-inference fleet off-peak',
    saving: 2100,
    effort: 'Low',
    confidence: 91,
    category: 'compute',
  },
  {
    action: 'Enable OpenSearch ILM + reduce replicas',
    saving: 1200,
    effort: 'Medium',
    confidence: 88,
    category: 'storage',
  },
  {
    action: 'Consolidate GKE node pools (order-processor)',
    saving: 1400,
    effort: 'Medium',
    confidence: 85,
    category: 'compute',
  },
  {
    action: 'Downsize api-gateway instances (m6i.xlarge → m6i.large)',
    saving: 640,
    effort: 'Low',
    confidence: 94,
    category: 'compute',
  },
  {
    action: 'Reduce Lambda memory (notification-svc)',
    saving: 120,
    effort: 'Low',
    confidence: 99,
    category: 'serverless',
  },
  {
    action: 'Enable RDS storage autoscaling (postgres)',
    saving: 180,
    effort: 'Low',
    confidence: 96,
    category: 'database',
  },
];

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div
      className="h-1.5 rounded-full overflow-hidden flex-1"
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }}
      />
    </div>
  );
}

function SpendChart() {
  const max = Math.max(...MONTH_DATA.map((d) => Math.max(d.cost, d.budget)));
  return (
    <div className="flex items-end gap-2 h-24 w-full">
      {MONTH_DATA.map((d, i) => {
        const costH = (d.cost / max) * 88;
        const budgetH = (d.budget / max) * 88;
        const overBudget = d.cost > d.budget;
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex gap-0.5 items-end" style={{ height: 88 }}>
              <div
                className="flex-1 rounded-t transition-all"
                style={{
                  height: costH,
                  background: overBudget ? 'rgba(239,68,68,0.6)' : `${GOLD}60`,
                  border: `1px solid ${overBudget ? '#ef4444' : GOLD}40`,
                }}
              />
              <div
                className="w-0.5 rounded-t"
                style={{ height: budgetH, background: 'rgba(255,255,255,0.1)' }}
              />
            </div>
            <span className="text-[8px] font-mono" style={{ color: DS.text.muted }}>
              {d.month}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function FinOps() {
  const [tab, setTab] = useState<'spend' | 'anomalies' | 'recommendations' | 'deploys'>('spend');
  const totalMtd = SERVICES.reduce((a, s) => a + s.mtd, 0);
  const totalWaste = SERVICES.reduce((a, s) => a + s.waste, 0);
  const totalSavings = RECS.reduce((a, r) => a + r.saving, 0);
  const overBudget = totalMtd > 36000;

  return (
    <div className="p-4 md:p-6 max-w-7xl space-y-5" style={{ background: '#080c14' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cloud className="w-4 h-4" style={{ color: GOLD }} />
            <h1 className="text-[15px] font-bold" style={{ color: DS.text.primary }}>
              FinOps & Cloud Cost Intelligence
            </h1>
          </div>
          <p className="text-[11px]" style={{ color: DS.text.muted }}>
            Real-time cloud spend with anomaly detection, cost-per-service attribution, rightsizing
            recommendations, and deployment correlation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Month-to-Date Spend',
            value: `$${(totalMtd / 1000).toFixed(1)}K`,
            sub: overBudget ? 'Over budget' : 'Under budget',
            color: overBudget ? '#ef4444' : '#10b981',
            icon: DollarSign,
          },
          {
            label: 'Budget',
            value: '$36.0K',
            sub: 'monthly allocation',
            color: DS.text.secondary,
            icon: BarChart3,
          },
          {
            label: 'Identified Waste',
            value: `$${(totalWaste / 1000).toFixed(1)}K`,
            sub: `${Math.round((totalWaste / totalMtd) * 100)}% of spend`,
            color: '#f97316',
            icon: AlertTriangle,
          },
          {
            label: 'Saveable / Mo',
            value: `$${(totalSavings / 1000).toFixed(1)}K`,
            sub: 'via rightsizing',
            color: '#10b981',
            icon: TrendingDown,
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border p-3"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[9px] uppercase tracking-widest"
                style={{ color: DS.text.muted }}
              >
                {k.label}
              </span>
              <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
            </div>
            <div className="text-[20px] font-bold font-mono" style={{ color: k.color }}>
              {k.value}
            </div>
            <div className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: DS.border }}>
        {(['spend', 'anomalies', 'recommendations', 'deploys'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="text-[10px] px-4 py-2 capitalize font-medium transition-all"
            style={{
              color: tab === t ? GOLD : DS.text.muted,
              borderBottom: `2px solid ${tab === t ? GOLD : 'transparent'}`,
            }}
          >
            {t === 'deploys' ? 'Deploy Correlation' : t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'anomalies' && (
              <span
                className="ml-1 text-[8px] px-1 rounded"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
              >
                2
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'spend' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: DS.border, background: DS.surface }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-3"
                style={{ color: DS.text.muted }}
              >
                6-Month Spend vs Budget
              </div>
              <SpendChart />
              <div className="flex items-center gap-4 mt-2 text-[8px]">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm" style={{ background: `${GOLD}60` }} />
                  Spend
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-sm"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                  />
                  Budget
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-sm"
                    style={{ background: 'rgba(239,68,68,0.6)' }}
                  />
                  Over Budget
                </div>
              </div>
            </div>
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: DS.border, background: DS.surface }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-3"
                style={{ color: DS.text.muted }}
              >
                Cost by Service (MTD)
              </div>
              <div className="space-y-2">
                {SERVICES.sort((a, b) => b.mtd - a.mtd)
                  .slice(0, 6)
                  .map((s) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <span
                        className="text-[9px] font-mono w-28 truncate"
                        style={{ color: DS.text.secondary }}
                      >
                        {s.name}
                      </span>
                      <MiniBar
                        value={s.mtd}
                        max={SERVICES[0].mtd > 12000 ? 14000 : 10000}
                        color={s.anomaly ? '#ef4444' : GOLD}
                      />
                      <span
                        className="text-[9px] font-mono w-12 text-right"
                        style={{ color: s.anomaly ? '#ef4444' : DS.text.primary }}
                      >
                        ${(s.mtd / 1000).toFixed(1)}K
                      </span>
                      <span
                        className="text-[8px] w-8 text-right flex items-center gap-0.5 justify-end"
                        style={{
                          color:
                            s.trendDir === 'up' ? (s.anomaly ? '#ef4444' : '#f97316') : '#10b981',
                        }}
                      >
                        {s.trendDir === 'up' ? (
                          <ArrowUp className="w-2 h-2" />
                        ) : (
                          <ArrowDown className="w-2 h-2" />
                        )}
                        {s.trend}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div className="p-3 border-b" style={{ borderColor: DS.border }}>
              <span
                className="text-[9px] uppercase tracking-widest"
                style={{ color: DS.text.muted }}
              >
                Service Cost Attribution
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {[
                      'Service',
                      'Provider',
                      'Type',
                      'MTD Cost',
                      'Waste',
                      'Waste %',
                      'Recommendation',
                      'Potential Saving',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left font-medium"
                        style={{ color: DS.text.muted }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SERVICES.map((s) => (
                    <tr key={s.name} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                      <td
                        className="px-3 py-2 font-mono"
                        style={{ color: s.anomaly ? '#ef4444' : DS.text.primary }}
                      >
                        {s.name}{' '}
                        {s.anomaly && (
                          <span className="text-[8px] ml-1" style={{ color: '#ef4444' }}>
                            ⚠
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2" style={{ color: DS.text.muted }}>
                        {s.provider}
                      </td>
                      <td className="px-3 py-2" style={{ color: DS.text.secondary }}>
                        {s.type}
                      </td>
                      <td
                        className="px-3 py-2 font-mono font-bold"
                        style={{ color: DS.text.primary }}
                      >
                        ${s.mtd.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color: '#f97316' }}>
                        ${s.waste.toLocaleString()}
                      </td>
                      <td
                        className="px-3 py-2 font-mono"
                        style={{
                          color:
                            s.wastePct > 30
                              ? '#ef4444'
                              : s.wastePct > 20
                                ? '#f97316'
                                : DS.text.secondary,
                        }}
                      >
                        {s.wastePct}%
                      </td>
                      <td className="px-3 py-2 text-[9px]" style={{ color: DS.text.muted }}>
                        {s.rightSize}
                      </td>
                      <td
                        className="px-3 py-2 font-mono font-bold"
                        style={{ color: s.saving > 0 ? '#10b981' : DS.text.muted }}
                      >
                        {s.saving > 0 ? `$${s.saving.toLocaleString()}/mo` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'anomalies' && (
        <div className="space-y-3">
          <div className="text-[10px]" style={{ color: DS.text.muted }}>
            Cost anomaly detection using 30-day baseline modeling. Spikes correlated with deploys,
            config changes, and traffic patterns.
          </div>
          {ANOMALIES.map((a, i) => (
            <div
              key={i}
              className="rounded-xl border p-4"
              style={{
                borderColor:
                  a.severity === 'high'
                    ? 'rgba(239,68,68,0.25)'
                    : a.severity === 'medium'
                      ? 'rgba(212,160,84,0.25)'
                      : 'rgba(255,255,255,0.06)',
                background:
                  a.severity === 'high'
                    ? 'rgba(239,68,68,0.04)'
                    : a.severity === 'medium'
                      ? 'rgba(212,160,84,0.04)'
                      : DS.surface,
              }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="w-4 h-4 shrink-0 mt-0.5"
                  style={{
                    color:
                      a.severity === 'high'
                        ? '#ef4444'
                        : a.severity === 'medium'
                          ? GOLD
                          : '#3b82f6',
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold" style={{ color: DS.text.primary }}>
                      {a.service}
                    </span>
                    <span
                      className="text-[8px] px-1.5 py-0.5 rounded uppercase font-mono"
                      style={{
                        background:
                          a.severity === 'high' ? 'rgba(239,68,68,0.12)' : 'rgba(212,160,84,0.12)',
                        color: a.severity === 'high' ? '#ef4444' : GOLD,
                      }}
                    >
                      {a.severity}
                    </span>
                    <span className="text-[9px]" style={{ color: DS.text.muted }}>
                      {a.detected}
                    </span>
                  </div>
                  <p className="text-[10px] mb-1" style={{ color: DS.text.secondary }}>
                    {a.event}
                  </p>
                  <div
                    className="flex items-center gap-1 text-[9px]"
                    style={{ color: a.severity === 'high' ? '#ef4444' : GOLD }}
                  >
                    <TrendingUp className="w-3 h-3" />
                    <span className="font-mono">{a.impact}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'recommendations' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: DS.text.muted }}>
              ML-powered rightsizing recommendations based on 14-day utilization data.
            </span>
            <span className="text-[10px] font-mono" style={{ color: '#10b981' }}>
              Total savings: ${totalSavings.toLocaleString()}/mo
            </span>
          </div>
          {RECS.map((r, i) => (
            <div
              key={i}
              className="rounded-xl border p-4 flex items-center gap-4"
              style={{ borderColor: DS.border, background: DS.surface }}
            >
              <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#10b981' }} />
              <div className="flex-1">
                <div className="text-[11px] font-medium mb-1" style={{ color: DS.text.primary }}>
                  {r.action}
                </div>
                <div
                  className="flex items-center gap-3 text-[9px]"
                  style={{ color: DS.text.muted }}
                >
                  <span>
                    Effort:{' '}
                    <span style={{ color: r.effort === 'Low' ? '#10b981' : GOLD }}>{r.effort}</span>
                  </span>
                  <span>
                    Confidence:{' '}
                    <span className="font-mono" style={{ color: DS.text.secondary }}>
                      {r.confidence}%
                    </span>
                  </span>
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(255,255,255,0.04)', color: DS.text.muted }}
                  >
                    {r.category}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[14px] font-bold font-mono" style={{ color: '#10b981' }}>
                  ${r.saving.toLocaleString()}
                </div>
                <div className="text-[8px]" style={{ color: DS.text.muted }}>
                  /month
                </div>
              </div>
              <button
                className="px-3 py-1.5 rounded text-[10px] font-medium shrink-0"
                style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  color: '#10b981',
                }}
              >
                Apply
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'deploys' && (
        <div className="space-y-3">
          <div className="text-[10px]" style={{ color: DS.text.muted }}>
            Automatically correlates deployment events with cost changes. Identifies the deploy that
            caused cost spikes.
          </div>
          {DEPLOYS.map((d, i) => (
            <div
              key={i}
              className="rounded-xl border p-3 flex items-center gap-3"
              style={{
                borderColor: d.status === 'anomaly' ? 'rgba(239,68,68,0.25)' : DS.border,
                background: d.status === 'anomaly' ? 'rgba(239,68,68,0.04)' : DS.surface,
              }}
            >
              <GitBranch
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: d.status === 'anomaly' ? '#ef4444' : DS.text.muted }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono text-[11px] font-bold"
                    style={{ color: DS.text.primary }}
                  >
                    {d.version}
                  </span>
                  <span className="text-[10px]" style={{ color: DS.text.secondary }}>
                    {d.service}
                  </span>
                  {d.status === 'anomaly' && (
                    <span
                      className="text-[8px] px-1.5 py-0.5 rounded animate-pulse"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                    >
                      COST ANOMALY
                    </span>
                  )}
                </div>
                <span className="text-[9px]" style={{ color: DS.text.muted }}>
                  {d.time}
                </span>
              </div>
              <div
                className="flex items-center gap-1 text-[11px] font-mono font-bold shrink-0"
                style={{
                  color:
                    d.direction === 'up'
                      ? d.status === 'anomaly'
                        ? '#ef4444'
                        : '#f97316'
                      : '#10b981',
                }}
              >
                {d.direction === 'up' ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
                {d.costDelta}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
