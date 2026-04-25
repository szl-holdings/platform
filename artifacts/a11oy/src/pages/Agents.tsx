import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge, StatusPill, ApprovalGate } from '../components/ui';

const OPERATORS = [
  {
    id: 'op-maritime-001', name: 'Cascade Navigator', domain: 'Maritime', status: 'active',
    model: 'Router:gpt-4o → claude-3-5-sonnet', tasks: 3, completedToday: 12,
    description: 'Monitors vessel operations, port schedules, and maritime signal mesh for MV Cascade and fleet.',
    lastAction: 'Recommended port standby — awaiting VP approval',
    skills: ['ETA Monitoring', 'Port Cost Analysis', 'Demurrage Calc', 'Route Optimization'],
    requiresApproval: true,
  },
  {
    id: 'op-legal-001', name: 'Counsel Sentinel', domain: 'Legal', status: 'active',
    model: 'Router:claude-3-5-sonnet', tasks: 2, completedToday: 8,
    description: 'Tracks matter deadlines, discovery obligations, and document status across all active cases.',
    lastAction: 'Flagged Talbot discovery risk — escalation recommended',
    skills: ['Deadline Tracking', 'Document Status', 'Matter Monitoring', 'Risk Scoring'],
    requiresApproval: true,
  },
  {
    id: 'op-revenue-001', name: 'Pipeline Oracle', domain: 'Revenue', status: 'active',
    model: 'Router:gpt-4o', tasks: 4, completedToday: 21,
    description: 'Monitors enterprise pipeline velocity, deal health, and revenue signal patterns.',
    lastAction: 'Identified 3 at-risk deals — VP review requested',
    skills: ['Pipeline Analysis', 'Deal Scoring', 'Forecast Modeling', 'CRM Monitoring'],
    requiresApproval: true,
  },
  {
    id: 'op-defense-001', name: 'Guardian', domain: 'Defense', status: 'active',
    model: 'Router:claude-3-5-sonnet (air-gapped mode)', tasks: 1, completedToday: 6,
    description: 'Monitors threat intelligence feeds, posture assessments, and defense operational signals.',
    lastAction: 'TG-Ember escalated to ORANGE — CISO notified',
    skills: ['Threat Intelligence', 'Posture Assessment', 'Incident Triage', 'SIGINT Correlation'],
    requiresApproval: true,
  },
  {
    id: 'op-fabric-001', name: 'Fabric Watchdog', domain: 'Alloy Core', status: 'active',
    model: 'Router:internal', tasks: 0, completedToday: 144,
    description: 'Monitors the A11oy fabric itself — signal mesh health, causal core latency, proof ledger integrity.',
    lastAction: 'All 7 fabric layers nominal',
    skills: ['Mesh Health', 'Layer Monitoring', 'Proof Verification', 'Latency Tracking'],
    requiresApproval: false,
  },
];

const DOMAIN_COLORS: Record<string, string> = {
  Maritime: '#3b82f6', Legal: '#6366f1', Revenue: '#f59e0b',
  Defense: '#8b5cf6', 'Real Estate': '#10b981', 'Alloy Core': '#b08d52',
};

export function Agents() {
  return (
    <Layout>
      <PageHeader
        label="A11OY OPERATORS"
        title="Specialized Agent Operators"
        subtitle="Domain-specialized agent operators that sense, reason, and recommend — always within policy bounds, always with human approval required for material actions."
        status="DEMO"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="ACTIVE OPERATORS" value="5" sub="Across 5 domains" accent="#10b981" />
        <KpiCard label="TASKS TODAY" value="191" sub="Completed" accent="#3b82f6" />
        <KpiCard label="PENDING ACTIONS" value="3" sub="Awaiting human approval" accent="#f59e0b" />
        <KpiCard label="AUTO-EXECUTED" value="0" sub="All material actions gated" accent="#b08d52" />
      </div>

      <div className="flex flex-col gap-4">
        {OPERATORS.map(op => (
          <Card key={op.id}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-display font-bold flex-shrink-0"
                  style={{ backgroundColor: `${DOMAIN_COLORS[op.domain] ?? '#9bacc4'}18`, color: DOMAIN_COLORS[op.domain] ?? '#9bacc4' }}
                >
                  {op.name.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{op.name}</span>
                    <StatusPill status="LIVE" />
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{op.domain} · {op.model}</div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-mono" style={{ color: '#10b981' }}>{op.completedToday} ops today</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{op.tasks} pending</div>
              </div>
            </div>

            <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>{op.description}</p>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {op.skills.map(s => (
                <span
                  key={s}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}
                >
                  {s}
                </span>
              ))}
            </div>

            <div className="text-xs px-3 py-2 rounded mb-2" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text-sub)' }}>
              Last: {op.lastAction}
            </div>

            {op.requiresApproval && <ApprovalGate label="All material actions from this operator require human approval" />}
          </Card>
        ))}
      </div>

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> Operator configurations are illustrative. Real operators are provisioned via the Workcell engine with governed tool access.
      </div>
    </Layout>
  );
}
