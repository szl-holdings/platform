import type { GoldenFixtureSet } from "../types.js";

export const legalFixtures: GoldenFixtureSet = {
  fixtureSetId: "prism-legal-matter-golden-v1",
  profileId: "prism_legal_matter",
  domain: "legal",
  description:
    "Golden retrieval fixtures for the PRISM Legal Matter profile. Covers docket number lookup, matter ID search, statute citations, contract retrieval, and deposition document search.",
  queries: [
    {
      queryId: "leg-q001",
      query: "docket 24-1234-CV motion to dismiss antitrust claim",
      relevantChunkIds: ["chunk-docket-24-1234-cv-motion", "chunk-antitrust-brief-2024"],
      notes: "Docket number exact match should rank above general antitrust commentary.",
    },
    {
      queryId: "leg-q002",
      query: "matter MTR-2024-0041 regulatory compliance settlement",
      relevantChunkIds: ["chunk-mtr-2024-0041-settlement", "chunk-mtr-2024-0041-compliance"],
    },
    {
      queryId: "leg-q003",
      query: "15 U.S.C. § 78j securities fraud liability disclosure",
      relevantChunkIds: ["chunk-usc-78j-analysis", "chunk-sec-fraud-case-2024"],
      notes: "Statute citation exact match should boost highly relevant securities law documents.",
    },
    {
      queryId: "leg-q004",
      query: "contract CONTRACT-2024-A001 indemnification clause limitation liability",
      relevantChunkIds: ["chunk-contract-2024-a001-indemnity", "chunk-contract-2024-a001-full"],
    },
    {
      queryId: "leg-q005",
      query: "deposition testimony expert witness damages calculation",
      relevantChunkIds: ["chunk-deposition-expert-damages-2024", "chunk-expert-witness-report"],
    },
  ],
};
