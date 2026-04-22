import { useStandardQuery } from '@szl-holdings/api-client-react';
import { Activity, ArrowLeft, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import { apiUrl, fetchJson } from '../cognitive/shared';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

interface ProductHealth {
  product: string;
  label: string;
  color: string;
  icon: string;
  totalRuns: number;
  passCount: number;
  failCount: number;
  passRate: number;
  policyBreachCount: number;
  regressionDelta: number | null;
  autonomyMix: { autonomous: number; supervised: number; advisory: number; readOnly: number };
  p7dTrend: { date: string; passRate: number | null; runs: number }[];
  lastRunAt: string | null;
  status: 'healthy' | 'degraded' | 'critical' | 'no-data';
}

interface Aggregate {
  totalRuns: number;
  totalPass: number;
  totalFail: number;
  totalPolicyBreaches: number;
}

interface RunHealthResponse {
  products: ProductHealth[];
  aggregate: Aggregate;
}

const STATUS_META: Record<string, { color: string; label: string }> = {
  healthy: { color: '#22c55e', label: 'Healthy' },
  degraded: { color: '#f59e0b', label: 'Degraded' },
  critical: { color: '#ef4444', label: 'Critical' },
  'no-data': { color: '#64748b', label: 'No Data' },
};

function MiniSparkline({
  trend,
}: {
  trend: { date?: string; passRate: number | null; runs: number }[];
}) {
  const filled = trend.filter((t) => t.passRate !== null && t.runs > 0);
  if (!trend || trend.length === 0 || filled.length < 2)
    return (
      <div className="w-[60px] h-[28px] flex items-center justify-center">
        <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>
          no runs
        </span>
      </div>
    );
  const h = 28;
  const w = 60;
  const pts = filled.map((t, i) => {
    const x = (i / (filled.length - 1)) * w;
    const y = h - (t.passRate as number) * h;
    return `${x},${y}`;
  });
  const last = filled[filled.length - 1].passRate as number;
  const color = last >= 0.88 ? '#22c55e' : last >= 0.72 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-80">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <polyline points={`0,${h} ${pts.join(' ')} ${w},${h}`} fill={`${color}18`} stroke="none" />
    </svg>
  );
}

function AutonomyBar({ mix }: { mix: ProductHealth['autonomyMix'] }) {
  const total = mix.autonomous + mix.supervised + mix.advisory + mix.readOnly;
  const pct = (v: number) => Math.round((v / total) * 100);
  const bars = [
    { label: 'autonomous', color: '#22c55e', value: pct(mix.autonomous) },
    { label: 'supervised', color: '#f59e0b', value: pct(mix.supervised) },
    { label: 'advisory', color: '#0ea5e9', value: pct(mix.advisory) },
    { label: 'read-only', color: '#64748b', value: pct(mix.readOnly) },
  ];

  return (
    <div className="w-full">
      <div className="flex rounded-full overflow-hidden h-1.5 gap-px">
        {bars.map(
          (b) =>
            b.value > 0 && (
              <div
                key={b.label}
                style={{ width: `${b.value}%`, background: b.color }}
                title={`${b.label}: ${b.value}%`}
              />
            ),
        )}
      </div>
      <div className="mt-1 flex gap-2 flex-wrap">
        {bars.map(
          (b) =>
            b.value > 0 && (
              <span
                key={b.label}
                className="text-[9px] font-mono flex items-center gap-0.5"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ background: b.color }}
                />
                {b.value}%
              </span>
            ),
        )}
      </div>
    </div>
  );
}

export function RunHealthPage() {
  const { data, isLoading, error } = useStandardQuery<RunHealthResponse>({
    queryKey: ['cross-platform', 'run-health'],
    queryFn: () => fetchJson<RunHealthResponse>(apiUrl('/cross-platform/run-health')),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const products = data?.products ?? [];
  const agg = data?.aggregate;

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: '#080c14', color: 'rgba(255,255,255,0.85)' }}
    >
      <div
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href={`${BASE}/strategy/cross-platform`}
            className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <ArrowLeft className="w-3 h-3" />
            Correlations
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.12)' }}>/</span>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: '#8b7ac8' }} />
            <span className="text-sm font-semibold">Run Health Dashboard</span>
          </div>
        </div>
        {agg && (
          <div className="hidden md:flex items-center gap-4 text-[10px] font-mono">
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>
              {agg.totalRuns.toLocaleString()} runs total
            </span>
            <span style={{ color: '#22c55e' }}>{agg.totalPass.toLocaleString()} passed</span>
            <span style={{ color: '#ef4444' }}>{agg.totalFail.toLocaleString()} failed</span>
            <span style={{ color: '#f59e0b' }}>{agg.totalPolicyBreaches} policy breaches</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div
              className="w-5 h-5 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(139,122,200,0.2)', borderTopColor: '#8b7ac8' }}
            />
          </div>
        )}
        {error && (
          <div className="text-center py-12 text-sm" style={{ color: '#ef4444' }}>
            Failed to load run health
          </div>
        )}

        {agg && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Runs', value: agg.totalRuns.toLocaleString(), color: '#8b7ac8' },
              {
                label: 'Pass Rate',
                value:
                  agg.totalRuns > 0 ? `${Math.round((agg.totalPass / agg.totalRuns) * 100)}%` : '—',
                color: '#22c55e',
              },
              { label: 'Policy Breaches', value: agg.totalPolicyBreaches, color: '#f59e0b' },
              { label: 'Failed Runs', value: agg.totalFail.toLocaleString(), color: '#ef4444' },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-lg p-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="text-[9px] uppercase tracking-widest font-mono mb-1"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  {m.label}
                </div>
                <div className="text-xl font-bold font-mono" style={{ color: m.color }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((p) => {
            const statusMeta = STATUS_META[p.status] ?? STATUS_META.degraded;
            const delta = p.regressionDelta;
            const DeltaIcon =
              delta === null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
            const deltaColor =
              delta === null
                ? '#64748b'
                : delta < 0
                  ? '#22c55e'
                  : delta > 0
                    ? '#ef4444'
                    : '#64748b';

            return (
              <div
                key={p.product}
                className="rounded-lg p-4"
                style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${p.color}18` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.icon}</span>
                    <div>
                      <div className="text-[11px] font-semibold" style={{ color: p.color }}>
                        {p.label}
                      </div>
                      <div
                        className="text-[9px] font-mono"
                        style={{ color: 'rgba(255,255,255,0.25)' }}
                      >
                        {p.product}
                      </div>
                    </div>
                  </div>
                  <span
                    className="text-[9px] font-mono px-2 py-0.5 rounded"
                    style={{
                      color: statusMeta.color,
                      background: `${statusMeta.color}12`,
                      border: `1px solid ${statusMeta.color}25`,
                    }}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <div className="text-base font-bold font-mono" style={{ color: '#22c55e' }}>
                      {p.passRate}%
                    </div>
                    <div
                      className="text-[8px] uppercase tracking-wide"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      Pass Rate
                    </div>
                  </div>
                  <div className="text-center">
                    <div
                      className="text-base font-bold font-mono"
                      style={{ color: 'rgba(255,255,255,0.8)' }}
                    >
                      {p.totalRuns}
                    </div>
                    <div
                      className="text-[8px] uppercase tracking-wide"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      Total Runs
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold font-mono" style={{ color: '#f59e0b' }}>
                      {p.policyBreachCount}
                    </div>
                    <div
                      className="text-[8px] uppercase tracking-wide"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      Breaches
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <MiniSparkline trend={p.p7dTrend} />
                  <div
                    className="flex items-center gap-1 text-[10px] font-mono"
                    style={{ color: deltaColor }}
                  >
                    <DeltaIcon className="w-3 h-3" />
                    {delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta}pp`}
                  </div>
                </div>

                <div className="mb-2">
                  <div
                    className="text-[9px] uppercase tracking-widest font-mono mb-1.5"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    Autonomy Mix
                  </div>
                  <AutonomyBar mix={p.autonomyMix} />
                </div>

                <div
                  className="text-[9px] font-mono mt-2"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  {p.lastRunAt
                    ? `Last run ${new Date(p.lastRunAt).toLocaleString()}`
                    : 'No runs recorded'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
