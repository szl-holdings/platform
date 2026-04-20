import type { GoldenFixtureSet } from "../types.js";

export const realEstateFixtures: GoldenFixtureSet = {
  fixtureSetId: "terra-real-estate-intel-golden-v1",
  profileId: "terra_real_estate_intel",
  domain: "real-estate",
  description:
    "Golden retrieval fixtures for the Terra Real Estate Intelligence profile. Covers parcel ID lookup, APN search, comparable transaction retrieval, zoning, and lease analysis.",
  queries: [
    {
      queryId: "re-q001",
      query: "parcel 123-456-789 Dallas County TX property assessment",
      relevantChunkIds: ["chunk-parcel-123-456-789-assessment", "chunk-parcel-123-456-789-deed"],
      notes: "Parcel ID exact match should dominate results over county-level assessments.",
    },
    {
      queryId: "re-q002",
      query: "APN 123-456-789-0 comparable sales cap rate office building",
      relevantChunkIds: ["chunk-apn-123-456-789-0-comps", "chunk-office-cap-rate-dallas-2024"],
    },
    {
      queryId: "re-q003",
      query: "lease CONTRACT-2024-LEASE-001 triple net tenant occupancy",
      relevantChunkIds: ["chunk-lease-2024-001-terms", "chunk-lease-2024-001-nnn-clauses"],
    },
    {
      queryId: "re-q004",
      query: "zoning permit commercial mixed-use downtown redevelopment",
      relevantChunkIds: ["chunk-zoning-mixed-use-downtown", "chunk-permit-2024-redevelopment"],
    },
    {
      queryId: "re-q005",
      query: "NOI cap rate multifamily portfolio Q3 2024",
      relevantChunkIds: ["chunk-multifamily-noi-q3-2024", "chunk-portfolio-cap-rate-analysis"],
    },
  ],
};
