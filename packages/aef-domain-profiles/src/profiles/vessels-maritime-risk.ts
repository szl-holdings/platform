import type { DomainProfile } from "../schema.js";

export const vesselsMartitimeRisk: DomainProfile = {
  profileId: "vessels_maritime_risk",
  version: "1.0.0",
  domain: "vessels_maritime_risk",
  displayName: "Vessels — Maritime Risk Intelligence",
  description:
    "Retrieval profile for Vessels, the full-spectrum maritime domain awareness platform. Optimised for vessel incident reports, voyage risk assessments, AIS anomaly logs, dark-vessel detection advisories, sanctions screening records, and port-state control findings. IMO numbers receive a 2× score boost and MMSI identifiers a 1.8× boost, ensuring that structured maritime identifiers deterministically surface the correct vessel record regardless of query phrasing.",
  status: "active",

  chunkingStrategy: {
    method: "paragraph",
    targetTokens: 512,
    overlapTokens: 64,
    respectBoundaries: true,
    splitOnHeadings: true,
    minChunkTokens: 80,
  },

  queryPromptTemplate: {
    templateId: "vessels_risk_query_v1",
    version: "1.0.0",
    template:
      "You are a retrieval query encoder for Vessels, a maritime domain awareness platform. " +
      "Encode the following user question to retrieve maritime risk assessments, vessel profiles, voyage records, " +
      "AIS anomaly reports, and sanctions screening data. " +
      "Preserve IMO numbers, MMSI codes, port names, and flag-state references exactly as written.\n\nQuery: {{query}}",
    variables: ["query"],
    description: "Query-side prompt for maritime risk and vessel intelligence documents",
  },

  documentPromptTemplate: {
    templateId: "vessels_risk_doc_v1",
    version: "1.0.0",
    template:
      "You are a document encoder for the Vessels maritime intelligence corpus. " +
      "Encode the following document so it can be retrieved by queries about vessel risk, voyage anomalies, " +
      "AIS status changes, port-state control outcomes, sanctions flags, and maritime regulatory compliance. " +
      "Preserve all IMO numbers, MMSI codes, and flag-state references exactly.\n\nDocument: {{document}}",
    variables: ["document"],
    description: "Document-side prompt for maritime risk corpus",
  },

  defaultMetadataFilters: {
    domain: "vessels",
    entityTypes: ["vessel", "voyage", "incident", "threat", "signal"],
  },

  exactMatchBoostTerms: [
    "IMO",
    "MMSI",
    "vessel name",
    "AIS",
    "dark vessel",
    "sanctions",
    "flag state",
    "port-state control",
    "voyage",
    "cargo manifest",
    "Automatic Identification System",
  ],
  boostRuleIds: ["imo-number", "mmsi", "vessel-name", "sanctions-name"],

  rerankEnabled: true,
  topK: 10,
  maxCandidates: 100,

  scoreThresholds: {
    minimumRelevanceScore: 0.40,
    rerankDropBelowScore: 0.45,
    exactMatchBoostFloor: 0.30,
    highConfidenceThreshold: 0.80,
  },

  privacyLevel: "confidential",
  retentionRules: {
    defaultRetentionDays: 730,
    requestLogRetentionDays: 180,
    evidenceRetentionDays: 1095,
    deletionRequired: false,
    auditTrailRetentionDays: 2555,
    encryptAtRest: true,
    encryptInTransit: true,
    allowCrossRegionReplication: false,
  },

  createdAt: "2026-04-20T00:00:00.000Z",
  updatedAt: "2026-04-20T00:00:00.000Z",
};
