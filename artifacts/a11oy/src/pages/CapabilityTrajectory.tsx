import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AGENT_LABEL, DOCTRINE_AGENT_IDS } from '../data/mythosDoctrine';
import { useCapabilityTrajectory, DoctrineLoader, type DoctrineCapabilitySnapshot } from '../hooks/useDoctrine';

const GOLD = '#c9b787';
const SUB = 'var(--color-a11oy-text-sub)';
const GHOST = 'var(--color-a11oy-text-ghost)';

export function CapabilityTrajectory() {
  const [selectedAgent, setSelectedAgent] = useState(DOCTRINE_AGENT_IDS[0]);
  const { data: snapshots, loading, error } = useCapabilityTrajectory(selectedAgent);
  const items: DoctrineCapabilitySnapshot[] = snapshots ?? [];

  const chartData = items.map((p) => ({
    release: p.release,
    capability: p.capability,
    alignment: p.alignment,
    oversight: p.oversight,
  }));

  const latest = (key: 'capability' | 'alignment' | 'oversight'): number =>
    items.length ? (items[items.length - 1][key] as number) : 0;

  const renderChart = (dataKey: string, title: string, hint: string) => (
    <Card>
      <SectionTitle>{title}</SectionTitle>
      <p className="text-xs mb-2" style={{ color: GHOST }}>{hint}</p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="release" tick={{ fill: '#5e5e5e', fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#5e5e5e', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11 }}
            formatter={(v: number) => [`${v}`, title]}
          />
          <Line type="monotone" dataKey={dataKey} stroke={GOLD} strokeWidth={2} dot={false} name={title} />
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

      <div className="flex items-center gap-3 mb-5">
        <span className="text-xs font-mono" style={{ color: GHOST }}>AGENT</span>
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="text-xs font-mono rounded px-2 py-1"
          style={{
            background: 'var(--color-a11oy-surface, #111)',
            color: GOLD,
            border: '1px solid var(--color-a11oy-border)',
          }}
        >
          {DOCTRINE_AGENT_IDS.map((id) => (
            <option key={id} value={id}>{AGENT_LABEL[id] ?? id}</option>
          ))}
        </select>
      </div>

      <DoctrineLoader loading={loading} error={error}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <KpiCard label="AGENT" value={AGENT_LABEL[selectedAgent] ?? selectedAgent} sub="selected" accent={GOLD} />
          <KpiCard label="CAPABILITY" value={latest('capability')} sub="latest release" accent={GOLD} />
          <KpiCard label="ALIGNMENT" value={latest('alignment')} sub="latest release" accent={GOLD} />
          <KpiCard label="OVERSIGHT" value={latest('oversight')} sub="latest release" accent={GOLD} />
        </div>

        {items.length === 0 ? (
          <Card className="mb-6">
            <div className="text-xs font-mono" style={{ color: GHOST }}>
              No trajectory data for {AGENT_LABEL[selectedAgent] ?? selectedAgent} yet.
            </div>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4 mb-6">
            {renderChart('capability', 'Capability', 'What the agent can do.')}
            {renderChart('alignment', 'Alignment', 'How well it stays inside the constitution at that capability.')}
            {renderChart('oversight', 'Oversight', 'How well the operator can inspect and intervene at that capability.')}
          </div>
        )}

        <Card>
          <SectionTitle>Why we publish this</SectionTitle>
          <p className="text-xs" style={{ color: SUB, lineHeight: 1.7 }}>
            The frontier-lab graph (capability vs alignment vs oversight) is the single most important picture you can draw of an
            AI system over time. Most enterprise AI vendors only show the capability curve. The Doctrine Layer requires all three
            curves on every agent — and the curves are tied to specific constitution versions, snapshot fingerprints, and ARG
            decisions in this same workspace. Select an agent above to inspect its specific trajectory.
          </p>
        </Card>
      </DoctrineLoader>
    </Layout>
  );
}
