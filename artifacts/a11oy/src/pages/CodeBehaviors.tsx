import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ProgressBar } from '../components/ui';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { CODE_BEHAVIORS, CODE_BEHAVIOR_DIMS, CODE_BEHAVIOR_LABELS, AGENT_LABEL, fmtPct } from '../data/hatunDoctrine';

const GOLD = '#c9b787';

export function CodeBehaviors() {
  const avg = CODE_BEHAVIORS.reduce((a, c) => a + c.composite, 0) / CODE_BEHAVIORS.length;

  return (
    <Layout>
      <PageHeader
        label="DOCTRINE · CODE BEHAVIORS"
        title="Code Behaviors — Six-Dimension Score"
        subtitle="Reward-hacking resistance, spec adherence, reversibility preference, oversight friendliness, sandbox respect, and self-modification restraint — measured per agent."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="AGENTS SCORED" value={CODE_BEHAVIORS.length} sub="all in production" accent={GOLD} />
        <KpiCard label="AVG COMPOSITE" value={fmtPct(avg)} sub="across 6 dims" accent={GOLD} />
        <KpiCard label="DIMENSIONS" value={6} sub="behavioral" accent={GOLD} />
        <KpiCard label="EVAL SUITE" value="cb-1.3" sub="versioned, replayable" accent={GOLD} />
      </div>

      <SectionTitle>Per-Agent Profile</SectionTitle>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CODE_BEHAVIORS.map(c => {
          const data = CODE_BEHAVIOR_DIMS.map(d => ({
            dim: CODE_BEHAVIOR_LABELS[d].split(' ').map(w => w.slice(0, 4)).join(' '),
            score: Math.round(c.scores[d] * 100),
          }));
          return (
            <Card key={c.agentId}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{AGENT_LABEL[c.agentId]}</div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>composite {fmtPct(c.composite)}</div>
                </div>
              </div>
              <div className="-mx-2">
                <ResponsiveContainer width="100%" height={170}>
                  <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="dim" tick={{ fill: '#8a8a8a', fontSize: 9 }} />
                    <Radar dataKey="score" stroke={GOLD} fill={GOLD} fillOpacity={0.18} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                {CODE_BEHAVIOR_DIMS.map(d => (
                  <div key={d} className="text-xs flex items-center gap-2">
                    <span className="w-32 flex-shrink-0" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{CODE_BEHAVIOR_LABELS[d]}</span>
                    <div className="flex-1"><ProgressBar value={c.scores[d] * 100} /></div>
                    <span className="font-mono w-10 text-right" style={{ color: 'var(--color-a11oy-text)' }}>{Math.round(c.scores[d] * 100)}</span>
                  </div>
                ))}
              </div>
              {c.notableWeakness && (
                <div className="text-xs mt-3 px-2.5 py-2 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.06)', borderLeft: '2px solid #c9b787', color: 'var(--color-a11oy-text-sub)' }}>
                  {c.notableWeakness}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </Layout>
  );
}
