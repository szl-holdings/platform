import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ApprovalGate, ActionButton } from '../components/ui';

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

const PRIORITY_COLORS: Record<string, string> = { urgent: '#f5f5f5', high: '#c9b787', medium: '#c9b787', low: '#c9b787' };

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
        <KpiCard label="QUEUED ACTIONS" value="4" sub="Across 4 domains" accent="#c9b787" />
        <KpiCard label="APPROVED TODAY" value="8" sub="Execution complete" accent="#c9b787" />
        <KpiCard label="AVG CONFIDENCE" value="86%" sub="Recommendation score" accent="#c9b787" />
        <KpiCard label="AUTO-RESOLVED" value="0" sub="Human approval required for all" accent="#8a8a8a" />
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
                <div className="text-xs font-mono" style={{ color: '#c9b787' }}>{a.confidence}% confidence</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>via Signal {a.signal}</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div className="p-3 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)' }}>
                <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>RATIONALE</div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{a.rationale}</div>
              </div>
              <div className="p-3 rounded" style={{ backgroundColor: 'rgba(245,245,245,0.04)', border: '1px solid rgba(245,245,245,0.15)' }}>
                <div className="text-xs font-mono mb-1" style={{ color: '#f5f5f5' }}>COUNTERFACTUAL</div>
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

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)] flex-shrink-0" /> Governed Environment — all actions, rationale, and counterfactuals are from the seed Action Rail. No real actions execute without human approval.
      </div>
    </Layout>
  );
}
