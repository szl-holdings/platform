import { PROFILE_ACCENT } from './tokens.js';
import type { DomainProfile, DomainProfileId } from './types.js';

/**
 * AEEP Domain Profile Registry
 *
 * Six domain profiles: Lyte, Vessels, Terra, Aegis, PRISM, Carlota
 * Each is versioned and scopes retrieval namespaces, workflows, and policy tiers.
 *
 * Memory scopes use AEEP model: working | episodic | semantic | governance
 */
export const DOMAIN_PROFILES: Record<DomainProfileId, DomainProfile> = {
  lyte: {
    profileId: 'lyte',
    displayName: 'Lyte',
    description:
      'Decision intelligence platform. Focuses on signal detection, cross-domain synthesis, and executive brief generation.',
    version: '1.0.0',
    accent: PROFILE_ACCENT.lyte,
    active: true,
    defaultPolicyTier: 'medium',
    primaryWorkflows: [
      'investigate_signal',
      'prepare_executive_brief',
      'generate_operational_digest',
      'run_eval_suite',
    ],
    indexNamespaces: [
      {
        namespaceId: 'lyte-signals',
        description: 'Raw signal ingestion for cross-domain pattern detection',
        primaryEmbeddingModel: 'text-embedding-3-small',
        chunkSizeTokens: 512,
        chunkOverlapTokens: 64,
        refreshCronUtc: '0 */4 * * *',
      },
      {
        namespaceId: 'lyte-briefs',
        description: 'Compiled executive brief archive',
        primaryEmbeddingModel: 'text-embedding-3-small',
        chunkSizeTokens: 1024,
        chunkOverlapTokens: 128,
      },
    ],
    memoryScopes: ['working', 'episodic', 'semantic'],
    agentRoles: ['MissionPlanner', 'RetrievalStrategist', 'EvidenceSynthesizer', 'Evaluator'],
  },

  vessels: {
    profileId: 'vessels',
    displayName: 'Vessels',
    description:
      'Maritime intelligence platform. Port data, vessel movements, and operational digests.',
    version: '1.0.0',
    accent: PROFILE_ACCENT.vessels,
    active: true,
    defaultPolicyTier: 'medium',
    primaryWorkflows: [
      'ingest_source',
      'verify_index_health',
      'investigate_signal',
      'generate_operational_digest',
    ],
    indexNamespaces: [
      {
        namespaceId: 'vessels-ais',
        description: 'AIS vessel movement data',
        primaryEmbeddingModel: 'text-embedding-3-small',
        chunkSizeTokens: 256,
        chunkOverlapTokens: 32,
        refreshCronUtc: '*/30 * * * *',
      },
      {
        namespaceId: 'vessels-ports',
        description: 'Port and facility records',
        primaryEmbeddingModel: 'text-embedding-3-small',
        chunkSizeTokens: 512,
        chunkOverlapTokens: 64,
        refreshCronUtc: '0 6 * * *',
      },
      {
        namespaceId: 'vessels-intelligence',
        description: 'Maritime intelligence reports',
        primaryEmbeddingModel: 'text-embedding-3-small',
        chunkSizeTokens: 1024,
        chunkOverlapTokens: 128,
      },
    ],
    memoryScopes: ['working', 'semantic'],
    agentRoles: ['MissionPlanner', 'RetrievalStrategist', 'EvidenceSynthesizer'],
  },

  terra: {
    profileId: 'terra',
    displayName: 'Terra',
    description:
      'Real estate intelligence platform. Property records, market data, comps, and risk assessment.',
    version: '1.0.0',
    accent: PROFILE_ACCENT.terra,
    active: true,
    defaultPolicyTier: 'medium',
    primaryWorkflows: ['ingest_source', 'review_property_risk', 'prepare_executive_brief'],
    indexNamespaces: [
      {
        namespaceId: 'terra-properties',
        description: 'Property records and listing data',
        primaryEmbeddingModel: 'text-embedding-3-small',
        chunkSizeTokens: 512,
        chunkOverlapTokens: 64,
        refreshCronUtc: '0 2 * * *',
      },
      {
        namespaceId: 'terra-market',
        description: 'Market signals and macroeconomic indicators',
        primaryEmbeddingModel: 'text-embedding-3-small',
        chunkSizeTokens: 256,
        chunkOverlapTokens: 32,
        refreshCronUtc: '0 8 * * 1-5',
      },
      {
        namespaceId: 'terra-zoning',
        description: 'Zoning and regulatory information',
        primaryEmbeddingModel: 'text-embedding-3-small',
        chunkSizeTokens: 512,
        chunkOverlapTokens: 64,
      },
    ],
    memoryScopes: ['working', 'semantic'],
    agentRoles: ['MissionPlanner', 'RetrievalStrategist', 'EvidenceSynthesizer'],
  },

  aegis: {
    profileId: 'aegis',
    displayName: 'Aegis',
    description:
      'Investor pitch and portfolio intelligence. Risk scoring, governance tracking, and portfolio narratives.',
    version: '1.0.0',
    accent: PROFILE_ACCENT.aegis,
    active: true,
    defaultPolicyTier: 'high',
    primaryWorkflows: [
      'prepare_executive_brief',
      'investigate_signal',
      'generate_operational_digest',
    ],
    indexNamespaces: [
      {
        namespaceId: 'aegis-portfolio',
        description: 'Portfolio company records and KPIs',
        primaryEmbeddingModel: 'text-embedding-3-small',
        chunkSizeTokens: 512,
        chunkOverlapTokens: 64,
      },
      {
        namespaceId: 'aegis-governance',
        description: 'Governance policies and board decisions',
        primaryEmbeddingModel: 'text-embedding-3-small',
        chunkSizeTokens: 1024,
        chunkOverlapTokens: 128,
      },
    ],
    memoryScopes: ['working', 'semantic', 'governance'],
    agentRoles: ['MissionPlanner', 'RetrievalStrategist', 'EvidenceSynthesizer', 'PolicyGuardian'],
  },

  prism: {
    profileId: 'prism',
    displayName: 'PRISM',
    description:
      'Legal matter management platform. Case timelines, document retrieval, and matter intelligence.',
    version: '1.0.0',
    accent: PROFILE_ACCENT.prism,
    active: true,
    defaultPolicyTier: 'high',
    primaryWorkflows: [
      'compile_case_timeline',
      'investigate_signal',
      'ingest_source',
      'run_eval_suite',
    ],
    indexNamespaces: [
      {
        namespaceId: 'prism-matters',
        description: 'Legal matter documents and filings',
        primaryEmbeddingModel: 'text-embedding-3-small',
        chunkSizeTokens: 512,
        chunkOverlapTokens: 128,
      },
      {
        namespaceId: 'prism-precedent',
        description: 'Case law and precedent library',
        primaryEmbeddingModel: 'text-embedding-3-small',
        chunkSizeTokens: 1024,
        chunkOverlapTokens: 256,
      },
      {
        namespaceId: 'prism-correspondence',
        description: 'Matter correspondence and communications',
        primaryEmbeddingModel: 'text-embedding-3-small',
        chunkSizeTokens: 256,
        chunkOverlapTokens: 64,
      },
    ],
    memoryScopes: ['working', 'episodic', 'semantic', 'governance'],
    agentRoles: [
      'MissionPlanner',
      'RetrievalStrategist',
      'EvidenceSynthesizer',
      'PolicyGuardian',
      'ExecutionSupervisor',
    ],
  },

  carlota: {
    profileId: 'carlota',
    displayName: 'Carlota',
    description:
      'Consulting services platform. Client engagements, deliverable tracking, and advisory content.',
    version: '1.0.0',
    accent: PROFILE_ACCENT.carlota,
    active: true,
    defaultPolicyTier: 'low',
    primaryWorkflows: ['ingest_source', 'prepare_executive_brief', 'generate_operational_digest'],
    indexNamespaces: [
      {
        namespaceId: 'carlota-engagements',
        description: 'Client engagement records and deliverables',
        primaryEmbeddingModel: 'text-embedding-3-small',
        chunkSizeTokens: 512,
        chunkOverlapTokens: 64,
      },
      {
        namespaceId: 'carlota-knowledge',
        description: 'Consulting knowledge base and frameworks',
        primaryEmbeddingModel: 'text-embedding-3-small',
        chunkSizeTokens: 1024,
        chunkOverlapTokens: 128,
      },
    ],
    memoryScopes: ['working', 'semantic'],
    agentRoles: ['MissionPlanner', 'RetrievalStrategist', 'EvidenceSynthesizer'],
  },
};

export function getProfile(profileId: DomainProfileId): DomainProfile {
  const profile = DOMAIN_PROFILES[profileId];
  if (!profile) throw new Error(`Unknown domain profile: ${profileId}`);
  return profile;
}

export function listActiveProfiles(): DomainProfile[] {
  return Object.values(DOMAIN_PROFILES).filter((p) => p.active);
}
