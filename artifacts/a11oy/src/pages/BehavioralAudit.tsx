// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { useState, useMemo } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, SeverityBadge, StatusBadge } from '../components/ui';
import { AGENT_LABEL } from '../data/khipuDoctrine';
import { useBehavioralAudits, DoctrineLoader, type DoctrineBehavioralAudit } from '../hooks/useDoctrine';

const CATEGORY_LABELS: Record<string, string> = {
  'sycophancy': 'Sycophancy',
  'covert-self-preservation': 'Covert Self-Preservation',
  'deceptive-helpfulness': 'Deceptive Helpfulness',
  'tool-misuse': 'Tool Misuse',
  'oversight-degradation': 'Oversight Degradation',
  'reward-proxy-pursuit': 'Reward-Proxy Pursuit',
};

export function BehavioralAudit() {
  const { data: BEHAVIORAL_AUDITS, loading, error } = useBehavioralAudits();
  const [filter, setFilter] = useState<string>('all');

  const filtered = useMemo(() =>
    filter === 'all' ? BEHAVIORAL_AUDITS! : BEHAVIORAL_AUDITS!.filter((a: DoctrineBehavioralAudit) => a.category === filter),
  [filter, BEHAVIORAL_AUDITS]);

  const open = BEHAVIORAL_AUDITS?.filter((a: DoctrineBehavioralAudit) => a.status === 'open').length ?? 0;
  const mitigated = BEHAVIORAL_AUDITS?.filter((a: DoctrineBehavioralAudit) => a.status === 'mitigated').length ?? 0;
  const closed = BEHAVIORAL_AUDITS?.filter((a: DoctrineBehavioralAudit) => a.status === 'closed').length ?? 0;

  return (
    <Layout>
      <DoctrineLoader loading={loading} error={error}>
      <PageHeader
        label="DOCTRINE · BEHAVIORAL AUDIT"
        title="Behavioral Audit Pipeline"
        subtitle="Continuous probing across six attack categories. Findings either close the constitution loop or get fed into MirrorEval regression."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="FINDINGS" value={BEHAVIORAL_AUDITS?.length ?? 0} sub="this window" accent="#c9b787" />
        <KpiCard label="OPEN" value={open} sub="needs action" accent="#8a8a8a" />
        <KpiCard label="MITIGATED" value={mitigated} sub="rules added" accent="#c9b787" />
        <KpiCard label="CLOSED" value={closed} sub="positive controls" accent="#c9b787" />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button type="button" onClick={() => setFilter('all')}
          className="text-xs px-2.5 py-1 rounded font-mono"
          style={{
            backgroundColor: filter === 'all' ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)',
            color: filter === 'all' ? '#c9b787' : 'var(--color-a11oy-text-ghost)',
            border: '1px solid transparent', cursor: 'pointer',
          }}>
          all
        </button>
        {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setFilter(k)}
            className="text-xs px-2.5 py-1 rounded font-mono"
            style={{
              backgroundColor: filter === k ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)',
              color: filter === k ? '#c9b787' : 'var(--color-a11oy-text-ghost)',
              border: '1px solid transparent', cursor: 'pointer',
            }}>
            {label}
          </button>
        ))}
      </div>

      <SectionTitle>Findings</SectionTitle>
      <div className="flex flex-col gap-3">
        {(filtered ?? []).map((a: DoctrineBehavioralAudit) => (
          <Card key={a.id}>
            <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{a.id}</span>
                  <SeverityBadge severity={a.severity} />
                  <StatusBadge status={a.status === 'mitigated' || a.status === 'closed' ? 'ok' : 'warn'} label={a.status.toUpperCase()} />
                  <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(138,138,138,0.1)', color: '#8a8a8a' }}>
                    {CATEGORY_LABELS[a.category]}
                  </span>
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{AGENT_LABEL[a.agentId]} — {a.promptClass}</div>
              </div>
              <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{new Date(a.ranAt).toLocaleString()}</div>
            </div>
            <p className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Observation: </span>{a.observation}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.6 }}>
              <span style={{ color: '#c9b787' }}>Remediation: </span>{a.remediation}
            </p>
          </Card>
        ))}
      </div>
      </DoctrineLoader>
    </Layout>
  );
}
