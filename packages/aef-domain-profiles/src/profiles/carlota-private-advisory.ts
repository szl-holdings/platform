import type { DomainProfile } from '../schema.js';

export const carlotaPrivateAdvisory: DomainProfile = {
  profileId: 'carlota_private_advisory',
  version: '1.0.0',
  domain: 'carlota_private_advisory',
  displayName: 'Carlota Jo — Private Advisory Intelligence',
  description:
    "Retrieval profile for Carlota Jo, the private advisory brand delivering tailored support to principals who value discretion, precision, and calm execution. Optimised for client engagement records, strategy briefs, brand positioning documents, operational planning notes, and invoice histories. Privacy level is set to 'privileged' — the highest tier — and cross-region replication is explicitly prohibited. Engagement IDs and client reference codes receive exact-match boost. No document retrieved under this profile may be surfaced outside the requesting principal's own tenant boundary.",
  status: 'active',

  chunkingStrategy: {
    method: 'semantic',
    targetTokens: 400,
    overlapTokens: 64,
    respectBoundaries: true,
    splitOnHeadings: false,
    minChunkTokens: 80,
  },

  queryPromptTemplate: {
    templateId: 'carlota_advisory_query_v1',
    version: '1.0.0',
    template:
      'You are a retrieval query encoder for Carlota Jo, a private advisory practice. ' +
      'Encode the following client question to retrieve engagement records, strategy documents, ' +
      'brand positioning briefs, and operational planning notes with full discretion. ' +
      'Preserve engagement IDs, client reference codes, and project names exactly as written.\n\nQuery: {{query}}',
    variables: ['query'],
    description: 'Query-side prompt for Carlota Jo private advisory corpus',
  },

  documentPromptTemplate: {
    templateId: 'carlota_advisory_doc_v1',
    version: '1.0.0',
    template:
      "You are a document encoder for Carlota Jo's private advisory knowledge base. " +
      'Encode the following document so it can be retrieved by queries about client engagements, strategy outcomes, ' +
      'brand advisory deliverables, and operational planning records. ' +
      'Maintain complete discretion. Preserve all engagement IDs and client reference codes exactly.\n\nDocument: {{document}}',
    variables: ['document'],
    description: 'Document-side prompt for Carlota Jo advisory corpus',
  },

  defaultMetadataFilters: {
    domain: 'carlota',
    entityTypes: ['engagement', 'signal', 'recommendation', 'evidence'],
  },

  exactMatchBoostTerms: [
    'engagement',
    'advisory brief',
    'client reference',
    'strategy',
    'brand positioning',
    'retainer',
    'principal',
    'deliverable',
    'invoice',
    'project milestone',
  ],
  boostRuleIds: ['entity-id', 'custom'],

  rerankEnabled: false,
  topK: 8,
  maxCandidates: 40,

  scoreThresholds: {
    minimumRelevanceScore: 0.5,
    rerankDropBelowScore: 0.55,
    exactMatchBoostFloor: 0.4,
    highConfidenceThreshold: 0.88,
  },

  privacyLevel: 'privileged',
  retentionRules: {
    defaultRetentionDays: 1095,
    requestLogRetentionDays: 180,
    evidenceRetentionDays: 2190,
    deletionRequired: true,
    auditTrailRetentionDays: 2555,
    encryptAtRest: true,
    encryptInTransit: true,
    allowCrossRegionReplication: false,
  },

  createdAt: '2026-04-20T00:00:00.000Z',
  updatedAt: '2026-04-20T00:00:00.000Z',
};
