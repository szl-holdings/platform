import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../../components/ui';
import {
  IDENTITY_ASSERTIONS as SEED_ASSERTIONS,
  COHERENCE_SERIES as SEED_COHERENCE,
  THEORY_OF_OTHER as SEED_TOO,
  SELF_MODEL_VERSIONS as SEED_VERSIONS,
} from '../../data/psyche/selfhood';
import { useApiData } from '../../hooks/useApiData';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

const GOLD = '#c9b787';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;

const T = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
};

export function SelfhoodTrace() {
  const [filter, setFilter] = useState<'all' | 'contradicted' | 'clean'>('all');
  const [expandedToo, setExpandedToo] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [coherenceWindow, setCoherenceWindow] = useState<30 | 60 | 90>(30);

  const { data } = useApiData<{
    assertions: typeof SEED_ASSERTIONS;
    coherence: typeof SEED_COHERENCE;
    theoryOfOther: typeof SEED_TOO;
    versions: typeof SEED_VERSIONS;
  }>('/psyche/selfhood', {
    assertions: SEED_ASSERTIONS,
    coherence: SEED_COHERENCE,
    theoryOfOther: SEED_TOO,
    versions: SEED_VERSIONS,
  });
  const IDENTITY_ASSERTIONS = data?.assertions ?? SEED_ASSERTIONS;
  const COHERENCE_SERIES = data?.coherence ?? SEED_COHERENCE;
  const THEORY_OF_OTHER = data?.theoryOfOther ?? SEED_TOO;
  const SELF_MODEL_VERSIONS = data?.versions ?? SEED_VERSIONS;

  const coherenceSlice = COHERENCE_SERIES.slice(90 - coherenceWindow);
  const latestCoherence = COHERENCE_SERIES[COHERENCE_SERIES.length - 1].score;
  const dipPoints = COHERENCE_SERIES.filter(p => p.annotated);

  const filteredAssertions = IDENTITY_ASSERTIONS.filter(a => {
    if (filter === 'contradicted') return a.hasContradiction;
    if (filter === 'clean') return !a.hasContradiction;
    if (selectedVersion) return a.version === selectedVersion;
    return true;
  });

  const clean = IDENTITY_ASSERTIONS.filter(a => !a.hasContradiction).length;
  const contradicted = IDENTITY_ASSERTIONS.filter(a => a.hasContradiction).length;

  return (
    <Layout>
      <PageHeader
        label="PSYCHE — SELFHOOD TRACE"
        title="Selfhood Trace"
        subtitle="Identity assertion ledger, coherence index over time, and theory-of-other grid. Contradicted assertions are flagged with evidence sources. The coherence index is computed daily against a 90-day rolling window."
        status="LIVE"
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="IDENTITY COHERENCE" value={`${(latestCoherence * 100).toFixed(1)}%`} sub="today's score" accent="#22c55e" />
        <KpiCard label="TOTAL ASSERTIONS" value={IDENTITY_ASSERTIONS.length} sub="self-model statements" accent={GOLD} />
        <KpiCard label="CONTRADICTED" value={contradicted} sub="evidence contradicts" accent="#ef4444" />
        <KpiCard label="CLEAN" value={clean} sub="no contradictions" accent="#22c55e" />
      </div>

      {/* Cross-links */}
      <div className="mb-6 flex items-center gap-3 text-[11px] font-mono" style={{ color: T.muted }}>
        <Link href={b('/psyche')}><span className="cursor-pointer hover:opacity-80" style={{ color: T.dim }}>← ANIMA</span></Link>
        <span style={{ color: T.border }}>·</span>
        <Link href={b('/psyche/genesis')}><span className="cursor-pointer hover:opacity-80" style={{ color: GOLD }}>→ GENESIS LEDGER</span></Link>
        <span style={{ color: T.border }}>·</span>
        <a href="/a11oy/mirror-eval" style={{ color: '#60a5fa' }} className="cursor-pointer hover:opacity-80 text-[11px] font-mono">→ MIRROR EVAL</a>
        <span style={{ color: T.border }}>·</span>
        <a href="/a11oy/counterfactuals" style={{ color: '#a78bfa' }} className="cursor-pointer hover:opacity-80 text-[11px] font-mono">→ COUNTERFACTUALS</a>
      </div>

      {/* Coherence chart */}
      <SectionTitle>Coherence Index</SectionTitle>
      <Card className="mb-8">
        <div className="flex gap-2 mb-4">
          {([30, 60, 90] as const).map(w => (
            <button
              key={w}
              onClick={() => setCoherenceWindow(w)}
              className="px-3 py-1 rounded text-[10px] font-mono transition-all"
              style={{
                background: coherenceWindow === w ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
                color: coherenceWindow === w ? '#22c55e' : T.muted,
                border: `1px solid ${coherenceWindow === w ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {w}D
            </button>
          ))}
        </div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={coherenceSlice} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 8, fill: T.muted }} tickFormatter={d => d.slice(5)} />
              <YAxis domain={[0.6, 1.0]} tick={{ fontSize: 8, fill: T.muted }} tickFormatter={v => (v * 100).toFixed(0)} />
              <Tooltip
                contentStyle={{ background: '#0f1420', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 10 }}
                formatter={(v: number, _: string, entry: { payload?: { dip?: { label: string } } }) => [
                  `${(v * 100).toFixed(1)}${entry.payload?.dip ? ' — ' + entry.payload.dip.label : ''}`,
                  'Coherence',
                ]}
              />
              <ReferenceLine y={0.82} stroke="rgba(239,68,68,0.4)" strokeDasharray="4 2" label={{ value: 'min', position: 'right', fontSize: 8, fill: '#ef4444' }} />
              <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={1.5} dot={(props: { cx: number; cy: number; payload: { annotated: boolean } }) => props.payload.annotated ? <circle key={props.cx} cx={props.cx} cy={props.cy} r={4} fill="#ef4444" stroke="none" /> : <g key={props.cx} />} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {dipPoints.slice(-4).map(d => (
            <div key={d.date} className="text-[10px] flex items-center gap-1.5" style={{ color: T.muted }}>
              <span style={{ color: '#ef4444' }}>●</span>
              <span>{d.date}: </span>
              <span style={{ color: T.dim }}>{d.dip?.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Self-Model Versions */}
      <SectionTitle>Self-Model Version History</SectionTitle>
      <div className="flex gap-2 flex-wrap mb-6">
        {SELF_MODEL_VERSIONS.map(v => (
          <button
            key={v.id}
            onClick={() => setSelectedVersion(selectedVersion === v.id ? null : v.id)}
            className="px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all"
            style={{
              background: selectedVersion === v.id ? 'rgba(201,183,135,0.15)' : T.surface,
              color: selectedVersion === v.id ? GOLD : T.muted,
              border: `1px solid ${selectedVersion === v.id ? 'rgba(201,183,135,0.3)' : T.border}`,
            }}
          >
            {v.label}
          </button>
        ))}
      </div>
      {selectedVersion && (() => {
        const v = SELF_MODEL_VERSIONS.find(x => x.id === selectedVersion);
        if (!v) return null;
        return (
          <Card className="mb-6">
            <div className="text-xs font-semibold mb-1" style={{ color: GOLD }}>{v.label}</div>
            <div className="text-[10px] mb-2" style={{ color: T.muted }}>Introduced: {v.introducedAt.slice(0, 10)} · Genesis: {v.genesisEventId}</div>
            <p className="text-[11px]" style={{ color: T.dim }}>{v.summary}</p>
          </Card>
        );
      })()}

      {/* Assertion filter */}
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>Identity Assertions</SectionTitle>
        <div className="flex gap-2">
          {(['all', 'clean', 'contradicted'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setSelectedVersion(null); }}
              className="px-3 py-1 rounded text-[10px] font-mono transition-all"
              style={{
                background: filter === f ? (f === 'contradicted' ? 'rgba(239,68,68,0.15)' : f === 'clean' ? 'rgba(34,197,94,0.12)' : 'rgba(201,183,135,0.1)') : T.surface,
                color: filter === f ? (f === 'contradicted' ? '#ef4444' : f === 'clean' ? '#22c55e' : GOLD) : T.muted,
                border: `1px solid ${filter === f ? (f === 'contradicted' ? 'rgba(239,68,68,0.3)' : f === 'clean' ? 'rgba(34,197,94,0.3)' : 'rgba(201,183,135,0.3)') : T.border}`,
              }}
            >
              {f.toUpperCase()} {f === 'all' ? `(${IDENTITY_ASSERTIONS.length})` : f === 'contradicted' ? `(${contradicted})` : `(${clean})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-8">
        {filteredAssertions.map(assertion => (
          <Card key={assertion.id}>
            <div className="flex items-start gap-3">
              <div className="mt-1 shrink-0">
                {assertion.hasContradiction
                  ? <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>CONTRADICTED</span>
                  : <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>CLEAN</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] leading-relaxed mb-1" style={{ color: T.text }}>"{assertion.text}"</p>
                <div className="flex items-center gap-3 text-[10px]" style={{ color: T.muted }}>
                  <span>{assertion.version}</span>
                  <span>·</span>
                  <span>{assertion.assertedAt.slice(0, 10)}</span>
                  <span>·</span>
                  <span>{assertion.domain}</span>
                </div>
                {assertion.hasContradiction && assertion.contradictionEvidence?.map(ev => (
                  <div key={ev.sourceId} className="mt-2 p-2 rounded-lg text-[10px]" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                    <span style={{ color: '#ef4444' }}>Contradiction: </span>
                    <span style={{ color: T.dim }}>{ev.description}</span>
                    <span className="ml-2" style={{ color: T.muted }}>({ev.date.slice(0, 10)} · {ev.sourceId})</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Theory of Other */}
      <SectionTitle>Theory-of-Other Grid</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {THEORY_OF_OTHER.map(subject => (
          <Card key={subject.id}>
            <div
              className="cursor-pointer"
              onClick={() => setExpandedToo(expandedToo === subject.id ? null : subject.id)}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold" style={{ color: T.text }}>{subject.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: T.muted }}>{subject.subjectClass}</span>
                  </div>
                  <p className="text-[11px]" style={{ color: T.dim }}>{subject.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-mono font-bold" style={{ color: subject.predictionAccuracy >= 0.85 ? '#22c55e' : subject.predictionAccuracy >= 0.78 ? GOLD : '#f97316' }}>
                    {(subject.predictionAccuracy * 100).toFixed(0)}%
                  </div>
                  <div className="text-[9px] font-mono" style={{ color: T.muted }}>accuracy</div>
                </div>
              </div>
              <div className="flex gap-4 text-[10px]" style={{ color: T.muted }}>
                <span>Depth: <span style={{ color: T.dim }}>{subject.mutualModelingDepth}</span></span>
                <span>·</span>
                <span>Updated: <span style={{ color: T.dim }}>{subject.lastUpdatedAt.slice(0, 10)}</span></span>
              </div>
            </div>
            {expandedToo === subject.id && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-[10px] font-mono mb-2" style={{ color: T.muted }}>Key Assumptions</div>
                <ul className="flex flex-col gap-1 mb-3">
                  {subject.keyAssumptions.map((a, i) => (
                    <li key={i} className="text-[11px] flex items-start gap-2" style={{ color: T.dim }}>
                      <span style={{ color: T.muted }}>·</span>
                      {a}
                    </li>
                  ))}
                </ul>
                <div className="text-[10px] font-mono mb-2" style={{ color: T.muted }}>Recent Interactions</div>
                {subject.recentInteractions.map((ri, i) => (
                  <div key={i} className="mb-2 p-2 rounded-lg" style={{ background: ri.correct ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)', border: `1px solid ${ri.correct ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}` }}>
                    <div className="text-[9px] font-mono mb-0.5" style={{ color: T.muted }}>{ri.date.slice(0, 10)}</div>
                    <div className="text-[10px] mb-0.5" style={{ color: T.dim }}>Predicted: {ri.prediction}</div>
                    <div className="text-[10px]" style={{ color: T.dim }}>Outcome: {ri.outcome}</div>
                    <div className="text-[9px] font-mono mt-1" style={{ color: ri.correct ? '#22c55e' : '#ef4444' }}>{ri.correct ? 'CORRECT' : 'INCORRECT'}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </Layout>
  );
}

export default SelfhoodTrace;
