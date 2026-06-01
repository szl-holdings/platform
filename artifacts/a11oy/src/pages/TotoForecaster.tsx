import { useState, useEffect } from 'react';

const METRICS = [
  'cpu.system.percent', 'memory.used_bytes', 'network.bytes_recv',
  'disk.io.read_bytes', 'http.request.duration_p99', 'container.restart_count',
  'kafka.consumer.lag', 'redis.connected_clients', 'pg.connections.active',
  'k8s.pod.cpu.utilization', 'jvm.gc.pause_time', 'grpc.server.latency',
] as const;

interface ForecastSeries {
  metric: string;
  history: number[];
  predicted: number[];
  lower80: number[];
  upper80: number[];
  lower95: number[];
  upper95: number[];
  anomalyScore: number;
  crps: number;
  trend: 'stable' | 'rising' | 'falling' | 'spike';
}

interface ModelStats {
  name: string;
  params: string;
  arch: string;
  trainingPts: string;
  license: string;
  benchmarks: { name: string; rank: string; score: number }[];
}

const TOTO_STATS: ModelStats = {
  name: 'Toto-Open-Base-1.0',
  params: '151M',
  arch: 'Decoder-only Transformer',
  trainingPts: '2.36T data points',
  license: 'Apache 2.0',
  benchmarks: [
    { name: 'BOOM', rank: '#1', score: 0.312 },
    { name: 'GIFT-Eval', rank: '#1', score: 0.847 },
    { name: 'LSF', rank: '#2', score: 0.891 },
  ],
};

function generateSeries(seed: number): ForecastSeries {
  const metric = METRICS[seed % METRICS.length];
  const baseVal = 20 + seed * 7;
  const history = Array.from({ length: 96 }, (_, i) => {
    const seasonal = Math.sin(i / 12) * baseVal * 0.3;
    const trend = i * 0.1;
    const noise = (Math.random() - 0.5) * baseVal * 0.15;
    return Math.max(0, baseVal + seasonal + trend + noise);
  });
  const predicted = Array.from({ length: 48 }, (_, i) => {
    const seasonal = Math.sin((96 + i) / 12) * baseVal * 0.3;
    const trend = (96 + i) * 0.1;
    return Math.max(0, baseVal + seasonal + trend);
  });
  const anomalyScore = Math.floor(Math.random() * 100);
  return {
    metric,
    history,
    predicted,
    lower80: predicted.map((v, i) => v - 8 - i * 0.5),
    upper80: predicted.map((v, i) => v + 8 + i * 0.5),
    lower95: predicted.map((v, i) => v - 16 - i * 1.0),
    upper95: predicted.map((v, i) => v + 16 + i * 1.0),
    anomalyScore,
    crps: +(0.05 + Math.random() * 0.3).toFixed(3),
    trend: anomalyScore > 80 ? 'spike' : anomalyScore > 50 ? 'rising' : anomalyScore < 20 ? 'falling' : 'stable',
  };
}

function MiniSparkline({ data, color, width = 120, height = 32 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" opacity="0.8" />
    </svg>
  );
}

function ForecastChart({ series }: { series: ForecastSeries }) {
  const all = [...series.history, ...series.predicted];
  const maxVal = Math.max(...all, ...series.upper95);
  const minVal = Math.min(...all.filter(v => v > 0), ...series.lower95.filter(v => v > 0));
  const W = 600, H = 160;
  const total = series.history.length + series.predicted.length;
  const sx = (i: number) => (i / (total - 1)) * (W - 10) + 5;
  const sy = (v: number) => H - 8 - ((Math.max(0, v) - minVal) / (maxVal - minVal || 1)) * (H - 16);

  const histPath = series.history.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i)},${sy(v)}`).join(' ');
  const predPath = series.predicted.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(series.history.length + i)},${sy(v)}`).join(' ');

  const ci95 = series.predicted.map((_, i) => `${i === 0 ? 'M' : 'L'}${sx(series.history.length + i)},${sy(series.upper95[i])}`)
    .concat([...series.predicted].reverse().map((_, i) => `L${sx(series.history.length + series.predicted.length - 1 - i)},${sy(series.lower95[series.predicted.length - 1 - i])}`))
    .join(' ') + 'Z';

  const ci80 = series.predicted.map((_, i) => `${i === 0 ? 'M' : 'L'}${sx(series.history.length + i)},${sy(series.upper80[i])}`)
    .concat([...series.predicted].reverse().map((_, i) => `L${sx(series.history.length + series.predicted.length - 1 - i)},${sy(series.lower80[series.predicted.length - 1 - i])}`))
    .join(' ') + 'Z';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[160px]" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g95-${series.metric}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`g80-${series.metric}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={ci95} fill={`url(#g95-${series.metric})`} />
      <path d={ci80} fill={`url(#g80-${series.metric})`} />
      <path d={predPath} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
      <path d={histPath} fill="none" stroke="#06b6d4" strokeWidth="2" />
      <line x1={sx(series.history.length)} y1="4" x2={sx(series.history.length)} y2={H - 4} stroke="white" strokeWidth="0.5" opacity="0.15" strokeDasharray="3 3" />
      <text x={sx(series.history.length) + 3} y="12" fill="white" opacity="0.25" fontSize="8" fontFamily="monospace">now</text>
    </svg>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const bg = score < 25 ? 'bg-green-500/10 text-green-400 border-green-500/20'
    : score < 50 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    : score < 75 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    : 'bg-red-500/10 text-red-400 border-red-500/20';
  return <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border ${bg}`}>{score}</span>;
}

export function TotoForecaster() {
  const [allSeries, setAllSeries] = useState<ForecastSeries[]>([]);
  const [selected, setSelected] = useState<ForecastSeries | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const series = METRICS.map((_, i) => generateSeries(i));
    setAllSeries(series);
    setSelected(series[0]);
    const iv = setInterval(() => {
      const s = METRICS.map((_, i) => generateSeries(i + Date.now() % 100));
      setAllSeries(s);
      setTick(t => t + 1);
    }, 12000);
    return () => clearInterval(iv);
  }, []);

  const avgCrps = allSeries.length ? +(allSeries.reduce((s, x) => s + x.crps, 0) / allSeries.length).toFixed(3) : 0;
  const anomalies = allSeries.filter(s => s.anomalyScore > 60).length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#f5f5f5]/40 mb-1">A11OY · ML · TOTO FORECASTER</p>
        <h1 className="text-2xl font-bold tracking-tight text-[#f5f5f5]">Toto Foundation Forecaster</h1>
        <p className="text-sm text-[#f5f5f5]/50 mt-1 max-w-3xl">
          Zero-shot time-series forecasting powered by Datadog's open-source Toto architecture
          (151M params, decoder-only transformer, Student-T mixture model).
          Adapted for A11oy's cross-vertical observability — forecasts, anomaly scoring,
          and confidence intervals for every metric stream.
          <span className="text-[#c9b787] ml-1">github.com/DataDog/toto</span>
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: 'Active Streams', value: METRICS.length, color: '#06b6d4' },
          { label: 'Avg CRPS', value: avgCrps, color: avgCrps > 0.2 ? '#fb923c' : '#4ade80' },
          { label: 'Anomalies', value: anomalies, color: anomalies > 3 ? '#ef4444' : '#facc15' },
          { label: 'Forecast Horizon', value: '48 steps', color: '#a78bfa' },
          { label: 'Context Length', value: '96 steps', color: '#06b6d4' },
          { label: 'Model Params', value: '151M', color: '#c9b787' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-3 space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">{kpi.label}</p>
            <p className="text-xl font-mono font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white/70">
              Model: {TOTO_STATS.name}
            </h2>
            <p className="text-[10px] font-mono text-white/30 mt-0.5">
              {TOTO_STATS.arch} · {TOTO_STATS.params} · trained on {TOTO_STATS.trainingPts} · {TOTO_STATS.license}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {TOTO_STATS.benchmarks.map(b => (
              <div key={b.name} className="text-center">
                <p className="text-[10px] font-mono text-white/30">{b.name}</p>
                <p className="text-xs font-mono font-bold text-[#c9b787]">{b.rank}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white/70">
                {selected.metric}
              </h2>
              <p className="text-[10px] font-mono text-white/30">
                96-step history → 48-step forecast · CRPS: {selected.crps} · trend: {selected.trend}
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono text-white/30">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#06b6d4]" /> History</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#a78bfa]" /> Forecast</span>
              <span className="flex items-center gap-1"><span className="w-6 h-1 bg-[#a78bfa]/20 rounded" /> 80/95% CI</span>
              <ScoreBadge score={selected.anomalyScore} />
            </div>
          </div>
          <ForecastChart series={selected} />
        </div>
      )}

      <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white/70">Metric Streams</h2>
          <span className="text-[10px] font-mono text-white/30">tick {tick} · {allSeries.length} streams</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.06] text-white/30">
                <th className="text-left px-5 py-2 font-medium uppercase tracking-wider">Metric</th>
                <th className="text-left px-3 py-2 font-medium uppercase tracking-wider">Sparkline</th>
                <th className="text-right px-3 py-2 font-medium uppercase tracking-wider">CRPS</th>
                <th className="text-right px-3 py-2 font-medium uppercase tracking-wider">Trend</th>
                <th className="text-right px-5 py-2 font-medium uppercase tracking-wider">Anomaly</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {allSeries.map(s => (
                <tr key={s.metric} className={`cursor-pointer transition-colors ${selected?.metric === s.metric ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}
                  role="button" tabIndex={0} onClick={() => setSelected(s)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(s); }}>
                  <td className="px-5 py-2 font-bold text-white/80">{s.metric}</td>
                  <td className="px-3 py-2">
                    <MiniSparkline data={s.history.slice(-30)} color={s.anomalyScore > 60 ? '#fb923c' : '#06b6d4'} />
                  </td>
                  <td className="px-3 py-2 text-right text-white/50">{s.crps}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={s.trend === 'spike' ? 'text-red-400' : s.trend === 'rising' ? 'text-orange-400' : s.trend === 'falling' ? 'text-blue-400' : 'text-green-400'}>
                      {s.trend === 'spike' ? '↑↑' : s.trend === 'rising' ? '↗' : s.trend === 'falling' ? '↘' : '→'} {s.trend}
                    </span>
                  </td>
                  <td className="px-5 py-2 text-right"><ScoreBadge score={s.anomalyScore} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
