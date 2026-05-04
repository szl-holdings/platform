import type { DomainProfile } from '../schema.js';

export const aegisSecurityIncident: DomainProfile = {
  profileId: 'aegis_security_incident',
  version: '1.0.0',
  domain: 'aegis_security_incident',
  displayName: 'PARAGON — Security Incident & Threat Intelligence',
  description:
    'Retrieval profile for PARAGON, the unified defense and intelligence command platform. Optimised for incident investigation timelines, threat indicator records, CVE advisories, MITRE ATT&CK technique mappings, MSP operational alerts, and cyber-asset exposure reports. CVE identifiers and incident IDs receive a 2× exact-match boost. Control IDs and compliance regulation codes receive a 1.8× boost, ensuring that structured security references surface their authoritative record without ambiguity.',
  status: 'active',

  chunkingStrategy: {
    method: 'paragraph',
    targetTokens: 384,
    overlapTokens: 48,
    respectBoundaries: true,
    splitOnHeadings: true,
    minChunkTokens: 64,
  },

  queryPromptTemplate: {
    templateId: 'aegis_sec_query_v1',
    version: '1.0.0',
    template:
      'You are a retrieval query encoder for PARAGON, a unified security operations and threat intelligence platform. ' +
      'Encode the following question to retrieve incident reports, threat indicator records, CVE advisories, ' +
      'MITRE ATT&CK mappings, control gap findings, and compliance audit results. ' +
      'Preserve CVE IDs, incident IDs, control IDs, MITRE technique IDs (e.g. T1078), and regulation codes exactly.\n\nQuery: {{query}}',
    variables: ['query'],
    description: 'Query-side prompt for PARAGON security incident and threat intelligence corpus',
  },

  documentPromptTemplate: {
    templateId: 'aegis_sec_doc_v1',
    version: '1.0.0',
    template:
      "You are a document encoder for PARAGON's security and threat intelligence knowledge base. " +
      'Encode the following document so it can be retrieved by queries about threat actors, incident timelines, ' +
      'CVE exploitability, control effectiveness, compliance posture, and cyber-asset criticality. ' +
      'Preserve all CVE IDs, MITRE technique references, incident IDs, and regulation codes exactly.\n\nDocument: {{document}}',
    variables: ['document'],
    description: 'Document-side prompt for PARAGON security corpus',
  },

  defaultMetadataFilters: {
    domain: 'security',
    entityTypes: ['incident', 'threat', 'cyber_asset', 'control', 'signal', 'recommendation'],
    tlpLevels: ['white', 'green', 'amber'],
  },

  exactMatchBoostTerms: [
    'CVE',
    'incident ID',
    'MITRE',
    'ATT&CK',
    'control ID',
    'regulation',
    'CMMC',
    'StateRAMP',
    'critical severity',
    'attack vector',
    'lateral movement',
    'ransomware',
  ],
  boostRuleIds: ['cve-id', 'incident-id', 'control-id', 'compliance-term', 'regulation-code'],

  rerankEnabled: true,
  topK: 10,
  maxCandidates: 120,

  scoreThresholds: {
    minimumRelevanceScore: 0.42,
    rerankDropBelowScore: 0.48,
    exactMatchBoostFloor: 0.32,
    highConfidenceThreshold: 0.82,
  },

  privacyLevel: 'restricted',
  retentionRules: {
    defaultRetentionDays: 730,
    requestLogRetentionDays: 365,
    evidenceRetentionDays: 1825,
    deletionRequired: false,
    auditTrailRetentionDays: 2555,
    encryptAtRest: true,
    encryptInTransit: true,
    allowCrossRegionReplication: false,
  },

  createdAt: '2026-04-20T00:00:00.000Z',
  updatedAt: '2026-04-20T00:00:00.000Z',
};
