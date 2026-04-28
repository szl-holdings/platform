import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Flame,
  Funnel,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KpiData {
  timestamp: string;
  users: { dau: number; wau: number; mau: number };
  api: {
    errorRate: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    throughputPerHour: number;
    requestCount: number;
  };
  errorBudget: { burnRate: number; budget99_9: number };
  featureAdoption: Record<string, number>;
  byDomain: Record<string, number>;
  revenue: {
    subscriptionsStarted30d: number;
    subscriptionsUpgraded30d: number;
    subscriptionsDowngraded30d: number;
    subscriptionsCancelled30d: number;
    netSubscriptionDelta30d: number;
  };
  jobs: { failures: number; completions: number };
}

interface TimeSeriesPoint {
  bucket: string;
  eventName: string;
  count: number;
}

interface FunnelStep {
  step: string;
  count: number;
  conversionRate: number;
  dropOff: number;
  dropOffRate: number;
}

interface FunnelData {
  steps: FunnelStep[];
  overallConversionRate: number;
}

interface CohortPeriod {
  offset: number;
  returnWeek: string;
  retained: number;
  retentionRate: number;
}

interface CohortRow {
  cohortWeek: string;
  cohortSize: number;
  periods: CohortPeriod[];
}

interface CohortData {
  cohorts: CohortRow[];
}

interface TopNItem {
  key: string;
  count: number;
  share: number;
}

interface TopNData {
  items: TopNItem[];
  total: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number, decimals = 0): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(decimals);
}

function fmtMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.round(ms)}ms`;
}

function trend(a: number, b: number): 'up' | 'down' | 'stable' {
  if (b === 0) return 'stable';
  const pct = ((a - b) / b) * 100;
  if (pct > 5) return 'up';
  if (pct < -5) return 'down';
  return 'stable';
}

function TrendIcon({ dir, invert = false }: { dir: 'up' | 'down' | 'stable'; invert?: boolean }) {
  const good = invert ? dir === 'down' : dir === 'up';
  if (dir === 'stable') return <span className="text-muted-foreground text-xs">—</span>;
  return dir === 'up' ? (
    <TrendingUp className={`w-3.5 h-3.5 ${good ? 'text-[#6b8f71]' : 'text-[#c45a4a]'}`} />
  ) : (
    <TrendingDown className={`w-3.5 h-3.5 ${good ? 'text-[#6b8f71]' : 'text-[#c45a4a]'}`} />
  );
}

// ---------------------------------------------------------------------------
// Mini sparkline component (SVG-based, no external deps)
// ---------------------------------------------------------------------------

function Sparkline({
  data,
  color = '#4a90b8',
  height = 32,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (data.length < 2) return <div style={{ height }} />;
  const w = 120;
  const h = height;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  subLabel,
  icon: Icon,
  color,
  sparkData,
  sparkColor,
  invertTrend,
}: {
  label: string;
  value: string;
  subLabel?: string;
  icon: React.ElementType;
  color: string;
  sparkData?: number[];
  sparkColor?: string;
  invertTrend?: boolean;
}) {
  const dir =
    sparkData && sparkData.length >= 2
      ? trend(sparkData[sparkData.length - 1]!, sparkData[0]!)
      : 'stable';

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-2xl font-display font-bold leading-none">{value}</div>
          {subLabel && (
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <TrendIcon dir={dir} invert={invertTrend} />
              {subLabel}
            </div>
          )}
        </div>
        {sparkData && (
          <Sparkline data={sparkData} color={sparkColor ?? color} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Funnel Builder
// ---------------------------------------------------------------------------

const DEFAULT_FUNNEL_STEPS = [
  'user_signed_up',
  'dashboard_viewed',
  'workflow_started',
  'workflow_completed',
];

function FunnelBuilder({ orgId }: { orgId: string }) {
  const [steps, setSteps] = useState<string[]>(DEFAULT_FUNNEL_STEPS);
  const [newStep, setNewStep] = useState('');
  const [domain, setDomain] = useState('');
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to] = useState(() => new Date().toISOString().slice(0, 10));
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runFunnel = useCallback(async () => {
    if (steps.length < 2) {
      setError('Add at least 2 steps');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        steps,
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
      };
      if (domain) body.domain = domain;
      if (orgId) body.orgId = orgId;
      const data = await apiFetch('/analytics/funnel', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setFunnelData(data as FunnelData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Funnel query failed');
    } finally {
      setLoading(false);
    }
  }, [steps, domain, from, to, orgId]);

  const maxCount = funnelData ? Math.max(...funnelData.steps.map((s) => s.count), 1) : 1;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-sm">Funnel Builder</h3>
        <span className="ml-auto text-[10px] text-muted-foreground">
          Multi-step conversion analysis
        </span>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="bg-primary/10 text-primary text-[11px] font-mono px-2 py-0.5 rounded border border-primary/20">
              {s}
            </span>
            {i < steps.length - 1 && (
              <span className="text-[10px] text-muted-foreground">→</span>
            )}
            <button
              onClick={() => setSteps(steps.filter((_, j) => j !== i))}
              className="text-muted-foreground hover:text-[#c45a4a] text-[10px] leading-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={newStep}
          onChange={(e) => setNewStep(e.target.value)}
          placeholder="Add event (e.g. workflow_started)"
          className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newStep.trim()) {
              setSteps([...steps, newStep.trim()]);
              setNewStep('');
            }
          }}
        />
        <button
          onClick={() => {
            if (newStep.trim()) {
              setSteps([...steps, newStep.trim()]);
              setNewStep('');
            }
          }}
          className="px-3 py-1 bg-primary/10 text-primary text-xs rounded border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          + Add
        </button>
        <input
          value={from}
          type="date"
          onChange={(e) => setFrom(e.target.value)}
          className="bg-background border border-border rounded px-2 py-1 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="domain (opt)"
          className="w-28 bg-background border border-border rounded px-2 py-1 text-xs font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <button
          onClick={runFunnel}
          disabled={loading}
          className="px-4 py-1 bg-primary text-primary-foreground text-xs rounded hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Analyze'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[#c45a4a] text-xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      {funnelData && (
        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Overall conversion: <b className="text-foreground">{funnelData.overallConversionRate.toFixed(1)}%</b></span>
          </div>
          {funnelData.steps.map((step, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="font-mono text-foreground/80">{step.step}</span>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>{fmt(step.count)} events</span>
                  {i > 0 && (
                    <span className={step.dropOffRate > 50 ? 'text-[#c45a4a]' : 'text-[#6b8f71]'}>
                      ↓{step.dropOffRate.toFixed(1)}% drop-off
                    </span>
                  )}
                </div>
              </div>
              <div className="h-5 bg-background rounded overflow-hidden border border-border/50">
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{
                    width: `${Math.max((step.count / maxCount) * 100, 1)}%`,
                    background: i === 0 ? '#4a90b8' : i === funnelData.steps.length - 1 ? '#6b8f71' : '#8b7ac8',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cohort Analysis
// ---------------------------------------------------------------------------

function CohortAnalysis({ orgId }: { orgId: string }) {
  const [signupEvent, setSignupEvent] = useState('user_signed_up');
  const [returnEvent, setReturnEvent] = useState('user_logged_in');
  const [periods, setPeriods] = useState(8);

  const { data, isLoading, refetch } = useStandardQuery<CohortData>({
    queryKey: ['analytics-cohort', signupEvent, returnEvent, periods, orgId],
    queryFn: () =>
      apiFetch(
        `/analytics/cohort?event=${encodeURIComponent(signupEvent)}&returnEvent=${encodeURIComponent(returnEvent)}&periods=${periods}${orgId ? `&orgId=${orgId}` : ''}`,
      ),
    refetchInterval: 5 * 60 * 1000,
  });

  const cohorts = data?.cohorts ?? [];

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-[#d4a054]" />
        <h3 className="font-display font-semibold text-sm">Cohort Retention</h3>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Signup:</span>
          <input
            value={signupEvent}
            onChange={(e) => setSignupEvent(e.target.value)}
            className="bg-background border border-border rounded px-2 py-0.5 text-xs font-mono w-36 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Return:</span>
          <input
            value={returnEvent}
            onChange={(e) => setReturnEvent(e.target.value)}
            className="bg-background border border-border rounded px-2 py-0.5 text-xs font-mono w-36 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Weeks:</span>
          <select
            value={periods}
            onChange={(e) => setPeriods(Number(e.target.value))}
            className="bg-background border border-border rounded px-1 py-0.5 text-xs focus:outline-none"
          >
            {[4, 6, 8, 10, 12].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => void refetch()}
          disabled={isLoading}
          className="ml-auto px-3 py-0.5 bg-primary/10 text-primary text-xs rounded border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {cohorts.length === 0 && !isLoading && (
        <div className="text-center text-muted-foreground text-xs py-6">
          No cohort data — events will appear as users sign up and return
        </div>
      )}

      {cohorts.length > 0 && (() => {
        const maxOffset = Math.max(...cohorts.flatMap((c) => c.periods.map((p) => p.offset)), 0);
        const offsets = Array.from({ length: maxOffset + 1 }, (_, i) => i);
        const retentionCell = (rate: number | undefined) => {
          if (rate == null) return { bg: 'transparent', text: '-', color: '#64748b' };
          const bg = rate >= 60 ? '#1e3a2f' : rate >= 40 ? '#2a3020' : rate >= 20 ? '#332b18' : '#2a1c1c';
          const color = rate >= 60 ? '#6b8f71' : rate >= 40 ? '#9ab068' : rate >= 20 ? '#d4a054' : '#c45a4a';
          return { bg, text: `${rate.toFixed(1)}%`, color };
        };
        return (
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="pb-1.5 pr-3 font-medium text-left whitespace-nowrap">Cohort Week</th>
                  <th className="pb-1.5 pr-3 font-medium text-right whitespace-nowrap">Size</th>
                  {offsets.map((off) => (
                    <th key={off} className="pb-1.5 px-1.5 font-medium text-center whitespace-nowrap">
                      W{off}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {cohorts.map((c, ri) => {
                  const byOffset = new Map(c.periods.map((p) => [p.offset, p]));
                  return (
                    <tr key={ri} className="hover:bg-muted/10 transition-colors">
                      <td className="py-1 pr-3 font-mono text-muted-foreground whitespace-nowrap">
                        {c.cohortWeek.slice(0, 10)}
                      </td>
                      <td className="py-1 pr-3 text-right font-medium">{fmt(c.cohortSize)}</td>
                      {offsets.map((off) => {
                        const p = byOffset.get(off);
                        const { bg, text, color } = retentionCell(p?.retentionRate);
                        return (
                          <td
                            key={off}
                            className="py-1 px-1.5 text-center rounded-sm"
                            style={{ background: bg, color }}
                            title={p ? `${p.retained} / ${c.cohortSize} users` : undefined}
                          >
                            {text}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })()}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feature Adoption Heatmap
// ---------------------------------------------------------------------------

function FeatureHeatmap({ adoption }: { adoption: Record<string, number> }) {
  const entries = Object.entries(adoption).sort((a, b) => b[1] - a[1]).slice(0, 20);
  const max = Math.max(...entries.map((e) => e[1]), 1);

  if (entries.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-xs py-6">
        No feature adoption data yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {entries.map(([name, count]) => {
        const intensity = count / max;
        const bg = `rgba(139,122,200,${0.08 + intensity * 0.5})`;
        const border = `rgba(139,122,200,${0.15 + intensity * 0.4})`;
        return (
          <div
            key={name}
            className="rounded-lg p-2 border flex flex-col gap-0.5"
            style={{ background: bg, borderColor: border }}
          >
            <div className="text-[10px] font-mono text-foreground/80 truncate">{name}</div>
            <div
              className="text-[13px] font-bold leading-none"
              style={{ color: `rgba(139,122,200,${0.6 + intensity * 0.4})` }}
            >
              {fmt(count)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top-N breakdown
// ---------------------------------------------------------------------------

function TopNChart({ items, label }: { items: TopNItem[]; label: string }) {
  if (items.length === 0) return null;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-1.5">
      {items.slice(0, 8).map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-28 text-[10px] font-mono text-muted-foreground truncate" title={item.key}>
            {item.key}
          </div>
          <div className="flex-1 h-4 bg-background rounded overflow-hidden border border-border/40">
            <div
              className="h-full rounded"
              style={{
                width: `${(item.count / max) * 100}%`,
                background: '#4a90b8',
                opacity: 0.6 + 0.4 * (item.count / max),
              }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground w-10 text-right">
            {item.share.toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

export default function AnalyticsDashboard() {
  const [orgId] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'cohort' | 'retention'>('overview');

  const { data: kpis, isLoading: kpisLoading, refetch: refetchKpis } = useStandardQuery<KpiData>({
    queryKey: ['analytics-kpis', orgId],
    queryFn: () => apiFetch(`/analytics/kpis${orgId ? `?orgId=${orgId}` : ''}`),
    refetchInterval: autoRefresh ? 30_000 : false,
  });

  const { data: topEvents } = useStandardQuery<TopNData>({
    queryKey: ['analytics-topn-events', orgId],
    queryFn: () => apiFetch(`/analytics/topn?by=eventName&limit=10${orgId ? `&orgId=${orgId}` : ''}`),
    refetchInterval: autoRefresh ? 60_000 : false,
  });

  const { data: topDomains } = useStandardQuery<TopNData>({
    queryKey: ['analytics-topn-domains', orgId],
    queryFn: () => apiFetch(`/analytics/topn?by=domain&limit=10${orgId ? `&orgId=${orgId}` : ''}`),
    refetchInterval: autoRefresh ? 60_000 : false,
  });

  const { data: retentionStatus } = useStandardQuery<{
    retentionDays: number;
    cutoff: string;
    hotEvents: number;
    pendingArchiveEvents: number;
    coldArchivedEvents: number;
    oldestHotEvent: string | null;
    oldestColdEvent: string | null;
  }>({
    queryKey: ['analytics-retention-status'],
    queryFn: () => apiFetch('/analytics/retention-status'),
    refetchInterval: 5 * 60 * 1000,
  });

  const k = kpis;

  const dauSpark = [k?.users.dau ?? 0];
  const latencySpark = [k?.api.p50Latency ?? 0, k?.api.p95Latency ?? 0, k?.api.p99Latency ?? 0];

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'funnel' as const, label: 'Funnels' },
    { id: 'cohort' as const, label: 'Cohort' },
    { id: 'retention' as const, label: 'Retention' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Analytics Intelligence
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time platform KPIs, funnel analysis, cohort retention, and data pipeline health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${autoRefresh ? 'bg-primary/10 text-primary border-primary/20' : 'bg-card text-muted-foreground border-border'}`}
          >
            <Activity className="w-3.5 h-3.5" />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
          <button
            onClick={() => void refetchKpis()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${kpisLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${
              activeTab === tab.id
                ? 'text-primary border-primary bg-primary/5'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Daily Active"
              value={kpisLoading ? '—' : fmt(k?.users.dau ?? 0)}
              subLabel={`WAU: ${fmt(k?.users.wau ?? 0)} · MAU: ${fmt(k?.users.mau ?? 0)}`}
              icon={Users}
              color="#4a90b8"
              sparkData={dauSpark}
              sparkColor="#4a90b8"
            />
            <KpiCard
              label="API Latency P95"
              value={kpisLoading ? '—' : fmtMs(k?.api.p95Latency ?? 0)}
              subLabel={`P50: ${fmtMs(k?.api.p50Latency ?? 0)} · P99: ${fmtMs(k?.api.p99Latency ?? 0)}`}
              icon={Zap}
              color="#d4a054"
              sparkData={latencySpark}
              sparkColor="#d4a054"
              invertTrend
            />
            <KpiCard
              label="Error Rate"
              value={kpisLoading ? '—' : `${(k?.api.errorRate ?? 0).toFixed(2)}%`}
              subLabel={`${fmt(k?.api.requestCount ?? 0)} requests`}
              icon={AlertTriangle}
              color="#c45a4a"
              sparkData={[k?.api.errorRate ?? 0]}
              sparkColor="#c45a4a"
              invertTrend
            />
            <KpiCard
              label="Error Budget Burn"
              value={kpisLoading ? '—' : `${Math.min(k?.errorBudget.burnRate ?? 0, 999).toFixed(1)}%`}
              subLabel={`${(k?.errorBudget.budget99_9 ?? 0).toFixed(1)} min budget left`}
              icon={Flame}
              color={
                (k?.errorBudget.burnRate ?? 0) > 100
                  ? '#c45a4a'
                  : (k?.errorBudget.burnRate ?? 0) > 50
                    ? '#d4a054'
                    : '#6b8f71'
              }
              invertTrend
            />
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-4 space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Throughput
              </div>
              <div className="text-xl font-display font-bold">
                {kpisLoading ? '—' : fmt(k?.api.throughputPerHour ?? 0)}/hr
              </div>
              <div className="text-[11px] text-muted-foreground">API requests per hour</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#6b8f71]" />
                Job Health
              </div>
              <div className="text-xl font-display font-bold">
                {kpisLoading ? '—' : `${k?.jobs.completions ?? 0} / ${(k?.jobs.failures ?? 0) + (k?.jobs.completions ?? 0)}`}
              </div>
              <div className="text-[11px] text-muted-foreground">Completions / Total jobs</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#8b7ac8]" />
                Top Domain
              </div>
              <div className="text-xl font-display font-bold truncate">
                {kpisLoading
                  ? '—'
                  : Object.entries(k?.byDomain ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A'}
              </div>
              <div className="text-[11px] text-muted-foreground">Most active domain (24h)</div>
            </div>
          </div>

          {/* Revenue snapshot */}
          {k?.revenue && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#6b8f71]" />
                Subscription Revenue Signals
                <span className="ml-auto text-[10px] text-muted-foreground">30d</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'New', value: k.revenue.subscriptionsStarted30d, color: '#6b8f71' },
                  { label: 'Upgrades', value: k.revenue.subscriptionsUpgraded30d, color: '#4a90b8' },
                  { label: 'Downgrades', value: k.revenue.subscriptionsDowngraded30d, color: '#d4a054' },
                  { label: 'Cancelled', value: k.revenue.subscriptionsCancelled30d, color: '#c45a4a' },
                  {
                    label: 'Net Δ',
                    value: k.revenue.netSubscriptionDelta30d,
                    color: k.revenue.netSubscriptionDelta30d >= 0 ? '#6b8f71' : '#c45a4a',
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-background/60 rounded-lg p-3 text-center space-y-1">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
                    <div className="text-lg font-bold" style={{ color }}>
                      {value >= 0 ? '+' : ''}{value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature adoption + Top Events side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#8b7ac8]" />
                Feature Adoption Heatmap
                <span className="ml-auto text-[10px] text-muted-foreground">24h</span>
              </h3>
              <FeatureHeatmap adoption={k?.featureAdoption ?? {}} />
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#4a90b8]" />
                Top Events (7d)
              </h3>
              <TopNChart items={topEvents?.items ?? []} label="Event" />
              <h3 className="font-display font-semibold text-sm flex items-center gap-2 pt-2 border-t border-border/50">
                <Activity className="w-4 h-4 text-[#d4a054]" />
                By Domain (7d)
              </h3>
              <TopNChart items={topDomains?.items ?? []} label="Domain" />
            </div>
          </div>
        </div>
      )}

      {/* Funnel tab */}
      {activeTab === 'funnel' && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Define a multi-step conversion funnel to see how users progress through key actions.
            Add event names from the platform event taxonomy, then click Analyze.
          </p>
          <FunnelBuilder orgId={orgId} />
        </div>
      )}

      {/* Cohort tab */}
      {activeTab === 'cohort' && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Cohort retention shows how many users who signed up in a given week came back and
            performed the return event. Useful for measuring long-term engagement and churn.
          </p>
          <CohortAnalysis orgId={orgId} />
        </div>
      )}

      {/* Retention tab */}
      {activeTab === 'retention' && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Data retention pipeline status. Raw events older than the retention window are archived.
            Aggregated rollups are preserved indefinitely for trend analysis.
          </p>
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-display font-semibold text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#d4a054]" />
              Pipeline Status
            </h3>
            {retentionStatus ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Retention Window
                  </div>
                  <div className="text-lg font-bold">{retentionStatus.retentionDays} days</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Hot Events
                  </div>
                  <div className="text-lg font-bold text-[#4a90b8]">
                    {fmt(retentionStatus.hotEvents)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">within retention window</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Pending Archive
                  </div>
                  <div className="text-lg font-bold text-[#d4a054]">
                    {fmt(retentionStatus.pendingArchiveEvents)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">hot events past cutoff</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Cold Archived
                  </div>
                  <div className="text-lg font-bold text-[#6b8f71]">
                    {fmt(retentionStatus.coldArchivedEvents)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">events in cold store</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Oldest Hot
                  </div>
                  <div className="text-sm font-mono">
                    {retentionStatus.oldestHotEvent
                      ? retentionStatus.oldestHotEvent.slice(0, 10)
                      : 'N/A'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Oldest Cold
                  </div>
                  <div className="text-sm font-mono">
                    {retentionStatus.oldestColdEvent
                      ? retentionStatus.oldestColdEvent.slice(0, 10)
                      : 'N/A'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-xs">Loading pipeline status…</div>
            )}

            <div className="border-t border-border pt-4 space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Archive Policy
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>
                  Raw events older than {retentionStatus?.retentionDays ?? 90} days are batched and removed
                  from the hot-tier table
                </li>
                <li>Aggregated rollups (minute/hour/day buckets) are never pruned</li>
                <li>Archive job runs daily and processes up to 500 events per batch</li>
                <li>
                  Override retention window via <code className="font-mono bg-background/60 px-1 rounded">ANALYTICS_RETENTION_DAYS</code> env var
                </li>
              </ul>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Scheduled Job
              </h4>
              <div className="flex items-center gap-2 text-xs">
                <div className="px-2 py-0.5 rounded-full bg-[#6b8f71]/10 text-[#6b8f71] border border-[#6b8f71]/20 text-[10px]">
                  daily
                </div>
                <span className="font-mono text-foreground/80">analytics_retention_archive</span>
                <span className="text-muted-foreground">
                  — batched delete of expired raw events, preserving aggregated rollups
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground text-right">
        {kpis?.timestamp
          ? `Last updated ${new Date(kpis.timestamp).toLocaleTimeString()}`
          : 'Connecting to analytics pipeline…'}
      </div>
    </div>
  );
}
