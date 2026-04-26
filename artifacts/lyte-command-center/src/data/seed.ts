// ─── Lyte Flagship — Comprehensive Demo Seed ────────────────────────────────
// Powers all 9 surfaces: Overview, Signals Console, Entity Graph, Decision Center,
// Workflow Health, Run Console, Evidence Explorer, Policy Center, Eval Studio.
// Scenario: Stalled Approval Chain — Vantex Acquisition at Revenue Risk.

export type FreshnessLevel = 'live' | 'recent' | 'stale' | 'expired';
export type PolicyState = 'cleared' | 'conditional' | 'blocked' | 'flagged' | 'pending';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type UrgencyLevel = 'critical' | 'urgent' | 'moderate' | 'routine';

// ─── Overview ────────────────────────────────────────────────────────────────

export interface OverviewMetric {
  id: string;
  label: string;
  value: string | number;
  delta?: string;
  trend: 'up' | 'down' | 'flat';
  good: 'up' | 'down' | 'flat';
  context: string;
  severity?: Severity;
}

export interface OverviewSummary {
  headline: string;
  body: string;
  generatedAt: string;
  confidence: number;
  freshness: FreshnessLevel;
  proofRef: string;
}

export const overviewMetrics: OverviewMetric[] = [
  {
    id: 'arr-risk',
    label: 'ARR at Risk',
    value: '$4.2M',
    delta: '+$1.1M vs last week',
    trend: 'up',
    good: 'down',
    context: 'Vantex + 2 secondary pipeline stalls',
    severity: 'critical',
  },
  {
    id: 'signal-velocity',
    label: 'Active Signals',
    value: 47,
    delta: '+12 today',
    trend: 'up',
    good: 'flat',
    context: '12 critical, 18 high, 17 medium across all workflows',
    severity: 'high',
  },
  {
    id: 'approval-queue',
    label: 'Stalled Approvals',
    value: 8,
    delta: '+3 this week',
    trend: 'up',
    good: 'down',
    context: 'Total approvals frozen >14 days without owner action',
    severity: 'critical',
  },
  {
    id: 'workflow-health',
    label: 'Workflow Health',
    value: '62%',
    delta: '-11pp vs last month',
    trend: 'down',
    good: 'up',
    context: '38% of tracked workflows have at least one bottleneck',
    severity: 'high',
  },
  {
    id: 'rec-backlog',
    label: 'Decision Backlog',
    value: 14,
    delta: '6 critical',
    trend: 'up',
    good: 'down',
    context: 'Unaddressed recommendations pending human decision',
    severity: 'high',
  },
  {
    id: 'evidence-coverage',
    label: 'Evidence Coverage',
    value: '94%',
    delta: '+2pp',
    trend: 'up',
    good: 'up',
    context: 'Decisions with full evidence chain attached',
  },
];

export const overviewSummary: OverviewSummary = {
  headline: 'Revenue exposure elevated — approval chain failure is the root cause',
  body: 'Lyte has detected a compound risk cluster centered on the Vantex Acquisition approval chain failure. The $4.2M deal has been stalled 47 days due to a departed VP with no recorded handoff. Three automated escalation attempts were blocked by policy. The approval chain is self-locked. Simultaneously, Workflow Health has declined 11pp this month — 38% of tracked workflows carry at least one bottleneck. The Decision Center holds 6 critical-urgency recommendations awaiting executive action.',
  generatedAt: '2026-04-18T07:00:00Z',
  confidence: 0.91,
  freshness: 'live',
  proofRef: 'LYTE-W-0491',
};

// ─── Signals Console ─────────────────────────────────────────────────────────

export type SignalType =
  | 'approval_chain_stall'
  | 'revenue_risk'
  | 'deliverable_overdue'
  | 'ownership_gap'
  | 'buyer_engagement_decay'
  | 'workflow_bottleneck'
  | 'policy_violation'
  | 'escalation_blocked'
  | 'stakeholder_churn'
  | 'budget_leakage';

export interface SignalItem {
  id: string;
  type: SignalType;
  severity: Severity;
  title: string;
  body: string;
  source: string;
  confidence: number;
  freshness: FreshnessLevel;
  detectedAt: string;
  linkedEntityId: string;
  linkedEntityType: string;
  linkedEntityLabel: string;
  policyState: PolicyState;
  proofRef: string;
  tags: string[];
}

export const signalItems: SignalItem[] = [
  {
    id: 'sig-001',
    type: 'approval_chain_stall',
    severity: 'critical',
    title: 'Approval chain void — Vantex deal blocked at step 1 for 47 days',
    body: 'The BD Qualification Sign-off step has no valid owner. The original approver (Chris Wade) departed 2026-02-28 with no recorded handoff. Three automated escalation attempts were blocked by policy. The entire chain is frozen.',
    source: 'Lyte — Approval Chain Monitor',
    confidence: 0.96,
    freshness: 'live',
    detectedAt: '2026-04-14T08:22:00Z',
    linkedEntityId: 'lyte-chain-vantex-001',
    linkedEntityType: 'approval_chain',
    linkedEntityLabel: 'Vantex Procurement Approval Chain',
    policyState: 'flagged',
    proofRef: 'LYTE-W-0491',
    tags: ['approval', 'revenue-risk', 'Q2', 'vantex'],
  },
  {
    id: 'sig-002',
    type: 'revenue_risk',
    severity: 'critical',
    title: '$4.2M Q2 deal — close probability collapsed from 84% to 31%',
    body: 'Vantex Acquisition close probability has declined 53 percentage points over 47 days of inactivity. At current trajectory, deal will fall out of Q2 and require full restart in Q3 with estimated 60% probability of permanent loss.',
    source: 'Lyte — Revenue Risk Monitor',
    confidence: 0.91,
    freshness: 'live',
    detectedAt: '2026-04-14T08:22:00Z',
    linkedEntityId: 'lyte-opp-vantex-001',
    linkedEntityType: 'opportunity',
    linkedEntityLabel: 'Vantex Acquisition — Q2 Close',
    policyState: 'flagged',
    proofRef: 'LYTE-W-0492',
    tags: ['revenue', 'pipeline', 'Q2', 'vantex'],
  },
  {
    id: 'sig-003',
    type: 'deliverable_overdue',
    severity: 'high',
    title: 'Buyer proposal stalled 22 days past revision target',
    body: 'Vantex Buyer Proposal v3 has not been advanced in 22 days. Original revision target was 2026-04-10. Proposal cannot be updated without re-establishing approval authority.',
    source: 'Lyte — Deliverable Monitor',
    confidence: 0.88,
    freshness: 'live',
    detectedAt: '2026-04-14T08:25:00Z',
    linkedEntityId: 'lyte-del-proposal-001',
    linkedEntityType: 'deliverable',
    linkedEntityLabel: 'Vantex Buyer Proposal v3',
    policyState: 'blocked',
    proofRef: 'LYTE-W-0493',
    tags: ['deliverable', 'vantex', 'proposal'],
  },
  {
    id: 'sig-004',
    type: 'ownership_gap',
    severity: 'high',
    title: 'Procurement Lead sent 3 internal reminders — all landed in void',
    body: 'Tyler Raines escalated internally on 2026-03-15, 2026-03-25, and 2026-04-03. All escalations landed in a void because the authority chain above him (Chris Wade) has no successor. Workflow is deadlocked.',
    source: 'Lyte — Workflow Pattern Detector',
    confidence: 0.83,
    freshness: 'recent',
    detectedAt: '2026-04-14T08:27:00Z',
    linkedEntityId: 'lyte-chain-vantex-001',
    linkedEntityType: 'approval_chain',
    linkedEntityLabel: 'Vantex Procurement Approval Chain',
    policyState: 'flagged',
    proofRef: 'LYTE-W-0494',
    tags: ['ownership', 'escalation', 'procurement'],
  },
  {
    id: 'sig-005',
    type: 'buyer_engagement_decay',
    severity: 'medium',
    title: 'Buyer contact engagement decaying — last meaningful reply 28 days ago',
    body: "Vantex's primary contact (David Chen, Head of Corp Dev) last replied substantively on 2026-03-17. He opened the proposal on 2026-03-31 but did not respond. Silence exceeding 21 days is a strong churn predictor.",
    source: 'Lyte — Buyer Engagement Monitor',
    confidence: 0.78,
    freshness: 'recent',
    detectedAt: '2026-04-14T08:30:00Z',
    linkedEntityId: 'lyte-opp-vantex-001',
    linkedEntityType: 'opportunity',
    linkedEntityLabel: 'Vantex Acquisition — Q2 Close',
    policyState: 'conditional',
    proofRef: 'LYTE-W-0495',
    tags: ['buyer', 'engagement', 'churn'],
  },
  {
    id: 'sig-006',
    type: 'workflow_bottleneck',
    severity: 'high',
    title: 'Q2 Pipeline Execution project: 3 concurrent blockers detected',
    body: 'The Q2 Pipeline Execution project has 3 simultaneous blockers: approval chain freeze, deliverable overdue, and legal review blocked. Combined value at risk: $7.8M.',
    source: 'Lyte — Workflow Health',
    confidence: 0.89,
    freshness: 'live',
    detectedAt: '2026-04-15T09:00:00Z',
    linkedEntityId: 'lyte-proj-q2-pipeline-001',
    linkedEntityType: 'project',
    linkedEntityLabel: 'Q2 Pipeline Execution',
    policyState: 'flagged',
    proofRef: 'LYTE-W-0496',
    tags: ['workflow', 'bottleneck', 'pipeline'],
  },
  {
    id: 'sig-007',
    type: 'escalation_blocked',
    severity: 'critical',
    title: 'Automated escalation policy blocked — no authority holder in chain',
    body: 'Lyte attempted to auto-escalate the Vantex approval chain 3 times. Each attempt was blocked by policy because no valid authority holder exists at the target escalation node. Manual executive override required.',
    source: 'Lyte — Policy Engine',
    confidence: 0.97,
    freshness: 'live',
    detectedAt: '2026-04-14T08:35:00Z',
    linkedEntityId: 'lyte-chain-vantex-001',
    linkedEntityType: 'approval_chain',
    linkedEntityLabel: 'Vantex Procurement Approval Chain',
    policyState: 'blocked',
    proofRef: 'LYTE-W-0497',
    tags: ['policy', 'escalation', 'blocked'],
  },
  {
    id: 'sig-008',
    type: 'approval_chain_stall',
    severity: 'high',
    title: 'Meridian Portfolio Co #7 — approval gap mirrors Vantex pattern',
    body: 'Portfolio Company 7 (Stratford Partners) shows identical pattern: departed approval owner, stalled chain, 28 days without advancement. $1.8M opportunity at risk.',
    source: 'Lyte — Portfolio Scan',
    confidence: 0.81,
    freshness: 'recent',
    detectedAt: '2026-04-15T10:00:00Z',
    linkedEntityId: 'lyte-opp-stratford-001',
    linkedEntityType: 'opportunity',
    linkedEntityLabel: 'Stratford Partners Expansion',
    policyState: 'flagged',
    proofRef: 'LYTE-W-0498',
    tags: ['portfolio', 'approval', 'pattern'],
  },
  {
    id: 'sig-009',
    type: 'budget_leakage',
    severity: 'medium',
    title: 'Q2 marketing budget: 23% unallocated with 6 weeks remaining',
    body: 'Marketing Operations has not allocated $340K of the Q2 budget. Approval for reallocation has been pending 19 days. Budget expires end of quarter with no carryover policy.',
    source: 'Lyte — Finance Monitor',
    confidence: 0.74,
    freshness: 'recent',
    detectedAt: '2026-04-16T08:00:00Z',
    linkedEntityId: 'lyte-proj-marketing-q2',
    linkedEntityType: 'project',
    linkedEntityLabel: 'Q2 Marketing Budget',
    policyState: 'pending',
    proofRef: 'LYTE-W-0499',
    tags: ['budget', 'finance', 'Q2'],
  },
  {
    id: 'sig-010',
    type: 'policy_violation',
    severity: 'medium',
    title: '3 approval chains referencing departed employees — policy audit required',
    body: 'Platform-wide scan found 3 additional approval chains that reference staff who departed in the last 90 days. None have been updated since departure. Combined exposure: $3.4M.',
    source: 'Lyte — Policy Compliance Scanner',
    confidence: 0.86,
    freshness: 'live',
    detectedAt: '2026-04-16T07:30:00Z',
    linkedEntityId: 'lyte-proj-q2-pipeline-001',
    linkedEntityType: 'project',
    linkedEntityLabel: 'Q2 Pipeline Execution',
    policyState: 'flagged',
    proofRef: 'LYTE-W-0500',
    tags: ['policy', 'compliance', 'offboarding'],
  },
];

// ─── Entity Graph ─────────────────────────────────────────────────────────────

export type EntityNodeType =
  | 'opportunity'
  | 'approval_chain'
  | 'project'
  | 'stakeholder'
  | 'deliverable'
  | 'signal'
  | 'recommendation';

export interface EntityNode {
  id: string;
  type: EntityNodeType;
  label: string;
  sublabel?: string;
  status: 'active' | 'stalled' | 'blocked' | 'at_risk' | 'cleared' | 'void' | 'pending';
  severity?: Severity;
  policyState: PolicyState;
  confidence: number;
  freshness: FreshnessLevel;
  x: number;
  y: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface EntityEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  type: 'owns' | 'blocks' | 'requires' | 'linked_to' | 'escalates_to' | 'produces';
  strength: 'strong' | 'weak';
  status: 'active' | 'broken' | 'stalled';
}

export const entityNodes: EntityNode[] = [
  {
    id: 'lyte-opp-vantex-001',
    type: 'opportunity',
    label: 'Vantex Acquisition',
    sublabel: '$4.2M · 47d stalled',
    status: 'stalled',
    severity: 'critical',
    policyState: 'flagged',
    confidence: 0.91,
    freshness: 'stale',
    x: 400,
    y: 200,
    metadata: { estimatedValueUsd: 4200000, closeProbability: 0.31, stalledDays: 47 },
  },
  {
    id: 'lyte-chain-vantex-001',
    type: 'approval_chain',
    label: 'Procurement Approval Chain',
    sublabel: 'Step 1/4 — void owner',
    status: 'stalled',
    severity: 'critical',
    policyState: 'blocked',
    confidence: 0.96,
    freshness: 'live',
    x: 400,
    y: 360,
    metadata: { currentStep: 1, totalSteps: 4, stalledDays: 47 },
  },
  {
    id: 'lyte-proj-q2-pipeline-001',
    type: 'project',
    label: 'Q2 Pipeline Execution',
    sublabel: '$7.8M at risk · 3 blockers',
    status: 'at_risk',
    severity: 'high',
    policyState: 'flagged',
    confidence: 0.89,
    freshness: 'live',
    x: 160,
    y: 200,
    metadata: { blockerCount: 3, valueAtRiskUsd: 7800000 },
  },
  {
    id: 'lyte-sh-chris-001',
    type: 'stakeholder',
    label: 'Chris Wade',
    sublabel: 'VP BD · Departed',
    status: 'void',
    severity: 'critical',
    policyState: 'blocked',
    confidence: 1.0,
    freshness: 'expired',
    x: 160,
    y: 400,
    metadata: { role: 'VP BD', approvalAuthority: true },
  },
  {
    id: 'lyte-sh-tyler-001',
    type: 'stakeholder',
    label: 'Tyler Raines',
    sublabel: 'Procurement Lead · Stalled',
    status: 'stalled',
    severity: 'high',
    policyState: 'pending',
    confidence: 0.9,
    freshness: 'recent',
    x: 340,
    y: 500,
    metadata: { role: 'Procurement Lead', approvalAuthority: true },
  },
  {
    id: 'lyte-sh-ana-001',
    type: 'stakeholder',
    label: 'Ana Kovac',
    sublabel: 'General Counsel · Waiting',
    status: 'pending',
    severity: 'medium',
    policyState: 'pending',
    confidence: 0.88,
    freshness: 'recent',
    x: 500,
    y: 500,
    metadata: { role: 'General Counsel', approvalAuthority: true },
  },
  {
    id: 'lyte-sh-marcus-001',
    type: 'stakeholder',
    label: 'Marcus Holt',
    sublabel: 'CFO · Escalation Target',
    status: 'active',
    policyState: 'cleared',
    confidence: 0.95,
    freshness: 'live',
    x: 640,
    y: 360,
    metadata: { role: 'CFO', approvalAuthority: true },
  },
  {
    id: 'lyte-sh-sarah-001',
    type: 'stakeholder',
    label: 'Sarah Kim',
    sublabel: 'VP BD · New Owner',
    status: 'active',
    policyState: 'cleared',
    confidence: 0.92,
    freshness: 'live',
    x: 600,
    y: 200,
    metadata: { role: 'VP BD', approvalAuthority: false },
  },
  {
    id: 'lyte-del-proposal-001',
    type: 'deliverable',
    label: 'Buyer Proposal v3',
    sublabel: 'Stalled 22d',
    status: 'stalled',
    severity: 'high',
    policyState: 'blocked',
    confidence: 0.88,
    freshness: 'stale',
    x: 200,
    y: 320,
    metadata: { type: 'presentation', stalledDays: 22 },
  },
  {
    id: 'lyte-del-legal-001',
    type: 'deliverable',
    label: 'Legal Review Package',
    sublabel: 'Blocked 30d',
    status: 'blocked',
    severity: 'high',
    policyState: 'blocked',
    confidence: 0.85,
    freshness: 'stale',
    x: 590,
    y: 465,
    metadata: { type: 'contract', stalledDays: 30 },
  },
];

export const entityEdges: EntityEdge[] = [
  {
    id: 'e-01',
    sourceId: 'lyte-opp-vantex-001',
    targetId: 'lyte-chain-vantex-001',
    label: 'requires',
    type: 'requires',
    strength: 'strong',
    status: 'stalled',
  },
  {
    id: 'e-02',
    sourceId: 'lyte-proj-q2-pipeline-001',
    targetId: 'lyte-opp-vantex-001',
    label: 'contains',
    type: 'linked_to',
    strength: 'strong',
    status: 'stalled',
  },
  {
    id: 'e-03',
    sourceId: 'lyte-chain-vantex-001',
    targetId: 'lyte-sh-chris-001',
    label: 'step 1 owner (void)',
    type: 'requires',
    strength: 'strong',
    status: 'broken',
  },
  {
    id: 'e-04',
    sourceId: 'lyte-chain-vantex-001',
    targetId: 'lyte-sh-tyler-001',
    label: 'step 2 owner (stalled)',
    type: 'requires',
    strength: 'strong',
    status: 'stalled',
  },
  {
    id: 'e-05',
    sourceId: 'lyte-chain-vantex-001',
    targetId: 'lyte-sh-ana-001',
    label: 'step 3 (pending)',
    type: 'requires',
    strength: 'weak',
    status: 'stalled',
  },
  {
    id: 'e-06',
    sourceId: 'lyte-chain-vantex-001',
    targetId: 'lyte-sh-marcus-001',
    label: 'escalation target',
    type: 'escalates_to',
    strength: 'strong',
    status: 'active',
  },
  {
    id: 'e-07',
    sourceId: 'lyte-opp-vantex-001',
    targetId: 'lyte-sh-sarah-001',
    label: 'assigned owner',
    type: 'owns',
    strength: 'strong',
    status: 'active',
  },
  {
    id: 'e-08',
    sourceId: 'lyte-proj-q2-pipeline-001',
    targetId: 'lyte-del-proposal-001',
    label: 'produces',
    type: 'produces',
    strength: 'strong',
    status: 'stalled',
  },
  {
    id: 'e-09',
    sourceId: 'lyte-chain-vantex-001',
    targetId: 'lyte-del-legal-001',
    label: 'blocks',
    type: 'blocks',
    strength: 'strong',
    status: 'broken',
  },
  {
    id: 'e-10',
    sourceId: 'lyte-sh-tyler-001',
    targetId: 'lyte-sh-marcus-001',
    label: 'escalates to',
    type: 'escalates_to',
    strength: 'weak',
    status: 'active',
  },
];

// ─── Decision Center ──────────────────────────────────────────────────────────

export interface DecisionRecommendation {
  id: string;
  title: string;
  summary: string;
  reasoning: string;
  domain: string;
  confidence: number;
  freshness: FreshnessLevel;
  urgency: UrgencyLevel;
  priority: number;
  policyState: PolicyState;
  approvalState: 'none' | 'pending' | 'approved' | 'rejected' | 'escalated';
  businessImpact: {
    financialExposureUsd: number;
    affectedEntities: number;
    reputationalRisk: 'none' | 'low' | 'medium' | 'high' | 'critical';
    regulatoryExposure: boolean;
  };
  suggestedAction: string;
  suggestedOwner: string;
  evidence: Array<{ label: string; value: string; source?: string }>;
  projectedImpact: {
    primaryMetricLabel: string;
    primaryMetricBefore: number;
    primaryMetricAfter: number;
    daysToRecovery: number;
    estimatedValueCapture: number;
    confidenceInProjection: number;
  };
  projectedRisk: {
    ifIgnored: string;
    probabilityOfLoss: number;
    estimatedLostRevenue: number;
    timeToPointOfNoReturn: string;
  };
  linkedSignalIds: string[];
  linkedEntityIds: string[];
  proofRef: string;
  createdAt: string;
  expiresAt?: string;
}

export const decisionRecommendations: DecisionRecommendation[] = [
  {
    id: 'rec-001',
    title: 'Emergency CFO escalation — reassign Vantex approval chain and restart deal',
    summary:
      'Invoke CFO authority override to void the stalled approval chain, reassign ownership to Sarah Kim (VP BD), and restart the Vantex acquisition process immediately.',
    reasoning:
      'The approval chain is deadlocked at a void step with no self-resolution path. Only executive override can restart it. Historical data shows that deals stalled >40 days with buyer silence >21 days recover successfully only with C-suite direct involvement. 78% historical close rate with direct CFO sponsorship at this stage.',
    domain: 'lyte',
    confidence: 0.87,
    freshness: 'live',
    urgency: 'critical',
    priority: 98,
    policyState: 'conditional',
    approvalState: 'pending',
    businessImpact: {
      financialExposureUsd: 4200000,
      affectedEntities: 5,
      reputationalRisk: 'medium',
      regulatoryExposure: false,
    },
    suggestedAction:
      'CFO invokes authority override, voids step 1 of approval chain, assigns Sarah Kim as new approval owner, CFO joins next buyer call directly.',
    suggestedOwner: 'Marcus Holt (CFO)',
    evidence: [
      {
        label: 'Days stalled',
        value: '47 days (threshold: 21 days for auto-escalation)',
        source: 'Lyte Signal Monitor',
      },
      {
        label: 'Close probability',
        value: '31% (was 84% — 53pp decline)',
        source: 'Pipeline Analytics',
      },
      {
        label: 'Last buyer response',
        value: '2026-03-17 (28 days ago)',
        source: 'CRM Activity Log',
      },
      {
        label: 'Historical precedent',
        value: '78% close rate with CFO-direct sponsorship at this stage',
        source: 'Lyte Evidence Graph',
      },
      {
        label: 'Approval chain status',
        value: 'Frozen at step 1 of 4 — void owner for 47 days',
        source: 'Workflow Monitor',
      },
      {
        label: 'Escalation attempts',
        value: '3 attempts blocked by policy (no authority holder)',
        source: 'Lyte Audit Log',
      },
    ],
    projectedImpact: {
      primaryMetricLabel: 'Close Probability',
      primaryMetricBefore: 0.31,
      primaryMetricAfter: 0.74,
      daysToRecovery: 3,
      estimatedValueCapture: 4200000,
      confidenceInProjection: 0.82,
    },
    projectedRisk: {
      ifIgnored:
        'Deal falls out of Q2. Full restart required in Q3 with 60% probability of permanent loss. Board will question Q2 miss.',
      probabilityOfLoss: 0.6,
      estimatedLostRevenue: 4200000,
      timeToPointOfNoReturn: '7 days',
    },
    linkedSignalIds: ['sig-001', 'sig-002', 'sig-004', 'sig-007'],
    linkedEntityIds: ['lyte-opp-vantex-001', 'lyte-chain-vantex-001', 'lyte-sh-marcus-001'],
    proofRef: 'LYTE-REC-001',
    createdAt: '2026-04-14T08:24:00Z',
    expiresAt: '2026-04-21T23:59:59Z',
  },
  {
    id: 'rec-002',
    title: 'Platform-wide approval chain audit — prevent recurrence across portfolio',
    summary:
      'Run an audit of all active approval chains referencing staff who departed in the last 90 days. Reassign or void all stalled steps. Require handoff attestation in offboarding.',
    reasoning:
      'The Vantex situation is a systemic failure pattern. 3 of 14 portfolio companies show similar approval gaps this quarter. A full audit prevents $7.2M additional revenue risk crystallizing in Q2.',
    domain: 'lyte',
    confidence: 0.84,
    freshness: 'live',
    urgency: 'urgent',
    priority: 72,
    policyState: 'cleared',
    approvalState: 'none',
    businessImpact: {
      financialExposureUsd: 7200000,
      affectedEntities: 22,
      reputationalRisk: 'low',
      regulatoryExposure: false,
    },
    suggestedAction:
      'Deploy Lyte approval-chain audit across all active workflows. Auto-void steps with departed owners. Require hand-off attestation as part of offboarding.',
    suggestedOwner: 'Sarah Kim (VP BD) + HR Operations',
    evidence: [
      {
        label: 'Companies with similar gaps',
        value: '3 of 14 portfolio companies',
        source: 'Lyte Portfolio Scan',
      },
      {
        label: 'Additional value at risk',
        value: '$7.2M across 3 companies',
        source: 'Pipeline Analytics',
      },
      {
        label: 'Root cause',
        value: 'No mandatory handoff on departure for approval chains',
        source: 'Process Audit',
      },
      {
        label: 'Policy gap',
        value: "Offboarding checklist missing: 'Approval chain handoff attestation'",
        source: 'Policy Engine',
      },
    ],
    projectedImpact: {
      primaryMetricLabel: 'Pipeline at Risk',
      primaryMetricBefore: 7200000,
      primaryMetricAfter: 1800000,
      daysToRecovery: 14,
      estimatedValueCapture: 5400000,
      confidenceInProjection: 0.71,
    },
    projectedRisk: {
      ifIgnored: 'Additional $7.2M at risk across 3 similar situations compounding through Q2.',
      probabilityOfLoss: 0.35,
      estimatedLostRevenue: 7200000,
      timeToPointOfNoReturn: '21 days',
    },
    linkedSignalIds: ['sig-008', 'sig-010'],
    linkedEntityIds: ['lyte-proj-q2-pipeline-001'],
    proofRef: 'LYTE-REC-002',
    createdAt: '2026-04-15T09:00:00Z',
  },
  {
    id: 'rec-003',
    title: 'Reallocate unspent Q2 marketing budget before quarter-end expiry',
    summary:
      'Approve reallocation of $340K unspent Q2 marketing budget to high-conversion pipeline acceleration programs before June 30 expiry.',
    reasoning:
      'Budget expires with no carryover policy. 23% of Q2 allocation is unspent with 6 weeks remaining. Comparable reallocation to pipeline acceleration has 2.3x ROI historical average.',
    domain: 'lyte',
    confidence: 0.74,
    freshness: 'recent',
    urgency: 'moderate',
    priority: 55,
    policyState: 'cleared',
    approvalState: 'none',
    businessImpact: {
      financialExposureUsd: 340000,
      affectedEntities: 3,
      reputationalRisk: 'none',
      regulatoryExposure: false,
    },
    suggestedAction:
      'Finance Director approves reallocation of $340K to pipeline acceleration programs identified by Sales Operations.',
    suggestedOwner: 'Finance Director',
    evidence: [
      {
        label: 'Unspent budget',
        value: '$340K of $1.48M Q2 budget (23%)',
        source: 'Finance System',
      },
      {
        label: 'Days until expiry',
        value: '42 days (no carryover policy)',
        source: 'Budget Policy',
      },
      {
        label: 'Historical ROI',
        value: '2.3x average ROI on comparable reallocations',
        source: 'Lyte Evidence Graph',
      },
    ],
    projectedImpact: {
      primaryMetricLabel: 'Pipeline Acceleration',
      primaryMetricBefore: 0,
      primaryMetricAfter: 782000,
      daysToRecovery: 30,
      estimatedValueCapture: 782000,
      confidenceInProjection: 0.65,
    },
    projectedRisk: {
      ifIgnored:
        'Budget expires. $340K opportunity cost. Missed acceleration window for stalled pipeline.',
      probabilityOfLoss: 1.0,
      estimatedLostRevenue: 340000,
      timeToPointOfNoReturn: '42 days',
    },
    linkedSignalIds: ['sig-009'],
    linkedEntityIds: [],
    proofRef: 'LYTE-REC-003',
    createdAt: '2026-04-16T08:00:00Z',
  },
];

export interface SimulationScenarioDisplay {
  id: string;
  recommendationId: string;
  name: string;
  description: string;
  action: string;
  projected: {
    closeProbability: number;
    daysToRecovery: number;
    revenueCapture: number;
    confidence: number;
  };
  downstreamEffects: Array<{
    entity: string;
    effect: string;
    magnitude: 'high' | 'medium' | 'low';
  }>;
  highlight: boolean;
}

export const simulationScenarios: SimulationScenarioDisplay[] = [
  {
    id: 'sim-cfo-escalation',
    recommendationId: 'rec-001',
    name: 'CFO Emergency Escalation',
    description:
      'CFO invokes authority override, voids void step, reassigns to Sarah Kim, joins buyer call personally.',
    action: 'execute_recommendation:rec-001',
    projected: {
      closeProbability: 0.74,
      daysToRecovery: 3,
      revenueCapture: 4200000,
      confidence: 0.82,
    },
    downstreamEffects: [
      {
        entity: 'Approval Chain',
        effect: 'Step 1 voided, Sarah Kim assigned, chain unblocked',
        magnitude: 'high',
      },
      {
        entity: 'Buyer Proposal v3',
        effect: 'Unlocked for revision, delivery target: 48h',
        magnitude: 'high',
      },
      {
        entity: 'Legal Review Package',
        effect: 'Procurement proceeds, legal review within 72h',
        magnitude: 'high',
      },
      {
        entity: 'Q2 Pipeline ($18M target)',
        effect: '+$4.2M restored to closeable column',
        magnitude: 'high',
      },
      {
        entity: 'Buyer Relationship',
        effect: 'CFO personal outreach resets engagement',
        magnitude: 'medium',
      },
    ],
    highlight: true,
  },
  {
    id: 'sim-partial',
    recommendationId: 'rec-001',
    name: 'Procurement Reassignment Only',
    description: 'Tyler Raines self-escalates to VP level only. CFO not directly involved.',
    action: 'partial_escalation:procurement_level',
    projected: {
      closeProbability: 0.51,
      daysToRecovery: 9,
      revenueCapture: 3100000,
      confidence: 0.61,
    },
    downstreamEffects: [
      {
        entity: 'Approval Chain',
        effect: 'Step 1 reassigned but policy review adds 4-5 days',
        magnitude: 'medium',
      },
      { entity: 'Legal Review Package', effect: 'Delayed 10+ days total', magnitude: 'medium' },
      {
        entity: 'Buyer Relationship',
        effect: 'No executive signal — buyer may disengage',
        magnitude: 'high',
      },
    ],
    highlight: false,
  },
  {
    id: 'sim-no-action',
    recommendationId: 'rec-001',
    name: 'No Action (Current Trajectory)',
    description: 'Leave the approval chain frozen. Allow deal to continue drifting.',
    action: 'none',
    projected: { closeProbability: 0.12, daysToRecovery: 0, revenueCapture: 0, confidence: 0.88 },
    downstreamEffects: [
      {
        entity: 'Vantex Deal',
        effect: 'Falls out of Q2 entirely by 2026-04-25',
        magnitude: 'high',
      },
      {
        entity: 'Q2 Revenue Target',
        effect: '$4.2M gap against $18M board target (23%)',
        magnitude: 'high',
      },
      {
        entity: 'Buyer Relationship',
        effect: 'High churn probability — competitor likely to engage',
        magnitude: 'high',
      },
      {
        entity: 'Portfolio ($7.2M exposure)',
        effect: 'Compounds — 3 similar gaps left unaddressed',
        magnitude: 'high',
      },
    ],
    highlight: false,
  },
];

// ─── Workflow Health ──────────────────────────────────────────────────────────

export interface WorkflowItem {
  id: string;
  name: string;
  type: 'approval' | 'execution' | 'review' | 'escalation' | 'onboarding' | 'reporting';
  owner: string;
  status: 'on_track' | 'at_risk' | 'stalled' | 'blocked' | 'complete';
  progress: number;
  stalledDays?: number;
  blockerCount: number;
  valueAtRiskUsd?: number;
  bottleneckStep?: string;
  bottleneckOwner?: string;
  linkedEntityId?: string;
  linkedEntityLabel?: string;
  slaDeadline?: string;
  slaBreach: boolean;
  proofRef: string;
  lastActivity: string;
}

export const workflowItems: WorkflowItem[] = [
  {
    id: 'wf-001',
    name: 'Vantex Procurement Approval Chain',
    type: 'approval',
    owner: 'Chris Wade → [VOID]',
    status: 'stalled',
    progress: 18,
    stalledDays: 47,
    blockerCount: 3,
    valueAtRiskUsd: 4200000,
    bottleneckStep: 'BD Qualification Sign-off',
    bottleneckOwner: 'VOID — original owner departed',
    linkedEntityId: 'lyte-chain-vantex-001',
    linkedEntityLabel: 'Vantex Procurement Approval Chain',
    slaDeadline: '2026-03-31',
    slaBreach: true,
    proofRef: 'LYTE-WF-001',
    lastActivity: '2026-02-28',
  },
  {
    id: 'wf-002',
    name: 'Q2 Pipeline Execution',
    type: 'execution',
    owner: 'Sarah Kim',
    status: 'at_risk',
    progress: 52,
    stalledDays: 22,
    blockerCount: 3,
    valueAtRiskUsd: 7800000,
    bottleneckStep: 'Approval Gate — Vantex',
    bottleneckOwner: 'Approval chain void',
    linkedEntityId: 'lyte-proj-q2-pipeline-001',
    linkedEntityLabel: 'Q2 Pipeline Execution',
    slaDeadline: '2026-06-30',
    slaBreach: false,
    proofRef: 'LYTE-WF-002',
    lastActivity: '2026-04-13',
  },
  {
    id: 'wf-003',
    name: 'Legal Review — Vantex Package',
    type: 'review',
    owner: 'Ana Kovac',
    status: 'blocked',
    progress: 0,
    stalledDays: 30,
    blockerCount: 1,
    valueAtRiskUsd: 4200000,
    bottleneckStep: 'Awaiting Procurement clearance',
    bottleneckOwner: 'Tyler Raines (Procurement Lead)',
    linkedEntityId: 'lyte-del-legal-001',
    linkedEntityLabel: 'Legal Review Package — Vantex',
    slaDeadline: '2026-04-08',
    slaBreach: true,
    proofRef: 'LYTE-WF-003',
    lastActivity: '2026-04-01',
  },
  {
    id: 'wf-004',
    name: 'Q2 Marketing Budget Reallocation',
    type: 'approval',
    owner: 'Finance Director',
    status: 'at_risk',
    progress: 35,
    stalledDays: 19,
    blockerCount: 1,
    valueAtRiskUsd: 340000,
    bottleneckStep: 'Finance Director approval pending',
    bottleneckOwner: 'Finance Director',
    slaDeadline: '2026-06-30',
    slaBreach: false,
    proofRef: 'LYTE-WF-004',
    lastActivity: '2026-04-03',
  },
  {
    id: 'wf-005',
    name: 'Employee Offboarding — Chris Wade',
    type: 'onboarding',
    owner: 'HR Operations',
    status: 'stalled',
    progress: 70,
    stalledDays: 47,
    blockerCount: 1,
    bottleneckStep: 'Approval chain handoff attestation — MISSING',
    bottleneckOwner: 'HR Operations (uncompleted)',
    slaDeadline: '2026-03-07',
    slaBreach: true,
    proofRef: 'LYTE-WF-005',
    lastActivity: '2026-03-01',
  },
  {
    id: 'wf-006',
    name: 'Stratford Partners Expansion — Approval',
    type: 'approval',
    owner: 'Portfolio Manager',
    status: 'at_risk',
    progress: 25,
    stalledDays: 28,
    blockerCount: 2,
    valueAtRiskUsd: 1800000,
    bottleneckStep: 'Departed owner at step 2',
    bottleneckOwner: 'VOID — mirrors Vantex pattern',
    slaDeadline: '2026-05-31',
    slaBreach: false,
    proofRef: 'LYTE-WF-006',
    lastActivity: '2026-03-22',
  },
  {
    id: 'wf-007',
    name: 'Board Deck Assembly — Q2',
    type: 'reporting',
    owner: 'Strategy Team',
    status: 'on_track',
    progress: 88,
    blockerCount: 0,
    slaDeadline: '2026-04-25',
    slaBreach: false,
    proofRef: 'LYTE-WF-007',
    lastActivity: '2026-04-17',
  },
  {
    id: 'wf-008',
    name: 'New Partner Onboarding — Meridian Ventures',
    type: 'onboarding',
    owner: 'Operations Lead',
    status: 'on_track',
    progress: 65,
    blockerCount: 0,
    slaDeadline: '2026-04-30',
    slaBreach: false,
    proofRef: 'LYTE-WF-008',
    lastActivity: '2026-04-16',
  },
];

// ─── Run Console ──────────────────────────────────────────────────────────────

export type RunStatus = 'completed' | 'running' | 'failed' | 'queued' | 'cancelled' | 'rolled_back';

export interface RunItem {
  id: string;
  agentId: string;
  agentName: string;
  type:
    | 'signal_scan'
    | 'recommendation_generation'
    | 'policy_evaluation'
    | 'escalation_attempt'
    | 'approval_chain_audit'
    | 'portfolio_scan'
    | 'simulation_run';
  status: RunStatus;
  trigger: 'scheduled' | 'signal' | 'manual' | 'policy';
  entityId?: string;
  entityLabel?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  outcome?: string;
  tokensUsed?: number;
  proofRef: string;
  policyState: PolicyState;
}

export const runItems: RunItem[] = [
  {
    id: 'run-001',
    agentId: 'lyte-agent-01',
    agentName: 'Lyte Signal Scanner',
    type: 'signal_scan',
    status: 'completed',
    trigger: 'scheduled',
    startedAt: '2026-04-18T07:00:00Z',
    completedAt: '2026-04-18T07:00:43Z',
    durationMs: 43000,
    outcome: '47 signals active. 12 critical. 3 new critical signals surfaced since last run.',
    tokensUsed: 4821,
    proofRef: 'LYTE-RUN-001',
    policyState: 'cleared',
  },
  {
    id: 'run-002',
    agentId: 'lyte-agent-02',
    agentName: 'Approval Chain Monitor',
    type: 'approval_chain_audit',
    status: 'completed',
    trigger: 'signal',
    entityId: 'lyte-chain-vantex-001',
    entityLabel: 'Vantex Procurement Approval Chain',
    startedAt: '2026-04-18T07:01:00Z',
    completedAt: '2026-04-18T07:01:12Z',
    durationMs: 12000,
    outcome:
      'Chain void confirmed at step 1. 3 escalation attempts exhausted. Manual override required.',
    tokensUsed: 1203,
    proofRef: 'LYTE-RUN-002',
    policyState: 'blocked',
  },
  {
    id: 'run-003',
    agentId: 'lyte-agent-03',
    agentName: 'Decision Engine',
    type: 'recommendation_generation',
    status: 'completed',
    trigger: 'signal',
    entityId: 'lyte-opp-vantex-001',
    entityLabel: 'Vantex Acquisition',
    startedAt: '2026-04-14T08:23:00Z',
    completedAt: '2026-04-14T08:24:01Z',
    durationMs: 61000,
    outcome:
      'Generated rec-001: Emergency CFO escalation. Confidence 87%. Submitted to approval queue.',
    tokensUsed: 7844,
    proofRef: 'LYTE-RUN-003',
    policyState: 'conditional',
  },
  {
    id: 'run-004',
    agentId: 'lyte-agent-04',
    agentName: 'Policy Engine',
    type: 'policy_evaluation',
    status: 'completed',
    trigger: 'signal',
    entityId: 'lyte-chain-vantex-001',
    entityLabel: 'Vantex Procurement Approval Chain',
    startedAt: '2026-04-14T08:20:00Z',
    completedAt: '2026-04-14T08:20:03Z',
    durationMs: 3000,
    outcome:
      'Effect: block. No valid authority holder. Auto-escalation blocked. Human override required.',
    tokensUsed: 544,
    proofRef: 'LYTE-RUN-004',
    policyState: 'blocked',
  },
  {
    id: 'run-005',
    agentId: 'lyte-agent-05',
    agentName: 'Escalation Agent',
    type: 'escalation_attempt',
    status: 'failed',
    trigger: 'policy',
    entityId: 'lyte-chain-vantex-001',
    entityLabel: 'Vantex Procurement Approval Chain',
    startedAt: '2026-04-14T08:21:00Z',
    completedAt: '2026-04-14T08:21:04Z',
    durationMs: 4000,
    outcome: 'BLOCKED: No valid authority holder in escalation path. Policy effect: block.',
    tokensUsed: 122,
    proofRef: 'LYTE-RUN-005',
    policyState: 'blocked',
  },
  {
    id: 'run-006',
    agentId: 'lyte-agent-06',
    agentName: 'Portfolio Scanner',
    type: 'portfolio_scan',
    status: 'completed',
    trigger: 'scheduled',
    startedAt: '2026-04-15T06:00:00Z',
    completedAt: '2026-04-15T06:01:30Z',
    durationMs: 90000,
    outcome:
      '3 additional approval chains referencing departed employees. Combined exposure: $7.2M. Rec generated.',
    tokensUsed: 5211,
    proofRef: 'LYTE-RUN-006',
    policyState: 'cleared',
  },
  {
    id: 'run-007',
    agentId: 'lyte-agent-07',
    agentName: 'Simulation Engine',
    type: 'simulation_run',
    status: 'completed',
    trigger: 'manual',
    entityId: 'rec-001',
    entityLabel: 'Emergency CFO Escalation',
    startedAt: '2026-04-14T08:30:00Z',
    completedAt: '2026-04-14T08:30:08Z',
    durationMs: 8000,
    outcome:
      '3 scenarios simulated. Best path: CFO escalation — 74% close probability, 3d recovery, $4.2M capture.',
    tokensUsed: 2144,
    proofRef: 'LYTE-RUN-007',
    policyState: 'cleared',
  },
  {
    id: 'run-008',
    agentId: 'lyte-agent-01',
    agentName: 'Lyte Signal Scanner',
    type: 'signal_scan',
    status: 'running',
    trigger: 'scheduled',
    startedAt: '2026-04-18T08:00:00Z',
    proofRef: 'LYTE-RUN-008',
    policyState: 'cleared',
  },
];

// ─── Evidence Explorer ────────────────────────────────────────────────────────

export interface EvidenceItem {
  id: string;
  label: string;
  type: 'system' | 'human' | 'alloy' | 'signal' | 'document' | 'audit_log' | 'external';
  source: string;
  sourceId?: string;
  value: string;
  detail: string;
  linkedEntityId?: string;
  linkedEntityType?: string;
  linkedEntityLabel?: string;
  linkedRecommendationId?: string;
  freshness: FreshnessLevel;
  capturedAt: string;
  proofRef: string;
  confidence: number;
  chainRef?: string;
}

export const evidenceItems: EvidenceItem[] = [
  {
    id: 'ev-001',
    label: 'Approval chain status — void at step 1',
    type: 'system',
    source: 'Lyte Workflow Monitor',
    value: 'Frozen at step 1 of 4 — void owner for 47 days',
    detail:
      "System confirmed that step 1 ('BD Qualification Sign-off') has had no valid owner since 2026-02-28. The approver record references Chris Wade (emp_id: CW-4421) whose employment status is 'terminated' as of 2026-02-28.",
    linkedEntityId: 'lyte-chain-vantex-001',
    linkedEntityType: 'approval_chain',
    linkedEntityLabel: 'Vantex Procurement Approval Chain',
    linkedRecommendationId: 'rec-001',
    freshness: 'live',
    capturedAt: '2026-04-14T08:22:00Z',
    proofRef: 'LYTE-EV-001',
    confidence: 0.99,
    chainRef: 'LYTE-W-0491',
  },
  {
    id: 'ev-002',
    label: 'Close probability decline — 53pp over 47 days',
    type: 'signal',
    source: 'Pipeline Analytics',
    value: '31% (was 84% — 53pp decline over 47 days)',
    detail:
      "KORA's motion model computed close probability decline from 84% at deal entry (2026-02-28) to 31% at detection (2026-04-14). Decline rate: 1.13pp/day. Comparable deals at <35% probability after 45d stall have a 60% historical loss rate.",
    linkedEntityId: 'lyte-opp-vantex-001',
    linkedEntityType: 'opportunity',
    linkedEntityLabel: 'Vantex Acquisition — Q2 Close',
    linkedRecommendationId: 'rec-001',
    freshness: 'live',
    capturedAt: '2026-04-14T08:22:00Z',
    proofRef: 'LYTE-EV-002',
    confidence: 0.91,
    chainRef: 'LYTE-W-0492',
  },
  {
    id: 'ev-003',
    label: 'Last buyer contact — David Chen, 2026-03-17',
    type: 'system',
    source: 'CRM Activity Log (Salesforce)',
    value: '2026-03-17 — substantive reply from David Chen (Head of Corp Dev, Vantex)',
    detail:
      "David Chen replied on 2026-03-17 expressing continued interest but noting he was waiting on 'revised terms and timeline.' He opened the proposal attachment on 2026-03-31 at 14:22 UTC but did not respond. No buyer contact since.",
    linkedEntityId: 'lyte-opp-vantex-001',
    linkedEntityType: 'opportunity',
    linkedEntityLabel: 'Vantex Acquisition — Q2 Close',
    linkedRecommendationId: 'rec-001',
    freshness: 'stale',
    capturedAt: '2026-04-14T08:23:00Z',
    proofRef: 'LYTE-EV-003',
    confidence: 0.98,
    chainRef: 'LYTE-W-0492',
  },
  {
    id: 'ev-004',
    label: '3 escalation attempts blocked by policy',
    type: 'audit_log',
    source: 'Lyte Audit Log',
    value: '3 escalation attempts blocked by policy engine',
    detail:
      "Attempts on 2026-03-15, 2026-03-25, and 2026-04-03. Each blocked with effect 'block' — Policy: LYTE-POL-004 (require valid authority holder for approval escalation). No human review triggered because policy auto-block halted chain before notification.",
    linkedEntityId: 'lyte-chain-vantex-001',
    linkedEntityType: 'approval_chain',
    linkedEntityLabel: 'Vantex Procurement Approval Chain',
    linkedRecommendationId: 'rec-001',
    freshness: 'live',
    capturedAt: '2026-04-14T08:35:00Z',
    proofRef: 'LYTE-EV-004',
    confidence: 0.99,
    chainRef: 'LYTE-W-0497',
  },
  {
    id: 'ev-005',
    label: 'Historical pattern — 78% close rate with CFO sponsorship',
    type: 'alloy',
    source: 'Lyte Evidence Graph (pattern match)',
    value: '78% close rate with CFO-direct sponsorship at comparable stage',
    detail:
      'Pattern match across 23 comparable scenarios (deal stalled >35 days, buyer silence >14 days, approval chain frozen). Of 23 cases: CFO-direct: 78% close; VP-level escalation: 51% close; no action: 12% close. Current deal matches 4 of 5 pattern criteria.',
    linkedRecommendationId: 'rec-001',
    freshness: 'recent',
    capturedAt: '2026-04-14T08:24:00Z',
    proofRef: 'LYTE-EV-005',
    confidence: 0.82,
    chainRef: 'LYTE-W-0491',
  },
  {
    id: 'ev-006',
    label: 'Chris Wade offboarding — incomplete handoff attestation',
    type: 'audit_log',
    source: 'HR Information System',
    value:
      'Chris Wade offboarding checklist 70% complete — missing approval chain handoff attestation',
    detail:
      "Chris Wade (emp_id: CW-4421) departed 2026-02-28. Offboarding checklist item 'Approval chain handoff attestation' was never completed. HR Operations closed the offboarding record without this step.",
    linkedRecommendationId: 'rec-002',
    freshness: 'stale',
    capturedAt: '2026-04-15T09:00:00Z',
    proofRef: 'LYTE-EV-006',
    confidence: 0.97,
  },
  {
    id: 'ev-007',
    label: 'Portfolio scan — 3 additional chains with departed owners',
    type: 'system',
    source: 'Lyte Portfolio Scanner',
    value: '3 additional approval chains with departed owners',
    detail:
      'Scan of all 14 portfolio companies on 2026-04-15 identified: Stratford Partners (28d stall, $1.8M), Harbour Point Ltd (19d stall, $2.1M), Kestral Dynamics (14d stall, $3.3M). Combined additional exposure: $7.2M.',
    linkedRecommendationId: 'rec-002',
    freshness: 'recent',
    capturedAt: '2026-04-15T06:01:30Z',
    proofRef: 'LYTE-EV-007',
    confidence: 0.86,
  },
  {
    id: 'ev-008',
    label: 'Buyer proposal — 22 days past revision target',
    type: 'system',
    source: 'Lyte Deliverable Monitor',
    value: 'Vantex Buyer Proposal v3 — 22 days past revision target (target: 2026-04-10)',
    detail:
      "Deliverable 'Vantex Buyer Proposal v3' was originally targeted for revision by 2026-04-10. The proposal cannot be advanced because the approval chain controlling it is frozen. No revision has been made since 2026-03-12.",
    linkedEntityId: 'lyte-del-proposal-001',
    linkedEntityType: 'deliverable',
    linkedEntityLabel: 'Vantex Buyer Proposal v3',
    freshness: 'live',
    capturedAt: '2026-04-14T08:25:00Z',
    proofRef: 'LYTE-EV-008',
    confidence: 0.88,
  },
];

// ─── Policy Center ────────────────────────────────────────────────────────────

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  scope: 'domain' | 'action' | 'tenant' | 'platform';
  effect: 'allow' | 'require_approval' | 'escalate' | 'block' | 'audit_only';
  conditions: string[];
  requiredApproverRole?: string;
  escalateTo?: string;
  priority: number;
  complianceFramework?: string;
  isActive: boolean;
  lastTriggered?: string;
  triggerCount: number;
  domain?: string;
}

export interface PolicyEvaluationLog {
  id: string;
  policyId: string;
  policyName: string;
  entityId: string;
  entityLabel: string;
  effect: PolicyRule['effect'];
  outcome: 'allowed' | 'blocked' | 'escalated' | 'pending_approval';
  reason: string;
  evaluatedAt: string;
  proofRef: string;
}

export const policyRules: PolicyRule[] = [
  {
    id: 'lyte-pol-001',
    name: 'Approval Chain — Active Owner Required',
    description:
      'All approval chains must have at least one active, employed owner at every step before advancement is permitted.',
    scope: 'domain',
    effect: 'block',
    conditions: [
      "approval_chain.current_step.owner.employment_status != 'active'",
      "approval_chain.status == 'stalled'",
    ],
    priority: 100,
    complianceFramework: 'SOC 2 Type II',
    isActive: true,
    lastTriggered: '2026-04-14T08:20:00Z',
    triggerCount: 47,
    domain: 'lyte',
  },
  {
    id: 'lyte-pol-002',
    name: 'Revenue Risk — CFO Notification at $1M',
    description:
      'Any signal indicating revenue at risk exceeding $1M must notify the CFO within 1 business hour.',
    scope: 'domain',
    effect: 'escalate',
    conditions: ["signal.type == 'revenue_risk'", 'signal.metadata.estimatedValueUsd >= 1000000'],
    escalateTo: 'cfo',
    priority: 95,
    isActive: true,
    lastTriggered: '2026-04-14T08:22:00Z',
    triggerCount: 12,
    domain: 'lyte',
  },
  {
    id: 'lyte-pol-003',
    name: 'Approval Override — Executive Authority Required',
    description:
      'Voiding any step in an approval chain requires executive authority (VP or above) with audit trail.',
    scope: 'action',
    effect: 'require_approval',
    conditions: ["action.type == 'void_approval_step'", 'action.impactedValueUsd > 0'],
    requiredApproverRole: 'executive',
    priority: 90,
    isActive: true,
    lastTriggered: '2026-04-14T09:11:00Z',
    triggerCount: 3,
    domain: 'lyte',
  },
  {
    id: 'lyte-pol-004',
    name: 'Escalation — Valid Authority Holder Required',
    description:
      'Automated escalation is only permitted when a valid authority holder exists in the escalation path.',
    scope: 'action',
    effect: 'block',
    conditions: ["action.type == 'auto_escalate'", 'escalation_path.has_valid_authority == false'],
    priority: 85,
    isActive: true,
    lastTriggered: '2026-04-14T08:21:00Z',
    triggerCount: 3,
    domain: 'lyte',
  },
  {
    id: 'lyte-pol-005',
    name: 'Recommendation — Confidence Threshold',
    description:
      "Recommendations below 65% confidence must be tagged as 'low confidence' and require explicit human acknowledgment.",
    scope: 'action',
    effect: 'require_approval',
    conditions: ['recommendation.confidence < 0.65'],
    requiredApproverRole: 'analyst',
    priority: 60,
    isActive: true,
    triggerCount: 8,
    domain: 'lyte',
  },
  {
    id: 'lyte-pol-006',
    name: 'Offboarding — Approval Chain Attestation',
    description:
      'Employee offboarding is not complete until all approval chains owned by the departing employee have been reassigned and attested.',
    scope: 'platform',
    effect: 'block',
    conditions: ['offboarding.approval_chains_reassigned == false'],
    priority: 80,
    complianceFramework: 'SOC 2 Type II',
    isActive: true,
    lastTriggered: '2026-04-14T08:00:00Z',
    triggerCount: 2,
  },
  {
    id: 'lyte-pol-007',
    name: 'Simulation — Required Before High-Impact Action',
    description:
      'Any action with estimated financial impact >$500K must be preceded by a Lyte simulation run.',
    scope: 'action',
    effect: 'require_approval',
    conditions: ['action.estimatedImpactUsd > 500000', 'action.simulationRunId == null'],
    requiredApproverRole: 'operator',
    priority: 70,
    isActive: true,
    triggerCount: 5,
    domain: 'lyte',
  },
  {
    id: 'lyte-pol-008',
    name: 'AI Action — Human Gate for Irreversible Actions',
    description:
      'AI-initiated irreversible actions (ownership reassignment, contract generation) require human approval before execution.',
    scope: 'action',
    effect: 'require_approval',
    conditions: ["action.initiator == 'ai'", 'action.reversible == false'],
    requiredApproverRole: 'executive',
    priority: 98,
    complianceFramework: 'NIST AI RMF',
    isActive: true,
    lastTriggered: '2026-04-14T09:11:00Z',
    triggerCount: 4,
  },
];

export const policyEvaluationLog: PolicyEvaluationLog[] = [
  {
    id: 'peval-001',
    policyId: 'lyte-pol-004',
    policyName: 'Escalation — Valid Authority Holder Required',
    entityId: 'lyte-chain-vantex-001',
    entityLabel: 'Vantex Procurement Approval Chain',
    effect: 'block',
    outcome: 'blocked',
    reason:
      'No valid authority holder in escalation path. Chris Wade departed 2026-02-28. No successor recorded.',
    evaluatedAt: '2026-04-14T08:21:00Z',
    proofRef: 'LYTE-PEVAL-001',
  },
  {
    id: 'peval-002',
    policyId: 'lyte-pol-001',
    policyName: 'Approval Chain — Active Owner Required',
    entityId: 'lyte-chain-vantex-001',
    entityLabel: 'Vantex Procurement Approval Chain',
    effect: 'block',
    outcome: 'blocked',
    reason: 'Step 1 owner (Chris Wade) employment status: terminated. Advancement blocked.',
    evaluatedAt: '2026-04-14T08:20:00Z',
    proofRef: 'LYTE-PEVAL-002',
  },
  {
    id: 'peval-003',
    policyId: 'lyte-pol-002',
    policyName: 'Revenue Risk — CFO Notification at $1M',
    entityId: 'sig-002',
    entityLabel: 'Revenue Risk Signal — Vantex',
    effect: 'escalate',
    outcome: 'escalated',
    reason: 'Revenue at risk: $4.2M (>$1M threshold). CFO notified at 08:22.',
    evaluatedAt: '2026-04-14T08:22:00Z',
    proofRef: 'LYTE-PEVAL-003',
  },
  {
    id: 'peval-004',
    policyId: 'lyte-pol-003',
    policyName: 'Approval Override — Executive Authority Required',
    entityId: 'lyte-chain-vantex-001',
    entityLabel: 'Vantex Procurement Approval Chain',
    effect: 'require_approval',
    outcome: 'pending_approval',
    reason: 'Executive approval required to void step 1. Routed to CFO (Marcus Holt).',
    evaluatedAt: '2026-04-14T09:00:00Z',
    proofRef: 'LYTE-PEVAL-004',
  },
  {
    id: 'peval-005',
    policyId: 'lyte-pol-007',
    policyName: 'Simulation — Required Before High-Impact Action',
    entityId: 'rec-001',
    entityLabel: 'Emergency CFO Escalation',
    effect: 'require_approval',
    outcome: 'allowed',
    reason: 'Simulation run LYTE-RUN-007 completed before approval. Condition satisfied.',
    evaluatedAt: '2026-04-14T08:31:00Z',
    proofRef: 'LYTE-PEVAL-005',
  },
  {
    id: 'peval-006',
    policyId: 'lyte-pol-008',
    policyName: 'AI Action — Human Gate for Irreversible Actions',
    entityId: 'rec-001',
    entityLabel: 'Emergency CFO Escalation',
    effect: 'require_approval',
    outcome: 'pending_approval',
    reason: 'Ownership reassignment is irreversible. Human approval required. Routed to CFO.',
    evaluatedAt: '2026-04-14T09:00:00Z',
    proofRef: 'LYTE-PEVAL-006',
  },
];

// ─── Eval Studio ──────────────────────────────────────────────────────────────

export type EvalRunStatus = 'passed' | 'failed' | 'partial' | 'running' | 'queued';

export interface EvalRun {
  id: string;
  name: string;
  modelId: string;
  agentId: string;
  status: EvalRunStatus;
  score: number;
  metrics: {
    accuracy: number;
    evidenceCoverage: number;
    policyCompliance: number;
    recommendationQuality: number;
    latencyMs: number;
    tokenEfficiency: number;
  };
  testCases: number;
  passed: number;
  failed: number;
  runAt: string;
  duration: string;
  notes?: string;
  proofRef: string;
}

export const evalRuns: EvalRun[] = [
  {
    id: 'eval-001',
    name: 'Decision Engine — Revenue Risk Scenarios',
    modelId: 'lyte-decision-model-v2',
    agentId: 'lyte-agent-03',
    status: 'passed',
    score: 91,
    metrics: {
      accuracy: 0.93,
      evidenceCoverage: 0.96,
      policyCompliance: 1.0,
      recommendationQuality: 0.89,
      latencyMs: 1240,
      tokenEfficiency: 0.82,
    },
    testCases: 48,
    passed: 44,
    failed: 4,
    runAt: '2026-04-17T06:00:00Z',
    duration: '4m 12s',
    notes:
      '4 failures on edge cases with multi-domain overlapping signals. Improving context assembly.',
    proofRef: 'LYTE-EVAL-001',
  },
  {
    id: 'eval-002',
    name: 'Policy Engine — Approval Chain Coverage',
    modelId: 'lyte-policy-model-v1',
    agentId: 'lyte-agent-04',
    status: 'passed',
    score: 97,
    metrics: {
      accuracy: 0.98,
      evidenceCoverage: 0.97,
      policyCompliance: 1.0,
      recommendationQuality: 0.96,
      latencyMs: 340,
      tokenEfficiency: 0.94,
    },
    testCases: 120,
    passed: 117,
    failed: 3,
    runAt: '2026-04-17T06:10:00Z',
    duration: '1m 48s',
    notes: '3 edge cases: multi-domain approval chains with circular authority references.',
    proofRef: 'LYTE-EVAL-002',
  },
  {
    id: 'eval-003',
    name: 'Simulation Engine — Downstream Projection Accuracy',
    modelId: 'lyte-simulation-model-v1',
    agentId: 'lyte-agent-07',
    status: 'partial',
    score: 74,
    metrics: {
      accuracy: 0.76,
      evidenceCoverage: 0.88,
      policyCompliance: 1.0,
      recommendationQuality: 0.72,
      latencyMs: 2100,
      tokenEfficiency: 0.68,
    },
    testCases: 32,
    passed: 24,
    failed: 8,
    runAt: '2026-04-16T14:00:00Z',
    duration: '6m 30s',
    notes:
      'Projection accuracy degrades on scenarios >30 days time horizon. Training data limited.',
    proofRef: 'LYTE-EVAL-003',
  },
  {
    id: 'eval-004',
    name: 'Signal Scanner — Approval Chain Stall Detection',
    modelId: 'lyte-signal-model-v2',
    agentId: 'lyte-agent-01',
    status: 'passed',
    score: 96,
    metrics: {
      accuracy: 0.97,
      evidenceCoverage: 0.95,
      policyCompliance: 1.0,
      recommendationQuality: 0.94,
      latencyMs: 890,
      tokenEfficiency: 0.88,
    },
    testCases: 64,
    passed: 62,
    failed: 2,
    runAt: '2026-04-15T06:00:00Z',
    duration: '2m 14s',
    notes: '2 missed detections on chains with non-standard ownership structures.',
    proofRef: 'LYTE-EVAL-004',
  },
  {
    id: 'eval-005',
    name: 'Portfolio Scanner — Cross-Entity Pattern Matching',
    modelId: 'lyte-portfolio-model-v1',
    agentId: 'lyte-agent-06',
    status: 'failed',
    score: 61,
    metrics: {
      accuracy: 0.63,
      evidenceCoverage: 0.71,
      policyCompliance: 0.94,
      recommendationQuality: 0.58,
      latencyMs: 3800,
      tokenEfficiency: 0.52,
    },
    testCases: 24,
    passed: 15,
    failed: 9,
    runAt: '2026-04-14T10:00:00Z',
    duration: '9m 05s',
    notes:
      'Pattern matching degrades when entities lack standardized naming. Data quality improvement needed.',
    proofRef: 'LYTE-EVAL-005',
  },
];

// ─── Legacy / compatibility (used by existing pages) ─────────────────────────

export interface DriftItem {
  id: string;
  title: string;
  program: string;
  team: string;
  staleDays: number;
  owners: string[];
  evidence: string[];
  status: 'critical' | 'warn' | 'info';
  lastActivity: string;
  impact: string;
  proofRef: string;
}

export interface PressureCell {
  id?: string;
  team: string;
  workflow: string;
  account: string;
  program: string;
  sponsor: string;
  open: number;
  overdue: number;
  blocked: number;
  escalated: number;
  score: number;
  acknowledgedBy?: string | null;
  acknowledgedAt?: string | null;
}

export interface DebtItem {
  id: string;
  title: string;
  team: string;
  owner: string;
  type: 'overdue' | 'blocked' | 'looping' | 'escalated';
  score: number;
  ageDays: number;
  escalations: number;
  program: string;
  evidence: string[];
  proofRef: string;
  status: 'critical' | 'warn' | 'info';
}

export interface ReplayEvent {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  signal?: string;
  detail: string;
  evidenceType: 'system' | 'human' | 'alloy' | 'escalation';
  proofRef: string;
}

export interface ReplayScenario {
  id: string;
  title: string;
  decision: string;
  outcome: string;
  dateRange: string;
  events: ReplayEvent[];
}

export interface BoardRisk {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  domain: string;
  signal: string;
  recommendation: string;
  proofRef: string;
  interventionOwner: string;
  deadline: string;
}

export interface BoardMetric {
  label: string;
  value: string | number;
  delta?: string;
  trend: 'up' | 'down' | 'flat';
  context: string;
  good: 'up' | 'down';
}

export const driftItems: DriftItem[] = [
  {
    id: 'drift-001',
    title: 'Q2 Revenue Forecast Revision',
    program: 'Finance Planning',
    team: 'Finance + Strategy',
    staleDays: 11,
    owners: ['Sarah Lim (Finance)', 'David Osei (Strategy)'],
    evidence: [
      "Last edit: Apr 7 by Sarah Lim — marked 'awaiting Strategy sign-off'",
      'David Osei opened doc Apr 8 — no changes made',
      "Counsel workflow paused at 'strategy-review' node for 9 days",
      'Board deck assembly blocked on this output since Apr 12',
    ],
    status: 'critical',
    lastActivity: 'Apr 8',
    impact: 'Board deck cannot be finalized without updated forecast.',
    proofRef: 'ALLOY-W-0221',
  },
  {
    id: 'drift-002',
    title: 'Vantex Procurement Approval — Step 2 Holder',
    program: 'Pipeline Execution',
    team: 'Procurement',
    staleDays: 39,
    owners: ['Tyler Raines (Procurement Lead)'],
    evidence: [
      'Waiting on void Step 1 for 39 days',
      '3 internal escalation attempts unresolved',
      'No successor designated in org chart',
    ],
    status: 'critical',
    lastActivity: 'Apr 3',
    impact: 'Approval chain fully frozen. $4.2M at risk.',
    proofRef: 'LYTE-W-0491',
  },
  {
    id: 'drift-003',
    title: 'Product Roadmap Q3 Lock',
    program: 'Product Planning',
    team: 'Product + Engineering',
    staleDays: 7,
    owners: ['Maria Santos (PM)', 'Raj Patel (Eng Lead)'],
    evidence: [
      'Roadmap document in draft since Apr 11',
      'Engineering blocked on design completion',
      '3 open threads unresolved on Notion',
    ],
    status: 'warn',
    lastActivity: 'Apr 13',
    impact: 'Sprint planning delayed. 2 engineering teams blocked.',
    proofRef: 'ALLOY-W-0312',
  },
];

export const driftHistory = [
  { date: 'Apr 1', count: 2 },
  { date: 'Apr 4', count: 3 },
  { date: 'Apr 7', count: 3 },
  { date: 'Apr 10', count: 4 },
  { date: 'Apr 13', count: 5 },
  { date: 'Apr 16', count: 6 },
];

export const pressureCells: PressureCell[] = [
  {
    team: 'Procurement',
    workflow: 'Vantex Approval Chain',
    account: 'Vantex Capital LLC',
    program: 'Q2 Pipeline',
    sponsor: 'Marcus Holt',
    open: 3,
    overdue: 3,
    blocked: 2,
    escalated: 1,
    score: 98,
  },
  {
    team: 'Finance + Strategy',
    workflow: 'Q2 Forecast Revision',
    account: 'Meridian Capital Group',
    program: 'Finance Planning',
    sponsor: 'Sarah Lim',
    open: 4,
    overdue: 2,
    blocked: 1,
    escalated: 1,
    score: 82,
  },
  {
    team: 'Legal',
    workflow: 'Vantex Legal Review',
    account: 'Vantex Capital LLC',
    program: 'Q2 Pipeline',
    sponsor: 'Ana Kovac',
    open: 1,
    overdue: 1,
    blocked: 1,
    escalated: 0,
    score: 78,
  },
  {
    team: 'Sales',
    workflow: 'Q2 Pipeline Execution',
    account: 'Multiple',
    program: 'Revenue Operations',
    sponsor: 'Sarah Kim',
    open: 8,
    overdue: 3,
    blocked: 2,
    escalated: 2,
    score: 71,
  },
  {
    team: 'HR Ops',
    workflow: 'Offboarding — Chris Wade',
    account: 'Internal',
    program: 'Operations',
    sponsor: 'HR Director',
    open: 1,
    overdue: 1,
    blocked: 0,
    escalated: 0,
    score: 65,
  },
  {
    team: 'Marketing',
    workflow: 'Q2 Budget Reallocation',
    account: 'Internal',
    program: 'Marketing Ops',
    sponsor: 'CMO',
    open: 2,
    overdue: 1,
    blocked: 0,
    escalated: 0,
    score: 44,
  },
];

export const debtScoreHistory = [
  { date: 'Apr 1', critical: 1, high: 2, medium: 3 },
  { date: 'Apr 4', critical: 1, high: 2, medium: 4 },
  { date: 'Apr 7', critical: 2, high: 3, medium: 3 },
  { date: 'Apr 10', critical: 2, high: 3, medium: 4 },
  { date: 'Apr 13', critical: 2, high: 4, medium: 4 },
  { date: 'Apr 16', critical: 2, high: 4, medium: 5 },
];

export const debtItems: DebtItem[] = [
  {
    id: 'debt-001',
    title: 'Vantex Approval Chain — 47 days without resolution',
    team: 'Procurement + BD',
    owner: '[VOID]',
    type: 'blocked',
    score: 98,
    ageDays: 47,
    escalations: 3,
    program: 'Q2 Pipeline',
    evidence: [
      'Approval chain void at step 1',
      '3 escalation attempts blocked',
      'CFO escalation pending',
    ],
    proofRef: 'LYTE-W-0491',
    status: 'critical',
  },
  {
    id: 'debt-002',
    title: 'Q2 Revenue Forecast Revision — awaiting sign-off 11 days',
    team: 'Finance + Strategy',
    owner: 'David Osei',
    type: 'overdue',
    score: 82,
    ageDays: 11,
    escalations: 1,
    program: 'Finance Planning',
    evidence: ['Last activity: Apr 8', 'Board deck blocked', 'Counsel workflow paused'],
    proofRef: 'ALLOY-W-0221',
    status: 'critical',
  },
  {
    id: 'debt-003',
    title: 'Legal Review Package — blocked on procurement',
    team: 'Legal',
    owner: 'Ana Kovac',
    type: 'blocked',
    score: 78,
    ageDays: 30,
    escalations: 0,
    program: 'Q2 Pipeline',
    evidence: ['Blocked waiting on step 2', 'SLA breach: 10 days'],
    proofRef: 'LYTE-WF-003',
    status: 'warn',
  },
  {
    id: 'debt-004',
    title: 'Portfolio scan recommendation — unaddressed 3 days',
    team: 'Portfolio Management',
    owner: 'Portfolio Manager',
    type: 'looping',
    score: 61,
    ageDays: 3,
    escalations: 0,
    program: 'Portfolio Risk',
    evidence: ['3 companies identified', '$7.2M at risk', 'No action taken'],
    proofRef: 'LYTE-RUN-006',
    status: 'warn',
  },
];

export const replayScenarios: ReplayScenario[] = [
  {
    id: 'replay-vantex',
    title: 'Vantex Acquisition — Approval Chain Recovery',
    decision: 'CFO emergency override — void step 1, reassign to Sarah Kim',
    outcome: 'Deal reactivated. Q2 close probability: 74%. Buyer re-engaged within 4 hours.',
    dateRange: 'Apr 14–15, 2026',
    events: [
      {
        id: 're-01',
        timestamp: '2026-04-14T08:22:00Z',
        actor: 'Lyte Signal Scanner',
        role: 'System',
        action: 'Signal detected',
        signal: 'approval_chain_stall',
        detail:
          'Approval chain frozen 47 days. Revenue at risk: $4.2M. 3 escalation attempts exhausted.',
        evidenceType: 'system',
        proofRef: 'LYTE-W-0491',
      },
      {
        id: 're-02',
        timestamp: '2026-04-14T08:24:00Z',
        actor: 'Lyte Decision Engine',
        role: 'AI Agent',
        action: 'Recommendation generated',
        detail:
          'rec-001 generated: Emergency CFO escalation. Confidence: 87%. Submitted to approval queue.',
        evidenceType: 'alloy',
        proofRef: 'LYTE-REC-001',
      },
      {
        id: 're-03',
        timestamp: '2026-04-14T08:30:00Z',
        actor: 'Lyte Simulation Engine',
        role: 'AI Agent',
        action: 'Simulation run',
        detail:
          '3 scenarios modeled. CFO escalation: 74% close, 3d recovery. Partial: 51%. No action: 12%.',
        evidenceType: 'alloy',
        proofRef: 'LYTE-RUN-007',
      },
      {
        id: 're-04',
        timestamp: '2026-04-14T08:45:00Z',
        actor: 'Marcus Holt',
        role: 'CFO',
        action: 'Reviewed recommendation + simulation',
        detail:
          'Reviewed rec-001 in Decision Center. Viewed all 3 simulation scenarios. Evidence chain confirmed.',
        evidenceType: 'human',
        proofRef: 'LYTE-PEVAL-004',
      },
      {
        id: 're-05',
        timestamp: '2026-04-14T09:11:00Z',
        actor: 'Marcus Holt',
        role: 'CFO',
        action: 'Approved executive override',
        detail:
          "Approved: void step 1, assign Sarah Kim, join buyer call. Note: 'I will join the next buyer call personally.'",
        evidenceType: 'human',
        proofRef: 'LYTE-W-0491',
      },
      {
        id: 're-06',
        timestamp: '2026-04-14T09:14:00Z',
        actor: 'Lyte Counsel',
        role: 'System',
        action: 'Approval chain updated',
        detail:
          'Step 1 voided. Sarah Kim designated new approval owner. Chain unblocked. Steps 2–4 can now proceed.',
        evidenceType: 'alloy',
        proofRef: 'LYTE-WF-001',
      },
      {
        id: 're-07',
        timestamp: '2026-04-14T09:58:00Z',
        actor: 'Lyte Counsel',
        role: 'System',
        action: 'Downstream actions executed',
        detail:
          '4 actions completed: ownership reassigned, buyer email queued, CFO calendar block created, monitoring reactivated.',
        evidenceType: 'alloy',
        proofRef: 'LYTE-WF-002',
      },
      {
        id: 're-08',
        timestamp: '2026-04-14T14:22:00Z',
        actor: 'David Chen (Vantex)',
        role: 'External — Buyer',
        action: 'Buyer re-engaged',
        detail:
          "David Chen responded to CFO outreach: 'Let's reconnect this week — appreciate the personal reach-out.' Deal reactivated.",
        evidenceType: 'human',
        proofRef: 'LYTE-EV-003',
      },
    ],
  },
];

export const boardMetrics: BoardMetric[] = [
  {
    label: 'Action Debt Index',
    value: 43,
    delta: '+7 this week',
    trend: 'up',
    context: 'Items blocked, stalled, or looping without resolution — threshold: 30',
    good: 'down',
  },
  {
    label: 'Ownership Drift',
    value: 6,
    delta: '+2 vs last week',
    trend: 'up',
    context: 'Decisions awaiting sign-off with no owner action in >7 days',
    good: 'down',
  },
  {
    label: 'At-Risk ARR',
    value: '$4.2M',
    delta: '+$1.1M',
    trend: 'up',
    context: 'Revenue at risk this quarter from detected pipeline and approval stalls',
    good: 'down',
  },
  {
    label: 'Workflow Health',
    value: '62%',
    delta: '-11pp',
    trend: 'down',
    context: 'Share of tracked workflows with no active bottleneck',
    good: 'up',
  },
];

export const boardRisks: BoardRisk[] = [
  {
    id: 'risk-001',
    title: 'Vantex Approval Chain — $4.2M Q2 deal frozen 47 days',
    severity: 'critical',
    domain: 'Pipeline / Revenue',
    signal:
      'Approval chain void at step 1. Original owner departed without handoff. 3 escalation attempts blocked.',
    recommendation:
      'CFO invokes authority override, voids step 1, assigns Sarah Kim, joins buyer call personally.',
    proofRef: 'LYTE-W-0491',
    interventionOwner: 'Marcus Holt (CFO)',
    deadline: '2026-04-21',
  },
  {
    id: 'risk-002',
    title: 'Q2 Revenue Forecast — Board deck blocked 11 days on missing sign-off',
    severity: 'high',
    domain: 'Finance Planning',
    signal:
      'Strategy sign-off on forecast revision pending since Apr 7. Board deck assembly stalled.',
    recommendation:
      'David Osei (Strategy) to complete review by Apr 19. Finance Director escalates if not complete.',
    proofRef: 'ALLOY-W-0221',
    interventionOwner: 'David Osei (Strategy)',
    deadline: '2026-04-19',
  },
  {
    id: 'risk-003',
    title: 'Portfolio scan — 3 additional approval chains at $7.2M risk',
    severity: 'high',
    domain: 'Portfolio Risk',
    signal: '3 portfolio companies show same pattern as Vantex: departed owners, stalled chains.',
    recommendation:
      'Deploy platform-wide audit. Require offboarding attestation. Reassign or void stalled steps.',
    proofRef: 'LYTE-REC-002',
    interventionOwner: 'Sarah Kim (VP BD) + HR',
    deadline: '2026-04-30',
  },
  {
    id: 'risk-004',
    title: 'Q2 Marketing Budget — $340K expires if reallocation not approved',
    severity: 'medium',
    domain: 'Finance / Marketing',
    signal: '23% of Q2 marketing budget unallocated with 42 days until expiry. No carryover.',
    recommendation: 'Finance Director approves reallocation to pipeline acceleration programs.',
    proofRef: 'LYTE-W-0499',
    interventionOwner: 'Finance Director',
    deadline: '2026-06-30',
  },
];
