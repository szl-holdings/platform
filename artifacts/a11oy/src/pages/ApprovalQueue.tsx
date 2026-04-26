import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const GOLD = '#c9b787';

const RISK_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#c9b787',
  Low: '#8a8a8a',
};

const DOMAIN_COLORS: Record<string, string> = {
  Maritime: '#8a8a8a',
  Legal: '#c9b787',
  Revenue: '#c9b787',
  Defense: '#f5f5f5',
  Finance: '#c9b787',
  'Real Estate': '#8a8a8a',
};

const PENDING_ACTIONS = [
  {
    id: 'aq-001',
    title: 'MV Cascade port standby authorization — 48h, $14,200/day',
    domain: 'Maritime',
    agent: 'Cascade Navigator',
    agentRole: 'Domain Specialist — Vessels Maritime',
    risk: 'High',
    urgency: 'T-2h deadline',
    requestedAt: '2026-04-26T10:30:00Z',
    why: 'MV Cascade is 18h behind schedule due to Tanjung Pelepas congestion. Port standby avoids demurrage exposure of $42,000 by repositioning to anchorage. Three alternatives evaluated; standby is optimal.',
    evidence: ['sig-001', 'ais-feed-cascade', 'pol-maritime-002'],
    estimatedImpact: 'Avoids $42,000 demurrage · Cost: $14,200/day · ETA improvement: 18h',
    requiresApprover: 'VP Operations',
    mirrorEvalScore: 94,
    status: 'pending',
  },
  {
    id: 'aq-002',
    title: 'Talbot matter — escalate discovery to lead counsel and external co-counsel',
    domain: 'Legal',
    agent: 'Counsel Sentinel',
    agentRole: 'Domain Specialist — Prism Counsel',
    risk: 'Critical',
    urgency: 'T-48h court deadline',
    requestedAt: '2026-04-26T08:00:00Z',
    why: 'Discovery deadline is T-48h. 340 documents outstanding in the Talbot matter. Production delay risk: adverse inference motion. Escalation to co-counsel is required to meet production schedule.',
    evidence: ['sig-002', 'clio-matter-4421', 'pol-legal-003'],
    estimatedImpact: 'Avoids adverse inference motion · Risk exposure: $2.1M settlement range',
    requiresApprover: 'General Counsel',
    mirrorEvalScore: 98,
    status: 'pending',
  },
  {
    id: 'aq-003',
    title: 'Pipeline intervention — engage 3 at-risk Q2 accounts with executive outreach',
    domain: 'Revenue',
    agent: 'Pipeline Oracle',
    agentRole: 'Domain Specialist — KORA Revenue',
    risk: 'Medium',
    urgency: 'Next 72h window',
    requestedAt: '2026-04-25T22:15:00Z',
    why: 'Three accounts (Meridian, Apex, NovaTech) show 85%+ churn probability based on engagement signals. Executive-level outreach has 3.2x conversion rate vs. standard rep cadence for this segment.',
    evidence: ['sig-003', 'salesforce-opp-2234', 'pol-revenue-001'],
    estimatedImpact: 'Revenue at risk: $840K ARR · Recovery probability: 65% with exec outreach',
    requiresApprover: 'VP Revenue',
    mirrorEvalScore: 88,
    status: 'pending',
  },
  {
    id: 'aq-004',
    title: 'Capex variance acknowledgment — Q1 $340K over budget in Tech Infrastructure',
    domain: 'Finance',
    agent: 'Fabric Watchdog',
    agentRole: 'System — A11oy Core',
    risk: 'Medium',
    urgency: 'Board reporting T-5d',
    requestedAt: '2026-04-25T18:00:00Z',
    why: 'Q1 capex variance of $340K (8.2%) in Tech Infrastructure category exceeds the 5% policy threshold. Board packet requires acknowledgment before report generation. No corrective action required.',
    evidence: ['sig-007', 'erp-q1-variance', 'pol-finance-001'],
    estimatedImpact: 'Board compliance · No financial action required · Acknowledge only',
    requiresApprover: 'CFO Delegate',
    mirrorEvalScore: 99,
    status: 'pending',
  },
  {
    id: 'aq-005',
    title: 'Tier Omega property — authorize LOI submission at $28.5M',
    domain: 'Real Estate',
    agent: 'DOMAINE Analyst',
    agentRole: 'Domain Specialist — Terra Real Estate',
    risk: 'High',
    urgency: 'Seller deadline T-24h',
    requestedAt: '2026-04-25T14:30:00Z',
    why: 'Cap rate analysis shows 7.8% yield at $28.5M — above fund threshold of 7.2%. Seller deadline is 24h. Comps support valuation. LOI is non-binding but secures exclusivity.',
    evidence: ['sig-006', 'costar-prop-88821', 'pol-terra-004'],
    estimatedImpact: 'Secures exclusivity · Cap rate: 7.8% · Fund hurdle: 7.2% · Non-binding LOI',
    requiresApprover: 'Investment Committee Chair',
    mirrorEvalScore: 82,
    status: 'pending',
  },
];

const DOMAIN_OPTIONS = ['All', 'Maritime', 'Legal', 'Revenue', 'Finance', 'Real Estate', 'Defense'];
const RISK_OPTIONS = ['All', 'Critical', 'High', 'Medium', 'Low'];
const URGENCY_OPTIONS = ['All', 'T-2h deadline', 'T-48h court deadline', 'Next 72h window', 'Board reporting T-5d', 'Seller deadline T-24h'];

type ActionState = Record<string, 'approved' | 'rejected' | 'escalated' | 'deferred' | 'evidence_requested' | null>;

export function ApprovalQueue() {
  const [filterDomain, setFilterDomain] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>('aq-001');
  const [actionStates, setActionStates] = useState<ActionState>({});
  const [editNote, setEditNote] = useState<Record<string, string>>({});

  const filtered = PENDING_ACTIONS.filter(a =>
    (filterDomain === 'All' || a.domain === filterDomain) &&
    (filterRisk === 'All' || a.risk === filterRisk)
  );

  const pendingCount = filtered.filter(a => !actionStates[a.id]).length;

  function act(id: string, action: ActionState[string]) {
    setActionStates(prev => ({ ...prev, [id]: action }));
  }

  const actionColors: Record<string, string> = {
    approved: '#22c55e',
    rejected: '#ef4444',
    escalated: '#f97316',
    deferred: '#8a8a8a',
    evidence_requested: '#c9b787',
  };

  return (
    <Layout>
      <PageHeader
        label="HUMAN APPROVAL QUEUE"
        title="Pending Action Approvals"
        subtitle="Every material action proposed by A11oy operators awaits explicit human approval here. No action executes without your decision."
        status="DEMO"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="PENDING DECISIONS" value={pendingCount} sub="awaiting approval" accent={GOLD} />
        <KpiCard label="CRITICAL RISK" value={PENDING_ACTIONS.filter(a => a.risk === 'Critical').length} sub="highest priority" accent="#ef4444" />
        <KpiCard label="APPROVED TODAY" value={3} sub="actions taken" accent={GOLD} />
        <KpiCard label="AVG EVAL SCORE" value="92%" sub="MirrorEval confidence" accent={GOLD} />
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 flex-wrap">
          <span className="text-xs self-center font-mono mr-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Domain:</span>
          {DOMAIN_OPTIONS.map(d => (
            <button
              key={d}
              onClick={() => setFilterDomain(d)}
              className="text-xs px-2.5 py-1 rounded font-mono"
              style={{
                backgroundColor: filterDomain === d ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)',
                color: filterDomain === d ? GOLD : 'var(--color-a11oy-text-ghost)',
                border: `1px solid ${filterDomain === d ? 'rgba(201,183,135,0.3)' : 'transparent'}`,
                cursor: 'pointer',
              }}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          <span className="text-xs self-center font-mono mr-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Risk:</span>
          {RISK_OPTIONS.map(r => (
            <button
              key={r}
              onClick={() => setFilterRisk(r)}
              className="text-xs px-2.5 py-1 rounded font-mono"
              style={{
                backgroundColor: filterRisk === r ? `${RISK_COLORS[r] ?? 'rgba(201,183,135,0.15)'}22` : 'var(--color-a11oy-muted)',
                color: filterRisk === r ? (RISK_COLORS[r] ?? GOLD) : 'var(--color-a11oy-text-ghost)',
                border: `1px solid ${filterRisk === r ? (RISK_COLORS[r] ?? GOLD) + '40' : 'transparent'}`,
                cursor: 'pointer',
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <span className="text-xs self-center" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{filtered.length} actions</span>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map(action => {
          const riskColor = RISK_COLORS[action.risk] ?? GOLD;
          const domainColor = DOMAIN_COLORS[action.domain] ?? GOLD;
          const isExpanded = expandedId === action.id;
          const state = actionStates[action.id];
          const isActed = !!state;

          return (
            <Card
              key={action.id}
              style={{
                borderLeft: `3px solid ${riskColor}`,
                opacity: isActed ? 0.65 : 1,
              }}
            >
              <div
                className="flex items-start justify-between gap-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : action.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${riskColor}18`, color: riskColor, border: `1px solid ${riskColor}30` }}>
                      {action.risk} risk
                    </span>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${domainColor}12`, color: domainColor }}>
                      {action.domain}
                    </span>
                    <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{action.urgency}</span>
                    {isActed && (
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${actionColors[state!] ?? GOLD}18`, color: actionColors[state!] ?? GOLD }}>
                        {state!.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{action.title}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    Requested by <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{action.agent}</span> · {action.agentRole} · MirrorEval: <span style={{ color: GOLD }}>{action.mirrorEvalScore}%</span>
                  </div>
                </div>
                <div className="text-xs font-mono flex-shrink-0 text-right" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  <div>Approver: <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{action.requiresApprover}</span></div>
                  <div className="mt-0.5">{new Date(action.requestedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 space-y-4 border-t pt-4" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-mono mb-1.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>WHY THIS ACTION</div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-a11oy-text-sub)' }}>{action.why}</p>
                    </div>
                    <div>
                      <div className="text-xs font-mono mb-1.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>ESTIMATED IMPACT</div>
                      <div className="text-xs p-2.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: GOLD }}>
                        {action.estimatedImpact}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-mono mb-1.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>EVIDENCE REFERENCES</div>
                    <div className="flex flex-wrap gap-1.5">
                      {action.evidence.map(e => (
                        <span key={e} className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)' }}>
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-mono mb-1.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>OPERATOR NOTES (OPTIONAL)</div>
                    <textarea
                      value={editNote[action.id] ?? ''}
                      onChange={e => setEditNote(prev => ({ ...prev, [action.id]: e.target.value }))}
                      placeholder="Add context, conditions, or modifications to your decision..."
                      className="w-full text-xs px-3 py-2 rounded"
                      rows={2}
                      style={{
                        backgroundColor: 'var(--color-a11oy-deep)',
                        border: '1px solid var(--color-a11oy-border)',
                        color: 'var(--color-a11oy-text)',
                        resize: 'vertical',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {!isActed ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => act(action.id, 'approved')}
                        className="text-xs px-4 py-2 rounded font-medium"
                        style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer' }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => act(action.id, 'rejected')}
                        className="text-xs px-4 py-2 rounded font-medium"
                        style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer' }}
                      >
                        ✕ Reject
                      </button>
                      <button
                        onClick={() => act(action.id, 'evidence_requested')}
                        className="text-xs px-4 py-2 rounded font-medium"
                        style={{ backgroundColor: 'rgba(201,183,135,0.1)', color: GOLD, border: '1px solid rgba(201,183,135,0.2)', cursor: 'pointer' }}
                      >
                        ⊙ Request Evidence
                      </button>
                      <button
                        onClick={() => act(action.id, 'escalated')}
                        className="text-xs px-4 py-2 rounded font-medium"
                        style={{ backgroundColor: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)', cursor: 'pointer' }}
                      >
                        ↑ Escalate
                      </button>
                      <button
                        onClick={() => act(action.id, 'deferred')}
                        className="text-xs px-4 py-2 rounded font-medium"
                        style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)', border: '1px solid var(--color-a11oy-border)', cursor: 'pointer' }}
                      >
                        ⏸ Defer
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono px-3 py-1.5 rounded" style={{ backgroundColor: `${actionColors[state!]}18`, color: actionColors[state!], border: `1px solid ${actionColors[state!]}30` }}>
                        Decision recorded: {state!.replace(/_/g, ' ')} · Demo mode
                      </span>
                      <button
                        onClick={() => act(action.id, null)}
                        className="text-xs"
                        style={{ color: 'var(--color-a11oy-text-ghost)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Undo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            No pending actions match the current filters.
          </div>
        )}
      </div>

      <div className="mt-6 p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)', color: 'var(--color-a11oy-text-ghost)' }}>
        Demo mode — approval decisions are illustrative. In production, decisions are cryptographically signed, logged to the Proof Ledger, and trigger governed execution immediately.
      </div>
    </Layout>
  );
}
