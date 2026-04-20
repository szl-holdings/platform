import type { GoldenQuery } from "../metrics.js";

export const LYTE_GOLDEN_QUERIES: GoldenQuery[] = [
  {
    queryId: "lyte-q001",
    query: "Which approval chains have been stalled for more than 14 days?",
    relevantChunkIds: ["lyte-chunk-001", "lyte-chunk-002", "lyte-chunk-003"],
    exactMatchBoostTerms: ["approval chain", "stalled"],
    metadata: { domain: "lyte", entityTypes: ["approval_chain"] },
  },
  {
    queryId: "lyte-q002",
    query: "Show me the highest-risk opportunities without an assigned owner.",
    relevantChunkIds: ["lyte-chunk-004", "lyte-chunk-005"],
    exactMatchBoostTerms: ["opportunity", "ownership gap"],
    metadata: { domain: "lyte", entityTypes: ["opportunity"] },
  },
  {
    queryId: "lyte-q003",
    query: "What projects are currently at risk of missing their delivery deadline?",
    relevantChunkIds: ["lyte-chunk-006", "lyte-chunk-007", "lyte-chunk-008"],
    exactMatchBoostTerms: ["project", "risk signal", "deliverable"],
    metadata: { domain: "lyte", entityTypes: ["project", "deliverable"] },
  },
  {
    queryId: "lyte-q004",
    query: "List stakeholders who have not engaged with the Q2 governance review.",
    relevantChunkIds: ["lyte-chunk-009", "lyte-chunk-010"],
    exactMatchBoostTerms: ["stakeholder", "governance"],
    metadata: { domain: "lyte", entityTypes: ["stakeholder"] },
  },
  {
    queryId: "lyte-q005",
    query: "What escalations occurred in the last 30 days and how were they resolved?",
    relevantChunkIds: ["lyte-chunk-011", "lyte-chunk-012"],
    exactMatchBoostTerms: ["escalation", "approval chain"],
    metadata: { domain: "lyte", entityTypes: ["approval_chain", "outcome"] },
  },
  {
    queryId: "lyte-q006",
    query: "Which deliverables are overdue and blocking downstream milestones?",
    relevantChunkIds: ["lyte-chunk-013", "lyte-chunk-014"],
    exactMatchBoostTerms: ["deliverable", "stalled"],
    metadata: { domain: "lyte", entityTypes: ["deliverable", "project"] },
  },
];

export const LYTE_MOCK_CORPUS = new Map<string, { text: string; boostTerms: string[] }>([
  ["lyte-chunk-001", { text: "Approval chain AC-2024-Q2-07 has been stalled at the CFO sign-off step for 22 days. Estimated value at risk: $1.4M. Owner: Sarah Chen.", boostTerms: ["approval chain", "stalled"] }],
  ["lyte-chunk-002", { text: "Approval chain AC-2024-Q3-12 stalled: no response from legal counsel for 16 days on the enterprise SaaS contract renewal.", boostTerms: ["approval chain", "stalled"] }],
  ["lyte-chunk-003", { text: "Governance review flagged three approval chains with stall periods exceeding 14-day SLA threshold: AC-07, AC-12, AC-19.", boostTerms: ["approval chain", "stalled", "governance"] }],
  ["lyte-chunk-004", { text: "Opportunity OPP-2024-447 classified as high-risk with no ownership assignment. Estimated close value: $3.2M. Days in qualification stage: 34.", boostTerms: ["opportunity", "ownership gap"] }],
  ["lyte-chunk-005", { text: "Three unassigned opportunities in negotiation stage: OPP-441, OPP-447, OPP-452. Combined estimated value: $7.8M. Ownership gap risk: HIGH.", boostTerms: ["opportunity", "ownership gap"] }],
  ["lyte-chunk-006", { text: "Project PROJ-2024-INFRA-09 classified at-risk. Delivery deadline: June 30, 2024. Blocker count: 4. Value at risk: $820,000.", boostTerms: ["project", "risk signal", "deliverable"] }],
  ["lyte-chunk-007", { text: "Risk signal: PROJ-2024-INFRA-09 and PROJ-2024-CRM-03 both showing delivery deadline risk. Combined estimated exposure: $2.1M.", boostTerms: ["risk signal", "project"] }],
  ["lyte-chunk-008", { text: "Deliverable DEL-CRM-03-FINAL overdue by 8 days. Blocking phase 2 launch. Project owner: Marcus Webb.", boostTerms: ["deliverable", "project"] }],
  ["lyte-chunk-009", { text: "Stakeholder engagement audit — Q2 governance review: 7 of 14 primary stakeholders have not opened the briefing document as of June 15.", boostTerms: ["stakeholder", "governance"] }],
  ["lyte-chunk-010", { text: "Non-engaged stakeholders list: VP Engineering, CPO, Regional Director EMEA, Director of Procurement, Head of Legal (all showing zero Q2 governance review interaction).", boostTerms: ["stakeholder"] }],
  ["lyte-chunk-011", { text: "Escalation log June 2024: 4 approval chain escalations triggered. 3 resolved within 48h. 1 escalation (AC-2024-Q2-07) remains open pending CFO availability.", boostTerms: ["escalation", "approval chain"] }],
  ["lyte-chunk-012", { text: "Resolution record: Escalation ESC-2024-06-22 resolved by interim CFO sign-off. Policy exception documented. Proof chain ID: PC-0847.", boostTerms: ["escalation"] }],
  ["lyte-chunk-013", { text: "Deliverable DEL-PROJ-19-ARCH overdue 12 days. Blocking DEL-PROJ-19-IMPL. Root cause: design review feedback not acted on.", boostTerms: ["deliverable", "stalled"] }],
  ["lyte-chunk-014", { text: "4 overdue deliverables are blocking downstream milestones across 2 active projects. Aggregate value at risk from delays: $1.7M.", boostTerms: ["deliverable", "stalled"] }],
]);
