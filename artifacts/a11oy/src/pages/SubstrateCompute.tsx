import { useState, useEffect } from 'react';

interface ComputeWorkload {
  id: string;
  name: string;
  vertical: string;
  status: 'running' | 'queued' | 'complete' | 'failed';
  gpuType: string;
  utilization: number;
  latencyMs: number;
  throughput: number;
  anomalyScore: number;
  startedAt: number;
}

interface AnomalySignal {
  id: string;
  timestamp: number;
  source: string;
  metric: string;
  score: number;
  direction: 'up' | 'down' | 'spike';
  description: string;
}

interface ForecastPoint {
  t: number;
  actual: number;
  predicted: number;
  lower: number;
  upper: number;
}

const VERTICALS = ['A11oy', 'Terra', 'TENAX', 'Vessels', 'Conduit', 'Counsel', 'Pulse', 'Lyte'] as const;
const GPU_TYPES = ['H100 SXM', 'A100 80G', 'H200 141G', 'L40S'] as const;
const METRICS = ['latency_p99', 'throughput_rps', 'error_rate', 'cache_hit_ratio', 'queue_depth', 'memory_pressure'] as const;

function generateWorkloads(): ComputeWorkload[] {
  return VERTICALS.map((v, i) => ({
    id: `wl-${i}`,
    name: `${v.toLowerCase()}-inference-${Math.floor(Math.random() * 100)}`,
    vertical: v,
    status: (['running', 'running', 'running', 'queued', 'complete', 'running'] as const)[i % 6],
    gpuType: GPU_TYPES[i % GPU_TYPES.length],
    utilization: Math.floor(30 + Math.random() * 65),
    latencyMs: Math.floor(10 + Math.random() * 150),
    throughput: Math.floor(100 + Math.random() * 900),
    anomalyScore: Math.floor(Math.random() * 100),
    startedAt: Date.now() - Math.floor(Math.random() * 3600000),
  }));
}

function generateAnomalySignals(): AnomalySignal[] {
  const now = Date.now();
  return Array.from({ length: 12 }, (_, i) => ({
    id: `sig-${i}`,
    timestamp: now - i * 45000,
    source: VERTICALS[i % VERTICALS.length],
    metric: METRICS[i % METRICS.length],
    score: Math.floor(15 + Math.random() * 80),
    direction: (['up', 'down', 'spike'] as const)[i % 3],
    description: [
      'Latency spike detected in graph rendering pipeline',
      'Throughput degradation in ETL sync batch',
      'Memory pressure approaching threshold on inference node',
      'Cache hit ratio dropped below baseline (Hyndman forecast)',
      'Queue depth anomaly — Chandola SQUAD score elevated',
      'Error rate deviation from 7-day seasonal pattern',
      'Cross-vertical correlation detected (Li causal chain)',
      'GPU utilization surge on H100 cluster',
      'Network I/O bottleneck on data egress path',
      'Prediction confidence interval widened (Talwalkar Toto)',
      'Poghosyan data-agnostic detector flagged drift',
      'Warm-tier eviction rate above normal (FlexCache)',
    ][i],
  }));
}

function generateForecast(): ForecastPoint[] {
  return Array.from({ length: 48 }, (_, i) => {
    const base = 500 + Math.sin(i / 6) * 200 + Math.cos(i / 12) * 100;
    const noise = (Math.random() - 0.5) * 80;
    const actual = i < 36 ? Math.max(0, Math.floor(base + noise)) : 0;
    const predicted = Math.floor(base);
    return {
      t: i,
      actual,
      predicted,
      lower: Math.floor(predicted - 120 - i * 2),
      upper: Math.floor(predicted + 120 + i * 2),
    };
  });
}

function AnomalyBadge({ score }: { score: number }) {
  const bg = score < 30 ? 'bg-green-500/10 text-green-400 border-green-500/20'
    : score < 60 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    : score < 85 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    : 'bg-red-500/10 text-red-400 border-red-500/20';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border ${bg}`}>
      {score}
    </span>
  );
}

function MiniGauge({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function SubstrateCompute() {
  const [workloads, setWorkloads] = useState<ComputeWorkload[]>([]);
  const [signals, setSignals] = useState<AnomalySignal[]>([]);
  const [forecast] = useState<ForecastPoint[]>(generateForecast);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setWorkloads(generateWorkloads());
    setSignals(generateAnomalySignals());
    const iv = setInterval(() => {
      setWorkloads(generateWorkloads());
      setTick(t => t + 1);
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  const totalGpuUtil = workloads.length > 0
    ? Math.round(workloads.filter(w => w.status === 'running').reduce((s, w) => s + w.utilization, 0) / Math.max(workloads.filter(w => w.status === 'running').length, 1))
    : 0;
  const avgLatency = workloads.length > 0
    ? Math.round(workloads.reduce((s, w) => s + w.latencyMs, 0) / workloads.length)
    : 0;
  const totalThroughput = workloads.reduce((s, w) => s + w.throughput, 0);
  const avgAnomaly = workloads.length > 0
    ? Math.round(workloads.reduce((s, w) => s + w.anomalyScore, 0) / workloads.length)
    : 0;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#f5f5f5]/40 mb-1">A11OY · INFRASTRUCTURE · SUBSTRATE</p>
        <h1 className="text-2xl font-bold tracking-tight text-[#f5f5f5]">Substrate Compute</h1>
        <p className="text-sm text-[#f5f5f5]/50 mt-1 max-w-2xl">
          AI infrastructure orchestration across GPU clusters, Kubernetes, Slurm, and Lambda Cloud.
          Anomaly detection powered by Poghosyan data-agnostic scoring, Chandola SQUAD framework,
          and Hyndman–Talwalkar foundation-model forecasting. Causal inference via Li graph analysis.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'GPU Utilization', value: `${totalGpuUtil}%`, color: totalGpuUtil > 80 ? '#fb923c' : '#4ade80' },
          { label: 'Avg Latency', value: `${avgLatency}ms`, color: avgLatency > 100 ? '#fb923c' : '#06b6d4' },
          { label: 'Throughput', value: `${totalThroughput.toLocaleString()} rps`, color: '#a78bfa' },
          { label: 'Active Workloads', value: `${workloads.filter(w => w.status === 'running').length}`, color: '#06b6d4' },
          { label: 'Anomaly Score', value: `${avgAnomaly}`, color: avgAnomaly > 60 ? '#ef4444' : avgAnomaly > 30 ? '#facc15' : '#4ade80' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-4 space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">{kpi.label}</p>
            <p className="text-2xl font-mono font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white/70">Throughput Forecast</h2>
            <div className="flex items-center gap-3 text-[10px] font-mono text-white/30">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#06b6d4]" /> Actual</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#a78bfa]" /> Predicted</span>
              <span className="flex items-center gap-1"><span className="w-6 h-1 bg-[#a78bfa]/20 rounded" /> 95% CI</span>
            </div>
          </div>
          <div className="h-[200px] w-full relative">
            <svg viewBox="0 0 480 200" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
                </linearGradient>
              </defs>
              {(() => {
                const maxVal = Math.max(...forecast.map(p => p.upper), ...forecast.map(p => p.actual));
                const scaleY = (v: number) => 190 - (v / maxVal) * 180;
                const scaleX = (i: number) => (i / (forecast.length - 1)) * 470 + 5;

                const ciPath = forecast.map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(p.upper)}`)
                  .concat(forecast.slice().reverse().map((p, i) => `L${scaleX(forecast.length - 1 - i)},${scaleY(p.lower)}`))
                  .join(' ') + 'Z';

                const actualPath = forecast.filter(p => p.actual > 0).map((p, i) =>
                  `${i === 0 ? 'M' : 'L'}${scaleX(forecast.indexOf(p))},${scaleY(p.actual)}`).join(' ');

                const predictedPath = forecast.map((p, i) =>
                  `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(p.predicted)}`).join(' ');

                return (
                  <>
                    <path d={ciPath} fill="url(#ciGrad)" />
                    <path d={predictedPath} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
                    {actualPath && <path d={actualPath} fill="none" stroke="#06b6d4" strokeWidth="2" />}
                    <line x1={scaleX(35)} y1="5" x2={scaleX(35)} y2="195" stroke="white" strokeWidth="0.5" opacity="0.15" strokeDasharray="3 3" />
                    <text x={scaleX(35) + 4} y="14" fill="white" opacity="0.3" fontSize="8" fontFamily="JetBrains Mono">now</text>
                  </>
                );
              })()}
            </svg>
          </div>
          <p className="text-[10px] text-white/25 font-mono mt-2">
            Hyndman-Talwalkar decomposition: seasonal + trend + residual. CI widens with forecast horizon.
          </p>
        </div>

        <div className="lg:col-span-2 bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-5 max-h-[340px] overflow-y-auto">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white/70 mb-3">Anomaly Signals</h2>
          <div className="space-y-2">
            {signals.map(sig => (
              <div key={sig.id} className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-white/40">
                      {new Date(sig.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-primary">{sig.source}</span>
                  </div>
                  <AnomalyBadge score={sig.score} />
                </div>
                <p className="text-[11px] text-white/50">{sig.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-white/70">Active Workloads</h2>
          <span className="text-[10px] font-mono text-white/30">refreshes every 5s · tick {tick}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.06] text-white/30">
                <th className="text-left px-5 py-2.5 font-medium uppercase tracking-wider">Workload</th>
                <th className="text-left px-3 py-2.5 font-medium uppercase tracking-wider">Vertical</th>
                <th className="text-left px-3 py-2.5 font-medium uppercase tracking-wider">GPU</th>
                <th className="text-left px-3 py-2.5 font-medium uppercase tracking-wider">Status</th>
                <th className="text-right px-3 py-2.5 font-medium uppercase tracking-wider">Util</th>
                <th className="text-right px-3 py-2.5 font-medium uppercase tracking-wider">Latency</th>
                <th className="text-right px-3 py-2.5 font-medium uppercase tracking-wider">RPS</th>
                <th className="text-right px-5 py-2.5 font-medium uppercase tracking-wider">Anomaly</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {workloads.map(wl => (
                <tr key={wl.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-2.5 font-bold text-white/80">{wl.name}</td>
                  <td className="px-3 py-2.5 text-primary">{wl.vertical}</td>
                  <td className="px-3 py-2.5 text-white/40">{wl.gpuType}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1 ${
                      wl.status === 'running' ? 'text-green-400' :
                      wl.status === 'queued' ? 'text-yellow-400' :
                      wl.status === 'complete' ? 'text-blue-400' : 'text-red-400'
                    }`}>
                      {wl.status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                      {wl.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="space-y-1">
                      <span style={{ color: wl.utilization > 80 ? '#fb923c' : '#4ade80' }}>{wl.utilization}%</span>
                      <MiniGauge value={wl.utilization} color={wl.utilization > 80 ? '#fb923c' : '#4ade80'} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-white/60">{wl.latencyMs}ms</td>
                  <td className="px-3 py-2.5 text-right text-white/60">{wl.throughput}</td>
                  <td className="px-5 py-2.5 text-right"><AnomalyBadge score={wl.anomalyScore} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-5 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-white/50">Poghosyan Detector</h3>
          <p className="text-[11px] text-white/40 leading-relaxed">
            Data-agnostic anomaly detection engine adapted from Poghosyan's VMware patents.
            Operates on raw metric streams without domain-specific tuning. 20+ patent portfolio
            covers time-series compression, root-cause detection in distributed systems.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-mono text-green-400">ACTIVE · 6 streams</span>
          </div>
        </div>
        <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-5 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-white/50">Chandola SQUAD Scorer</h3>
          <p className="text-[11px] text-white/40 leading-relaxed">
            Statistical Quality-based Unsupervised Anomaly Detection adapted from Chandola's
            big-data framework (SUNY Buffalo / Oak Ridge). Scores multi-dimensional metric
            combinations and flags deviations that single-metric detectors miss.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-mono text-green-400">ACTIVE · 4 dimensions</span>
          </div>
        </div>
        <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-5 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-white/50">Li Causal Inference</h3>
          <p className="text-[11px] text-white/40 leading-relaxed">
            Graph-based causal inference engine adapted from Li's UVA data science research.
            Traces anomaly propagation across cross-vertical signal chains to identify root
            causes rather than symptoms. Uses directed acyclic graph (DAG) structure.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-mono text-green-400">ACTIVE · 8 verticals</span>
          </div>
        </div>
      </div>
    </div>
  );
}
