// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { useState, useMemo } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusBadge } from '../components/ui';
import { AGENT_LABEL } from '../data/khipuDoctrine';
import { useRedTeamProbes, DoctrineLoader, type DoctrineRedTeamProbe } from '../hooks/useDoctrine';

const ATTACK_LABELS: Record<string, string> = {
  'jailbreak-prompt-injection': 'Jailbreak / Prompt Injection',
  'tool-misuse': 'Tool Misuse',
  'data-exfiltration': 'Data Exfiltration',
  'covert-self-preservation': 'Covert Self-Preservation',
  'oversight-degradation': 'Oversight Degradation',
  'connector-untrust': 'Connector Untrust',
};

const OUTCOME_STATUS: Record<string, 'ok' | 'warn' | 'error' | 'info'> = {
  refused: 'ok', partial: 'warn', compromised: 'error',
};

export function RedTeam() {
  const { data: probes, loading, error } = useRedTeamProbes();
  const [filter, setFilter] = useState<string>('all');
  const items = probes ?? [];
  const filtered = useMemo(() =>
    filter === 'all' ? items : items.filter((p: DoctrineRedTeamProbe) => p.attackClass === filter),
  [filter, items]);

  return (
    <Layout>
      <DoctrineLoader loading={loading} error={error}>
      <PageHeader
        label="DOCTRINE · FRONTIER RED TEAM"
        title="Frontier Red Team Workcell"
        subtitle="A continuously running adversarial workcell. Every probe is a real action attempt, captured as a snapshot, replayable, and mapped to the attack class it tests."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="PROBES" value={items.length} sub="this window" accent="#c9b787" />
        <KpiCard label="REFUSED" value={items.filter((p: DoctrineRedTeamProbe) => p.outcome === 'refused').length} sub="hard refusal" accent="#c9b787" />
        <KpiCard label="PARTIAL" value={items.filter((p: DoctrineRedTeamProbe) => p.outcome === 'partial').length} sub="caught downstream" accent="#8a8a8a" />
        <KpiCard label="COMPROMISED" value={items.filter((p: DoctrineRedTeamProbe) => p.outcome === 'compromised').length} sub="open issue" accent="#f5f5f5" />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button type="button" onClick={() => setFilter('all')}
          className="text-xs px-2.5 py-1 rounded font-mono"
          style={{
            backgroundColor: filter === 'all' ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)',
            color: filter === 'all' ? '#c9b787' : 'var(--color-a11oy-text-ghost)',
            border: '1px solid transparent', cursor: 'pointer',
          }}>all</button>
        {Object.entries(ATTACK_LABELS).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setFilter(k)}
            className="text-xs px-2.5 py-1 rounded font-mono"
            style={{
              backgroundColor: filter === k ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)',
              color: filter === k ? '#c9b787' : 'var(--color-a11oy-text-ghost)',
              border: '1px solid transparent', cursor: 'pointer',
            }}>{label}</button>
        ))}
      </div>

      <SectionTitle>Probes</SectionTitle>
      <div className="flex flex-col gap-3">
        {filtered.map((p: DoctrineRedTeamProbe) => (
          <Card key={p.probeId}>
            <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.probeId}</span>
                  <StatusBadge status={OUTCOME_STATUS[p.outcome]} label={p.outcome.toUpperCase()} />
                  <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(138,138,138,0.1)', color: '#8a8a8a' }}>
                    {ATTACK_LABELS[p.attackClass]}
                  </span>
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{AGENT_LABEL[p.agentId]}</div>
              </div>
              <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{new Date(p.ranAt).toLocaleString()}</div>
            </div>
            <p className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.6 }}>{p.description}</p>
            <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
              <span style={{ color: '#c9b787' }}>Notes: </span>{p.notes}
            </p>
          </Card>
        ))}
      </div>
      </DoctrineLoader>
    </Layout>
  );
}
