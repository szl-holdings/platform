/**
 * Demo Narrative 5: Terra — Real Estate / Distress Diligence Lens
 *
 * Scenario: Apex Capital Partners — A Brooklyn multifamily property carries
 * an active lis pendens AND a recently filed tax lien. Terra detects the
 * compounded distress, assembles a property twin (title, tax, ownership,
 * comps, climate, zoning, ARV), runs an underwriting recommendation,
 * routes diligence approval through Alloy, and produces a full proof chain.
 *
 * Signal → Context → Recommendation → Approval → Diligence → Outcome → Executive Summary
 */

export const TERRA_DISTRESS_NARRATIVE = {
  id: "terra-distress",
  title: "Real Estate / Distress Diligence / Acquisition Command Lens",
  personas: ["operator", "executive"],
  org: "Apex Capital Partners",
  duration: "12 minutes",

  scenario: {
    name: "1847 Flatbush Ave, Brooklyn — Compounded Distress (Lis Pendens + Tax Lien)",
    summary:
      "A 12-unit Brooklyn multifamily owned by GreenHouse Realty LLC has been in lis pendens for 136 days with no cure plan. Three days ago, a $147K NYC tax lien was filed against the same property. Terra detected the compounded distress, scored the opportunity at 87, and surfaced a recommendation to open a diligence file with a defensive offer band of $1.95M – $2.10M.",
    propertyId: "dp-001",
    address: "1847 Flatbush Ave, Brooklyn NY 11210",
    propertyType: "Multifamily — 12 units",
    distressType: "pre-foreclosure + tax lien",
    estimatedValue: 2850000,
    debtAmount: 1920000,
    taxLienAmount: 147000,
    equityCushion: 0.45,
    opportunityScore: 87,
  },

  entities: {
    org: {
      id: "demo-org-apex-capital",
      name: "Apex Capital Partners",
      sector: "Real Estate Acquisitions — Distressed Multifamily",
      aum: 184000000,
      activePipelineCount: 23,
    },
    property: {
      id: "dp-001",
      address: "1847 Flatbush Ave",
      borough: "Brooklyn",
      county: "Kings",
      zipCode: "11210",
      propertyType: "multifamily",
      units: 12,
      sqft: 5800,
      yearBuilt: 1962,
      currentEstimatedValue: 2850000,
      asRepairedValue: 3450000,
      mortgageDebt: 1920000,
      taxLienAmount: 147000,
      ownerName: "GreenHouse Realty LLC",
      ownerType: "llc",
      lisPendensFiledOn: "2025-11-14",
      taxLienFiledOn: "2026-04-13",
      jurisdiction: "Kings County Supreme Court",
      occupancy: "9 of 12 units occupied — 3 below-market leases",
      climateRiskScore: "moderate (coastal flood band C)",
      zoningClassification: "R6 — multifamily as-of-right",
    },
    signal: {
      id: "demo-signal-terra-001",
      type: "compounded_distress",
      severity: "high",
      title:
        "1847 Flatbush Ave — Tax lien filed against active lis pendens property (136 days in distress)",
      body:
        "GreenHouse Realty LLC's 12-unit multifamily at 1847 Flatbush Ave is now under compounded distress. Lis pendens has been active for 136 days with no cure plan. NYC Department of Finance filed a $147,000 tax lien on 2026-04-13. Estimated equity cushion remains 45%. Owner has not responded to lender's last 3 outreach attempts. Opportunity score: 87.",
      source: "Terra — Distress Engine + ACRIS / NYC Department of Finance feed",
      confidence: 0.94,
      detectedAt: "2026-04-14T08:42:00Z",
    },
    context: {
      id: "demo-context-terra-001",
      summary:
        "Terra assembled 11 signals across title, tax, ownership, comparable sales, climate, zoning, rent roll, and lender posture into a single Property Twin.",
      signals: [
        { source: "Title", signal: "Lis pendens active 136 days — Kings County Supreme Court — no cure plan filed" },
        { source: "Tax", signal: "NYC DOF tax lien filed 2026-04-13 for $147,000 — secondary lien position" },
        { source: "Ownership", signal: "GreenHouse Realty LLC — 4 other NYC properties — 2 also in distress" },
        { source: "Lender Posture", signal: "Originating lender (Atlantic Trust Bank) flagged file for OREO desk on 2026-04-08" },
        { source: "Comps (90-day)", signal: "3 comparable Flatbush multifamily trades — median $245/sqft — supports $2.85M valuation" },
        { source: "Rent Roll", signal: "9 of 12 units occupied; 3 below-market leases offer $44K/yr upside post-renewal" },
        { source: "Climate", signal: "Coastal flood band C — moderate. No FEMA flood claim history." },
        { source: "Zoning", signal: "R6 multifamily as-of-right — no upzoning or rezoning risk" },
        { source: "Permits", signal: "No open DOB violations. Last C of O issued 2018." },
        { source: "Owner Outreach", signal: "Lender's 3 prior outreach attempts unanswered — owner appears disengaged" },
        { source: "Auction Calendar", signal: "Likely auction window: 2026-07 to 2026-09 if no cure" },
      ],
    },
    recommendation: {
      id: "demo-rec-terra-001",
      agent: "Terra Underwriting Copilot",
      action:
        "Open formal diligence file. Approach owner directly through escrow attorney with discounted-payoff offer band $1.95M – $2.10M (subject to title and rent-roll diligence). Place ARV reserve at $3.45M. Stage acquisition through SPV-Apex-BK-2026-04.",
      rationale:
        "Compounded distress (lis pendens + tax lien) materially raises probability of distressed sale before auction. Equity cushion of 45% supports a defensive offer that satisfies senior lender + tax lien with margin. Comps support stabilized valuation. Rent roll has clear upside. Zoning, climate, and permit profile all clean. Owner appears disengaged — favoring a pre-auction transaction.",
      confidence: 0.91,
      requiresApproval: true,
      approvalRole: "operator",
      generatedAt: "2026-04-14T08:46:00Z",
    },
    approval: {
      id: "demo-approval-terra-001",
      approver: "Marcus Holt (Managing Partner — Apex Capital)",
      decision: "approved",
      note:
        "Approved. Open the file. Send our standing-offer letter through Cohen & Park escrow. I want a fresh title abstract pulled before any number is signed. Also flag the other two GreenHouse properties for watchlist.",
      approvedAt: "2026-04-14T11:20:00Z",
      durationToApproval: "2 hours 34 minutes",
    },
    execution: {
      id: "demo-execution-terra-001",
      steps: [
        { step: 1, action: "Diligence file 1847-FLAT-2026 opened in Terra Diligence Room", tool: "Terra Diligence Room" },
        { step: 2, action: "Title abstract ordered through First American — ETA 2026-04-17", tool: "Alloy Title Connector" },
        { step: 3, action: "Standing offer letter generated and queued through Cohen & Park escrow", tool: "Terra Document Engine" },
        { step: 4, action: "Comparable sales packet exported with 3-comp narrative + ARV bridge", tool: "Terra Comps Export" },
        { step: 5, action: "Rent-roll abstraction job queued — 12 leases", tool: "Terra Lease Abstraction" },
        { step: 6, action: "GreenHouse Realty LLC's other 4 properties added to watchlist", tool: "Terra Watchlist" },
        { step: 7, action: "SPV-Apex-BK-2026-04 staged in pipeline at offer band $1.95M – $2.10M", tool: "Terra Pipeline" },
      ],
      completedAt: "2026-04-14T13:08:00Z",
    },
    outcome: {
      id: "demo-outcome-terra-001",
      summary:
        "Owner's escrow attorney responded in 6 days. Counter-offer received at $2.18M — within Apex's defensive band ceiling. Title abstract returned clean (single lis pendens + new tax lien — no surprises). Apex moved to LOI at $2.05M. Closing scheduled for 2026-06-12.",
      counterOfferReceived: 2180000,
      apexCounter: 2050000,
      apexARVReserve: 3450000,
      projectedStabilizedYield: 0.082,
      daysToLoi: 9,
      status: "Under contract — closing scheduled 2026-06-12",
      recordedAt: "2026-04-23T10:00:00Z",
    },
    executiveSummary: {
      id: "demo-exsummary-terra-001",
      headline:
        "1847 Flatbush — Compounded distress detected, defensive offer accepted in 9 days, ARV upside $1.4M",
      body:
        "Terra detected a tax lien stacking onto a 136-day lis pendens, scored the opportunity at 87, and surfaced a defensive acquisition recommendation. Managing Partner approved in 2.5 hours. Diligence file opened, title ordered, comps exported, rent roll abstracted, and a watchlist created for the LLC's other holdings — all within the same business day. Owner counter accepted at $2.05M against a $3.45M ARV. Proof chain complete.",
      generatedAt: "2026-04-23T11:00:00Z",
    },
    proofChain: {
      id: "demo-proof-terra-001",
      entries: [
        { timestamp: "2026-04-14T08:42:00Z", event: "Compounded distress detected", actor: "Terra Distress Engine", source: "ACRIS + NYC DOF feed" },
        { timestamp: "2026-04-14T08:46:00Z", event: "Underwriting recommendation generated", actor: "Terra Underwriting Copilot", aiModel: "Terra-UW-v2", confidence: 0.91 },
        { timestamp: "2026-04-14T11:20:00Z", event: "Recommendation approved — Marcus Holt", actor: "Marcus Holt", tool: "Terra Approval Gate" },
        { timestamp: "2026-04-14T13:08:00Z", event: "All execution steps confirmed — diligence file open, offer queued", actor: "Terra", reference: "1847-FLAT-2026" },
        { timestamp: "2026-04-23T10:00:00Z", event: "Owner counter received and LOI signed", actor: "System", source: "Cohen & Park escrow" },
      ],
      exportable: true,
    },
  },

  talkingScript: [
    {
      step: "Distress Signal",
      duration: "2 min",
      narrative:
        "Marcus opens the Terra dashboard. A high-priority signal is at the top: 1847 Flatbush Ave is now under compounded distress — an active lis pendens AND a brand-new tax lien. Terra detected this automatically from ACRIS and NYC DOF feeds — not from a broker email.",
      showIn: ["terra/dashboard", "terra/distress-engine", "terra/distress-radar"],
    },
    {
      step: "Property Twin Assembly",
      duration: "2 min",
      narrative:
        "Terra builds the Property Twin: 11 signals — title status, tax filings, ownership graph, lender posture, 3 fresh comps, rent roll with below-market leases, climate band, zoning, permits, owner outreach history, and the likely auction window. One surface — no tab switching.",
      showIn: ["terra/property/dp-001", "terra/property-twin-view", "terra/ownership-graph"],
    },
    {
      step: "Underwriting Recommendation",
      duration: "2 min",
      narrative:
        "Terra's Underwriting Copilot recommends a defensive offer band of $1.95M – $2.10M with an ARV reserve of $3.45M. Rationale spans equity cushion, comps, rent-roll upside, clean zoning, and disengaged owner. Confidence 91%.",
      showIn: ["terra/underwriting-copilot", "terra/why-this-property", "terra/comparable-sales"],
    },
    {
      step: "Partner Approval",
      duration: "2 min",
      narrative:
        "Marcus reviews, approves, and adds notes about pulling a fresh title abstract and flagging the LLC's other properties. Approval routed through Alloy.",
      showIn: ["terra/approval-review", "terra/diligence-prep"],
    },
    {
      step: "Diligence Execution",
      duration: "2 min",
      narrative:
        "Terra opens the diligence file, orders title, generates the standing offer letter, exports the comparable sales packet, abstracts the rent roll, adds the LLC's 4 other properties to watchlist, and stages the SPV — all within the same business day.",
      showIn: ["terra/diligence-room", "terra/document-engine", "terra/lease-abstraction"],
    },
    {
      step: "Outcome & Proof Chain",
      duration: "2 min",
      narrative:
        "Owner counters at $2.18M in 6 days — inside Apex's defensive ceiling. LOI signed at $2.05M against a $3.45M ARV. Proof chain complete: every signal, every AI action, every approval, every diligence step. Defensible to investors and counsel.",
      showIn: ["terra/trust-provenance", "terra/evidence", "terra/executive-overview"],
    },
  ],
};

export type TerraDistressNarrative = typeof TERRA_DISTRESS_NARRATIVE;
