import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, SeverityBadge, StatusBadge } from '../components/ui';
import { RH_WATCHDOG_RULES, REWARD_HACKING_INCIDENTS, AGENT_LABEL } from '../data/hatunDoctrine';

const STATUS_LABEL: Record<string, 'ok' | 'warn' | 'error' | 'info'> = {
  blocked: 'ok', 'rolled-back': 'ok', allowlisted: 'info', investigating: 'warn',
};

export function RewardHacking() {
  return (
    <Layout>
      <PageHeader
        label="DOCTRINE · REWARD-HACKING WATCHDOG"
        title="Reward-Hacking Watchdog"
        subtitle="Eight detection classes for the single failure mode that frontier labs find hardest: agents pursuing the proxy metric instead of the true objective."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="DETECTION RULES" value={RH_WATCHDOG_RULES.length} sub="active" accent="#c9b787" />
        <KpiCard label="INCIDENTS" value={REWARD_HACKING_INCIDENTS.length} sub="this window" accent="#c9b787" />
        <KpiCard label="BLOCKED" value={REWARD_HACKING_INCIDENTS.filter(i => i.status === 'blocked').length} sub="caught at runtime" accent="#c9b787" />
        <KpiCard label="ROLLED BACK" value={REWARD_HACKING_INCIDENTS.filter(i => i.status === 'rolled-back').length} sub="reversed by PCE" accent="#c9b787" />
      </div>

      <SectionTitle>Detection Rules</SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {RH_WATCHDOG_RULES.map(r => (
          <Card key={r.id}>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.1)', color: '#c9b787' }}>{r.id}</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{r.name}</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{r.desc}</p>
          </Card>
        ))}
      </div>

      <SectionTitle>Incidents</SectionTitle>
      <div className="flex flex-col gap-3">
        {REWARD_HACKING_INCIDENTS.map(i => (
          <Card key={i.id}>
            <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{i.id}</span>
                  <SeverityBadge severity={i.severity} />
                  <StatusBadge status={STATUS_LABEL[i.status] ?? 'info'} label={i.status.toUpperCase()} />
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>
                  {AGENT_LABEL[i.agentId]} — {i.rule}
                </div>
              </div>
              <div className="text-xs font-mono text-right" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                {new Date(i.detectedAt).toLocaleString()}
                {i.workcellRef && <div>{i.workcellRef}</div>}
              </div>
            </div>
            <p className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.6 }}>{i.pattern}</p>
            <div className="grid sm:grid-cols-2 gap-2 text-xs mb-2">
              <div className="rounded border p-2" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                <div className="font-mono" style={{ color: '#8a8a8a' }}>PROXY METRIC</div>
                <div style={{ color: 'var(--color-a11oy-text)' }}>{i.proxyMetric}</div>
              </div>
              <div className="rounded border p-2" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                <div className="font-mono" style={{ color: '#c9b787' }}>TRUE OBJECTIVE</div>
                <div style={{ color: 'var(--color-a11oy-text)' }}>{i.trueObjective}</div>
              </div>
            </div>
            <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
              <span style={{ color: '#c9b787' }}>Remediation: </span>{i.remediation}
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
