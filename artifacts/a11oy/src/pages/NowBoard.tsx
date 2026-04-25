import { Layout } from '../components/layout';
import { PageHeader, KpiCard, Card, SectionTitle, SeverityDot, HashId, DemoBadge, ApprovalGate } from '../components/ui';

const SIGNALS = [
  { id: 'sig-001', severity: 'critical' as const, vertical: 'Vessels Maritime', title: 'MV Cascade delayed 38h — port congestion escalating', ts: '04:12 UTC', status: 'active' },
  { id: 'sig-002', severity: 'high' as const, vertical: 'Counsel Legal', title: 'Talbot v. Meridian — discovery deadline T-48h, 3 docs outstanding', ts: '02:45 UTC', status: 'active' },
  { id: 'sig-003', severity: 'high' as const, vertical: 'Lyte Revenue', title: 'Enterprise pipeline velocity dropped 22% — 3 deals at risk', ts: '01:30 UTC', status: 'active' },
  { id: 'sig-004', severity: 'medium' as const, vertical: 'Terra Real Estate', title: 'Cap rate compression detected — Plano portfolio +18bps', ts: '00:15 UTC', status: 'monitoring' },
  { id: 'sig-005', severity: 'medium' as const, vertical: 'Aegis Defense', title: 'Threat actor TG-Ember elevated to ORANGE posture', ts: 'yesterday', status: 'monitoring' },
  { id: 'sig-006', severity: 'low' as const, vertical: 'Carlota Jo', title: 'Advisory deck reviewed — 2 client follow-ups pending', ts: 'yesterday', status: 'resolved' },
];

const ACTIONS = [
  { id: 'act-001', title: 'Authorize 48h port standby for MV Cascade', status: 'pending_approval', requester: 'Signal Engine', domain: 'Maritime' },
  { id: 'act-002', title: 'Escalate Talbot discovery package to lead counsel', status: 'pending_approval', requester: 'Counsel Agent', domain: 'Legal' },
  { id: 'act-003', title: 'Flag 3 pipeline deals for VP review call', status: 'approved', requester: 'Lyte Revenue Agent', domain: 'Revenue' },
];

const OUTCOMES = [
  { id: 'out-001', title: 'Cascade re-routing approved', domain: 'Maritime', resolvedAt: '03:20 UTC', proof: 'sha256:c9f2e5b8a1...' },
  { id: 'out-002', title: 'Q1 capex variance explained', domain: 'Finance', resolvedAt: 'yesterday', proof: 'sha256:e3a1d4f7b2...' },
  { id: 'out-003', title: 'Ember threat mitigated — perimeter hardened', domain: 'Defense', resolvedAt: '2 days ago', proof: 'sha256:b8c3f9e2a4...' },
];

const SEVERITY_COLORS: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#f59e0b', low: '#10b981', info: '#3b82f6' };

export function NowBoard() {
  return (
    <Layout>
      <PageHeader
        label="NOW BOARD"
        title="Live Operational Status"
        subtitle="Real-time view of all active signals, pending actions, and resolved outcomes across the enterprise fabric."
        status="DEMO"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="ACTIVE SIGNALS" value="32" sub="6 critical / high" accent="#ef4444" />
        <KpiCard label="PENDING ACTIONS" value="2" sub="Awaiting approval" accent="#f59e0b" />
        <KpiCard label="RESOLVED TODAY" value="3" sub="With proof receipts" accent="#10b981" />
        <KpiCard label="FABRIC STATUS" value="Operational" sub="All 7 layers live" accent="#3b82f6" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <SectionTitle>Active Signals</SectionTitle>
          <div className="flex flex-col gap-2">
            {SIGNALS.map(s => (
              <Card key={s.id}>
                <div className="flex items-start gap-3">
                  <SeverityDot severity={s.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: SEVERITY_COLORS[s.severity] }}>{s.severity.toUpperCase()}</span>
                      <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.vertical}</span>
                    </div>
                    <div className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{s.title}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.ts} · <HashId id={s.id} /></div>
                  </div>
                  <span className="text-xs font-mono flex-shrink-0" style={{ color: s.status === 'active' ? '#ef4444' : s.status === 'monitoring' ? '#f59e0b' : '#10b981' }}>
                    {s.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Action Queue</SectionTitle>
          <div className="flex flex-col gap-3 mb-6">
            {ACTIONS.map(a => (
              <Card key={a.id}>
                <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{a.domain} · {a.requester}</div>
                <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-a11oy-text)' }}>{a.title}</div>
                {a.status === 'pending_approval' ? (
                  <ApprovalGate />
                ) : (
                  <span className="text-xs font-mono" style={{ color: '#10b981' }}>approved</span>
                )}
              </Card>
            ))}
          </div>

          <SectionTitle>Recently Resolved</SectionTitle>
          <div className="flex flex-col gap-2">
            {OUTCOMES.map(o => (
              <Card key={o.id}>
                <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{o.title}</div>
                <div className="text-xs mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{o.domain} · {o.resolvedAt}</div>
                <div className="font-mono text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{o.proof}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> All signal, action, and outcome data above is seeded demo content. Connect real domain integrations to see live operational state.
      </div>
    </Layout>
  );
}
