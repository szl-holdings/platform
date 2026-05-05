import { useStandardQuery } from '@szl-holdings/api-client-react';
import { AlertTriangle, CheckCircle2, Plus, Target } from 'lucide-react';
import { useState } from 'react';
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { OpsLayout } from '../../components/command/ops-layout';

interface SLADefinition {
  id: string;
  domain: string;
  domainColor: string;
  name: string;
  metric: string;
  target: number;
  unit: string;
  current: number;
  trend: number[];
  compliance30d: number;
  breach: boolean;
  lastBreach?: string;
  window: string;
  owner: string;
}

interface ApiSlaResponse {
  slas: Array<Omit<SLADefinition, 'trend'> & { trend?: number[] }>;
  summary: { total: number; breaching: number; nominal: number; avgCompliance: number };
  generatedAt: string;
  dataSource: string;
}

const FALLBACK_SLAS: SLADefinition[] = [
  {
    id: 's1',
    domain: 'PARAGON',
    domainColor: '#ef4444',
    name: 'Security Incident MTTR',
    metric: 'Mean Time to Respond',
    target: 15,
    unit: 'min',
    current: 11,
    trend: [18, 15, 13, 16, 12, 11, 14, 10, 11, 13, 11, 11],
    compliance30d: 94.2,
    breach: false,
    window: 'Rolling 30d',
    owner: 'James Okafor',
  },
  {
    id: 's2',
    domain: 'SEXTANT',
    domainColor: '#4d8fcc',
    name: 'Fleet Uptime',
    metric: 'Vessel availability %',
    target: 99.5,
    unit: '%',
    current: 99.8,
    trend: [99.7, 99.8, 99.5, 99.9, 99.8, 99.6, 99.8, 99.7, 99.9, 99.8, 99.9, 99.8],
    compliance30d: 99.1,
    breach: false,
    window: 'Monthly',
    owner: 'Marcus Chen',
  },
  {
    id: 's3',
    domain: 'KORA',
    domainColor: '#f97316',
    name: 'API Response Time P95',
    metric: '95th percentile latency',
    target: 2000,
    unit: 'ms',
    current: 2400,
    trend: [1800, 1900, 2100, 1950, 2200, 2400, 2300, 2100, 2400, 2450, 2400, 2400],
    compliance30d: 81.5,
    breach: true,
    lastBreach: '1h ago',
    window: 'Rolling 24h',
    owner: 'KORA Eng Team',
  },
  {
    id: 's4',
    domain: 'DOMAINE',
    domainColor: '#22c55e',
    name: 'Deal Response Time',
    metric: 'Time from inquiry to response',
    target: 24,
    unit: 'hrs',
    current: 18,
    trend: [22, 20, 24, 19, 18, 21, 17, 22, 18, 16, 19, 18],
    compliance30d: 96.8,
    breach: false,
    window: 'Per deal',
    owner: 'Sofia Reyes',
  },
  {
    id: 's5',
    domain: 'PRAXIS',
    domainColor: '#a855f7',
    name: 'Contract Review Turnaround',
    metric: 'Legal review completion',
    target: 72,
    unit: 'hrs',
    current: 68,
    trend: [80, 74, 71, 76, 68, 72, 69, 71, 68, 70, 67, 68],
    compliance30d: 89.3,
    breach: false,
    window: 'Per matter',
    owner: 'Priya Nair',
  },
  {
    id: 's6',
    domain: 'KORA',
    domainColor: '#f97316',
    name: 'Driver On-Time Rate',
    metric: 'On-time delivery %',
    target: 92,
    unit: '%',
    current: 88,
    trend: [93, 91, 90, 89, 88, 87, 89, 88, 87, 88, 88, 88],
    compliance30d: 78.2,
    breach: true,
    lastBreach: '15m ago',
    window: 'Daily',
    owner: 'Ops Team',
  },
  {
    id: 's7',
    domain: 'SZL Holdings',
    domainColor: '#f59e0b',
    name: 'NAV Computation Delay',
    metric: 'Max delay from market close',
    target: 30,
    unit: 'min',
    current: 45,
    trend: [22, 18, 25, 20, 30, 28, 35, 40, 42, 45, 48, 45],
    compliance30d: 70.0,
    breach: true,
    lastBreach: '4h ago',
    window: 'Daily',
    owner: 'Finance Ops',
  },
  {
    id: 's8',
    domain: 'PARAGON',
    domainColor: '#ef4444',
    name: 'Vulnerability Patch SLA',
    metric: 'Critical CVE patching',
    target: 48,
    unit: 'hrs',
    current: 6,
    trend: [72, 48, 36, 24, 48, 12, 8, 6, 12, 6, 4, 6],
    compliance30d: 97.5,
    breach: false,
    window: 'Per CVE',
    owner: 'James Okafor',
  },
];

const COMPLIANCE_COLOR = (pct: number) =>
  pct >= 95 ? 'var(--color-low)' : pct >= 80 ? 'var(--color-medium)' : 'var(--color-critical)';

export default function SLAPage() {
  const { data: apiData } = useStandardQuery<ApiSlaResponse>({
    queryKey: ['command-sla'],
    queryFn: async () => {
      const res = await fetch('/api/command/sla', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load SLA');
      const json = await res.json();
      return (json?.data ?? json) as ApiSlaResponse;
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const SLAS: SLADefinition[] = apiData?.slas
    ? apiData.slas.map(
        (s) =>
          ({
            ...s,
            trend: s.trend ?? Array.from({ length: 12 }, () => s.current),
          }) as SLADefinition,
      )
    : FALLBACK_SLAS;

  const [selected, setSelected] = useState<string | null>('s1');
  const [showBuilder, setShowBuilder] = useState(false);
  const [filter, setFilter] = useState<'all' | 'breach' | 'nominal'>('all');

  const filtered = SLAS.filter((s) => {
    if (filter === 'breach') return s.breach;
    if (filter === 'nominal') return !s.breach;
    return true;
  });

  const selectedSLA = SLAS.find((s) => s.id === selected);
  const breachCount = SLAS.filter((s) => s.breach).length;
  const avgCompliance =
    Math.round((SLAS.reduce((sum, s) => sum + s.compliance30d, 0) / SLAS.length) * 10) / 10;

  return (
    <OpsLayout title="SLA Dashboard">
      <div className="flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active SLAs', value: SLAS.length, color: '#8b7ac8', icon: Target },
            {
              label: 'Breaching Now',
              value: breachCount,
              color: 'var(--color-critical)',
              icon: AlertTriangle,
            },
            {
              label: 'Avg Compliance (30d)',
              value: `${avgCompliance}%`,
              color: avgCompliance >= 95 ? 'var(--color-low)' : 'var(--color-medium)',
              icon: CheckCircle2,
            },
            {
              label: 'Nominal SLAs',
              value: SLAS.length - breachCount,
              color: 'var(--color-low)',
              icon: CheckCircle2,
            },
          ].map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              className="p-4 rounded-xl flex items-center gap-3"
              style={{
                backgroundColor: 'var(--color-surface-base)',
                border: '1px solid var(--color-surface-border)',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono" style={{ color }}>
                  {value}
                </div>
                <div
                  className="text-[10px] font-mono uppercase tracking-wider"
                  style={{ color: 'var(--color-fg-muted)' }}
                >
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Breach Alerts */}
        {breachCount > 0 && (
          <div className="flex flex-col gap-2">
            {SLAS.filter((s) => s.breach).map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-critical) 8%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--color-critical) 25%, transparent)',
                }}
              >
                <AlertTriangle
                  className="w-4 h-4 shrink-0"
                  style={{ color: 'var(--color-critical)' }}
                />
                <div className="flex-1">
                  <span className="text-sm font-bold" style={{ color: s.domainColor }}>
                    {s.domain}
                  </span>
                  <span className="text-sm mx-2" style={{ color: 'var(--color-fg-muted)' }}>
                    —
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: 'var(--color-fg-primary)' }}
                  >
                    {s.name} breaching
                  </span>
                </div>
                <div className="text-xs font-mono" style={{ color: 'var(--color-critical)' }}>
                  Current: {s.current}
                  {s.unit} vs target {s.target}
                  {s.unit}
                </div>
                <span className="text-[10px] font-mono" style={{ color: 'var(--color-fg-muted)' }}>
                  {s.lastBreach}
                </span>
                <button
                  onClick={() => setSelected(s.id)}
                  className="text-xs px-2 py-1 rounded-md"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    color: 'var(--color-fg-secondary)',
                  }}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SLA List */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div
                className="flex gap-1 p-1 rounded-lg"
                style={{
                  backgroundColor: 'var(--color-surface-base)',
                  border: '1px solid var(--color-surface-border)',
                }}
              >
                {(['all', 'breach', 'nominal'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="px-2.5 py-1 rounded-md text-xs font-medium capitalize"
                    style={{
                      backgroundColor: filter === f ? 'var(--color-bg-elevated)' : 'transparent',
                      color: filter === f ? 'var(--color-fg-primary)' : 'var(--color-fg-muted)',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowBuilder(!showBuilder)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs"
                style={{
                  backgroundColor: '#8b7ac820',
                  border: '1px solid #8b7ac840',
                  color: '#8b7ac8',
                }}
              >
                <Plus className="w-3 h-3" /> New SLA
              </button>
            </div>

            {filtered.map((sla) => {
              const isSelected = selected === sla.id;
              const compliant = !sla.breach;
              return (
                <div
                  key={sla.id}
                  onClick={() => setSelected(isSelected ? null : sla.id)}
                  className="rounded-xl p-4 cursor-pointer transition-all"
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--color-bg-elevated)'
                      : 'var(--color-surface-base)',
                    border: `1px solid ${isSelected ? '#8b7ac8' : sla.breach ? 'color-mix(in srgb, var(--color-critical) 30%, var(--color-surface-border))' : 'var(--color-surface-border)'}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div
                        className="text-[10px] font-mono uppercase tracking-wider mb-0.5"
                        style={{ color: sla.domainColor }}
                      >
                        {sla.domain}
                      </div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: 'var(--color-fg-primary)' }}
                      >
                        {sla.name}
                      </div>
                    </div>
                    {compliant ? (
                      <CheckCircle2
                        className="w-4 h-4 shrink-0"
                        style={{ color: 'var(--color-low)' }}
                      />
                    ) : (
                      <AlertTriangle
                        className="w-4 h-4 shrink-0"
                        style={{ color: 'var(--color-critical)' }}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-mono font-bold"
                        style={{ color: compliant ? 'var(--color-low)' : 'var(--color-critical)' }}
                      >
                        {sla.current}
                        {sla.unit}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--color-fg-muted)' }}>
                        / {sla.target}
                        {sla.unit} target
                      </span>
                    </div>
                    <span
                      className="text-xs font-bold"
                      style={{ color: COMPLIANCE_COLOR(sla.compliance30d) }}
                    >
                      {sla.compliance30d}%
                    </span>
                  </div>
                  <div
                    className="mt-2 h-1 rounded-full"
                    style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${sla.compliance30d}%`,
                        backgroundColor: COMPLIANCE_COLOR(sla.compliance30d),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* SLA Detail */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {selectedSLA ? (
              <>
                <div
                  className="rounded-xl p-5"
                  style={{
                    backgroundColor: 'var(--color-surface-base)',
                    border: '1px solid var(--color-surface-border)',
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div
                        className="text-[10px] font-mono uppercase tracking-wider mb-1"
                        style={{ color: selectedSLA.domainColor }}
                      >
                        {selectedSLA.domain} · {selectedSLA.metric}
                      </div>
                      <div
                        className="text-xl font-bold"
                        style={{ color: 'var(--color-fg-primary)' }}
                      >
                        {selectedSLA.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-3xl font-bold font-mono"
                        style={{
                          color: selectedSLA.breach ? 'var(--color-critical)' : 'var(--color-low)',
                        }}
                      >
                        {selectedSLA.current}
                        {selectedSLA.unit}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                        current · target {selectedSLA.target}
                        {selectedSLA.unit}
                      </div>
                    </div>
                  </div>
                  <div
                    className="grid grid-cols-3 gap-4 pt-4"
                    style={{ borderTop: '1px solid var(--color-surface-border)' }}
                  >
                    {[
                      {
                        label: '30d Compliance',
                        value: `${selectedSLA.compliance30d}%`,
                        color: COMPLIANCE_COLOR(selectedSLA.compliance30d),
                      },
                      {
                        label: 'Window',
                        value: selectedSLA.window,
                        color: 'var(--color-fg-secondary)',
                      },
                      { label: 'Owner', value: selectedSLA.owner, color: '#8b7ac8' },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div
                          className="text-[10px] font-mono uppercase tracking-wider mb-1"
                          style={{ color: 'var(--color-fg-muted)' }}
                        >
                          {label}
                        </div>
                        <div className="text-sm font-semibold" style={{ color }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trend Chart */}
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
                    12-Day Trend
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart
                      data={selectedSLA.trend.map((v, i) => ({ day: `Day ${i + 1}`, value: v }))}
                    >
                      <XAxis
                        dataKey="day"
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1d2e',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          fontSize: '10px',
                        }}
                        formatter={(v: number) => [`${v}${selectedSLA.unit}`, selectedSLA.metric]}
                      />
                      <ReferenceLine
                        y={selectedSLA.target}
                        stroke="rgba(255,255,255,0.2)"
                        strokeDasharray="4 4"
                        label={{
                          value: `Target: ${selectedSLA.target}${selectedSLA.unit}`,
                          fill: 'rgba(255,255,255,0.3)',
                          fontSize: 9,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={selectedSLA.domainColor}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Breach History */}
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
                    Recent Breach History
                  </div>
                  {selectedSLA.breach ? (
                    <div className="flex flex-col gap-2">
                      {[
                        {
                          when: selectedSLA.lastBreach ?? '—',
                          duration: 'Ongoing',
                          delta: `+${Math.abs(selectedSLA.current - selectedSLA.target)}${selectedSLA.unit}`,
                        },
                        {
                          when: 'Apr 14, 16:30',
                          duration: '45 min',
                          delta: `+${Math.round(Math.abs(selectedSLA.current - selectedSLA.target) * 0.8)}${selectedSLA.unit}`,
                        },
                        {
                          when: 'Apr 12, 09:15',
                          duration: '22 min',
                          delta: `+${Math.round(Math.abs(selectedSLA.current - selectedSLA.target) * 0.5)}${selectedSLA.unit}`,
                        },
                      ].map((breach, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-2 text-xs"
                          style={{ borderBottom: '1px solid var(--color-surface-border)' }}
                        >
                          <span style={{ color: 'var(--color-fg-secondary)' }}>{breach.when}</span>
                          <span style={{ color: 'var(--color-fg-muted)' }}>{breach.duration}</span>
                          <span style={{ color: 'var(--color-critical)' }}>
                            {breach.delta} over target
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-3">
                      <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-low)' }} />
                      <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                        No breaches in the last 30 days
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : showBuilder ? (
              <div
                className="rounded-xl p-6 flex flex-col gap-4"
                style={{
                  backgroundColor: 'var(--color-surface-base)',
                  border: '1px solid var(--color-surface-border)',
                }}
              >
                <div className="text-sm font-bold" style={{ color: 'var(--color-fg-primary)' }}>
                  Define New SLA
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'SLA Name', placeholder: 'e.g. API Response Time' },
                    { label: 'Metric', placeholder: 'e.g. P95 latency' },
                    { label: 'Target Value', placeholder: 'e.g. 2000' },
                    { label: 'Unit', placeholder: 'e.g. ms, %, hrs' },
                  ].map(({ label, placeholder }) => (
                    <div key={label}>
                      <div
                        className="text-[10px] font-mono uppercase tracking-wider mb-1"
                        style={{ color: 'var(--color-fg-muted)' }}
                      >
                        {label}
                      </div>
                      <input
                        placeholder={placeholder}
                        className="w-full px-3 py-2 rounded-lg text-xs"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-surface-border)',
                          color: 'var(--color-fg-primary)',
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 rounded-lg text-xs font-bold"
                    style={{ backgroundColor: '#8b7ac8', color: '#fff' }}
                  >
                    Create SLA
                  </button>
                  <button
                    onClick={() => setShowBuilder(false)}
                    className="px-4 py-2 rounded-lg text-xs"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-surface-border)',
                      color: 'var(--color-fg-muted)',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="flex items-center justify-center h-full py-20 rounded-xl"
                style={{
                  backgroundColor: 'var(--color-surface-base)',
                  border: '1px dashed var(--color-surface-border)',
                }}
              >
                <div className="text-center">
                  <Target
                    className="w-8 h-8 mx-auto mb-2"
                    style={{ color: 'var(--color-fg-muted)', opacity: 0.3 }}
                  />
                  <div className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
                    Select an SLA to view details
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </OpsLayout>
  );
}
