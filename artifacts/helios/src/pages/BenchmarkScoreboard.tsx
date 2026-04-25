import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { heliosApi, type BenchmarkTimeSeries } from '../lib/api';

const AGENT_COLORS: Record<string, string> = {
  Sentra:  '#f87171',
  Counsel: '#a78bfa',
  Terra:   '#34d399',
  Vessels: '#60a5fa',
  Aegis:   '#fb923c',
  KORA:    '#2dd4bf',
  'A11oy': '#f59e0b',
};

const BENCHMARK_LABELS: Record<string, { name: string; description: string; url: string }> = {
  'swe-bench-lite': { name: 'SWE-bench Lite', description: 'Software engineering agent tasks on real GitHub issues.', url: 'https://www.swebench.com' },
  'agentbench':     { name: 'AgentBench',     description: 'Multi-task agent evaluation across web, code, and OS.', url: 'https://llmbench.github.io/agentbench' },
  'gaia':           { name: 'GAIA',           description: 'General AI assistant evaluation on real-world tasks.', url: 'https://gaia-benchmark.github.io' },
  'maniparena':     { name: 'ManipArena',     description: 'Embodied spatial reasoning (stub — dataset pending).', url: '' },
};

function ScoreDelta({ delta }: { delta: number }) {
  const up = delta >= 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.75rem', fontWeight: 700, color: up ? '#34d399' : '#f87171' }}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? '+' : ''}{(delta * 100).toFixed(1)}pp
    </div>
  );
}

function ScoreBar({ value, sota, color }: { value: number; sota: number; color: string }) {
  const pct = Math.round(value * 100);
  const sotaPct = Math.round(sota * 100);
  return (
    <div style={{ position: 'relative', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'visible', flex: 1 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
      {/* SOTA marker */}
      <div style={{ position: 'absolute', top: -3, bottom: -3, left: `${sotaPct}%`, width: 2, background: 'rgba(255,255,255,0.4)', borderRadius: 1 }} />
    </div>
  );
}

function AgentBenchmarkRow({ agentName, score, sota, delta, color }: { agentName: string; score: number; sota: number; delta: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ width: 70, fontSize: '0.78rem', fontWeight: 600, color: color, flexShrink: 0 }}>
        {agentName}
      </div>
      <ScoreBar value={score} sota={sota} color={color} />
      <div style={{ width: 38, textAlign: 'right', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--helios-text)', flexShrink: 0 }}>
        {Math.round(score * 100)}
      </div>
      <div style={{ width: 70, flexShrink: 0 }}>
        <ScoreDelta delta={delta} />
      </div>
    </div>
  );
}

function TimeSeriesChart({ series }: { series: BenchmarkTimeSeries[] }) {
  if (series.length === 0) return null;
  const allDates = [...new Set(series.flatMap(s => s.history.map(h => h.date)))].sort();

  const chartData = allDates.map(date => {
    const row: Record<string, number | string> = { date: date.slice(5) };
    for (const ts of series) {
      const point = ts.history.find(h => h.date === date);
      if (point) {
        row[ts.agentName] = Math.round(point.score * 100);
      }
    }
    if (series[0]) {
      const point = series[0].history.find(h => h.date === date);
      if (point) row['SOTA'] = Math.round(point.sotaScore * 100);
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#0c1320', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, fontSize: 11 }}
          labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}
          itemStyle={{ color: 'rgba(255,255,255,0.8)' }}
        />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        {series.map(ts => (
          <Line key={ts.agentName} type="monotone" dataKey={ts.agentName} stroke={AGENT_COLORS[ts.agentName] ?? '#888'} strokeWidth={2} dot={false} />
        ))}
        <Line type="monotone" dataKey="SOTA" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="SOTA" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function BenchmarkScoreboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['benchmarks'],
    queryFn: () => heliosApi.getBenchmarkScores(),
    staleTime: 60_000,
  });

  const benchmarks = BENCHMARK_LABELS;
  const scores = data?.scores ?? [];
  const timeSeries = data?.timeSeries ?? [];

  const benchmarkKeys = Object.keys(benchmarks);

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <BarChart3 size={20} color="var(--helios-amber)" />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--helios-text)', letterSpacing: '-0.01em' }}>
            Benchmark Scoreboard
          </h1>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--helios-text-muted)', lineHeight: 1.5 }}>
          Portfolio agent scores vs. current public state-of-the-art across SWE-bench Lite, AgentBench, GAIA, and ManipArena (stub). SOTA line shown as dashed.
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="section-card" style={{ padding: 16, opacity: 0.5, height: 200 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {benchmarkKeys.map((bk) => {
            const bMeta = benchmarks[bk];
            const bScores = scores.filter(s => s.benchmark === bk).sort((a, b) => b.score - a.score);
            const bSeries = timeSeries.filter(ts => ts.benchmark === bk);
            const sota = bScores[0]?.sotaScore ?? 0;

            return (
              <div key={bk} className="section-card" style={{ padding: '18px 20px' }}>
                {/* Benchmark header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--helios-text)', marginBottom: 2 }}>
                      {bMeta.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--helios-text-muted)' }}>
                      {bMeta.description}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--helios-text-muted)', marginBottom: 2 }}>
                      SOTA
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.4)' }}>
                      {Math.round(sota * 100)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  {/* Agent scores */}
                  <div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--helios-text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      Agent Scores
                      <span style={{ fontSize: '0.58rem', color: 'var(--helios-text-muted)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>score · delta vs last week</span>
                    </div>
                    {bScores.length === 0 ? (
                      <div style={{ fontSize: '0.78rem', color: 'var(--helios-text-muted)', padding: '20px 0' }}>
                        {bk === 'maniparena' ? 'Stub adapter — awaiting dataset release.' : 'No scores recorded yet.'}
                      </div>
                    ) : (
                      bScores.map((s) => (
                        <AgentBenchmarkRow
                          key={s.agentId}
                          agentName={s.agentName}
                          score={s.score}
                          sota={s.sotaScore}
                          delta={s.delta}
                          color={AGENT_COLORS[s.agentName] ?? '#888'}
                        />
                      ))
                    )}
                  </div>

                  {/* Time-series chart */}
                  <div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--helios-text-muted)', marginBottom: 8 }}>
                      Trend (8 weeks)
                    </div>
                    {bSeries.length === 0 ? (
                      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--helios-text-muted)', fontSize: '0.78rem' }}>
                        Trend data not yet available
                      </div>
                    ) : (
                      <TimeSeriesChart series={bSeries} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
