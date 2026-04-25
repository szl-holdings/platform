import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge, StatusPill, ApprovalGate } from '../components/ui';

const WORKCELLS = [
  {
    id: 'wc-maritime-001', name: 'Maritime Ops Cell', domain: 'Maritime', status: 'running',
    operator: 'Cascade Navigator', tools: ['Port API (demo)', 'ETA Calculator', 'Demurrage Model', 'Vessel Tracker'],
    steps: 7, completedSteps: 5, currentStep: 'Awaiting VP approval for standby authorization',
    proofRef: 'pce-c9f2e5b8', outcome: 'pending',
  },
  {
    id: 'wc-legal-001', name: 'Talbot Matter Cell', domain: 'Legal', status: 'running',
    operator: 'Counsel Sentinel', tools: ['Matter Tracker', 'Deadline Engine', 'Document Status'],
    steps: 5, completedSteps: 3, currentStep: 'Escalation package assembled — awaiting GC approval',
    proofRef: 'pce-a2d7e1f4', outcome: 'pending',
  },
  {
    id: 'wc-revenue-001', name: 'Q2 Pipeline Cell', domain: 'Revenue', status: 'running',
    operator: 'Pipeline Oracle', tools: ['CRM Monitor (demo)', 'Forecast Model', 'Deal Scorer'],
    steps: 4, completedSteps: 2, currentStep: 'Deal flag report ready — VP review scheduled',
    proofRef: null, outcome: 'pending',
  },
  {
    id: 'wc-defense-001', name: 'TG-Ember Response Cell', domain: 'Defense', status: 'completed',
    operator: 'Guardian', tools: ['Threat Intel (demo)', 'Posture Engine', 'SIGINT Correlator'],
    steps: 6, completedSteps: 6, currentStep: 'Complete — all steps verified',
    proofRef: 'pce-b8c3f9e2', outcome: 'success',
  },
  {
    id: 'wc-fabric-001', name: 'Fabric Health Monitor', domain: 'Alloy Core', status: 'running',
    operator: 'Fabric Watchdog', tools: ['Mesh Monitor', 'Proof Verifier', 'Latency Tracker'],
    steps: 0, completedSteps: 0, currentStep: 'Continuous monitoring — no intervention needed',
    proofRef: null, outcome: 'nominal',
  },
];

const DOMAIN_COLORS: Record<string, string> = {
  Maritime: '#3b82f6', Legal: '#6366f1', Revenue: '#f59e0b',
  Defense: '#8b5cf6', 'Alloy Core': '#b08d52',
};

const STATUS_COLORS: Record<string, string> = {
  running: '#f59e0b', completed: '#10b981', paused: '#9bacc4', error: '#ef4444',
};

export function Workcells() {
  return (
    <Layout>
      <PageHeader
        label="WORKCELLS"
        title="Active Execution Workcells"
        subtitle="Workcells are governed, traceable execution contexts. Each cell binds an operator, a set of tools, a policy, and a proof trail."
        status="DEMO"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="ACTIVE CELLS" value="4" sub="Running" accent="#f59e0b" />
        <KpiCard label="COMPLETED TODAY" value="1" sub="With proof" accent="#10b981" />
        <KpiCard label="TOTAL STEPS" value="22" sub="Across all cells" accent="#3b82f6" />
        <KpiCard label="HUMAN GATES" value="2" sub="Currently open" accent="#8b5cf6" />
      </div>

      <div className="flex flex-col gap-4">
        {WORKCELLS.map(wc => {
          const pct = wc.steps > 0 ? Math.round((wc.completedSteps / wc.steps) * 100) : 100;
          return (
            <Card key={wc.id}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{wc.name}</span>
                    <span
                      className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${STATUS_COLORS[wc.status]}18`, color: STATUS_COLORS[wc.status] }}
                    >
                      {wc.status}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    {wc.domain} · Operator: {wc.operator}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-mono" style={{ color: DOMAIN_COLORS[wc.domain] ?? '#9bacc4' }}>{pct}%</div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{wc.completedSteps}/{wc.steps > 0 ? wc.steps : '∞'} steps</div>
                </div>
              </div>

              {wc.steps > 0 && (
                <div className="h-1.5 rounded-full mb-3" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: DOMAIN_COLORS[wc.domain] ?? '#9bacc4' }} />
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 mb-3">
                {wc.tools.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>
                    {t}
                  </span>
                ))}
              </div>

              <div className="text-xs px-3 py-2 rounded mb-2" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text-sub)' }}>
                Current: {wc.currentStep}
              </div>

              {wc.proofRef && (
                <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  Proof: {wc.proofRef}
                </div>
              )}

              {wc.outcome === 'pending' && <ApprovalGate label="Cell paused — awaiting human approval to proceed" />}
            </Card>
          );
        })}
      </div>

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> Workcell tool integrations are demo adapters. Real workcells require configured connectors.
      </div>
    </Layout>
  );
}
