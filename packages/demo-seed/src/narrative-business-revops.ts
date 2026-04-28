/**
 * Demo Narrative 1: Business Observability / RevOps / CFO Lens
 *
 * Scenario: Meridian Capital Group — CFO discovers a revenue stall in Q2
 * pipeline that conventional reporting missed. KORA surfaces the signal,
 * PRISM assembles context, AI recommends intervention, CFO approves escalation,
 * Continuum routes to the right owner, outcome is captured with proof chain.
 *
 * Signal → Context → Recommendation → Approval → Execution → Outcome → Executive Summary
 */

export const BUSINESS_REVOPS_NARRATIVE = {
  id: 'business-revops',
  title: 'Business Observability — CFO / RevOps Lens',
  persona: 'cfo-exec',
  org: 'Meridian Capital Group',
  duration: '12 minutes',

  scenario: {
    name: 'Q2 Pipeline Stall — Revenue at Risk',
    summary:
      'A $4.2M pipeline segment has stalled for 47 days without escalation. Approval aging in the procurement cycle is creating downstream revenue exposure. No existing tool surfaced this before KORA.',
    valueAtRisk: '$4,200,000',
    daysStalled: 47,
    rootCause: 'Approval ownership gap — responsible VP departed without handoff',
    resolution: 'CFO approves emergency escalation; deal restarted within 6 hours',
  },

  entities: {
    org: {
      id: 'demo-org-meridian',
      name: 'Meridian Capital Group',
      sector: 'Private Equity',
      aum: '$2.4B',
      portfolioCompanies: 14,
    },
    signal: {
      id: 'demo-signal-biz-001',
      type: 'pipeline_stall',
      severity: 'high',
      title: 'Pipeline segment stalled — 47 days without owner action',
      body: 'The Vantex Acquisition deal (est. $4.2M Q2 close) has not advanced in 47 days. The approval owner departed on 2026-02-28 with no recorded handoff. The deal is now at risk of falling out of Q2.',
      source: 'KORA PRISM — Motion dimension',
      confidence: 0.91,
      detectedAt: '2026-04-14T08:22:00Z',
      prismDimension: 'Motion',
    },
    context: {
      id: 'demo-context-biz-001',
      summary: 'PRISM assembled 6 signals across Motion, Risk, and Intelligence dimensions.',
      signals: [
        { dimension: 'Motion', signal: 'Deal velocity: 0 actions in 47 days (baseline: 3/week)' },
        { dimension: 'Risk', signal: 'Q2 close probability dropped from 84% to 31%' },
        { dimension: 'Intelligence', signal: 'No active approval owner assigned since 2026-02-28' },
        { dimension: 'Pulse', signal: '3 of 14 portfolio companies showing similar approval gaps' },
        { dimension: 'Signals', signal: 'Buyer contact last seen opening proposal on 2026-03-31' },
        { dimension: 'Risk', signal: 'Revenue at risk vs. Q2 target: $4.2M of $18M (23%)' },
      ],
    },
    recommendation: {
      id: 'demo-rec-biz-001',
      agent: 'KORA',
      action: 'Escalate deal to CFO for emergency ownership reassignment and buyer re-engagement',
      rationale:
        'Deal is past recovery threshold without executive intervention. Buyer last engaged 14 days ago — window is closing. Reassignment to VP of BD with direct CFO sponsorship has 78% historical close rate in comparable situations.',
      confidence: 0.87,
      requiresApproval: true,
      approvalRole: 'executive',
      generatedAt: '2026-04-14T08:24:00Z',
    },
    approval: {
      id: 'demo-approval-biz-001',
      approver: 'Marcus Holt (CFO)',
      decision: 'approved',
      note: 'Assign to Sarah Kim (VP BD). I will join the next buyer call personally.',
      approvedAt: '2026-04-14T09:11:00Z',
      durationToApproval: '49 minutes',
    },
    execution: {
      id: 'demo-execution-biz-001',
      steps: [
        { step: 1, action: 'Ownership reassigned to Sarah Kim — Counsel workflow triggered' },
        { step: 2, action: 'Buyer re-engagement email drafted by KORA and queued for review' },
        { step: 3, action: 'CFO calendar block created for buyer call (2026-04-16 14:00)' },
        { step: 4, action: 'Deal velocity monitoring reactivated — alert threshold: 7 days' },
      ],
      completedAt: '2026-04-14T09:58:00Z',
    },
    outcome: {
      id: 'demo-outcome-biz-001',
      summary: 'Deal reactivated. Buyer responded within 4 hours. Q2 close now at 74% probability.',
      closeProbabilityBefore: 0.31,
      closeProbabilityAfter: 0.74,
      daysToRecovery: 1,
      recordedAt: '2026-04-15T11:30:00Z',
    },
    executiveSummary: {
      id: 'demo-exsummary-biz-001',
      headline: 'Q2 revenue exposure contained: $4.2M deal reactivated in 26 hours',
      body: 'A 47-day pipeline stall was detected and resolved within one business day. Without KORA, this deal would have missed Q2 close and required a full restart in Q3. Total time from signal to resolution: 25 hours 36 minutes. Actions taken: 4. Approvals: 1. Audit record: complete.',
      generatedAt: '2026-04-15T12:00:00Z',
    },
  },

  talkingScript: [
    {
      step: 'Signal Detection',
      duration: '2 min',
      narrative:
        'Marcus opens KORA on Monday morning. The Command Inbox surfaces a high-priority item: a $4.2M deal has stalled for 47 days. This is not a new report. PRISM detected this automatically — no one filed a ticket.',
      showIn: ['lyte/command-inbox', 'lyte/prism/motion'],
    },
    {
      step: 'Context Assembly',
      duration: '2 min',
      narrative:
        'The PRISM framework has assembled context across 6 signals — Motion, Risk, Intelligence, Pulse, Signals, Risk. Marcus sees the full picture: deal velocity collapsed, close probability dropped to 31%, the approval owner left 47 days ago without a handoff.',
      showIn: ['lyte/prism', 'lyte/intelligence'],
    },
    {
      step: 'AI Recommendation',
      duration: '2 min',
      narrative:
        'KORA has already generated a recommendation: escalate to CFO, reassign to VP BD, re-engage buyer. Confidence: 87%. The rationale cites historical close rates for comparable situations.',
      showIn: ['lyte/command-inbox/detail', 'lyte/evidence'],
    },
    {
      step: 'CFO Approval',
      duration: '2 min',
      narrative:
        "Marcus reviews, adds a note — 'I'll join the buyer call myself' — and approves. Counsel routes execution. The entire approval was done in the Command Inbox. No meetings needed.",
      showIn: ['lyte/approval-gate', 'lyte/audit'],
    },
    {
      step: 'Execution & Outcome',
      duration: '2 min',
      narrative:
        'Ownership is reassigned, buyer email is queued, CFO calendar block is created. 25 hours later: buyer responds, close probability is 74%. The executive summary is generated automatically.',
      showIn: ['lyte/execution-record', 'lyte/executive-summary'],
    },
    {
      step: 'Proof Chain',
      duration: '2 min',
      narrative:
        "Every step — signal, context, recommendation, approval, execution, outcome — is in the Decision Ledger. This is the audit record that board members and compliance teams need. It's generated automatically, not assembled after the fact.",
      showIn: ['lyte/decision-ledger'],
    },
  ],
};

export type BusinessRevopsNarrative = typeof BUSINESS_REVOPS_NARRATIVE;
