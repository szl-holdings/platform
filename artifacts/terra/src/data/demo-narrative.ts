/**
 * Terra demo narrative — surfaced in the guided walkthrough sidebar
 * when the app is in demo / sandbox mode.
 *
 * The full narrative entity (signals, recommendation, approval, proof
 * chain) lives in `packages/demo-seed/src/narrative-terra-distress.ts`.
 * We mirror only the talking script here to keep the artifact bundle
 * free of database / seed dependencies.
 */

export const TERRA_DEMO_NARRATIVE = {
  title: '1847 Flatbush Ave — Compounded Distress',
  scenario:
    'A 12-unit Brooklyn multifamily under active lis pendens (136 days) just took a $147K NYC tax lien. Walk through how DOMAINE surfaces the opportunity, recommends a defensive offer band, and runs the diligence file.',
  steps: [
    {
      step: 'Distress Signal',
      duration: '2 min',
      narrative:
        'Open the DOMAINE dashboard. Top of the queue: 1847 Flatbush Ave is now under compounded distress — active lis pendens AND a brand-new tax lien. Detected from ACRIS and NYC DOF feeds, not from a broker email.',
      showIn: ['dashboard', 'distress-engine', 'distress-radar'],
    },
    {
      step: 'Property Twin Assembly',
      duration: '2 min',
      narrative:
        'Open the Property Twin: 11 signals across title, tax, ownership, lender posture, comps, rent roll with below-market leases, climate band, zoning, permits, owner outreach, and likely auction window. One surface — no tab switching.',
      showIn: ['property/dp-001', 'property-twin-view', 'ownership-graph'],
    },
    {
      step: 'Underwriting Recommendation',
      duration: '2 min',
      narrative:
        'Underwriting Copilot recommends a defensive offer band of $1.95M – $2.10M with an ARV reserve of $3.45M. Rationale spans equity cushion, comps, rent-roll upside, clean zoning, and a disengaged owner. Confidence 91%.',
      showIn: ['underwriting-copilot', 'why-this-property', 'comparable-sales'],
    },
    {
      step: 'Partner Approval',
      duration: '2 min',
      narrative:
        "Marcus reviews and approves with notes — pull a fresh title abstract, flag the LLC's other properties. Approval routed through Counsel.",
      showIn: ['approval-review', 'diligence-prep'],
    },
    {
      step: 'Diligence Execution',
      duration: '2 min',
      narrative:
        "DOMAINE opens the diligence file, orders title, generates the standing offer letter, exports the comps packet, abstracts the rent roll, watchlists the LLC's other holdings, and stages the SPV — all within the same business day.",
      showIn: ['diligence-room', 'document-engine', 'lease-abstraction'],
    },
    {
      step: 'Outcome & Proof Chain',
      duration: '2 min',
      narrative:
        'Owner counters at $2.18M in 6 days — inside the defensive ceiling. LOI signed at $2.05M against a $3.45M ARV. Proof chain complete: every signal, every AI action, every approval, every diligence step.',
      showIn: ['trust-provenance', 'evidence', 'executive-overview'],
    },
  ],
};
