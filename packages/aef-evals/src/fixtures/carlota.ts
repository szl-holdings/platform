import type { GoldenQuery } from "../metrics.js";

export const CARLOTA_GOLDEN_QUERIES: GoldenQuery[] = [
  {
    queryId: "carlota-q001",
    query: "Retrieve the strategy brief for engagement ENG-2024-CJ-007.",
    relevantChunkIds: ["carlota-chunk-001", "carlota-chunk-002"],
    exactMatchBoostTerms: ["engagement", "advisory brief"],
    metadata: { domain: "carlota", entityTypes: ["engagement"] },
  },
  {
    queryId: "carlota-q002",
    query: "What deliverables were completed in the brand positioning project for Client Ref CJ-P-0042?",
    relevantChunkIds: ["carlota-chunk-003", "carlota-chunk-004"],
    exactMatchBoostTerms: ["client reference", "brand positioning", "deliverable"],
    metadata: { domain: "carlota", entityTypes: ["engagement"] },
  },
  {
    queryId: "carlota-q003",
    query: "Which retainer clients are in the active engagement stage this quarter?",
    relevantChunkIds: ["carlota-chunk-005", "carlota-chunk-006"],
    exactMatchBoostTerms: ["retainer", "engagement"],
    metadata: { domain: "carlota", entityTypes: ["engagement"] },
  },
  {
    queryId: "carlota-q004",
    query: "Show me the strategy advisory brief for the principal's Q3 board presentation.",
    relevantChunkIds: ["carlota-chunk-007", "carlota-chunk-008"],
    exactMatchBoostTerms: ["strategy", "advisory brief", "principal"],
    metadata: { domain: "carlota", entityTypes: ["engagement"] },
  },
  {
    queryId: "carlota-q005",
    query: "What outstanding invoices are linked to the operations advisory retainer?",
    relevantChunkIds: ["carlota-chunk-009", "carlota-chunk-010"],
    exactMatchBoostTerms: ["invoice", "retainer"],
    metadata: { domain: "carlota", entityTypes: ["engagement"] },
  },
  {
    queryId: "carlota-q006",
    query: "List project milestones achieved for engagement ENG-2024-CJ-012.",
    relevantChunkIds: ["carlota-chunk-011", "carlota-chunk-012"],
    exactMatchBoostTerms: ["project milestone", "engagement"],
    metadata: { domain: "carlota", entityTypes: ["engagement"] },
  },
];

export const CARLOTA_MOCK_CORPUS = new Map<string, { text: string; boostTerms: string[] }>([
  ["carlota-chunk-001", { text: "Engagement ENG-2024-CJ-007 — Strategy Advisory. Principal: [REDACTED]. Status: Active. Advisory brief: Repositioning the operating entity from regional to national scope. Three pillars: market expansion, brand credibility, and operational consolidation.", boostTerms: ["engagement", "advisory brief"] }],
  ["carlota-chunk-002", { text: "ENG-2024-CJ-007 strategy brief summary: analysis of six comparable market entries over prior 5 years. Recommendation: phased national expansion starting Q3 2024, anchored in two pilot markets. Confidence: HIGH.", boostTerms: ["engagement", "advisory brief"] }],
  ["carlota-chunk-003", { text: "Client Reference CJ-P-0042 — Brand Positioning Project. Deliverables completed: (1) Brand audit report, (2) Positioning framework document, (3) Visual identity brief, (4) Key message architecture. All four delivered and accepted as of 2024-05-30.", boostTerms: ["client reference", "brand positioning", "deliverable"] }],
  ["carlota-chunk-004", { text: "CJ-P-0042 brand positioning — principal feedback: framework approved. Visual identity brief forwarded to external design firm. Key message architecture approved for use in Q3 communications rollout.", boostTerms: ["client reference", "brand positioning", "deliverable"] }],
  ["carlota-chunk-005", { text: "Active retainer engagements Q3 2024: ENG-2024-CJ-007 (strategy), ENG-2024-CJ-009 (operations), ENG-2024-CJ-011 (brand). All three principals have confirmed Q3 continuity. ENG-2024-CJ-011 scheduled for scope review July 10.", boostTerms: ["retainer", "engagement"] }],
  ["carlota-chunk-006", { text: "Retainer client status — active engagements: 3 principals on monthly retainer, 2 on project retainer. All retainer agreements current. Next renewal review cycle: September 2024.", boostTerms: ["retainer", "engagement"] }],
  ["carlota-chunk-007", { text: "Q3 board presentation strategy advisory brief — Principal advisory note: framework for presenting the operating portfolio to board. Recommended narrative arc: resilience thesis, then growth thesis, then capital allocation discussion.", boostTerms: ["strategy", "advisory brief", "principal"] }],
  ["carlota-chunk-008", { text: "Strategy brief for Q3 board: presentation structure agreed with principal 2024-06-28. Opening: operating summary (5 slides). Middle: strategic priorities (8 slides). Close: capital ask and timeline (3 slides). Rehearsal scheduled July 14.", boostTerms: ["strategy", "advisory brief"] }],
  ["carlota-chunk-009", { text: "Outstanding invoices — operations advisory retainer: INV-2024-CJ-039 ($8,500, 45 days outstanding). INV-2024-CJ-044 ($8,500, 15 days outstanding). Both linked to ENG-2024-CJ-009 operations retainer.", boostTerms: ["invoice", "retainer"] }],
  ["carlota-chunk-010", { text: "Operations advisory retainer billing summary: ENG-2024-CJ-009. Retainer rate: $8,500/month. Invoices issued: 6. Invoices paid: 4. Invoices outstanding: 2. Aging: INV-039 (45d), INV-044 (15d).", boostTerms: ["invoice", "retainer"] }],
  ["carlota-chunk-011", { text: "Engagement ENG-2024-CJ-012 — Brand Advisory. Project milestones achieved: M1 Discovery complete (April 8), M2 Brand architecture approved (May 14), M3 Launch collateral delivered (June 3). M4 Rollout support in progress.", boostTerms: ["project milestone", "engagement"] }],
  ["carlota-chunk-012", { text: "ENG-2024-CJ-012 milestone completion record: 3 of 4 milestones complete. M4 (6-month rollout support) 40% complete as of June 30, 2024. On track for full completion by Q4.", boostTerms: ["project milestone", "engagement"] }],
]);
