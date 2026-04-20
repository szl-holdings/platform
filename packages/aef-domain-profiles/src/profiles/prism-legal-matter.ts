import type { DomainProfile } from '../schema.js';

export const prismLegalMatter: DomainProfile = {
  profileId: 'prism_legal_matter',
  version: '1.0.0',
  domain: 'prism_legal_matter',
  displayName: 'PRISM Counsel — Legal Matter Command',
  description:
    'Retrieval profile for PRISM Counsel, the governed legal matter management platform. Optimised for matter briefs, filing obligation timelines, discovery logs, contract clauses, regulatory compliance filings, and court docket entries. Docket IDs and case numbers receive a 1.9× exact-match boost. Citation codes and regulation references receive a 1.7× boost, guaranteeing that every structured legal identifier surfaces its authoritative matter record at the head of the result set. All retrieval operations are subject to attorney-client privilege handling and must not cross matter boundaries.',
  status: 'active',

  chunkingStrategy: {
    method: 'hybrid',
    targetTokens: 512,
    overlapTokens: 96,
    respectBoundaries: true,
    splitOnHeadings: true,
    minChunkTokens: 128,
  },

  queryPromptTemplate: {
    templateId: 'prism_legal_query_v1',
    version: '1.0.0',
    template:
      'You are a retrieval query encoder for PRISM Counsel, a governed legal matter management platform. ' +
      'Encode the following question to retrieve matter briefs, filing obligation records, discovery documents, ' +
      'contract clauses, and regulatory compliance filings. ' +
      'Preserve docket IDs, case numbers, citation codes, court names, and regulation identifiers exactly as written.\n\nQuery: {{query}}',
    variables: ['query'],
    description: 'Query-side prompt for PRISM Counsel legal matter corpus',
  },

  documentPromptTemplate: {
    templateId: 'prism_legal_doc_v1',
    version: '1.0.0',
    template:
      "You are a document encoder for PRISM Counsel's legal matter knowledge base. " +
      'Encode the following document so it can be retrieved by queries about legal obligations, matter status, ' +
      'filing deadlines, contract risk, discovery timelines, regulatory requirements, and counsel coordination. ' +
      'Preserve all docket IDs, case numbers, citation codes, and court references exactly.\n\nDocument: {{document}}',
    variables: ['document'],
    description: 'Document-side prompt for PRISM Counsel legal corpus',
  },

  defaultMetadataFilters: {
    domain: 'counsel',
    entityTypes: ['matter', 'obligation', 'signal', 'recommendation', 'evidence'],
  },

  exactMatchBoostTerms: [
    'docket',
    'case number',
    'citation',
    'filing deadline',
    'discovery',
    'obligation',
    'regulatory',
    'court of record',
    'statute',
    'summons',
    'complaint',
    'deposition',
  ],
  boostRuleIds: ['docket-id', 'case-number', 'citation-code', 'regulation-code'],

  rerankEnabled: true,
  topK: 10,
  maxCandidates: 80,

  scoreThresholds: {
    minimumRelevanceScore: 0.45,
    rerankDropBelowScore: 0.5,
    exactMatchBoostFloor: 0.35,
    highConfidenceThreshold: 0.85,
  },

  privacyLevel: 'privileged',
  retentionRules: {
    defaultRetentionDays: 2555,
    requestLogRetentionDays: 365,
    evidenceRetentionDays: 3650,
    deletionRequired: true,
    auditTrailRetentionDays: 3650,
    encryptAtRest: true,
    encryptInTransit: true,
    allowCrossRegionReplication: false,
  },

  createdAt: '2026-04-20T00:00:00.000Z',
  updatedAt: '2026-04-20T00:00:00.000Z',
};
