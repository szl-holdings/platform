import { useQuery } from '@tanstack/react-query';
import { getAgiForecastStatus, type AgiForecastDerived, type AgiForecastHistoryEntry, type AgiForecastStatus } from '@/lib/api';

type MetricKey = keyof AgiForecastDerived;

interface MetricSpec {
  readonly key: MetricKey;
  readonly title: string;
  readonly unit: string;
  readonly explainer: string;
  readonly format: (v: number) => string;
}

const METRICS: readonly MetricSpec[] = [
  {
    key: 'horizonVelocity',
    title: 'Horizon Velocity',
    unit: 'signal-units / day',
    explainer:
      'Average per-day change across capability signals — how fast frontier capability is moving.',
    format: (v) => v.toFixed(3),
  },
  {
    key: 'alignmentDebt',
    title: 'Alignment Debt',
    unit: 'signal-units / day',
    explainer:
      'Capability velocity minus safety velocity. Positive means capability is outpacing safety.',
    format: (v) => (v >= 0 ? '+' : '') + v.toFixed(3),
  },
  {
    key: 'lutarReadiness',
    title: 'Lutar Readiness',
    unit: 'composite, 0 – 1',
    explainer:
      'Go / no-go score. 1 means safety is fully keeping pace; 0 means capability is running unchecked.',
    format: (v) => v.toFixed(2),
  },
];

function fmt(v: number | null, spec: MetricSpec): string {
  if (v === null || !Number.isFinite(v)) return '—';
  return spec.format(v);
}

function Sparkline({ values }: { values: ReadonlyArray<number | null> }) {
  const W = 220;
  const H = 48;
  const pad = 4;
  const present = values.filter((v): v is number => v !== null && Number.isFinite(v));
  if (present.length < 2) {
    return (
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#555]">
        not enough history
      </div>
    );
  }
  const min = Math.min(...present);
  const max = Math.max(...present);
  const span = max - min || 1;
  const stepX = (W - pad * 2) / Math.max(values.length - 1, 1);
  const points = values
    .map((v, i) => {
      if (v === null || !Number.isFinite(v)) return null;
      const x = pad + i * stepX;
      const y = H - pad - ((v - min) / span) * (H - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter((p): p is string => p !== null)
    .join(' ');
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full h-12"
      aria-label="Recent history sparkline"
    >
      <polyline
        fill="none"
        stroke="#c9b787"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function MetricCard({
  spec,
  current,
  history,
}: {
  spec: MetricSpec;
  current: number | null;
  history: ReadonlyArray<AgiForecastHistoryEntry>;
}) {
  const series = history.map((h) => h.derived[spec.key]);
  const first = series.find((v): v is number => v !== null && Number.isFinite(v));
  const last = [...series].reverse().find((v): v is number => v !== null && Number.isFinite(v));
  const delta = first !== undefined && last !== undefined ? last - first : null;
  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0e0e0e] p-5 flex flex-col gap-4">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#666]">
          {spec.title}
        </div>
        <div className="mt-2 flex items-baseline gap-3">
          <div className="font-mono text-3xl text-[#f5f5f5] tabular-nums">
            {fmt(current, spec)}
          </div>
          <div className="text-[11px] text-[#666]">{spec.unit}</div>
        </div>
        {delta !== null && Number.isFinite(delta) && (
          <div className="mt-1 text-[11px] font-mono text-[#8a8a8a] tabular-nums">
            {delta >= 0 ? '+' : ''}
            {delta.toFixed(3)} over last {history.length} day{history.length === 1 ? '' : 's'}
          </div>
        )}
      </div>
      <Sparkline values={series} />
      <p className="text-[12px] leading-relaxed text-[#8a8a8a]">{spec.explainer}</p>
    </div>
  );
}

function StatusLine({ data }: { data: AgiForecastStatus }) {
  if (!data.present) {
    return (
      <div className="text-[12px] font-mono text-[#666]">
        {data.message}
      </div>
    );
  }
  const okCount = data.statuses.filter((s) => s.ok).length;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] font-mono text-[#666]">
      <span>
        snapshot date{' '}
        <span className="text-[#c9b787]">{data.date}</span>
      </span>
      <span>
        last run{' '}
        <span className="text-[#c9b787]">
          {new Date(data.lastRunAt).toISOString().replace('T', ' ').slice(0, 19)}Z
        </span>
      </span>
      <span>
        signals{' '}
        <span className="text-[#c9b787]">
          {okCount}/{data.statuses.length} ok
        </span>
      </span>
      <span>
        receipt{' '}
        <span className="text-[#c9b787]">{data.summary.receiptHash.slice(0, 12)}…</span>
      </span>
    </div>
  );
}

export default function AgiForecastPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<AgiForecastStatus>({
    queryKey: ['agi-forecast', 'status'],
    queryFn: getAgiForecastStatus,
    refetchInterval: 60_000,
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-[#f5f5f5]">
            AGI Forecast — Derived Metrics
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[#8a8a8a]">
            Today's horizon-velocity, alignment-debt, and lutar-readiness, derived from the
            public-only gauge snapshot. Values are read straight from{' '}
            <code className="font-mono text-[#c9b787]">buildDailySummary</code> — no
            recalculation happens in the browser.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="shrink-0 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0e0e0e] px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.15em] text-[#8a8a8a] hover:text-[#f5f5f5] hover:border-[rgba(201,183,135,0.4)] transition-colors disabled:opacity-40"
        >
          {isFetching ? 'refreshing…' : 'refresh'}
        </button>
      </header>

      {isLoading && (
        <div className="text-[12px] font-mono text-[#666]">loading snapshot…</div>
      )}

      {isError && (
        <div className="rounded-lg border border-[rgba(220,80,80,0.3)] bg-[rgba(220,80,80,0.05)] p-4 text-[12px] text-[#dc8a8a]">
          Failed to load forecast snapshot: {error instanceof Error ? error.message : String(error)}
        </div>
      )}

      {data && !data.present && (
        <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0e0e0e] p-4 text-[12px] text-[#8a8a8a]">
          {data.message}
        </div>
      )}

      {data && data.present && (
        <>
          <StatusLine data={data} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {METRICS.map((spec) => (
              <MetricCard
                key={spec.key}
                spec={spec}
                current={data.summary.derived[spec.key]}
                history={data.history}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
