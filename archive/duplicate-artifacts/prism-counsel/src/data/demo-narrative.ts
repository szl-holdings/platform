/**
 * PRISM Counsel demo narrative — surfaced in the guided walkthrough
 * sidebar when the app is in demo / sandbox mode.
 *
 * The full narrative entity (signals, recommendation, approval, proof
 * chain) lives in `packages/demo-seed/src/narrative-legal-compliance.ts`
 * (Rivera v. Apex Mobility Group). We mirror only the talking script
 * here to keep the artifact bundle free of database / seed dependencies.
 */

export const PRISM_DEMO_NARRATIVE = {
  title: 'Rivera v. Apex Mobility Group — Insurer Clock Violation',
  scenario:
    'A personal injury matter ($485K est.) where the insurer has exceeded the 30-day NY DFS Reg 68 acknowledgement window by 12 days. Walk through how PRISM Counsel detects the violation, scores demand readiness, and triggers a settlement response in 5 days.',
  steps: [
    {
      step: 'Matter Signal',
      duration: '2 min',
      narrative:
        'Open the PRISM Counsel dashboard. Top of the queue: Rivera v. Apex — the insurer has violated the 30-day Reg 68 acknowledgement window by 12 days. Detected from the statutory clock, not from a calendar entry.',
      showIn: ['matters', 'obligation-timeline', 'deadline-heatmap'],
    },
    {
      step: 'Matter Twin Assembly',
      duration: '2 min',
      narrative:
        'Open the Matter Twin for Rivera: 9 signals — deadline status, insurer behavior profile (3 prior violations), demand readiness score (91%), settlement band ($418K median), Medicare lien status. Everything in one surface.',
      showIn: ['obligation-graph', 'matters'],
    },
    {
      step: 'Legal Recommendation',
      duration: '2 min',
      narrative:
        "PRISM Counsel recommends issuing a formal Reg 68 violation notice. Rationale: documented clock violation, insurer's prior pattern, strong demand readiness, clear bad faith trigger. Confidence 93%. Marked attorney work product.",
      showIn: ['matters', 'evidence'],
    },
    {
      step: 'Partner Approval',
      duration: '2 min',
      narrative:
        'Sophia reviews, adds her note about citing prior violations, and approves. PRISM Counsel generates the demand packet and routes execution through Alloy. No manual document assembly.',
      showIn: ['matters', 'audit'],
    },
    {
      step: 'Execution & Delivery',
      duration: '2 min',
      narrative:
        'Violation notice transmitted, demand packet exported to Word with full citations, client notified in plain language, and a 7-day escalation deadline set. All steps logged to the proof chain.',
      showIn: ['proof-chain', 'audit'],
    },
    {
      step: 'Proof Chain & Outcome',
      duration: '2 min',
      narrative:
        'Insurer responds in 5 days. Settlement conference scheduled. Proof chain is complete and privilege-protected: every signal, every AI action, every human approval, every document. Defensible to court, regulator, and bar review.',
      showIn: ['proof-chain', 'privilege'],
    },
  ],
};
