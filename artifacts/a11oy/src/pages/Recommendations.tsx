import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, SeverityDot, SeverityBadge } from '../components/ui';

const RECOMMENDATIONS = [
  {
    id: 'REC-001',
    title: 'Emergency CFO Escalation — Stalled Approval Chain',
    severity: 'critical' as const,
    vertical: 'Revenue Operations',
    reasoning: 'Three sequential approval gates have exceeded SLA by >48 hours. Cumulative revenue exposure now exceeds $1.2M with compounding daily risk of $84K.',
    evidence: 'LYTE-W-0491',
    exposure: '$1.2M',
    actions: ['Escalate to CFO for immediate override', 'Activate backup approval chain', 'Freeze downstream commitments'],
    prism: { revenue: 'high', staffing: 'medium', infrastructure: 'low', security: 'low', market: 'high' },
    status: 'pending',
    confidence: 94,
    created: '2h ago',
  },
  {
    id: 'REC-002',
    title: 'Ownership Drift — VP Departure Handoff Gap',
    severity: 'high' as const,
    vertical: 'Enterprise Governance',
    reasoning: 'Departing VP has 14 active decision objects with no recorded handoff. Entity graph shows 3 void nodes blocking downstream workflows.',
    evidence: 'LYTE-W-0512',
    exposure: '$640K',
    actions: ['Assign interim owner to all 14 decision objects', 'Run entity graph reconciliation', 'Alert affected vertical leads'],
    prism: { revenue: 'medium', staffing: 'critical', infrastructure: 'low', security: 'medium', market: 'low' },
    status: 'pending',
    confidence: 91,
    created: '3h ago',
  },
  {
    id: 'REC-003',
    title: 'Action Debt Compounding — Q2 Regulatory Filing',
    severity: 'high' as const,
    vertical: 'Counsel',
    reasoning: 'Regulatory filing deadline in 12 days with 6 prerequisite tasks still unresolved. Action debt score has increased 340% in the past week.',
    evidence: 'LYTE-W-0523',
    exposure: '$2.1M',
    actions: ['Prioritize all prerequisite tasks above current sprint', 'Schedule daily standup with legal team', 'Prepare contingency filing extension'],
    prism: { revenue: 'low', staffing: 'high', infrastructure: 'low', security: 'high', market: 'medium' },
    status: 'in-review',
    confidence: 88,
    created: '5h ago',
  },
  {
    id: 'REC-004',
    title: 'Buyer Engagement Decay — Enterprise Deal Pipeline',
    severity: 'medium' as const,
    vertical: 'Revenue Operations',
    reasoning: 'Top-3 enterprise prospects show declining engagement velocity. Average response time increased from 2.1 days to 4.7 days over the past 2 weeks.',
    evidence: 'LYTE-W-0534',
    exposure: '$3.8M',
    actions: ['Trigger executive sponsor outreach within 48h', 'Prepare tailored case studies for each prospect', 'Review pricing flexibility parameters'],
    prism: { revenue: 'critical', staffing: 'low', infrastructure: 'low', security: 'low', market: 'high' },
    status: 'pending',
    confidence: 82,
    created: '6h ago',
  },
  {
    id: 'REC-005',
    title: 'Infrastructure Capacity — Forecast Breach in 21 Days',
    severity: 'medium' as const,
    vertical: 'Platform',
    reasoning: 'Current consumption trajectory will exceed provisioned capacity in 21 days based on 90-day rolling average. Auto-scaling headroom is 14% below threshold.',
    evidence: 'LYTE-W-0545',
    exposure: '$180K',
    actions: ['Pre-authorize capacity expansion', 'Review auto-scaling policies', 'Audit idle resource reclamation'],
    prism: { revenue: 'low', staffing: 'low', infrastructure: 'critical', security: 'low', market: 'low' },
    status: 'approved',
    confidence: 96,
    created: '8h ago',
  },
];

const ADVERSARIAL_CHECKS = [
  { name: 'Analysis of Competing Hypotheses', abbr: 'ACH', status: 'pass' },
  { name: 'Indicators & Warnings Freshness', abbr: 'I&W', status: 'pass' },
  { name: "Devil's Advocacy", abbr: 'DA', status: 'pass' },
  { name: 'Source Reliability', abbr: 'SR', status: 'pass' },
  { name: 'Temporal Consistency', abbr: 'TC', status: 'pass' },
  { name: 'Falsification Attempt', abbr: 'FA', status: 'warn' },
];

const PRISM_LABELS: Record<string, string> = {
  revenue: 'Revenue',
  staffing: 'Staffing',
  infrastructure: 'Infrastructure',
  security: 'Security',
  market: 'Market Timing',
};

const PRISM_COLORS: Record<string, string> = {
  critical: '#f5f5f5',
  high: '#c9b787',
  medium: '#8a8a8a',
  low: '#5e5e5e',
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending:     { bg: 'rgba(201,183,135,0.12)', color: '#c9b787' },
  'in-review': { bg: 'rgba(138,138,138,0.10)', color: '#8a8a8a' },
  approved:    { bg: 'rgba(201,183,135,0.15)', color: '#c9b787' },
  rejected:    { bg: 'rgba(94,94,94,0.10)', color: '#5e5e5e' },
};

export function Recommendations() {
  const [expanded, setExpanded] = useState<string | null>(RECOMMENDATIONS[0].id);

  return (
    <Layout>
      <PageHeader
        label="RECOMMENDATIONS"
        title="Decision Intelligence"
        subtitle="Evidence-backed recommendations with adversarial validation. Every insight is traceable to proof envelopes and undergoes structured tradecraft checks before promotion."
        status="LIVE"
      />

      <div className="grid grid-cols-3 gap-3 mb-8">
        <Card>
          <div className="text-xs font-mono uppercase tracking-wide" style={{ color: '#5e5e5e' }}>Active Recommendations</div>
          <div className="text-2xl font-semibold mt-1" style={{ color: '#f5f5f5' }}>{RECOMMENDATIONS.length}</div>
          <div className="text-xs mt-1" style={{ color: '#5e5e5e' }}>across {new Set(RECOMMENDATIONS.map(r => r.vertical)).size} verticals</div>
        </Card>
        <Card>
          <div className="text-xs font-mono uppercase tracking-wide" style={{ color: '#5e5e5e' }}>Total Exposure</div>
          <div className="text-2xl font-semibold mt-1" style={{ color: '#c9b787' }}>$7.9M</div>
          <div className="text-xs mt-1" style={{ color: '#5e5e5e' }}>aggregate value at risk</div>
        </Card>
        <Card>
          <div className="text-xs font-mono uppercase tracking-wide" style={{ color: '#5e5e5e' }}>Avg Confidence</div>
          <div className="text-2xl font-semibold mt-1" style={{ color: '#c9b787' }}>90.2</div>
          <div className="text-xs mt-1" style={{ color: '#5e5e5e' }}>across all active recs</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionTitle>Decision Backlog</SectionTitle>
          <div className="flex flex-col gap-2">
            {RECOMMENDATIONS.map(rec => {
              const isExpanded = expanded === rec.id;
              const st = STATUS_STYLES[rec.status] ?? STATUS_STYLES.pending;
              return (
                <Card key={rec.id}>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <SeverityDot severity={rec.severity} />
                      <span className="font-medium text-sm truncate" style={{ color: '#f5f5f5' }}>{rec.title}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: st.bg, color: st.color }}>
                        {rec.status}
                      </span>
                    <span className="font-mono text-xs" style={{ color: '#5e5e5e' }}>{rec.created}</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setExpanded(isExpanded ? null : rec.id)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#8a8a8a', background: 'transparent' }}
                      aria-expanded={isExpanded}
                      aria-controls={`recommendation-${rec.id}`}
                    >
                      {isExpanded ? 'Collapse details' : 'Expand details'}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs mb-2" style={{ color: '#8a8a8a' }}>
                    <span>{rec.vertical}</span>
                    <span style={{ color: '#5e5e5e' }}>·</span>
                    <span>Exposure: <span style={{ color: '#c9b787' }}>{rec.exposure}</span></span>
                    <span style={{ color: '#5e5e5e' }}>·</span>
                    <span>Confidence: <span style={{ color: '#c9b787' }}>{rec.confidence}%</span></span>
                    <span style={{ color: '#5e5e5e' }}>·</span>
                    <span className="font-mono" style={{ color: '#5e5e5e' }}>{rec.evidence}</span>
                  </div>

                  {isExpanded && (
                    <div
                      id={`recommendation-${rec.id}`}
                      className="mt-3 pt-3"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="text-xs mb-3" style={{ color: '#8a8a8a' }}>{rec.reasoning}</div>

                      <div className="mb-3">
                        <div className="text-xs font-mono uppercase tracking-wide mb-2" style={{ color: '#5e5e5e' }}>Recommended Actions</div>
                        <div className="flex flex-col gap-1">
                          {rec.actions.map((a, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs" style={{ color: '#f5f5f5' }}>
                              <span style={{ color: '#c9b787' }}>→</span>
                              {a}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-xs font-mono uppercase tracking-wide mb-2" style={{ color: '#5e5e5e' }}>PRISM Impact Assessment</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(rec.prism).map(([dim, level]) => (
                            <span
                              key={dim}
                              className="text-xs font-mono px-2 py-0.5 rounded"
                              style={{ backgroundColor: `${PRISM_COLORS[level]}15`, color: PRISM_COLORS[level], border: `1px solid ${PRISM_COLORS[level]}25` }}
                            >
                              {PRISM_LABELS[dim]}: {level}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <button className="px-3 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#c9b787', color: '#0a0a0a', cursor: 'pointer', border: 'none' }}>
                          Approve
                        </button>
                        <button className="px-3 py-1 rounded text-xs font-medium" style={{ backgroundColor: 'rgba(245,245,245,0.08)', color: '#f5f5f5', cursor: 'pointer', border: '1px solid rgba(245,245,245,0.15)' }}>
                          Escalate
                        </button>
                        <button className="px-3 py-1 rounded text-xs font-medium" style={{ backgroundColor: 'transparent', color: '#5e5e5e', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)' }}>
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <SectionTitle>Adversarial Validation</SectionTitle>
          <Card>
            <div className="text-xs mb-3" style={{ color: '#8a8a8a' }}>
              Six tradecraft-inspired checks run against every recommendation before promotion.
            </div>
            <div className="flex flex-col gap-2">
              {ADVERSARIAL_CHECKS.map(check => (
                <div key={check.abbr} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.1)', color: '#c9b787' }}>
                      {check.abbr}
                    </span>
                    <span className="text-xs" style={{ color: '#8a8a8a' }}>{check.name}</span>
                  </div>
                  <span className="text-xs font-mono" style={{ color: check.status === 'pass' ? '#c9b787' : '#f5f5f5' }}>
                    {check.status === 'pass' ? '✓' : '⚠'}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <div className="mt-5">
            <SectionTitle>Operational Surfaces</SectionTitle>
            <div className="flex flex-col gap-2">
              {[
                { name: 'Ownership Drift', desc: 'Identify unassigned or contested responsibilities', count: 3 },
                { name: 'Pressure Map', desc: 'Team capacity and escalation density', count: 12 },
                { name: 'Action Debt Index', desc: 'Overdue tasks compounding risk', score: '7.4' },
                { name: 'Decision Replay', desc: 'Reconstruct past decisions for audit', count: 28 },
                { name: 'Workflow Health', desc: 'At-risk workflows and SLA breaches', count: 4 },
              ].map(surface => (
                <Card key={surface.name} className="text-xs">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <span className="font-medium" style={{ color: '#f5f5f5' }}>{surface.name}</span>
                    <span className="font-mono" style={{ color: '#c9b787' }}>{surface.score ?? surface.count}</span>
                  </div>
                  <div style={{ color: '#5e5e5e' }}>{surface.desc}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
