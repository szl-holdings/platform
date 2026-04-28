import type { DomainProfile } from '../schema.js';

export const lyteGovernanceOps: DomainProfile = {
  profileId: 'lyte_governance_ops',
  version: '1.0.0',
  domain: 'lyte_governance_ops',
  displayName: 'KORA — Governance & Operations Intelligence',
  description:
    "Retrieval profile for KORA's governed decision-intelligence surfaces. Optimised for documents describing approval chains, operational risk signals, ownership gaps, stalled workflows, and stakeholder engagement records. Exact-match boost is applied to opportunity IDs, project codes, approval chain IDs, and deliverable references so that structured identifiers always surface their primary document at the top of the result set.",
  status: 'active',

  chunkingStrategy: {
    method: 'hybrid',
    targetTokens: 480,
    overlapTokens: 80,
    respectBoundaries: true,
    splitOnHeadings: true,
    minChunkTokens: 96,
  },

  queryPromptTemplate: {
    templateId: 'lyte_gov_query_v1',
    version: '1.0.0',
    template:
      'You are a retrieval query encoder for KORA, a governed decision-intelligence platform. ' +
      'Encode the following user question to retrieve operational governance documents, approval chain records, ' +
      'risk signals, and stakeholder briefings. Preserve any identifiers such as opportunity codes, ' +
      'project references, or approval chain IDs verbatim.\n\nQuery: {{query}}',
    variables: ['query'],
    description: 'Query-side prompt for KORA governance and operations documents',
  },

  documentPromptTemplate: {
    templateId: 'lyte_gov_doc_v1',
    version: '1.0.0',
    template:
      "You are a document encoder for KORA's operational knowledge base. " +
      'Encode the following document so it can be retrieved by queries about operational risk, ' +
      'governance events, approval chain status, stakeholder actions, and business outcomes. ' +
      'Preserve all identifiers and structured references exactly.\n\nDocument: {{document}}',
    variables: ['document'],
    description: 'Document-side prompt for KORA governance corpus',
  },

  defaultMetadataFilters: {
    domain: 'lyte',
    entityTypes: [
      'opportunity',
      'project',
      'approval_chain',
      'stakeholder',
      'deliverable',
      'recommendation',
    ],
  },

  exactMatchBoostTerms: [
    'opportunity',
    'approval chain',
    'stakeholder',
    'deliverable',
    'project code',
    'risk signal',
    'ownership gap',
    'stalled',
    'escalation',
    'governance',
  ],
  boostRuleIds: ['entity-id', 'custom'],

  rerankEnabled: true,
  topK: 12,
  maxCandidates: 80,

  scoreThresholds: {
    minimumRelevanceScore: 0.35,
    rerankDropBelowScore: 0.4,
    exactMatchBoostFloor: 0.25,
    highConfidenceThreshold: 0.78,
  },

  privacyLevel: 'internal',
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

  createdAt: '2026-04-20T00:00:00.000Z',
  updatedAt: '2026-04-20T00:00:00.000Z',
};
