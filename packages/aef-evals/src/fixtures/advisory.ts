import type { GoldenFixtureSet } from "../types.js";

export const advisoryFixtures: GoldenFixtureSet = {
  fixtureSetId: "carlota-private-advisory-golden-v1",
  profileId: "carlota_private_advisory",
  domain: "advisory",
  description:
    "Golden retrieval fixtures for the Carlota Jo Private Advisory profile. Covers engagement record lookup, vendor due diligence, deliverable retrieval, and strategic briefing search.",
  queries: [
    {
      queryId: "adv-q001",
      query: "engagement ENG-2024-001 strategic transformation roadmap deliverables",
      relevantChunkIds: ["chunk-eng-2024-001-roadmap", "chunk-eng-2024-001-deliverables"],
      notes: "Engagement ID exact match should rank highest.",
    },
    {
      queryId: "adv-q002",
      query: "vendor VEND-0042 due diligence financial stability supply chain risk",
      relevantChunkIds: ["chunk-vend-0042-diligence", "chunk-vend-0042-financial-summary"],
    },
    {
      queryId: "adv-q003",
      query: "deliverable DLV-2024-0012 executive briefing board presentation",
      relevantChunkIds: ["chunk-dlv-2024-0012-brief", "chunk-dlv-2024-0012-board-deck"],
    },
    {
      queryId: "adv-q004",
      query: "governance framework risk assessment digital transformation initiative",
      relevantChunkIds: ["chunk-governance-risk-framework", "chunk-digital-transformation-risk"],
    },
    {
      queryId: "adv-q005",
      query: "compliance control CTRL-ACC-001 access governance advisory recommendation",
      relevantChunkIds: ["chunk-ctrl-acc-001-advisory", "chunk-access-governance-recommendation"],
    },
  ],
};
