import type { GoldenQuery } from "../metrics.js";

export const PRISM_GOLDEN_QUERIES: GoldenQuery[] = [
  {
    queryId: "prism-q001",
    query: "What are the upcoming filing deadlines for matter 14:23-cv-Beacon?",
    relevantChunkIds: ["prism-chunk-001", "prism-chunk-002"],
    exactMatchBoostTerms: ["docket", "filing deadline"],
    metadata: { domain: "counsel", entityTypes: ["matter", "obligation"] },
  },
  {
    queryId: "prism-q002",
    query: "Retrieve all discovery obligations for case number 2024-SDNY-04821.",
    relevantChunkIds: ["prism-chunk-003", "prism-chunk-004", "prism-chunk-005"],
    exactMatchBoostTerms: ["docket", "case number", "discovery"],
    metadata: { domain: "counsel", entityTypes: ["obligation"] },
  },
  {
    queryId: "prism-q003",
    query: "Which regulatory filings are due under GDPR Article 33 within the next 30 days?",
    relevantChunkIds: ["prism-chunk-006", "prism-chunk-007"],
    exactMatchBoostTerms: ["regulatory", "citation", "statute"],
    metadata: { domain: "counsel", entityTypes: ["obligation"] },
  },
  {
    queryId: "prism-q004",
    query: "Show me the deposition schedule for the Meridian Holdings matter.",
    relevantChunkIds: ["prism-chunk-008", "prism-chunk-009"],
    exactMatchBoostTerms: ["deposition", "obligation"],
    metadata: { domain: "counsel", entityTypes: ["matter", "obligation"] },
  },
  {
    queryId: "prism-q005",
    query: "Which active matters have obligations that were missed last quarter?",
    relevantChunkIds: ["prism-chunk-010", "prism-chunk-011"],
    exactMatchBoostTerms: ["obligation", "filing deadline"],
    metadata: { domain: "counsel", entityTypes: ["obligation"] },
  },
  {
    queryId: "prism-q006",
    query: "What summons and complaints have been received in the past 14 days?",
    relevantChunkIds: ["prism-chunk-012", "prism-chunk-013"],
    exactMatchBoostTerms: ["summons", "complaint"],
    metadata: { domain: "counsel", entityTypes: ["matter"] },
  },
];

export const PRISM_MOCK_CORPUS = new Map<string, { text: string; boostTerms: string[] }>([
  ["prism-chunk-001", { text: "Matter 14:23-cv-Beacon — SDNY. Filing deadlines: Motion to Dismiss response due 2024-07-12. Pre-trial conference: 2024-08-05. Trial date: 2025-01-14. Counsel: Greenfield & Partners LLP.", boostTerms: ["docket", "filing deadline"] }],
  ["prism-chunk-002", { text: "Docket 14:23-cv-Beacon obligation log: 3 upcoming deadlines within 30 days. Priority 1 — response to summary judgment motion (July 12). Priority 2 — expert witness disclosure (July 22). Priority 3 — joint pretrial order (August 5).", boostTerms: ["docket", "filing deadline"] }],
  ["prism-chunk-003", { text: "Case number 2024-SDNY-04821 discovery schedule: document production Phase 1 deadline 2024-07-01. ESI collection scope: emails July 2022 — December 2023, custodians: 14. Opposing counsel: Morton & Vance.", boostTerms: ["docket", "case number", "discovery"] }],
  ["prism-chunk-004", { text: "2024-SDNY-04821 discovery obligations: interrogatories response due 2024-06-28 (OVERDUE — 2 days). Request for admission response due 2024-07-15. Deposition of corporate representative: 2024-07-22.", boostTerms: ["case number", "discovery"] }],
  ["prism-chunk-005", { text: "Matter 2024-SDNY-04821 discovery compliance status: Phase 1 document production 68% complete. 34,200 documents reviewed, 9,800 produced. 4 custodians pending ESI collection. Privilege log due alongside production.", boostTerms: ["discovery", "obligation"] }],
  ["prism-chunk-006", { text: "GDPR Article 33 — Data Breach Notification obligations: 2 upcoming 72-hour notification windows. Incident REF-2024-PII-07 notification to ICO due 2024-06-30 23:59 UTC. Incident REF-2024-PII-09 due 2024-07-08.", boostTerms: ["regulatory", "citation", "statute"] }],
  ["prism-chunk-007", { text: "GDPR Art. 33 compliance calendar: SZL Holdings has 3 reportable incidents in 30-day window. ICO notifications: 2 filed on time, 1 pending (REF-2024-PII-09). Statutory citation: GDPR Regulation (EU) 2016/679, Art. 33(1).", boostTerms: ["regulatory", "citation"] }],
  ["prism-chunk-008", { text: "Meridian Holdings matter — deposition schedule: Marcus Webb (CEO) deposition set 2024-07-18, 9:00 AM EST, Jones Day offices. Legal hold confirmed. Witness prep session: 2024-07-16.", boostTerms: ["deposition", "obligation"] }],
  ["prism-chunk-009", { text: "Meridian Holdings deposition plan: 5 witnesses scheduled over 3 weeks. Order: M. Webb (CEO), A. Reyes (CFO), P. Huang (General Counsel), 2 former employees. Total estimated deposition hours: 18.", boostTerms: ["deposition"] }],
  ["prism-chunk-010", { text: "Missed obligation audit Q1 2024: 3 matters with overdue obligations. Matter MTR-2024-009: expert witness deadline missed by 4 days (waiver obtained). Matter MTR-2024-017: regulatory response 1 day late (no prejudice). Matter MTR-2024-022: deposition notice served 2 days late.", boostTerms: ["obligation", "filing deadline"] }],
  ["prism-chunk-011", { text: "Q1 missed obligation impact assessment: no sanctions imposed. 2 of 3 matters obtained waivers. MTR-2024-022 opposing counsel accepted late service without prejudice. Lesson-learned process initiated. Notification escalation protocol updated.", boostTerms: ["obligation"] }],
  ["prism-chunk-012", { text: "Summons received — new matter opened: summons and complaint served on SZL Holdings Ltd 2024-06-24. Filed in SDNY. Plaintiff: Apex Capital Management LLC. Case number assigned: 2024-SDNY-05102. Response deadline: 2024-07-24.", boostTerms: ["summons", "complaint"] }],
  ["prism-chunk-013", { text: "14-day summons intake log: 2 summons received. (1) Apex Capital v. SZL Holdings — SDNY, commercial dispute, served 2024-06-24. (2) State of New York regulatory inquiry notice — served 2024-06-28. Both logged and assigned to counsel.", boostTerms: ["summons", "complaint"] }],
]);
