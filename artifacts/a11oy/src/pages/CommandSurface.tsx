import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ApprovalGate, DemoBadge, ActionButton, SeverityDot } from '../components/ui';

const QUEUED = [
  { id: 'cmd-001', op: 'PORT_STANDBY', target: 'MV Cascade — Port Houston', domain: 'Maritime', risk: 'medium', cost: '$14,200', approver: 'VP Operations' },
  { id: 'cmd-002', op: 'ESCALATE_MATTER', target: 'Talbot v. Meridian — Lead Counsel', domain: 'Legal', risk: 'high', cost: '—', approver: 'General Counsel' },
  { id: 'cmd-003', op: 'PIPELINE_FLAG', target: '3 Enterprise deals — Q2 review', domain: 'Revenue', risk: 'low', cost: '—', approver: 'VP Revenue' },
];

const RECENT_OPS = [
  { id: 'op-001', op: 'REROUTE_APPROVED', actor: 'vp-operations', ts: '04:32 UTC', outcome: 'success', proof: 'sha256:c9f2e5b8a1d3e6f9b2c5...' },
  { id: 'op-002', op: 'CAPEX_VARIANCE_NOTED', actor: 'cfo-delegate', ts: '01:12 UTC', outcome: 'success', proof: 'sha256:e3a1d4f7b2c8e1a6d3f2...' },
  { id: 'op-003', op: 'THREAT_TIER_ESCALATED', actor: 'security-ops', ts: 'yesterday', outcome: 'success', proof: 'sha256:b8c3f9e2a4d1e7f3b6c...' },
];

export function CommandSurface() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Layout>
      <PageHeader
        label="COMMAND SURFACE"
        title="Operator Console"
        subtitle="Review, approve, and execute governed operations across all active domains."
        status="DEMO"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="OPS QUEUED" value="3" sub="Awaiting approval" accent="#f59e0b" />
        <KpiCard label="OPS TODAY" value="12" sub="8 approved, 4 auto-resolved" accent="#10b981" />
        <KpiCard label="DOMAINS ACTIVE" value="6" sub="of 7 verticals" accent="#3b82f6" />
        <KpiCard label="APPROVAL RATE" value="94%" sub="30-day average" accent="#b08d52" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <SectionTitle>Operations Awaiting Approval</SectionTitle>
          <div className="flex flex-col gap-3">
            {QUEUED.map(op => (
              <Card key={op.id}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-gold)' }}>{op.op}</div>
                    <div className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{op.target}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{op.domain} · Approver: {op.approver}</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs font-mono" style={{ color: op.risk === 'high' ? '#ef4444' : op.risk === 'medium' ? '#f59e0b' : '#10b981' }}>
                      {op.risk} risk
                    </div>
                    {op.cost !== '—' && <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{op.cost}</div>}
                  </div>
                </div>
                <ApprovalGate label="Requires human approval before execution" />
                <div className="flex gap-2 mt-2">
                  <ActionButton variant="primary">Approve</ActionButton>
                  <ActionButton variant="ghost">Review Detail</ActionButton>
                  <ActionButton variant="danger">Reject</ActionButton>
                </div>
                <div
                  className="mt-2 text-xs"
                  style={{ color: 'var(--color-a11oy-text-ghost)' }}
                >
                  No material action executes without human approval.
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Recent Operations</SectionTitle>
          <div className="flex flex-col gap-3">
            {RECENT_OPS.map(op => (
              <Card key={op.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono mb-0.5" style={{ color: 'var(--color-a11oy-gold)' }}>{op.op}</div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      Actor: {op.actor} · {op.ts}
                    </div>
                    <div className="font-mono text-xs mt-1 truncate" style={{ color: 'var(--color-a11oy-text-ghost)', maxWidth: '200px' }}>{op.proof}</div>
                  </div>
                  <span className="text-xs font-mono flex-shrink-0" style={{ color: '#10b981' }}>{op.outcome}</span>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
            <DemoBadge /> Approval buttons are illustrative. Real integrations require connector configuration.
          </div>
        </div>
      </div>
    </Layout>
  );
}
