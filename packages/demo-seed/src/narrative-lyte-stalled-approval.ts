/**
 * Demo Narrative — Lyte: Stalled Approval Chain Causing Revenue Risk
 *
 * Scenario: Vantex Acquisition — $4.2M Q2 deal blocked for 47 days because the
 * VP of Business Development departed without reassigning approval authority.
 * The procurement approval chain has three stalled steps. Lyte surfaces the
 * compound risk (deal + approval + deliverable) and proposes an emergency
 * escalation through the CFO.
 *
 * Entity graph:
 *   Opportunity (Vantex)
 *     → ApprovalChain (Procurement Sign-off)
 *         → Stakeholder (departed VP — approval gap)
 *         → Stakeholder (Procurement Lead — pending)
 *         → Stakeholder (Legal — waiting on procurement)
 *     → Project (Q2 Pipeline Execution)
 *         → Deliverable (Buyer Proposal — stalled)
 *         → Deliverable (Legal Review Package — blocked)
 *     → Stakeholder (CFO — escalation target)
 */

export interface LyteStalledApprovalNarrative {
  id: string;
  title: string;
  domain: 'lyte';
  scenario: {
    name: string;
    summary: string;
    valueAtRisk: string;
    daysStalled: number;
    rootCause: string;
    resolution: string;
    approvalChainSteps: ApprovalStep[];
  };
  entities: {
    opportunity: LyteOpportunity;
    approvalChain: LyteApprovalChain;
    project: LyteProject;
    stakeholders: LyteStakeholder[];
    deliverables: LyteDeliverable[];
    signals: LyteSignal[];
    recommendations: LyteRecommendation[];
  };
  simulationScenarios: SimulationScenario[];
}

export interface ApprovalStep {
  step: number;
  name: string;
  owner: string;
  status: 'approved' | 'stalled' | 'pending' | 'void';
  stalledDays?: number;
  note?: string;
}

export interface LyteOpportunity {
  id: string;
  label: string;
  accountName: string;
  stage: string;
  estimatedValueUsd: number;
  closeProbabilityBefore: number;
  closeProbabilityAfter: number;
  daysInStage: number;
  stalledDays: number;
  ownerName: string;
  approvalChainId: string;
  policyState: string;
  confidence: number;
  freshness: string;
  evidence: string[];
}

export interface LyteApprovalChain {
  id: string;
  label: string;
  linkedEntityId: string;
  currentStep: number;
  totalSteps: number;
  stalledAtStepName: string;
  stalledDays: number;
  valueAtRiskUsd: number;
  status: string;
  steps: ApprovalStep[];
}

export interface LyteProject {
  id: string;
  label: string;
  status: string;
  phase: string;
  owner: string;
  valueAtRiskUsd: number;
  blockerCount: number;
  deliverableIds: string[];
}

export interface LyteStakeholder {
  id: string;
  label: string;
  role: string;
  engagementLevel: string;
  approvalAuthority: boolean;
  lastEngagedAt: string;
  note: string;
}

export interface LyteDeliverable {
  id: string;
  label: string;
  type: string;
  owner: string;
  dueDate: string;
  status: string;
  stalledDays: number;
  blockedBy?: string;
}

export interface LyteSignal {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  body: string;
  source: string;
  confidence: number;
  detectedAt: string;
  linkedEntityId: string;
  linkedEntityType: string;
}

export interface LyteRecommendation {
  id: string;
  title: string;
  summary: string;
  reasoning: string;
  confidence: number;
  urgency: string;
  priority: number;
  businessImpact: {
    financialExposureUsd: number;
    affectedEntities: number;
    reputationalRisk: string;
    regulatoryExposure: boolean;
  };
  suggestedAction: string;
  suggestedOwner: string;
  policyState: string;
  approvalState: string;
  evidence: Array<{ label: string; value: string; source?: string }>;
  projectedImpact: {
    closeProbabilityIncrease: number;
    daysToRecovery: number;
    estimatedSavedRevenue: number;
    confidenceInProjection: number;
  };
  projectedRisk: {
    ifIgnored: string;
    probabilityOfLoss: number;
    estimatedLostRevenue: number;
    timeToPointOfNoReturn: string;
  };
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  action: string;
  projectedOutcome: {
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
}

export const LYTE_STALLED_APPROVAL_NARRATIVE: LyteStalledApprovalNarrative = {
  id: 'lyte-stalled-approval-chain',
  title: 'Stalled Approval Chain — Vantex Acquisition at Revenue Risk',
  domain: 'lyte',

  scenario: {
    name: 'Vantex Acquisition — Q2 Revenue at Risk',
    summary:
      "A $4.2M pipeline deal has stalled for 47 days after the VP of Business Development departed without reassigning approval authority. The procurement approval chain is frozen at Step 2 of 4. Legal review is blocked waiting on procurement. The buyer's engagement window is closing.",
    valueAtRisk: '$4,200,000',
    daysStalled: 47,
    rootCause:
      'Approval ownership gap — VP BD departed 2026-02-28 without recording a handoff. Procurement approval chain broke at step 2.',
    resolution:
      'CFO approves emergency ownership reassignment; deal restarted within 6 hours; close probability recovers to 74%.',
    approvalChainSteps: [
      {
        step: 1,
        name: 'BD Qualification Sign-off',
        owner: 'Chris Wade (VP BD, departed)',
        status: 'void',
        stalledDays: 47,
        note: 'Owner departed 2026-02-28; no handoff recorded.',
      },
      {
        step: 2,
        name: 'Procurement Approval',
        owner: 'Tyler Raines (Procurement Lead)',
        status: 'stalled',
        stalledDays: 39,
        note: 'Waiting on BD sign-off that never came. Escalation auto-blocked by policy.',
      },
      {
        step: 3,
        name: 'Legal Review',
        owner: 'Ana Kovac (General Counsel)',
        status: 'pending',
        note: 'Blocked waiting on Procurement.',
      },
      {
        step: 4,
        name: 'CFO Final Authorization',
        owner: 'Marcus Holt (CFO)',
        status: 'pending',
        note: 'Not yet reached.',
      },
    ],
  },

  entities: {
    opportunity: {
      id: 'lyte-opp-vantex-001',
      label: 'Vantex Acquisition — Q2 Close',
      accountName: 'Vantex Capital LLC',
      stage: 'stalled',
      estimatedValueUsd: 4200000,
      closeProbabilityBefore: 0.31,
      closeProbabilityAfter: 0.74,
      daysInStage: 47,
      stalledDays: 47,
      ownerName: 'Sarah Kim (VP BD)',
      approvalChainId: 'lyte-chain-vantex-001',
      policyState: 'flagged',
      confidence: 0.91,
      freshness: 'stale',
      evidence: [
        'Last CRM activity: 2026-03-31 (buyer opened proposal — no response)',
        'Approval chain: 47 days at step 1 with void owner',
        'Q2 close probability: 84% → 31% (46-day drift)',
        '3 automated escalation attempts blocked by policy — no authority holder',
        'Buyer contact last replied 2026-03-17',
      ],
    },

    approvalChain: {
      id: 'lyte-chain-vantex-001',
      label: 'Vantex Procurement Approval Chain',
      linkedEntityId: 'lyte-opp-vantex-001',
      currentStep: 1,
      totalSteps: 4,
      stalledAtStepName: 'BD Qualification Sign-off',
      stalledDays: 47,
      valueAtRiskUsd: 4200000,
      status: 'stalled',
      steps: [
        {
          step: 1,
          name: 'BD Qualification Sign-off',
          owner: 'Chris Wade (VP BD, departed)',
          status: 'void',
          stalledDays: 47,
          note: 'Owner departed 2026-02-28; no handoff.',
        },
        {
          step: 2,
          name: 'Procurement Approval',
          owner: 'Tyler Raines (Procurement Lead)',
          status: 'stalled',
          stalledDays: 39,
          note: 'Waiting on void step 1.',
        },
        { step: 3, name: 'Legal Review', owner: 'Ana Kovac (General Counsel)', status: 'pending' },
        { step: 4, name: 'CFO Final Authorization', owner: 'Marcus Holt (CFO)', status: 'pending' },
      ],
    },

    project: {
      id: 'lyte-proj-q2-pipeline-001',
      label: 'Q2 Pipeline Execution',
      status: 'at_risk',
      phase: 'Execution — Approval Gate',
      owner: 'Sarah Kim (VP BD)',
      valueAtRiskUsd: 7800000,
      blockerCount: 3,
      deliverableIds: ['lyte-del-proposal-001', 'lyte-del-legal-001'],
    },

    stakeholders: [
      {
        id: 'lyte-sh-marcus-001',
        label: 'Marcus Holt',
        role: 'CFO',
        engagementLevel: 'champion',
        approvalAuthority: true,
        lastEngagedAt: '2026-04-14T08:00:00Z',
        note: 'Final approval authority. Escalation target.',
      },
      {
        id: 'lyte-sh-sarah-001',
        label: 'Sarah Kim',
        role: 'VP Business Development',
        engagementLevel: 'champion',
        approvalAuthority: false,
        lastEngagedAt: '2026-04-13T14:30:00Z',
        note: 'Assigned as new opportunity owner post-escalation.',
      },
      {
        id: 'lyte-sh-chris-001',
        label: 'Chris Wade',
        role: 'VP BD (Departed)',
        engagementLevel: 'blocker',
        approvalAuthority: false,
        lastEngagedAt: '2026-02-28T17:00:00Z',
        note: 'Departed without handoff. Original approval chain holder. Chain voided.',
      },
      {
        id: 'lyte-sh-tyler-001',
        label: 'Tyler Raines',
        role: 'Procurement Lead',
        engagementLevel: 'neutral',
        approvalAuthority: true,
        lastEngagedAt: '2026-03-25T10:00:00Z',
        note: 'Approval chain step 2. Stalled 39 days waiting on void step 1.',
      },
      {
        id: 'lyte-sh-ana-001',
        label: 'Ana Kovac',
        role: 'General Counsel',
        engagementLevel: 'supporter',
        approvalAuthority: true,
        lastEngagedAt: '2026-04-01T09:00:00Z',
        note: 'Legal review blocked on procurement. Ready to proceed.',
      },
    ],

    deliverables: [
      {
        id: 'lyte-del-proposal-001',
        label: 'Vantex Buyer Proposal v3',
        type: 'presentation',
        owner: 'Sarah Kim',
        dueDate: '2026-04-10',
        status: 'stalled',
        stalledDays: 22,
        blockedBy: 'Approval chain void at step 1',
      },
      {
        id: 'lyte-del-legal-001',
        label: 'Legal Review Package — Vantex',
        type: 'contract',
        owner: 'Ana Kovac',
        dueDate: '2026-04-08',
        status: 'blocked',
        stalledDays: 30,
        blockedBy: 'Procurement approval (step 2) not complete',
      },
    ],

    signals: [
      {
        id: 'lyte-sig-001',
        type: 'approval_chain_stall',
        severity: 'critical',
        title: 'Approval chain void — Vantex deal blocked at step 1 for 47 days',
        body: 'The BD Qualification Sign-off step has no valid owner. The original approver (Chris Wade) departed 2026-02-28 with no recorded handoff. Three automated escalation attempts were blocked by policy. The entire chain is frozen.',
        source: 'Lyte — Approval Chain Monitor',
        confidence: 0.96,
        detectedAt: '2026-04-14T08:22:00Z',
        linkedEntityId: 'lyte-chain-vantex-001',
        linkedEntityType: 'approval_chain',
      },
      {
        id: 'lyte-sig-002',
        type: 'revenue_risk',
        severity: 'critical',
        title: '$4.2M Q2 deal — close probability collapsed from 84% to 31%',
        body: 'Vantex Acquisition close probability has declined 53 percentage points over 47 days of inactivity. At current trajectory, deal will fall out of Q2 and require full restart in Q3 with estimated 60% probability of loss.',
        source: 'Lyte — Revenue Risk Monitor',
        confidence: 0.91,
        detectedAt: '2026-04-14T08:22:00Z',
        linkedEntityId: 'lyte-opp-vantex-001',
        linkedEntityType: 'opportunity',
      },
      {
        id: 'lyte-sig-003',
        type: 'deliverable_overdue',
        severity: 'high',
        title: 'Buyer proposal stalled 22 days past revision target',
        body: 'Vantex Buyer Proposal v3 has not been advanced in 22 days. Original revision target was 2026-04-10. Proposal cannot be updated without re-establishing approval authority.',
        source: 'Lyte — Deliverable Monitor',
        confidence: 0.88,
        detectedAt: '2026-04-14T08:25:00Z',
        linkedEntityId: 'lyte-del-proposal-001',
        linkedEntityType: 'deliverable',
      },
      {
        id: 'lyte-sig-004',
        type: 'ownership_gap',
        severity: 'high',
        title: 'Procurement Lead (Tyler Raines) has sent 3 internal reminders — no response',
        body: 'Tyler Raines escalated internally on 2026-03-15, 2026-03-25, and 2026-04-03. All escalations landed in a void because the authority chain above him (Chris Wade) has no successor. The workflow is deadlocked.',
        source: 'Lyte — Workflow Pattern Detector',
        confidence: 0.83,
        detectedAt: '2026-04-14T08:27:00Z',
        linkedEntityId: 'lyte-chain-vantex-001',
        linkedEntityType: 'approval_chain',
      },
      {
        id: 'lyte-sig-005',
        type: 'buyer_engagement_decay',
        severity: 'medium',
        title: 'Buyer contact engagement decaying — last meaningful reply 28 days ago',
        body: "Vantex's primary contact (David Chen, Head of Corp Dev) last replied substantively on 2026-03-17. He opened the proposal on 2026-03-31 but did not respond. Silence exceeding 21 days is a strong churn predictor in comparable deals.",
        source: 'Lyte — Buyer Engagement Monitor',
        confidence: 0.78,
        detectedAt: '2026-04-14T08:30:00Z',
        linkedEntityId: 'lyte-opp-vantex-001',
        linkedEntityType: 'opportunity',
      },
    ],

    recommendations: [
      {
        id: 'lyte-rec-001',
        title: 'Emergency CFO escalation — reassign approval chain and restart Vantex',
        summary:
          'Invoke CFO override to void the stalled approval chain, reassign ownership to Sarah Kim (VP BD), and restart the Vantex acquisition process immediately.',
        reasoning:
          'The approval chain is deadlocked at a void step with no self-resolution path. Only executive override can restart it. Historical data shows that deals stalled >40 days with buyer silence >21 days recover successfully only with C-suite direct involvement. The 78% historical close rate with direct CFO sponsorship outperforms all other intervention patterns at this stage.',
        confidence: 0.87,
        urgency: 'critical',
        priority: 98,
        businessImpact: {
          financialExposureUsd: 4200000,
          affectedEntities: 5,
          reputationalRisk: 'medium',
          regulatoryExposure: false,
        },
        suggestedAction:
          'CFO invokes authority override, voids step 1 of approval chain, assigns Sarah Kim as new approval owner, CFO joins next buyer call directly.',
        suggestedOwner: 'Marcus Holt (CFO)',
        policyState: 'requires_approval',
        approvalState: 'pending',
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
          closeProbabilityIncrease: 0.43,
          daysToRecovery: 3,
          estimatedSavedRevenue: 4200000,
          confidenceInProjection: 0.82,
        },
        projectedRisk: {
          ifIgnored:
            'Deal falls out of Q2. Full restart required in Q3 with 60% probability of permanent loss. Board will question Q2 miss.',
          probabilityOfLoss: 0.6,
          estimatedLostRevenue: 4200000,
          timeToPointOfNoReturn: '7 days',
        },
      },
      {
        id: 'lyte-rec-002',
        title: 'Audit all approval chains for departed owners — prevent recurrence',
        summary:
          'Run a platform-wide scan of approval chains that reference staff who departed in the last 90 days. Reassign or void all stalled steps.',
        reasoning:
          'The Vantex situation is a systemic failure pattern, not a one-off. 3 of 14 portfolio companies show similar approval gaps in the current quarter. A full audit prevents additional revenue risk crystallizing in Q2.',
        confidence: 0.84,
        urgency: 'moderate',
        priority: 72,
        businessImpact: {
          financialExposureUsd: 11400000,
          affectedEntities: 22,
          reputationalRisk: 'low',
          regulatoryExposure: false,
        },
        suggestedAction:
          'Deploy Lyte approval-chain audit across all active workflows. Auto-void steps with departed owners. Require hand-off attestation as part of offboarding.',
        suggestedOwner: 'Sarah Kim (VP BD) + HR Operations',
        policyState: 'cleared',
        approvalState: 'none',
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
        ],
        projectedImpact: {
          closeProbabilityIncrease: 0.22,
          daysToRecovery: 14,
          estimatedSavedRevenue: 7200000,
          confidenceInProjection: 0.71,
        },
        projectedRisk: {
          ifIgnored:
            'Additional $7.2M at risk across 3 similar situations that will compound through Q2.',
          probabilityOfLoss: 0.35,
          estimatedLostRevenue: 7200000,
          timeToPointOfNoReturn: '21 days',
        },
      },
    ],
  },

  simulationScenarios: [
    {
      id: 'sim-cfos-escalation',
      name: 'CFO Emergency Escalation',
      description:
        'CFO invokes authority override, voids void step, reassigns to Sarah Kim, joins buyer call personally.',
      action: 'execute_recommendation:lyte-rec-001',
      projectedOutcome: {
        closeProbability: 0.74,
        daysToRecovery: 3,
        revenueCapture: 4200000,
        confidence: 0.82,
      },
      downstreamEffects: [
        {
          entity: 'Approval Chain (Vantex)',
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
          effect: 'Procurement can now proceed, legal review within 72h',
          magnitude: 'high',
        },
        {
          entity: 'Q2 Pipeline ($18M target)',
          effect: '+$4.2M restored to closeable column',
          magnitude: 'high',
        },
        {
          entity: 'Buyer Relationship',
          effect: 'CFO personal outreach resets engagement — high-signal to buyer',
          magnitude: 'medium',
        },
      ],
    },
    {
      id: 'sim-partial-reassign',
      name: 'Procurement-Level Reassignment (No CFO)',
      description: 'Tyler Raines self-escalates to VP level only. CFO not directly involved.',
      action: 'partial_escalation:procurement_level',
      projectedOutcome: {
        closeProbability: 0.51,
        daysToRecovery: 9,
        revenueCapture: 3100000,
        confidence: 0.61,
      },
      downstreamEffects: [
        {
          entity: 'Approval Chain (Vantex)',
          effect: 'Step 1 reassigned but not voided — policy review pending',
          magnitude: 'medium',
        },
        {
          entity: 'Buyer Proposal v3',
          effect: 'Delayed 4–5 additional days for policy clearance',
          magnitude: 'medium',
        },
        {
          entity: 'Legal Review Package',
          effect: 'Proceeds after procurement, 10+ days total delay',
          magnitude: 'medium',
        },
        {
          entity: 'Q2 Pipeline',
          effect: 'Deal may slip to Q2 close date edge — marginal',
          magnitude: 'low',
        },
        {
          entity: 'Buyer Relationship',
          effect: 'No executive signal — buyer may disengage',
          magnitude: 'high',
        },
      ],
    },
    {
      id: 'sim-no-action',
      name: 'No Action (Current Trajectory)',
      description: 'Leave the approval chain frozen and allow the deal to continue drifting.',
      action: 'none',
      projectedOutcome: {
        closeProbability: 0.12,
        daysToRecovery: 0,
        revenueCapture: 0,
        confidence: 0.88,
      },
      downstreamEffects: [
        {
          entity: 'Vantex Deal',
          effect: 'Falls out of Q2 entirely by 2026-04-25',
          magnitude: 'high',
        },
        {
          entity: 'Q2 Revenue Target',
          effect: '$4.2M gap against $18M board target (23% shortfall)',
          magnitude: 'high',
        },
        {
          entity: 'Buyer Relationship',
          effect: 'High churn probability — competitor likely to engage',
          magnitude: 'high',
        },
        {
          entity: 'Approval Chain (Vantex)',
          effect: 'Remains frozen indefinitely — no self-resolution path',
          magnitude: 'high',
        },
        {
          entity: 'Portfolio Scan (3 similar gaps)',
          effect: '$7.2M additional exposure compounds',
          magnitude: 'high',
        },
      ],
    },
  ],
};
