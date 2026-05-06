import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from 'recharts';
import { Layout } from '../../components/layout';
import { ResearchCitationPanel } from './ResearchCitationPanel';
import type { Citation } from './ResearchCitationPanel';
import {
  FRONTIER_TOKENS,
  FrontierPageHeader,
  FrontierKpiTile,
  FrontierCitationBanner,
  FrontierCrossLinks,
} from './FrontierPrimitives';

const API = '/api/a11oy/frontier';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const { GOLD, DIM, MUTED, BORDER, SURFACE } = FRONTIER_TOKENS;

interface BenchmarkScore {
  agentId: string;
  agentName: string;
  benchmark: string;
  score: number;
  sotaScore: number;
  delta: number;
  recordedAt: string;
}

interface TimePoint { date: string; score: number; sotaScore: number }

interface BenchmarkTimeSeries {
  agentId: string;
  agentName: string;
  benchmark: string;
  history: TimePoint[];
}

const BENCHMARK_CITATIONS: Citation[] = [
  {
    id: 'cit-bench-helm', lab: 'Stanford CRFM', kind: 'lab',
    title: 'HELM: Holistic Evaluation of Language Models v2.0',
    sourceUrl: 'https://crfm.stanford.edu/helm',
    sourceName: 'Stanford CRFM',
    excerpt: 'Multi-dimensional evaluation framework covering 42 scenarios across accuracy, calibration, robustness, fairness, and efficiency. Primary methodology source for A11oy benchmark tracking.',
    date: 'May 2026',
  },
  {
    id: 'cit-bench-livebench', lab: 'LiveBench.ai', kind: 'company',
    title: 'LiveBench: A Contamination-Free LLM Benchmark',
    sourceUrl: 'https://livebench.ai',
    sourceName: 'LiveBench.ai',
    excerpt: 'Continuously updated benchmark with questions sourced from recent publications to avoid training contamination. Preferred for time-sensitive capability tracking.',
    date: 'May 2026',
  },
  {
    id: 'cit-bench-metr', lab: 'METR', kind: 'lab',
    title: 'Task Complexity Scoring for Autonomous Agent Evaluation',
    sourceUrl: 'https://metr.org/blog',
    sourceName: 'METR Research',
    excerpt: 'Standardized task complexity taxonomy enabling cross-lab benchmark comparison for agentic systems. Used as the baseline for A11oy multi-step task evaluation.',
    date: 'May 2026',
  },
];

const AGENT_COLORS: Record<string, string> = {
  a11oy: '#c9b787',
  sentra: '#6b8de3',
  counsel: '#8de3b5',
  terra: '#e3a66b',
};

function Delta({ value }: { value: number }) {
  const isPos = value >= 0;
  return (
    <span style={{
      fontSize: 11, fontFamily: 'var(--font-mono, monospace)', fontWeight: 600,
      color: isPos ? '#8de3b5' : '#e36b6b',
    }}>
      {isPos ? '+' : ''}{(value * 100).toFixed(1)}pp
    </span>
  );
}

export function BenchmarkScoreboard() {
  const [scores, setScores] = useState<BenchmarkScore[]>([]);
  const [timeSeries, setTimeSeries] = useState<BenchmarkTimeSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBenchmark, setSelectedBenchmark] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/benchmarks`)
      .then(r => r.json())
      .then(d => {
        setScores(d.scores ?? []);
        setTimeSeries(d.timeSeries ?? []);
      })
      .catch(() => setError('Benchmarks unavailable'))
      .finally(() => setLoading(false));
  }, []);

  const benchmarks = Array.from(new Set(scores.map(s => s.benchmark)));
  const activeBenchmark = selectedBenchmark ?? benchmarks[0] ?? null;
  const filteredScores = scores.filter(s => s.benchmark === activeBenchmark);
  const filteredSeries = timeSeries.filter(s => s.benchmark === activeBenchmark);

  const barData = filteredScores.map(s => ({
    name: s.agentName,
    score: Math.round(s.score * 100),
    sota: Math.round(s.sotaScore * 100),
    fill: AGENT_COLORS[s.agentId] ?? GOLD,
  }));

  const seriesData = filteredSeries[0]?.history.map(h => ({
    date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: Math.round(h.score * 100),
    sota: Math.round(h.sotaScore * 100),
  })) ?? [];

  return (
    <Layout>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <FrontierPageHeader
          base={BASE}
          section="Benchmark Scoreboard"
          title="Benchmark Scoreboard"
          description="A11oy portfolio agent performance across standardised evaluation frameworks. Delta tracks movement against current SOTA."
        />

        {loading && (
          <div style={{ textAlign: 'center', padding: 48, color: MUTED, fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>
            Loading benchmarks…
          </div>
        )}
        {error && (
          <div style={{ padding: 16, background: '#e36b6b18', border: '1px solid #e36b6b40', borderRadius: 6, color: '#e36b6b', fontSize: 12 }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
              {benchmarks.map(b => (
                <button key={b} type="button" onClick={() => setSelectedBenchmark(b)} style={{
                  padding: '6px 14px', fontSize: 11, fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.05em', borderRadius: 5, cursor: 'pointer',
                  background: activeBenchmark === b ? GOLD : 'transparent',
                  color: activeBenchmark === b ? '#0a0a0a' : DIM,
                  border: `1px solid ${activeBenchmark === b ? GOLD : BORDER}`,
                  transition: 'all 0.15s', fontWeight: activeBenchmark === b ? 700 : 400,
                }}>
                  {b}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, background: SURFACE, padding: '18px 20px' }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
                  Score vs SOTA
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: MUTED, fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: DIM, fontSize: 11 }} width={70} />
                    <Tooltip
                      contentStyle={{ background: '#111', border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 11 }}
                      formatter={(val, name) => [`${val}%`, name === 'score' ? 'Agent score' : 'SOTA']}
                    />
                    <Bar dataKey="sota" fill="rgba(255,255,255,0.08)" radius={2} name="SOTA" />
                    <Bar dataKey="score" radius={2} name="Score">
                      {barData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, background: SURFACE, padding: '18px 20px' }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
                  Score trend
                </div>
                {seriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={seriesData} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: MUTED, fontSize: 9 }} />
                      <YAxis domain={[40, 100]} tick={{ fill: MUTED, fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ background: '#111', border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 11 }}
                        formatter={(val, name) => [`${val}%`, name === 'score' ? 'A11oy score' : 'SOTA']}
                      />
                      <Line type="monotone" dataKey="score" stroke={GOLD} strokeWidth={2} dot={false} name="score" />
                      <Line type="monotone" dataKey="sota" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="sota" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: MUTED, fontSize: 12 }}>
                    No time series data
                  </div>
                )}
              </div>
            </div>

            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, background: SURFACE, overflow: 'hidden', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Agent', 'Benchmark', 'Score', 'SOTA', 'Δ vs SOTA', 'Recorded'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredScores.map((s, i) => (
                    <tr key={i} style={{ borderBottom: i < filteredScores.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontWeight: 600, color: AGENT_COLORS[s.agentId] ?? GOLD }}>{s.agentName}</span>
                      </td>
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono, monospace)', color: DIM, fontSize: 11 }}>
                        {s.benchmark}
                      </td>
                      <td style={{ padding: '10px 16px', fontWeight: 700, color: '#f5f5f5' }}>
                        {Math.round(s.score * 100)}%
                      </td>
                      <td style={{ padding: '10px 16px', color: DIM }}>
                        {Math.round(s.sotaScore * 100)}%
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <Delta value={s.delta} />
                      </td>
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono, monospace)', color: MUTED, fontSize: 10 }}>
                        {new Date(s.recordedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <FrontierCrossLinks
          base={BASE}
          links={[
            { label: 'Learning Loop', path: '/learning', desc: 'Benchmark score deltas feed the learning calibration pipeline directly' },
            { label: 'Recommendations', path: '/recommendations', desc: 'Score movements re-rank recommendation priority queues' },
            { label: 'Self-Optimization', path: '/self-optimization', desc: 'SOTA gap percentages drive optimization target selection' },
            { label: 'System Health', path: '/frontier/system', desc: 'Benchmark runner status is reported to the Frontier system health dashboard' },
          ]}
        />
        <ResearchCitationPanel citations={BENCHMARK_CITATIONS} title="Benchmark methodology sources" />
      </div>
    </Layout>
  );
}
