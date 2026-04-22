import {
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Cloud,
  Cpu,
  Database,
  Server,
} from 'lucide-react';
import { useState } from 'react';

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

interface Resource {
  id: string;
  name: string;
  type: 'compute' | 'database' | 'storage' | 'network';
  service: string;
  current: { cpu: number; memory: number; cost: number };
  forecast30d: { cpu: number; memory: number; cost: number };
  forecast90d: { cpu: number; memory: number; cost: number };
  rightSizing: {
    recommendation: string;
    savingsMonthly: number;
    action: 'downsize' | 'upsize' | 'optimal';
  };
  tenant?: string;
}

const RESOURCES: Resource[] = [
  {
    id: 'r1',
    name: 'api-gateway-prod',
    type: 'compute',
    service: 'API Gateway',
    current: { cpu: 34, memory: 52, cost: 1240 },
    forecast30d: { cpu: 41, memory: 58, cost: 1380 },
    forecast90d: { cpu: 68, memory: 74, cost: 2100 },
    rightSizing: {
      recommendation: 'Current instance adequate for 30d. Plan upgrade before 60d.',
      savingsMonthly: 0,
      action: 'optimal',
    },
  },
  {
    id: 'r2',
    name: 'order-processor-fleet',
    type: 'compute',
    service: 'Order Processor',
    current: { cpu: 82, memory: 89, cost: 4800 },
    forecast30d: { cpu: 94, memory: 97, cost: 5600 },
    forecast90d: { cpu: 110, memory: 118, cost: 7400 },
    rightSizing: {
      recommendation: 'Upgrade to m6i.2xlarge before 30-day saturation. Scale horizontally.',
      savingsMonthly: -800,
      action: 'upsize',
    },
  },
  {
    id: 'r3',
    name: 'reporting-cluster',
    type: 'compute',
    service: 'Reporting',
    current: { cpu: 12, memory: 18, cost: 3200 },
    forecast30d: { cpu: 14, memory: 20, cost: 3200 },
    forecast90d: { cpu: 16, memory: 22, cost: 3200 },
    rightSizing: {
      recommendation:
        'Overprovisioned. Downsize from r6i.4xlarge → r6i.2xlarge. $1,400/mo savings.',
      savingsMonthly: 1400,
      action: 'downsize',
    },
  },
  {
    id: 'r4',
    name: 'postgres-primary',
    type: 'database',
    service: 'Postgres Primary',
    current: { cpu: 48, memory: 71, cost: 2100 },
    forecast30d: { cpu: 55, memory: 78, cost: 2400 },
    forecast90d: { cpu: 72, memory: 91, cost: 3200 },
    rightSizing: {
      recommendation: 'Read replica addition recommended before 60d. Offload 35% of reads.',
      savingsMonthly: 0,
      action: 'optimal',
    },
  },
  {
    id: 'r5',
    name: 'analytics-warehouse',
    type: 'database',
    service: 'Analytics',
    current: { cpu: 8, memory: 14, cost: 5600 },
    forecast30d: { cpu: 9, memory: 15, cost: 5600 },
    forecast90d: { cpu: 11, memory: 16, cost: 5600 },
    rightSizing: {
      recommendation:
        'Heavily overprovisioned. Consider moving to serverless (Athena). $3,200/mo savings.',
      savingsMonthly: 3200,
      action: 'downsize',
    },
  },
  {
    id: 'r6',
    name: 'ml-inference-fleet',
    type: 'compute',
    service: 'ML Inference',
    current: { cpu: 91, memory: 88, cost: 8400 },
    forecast30d: { cpu: 105, memory: 101, cost: 9800 },
    forecast90d: { cpu: 140, memory: 132, cost: 13200 },
    rightSizing: {
      recommendation: 'Critical: saturation in <20d. Scale GPU fleet +4 instances immediately.',
      savingsMonthly: -1400,
      action: 'upsize',
    },
  },
];

const FINOPS_DATA = [
  { tenant: 'Nexus Capital', cost: 14200, forecast30: 15100, savingsOpportunity: 2400 },
  { tenant: 'Meridian Health', cost: 21800, forecast30: 23400, savingsOpportunity: 5200 },
  { tenant: 'Apex Logistics', cost: 6400, forecast30: 6800, savingsOpportunity: 800 },
  { tenant: 'Skyline Media', cost: 5100, forecast30: 5600, savingsOpportunity: 1100 },
];

const TYPE_ICON: Record<Resource['type'], any> = {
  compute: Cpu,
  database: Database,
  storage: Server,
  network: Cloud,
};
const TYPE_COLOR: Record<Resource['type'], string> = {
  compute: '#3b82f6',
  database: '#10b981',
  storage: GOLD,
  network: '#8b5cf6',
};

function UsageBar({ value, forecast }: { value: number; forecast: number }) {
  const color = value >= 90 ? '#ef4444' : value >= 70 ? '#f97316' : value >= 50 ? GOLD : '#10b981';
  const fColor = forecast >= 90 ? '#ef4444' : forecast >= 70 ? '#f97316' : GOLD;
  return (
    <div>
      <div
        className="h-1.5 rounded-full overflow-hidden mb-0.5"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(value, 100)}%`, background: color }}
        />
      </div>
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(forecast, 100)}%`, background: `${fColor}60` }}
        />
      </div>
    </div>
  );
}

export default function CapacityPlanning() {
  const [selectedResource, setSelectedResource] = useState<Resource>(RESOURCES[0]);
  const [horizon, setHorizon] = useState<'30d' | '90d'>('30d');

  const totalSavings = RESOURCES.reduce((a, r) => a + r.rightSizing.savingsMonthly, 0);
  const upsizeCount = RESOURCES.filter((r) => r.rightSizing.action === 'upsize').length;
  const downsizeCount = RESOURCES.filter((r) => r.rightSizing.action === 'downsize').length;
  const totalCost = RESOURCES.reduce((a, r) => a + r.current.cost, 0);

  return (
    <div className="h-full overflow-auto" style={{ background: '#080c14' }}>
      <div className="max-w-[1400px] mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight" style={{ color: DS.text.primary }}>
              Capacity Planning & Cost Optimization
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: DS.text.muted }}>
              ML-driven forecasting · right-sizing · FinOps cost tracking by tenant and service
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['30d', '90d'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className="px-3 py-1.5 rounded text-[10px] font-mono font-medium transition-all"
                style={{
                  background: horizon === h ? `${GOLD}12` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${horizon === h ? `${GOLD}35` : DS.border}`,
                  color: horizon === h ? GOLD : DS.text.muted,
                }}
              >
                {h} Forecast
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'Total Monthly Cost',
              value: `$${(totalCost / 1000).toFixed(0)}k`,
              color: DS.text.primary,
            },
            {
              label: 'Savings Opportunity',
              value: `$${(totalSavings / 1000).toFixed(1)}k/mo`,
              color: '#10b981',
            },
            { label: 'Needs Upsize', value: `${upsizeCount}`, color: '#ef4444' },
            { label: 'Can Downsize', value: `${downsizeCount}`, color: GOLD },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-lg p-3"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-1"
                style={{ color: DS.text.muted }}
              >
                {k.label}
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: k.color }}>
                {k.value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          <div className="space-y-4">
            {/* Resource table */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div className="p-3 border-b" style={{ borderColor: DS.border }}>
                <span
                  className="text-[10px] uppercase tracking-widest font-medium"
                  style={{ color: DS.text.muted }}
                >
                  Resource Forecast · {horizon} horizon
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: DS.border }}>
                {RESOURCES.map((r) => {
                  const Icon = TYPE_ICON[r.type];
                  const tc = TYPE_COLOR[r.type];
                  const forecast = horizon === '30d' ? r.forecast30d : r.forecast90d;
                  const actionColor =
                    r.rightSizing.action === 'upsize'
                      ? '#ef4444'
                      : r.rightSizing.action === 'downsize'
                        ? '#10b981'
                        : GOLD;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedResource(r)}
                      className="p-4 cursor-pointer transition-colors"
                      style={{ background: selectedResource.id === r.id ? `${GOLD}04` : undefined }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                          style={{ background: `${tc}12`, border: `1px solid ${tc}25` }}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color: tc }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-[11px] font-semibold"
                              style={{ color: DS.text.primary }}
                            >
                              {r.name}
                            </span>
                            <span
                              className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                              style={{ background: `${actionColor}12`, color: actionColor }}
                            >
                              {r.rightSizing.action === 'upsize'
                                ? '⚠ needs upsize'
                                : r.rightSizing.action === 'downsize'
                                  ? '↓ can downsize'
                                  : '✓ optimal'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-[8px] mb-1" style={{ color: DS.text.muted }}>
                                CPU — now {r.current.cpu}% / {horizon} {forecast.cpu}%
                              </div>
                              <UsageBar value={r.current.cpu} forecast={forecast.cpu} />
                            </div>
                            <div>
                              <div className="text-[8px] mb-1" style={{ color: DS.text.muted }}>
                                Memory — now {r.current.memory}% / {horizon} {forecast.memory}%
                              </div>
                              <UsageBar value={r.current.memory} forecast={forecast.memory} />
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div
                            className="text-[11px] font-mono font-semibold"
                            style={{ color: DS.text.primary }}
                          >
                            ${r.current.cost.toLocaleString()}/mo
                          </div>
                          {r.rightSizing.savingsMonthly !== 0 && (
                            <div
                              className="text-[9px] font-mono"
                              style={{
                                color: r.rightSizing.savingsMonthly > 0 ? '#10b981' : '#ef4444',
                              }}
                            >
                              {r.rightSizing.savingsMonthly > 0 ? '-' : '+'}$
                              {Math.abs(r.rightSizing.savingsMonthly).toLocaleString()}/mo
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FinOps by tenant */}
            <div
              className="rounded-lg p-4"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div
                className="text-[10px] uppercase tracking-widest font-medium mb-3"
                style={{ color: DS.text.muted }}
              >
                FinOps — Cost by Tenant
              </div>
              <div className="space-y-2">
                {FINOPS_DATA.map((t) => {
                  const delta = t.forecast30 - t.cost;
                  const pct = Math.round(
                    (t.cost / FINOPS_DATA.reduce((a, x) => a + x.cost, 0)) * 100,
                  );
                  return (
                    <div
                      key={t.tenant}
                      className="p-3 rounded-lg"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${DS.border}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: DS.text.primary }}
                        >
                          {t.tenant}
                        </span>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="font-mono" style={{ color: DS.text.primary }}>
                            ${t.cost.toLocaleString()}/mo
                          </span>
                          <span className="font-mono" style={{ color: '#f97316' }}>
                            +${delta.toLocaleString()} 30d
                          </span>
                          {t.savingsOpportunity > 0 && (
                            <span className="font-mono" style={{ color: '#10b981' }}>
                              -${t.savingsOpportunity.toLocaleString()} opp
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: GOLD }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: recommendation detail */}
          <div className="space-y-3">
            <div
              className="rounded-lg p-4"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-3"
                style={{ color: DS.text.muted }}
              >
                Right-Sizing Recommendation
              </div>
              <div className="text-[12px] font-semibold mb-2" style={{ color: DS.text.primary }}>
                {selectedResource.name}
              </div>

              {(() => {
                const action = selectedResource.rightSizing.action;
                const actionColor =
                  action === 'upsize' ? '#ef4444' : action === 'downsize' ? '#10b981' : GOLD;
                const Icon =
                  action === 'upsize' ? ArrowUp : action === 'downsize' ? ArrowDown : CheckCircle;
                return (
                  <div
                    className="p-3 rounded-lg mb-3"
                    style={{ background: `${actionColor}06`, border: `1px solid ${actionColor}20` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-3.5 h-3.5" style={{ color: actionColor }} />
                      <span
                        className="text-[10px] font-semibold capitalize"
                        style={{ color: actionColor }}
                      >
                        {action}
                      </span>
                    </div>
                    <p className="text-[10px]" style={{ color: DS.text.secondary }}>
                      {selectedResource.rightSizing.recommendation}
                    </p>
                    {selectedResource.rightSizing.savingsMonthly > 0 && (
                      <div
                        className="mt-2 text-[10px] font-mono font-semibold"
                        style={{ color: '#10b981' }}
                      >
                        Saves ${selectedResource.rightSizing.savingsMonthly.toLocaleString()}/mo
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="space-y-3">
                {[
                  {
                    label: 'Current CPU',
                    now: selectedResource.current.cpu,
                    f30: selectedResource.forecast30d.cpu,
                    f90: selectedResource.forecast90d.cpu,
                  },
                  {
                    label: 'Current Memory',
                    now: selectedResource.current.memory,
                    f30: selectedResource.forecast30d.memory,
                    f90: selectedResource.forecast90d.memory,
                  },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px]" style={{ color: DS.text.muted }}>
                        {m.label}
                      </span>
                      <div className="flex gap-3 text-[9px] font-mono">
                        <span style={{ color: DS.text.secondary }}>Now: {m.now}%</span>
                        <span style={{ color: GOLD }}>30d: {m.f30}%</span>
                        <span style={{ color: m.f90 >= 90 ? '#ef4444' : '#f97316' }}>
                          90d: {m.f90}%
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div
                        className="rounded-full"
                        style={{ width: `${m.now}%`, background: '#3b82f6', height: '100%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-lg p-4"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-2"
                style={{ color: DS.text.muted }}
              >
                Savings Summary
              </div>
              <div className="text-2xl font-bold font-mono mb-1" style={{ color: '#10b981' }}>
                ${totalSavings.toLocaleString()}/mo
              </div>
              <p className="text-[10px]" style={{ color: DS.text.secondary }}>
                Potential savings from right-sizing {downsizeCount} overprovisioned resources.
              </p>
              <button
                className="mt-3 w-full py-2 rounded text-[10px] font-medium"
                style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  color: '#10b981',
                }}
              >
                Apply All Recommendations
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
