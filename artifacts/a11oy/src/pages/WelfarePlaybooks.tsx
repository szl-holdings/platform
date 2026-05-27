// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, InfoRow, StatusBadge } from '../components/ui';
import { AGENT_LABEL } from '../data/khipuDoctrine';
import { useWelfarePlaybooks as useWelfarePlaybooksHook, DoctrineLoader } from '../hooks/useDoctrine';

export function WelfarePlaybooks() {
  const { data: playbooks, loading, error } = useWelfarePlaybooksHook();
  const items = playbooks ?? [];
  const [activeId, setActiveId] = useState<string>('');

  const selId = activeId || items[0]?.playbookId || '';
  const active = items.find((p: any) => p.playbookId === selId) ?? items[0];
  const totalTriggers = items.reduce((a: number, p: any) => a + p.recentTriggers, 0);

  return (
    <Layout>
      <DoctrineLoader loading={loading} error={error}>
      <PageHeader
        label="DOCTRINE · WELFARE PLAYBOOKS"
        title="Welfare Intervention Playbooks"
        subtitle="Six named playbooks. Each triggers on a specific welfare-signal threshold and produces a WelfareTelemetrySample with the playbook id."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="PLAYBOOKS" value={items.length} accent="#c9b787" />
        <KpiCard label="TRIGGERS (90d)" value={totalTriggers} accent="#c9b787" />
        <KpiCard label="TOP PLAYBOOK" value="PB-COOL-DOWN" sub="22 triggers" accent="#c9b787" />
        <KpiCard label="DUAL APPROVAL" value="REQUIRED" sub="for resume of suspend" accent="#c9b787" />
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <div className="flex flex-col gap-2">
          {items.map((p: any) => (
            <button
              key={p.playbookId}
              onClick={() => setActiveId(p.playbookId)}
              className="text-left rounded-lg border p-3"
              style={{
                backgroundColor: selId === p.playbookId ? 'rgba(201,183,135,0.06)' : 'var(--color-a11oy-card)',
                borderColor: selId === p.playbookId ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-mono font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{p.playbookId}</span>
              </div>
              <div className="text-xs font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{p.name}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.recentTriggers} triggers · 90d</div>
            </button>
          ))}
        </div>

        {active && (
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base font-mono font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{active.playbookId}</span>
              <span className="text-base font-display font-semibold" style={{ color: '#c9b787' }}>{active.name}</span>
              <StatusBadge status="ok" label={`${active.recentTriggers} triggers · 90d`} />
            </div>
            <InfoRow label="trigger" value={<span className="font-mono">{active.trigger}</span>} />
            <InfoRow label="example agents" value={<span className="font-mono">{(active.exampleAgents as string[]).map((a: string) => AGENT_LABEL[a] ?? a).join(', ')}</span>} />
          </Card>

          <Card>
            <SectionTitle>Preconditions</SectionTitle>
            <ul className="text-xs flex flex-col gap-1.5">
              {(active.preconditions as string[]).map((p: string, i: number) => (
                <li key={i} className="flex gap-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                  <span style={{ color: '#c9b787' }}>·</span><span>{p}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionTitle>Steps</SectionTitle>
            <ol className="text-xs flex flex-col gap-2">
              {(active.steps as string[]).map((s: string, i: number) => (
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
        )}
      </div>
      </DoctrineLoader>
    </Layout>
  );
}
