import type { GoldenFixtureSet } from "../types.js";

export const maritimeFixtures: GoldenFixtureSet = {
  fixtureSetId: "vessels-maritime-risk-golden-v1",
  profileId: "vessels_maritime_risk",
  domain: "maritime",
  description:
    "Golden retrieval fixtures for the Vessels Maritime Risk profile. Covers IMO number lookup, MMSI search, sanctions screening, dark vessel detection, and PSC detention queries.",
  queries: [
    {
      queryId: "mar-q001",
      query: "IMO 9123456 vessel port history Gulf of Mexico",
      relevantChunkIds: ["chunk-imo-9123456-port-history", "chunk-imo-9123456-manifest"],
      notes: "Exact IMO match should be boosted above fuzzy vessel name matches.",
    },
    {
      queryId: "mar-q002",
      query: "MMSI 123456789 AIS gap dark vessel spoofing Indian Ocean",
      relevantChunkIds: ["chunk-mmsi-123456789-ais-gap", "chunk-dark-vessel-iocean-2024"],
      notes: "MMSI exact match with dark vessel flag.",
    },
    {
      queryId: "mar-q003",
      query: "OFAC SDN sanctions tanker flag state Panama 2024",
      relevantChunkIds: ["chunk-sdn-tanker-panama-2024", "chunk-ofac-sdn-list-2024-q3"],
      notes: "Sanctions entity name exact match should rank above generic tanker content.",
    },
    {
      queryId: "mar-q004",
      query: "PSC detention bulk carrier port state control Singapore",
      relevantChunkIds: ["chunk-psc-singapore-2024-001", "chunk-psc-bulk-carrier-record"],
    },
    {
      queryId: "mar-q005",
      query: "classification society renewal certificate cargo ship",
      relevantChunkIds: ["chunk-class-cert-renewal-2024", "chunk-cargo-ship-certificate"],
    },
  ],
};
