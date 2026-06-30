import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, SeverityDot } from '../components/ui';

const BRIEF_DATE = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const HEADLINE = 'Enterprise ARR growth deceleration requires immediate intervention across three verticals. Defense portfolio shows strengthening position.';

const SECTIONS = [
  {
    agent: 'Atlas',
    domain: 'Financial Intelligence',
    judgment: 'ARR growth rate has decelerated to 18% QoQ, down from 24% in Q1. Mid-market churn is the primary contributor.',
    risk: 'high' as const,
    confidence: 87,
    findings: [
      'Mid-market segment churn increased 2.3x in the past 60 days',
      'Enterprise pipeline shows 3 deals at risk of slipping to Q3',
      'Revenue per seat has declined 8% across the platform tier',
    ],
    assumptions: ['Current pricing model remains competitive', 'No major competitor launches in Q2'],
    gaps: ['Customer health scores for 12 mid-market accounts are stale (>30 days)'],
    actions: [
      { priority: 'P0', action: 'Launch retention campaign for at-risk mid-market accounts', owner: 'Revenue Ops', due: '48h' },
      { priority: 'P1', action: 'Schedule executive sponsor calls for top-3 enterprise deals', owner: 'CRO', due: '1 week' },
    ],
  },
  {
    agent: 'Sentinel',
    domain: 'Security & Defense',
    judgment: 'Defense portfolio is strengthening. Two new contract opportunities identified through APT attribution intelligence.',
    risk: 'low' as const,
    confidence: 92,
    findings: [
      'Novel TTP matching state-level adversary identified in client telemetry',
      'Attribution confidence at 94% — sufficient for client briefing',
      'Two NATO-aligned clients have expressed interest in expanded threat coverage',
    ],
    assumptions: ['Attribution methodology remains valid under peer review', 'Client budget cycles align with Q2 proposal timeline'],
    gaps: ['Third-party validation of TTP cluster pending'],
    actions: [
      { priority: 'P1', action: 'Prepare client-ready APT attribution briefing', owner: 'Aegis Lead', due: '1 week' },
      { priority: 'P2', action: 'Draft expanded coverage proposal for NATO clients', owner: 'BD Team', due: '2 weeks' },
    ],
  },
  {
    agent: 'Terra',
    domain: 'Real Estate Intelligence',
    judgment: 'Office vacancy rate exceeds 34% threshold — above debt covenant. Residential portfolio performing within parameters.',
    risk: 'critical' as const,
    confidence: 95,
    findings: [
      'Office vacancy rate at 34.2%, breaching the 34% covenant threshold',
      'Three properties are candidates for residential conversion',
      'Capex variance audit shows 22% overrun in residential portfolio',
    ],
    assumptions: ['Market conditions do not deteriorate further in Q2', 'Conversion permits are obtainable within 90 days'],
    gaps: ['Updated appraisals needed for 2 properties with stale valuations'],
    actions: [
      { priority: 'P0', action: 'Notify lender of covenant status and present remediation plan', owner: 'CFO', due: '24h' },
      { priority: 'P1', action: 'Commission updated property appraisals', owner: 'Terra Lead', due: '1 week' },
    ],
  },
  {
    agent: 'Lexis',
    domain: 'Legal & Compliance',
    judgment: 'Q2 regulatory filing deadline in 12 days. Six prerequisite tasks remain unresolved. Compliance risk is elevated.',
    risk: 'high' as const,
    confidence: 89,
    findings: [
      'Filing deadline: May 8, 2026 — 12 calendar days remaining',
      'Six prerequisite tasks are overdue or in-progress',
      'External counsel review has not been scheduled',
    ],
    assumptions: ['No regulatory changes to filing requirements', 'External counsel is available within 48h'],
    gaps: ['Status of 2 prerequisite tasks is unconfirmed'],
    actions: [
      { priority: 'P0', action: 'Schedule external counsel review session', owner: 'GC', due: '48h' },
      { priority: 'P0', action: 'Escalate prerequisite task owners for daily standups', owner: 'Compliance Lead', due: '24h' },
    ],
  },
  {
    agent: 'Helmsman',
    domain: 'Maritime Operations',
    judgment: 'Fleet utilization strong at 94%. One vessel flagged for route deviation investigation. No safety incidents.',
    risk: 'low' as const,
    confidence: 91,
    findings: [
      'Fleet-wide utilization: 94.2% (target: 90%)',
      'MV Stellaris deviated 12nm from planned route — investigation pending',
      'Fuel efficiency up 3.1% month-over-month',
    ],
    assumptions: ['Weather conditions remain within operational parameters', 'Port schedules hold as confirmed'],
    gaps: ['Stellaris deviation root cause not yet determined'],
    actions: [
      { priority: 'P2', action: 'Complete Stellaris deviation investigation', owner: 'Vessels Lead', due: '3 days' },
    ],
  },
];

const RISK_MAP: Record<string, { color: string; label: string }> = {
  critical: { color: '#f5f5f5', label: 'Critical' },
  high:     { color: '#c9b787', label: 'High' },
  medium:   { color: '#8a8a8a', label: 'Medium' },
  low:      { color: '#5e5e5e', label: 'Low' },
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: '#f5f5f5',
  P1: '#c9b787',
  P2: '#8a8a8a',
  P3: '#5e5e5e',
};

export function ExecutiveBrief() {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0, 2]));

  const toggle = (i: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const criticalCount = SECTIONS.filter(s => s.risk === 'critical').length;
  const highCount = SECTIONS.filter(s => s.risk === 'high').length;
  const totalActions = SECTIONS.reduce((sum, s) => sum + s.actions.length, 0);
  const p0Actions = SECTIONS.reduce((sum, s) => sum + s.actions.filter(a => a.priority === 'P0').length, 0);

  return (
    <Layout>
      <PageHeader
        label="EXECUTIVE BRIEF"
        title="Today's Intelligence Summary"
        subtitle={BRIEF_DATE}
        status="LIVE"
      >
        <div className="flex items-center gap-4 text-xs font-mono" style={{ color: '#8a8a8a' }}>
          <span>Synthesized from <span style={{ color: '#c9b787' }}>5 agents</span></span>
          <span style={{ color: '#5e5e5e' }}>·</span>
          <span><span style={{ color: '#c9b787' }}>{totalActions}</span> actions</span>
          <span style={{ color: '#5e5e5e' }}>·</span>
          <span><span style={{ color: '#f5f5f5' }}>{p0Actions}</span> P0</span>
        </div>
      </PageHeader>

      <Card className="mb-6">
        <div className="text-xs font-mono uppercase tracking-wide mb-2" style={{ color: '#5e5e5e' }}>Lead Assessment</div>
        <p className="text-sm leading-relaxed" style={{ color: '#f5f5f5' }}>{HEADLINE}</p>
        <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: '#8a8a8a' }}>
          <span><span style={{ color: '#f5f5f5' }}>{criticalCount}</span> critical</span>
          <span><span style={{ color: '#c9b787' }}>{highCount}</span> high</span>
          <span>{SECTIONS.length} verticals assessed</span>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionTitle>Agent Collective Assessments</SectionTitle>
          <div className="flex flex-col gap-3">
            {SECTIONS.map((section, i) => {
              const isExpanded = expandedSections.has(i);
              const risk = RISK_MAP[section.risk];
              return (
                <Card key={i} onClick={() => toggle(i)}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <SeverityDot severity={section.risk} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.1)', color: '#c9b787' }}>
                            {section.agent}
                          </span>
                          <span className="text-xs" style={{ color: '#5e5e5e' }}>{section.domain}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-mono" style={{ color: risk.color }}>{risk.label}</span>
                      <span className="text-xs font-mono" style={{ color: '#5e5e5e' }}>{section.confidence}%</span>
                      <span className="text-xs" style={{ color: '#5e5e5e' }}>{isExpanded ? '▾' : '▸'}</span>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed" style={{ color: '#8a8a8a' }}>{section.judgment}</p>

                  {isExpanded && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="mb-3">
                        <div className="text-xs font-mono uppercase tracking-wide mb-1.5" style={{ color: '#5e5e5e' }}>Key Findings</div>
                        <div className="flex flex-col gap-1">
                          {section.findings.map((f, j) => (
                            <div key={j} className="flex items-start gap-2 text-xs" style={{ color: '#f5f5f5' }}>
                              <span style={{ color: '#c9b787' }}>·</span>
                              {f}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <div className="text-xs font-mono uppercase tracking-wide mb-1.5" style={{ color: '#5e5e5e' }}>Assumptions</div>
                          {section.assumptions.map((a, j) => (
                            <div key={j} className="text-xs mb-1" style={{ color: '#8a8a8a' }}>· {a}</div>
                          ))}
                        </div>
                        <div>
                          <div className="text-xs font-mono uppercase tracking-wide mb-1.5" style={{ color: '#5e5e5e' }}>Gaps & Unknowns</div>
                          {section.gaps.map((g, j) => (
                            <div key={j} className="text-xs mb-1" style={{ color: '#8a8a8a' }}>· {g}</div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-mono uppercase tracking-wide mb-1.5" style={{ color: '#5e5e5e' }}>Recommended Actions</div>
                        <div className="flex flex-col gap-1.5">
                          {section.actions.map((action, j) => (
                            <div key={j} className="flex items-center gap-3 text-xs py-1 px-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                              <span className="font-mono font-medium px-1.5 py-0.5 rounded" style={{ color: PRIORITY_COLORS[action.priority], backgroundColor: `${PRIORITY_COLORS[action.priority]}15` }}>
                                {action.priority}
                              </span>
                              <span className="flex-1" style={{ color: '#f5f5f5' }}>{action.action}</span>
                              <span className="font-mono" style={{ color: '#8a8a8a' }}>{action.owner}</span>
                              <span className="font-mono" style={{ color: '#5e5e5e' }}>{action.due}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <SectionTitle>Risk Summary</SectionTitle>
          <Card className="mb-5">
            <div className="flex flex-col gap-3">
              {SECTIONS.map((s, i) => {
                const risk = RISK_MAP[s.risk];
                return (
                  <div key={i} className="flex items-center justify-between py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-2">
                      <SeverityDot severity={s.risk} />
                      <span className="text-xs" style={{ color: '#8a8a8a' }}>{s.domain}</span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: risk.color }}>{risk.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <SectionTitle>Priority Actions</SectionTitle>
          <Card className="mb-5">
            <div className="flex flex-col gap-2">
              {SECTIONS.flatMap(s => s.actions).filter(a => a.priority === 'P0').map((action, i) => (
                <div key={i} className="text-xs py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono font-medium" style={{ color: '#f5f5f5' }}>P0</span>
                    <span style={{ color: '#5e5e5e' }}>·</span>
                    <span className="font-mono" style={{ color: '#c9b787' }}>{action.due}</span>
                  </div>
                  <div style={{ color: '#f5f5f5' }}>{action.action}</div>
                  <div className="font-mono mt-0.5" style={{ color: '#5e5e5e' }}>{action.owner}</div>
                </div>
              ))}
            </div>
          </Card>

          <SectionTitle>Agent Confidence</SectionTitle>
          <Card>
            <div className="flex flex-col gap-2">
              {SECTIONS.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-xs font-mono" style={{ color: '#8a8a8a' }}>{s.agent}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width: `${s.confidence}%`, backgroundColor: '#c9b787' }} />
                    </div>
                    <span className="text-xs font-mono" style={{ color: '#c9b787' }}>{s.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
