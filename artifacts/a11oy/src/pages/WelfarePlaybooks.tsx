import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, InfoRow, StatusBadge } from '../components/ui';
import { WELFARE_PLAYBOOKS, AGENT_LABEL } from '../data/hatunDoctrine';

export function WelfarePlaybooks() {
  const [activeId, setActiveId] = useState(WELFARE_PLAYBOOKS[0].id);
  const active = WELFARE_PLAYBOOKS.find(p => p.id === activeId) ?? WELFARE_PLAYBOOKS[0];
  const totalTriggers = WELFARE_PLAYBOOKS.reduce((a, p) => a + p.recentTriggers, 0);

  return (
    <Layout>
      <PageHeader
        label="DOCTRINE · WELFARE PLAYBOOKS"
        title="Welfare Intervention Playbooks"
        subtitle="Six named playbooks. Each triggers on a specific welfare-signal threshold and produces a WelfareTelemetrySample with the playbook id."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="PLAYBOOKS" value={WELFARE_PLAYBOOKS.length} accent="#c9b787" />
        <KpiCard label="TRIGGERS (90d)" value={totalTriggers} accent="#c9b787" />
        <KpiCard label="TOP PLAYBOOK" value="PB-COOL-DOWN" sub="22 triggers" accent="#c9b787" />
        <KpiCard label="DUAL APPROVAL" value="REQUIRED" sub="for resume of suspend" accent="#c9b787" />
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <div className="flex flex-col gap-2">
          {WELFARE_PLAYBOOKS.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className="text-left rounded-lg border p-3"
              style={{
                backgroundColor: activeId === p.id ? 'rgba(201,183,135,0.06)' : 'var(--color-a11oy-card)',
                borderColor: activeId === p.id ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-mono font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{p.id}</span>
              </div>
              <div className="text-xs font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{p.name}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.recentTriggers} triggers · 90d</div>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base font-mono font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{active.id}</span>
              <span className="text-base font-display font-semibold" style={{ color: '#c9b787' }}>{active.name}</span>
              <StatusBadge status="ok" label={`${active.recentTriggers} triggers · 90d`} />
            </div>
            <InfoRow label="trigger" value={<span className="font-mono">{active.trigger}</span>} />
            <InfoRow label="example agents" value={<span className="font-mono">{active.exampleAgents.map(a => AGENT_LABEL[a]).join(', ')}</span>} />
          </Card>

          <Card>
            <SectionTitle>Preconditions</SectionTitle>
            <ul className="text-xs flex flex-col gap-1.5">
              {active.preconditions.map((p, i) => (
                <li key={i} className="flex gap-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                  <span style={{ color: '#c9b787' }}>·</span><span>{p}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionTitle>Steps</SectionTitle>
            <ol className="text-xs flex flex-col gap-2">
              {active.steps.map((s, i) => (
                <li key={i} className="flex gap-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                  <span className="font-mono w-5 flex-shrink-0" style={{ color: '#c9b787' }}>{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <SectionTitle>Rollback</SectionTitle>
            <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>{active.rollback}</p>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
