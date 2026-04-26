import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  DollarSign,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { OpsLayout } from '../components/ops-layout';
import { ServiceStatusPanel } from '../components/service-status-panel';
import { useEcosystemData } from '../hooks/use-ecosystem-data';

const CONNECTOR_FRESHNESS = [
  {
    id: 'ais',
    label: 'AIS / GNSS Feed',
    source: 'ExactEarth + Spire',
    status: 'live' as const,
    lastPoll: '12s ago',
    latency: 310,
    records: 14302,
    staleWindow: '5m',
    domain: 'Vessels',
  },
  {
    id: 'alloy-kb',
    label: 'Counsel Knowledge Base',
    source: 'Internal',
    status: 'live' as const,
    lastPoll: '1m ago',
    latency: 88,
    records: 4800,
    staleWindow: '10m',
    domain: 'Platform',
  },
  {
    id: 'lyte-signals',
    label: 'Lyte Signal Bus',
    source: 'Internal',
    status: 'fresh' as const,
    lastPoll: '4m ago',
    latency: 142,
    records: 871,
    staleWindow: '10m',
    domain: 'Lyte',
  },
  {
    id: 'terra-propertydata',
    label: 'Terra Property Records',
    source: 'CoreLogic / MLS',
    status: 'fresh' as const,
    lastPoll: '18m ago',
    latency: 1800,
    records: 92440,
    staleWindow: '60m',
    domain: 'Terra',
  },
  {
    id: 'ofac',
    label: 'OFAC SDN Screener',
    source: 'US Treasury',
    status: 'fresh' as const,
    lastPoll: '47m ago',
    latency: 4200,
    records: 18900,
    staleWindow: '12h',
    domain: 'Compliance',
  },
  {
    id: 'weather',
    label: 'Weather / Routing API',
    source: 'Copernicus + Windy',
    status: 'stale' as const,
    lastPoll: '3h ago',
    latency: 14000,
    records: 290,
    staleWindow: '30m',
    domain: 'Vessels',
  },
  {
    id: 'eu-sanctions',
    label: 'EU Sanctions Registry',
    source: 'EUR-Lex',
    status: 'stale' as const,
    lastPoll: '19h ago',
    latency: 48000,
    records: 5100,
    staleWindow: '6h',
    domain: 'Compliance',
  },
  {
    id: 'swift',
    label: 'SWIFT / Wire Monitor',
    source: 'Internal',
    status: 'error' as const,
    lastPoll: '—',
    latency: null,
    records: 0,
    staleWindow: '5m',
    domain: 'Finance',
  },
];

type ConnectorStatus = 'live' | 'fresh' | 'stale' | 'error';

const STATUS_STYLE: Record<
  ConnectorStatus,
  { dot: string; label: string; bg: string; border: string }
> = {
  live: {
    dot: 'bg-emerald-400 animate-pulse',
    label: 'Live',
    bg: 'rgba(16,185,129,0.06)',
    border: 'rgba(16,185,129,0.15)',
  },
  fresh: {
    dot: 'bg-sky-400',
    label: 'Fresh',
    bg: 'rgba(77,143,204,0.05)',
    border: 'rgba(77,143,204,0.12)',
  },
  stale: {
    dot: 'bg-amber-400',
    label: 'Stale',
    bg: 'rgba(245,158,11,0.05)',
    border: 'rgba(245,158,11,0.18)',
  },
  error: {
    dot: 'bg-red-400 animate-pulse',
    label: 'Error',
    bg: 'rgba(239,68,68,0.05)',
    border: 'rgba(239,68,68,0.22)',
  },
};

function ConnectorFreshnessPanel() {
  const [filter, setFilter] = useState<ConnectorStatus | 'all'>('all');
  const visible =
    filter === 'all' ? CONNECTOR_FRESHNESS : CONNECTOR_FRESHNESS.filter((c) => c.status === filter);
  const counts = {
    all: CONNECTOR_FRESHNESS.length,
    live: 0,
    fresh: 0,
    stale: 0,
    error: 0,
  } as Record<string, number>;
  CONNECTOR_FRESHNESS.forEach((c) => {
    counts[c.status]++;
  });

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: '1px solid var(--color-surface-border)',
        backgroundColor: 'var(--color-surface-base)',
      }}
    >
      <div
        className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
        style={{ borderBottom: '1px solid var(--color-surface-border)' }}
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4" style={{ color: 'var(--color-fg-muted)' }} />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--color-fg-muted)' }}
          >
            Connector Freshness
          </span>
        </div>
        <div className="flex gap-1">
          {(['all', 'live', 'fresh', 'stale', 'error'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="text-[10px] font-mono px-2 py-1 rounded capitalize transition-colors"
              style={{
                background:
                  filter === s
                    ? s === 'all'
                      ? 'rgba(139,122,200,0.15)'
                      : STATUS_STYLE[s as ConnectorStatus]?.bg
                    : 'transparent',
                border:
                  filter === s
                    ? `1px solid ${s === 'all' ? 'rgba(139,122,200,0.25)' : STATUS_STYLE[s as ConnectorStatus]?.border}`
                    : '1px solid transparent',
                color: filter === s ? 'var(--color-fg-primary)' : 'var(--color-fg-muted)',
              }}
            >
              {s} {s !== 'all' ? `(${counts[s]})` : `(${counts.all})`}
            </button>
          ))}
        </div>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--color-surface-border)' }}>
        {visible.map((c) => {
          const st = STATUS_STYLE[c.status];
          return (
            <div
              key={c.id}
              className="px-5 py-3 flex items-center gap-4"
              style={{ background: st.bg }}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: 'var(--color-fg-primary)' }}
                  >
                    {c.label}
                  </span>
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background: 'var(--color-bg-elevated)',
                      color: 'var(--color-fg-muted)',
                    }}
                  >
                    {c.domain}
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: 'var(--color-fg-muted)' }}>
                  {c.source}
                </span>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-[10px] font-mono">
                <div className="flex items-center gap-1" style={{ color: 'var(--color-fg-muted)' }}>
                  <Clock className="w-3 h-3" />
                  {c.lastPoll}
                </div>
                <div style={{ color: 'var(--color-fg-muted)' }}>
                  {c.latency != null
                    ? `${c.latency < 1000 ? `${c.latency}ms` : `${(c.latency / 1000).toFixed(1)}s`}`
                    : '—'}
                </div>
                <div style={{ color: 'var(--color-fg-muted)' }}>
                  {c.records > 0 ? `${c.records.toLocaleString()} rec` : 'no data'}
                </div>
                <div className="hidden md:block" style={{ color: 'var(--color-fg-muted)' }}>
                  stale &gt;{c.staleWindow}
                </div>
                <div
                  className="px-2 py-0.5 rounded text-[9px] font-semibold capitalize"
                  style={{
                    background: st.bg,
                    border: `1px solid ${st.border}`,
                    color:
                      c.status === 'live'
                        ? '#34d399'
                        : c.status === 'fresh'
                          ? '#38bdf8'
                          : c.status === 'stale'
                            ? '#fbbf24'
                            : '#f87171',
                  }}
                >
                  {st.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ApiHealthResponse {
  compositeScore: number;
  dimensions: Array<{
    key: string;
    label: string;
    color: string;
    weight: number;
    score: number;
    signals: Array<{ label: string; value: string; status: 'good' | 'warn' | 'bad' }>;
  }>;
  generatedAt: string;
  dataSource: string;
}

interface DimensionScore {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  score: number;
  weight: number;
  signals: { label: string; value: string; status: 'good' | 'warn' | 'bad' }[];
  trend: number[];
}

const DIMENSION_ICONS: Record<string, React.ElementType> = {
  security: Shield,
  operational: Activity,
  financial: DollarSign,
  compliance: CheckCircle2,
};

const FALLBACK_DIMENSIONS: DimensionScore[] = [
  {
    key: 'security',
    label: 'Security',
    icon: Shield,
    color: '#ef4444',
    score: 82,
    weight: 0.3,
    signals: [
      { label: 'Active threats', value: '2 medium', status: 'warn' },
      { label: 'Patch compliance', value: '96.4%', status: 'good' },
      { label: 'MTTR', value: '11 min', status: 'good' },
      { label: 'Vuln exposure', value: '3 open CVEs', status: 'warn' },
    ],
    trend: [74, 77, 79, 76, 80, 82, 81, 84, 82, 83, 81, 82],
  },
  {
    key: 'operational',
    label: 'Operational',
    icon: Activity,
    color: '#4d8fcc',
    score: 74,
    weight: 0.3,
    signals: [
      { label: 'SLA compliance', value: '81.5% (Lyte breach)', status: 'bad' },
      { label: 'Fleet uptime', value: '99.8%', status: 'good' },
      { label: 'API latency P95', value: '2.4s', status: 'bad' },
      { label: 'Active incidents', value: '2 high', status: 'warn' },
    ],
    trend: [81, 78, 76, 79, 73, 72, 75, 74, 73, 76, 74, 74],
  },
  {
    key: 'financial',
    label: 'Financial',
    icon: DollarSign,
    color: '#22c55e',
    score: 71,
    weight: 0.25,
    signals: [
      { label: 'Budget utilization', value: '92% MTD', status: 'warn' },
      { label: 'Over-budget domains', value: '2 of 7', status: 'warn' },
      { label: 'Cost trend', value: '+3.5% MoM', status: 'warn' },
      { label: 'Forecast accuracy', value: '88.2%', status: 'good' },
    ],
    trend: [75, 72, 74, 71, 69, 70, 72, 71, 70, 72, 71, 71],
  },
  {
    key: 'compliance',
    label: 'Compliance',
    icon: CheckCircle2,
    color: '#a855f7',
    score: 89,
    weight: 0.15,
    signals: [
      { label: 'Active policies', value: '4 of 5', status: 'good' },
      { label: 'Pending approvals', value: '1 policy', status: 'warn' },
      { label: 'Audit trail', value: 'Complete', status: 'good' },
      { label: 'Data retention', value: 'Compliant', status: 'good' },
    ],
    trend: [84, 86, 87, 88, 87, 89, 90, 89, 88, 90, 89, 89],
  },
];

function scoreColor(score: number) {
  if (score >= 85) return 'var(--color-low)';
  if (score >= 70) return 'var(--color-medium)';
  return 'var(--color-critical)';
}

function scoreLabel(score: number) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Moderate';
  if (score >= 60) return 'At Risk';
  return 'Critical';
}

export default function HealthPage() {
  const { data } = useEcosystemData();
  const { data: apiData } = useStandardQuery<ApiHealthResponse>({
    queryKey: ['command-health'],
    queryFn: async () => {
      const res = await fetch('/api/command/health', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load health');
      const json = await res.json();
      return (json?.data ?? json) as ApiHealthResponse;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const DIMENSIONS: DimensionScore[] = apiData?.dimensions
    ? apiData.dimensions.map((d) => {
        const fb = FALLBACK_DIMENSIONS.find((f) => f.key === d.key);
        return {
          key: d.key,
          label: d.label,
          icon: DIMENSION_ICONS[d.key] ?? Activity,
          color: d.color,
          score: d.score,
          weight: d.weight,
          signals: d.signals,
          trend: fb?.trend ?? [d.score, d.score, d.score, d.score, d.score, d.score, d.score],
        };
      })
    : FALLBACK_DIMENSIONS;

  const compositeScore =
    apiData?.compositeScore ??
    data?.compositeScore ??
    Math.round(DIMENSIONS.reduce((s, d) => s + d.score * d.weight, 0));
  const [selected, setSelected] = useState<string | null>(null);

  const _selectedDimension = DIMENSIONS.find((d) => d.key === selected);
  const radarData = DIMENSIONS.map((d) => ({ subject: d.label, score: d.score }));

  return (
    <OpsLayout title="Health Score">
      <div className="flex flex-col gap-6">
        {/* Hero Score */}
        <div
          className="rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8"
          style={{
            backgroundColor: 'var(--color-surface-base)',
            border: '1px solid var(--color-surface-border)',
          }}
        >
          {/* Big Number */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-36 h-36 rounded-full flex flex-col items-center justify-center"
              style={{
                background: `conic-gradient(${scoreColor(compositeScore)} ${compositeScore * 3.6}deg, var(--color-bg-elevated) 0)`,
                padding: '4px',
              }}
            >
              <div
                className="w-full h-full rounded-full flex flex-col items-center justify-center"
                style={{ backgroundColor: 'var(--color-bg-primary)' }}
              >
                <div
                  className="text-5xl font-black font-mono"
                  style={{ color: scoreColor(compositeScore) }}
                >
                  {compositeScore}
                </div>
                <div
                  className="text-[10px] font-mono uppercase tracking-widest"
                  style={{ color: 'var(--color-fg-muted)' }}
                >
                  / 100
                </div>
              </div>
            </div>
            <div className="text-lg font-bold" style={{ color: scoreColor(compositeScore) }}>
              {scoreLabel(compositeScore)}
            </div>
          </div>

          {/* Dimension Bars */}
          <div className="flex-1 w-full flex flex-col gap-4">
            {DIMENSIONS.map((d) => {
              const Icon = d.icon;
              return (
                <div
                  key={d.key}
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => setSelected(selected === d.key ? null : d.key)}
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${d.color} 12%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${d.color} 25%, transparent)`,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: d.color }} />
                  </div>
                  <div
                    className="w-24 text-xs font-semibold"
                    style={{ color: 'var(--color-fg-secondary)' }}
                  >
                    {d.label}
                  </div>
                  <div
                    className="flex-1 h-3 rounded-full relative"
                    style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${d.score}%`, backgroundColor: d.color }}
                    />
                  </div>
                  <div
                    className="w-8 text-right text-sm font-bold font-mono"
                    style={{ color: scoreColor(d.score) }}
                  >
                    {d.score}
                  </div>
                  <div
                    className="text-[10px] font-mono w-10 text-right"
                    style={{ color: 'var(--color-fg-muted)' }}
                  >
                    ×{d.weight}
                  </div>
                </div>
              );
            })}
            <div
              className="flex items-center gap-4 pt-2"
              style={{ borderTop: '1px solid var(--color-surface-border)' }}
            >
              <div className="w-7" />
              <div
                className="w-24 text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-fg-muted)' }}
              >
                Composite
              </div>
              <div
                className="flex-1 h-3 rounded-full"
                style={{ backgroundColor: 'var(--color-bg-elevated)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${compositeScore}%`,
                    backgroundColor: scoreColor(compositeScore),
                  }}
                />
              </div>
              <div
                className="w-8 text-right text-sm font-bold font-mono"
                style={{ color: scoreColor(compositeScore) }}
              >
                {compositeScore}
              </div>
              <div className="w-10" />
            </div>
          </div>

          {/* Radar */}
          <div className="hidden lg:block w-52 h-52 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
                />
                <Radar dataKey="score" stroke="#8b7ac8" fill="#8b7ac8" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current Snapshot + Domain Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Composite Snapshot */}
          <div
            className="lg:col-span-2 rounded-xl p-5"
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
                Composite Health — Live
              </span>
              <span
                className="text-[10px] font-mono uppercase"
                style={{ color: 'var(--color-fg-muted)' }}
              >
                Source: {apiData?.dataSource ?? 'fallback'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DIMENSIONS.map((d) => (
                <div
                  key={d.key}
                  className="rounded-lg p-3"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: `1px solid ${d.color}30`,
                  }}
                >
                  <div
                    className="text-[10px] font-mono uppercase tracking-wider mb-1"
                    style={{ color: 'var(--color-fg-muted)' }}
                  >
                    {d.label}
                  </div>
                  <div className="text-2xl font-bold font-mono" style={{ color: d.color }}>
                    {d.score}
                  </div>
                  <div
                    className="text-[10px] font-mono mt-1"
                    style={{ color: 'var(--color-fg-muted)' }}
                  >
                    weight {Math.round(d.weight * 100)}%
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-[11px]" style={{ color: 'var(--color-fg-muted)' }}>
              Updated{' '}
              {apiData?.generatedAt ? new Date(apiData.generatedAt).toLocaleTimeString() : '—'} ·
              Trend history not yet recorded.
            </div>
          </div>

          {/* Domain Scores */}
          <div className="flex flex-col gap-3">
            <div
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--color-fg-muted)' }}
            >
              Domain Scores
            </div>
            {(data?.domains ?? []).map((domain) => (
              <div
                key={domain.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  backgroundColor: 'var(--color-surface-base)',
                  border: '1px solid var(--color-surface-border)',
                }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: domain.color }} />
                <span className="text-xs font-semibold flex-1" style={{ color: domain.color }}>
                  {domain.name}
                </span>
                <div
                  className="w-20 h-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${domain.score}%`, backgroundColor: scoreColor(domain.score) }}
                  />
                </div>
                <span
                  className="text-xs font-bold font-mono w-6 text-right"
                  style={{ color: scoreColor(domain.score) }}
                >
                  {domain.score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Service Status */}
        <ServiceStatusPanel />

        {/* Connector Freshness */}
        <ConnectorFreshnessPanel />

        {/* Dimension Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DIMENSIONS.map((d) => {
            const Icon = d.icon;
            const isSelected = selected === d.key;
            return (
              <div
                key={d.key}
                onClick={() => setSelected(isSelected ? null : d.key)}
                className="rounded-xl p-5 cursor-pointer transition-all"
                style={{
                  backgroundColor: isSelected
                    ? 'var(--color-bg-elevated)'
                    : 'var(--color-surface-base)',
                  border: `1px solid ${isSelected ? d.color : 'var(--color-surface-border)'}`,
                }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${d.color} 15%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${d.color} 30%, transparent)`,
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: d.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold mb-0.5" style={{ color: d.color }}>
                      {d.label}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                      Weight: {Math.round(d.weight * 100)}% of composite
                    </div>
                  </div>
                  <div
                    className="text-2xl font-black font-mono"
                    style={{ color: scoreColor(d.score) }}
                  >
                    {d.score}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {d.signals.map((sig) => {
                    const sigColor =
                      sig.status === 'good'
                        ? 'var(--color-low)'
                        : sig.status === 'warn'
                          ? 'var(--color-medium)'
                          : 'var(--color-critical)';
                    return (
                      <div
                        key={sig.label}
                        className="flex items-center justify-between py-1.5"
                        style={{ borderBottom: '1px solid var(--color-surface-border)' }}
                      >
                        <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                          {sig.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold" style={{ color: sigColor }}>
                            {sig.value}
                          </span>
                          {sig.status === 'good' ? (
                            <CheckCircle2 className="w-3 h-3" style={{ color: sigColor }} />
                          ) : sig.status === 'warn' ? (
                            <AlertTriangle className="w-3 h-3" style={{ color: sigColor }} />
                          ) : (
                            <AlertTriangle className="w-3 h-3" style={{ color: sigColor }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Mini trend */}
                <div className="flex items-end gap-px h-8 mt-3">
                  {d.trend.map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${((v - 60) / 35) * 100}%`,
                        backgroundColor:
                          i === d.trend.length - 1
                            ? d.color
                            : `color-mix(in srgb, ${d.color} 30%, transparent)`,
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </OpsLayout>
  );
}
