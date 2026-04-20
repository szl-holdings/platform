import type { GoldenQuery } from "../metrics.js";

export const TERRA_GOLDEN_QUERIES: GoldenQuery[] = [
  {
    queryId: "terra-q001",
    query: "Show me distressed properties in Brooklyn with parcel ID 309-442-1001.",
    relevantChunkIds: ["terra-chunk-001", "terra-chunk-002"],
    exactMatchBoostTerms: ["parcel ID", "BBL", "distress"],
    metadata: { domain: "terra", entityTypes: ["property"] },
  },
  {
    queryId: "terra-q002",
    query: "Which properties in Manhattan have active tax lien filings?",
    relevantChunkIds: ["terra-chunk-003", "terra-chunk-004", "terra-chunk-005"],
    exactMatchBoostTerms: ["tax lien", "distress"],
    metadata: { domain: "terra", entityTypes: ["property"] },
  },
  {
    queryId: "terra-q003",
    query: "What is the ownership structure behind 548 West 46th Street?",
    relevantChunkIds: ["terra-chunk-006", "terra-chunk-007"],
    exactMatchBoostTerms: ["property address", "owner of record"],
    metadata: { domain: "terra", entityTypes: ["property"] },
  },
  {
    queryId: "terra-q004",
    query: "List all deals in the diligence stage within the Bronx portfolio.",
    relevantChunkIds: ["terra-chunk-008", "terra-chunk-009"],
    exactMatchBoostTerms: ["BBL", "distress"],
    metadata: { domain: "terra", entityTypes: ["deal"] },
  },
  {
    queryId: "terra-q005",
    query: "Are there any lis pendens filings on properties controlled by Hudson Valley Holdings?",
    relevantChunkIds: ["terra-chunk-010", "terra-chunk-011"],
    exactMatchBoostTerms: ["lis pendens", "distress", "owner of record"],
    metadata: { domain: "terra", entityTypes: ["property"] },
  },
  {
    queryId: "terra-q006",
    query: "What co-op boards have outstanding violations in Queens?",
    relevantChunkIds: ["terra-chunk-012", "terra-chunk-013"],
    exactMatchBoostTerms: ["co-op", "distress"],
    metadata: { domain: "terra", entityTypes: ["property"] },
  },
];

export const TERRA_MOCK_CORPUS = new Map<string, { text: string; boostTerms: string[] }>([
  ["terra-chunk-001", { text: "Property record — Parcel ID: 309-442-1001 (BBL: 3-09442-1001). Address: 4821 Church Avenue, Brooklyn, NY. Owner of record: Bethlehem Realty LLC. Distress score: 0.74. Active liens: 2.", boostTerms: ["parcel ID", "BBL", "distress"] }],
  ["terra-chunk-002", { text: "Distress signal: BBL 3-09442-1001 — 4821 Church Ave Brooklyn — tax delinquency notice filed 2024-01-18. HPD violations: 7 open. Classified as high-distress asset.", boostTerms: ["parcel ID", "BBL", "distress"] }],
  ["terra-chunk-003", { text: "Manhattan tax lien report Q2 2024: 234 properties with active NYC Department of Finance tax lien filings. Highest concentration in Hell's Kitchen and East Harlem sub-markets.", boostTerms: ["tax lien", "distress"] }],
  ["terra-chunk-004", { text: "Tax lien filing — 219 W 81st Street, Manhattan (BBL 1-01234-0056). Owner: Riverside Property Partners LLC. Lien amount: $148,000. Filed: 2024-03-02.", boostTerms: ["tax lien", "distress"] }],
  ["terra-chunk-005", { text: "Tax lien cluster alert: 12 Manhattan properties owned by entities linked to Harlem Capital Group showing simultaneous lien filings in Q1 2024. Portfolio distress indicator triggered.", boostTerms: ["tax lien", "distress"] }],
  ["terra-chunk-006", { text: "Ownership chain — 548 West 46th Street, Manhattan (BBL 1-01075-0032): Owner of record: West Side Developments LLC. Beneficial controller: Marcus Webb (90% interest via holding entity MWP Holdings NJ).", boostTerms: ["property address", "owner of record"] }],
  ["terra-chunk-007", { text: "548 W 46th Street ownership history: conveyed from Meridian NYC LLC to West Side Developments LLC on 2022-11-14. Transfer price: $4.2M. Mortgage: $3.1M (First Republic, now JPMorgan).", boostTerms: ["property address", "owner of record"] }],
  ["terra-chunk-008", { text: "Bronx deal pipeline — diligence stage: 4 active deals. Deal D-2024-BX-07 (2456 Grand Concourse), D-2024-BX-09 (714 E 180th St), D-2024-BX-12 (99 Lincoln Ave), D-2024-BX-15 (4501 Third Ave).", boostTerms: ["BBL", "distress"] }],
  ["terra-chunk-009", { text: "Deal D-2024-BX-07 — 2456 Grand Concourse, Bronx. Diligence stage. Estimated value: $6.8M. Distress score: 0.81. Tax arrears: $212,000. LOI signed: 2024-05-28.", boostTerms: ["BBL", "distress"] }],
  ["terra-chunk-010", { text: "Lis pendens filing — Owner: Hudson Valley Holdings LLC. Properties affected: 3 in Brooklyn, 1 in Queens. Filing date: 2024-04-03. Foreclosure action initiated by lender First National Community Bank.", boostTerms: ["lis pendens", "distress", "owner of record"] }],
  ["terra-chunk-011", { text: "Hudson Valley Holdings — lis pendens cluster: BBLs 3-05812-0044, 3-06231-0017, 3-07809-0023, 4-11204-0088. All filed within 10-day window. Possible strategic default scenario.", boostTerms: ["lis pendens", "distress"] }],
  ["terra-chunk-012", { text: "Co-op board violations — Queens Q2 2024: Forest Hills Gardens Co-op (BBL 4-01823-0010): 4 open ECB violations. Kew Gardens Residence Corp (BBL 4-02107-0041): 2 open violations.", boostTerms: ["co-op", "distress"] }],
  ["terra-chunk-013", { text: "Queens co-op outstanding violations summary: 17 co-op boards with active Department of Buildings violations as of June 2024. Top violation category: elevator maintenance non-compliance.", boostTerms: ["co-op", "distress"] }],
]);
