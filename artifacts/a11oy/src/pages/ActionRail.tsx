import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ApprovalGate, DemoBadge, ActionButton } from '../components/ui';

const ACTIONS = [
  {
    id: 'act-001', op: 'PORT_STANDBY', priority: 'urgent', title: 'Authorize 48h port standby for MV Cascade',
    domain: 'Maritime', signal: 'sig-001', confidence: 91, cost: '$14,200/day', approver: 'VP Operations',
    rationale: 'Cascade delay exceeds threshold. Alternative berth available at T+6h. Standby minimizes demurrage.',
    counterfactual: 'Without action: $58,000 estimated demurrage exposure at 120h delay.'
  },
  {
    id: 'act-002', op: 'ESCALATE_MATTER', priority: 'high', title: 'Escalate Talbot discovery package to lead counsel',
    domain: 'Legal', signal: 'sig-002', confidence: 97, cost: 'N/A', approver: 'General Counsel',
    rationale: '3 key documents undelivered T-48h before deadline. Paralegal handoff insufficient.',
    counterfactual: 'Without action: potential default judgment risk, estimated $2.4M exposure.'
  },
  {
    id: 'act-003', op: 'PIPELINE_FLAG', priority: 'medium', title: 'Flag 3 enterprise deals for VP review call',
    domain: 'Revenue', signal: 'sig-003', confidence: 85, cost: 'N/A', approver: 'VP Revenue',
    rationale: 'Pipeline velocity drop is correlated with 3 stalled deals. Direct intervention has 73% success rate.',
    counterfactual: 'Without action: Q2 forecast miss estimated at $1.1M.'
  },
  {
    id: 'act-004', op: 'PORTFOLIO_REVIEW', priority: 'low', title: 'Schedule Plano portfolio cap rate review',
    domain: 'Real Estate', signal: 'sig-004', confidence: 72, cost: 'N/A', approver: 'Asset Manager',
    rationale: 'Cap rate compression of 18bps over 30 days warrants valuation reassessment.',
    counterfactual: 'Deferred review may delay Q3 rebalancing by 6-8 weeks.'
  },
];

const PRIORITY_COLORS: Record<string, string> = { urgent: '#ef4444', high: '#f59e0b', medium: '#f59e0b', low: '#10b981' };

export function ActionRail() {
  return (
    <Layout>
      <PageHeader
        label="ACTION RAIL"
        title="Recommended Actions"
        subtitle="A11oy's recommendation layer — every proposed action carries its rationale, confidence, counterfactual, and an explicit human approval gate."
        status="DEMO"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="QUEUED ACTIONS" value="4" sub="Across 4 domains" accent="#f59e0b" />
        <KpiCard label="APPROVED TODAY" value="8" sub="Execution complete" accent="#10b981" />
        <KpiCard label="AVG CONFIDENCE" value="86%" sub="Recommendation score" accent="#3b82f6" />
        <KpiCard label="AUTO-RESOLVED" value="0" sub="Human approval required for all" accent="#8b5cf6" />
      </div>

      <div className="flex flex-col gap-4">
        {ACTIONS.map(a => (
          <Card key={a.id}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-mono px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${PRIORITY_COLORS[a.priority]}20`, color: PRIORITY_COLORS[a.priority] }}
                  >
                    {a.priority.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-gold)' }}>{a.op}</span>
                  <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{a.domain}</span>
                </div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{a.title}</h3>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-mono" style={{ color: '#10b981' }}>{a.confidence}% confidence</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>via Signal {a.signal}</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div className="p-3 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)' }}>
                <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>RATIONALE</div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{a.rationale}</div>
              </div>
              <div className="p-3 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="text-xs font-mono mb-1" style={{ color: '#ef4444' }}>COUNTERFACTUAL</div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{a.counterfactual}</div>
              </div>
            </div>

            <ApprovalGate label={`Requires approval from: ${a.approver}`} />
            <div className="flex gap-2 mt-2">
              <ActionButton variant="primary">Approve & Execute</ActionButton>
              <ActionButton variant="ghost">Defer</ActionButton>
              <ActionButton variant="danger">Reject</ActionButton>
            </div>
            <div className="text-xs mt-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              No material action executes without human approval. Cost: {a.cost}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> All recommended actions, rationale, and counterfactuals are illustrative demo content.
      </div>
    </Layout>
  );
}
