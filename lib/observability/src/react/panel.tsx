import { useMemo, useState } from 'react';
import {
  LENSES,
  type LensId,
  type LensScore,
  type MetricSnapshot,
  type ObservabilityEvent,
} from '../types.js';
import { useObservability } from './provider.js';

const LENS_ACCENTS: Record<string, string> = {
  signal: '#06b6d4',
  impact: '#10b981',
  anticipation: '#8b5cf6',
  topology: '#f59e0b',
  posture: '#f43f5e',
  velocity: '#6366f1',
};

const LENS_ICONS: Record<string, string> = {
  signal: '◎',
  impact: '$',
  anticipation: '◈',
  topology: '⬡',
  posture: '◆',
  velocity: '▲',
};

function formatValue(value: number, unit: string): string {
  if (unit === 'percent' || unit === '%') return `${value.toFixed(1)}%`;
  if (unit === 'ms') return `${value.toFixed(0)}ms`;
  if (unit === 'seconds' || unit === 'sec') return `${value.toFixed(1)}s`;
  if (unit === 'score') return value.toFixed(0);
  if (unit === 'per_hour' || unit === '/hr') return `${value.toFixed(0)}/hr`;
  if (unit === 'count') return value.toFixed(0);
  return value.toFixed(1);
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function statusColor(status: string): string {
  switch (status) {
    case 'healthy':
    case 'normal':
      return 'text-emerald-400';
    case 'degraded':
    case 'warning':
      return 'text-amber-400';
    case 'critical':
      return 'text-red-400';
    default:
      return 'text-slate-400';
  }
}

function statusBg(status: string): string {
  switch (status) {
    case 'healthy':
    case 'normal':
      return 'bg-emerald-400/10 border-emerald-400/20';
    case 'degraded':
    case 'warning':
      return 'bg-amber-400/10 border-amber-400/20';
    case 'critical':
      return 'bg-red-400/10 border-red-400/20';
    default:
      return 'bg-slate-400/10 border-slate-400/20';
  }
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'text-red-400 bg-red-400/10';
    case 'warning':
      return 'text-amber-400 bg-amber-400/10';
    default:
      return 'text-blue-400 bg-blue-400/10';
  }
}

function SparkLine({ data, color = '#10b981' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LensCard({ lens, score }: { lens: (typeof LENSES)[0]; score: LensScore }) {
  const circumference = 2 * Math.PI * 18;
  const scoreVal = score.score;
  const offset = circumference - (scoreVal / 100) * circumference;
  const accent = LENS_ACCENTS[lens.id] || '#94a3b8';
  const icon = LENS_ICONS[lens.id] || '◆';

  return (
    <div
      className={`rounded-xl border p-4 ${statusBg(score.status)} transition-all hover:scale-[1.02]`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base flex-shrink-0 text-white/60">{icon}</span>
          <h4 className="text-sm font-medium text-white/90 truncate">{lens.name}</h4>
        </div>
        <div className="relative w-10 h-10 flex-shrink-0">
          <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-white/5"
            />
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke={
                score.status === 'healthy'
                  ? accent
                  : score.status === 'degraded'
                    ? '#f59e0b'
                    : '#ef4444'
              }
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <span
            className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${statusColor(score.status)}`}
          >
            {scoreVal}
          </span>
        </div>
      </div>
      <p className="text-xs text-slate-400 italic mb-1">{lens.tagline}</p>
      <p className="text-xs text-slate-500 line-clamp-2">{lens.description}</p>
      <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
        <span>{score.metricCount} signals</span>
        {score.anomalyCount > 0 && (
          <span className="text-red-400">
            {score.anomalyCount} anomal{score.anomalyCount === 1 ? 'y' : 'ies'}
          </span>
        )}
      </div>
    </div>
  );
}

function MetricRow({
  snapshot,
  config,
}: {
  snapshot: MetricSnapshot;
  config: { metrics: { id: string; name: string; unit: string; lens?: LensId; pillar?: string }[] };
}) {
  const def = config.metrics.find((m) => m.id === snapshot.metricId);
  if (!def) return null;

  const lensId = def.lens || def.pillar || '';
  const sparkColor =
    snapshot.status === 'critical'
      ? '#ef4444'
      : snapshot.status === 'warning'
        ? '#f59e0b'
        : '#10b981';

  return (
    <div className="flex items-center gap-4 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white/90 truncate">{def.name}</div>
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <span>{LENS_ICONS[lensId] || '◆'}</span>
          <span className="capitalize">{lensId} lens</span>
        </div>
      </div>
      <SparkLine data={snapshot.trend} color={sparkColor} />
      <div className="text-right min-w-[60px]">
        <div className={`text-sm font-mono font-medium ${statusColor(snapshot.status)}`}>
          {formatValue(snapshot.current, def.unit)}
        </div>
        <div
          className={`text-xs ${snapshot.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {snapshot.changePercent >= 0 ? '+' : ''}
          {snapshot.changePercent.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

function EventRow({ event }: { event: ObservabilityEvent }) {
  const lensId = event.lens || event.pillar;
  return (
    <div className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs flex-shrink-0 mt-0.5 ${severityColor(event.severity)}`}
      >
        {event.severity === 'critical' ? '!' : event.severity === 'warning' ? '▲' : '●'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white/80 truncate">{event.message}</div>
        <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
          <span>{LENS_ICONS[lensId] || '◆'}</span>
          <span className="capitalize">{lensId} lens</span>
          <span>·</span>
          <span>{event.type.replace(/_/g, ' ')}</span>
          <span>·</span>
          <span>{timeAgo(event.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

type TabId = 'lenses' | 'metrics' | 'events';

export function ObservabilityPanel() {
  const { state, config } = useObservability();
  const [activeTab, setActiveTab] = useState<TabId>('lenses');
  const [lensFilter, setLensFilter] = useState<LensId | 'all'>('all');

  const lenses = state.lenses || state.pillars || [];

  const filteredMetrics = useMemo(() => {
    if (lensFilter === 'all') return state.metrics;
    return state.metrics.filter((m) => {
      const def = config.metrics.find((d) => d.id === m.metricId);
      return (
        (def as unknown as Record<string, unknown>)?.lens === lensFilter ||
        (def as unknown as Record<string, unknown>)?.pillar === lensFilter
      );
    });
  }, [state.metrics, config.metrics, lensFilter]);

  const filteredEvents = useMemo(() => {
    if (lensFilter === 'all') return state.events;
    return state.events.filter((e) => (e.lens || e.pillar) === lensFilter);
  }, [state.events, lensFilter]);

  const domainLabels = (config as unknown as Record<string, unknown>).domainLensLabels as
    | {
        postureScoreName?: string;
        topSignalLabel?: string;
        velocityTrendLabel?: string;
      }
    | undefined;

  const postureLabel = domainLabels?.postureScoreName || 'Posture Score';
  const topSignalLabel = domainLabels?.topSignalLabel || 'Top Signal';
  const velocityLabel = domainLabels?.velocityTrendLabel || 'Velocity Trend';

  const tabs: { id: TabId; label: string }[] = [
    { id: 'lenses', label: '6 Lenses' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'events', label: 'Events' },
  ];

  const postureScore = state.postureScore ?? state.overallScore;
  const topSignal = state.topSignal;
  const velocityTrendArr = state.velocityTrend;
  const velocityTrend =
    velocityTrendArr && velocityTrendArr.length >= 2
      ? Number(
          (
            ((velocityTrendArr[velocityTrendArr.length - 1]! - velocityTrendArr[0]!) /
              Math.max(1, velocityTrendArr[0]!)) *
            100
          ).toFixed(1),
        )
      : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">6</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{config.appName}</h2>
              <p className="text-xs text-indigo-400/70 font-medium">
                The 6 Lenses of Business Observability
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-1">{config.description}</p>
        </div>
        <div className="flex items-center gap-3">
          {topSignal && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/50 max-w-[280px] truncate">
              <span className="text-cyan-400 flex-shrink-0">◎ {topSignalLabel}:</span>
              <span className="truncate">{topSignal}</span>
            </div>
          )}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${statusBg(state.overallStatus)} ${statusColor(state.overallStatus)}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${state.overallStatus === 'healthy' ? 'bg-emerald-400' : state.overallStatus === 'degraded' ? 'bg-amber-400' : 'bg-red-400'}`}
            />
            {postureLabel}: {postureScore}
          </div>
        </div>
      </div>

      {velocityTrend !== undefined && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs">
            <span className="text-indigo-400">▲ {velocityLabel}</span>
            <span
              className={`font-bold ${velocityTrend > 0 ? 'text-emerald-400' : velocityTrend < 0 ? 'text-red-400' : 'text-slate-400'}`}
            >
              {velocityTrend > 0 ? '+' : ''}
              {velocityTrend}%
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-white/10 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'text-white bg-white/10 border-b-2 border-indigo-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto">
          <select
            value={lensFilter}
            onChange={(e) => setLensFilter(e.target.value as LensId | 'all')}
            className="bg-white/5 border border-white/10 text-sm text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-400"
          >
            <option value="all">All Lenses</option>
            {LENSES.map((l) => (
              <option key={l.id} value={l.id}>
                {LENS_ICONS[l.id]} {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeTab === 'lenses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LENSES.map((lens) => {
            const score = lenses.find(
              (l) => l.lensId === lens.id || (l as { pillarId?: string }).pillarId === lens.id,
            );
            if (!score) return null;
            if (lensFilter !== 'all' && lens.id !== lensFilter) return null;
            return <LensCard key={lens.id} lens={lens} score={score as LensScore} />;
          })}
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/5">
          {filteredMetrics.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No signals for selected lens
            </div>
          ) : (
            filteredMetrics.map((m) => <MetricRow key={m.metricId} snapshot={m} config={config} />)
          )}
        </div>
      )}

      {activeTab === 'events' && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/5">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No events for selected lens
            </div>
          ) : (
            filteredEvents.slice(0, 20).map((e) => <EventRow key={e.id} event={e} />)
          )}
        </div>
      )}
    </div>
  );
}
