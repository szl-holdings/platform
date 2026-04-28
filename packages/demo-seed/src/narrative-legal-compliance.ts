/**
 * Demo Narrative 4: Legal / Compliance / Matter Command Lens
 *
 * Scenario: Marchetti & Osei LLP — A personal injury matter involving a rideshare
 * accident has stalled. Counsel detects an insurer-side clock violation,
 * surfaces a demand readiness gap, generates a legal recommendation, routes it
 * through partner approval, exports the demand packet, and creates a proof chain
 * for every action taken.
 *
 * Signal → Context → Recommendation → Approval → Execution → Outcome → Executive Summary
 */

export const LEGAL_COMPLIANCE_NARRATIVE = {
  id: 'legal-compliance',
  title: 'Legal / Compliance / Matter Command Lens',
  personas: ['legal-counsel'],
  org: 'Marchetti & Osei LLP',
  duration: '12 minutes',

  scenario: {
    name: 'Matter: Rivera v. Apex Mobility Group — Insurer Clock Violation & Demand Readiness',
    summary:
      "NY DFS Insurance Regulation 68 requires insurers to acknowledge and respond to demands within defined windows. Apex Mobility Group's insurer has failed to respond within the 30-day acknowledgement window. Counsel detected the clock violation, scored demand readiness at 91%, and surfaced a recommendation to issue formal demand and trigger the bad faith clock.",
    matter: 'Rivera v. Apex Mobility Group',
    jurisdiction: 'New York State Supreme Court — Kings County',
    regulatoryFramework: 'NY DFS Insurance Regulation 68',
    claimType: 'Personal Injury — Motor Vehicle',
    estimatedValue: '$485,000',
    clockViolation: '30-day insurer acknowledgement window exceeded by 12 days',
    demandReadiness: 91,
  },

  entities: {
    org: {
      id: 'demo-org-marchetti',
      name: 'Marchetti & Osei LLP',
      sector: 'Plaintiff-Side Litigation',
      practitioners: 8,
      activeMasters: 94,
    },
    matter: {
      id: 'demo-matter-RIV-001',
      title: 'Rivera v. Apex Mobility Group',
      caseNumber: 'KCX-2025-08847',
      status: 'active',
      filedDate: '2025-11-14',
      plaintiff: 'Elena Rivera',
      defendant: 'Apex Mobility Group LLC',
      insurer: 'Continental General Insurance',
      adjusterId: 'CG-ADJ-8847',
      jurisdiction: 'New York State Supreme Court — Kings County',
      claimType: 'Personal Injury — Motor Vehicle',
      injuryClass: 'Serious — Fractured vertebrae L4-L5',
      medicareExposure: 'MSP lien potential — CMS MSPRP query pending',
      estimatedValue: 485000,
      settlementBandLow: 310000,
      settlementBandHigh: 540000,
    },
    signal: {
      id: 'demo-signal-leg-001',
      type: 'insurer_clock_violation',
      severity: 'high',
      title: 'Rivera v. Apex — Insurer acknowledgement window exceeded by 12 days',
      body: 'Continental General Insurance has not acknowledged the Rivera demand within the 30-day window required under NY DFS Reg 68 (§216.6). Demand submitted 2025-12-19. Acknowledgement deadline: 2026-01-18. Current date: 2026-01-30. Violation: 12 days. Demand readiness score: 91%. Bad faith clock trigger available.',
      source: 'Counsel — Deadline Compliance Engine',
      confidence: 0.97,
      regulatoryReference: 'NY DFS Insurance Regulation 68 §216.6',
      detectedAt: '2026-01-30T09:15:00Z',
    },
    context: {
      id: 'demo-context-leg-001',
      summary:
        'PRISM assembled 9 signals across deadlines, insurer behavior, medical records, and regulatory context.',
      signals: [
        {
          source: 'Deadline Engine',
          signal: 'Reg 68 §216.6 acknowledgement window: exceeded by 12 days as of today',
        },
        {
          source: 'Insurer Profile',
          signal: 'Continental General: 3 prior Reg 68 violations in this jurisdiction (2023–2025)',
        },
        {
          source: 'Demand Readiness',
          signal:
            'Demand package scored 91% complete — police report, imaging, expert affidavit present',
        },
        {
          source: 'Settlement Band',
          signal: 'AI settlement forecast: $310K–$540K, median $418K at this litigation stage',
        },
        {
          source: 'CMS MSPRP',
          signal:
            'Medicare lien query pending — conditional payment letter expected within 21 days',
        },
        {
          source: 'Court Calendar',
          signal: 'Next CMC: 2026-03-04 — no action required before then from court',
        },
        {
          source: 'Insurer Behavior',
          signal: 'Adjuster last contacted on 2026-01-09 — 21 days of silence',
        },
        {
          source: 'Weather/Incident',
          signal: "NWS incident weather archived — corroborates plaintiff's visibility claim",
        },
        {
          source: 'Bad Faith',
          signal: 'Bad faith trigger window open — formal notice can be issued immediately',
        },
      ],
    },
    recommendation: {
      id: 'demo-rec-leg-001',
      agent: 'Counsel AI',
      action:
        'Issue formal Regulation 68 violation notice to Continental General. Attach demand packet at 91% readiness. Request acknowledgement response within 7 days or formal complaint to NY DFS will be filed.',
      rationale:
        'Clock violation is documented and statutory. Insurer has a documented pattern of Reg 68 non-compliance. Demand readiness is strong. The only gap is the CMS Medicare lien — but the lien does not preclude demand issuance. The bad faith notice strengthens settlement leverage. Settlement band at this stage ($418K median) supports the demand strategy.',
      confidence: 0.93,
      requiresApproval: true,
      approvalRole: 'operator',
      privilegeNote:
        'This recommendation is attorney work product — protected under NY CPLR 3101(c)',
      generatedAt: '2026-01-30T09:18:00Z',
    },
    approval: {
      id: 'demo-approval-leg-001',
      approver: 'Sophia Marchetti (Managing Attorney)',
      decision: 'approved',
      note: 'Agreed. Issue the notice today. CC our client. I want the bad faith letter to cite the prior violations — make sure the insurer profile is attached.',
      approvedAt: '2026-01-30T10:02:00Z',
      durationToApproval: '44 minutes',
    },
    execution: {
      id: 'demo-execution-leg-001',
      steps: [
        {
          step: 1,
          action: 'Reg 68 violation notice drafted with insurer profile attached',
          tool: 'Counsel Document Engine',
        },
        {
          step: 2,
          action: 'Demand packet exported to Word with source citations and metadata',
          tool: 'Counsel Export',
        },
        {
          step: 3,
          action:
            'Letter transmitted to Continental General (certified mail + email) — ref RIV-2026-0130',
          tool: 'Counsel Communication Connector',
        },
        {
          step: 4,
          action: 'Client (Elena Rivera) notified — plain-language summary sent',
          tool: 'Counsel Email Connector',
        },
        {
          step: 5,
          action:
            '7-day response deadline calendar event created — escalation if no response by 2026-02-06',
          tool: 'Counsel Deadline Engine',
        },
        {
          step: 6,
          action: 'NY DFS complaint draft staged — ready for submission if no response',
          tool: 'Counsel Compliance Module',
        },
      ],
      completedAt: '2026-01-30T11:30:00Z',
    },
    outcome: {
      id: 'demo-outcome-leg-001',
      summary:
        'Continental General responded within 5 days. Settlement conference scheduled for 2026-02-18. Pre-conference settlement offer: $395,000. Settlement band median: $418,000. Matter moving toward resolution.',
      insurerResponse: 'Settlement conference request received — 2026-02-04',
      settlementOffer: 395000,
      settlementBandMedian: 418000,
      daysToResponse: 5,
      status: 'Settlement conference scheduled',
      recordedAt: '2026-02-04T14:00:00Z',
    },
    executiveSummary: {
      id: 'demo-exsummary-leg-001',
      headline: 'Rivera v. Apex — Insurer clock violation triggered settlement response in 5 days',
      body: 'Counsel detected a 12-day Reg 68 clock violation, scored demand readiness at 91%, and surfaced a recommendation. Managing Attorney approved in 44 minutes. Formal notice issued same day. Insurer responded in 5 days with a settlement conference request — an offer of $395,000 against a band median of $418,000. Proof chain complete for every step.',
      generatedAt: '2026-02-04T15:00:00Z',
    },
    proofChain: {
      id: 'demo-proof-leg-001',
      entries: [
        {
          timestamp: '2026-01-30T09:15:00Z',
          event: 'Clock violation detected — Reg 68 §216.6',
          actor: 'Counsel AI',
          sourceDoc: 'Demand submission record 2025-12-19',
        },
        {
          timestamp: '2026-01-30T09:18:00Z',
          event: 'Action recommendation generated',
          actor: 'Counsel AI',
          aiModel: 'PRISM-v3',
          confidence: 0.93,
        },
        {
          timestamp: '2026-01-30T10:02:00Z',
          event: 'Recommendation approved — Sophia Marchetti',
          actor: 'Sophia Marchetti',
          tool: 'Counsel Approval Gate',
        },
        {
          timestamp: '2026-01-30T11:30:00Z',
          event: 'All execution steps confirmed — letter sent, client notified',
          actor: 'Counsel',
          reference: 'RIV-2026-0130',
        },
        {
          timestamp: '2026-02-04T14:00:00Z',
          event: 'Insurer response received — settlement conference requested',
          actor: 'System',
          source: 'Matter Inbox',
        },
      ],
      exportable: true,
      privilegeProtected: true,
    },
  },

  talkingScript: [
    {
      step: 'Matter Signal',
      duration: '2 min',
      narrative:
        'Sophia opens the Counsel dashboard. A high-priority matter event is surfaced: the insurer on Rivera v. Apex has violated the 30-day Reg 68 acknowledgement window by 12 days. PRISM detected this automatically — not from a calendar entry, but from tracking the statutory clock.',
      showIn: ['prism-counsel/matter-twin/RIV-001', 'prism-counsel/deadlines'],
    },
    {
      step: 'Context Assembly',
      duration: '2 min',
      narrative:
        'The Matter Twin is assembled: 9 signals — deadline status, insurer behavior profile (3 prior violations), demand readiness score (91%), settlement band forecast ($418K median), Medicare lien status. Everything in one surface.',
      showIn: ['prism-counsel/matter-twin/context', 'prism-counsel/settlement-forecast'],
    },
    {
      step: 'Legal Recommendation',
      duration: '2 min',
      narrative:
        "Counsel recommends issuing a formal Reg 68 violation notice. Rationale: documented clock violation, insurer's prior pattern, strong demand readiness, clear bad faith trigger. Confidence 93%. Marked as attorney work product.",
      showIn: ['prism-counsel/recommendation', 'prism-counsel/evidence'],
    },
    {
      step: 'Partner Approval',
      duration: '2 min',
      narrative:
        'Sophia reviews the recommendation, adds her note about citing prior violations, and approves. Counsel generates the demand packet and routes execution through Continuum. No manual document assembly.',
      showIn: ['prism-counsel/approval-gate', 'prism-counsel/export'],
    },
    {
      step: 'Execution & Delivery',
      duration: '2 min',
      narrative:
        'The violation notice is transmitted, the demand packet exported to Word with full source citations, the client is notified in plain language, and a 7-day escalation deadline is set. All steps logged.',
      showIn: ['prism-counsel/execution-record', 'prism-counsel/communication-log'],
    },
    {
      step: 'Proof Chain & Outcome',
      duration: '2 min',
      narrative:
        'Insurer responds in 5 days. Settlement conference scheduled. Proof chain is complete: every signal, every AI action, every human approval, every document. Defensible in court, in regulatory review, and in any bar complaint.',
      showIn: ['prism-counsel/proof-chain', 'prism-counsel/executive-summary'],
    },
  ],
};

export type LegalComplianceNarrative = typeof LEGAL_COMPLIANCE_NARRATIVE;
