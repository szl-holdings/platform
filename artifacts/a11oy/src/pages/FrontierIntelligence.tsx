import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';

const GOLD = '#c9b787';
const DIM = '#8a8a8a';
const DEEP = '#0a0a0a';

const DIMENSIONS = [
  'Agentic Execution',
  'Governance & Policy',
  'Business Observability',
  'Proof Chains',
  'Enterprise Readiness',
  'Multi-Domain Support',
  'Human-in-the-Loop',
  'Outcome Verification',
];

const COMPETITORS = [
  {
    id: 'a11oy',
    name: 'A11oy',
    color: '#c9b787',
    tagline: 'Governed intelligence layer',
    scores: [95, 98, 92, 97, 88, 95, 99, 96],
  },
  {
    id: 'openai',
    name: 'OpenAI / GPT',
    color: '#4a9eff',
    tagline: 'Foundation model platform',
    scores: [80, 28, 45, 15, 72, 65, 35, 20],
  },
  {
    id: 'anthropic',
    name: 'Anthropic / Claude',
    color: '#b07d4a',
    tagline: 'Safety-focused model provider',
    scores: [75, 40, 38, 20, 68, 58, 42, 25],
  },
  {
    id: 'microsoft',
    name: 'Microsoft / Copilot',
    color: '#5b8dd9',
    tagline: 'Enterprise productivity AI',
    scores: [60, 55, 70, 10, 85, 72, 50, 18],
  },
  {
    id: 'palantir',
    name: 'Palantir',
    color: '#7a7a7a',
    tagline: 'Data integration & analytics',
    scores: [55, 72, 82, 38, 90, 78, 60, 42],
  },
  {
    id: 'datadog',
    name: 'Datadog / New Relic',
    color: '#8b5cf6',
    tagline: 'Observability & monitoring',
    scores: [20, 30, 88, 12, 82, 55, 25, 15],
  },
];

const CAPABILITY_GAPS = [
  {
    dimension: 'Proof Chains',
    a11oy: 97,
    nearest: 38,
    nearestName: 'Palantir',
    description: 'Cryptographic audit trail linking every recommendation, approval, and execution in an immutable chain. No competitor offers this natively.',
  },
  {
    dimension: 'Human-in-the-Loop',
    a11oy: 99,
    nearest: 60,
    nearestName: 'Palantir',
    description: 'Constitutional mandate: no material action executes without human approval. This is structural, not configurable.',
  },
  {
    dimension: 'Governance & Policy',
    a11oy: 98,
    nearest: 72,
    nearestName: 'Palantir',
    description: 'Policy gates enforced by a non-bypassable Covenant Layer at every execution boundary. Competitors rely on prompt-level guardrails.',
  },
  {
    dimension: 'Outcome Verification',
    a11oy: 96,
    nearest: 42,
    nearestName: 'Palantir',
    description: 'Automated Verifier Agent confirms every executed action produced the intended outcome with cryptographic evidence.',
  },
];

const POSITIONING_MATRIX = [
  { name: 'A11oy', x: 92, y: 96, size: 14, color: '#c9b787', label: 'Governed\nIntelligence Layer' },
  { name: 'OpenAI', x: 78, y: 22, size: 10, color: '#4a9eff', label: 'Foundation\nModels' },
  { name: 'Anthropic', x: 72, y: 32, size: 9, color: '#b07d4a', label: 'Safety-first\nModels' },
  { name: 'Microsoft', x: 58, y: 50, size: 11, color: '#5b8dd9', label: 'Productivity\nCopilot' },
  { name: 'Palantir', x: 52, y: 70, size: 10, color: '#7a7a7a', label: 'Data\nIntegration' },
  { name: 'Datadog', x: 18, y: 35, size: 9, color: '#8b5cf6', label: 'Observability\nOnly' },
];

function RadarViz({ competitors }: { competitors: typeof COMPETITORS }) {
  const data = DIMENSIONS.map((d, i) => {
    const entry: Record<string, string | number> = { dimension: d };
    competitors.forEach(c => { entry[c.id] = c.scores[i]; });
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: '#8a8a8a', fontSize: 10, fontFamily: 'ui-monospace, monospace' }}
        />
        {competitors.map(c => (
          <Radar
            key={c.id}
            name={c.name}
            dataKey={c.id}
            stroke={c.color}
            fill={c.color}
            fillOpacity={c.id === 'a11oy' ? 0.18 : 0.04}
            strokeWidth={c.id === 'a11oy' ? 2 : 1}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}

function PositioningMatrix() {
  return (
    <div className="relative w-full" style={{ height: 320, backgroundColor: 'var(--color-a11oy-deep)', borderRadius: 8, border: '1px solid var(--color-a11oy-border)' }}>
      <div className="absolute inset-0 p-4">
        <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>← Less Governed</div>
        <div className="absolute right-4 top-4 text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>More Governed →</div>
        <div className="absolute bottom-4 left-4 text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Model-layer only</div>
        <div className="absolute bottom-4 right-4 text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Enterprise-grade</div>
        <div className="absolute top-1/2 left-4 text-xs font-mono -rotate-90 origin-left" style={{ color: 'var(--color-a11oy-text-ghost)', transform: 'rotate(-90deg) translateX(-50%)' }}>Agentic</div>
        {POSITIONING_MATRIX.map(p => (
          <div
            key={p.name}
            className="absolute flex flex-col items-center"
            style={{
              left: `${p.x}%`,
              bottom: `${p.y}%`,
              transform: 'translate(-50%, 50%)',
            }}
          >
            <div
              className="rounded-full flex items-center justify-center font-mono font-bold"
              style={{
                width: p.size * 3,
                height: p.size * 3,
                backgroundColor: `${p.color}22`,
                border: `2px solid ${p.color}`,
                color: p.color,
                fontSize: 9,
                boxShadow: p.name === 'A11oy' ? `0 0 20px ${p.color}44` : undefined,
              }}
            >
              {p.name === 'A11oy' ? '⬡' : '●'}
            </div>
            <div className="text-center mt-1" style={{ fontSize: 9, color: p.color, whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace' }}>
              {p.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GapBar({ a11oy, nearest, nearestName, color }: { a11oy: number; nearest: number; nearestName: string; color: string }) {
  const data = [
    { name: 'A11oy', value: a11oy, fill: '#c9b787' },
    { name: nearestName, value: nearest, fill: color },
  ];
  return (
    <ResponsiveContainer width="100%" height={60}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis type="category" dataKey="name" tick={{ fill: '#8a8a8a', fontSize: 10 }} width={60} />
        <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={10}>
          {data.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={i === 0 ? 1 : 0.5} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FrontierIntelligence() {
  const [activeCompetitors, setActiveCompetitors] = useState<string[]>(['a11oy', 'openai', 'anthropic', 'palantir']);

  const toggleComp = (id: string) => {
    if (id === 'a11oy') return;
    setActiveCompetitors(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const visibleCompetitors = COMPETITORS.filter(c => activeCompetitors.includes(c.id));

  return (
    <Layout>
      <PageHeader
        label="FRONTIER INTELLIGENCE"
        title="Competitive Positioning Matrix"
        subtitle="A11oy is not trying to replace the enterprise. A11oy is the governed intelligence layer that lets the enterprise observe, decide, approve, execute, verify, and learn across every operational domain."
        status="DEMO"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="CAPABILITY LEAD" value="+58pts" sub="vs nearest on proof chains" accent={GOLD} />
        <KpiCard label="UNIQUE LANE" value="1 of 1" sub="governed agentic execution" accent={GOLD} />
        <KpiCard label="DIMENSIONS" value="8" sub="capability axes measured" accent={GOLD} />
        <KpiCard label="COMPETITORS" value="5" sub="mapped and assessed" accent={DIM} />
      </div>

      <div className="p-4 rounded-xl mb-8 border" style={{ backgroundColor: 'rgba(201,183,135,0.04)', borderColor: 'rgba(201,183,135,0.2)' }}>
        <div className="text-sm font-semibold mb-2" style={{ color: GOLD }}>The A11oy Doctrine</div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          "A11oy is the governed intelligence layer that lets the enterprise observe, decide, approve, execute, verify, and learn across every operational domain. No competitor occupies this lane."
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          {['Agentic execution', 'Proof-carrying governance', 'Business observability', 'Human-in-the-loop', 'Outcome verification'].map(t => (
            <span key={t} className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.08)', border: '1px solid rgba(201,183,135,0.15)', color: GOLD }}>{t}</span>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <SectionTitle>8-Dimension Capability Radar</SectionTitle>
          <Card>
            <div className="flex flex-wrap gap-2 mb-4">
              {COMPETITORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => toggleComp(c.id)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-mono transition-all"
                  style={{
                    backgroundColor: activeCompetitors.includes(c.id) ? `${c.color}18` : 'var(--color-a11oy-muted)',
                    color: activeCompetitors.includes(c.id) ? c.color : 'var(--color-a11oy-text-ghost)',
                    border: `1px solid ${activeCompetitors.includes(c.id) ? c.color + '40' : 'var(--color-a11oy-border)'}`,
                    cursor: c.id === 'a11oy' ? 'default' : 'pointer',
                    opacity: c.id === 'a11oy' ? 1 : undefined,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: c.color, flexShrink: 0, display: 'inline-block' }} />
                  {c.name}
                </button>
              ))}
            </div>
            <RadarViz competitors={visibleCompetitors} />
            <div className="mt-3 text-xs text-center" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              Scores are analyst assessments based on published capabilities and public documentation. Toggle competitors above.
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <SectionTitle>Competitor Profiles</SectionTitle>
          {COMPETITORS.filter(c => c.id !== 'a11oy').map(c => {
            const avg = Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length);
            return (
              <div
                key={c.id}
                className="rounded-lg border p-3 cursor-pointer transition-all"
                style={{
                  backgroundColor: activeCompetitors.includes(c.id) ? `${c.color}08` : 'var(--color-a11oy-card)',
                  borderColor: activeCompetitors.includes(c.id) ? `${c.color}30` : 'var(--color-a11oy-border)',
                }}
                onClick={() => toggleComp(c.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: c.color }}>{c.name}</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>avg {avg}</span>
                </div>
                <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{c.tagline}</div>
                <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
                  <div className="h-1 rounded-full" style={{ width: `${avg}%`, backgroundColor: c.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div>
          <SectionTitle>Strategic Positioning Map</SectionTitle>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <PositioningMatrix />
            <div className="p-3 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)', borderTop: '1px solid var(--color-a11oy-border)' }}>
              X-axis: Governance depth · Y-axis: Agentic execution capability. A11oy occupies the only position combining both.
            </div>
          </Card>
        </div>

        <div>
          <SectionTitle>Capability Gap Analysis</SectionTitle>
          <div className="flex flex-col gap-3">
            {CAPABILITY_GAPS.map((gap, i) => {
              const nearestComp = COMPETITORS.find(c => c.name === gap.nearestName);
              return (
                <Card key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold" style={{ color: GOLD }}>{gap.dimension}</span>
                    <span className="text-xs font-mono" style={{ color: GOLD }}>+{gap.a11oy - gap.nearest} pts lead</span>
                  </div>
                  <GapBar a11oy={gap.a11oy} nearest={gap.nearest} nearestName={gap.nearestName} color={nearestComp?.color ?? DIM} />
                  <p className="text-xs mt-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{gap.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <SectionTitle>Full Dimension Scores</SectionTitle>
      <div className="rounded-lg border overflow-hidden mb-8" style={{ borderColor: 'var(--color-a11oy-border)' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
              <th className="text-left px-4 py-3 font-mono" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: 10, letterSpacing: '0.08em' }}>DIMENSION</th>
              {COMPETITORS.map(c => (
                <th key={c.id} className="text-center px-3 py-3 font-mono" style={{ color: c.color, fontSize: 10 }}>{c.name.split(' /')[0]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DIMENSIONS.map((dim, di) => (
              <tr key={dim} style={{ backgroundColor: di % 2 === 0 ? 'var(--color-a11oy-card)' : 'var(--color-a11oy-deep)', borderBottom: '1px solid var(--color-a11oy-border)' }}>
                <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{dim}</td>
                {COMPETITORS.map(c => {
                  const score = c.scores[di];
                  const isA11oy = c.id === 'a11oy';
                  return (
                    <td key={c.id} className="px-3 py-2.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-mono font-semibold" style={{ color: isA11oy ? GOLD : score >= 70 ? 'var(--color-a11oy-text-sub)' : 'var(--color-a11oy-text-ghost)' }}>
                          {score}
                        </span>
                        <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
                          <div className="h-1 rounded-full" style={{ width: `${score}%`, backgroundColor: isA11oy ? GOLD : c.color, opacity: isA11oy ? 1 : 0.5 }} />
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr style={{ backgroundColor: 'rgba(201,183,135,0.06)', borderTop: '2px solid rgba(201,183,135,0.2)' }}>
              <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: GOLD }}>AVG SCORE</td>
              {COMPETITORS.map(c => {
                const avg = Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length);
                return (
                  <td key={c.id} className="px-3 py-3 text-center font-mono font-bold" style={{ color: c.id === 'a11oy' ? GOLD : 'var(--color-a11oy-text-ghost)' }}>
                    {avg}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="p-4 rounded-xl border" style={{ backgroundColor: 'rgba(201,183,135,0.03)', borderColor: 'rgba(201,183,135,0.15)' }}>
        <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>METHODOLOGY NOTE</div>
        <p className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          Scores represent capability assessments based on publicly available product documentation, published research, and market analysis. All competitor assessments are A11oy's internal view and are illustrative for demo purposes. Real competitive analysis would require verified product benchmarks.
        </p>
      </div>
    </Layout>
  );
}
