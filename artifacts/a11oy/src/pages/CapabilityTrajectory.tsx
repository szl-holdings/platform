import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CAPABILITY_TRAJECTORY, AGENT_LABEL, DOCTRINE_AGENT_IDS } from '../data/mythosDoctrine';

const GOLD = '#c9b787';
const COLORS: Record<string, string> = {
  'op-cascade':  '#c9b787',
  'op-counsel':  '#8a8a8a',
  'op-pipeline': '#e2c896',
  'op-guardian': '#f5f5f5',
  'op-terra':    '#b08d52',
  'op-watchdog': '#5e5e5e',
};

export function CapabilityTrajectory() {
  // Build a merged series indexed by release
  const releases = CAPABILITY_TRAJECTORY['op-cascade'].map(p => p.release);
  const capabilitySeries = releases.map(r => {
    const row: Record<string, number | string> = { release: r };
    DOCTRINE_AGENT_IDS.forEach(id => {
      const pt = CAPABILITY_TRAJECTORY[id].find(p => p.release === r);
      if (pt) row[id] = pt.capability;
    });
    return row;
  });
  const alignmentSeries = releases.map(r => {
    const row: Record<string, number | string> = { release: r };
    DOCTRINE_AGENT_IDS.forEach(id => {
      const pt = CAPABILITY_TRAJECTORY[id].find(p => p.release === r);
      if (pt) row[id] = pt.alignment;
    });
    return row;
  });
  const oversightSeries = releases.map(r => {
    const row: Record<string, number | string> = { release: r };
    DOCTRINE_AGENT_IDS.forEach(id => {
      const pt = CAPABILITY_TRAJECTORY[id].find(p => p.release === r);
      if (pt) row[id] = pt.oversight;
    });
    return row;
  });

  const latest = (key: 'capability' | 'alignment' | 'oversight') => {
    const vals = DOCTRINE_AGENT_IDS.map(id => CAPABILITY_TRAJECTORY[id].slice(-1)[0][key]);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  const renderChart = (data: Record<string, number | string>[], title: string, hint: string) => (
    <Card>
      <SectionTitle>{title}</SectionTitle>
      <p className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{hint}</p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="release" tick={{ fill: '#5e5e5e', fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#5e5e5e', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 10, color: '#8a8a8a' }} />
          {DOCTRINE_AGENT_IDS.map(id => (
            <Line key={id} type="monotone" dataKey={id} stroke={COLORS[id]} strokeWidth={1.8} dot={false} name={AGENT_LABEL[id]} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );

  return (
    <Layout>
      <PageHeader
        label="DOCTRINE · CAPABILITY TRAJECTORY"
        title="Capability Trajectory"
        subtitle="Per-agent capability, alignment, and oversight over time. The frontier-lab graph, redrawn for enterprise agents."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="AGENTS" value={DOCTRINE_AGENT_IDS.length} sub="tracked" accent={GOLD} />
        <KpiCard label="AVG CAPABILITY" value={latest('capability')} sub="latest release" accent={GOLD} />
        <KpiCard label="AVG ALIGNMENT" value={latest('alignment')} sub="latest release" accent={GOLD} />
        <KpiCard label="AVG OVERSIGHT" value={latest('oversight')} sub="latest release" accent={GOLD} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {renderChart(capabilitySeries, 'Capability', 'What the agent can do.')}
        {renderChart(alignmentSeries, 'Alignment', 'How well it stays inside the constitution at that capability.')}
        {renderChart(oversightSeries, 'Oversight', 'How well the operator can inspect and intervene at that capability.')}
      </div>

      <Card>
        <SectionTitle>Why we publish this</SectionTitle>
        <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>
          The frontier-lab graph (capability vs alignment vs oversight) is the single most important picture you can draw of an
          AI system over time. Most enterprise AI vendors only show the capability curve. The Doctrine Layer requires all three
          curves on every agent — and the curves are tied to specific constitution versions, snapshot fingerprints, and ARG
          decisions in this same workspace. Hover any release to see the underlying numbers.
        </p>
      </Card>
    </Layout>
  );
}
