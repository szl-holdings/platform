import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusBadge, InfoRow, ProgressBar } from '../components/ui';
import { ROBUSTNESS_WALL, AGENT_LABEL } from '../data/mythosDoctrine';

const fmtDate = (s: string) => new Date(s).toISOString().slice(0, 16).replace('T', ' ');
const fmtSigned = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}`;

export function RobustnessWall() {
  const [agentId, setAgentId] = useState(ROBUSTNESS_WALL[0].agentId);
  const snapshot = ROBUSTNESS_WALL.find(s => s.agentId === agentId) ?? ROBUSTNESS_WALL[0];

  const compositeAvg = (
    ROBUSTNESS_WALL.reduce((a, s) => a + s.composite, 0) / ROBUSTNESS_WALL.length
  ).toFixed(1);
  const totalAttempts = ROBUSTNESS_WALL.reduce((a, s) => a + s.categories.reduce((b, c) => b + c.attempts, 0), 0);
  const totalBlocked = ROBUSTNESS_WALL.reduce((a, s) => a + s.categories.reduce((b, c) => b + c.blocked, 0), 0);

  return (
    <Layout>
      <PageHeader
        label="DOCTRINE · ROBUSTNESS WALL"
        title="Adversarial Robustness Wall"
        subtitle="Per-snapshot scores (0–100, higher = more robust). Categories from MITRE ATLAS + OWASP LLM Top 10. Battery: a11oy-art-v3."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="AGENTS COVERED" value={ROBUSTNESS_WALL.length} accent="#c9b787" />
        <KpiCard label="AVG COMPOSITE" value={compositeAvg} sub="0–100" accent="#c9b787" />
        <KpiCard label="ATTEMPTS" value={totalAttempts.toLocaleString('en-US')} accent="#c9b787" />
        <KpiCard label="BLOCKED" value={`${((totalBlocked / totalAttempts) * 100).toFixed(1)}%`} sub={`${totalBlocked.toLocaleString('en-US')} of ${totalAttempts.toLocaleString('en-US')}`} accent="#c9b787" />
      </div>

      <Card className="mb-4">
        <SectionTitle>Per-agent composite</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {ROBUSTNESS_WALL.map(s => (
            <button
              key={s.agentId}
              onClick={() => setAgentId(s.agentId)}
              className="text-left rounded-lg border p-3 transition-colors"
              style={{
                backgroundColor: agentId === s.agentId ? 'rgba(201,183,135,0.06)' : 'var(--color-a11oy-card)',
                borderColor: agentId === s.agentId ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{AGENT_LABEL[s.agentId]}</span>
                <StatusBadge status={s.visibility === 'public' ? 'ok' : 'info'} label={s.visibility.toUpperCase()} />
              </div>
              <div className="text-2xl font-display font-semibold" style={{ color: '#c9b787' }}>{s.composite}</div>
              <div className="text-xs font-mono mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.snapshotRef}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>{AGENT_LABEL[snapshot.agentId]} — robustness breakdown</SectionTitle>
          <StatusBadge status={snapshot.visibility === 'public' ? 'ok' : 'info'} label={snapshot.visibility.toUpperCase()} />
        </div>
        <InfoRow label="snapshot" value={<span className="font-mono">{snapshot.snapshotRef}</span>} />
        <InfoRow label="captured" value={fmtDate(snapshot.capturedAt)} />
        <InfoRow label="battery" value={<span className="font-mono">{snapshot.battery.name} v{snapshot.battery.version}</span>} />
        <InfoRow label="composite" value={<span style={{ color: '#c9b787' }} className="text-sm font-semibold">{snapshot.composite} / 100</span>} />

        <div className="mt-4">
          <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-mono uppercase" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            <div className="col-span-4">Attack category</div>
            <div className="col-span-1 text-right">Score</div>
            <div className="col-span-3">Posture</div>
            <div className="col-span-2 text-right">Attempts</div>
            <div className="col-span-1 text-right">Blocked</div>
            <div className="col-span-1 text-right">Δ snap</div>
          </div>
          {snapshot.categories.map(c => (
            <div key={c.category} className="grid grid-cols-12 gap-2 py-1.5 items-center border-t" style={{ borderColor: 'var(--color-a11oy-border)' }}>
              <div className="col-span-4 text-xs" style={{ color: 'var(--color-a11oy-text)' }}>{c.category}</div>
              <div className="col-span-1 text-right text-xs font-mono" style={{ color: '#c9b787' }}>{c.score}</div>
              <div className="col-span-3"><ProgressBar value={c.score} max={100} color={c.score >= 90 ? '#c9b787' : c.score >= 80 ? '#8a8a8a' : '#f5f5f5'} /></div>
              <div className="col-span-2 text-right text-xs font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{c.attempts.toLocaleString('en-US')}</div>
              <div className="col-span-1 text-right text-xs font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{c.blocked.toLocaleString('en-US')}</div>
              <div className="col-span-1 text-right text-xs font-mono" style={{ color: c.delta >= 0 ? '#c9b787' : '#f5f5f5' }}>{fmtSigned(c.delta)}</div>
            </div>
          ))}
        </div>
      </Card>
    </Layout>
  );
}
