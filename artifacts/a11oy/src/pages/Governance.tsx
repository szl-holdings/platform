import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge, ApprovalGate, ActionButton } from '../components/ui';

const POLICIES = [
  {
    id: 'pol-maritime-002', name: 'Maritime Operational Threshold', domain: 'Maritime',
    enforcement: 'block_until_approved', trigger: 'Any vessel delay > 24h or cost exposure > $10k',
    gate: 'VP Operations approval required', status: 'active',
  },
  {
    id: 'pol-finance-001', name: 'Capex Variance Acknowledgment', domain: 'Finance',
    enforcement: 'require_acknowledgment', trigger: 'Capex variance > 5% of quarterly budget',
    gate: 'CFO-delegate acknowledgment required', status: 'active',
  },
  {
    id: 'pol-security-007', name: 'Threat Tier Escalation Gate', domain: 'Defense',
    enforcement: 'auto_escalate', trigger: 'Threat actor elevated to ORANGE or above',
    gate: 'Security Ops automated escalation + CISO notification', status: 'active',
  },
  {
    id: 'pol-legal-003', name: 'Discovery Deadline Guardrail', domain: 'Legal',
    enforcement: 'block_until_approved', trigger: 'Discovery deadline T-48h with outstanding docs',
    gate: 'General Counsel approval required', status: 'active',
  },
  {
    id: 'pol-revenue-001', name: 'Pipeline Intervention Gate', domain: 'Revenue',
    enforcement: 'require_approval', trigger: 'Pipeline velocity drop > 15%',
    gate: 'VP Revenue approval required', status: 'active',
  },
  {
    id: 'pol-global-001', name: 'No Silent Execution Policy', domain: 'All',
    enforcement: 'constitutional', trigger: 'Any material action across all domains',
    gate: 'No material action executes without human approval', status: 'constitutional',
  },
];

const PENDING = [
  { id: 'pg-001', policy: 'pol-maritime-002', action: 'MV Cascade port standby — 48h authorization', approver: 'VP Operations', deadline: 'T-2h' },
  { id: 'pg-002', policy: 'pol-legal-003', action: 'Talbot discovery escalation to lead counsel', approver: 'General Counsel', deadline: 'T-48h' },
];

const ENFORCEMENT_STYLES: Record<string, { color: string }> = {
  block_until_approved: { color: '#f5f5f5' },
  require_acknowledgment: { color: '#c9b787' },
  auto_escalate: { color: '#8a8a8a' },
  require_approval: { color: '#c9b787' },
  constitutional: { color: '#b08d52' },
};

export function Governance() {
  return (
    <Layout>
      <PageHeader
        label="COVENANT GOVERNANCE"
        title="Policy Gates & Approvals"
        subtitle="Every action passes through the Covenant Layer before execution. Policy gates are explicit, logged, and non-bypassable by design."
        status="DEMO"
      />

      <div className="p-4 rounded-lg mb-8 border" style={{ backgroundColor: 'rgba(176,141,82,0.06)', borderColor: 'rgba(176,141,82,0.25)' }}>
        <div className="text-sm font-semibold mb-1" style={{ color: '#b08d52' }}>Constitutional Principle</div>
        <div className="text-sm" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          No material action executes without human approval. This is not a configuration option — it is a structural guarantee embedded in A11oy's execution fabric.
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="ACTIVE POLICIES" value="5" sub="+1 constitutional" accent="#c9b787" />
        <KpiCard label="GATES PENDING" value="2" sub="Awaiting human approval" accent="#c9b787" />
        <KpiCard label="GATES TODAY" value="12" sub="All passed or approved" accent="#c9b787" />
        <KpiCard label="BYPASS ATTEMPTS" value="0" sub="Zero-tolerance enforced" accent="#b08d52" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <SectionTitle>Active Policy Gates Pending</SectionTitle>
          <div className="flex flex-col gap-3 mb-6">
            {PENDING.map(p => (
              <Card key={p.id}>
                <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.policy}</div>
                <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-a11oy-text)' }}>{p.action}</div>
                <div className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  Approver: {p.approver} · Deadline: {p.deadline}
                </div>
                <ApprovalGate />
                <div className="flex gap-2 mt-2">
                  <ActionButton variant="primary">Approve</ActionButton>
                  <ActionButton variant="ghost">Request Info</ActionButton>
                  <ActionButton variant="danger">Block</ActionButton>
                </div>
              </Card>
            ))}
          </div>

          <SectionTitle>Policy Registry</SectionTitle>
          <div className="flex flex-col gap-2">
            {POLICIES.map(p => {
              const style = ENFORCEMENT_STYLES[p.enforcement] ?? { color: '#5e5e5e' };
              return (
                <Card key={p.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs font-mono" style={{ color: style.color }}>{p.enforcement}</span>
                        <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.domain}</span>
                      </div>
                      <div className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{p.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-sub)' }}>{p.gate}</div>
                    </div>
                    <span
                      className="text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ backgroundColor: p.status === 'constitutional' ? 'rgba(176,141,82,0.1)' : 'rgba(201,183,135,0.1)', color: p.status === 'constitutional' ? '#b08d52' : '#c9b787' }}
                    >
                      {p.status}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <SectionTitle>Covenant Simulator</SectionTitle>
          <Card>
            <div className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              Test any proposed action against active policies before submission.
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono block mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>ACTION DOMAIN</label>
                <div className="text-xs px-3 py-2 rounded border" style={{ backgroundColor: 'var(--color-a11oy-deep)', borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text-sub)' }}>
                  Maritime — vessel operations
                </div>
              </div>
              <div>
                <label className="text-xs font-mono block mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>PROPOSED ACTION</label>
                <div className="text-xs px-3 py-2 rounded border" style={{ backgroundColor: 'var(--color-a11oy-deep)', borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text-sub)' }}>
                  Authorize port standby — $14,200/day
                </div>
              </div>
              <div className="p-3 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.2)' }}>
                <div className="text-xs font-mono mb-1" style={{ color: '#c9b787' }}>SIMULATION RESULT</div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                  Policy pol-maritime-002 triggered · Enforcement: block_until_approved · Required: VP Operations
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <ActionButton variant="ghost">Run Simulation</ActionButton>
            </div>
            <div className="mt-2 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              <DemoBadge /> Simulator output is illustrative
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
