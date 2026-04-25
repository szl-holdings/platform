import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge } from '../components/ui';

const REPLAY_SESSIONS = [
  {
    id: 'replay-wc-defense-001',
    workcell: 'TG-Ember Response Cell',
    domain: 'Defense',
    completedAt: '2026-04-24T18:55:00Z',
    duration: '4m 12s',
    proofRef: 'pce-b8c3f9e2',
    steps: [
      { step: 1, label: 'Signal ingested', actor: 'Signal Mesh', ts: '18:50:43', outcome: 'success', detail: 'TG-Ember activity spike detected — 12 TTPs matched' },
      { step: 2, label: 'Severity classified', actor: 'Guardian (auto)', ts: '18:50:44', outcome: 'success', detail: 'Threat tier elevated: YELLOW → ORANGE' },
      { step: 3, label: 'Policy gate evaluated', actor: 'Covenant Layer', ts: '18:50:44', outcome: 'success', detail: 'pol-security-007 matched — auto_escalate enforcement' },
      { step: 4, label: 'CISO notified', actor: 'Guardian (auto)', ts: '18:50:45', outcome: 'success', detail: 'Notification dispatched — CISO acknowledged 18:52:01' },
      { step: 5, label: 'Perimeter hardened', actor: 'security-ops:automated', ts: '18:52:01', outcome: 'success', detail: 'WAF rules updated, access tokens rotated' },
      { step: 6, label: 'Proof ledger entry created', actor: 'Proof Ledger', ts: '18:55:00', outcome: 'success', detail: 'Hash: sha256:b8c3f9e2a4d1e7f3b6c2a9e4d1f7b3c6' },
    ],
  },
];

const SESSION = REPLAY_SESSIONS[0];

const OUTCOME_COLORS: Record<string, string> = { success: '#10b981', failed: '#ef4444', pending: '#f59e0b' };

export function WorkcellReplay() {
  return (
    <Layout>
      <PageHeader
        label="WORKCELL REPLAY"
        title="Execution Timeline Replay"
        subtitle="Step-by-step replay of completed workcell executions. Every step is linked to its proof ledger entry for full accountability."
        status="DEMO"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="REPLAYS AVAILABLE" value="1" sub="Demo replay loaded" accent="#3b82f6" />
        <KpiCard label="TOTAL STEPS" value={String(SESSION.steps.length)} sub={SESSION.workcell} accent="#b08d52" />
        <KpiCard label="DURATION" value={SESSION.duration} sub="End-to-end" accent="#10b981" />
        <KpiCard label="PROOF REF" value={SESSION.proofRef.split('-').slice(0, 2).join('-')} sub="Ledger entry" accent="#f59e0b" />
      </div>

      <div className="mb-4">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{SESSION.domain}</div>
              <div className="font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{SESSION.workcell}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                Completed: {new Date(SESSION.completedAt).toLocaleString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{SESSION.proofRef}</div>
              <div className="text-xs mt-0.5" style={{ color: '#10b981' }}>verified</div>
            </div>
          </div>
        </Card>
      </div>

      <SectionTitle>Execution Timeline</SectionTitle>
      <div className="relative">
        <div
          className="absolute left-6 top-0 bottom-0 w-px"
          style={{ backgroundColor: 'var(--color-a11oy-border)' }}
        />
        <div className="flex flex-col gap-4 pl-16">
          {SESSION.steps.map(step => (
            <div key={step.step} className="relative">
              <div
                className="absolute -left-10 top-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono"
                style={{
                  backgroundColor: OUTCOME_COLORS[step.outcome] + '20',
                  color: OUTCOME_COLORS[step.outcome],
                  border: `1px solid ${OUTCOME_COLORS[step.outcome]}40`,
                }}
              >
                {step.step}
              </div>
              <Card>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{step.label}</div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-mono" style={{ color: OUTCOME_COLORS[step.outcome] }}>{step.outcome}</span>
                    <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{step.ts}</span>
                  </div>
                </div>
                <div className="text-xs mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Actor: {step.actor}</div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{step.detail}</div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> Replay data is illustrative. Production replays are reconstructed from the immutable Proof Ledger.
      </div>
    </Layout>
  );
}
