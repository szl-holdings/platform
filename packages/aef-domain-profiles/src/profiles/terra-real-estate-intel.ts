import type { DomainProfile } from "../schema.js";

export const terraRealEstateIntel: DomainProfile = {
  profileId: "terra_real_estate_intel",
  version: "1.0.0",
  domain: "terra_real_estate_intel",
  displayName: "Terra — NYC Real Estate Intelligence",
  description:
    "Retrieval profile for Terra, the property intelligence platform focused on New York City distressed-asset markets. Optimised for property ownership records, tax lien filings, distress signal reports, deal pipeline entries, market comps, and borough-level analysis. NYC parcel IDs (BBL format: borough-block-lot) receive a 1.9× exact-match boost, guaranteeing that structured parcel identifiers surface the primary property record at position one. Property address matching is additionally boosted to recover documents written in vernacular address formats.",
  status: "active",

  chunkingStrategy: {
    method: "semantic",
    targetTokens: 448,
    overlapTokens: 72,
    respectBoundaries: true,
    splitOnHeadings: true,
    minChunkTokens: 80,
  },

  queryPromptTemplate: {
    templateId: "terra_rei_query_v1",
    version: "1.0.0",
    template:
      "You are a retrieval query encoder for Terra, a New York City property intelligence platform. " +
      "Encode the following user question to retrieve property ownership records, distress signal reports, " +
      "deal pipeline entries, tax lien documents, and market analysis. " +
      "Preserve NYC parcel IDs (BBL), property addresses, owner names, and borough references exactly.\n\nQuery: {{query}}",
    variables: ["query"],
    description: "Query-side prompt for Terra real estate intelligence documents",
  },

  documentPromptTemplate: {
    templateId: "terra_rei_doc_v1",
    version: "1.0.0",
    template:
      "You are a document encoder for Terra's real estate intelligence corpus. " +
      "Encode the following document so it can be retrieved by queries about property distress, ownership structures, " +
      "deal stages, tax liens, market comps, and borough-level risk. " +
      "Preserve all NYC parcel IDs, property addresses, and ownership entity names exactly.\n\nDocument: {{document}}",
    variables: ["document"],
    description: "Document-side prompt for Terra real estate corpus",
  },

  defaultMetadataFilters: {
    domain: "terra",
    entityTypes: ["property", "deal", "signal", "recommendation"],
  },

  exactMatchBoostTerms: [
    "parcel ID",
    "BBL",
    "borough-block-lot",
    "property address",
    "tax lien",
    "distress",
    "lis pendens",
    "deed in lieu",
    "foreclosure",
    "owner of record",
    "co-op",
    "condo board",
  ],
  boostRuleIds: ["parcel-id", "property-address"],

  rerankEnabled: true,
  topK: 12,
  maxCandidates: 100,

  scoreThresholds: {
    minimumRelevanceScore: 0.38,
    rerankDropBelowScore: 0.42,
    exactMatchBoostFloor: 0.28,
    highConfidenceThreshold: 0.77,
  },

  privacyLevel: "internal",
  retentionRules: {
    defaultRetentionDays: 365,
    requestLogRetentionDays: 90,
    evidenceRetentionDays: 730,
    deletionRequired: false,
    auditTrailRetentionDays: 1825,
    encryptAtRest: true,
    encryptInTransit: true,
    allowCrossRegionReplication: false,
  },

  createdAt: "2026-04-20T00:00:00.000Z",
  updatedAt: "2026-04-20T00:00:00.000Z",
};
};
