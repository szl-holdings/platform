/**
 * Canonical entity type definitions for the SZL Holdings platform.
 *
 * All entity types, freshness levels, confidence conventions, and policy
 * states are defined here. Every package that creates, transforms, or
 * reasons about entities MUST import from @workspace/ontology.
 *
 * RULE: Evidence, freshness, confidence, and policyState must never be
 * stripped from entity objects when passing between packages or
 * serializing to the API. If a consumer does not need these fields, it
 * must still preserve them for downstream consumers.
 *
 * Source of truth: ontology.md
 */

import type { Domain } from './domains.js';
import type { EvidenceRef } from './evidence.js';

// ---------------------------------------------------------------------------
// Freshness
// ---------------------------------------------------------------------------

export const FRESHNESS_LEVELS = ['live', 'recent', 'stale', 'expired'] as const;

export type FreshnessLevel = (typeof FRESHNESS_LEVELS)[number];

export const FRESHNESS_LABELS: Record<FreshnessLevel, string> = {
  live: 'Live',
  recent: 'Recent',
  stale: 'Stale',
  expired: 'Expired',
};

/**
 * Thresholds (in milliseconds) that define each freshness tier.
 * Source: telemetry-model.md § Freshness Registry (platform defaults).
 * Per-domain overrides are defined in packages/telemetry-standards.
 */
export const FRESHNESS_THRESHOLDS = {
  live: 5 * 60 * 1000, // 5 minutes
  recent: 60 * 60 * 1000, // 1 hour
  stale: 24 * 60 * 60 * 1000, // 24 hours
  // expired = anything older than stale threshold
} as const;

export function computeFreshness(updatedAt: Date, now: Date = new Date()): FreshnessLevel {
  const ageMs = now.getTime() - updatedAt.getTime();
  if (ageMs <= FRESHNESS_THRESHOLDS.live) return 'live';
  if (ageMs <= FRESHNESS_THRESHOLDS.recent) return 'recent';
  if (ageMs <= FRESHNESS_THRESHOLDS.stale) return 'stale';
  return 'expired';
}

// ---------------------------------------------------------------------------
// Policy State
// ---------------------------------------------------------------------------

export const POLICY_STATES = ['cleared', 'conditional', 'blocked', 'flagged', 'pending'] as const;

export type PolicyState = (typeof POLICY_STATES)[number];

export const POLICY_STATE_LABELS: Record<PolicyState, string> = {
  cleared: 'Cleared',
  conditional: 'Conditional',
  blocked: 'Blocked',
  flagged: 'Flagged',
  pending: 'Pending Review',
};

// ---------------------------------------------------------------------------
// Entity Types
// ---------------------------------------------------------------------------

/**
 * Platform-wide entity types (present in every domain).
 */
export const PLATFORM_ENTITY_TYPES = [
  'signal',
  'recommendation',
  'action',
  'approval',
  'workflow',
  'evidence',
  'outcome',
  'policy',
  'audit_event',
  'agent_run',
  'org',
  'agent',
  'model',
] as const;

/**
 * Domain-specific entity types.
 */
export const DOMAIN_ENTITY_TYPES = [
  // Vessels
  'vessel',
  'voyage',
  // Terra
  'property',
  'deal',
  // Security (Aegis / Sentra)
  'incident',
  'threat',
  // Sentra-specific
  'cyber_asset',
  'control',
  // Counsel
  'matter',
  'obligation',
  // Carlota Jo
  'engagement',
  // Pulse
  'brief',
  // Lyte — Business Observability
  'opportunity',
  'project',
  'approval_chain',
  'stakeholder',
  'deliverable',
] as const;

export const ALL_ENTITY_TYPES = [...PLATFORM_ENTITY_TYPES, ...DOMAIN_ENTITY_TYPES] as const;

export type EntityType = (typeof ALL_ENTITY_TYPES)[number];

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  signal: 'Signal',
  recommendation: 'Recommendation',
  action: 'Action',
  approval: 'Approval',
  workflow: 'Workflow',
  evidence: 'Evidence',
  outcome: 'Outcome',
  policy: 'Policy',
  audit_event: 'Audit Event',
  agent_run: 'Agent Run',
  org: 'Organization',
  agent: 'AI Agent',
  model: 'AI Model',
  vessel: 'Vessel',
  voyage: 'Voyage',
  property: 'Property',
  deal: 'Deal',
  incident: 'Incident',
  threat: 'Threat',
  cyber_asset: 'Cyber Asset',
  control: 'Control',
  engagement: 'Engagement',
  matter: 'Matter',
  obligation: 'Obligation',
  brief: 'Brief',
  opportunity: 'Opportunity',
  project: 'Project',
  approval_chain: 'Approval Chain',
  stakeholder: 'Stakeholder',
  deliverable: 'Deliverable',
};

export const ENTITY_TYPE_DOMAINS: Record<EntityType, Domain[]> = {
  signal: [
    'platform',
    'vessels',
    'terra',
    'security',
    'counsel',
    'carlota',
    'pulse',
    'command',
    'lyte',
    'sentra',
  ],
  recommendation: [
    'platform',
    'vessels',
    'terra',
    'security',
    'counsel',
    'carlota',
    'pulse',
    'command',
    'lyte',
    'sentra',
  ],
  action: [
    'platform',
    'vessels',
    'terra',
    'security',
    'counsel',
    'carlota',
    'pulse',
    'command',
    'lyte',
    'sentra',
  ],
  approval: [
    'platform',
    'vessels',
    'terra',
    'security',
    'counsel',
    'carlota',
    'pulse',
    'command',
    'lyte',
    'sentra',
  ],
  workflow: [
    'platform',
    'vessels',
    'terra',
    'security',
    'counsel',
    'carlota',
    'pulse',
    'command',
    'lyte',
    'sentra',
  ],
  evidence: [
    'platform',
    'vessels',
    'terra',
    'security',
    'counsel',
    'carlota',
    'pulse',
    'command',
    'lyte',
    'sentra',
  ],
  outcome: [
    'platform',
    'vessels',
    'terra',
    'security',
    'counsel',
    'carlota',
    'pulse',
    'command',
    'lyte',
    'sentra',
  ],
  policy: ['platform'],
  audit_event: [
    'platform',
    'vessels',
    'terra',
    'security',
    'counsel',
    'carlota',
    'pulse',
    'command',
    'lyte',
    'sentra',
  ],
  agent_run: ['platform'],
  org: ['platform'],
  agent: ['platform'],
  model: ['platform'],
  vessel: ['vessels'],
  voyage: ['vessels'],
  property: ['terra'],
  deal: ['terra'],
  incident: ['security', 'sentra'],
  threat: ['security', 'sentra'],
  cyber_asset: ['sentra'],
  control: ['sentra'],
  matter: ['counsel'],
  obligation: ['counsel'],
  engagement: ['carlota'],
  brief: ['pulse'],
  opportunity: ['lyte'],
  project: ['lyte'],
  approval_chain: ['lyte', 'platform'],
  stakeholder: ['lyte', 'platform'],
  deliverable: ['lyte'],
};

// ---------------------------------------------------------------------------
// Base Entity Shape
// ---------------------------------------------------------------------------

/**
 * The base shape all entities in the platform must conform to.
 *
 * Presence of confidence, freshness, policyState, and evidence is
 * mandatory. These fields carry trust metadata and must never be omitted.
 */
export interface BaseEntity {
  id: string;
  entityType: EntityType;
  orgId: string;
  domain: Domain;
  label: string;
  confidence: number; // 0..1
  freshness: FreshnessLevel;
  policyState: PolicyState;
  createdAt: Date;
  updatedAt: Date;
  sourceRef?: string | undefined;
  evidence?: EvidenceRef[] | undefined;
}

// ---------------------------------------------------------------------------
// Domain Entity Shapes
// ---------------------------------------------------------------------------

export interface VesselEntity extends BaseEntity {
  entityType: 'vessel';
  domain: 'vessels';
  imoNumber?: string | undefined;
  mmsi?: string | undefined;
  flag?: string | undefined;
  vesselType?: string | undefined;
  aisStatus?: 'active' | 'dark' | 'spoofed' | 'unknown' | undefined;
  lastPositionLat?: number | undefined;
  lastPositionLon?: number | undefined;
  sanctionsStatus: 'clear' | 'matched' | 'pending_check' | 'watchlist';
}

export interface VoyageEntity extends BaseEntity {
  entityType: 'voyage';
  domain: 'vessels';
  vesselId: string;
  departurePort?: string | undefined;
  destinationPort?: string | undefined;
  cargoType?: string | undefined;
  estimatedArrival?: Date | undefined;
  voyageCostUsd?: number | undefined;
  riskScore?: number | undefined;
}

export interface PropertyEntity extends BaseEntity {
  entityType: 'property';
  domain: 'terra';
  address: string;
  borough?: string | undefined;
  ownerName?: string | undefined;
  distressSignals: string[];
  assessedValueUsd?: number | undefined;
  distressScore?: number | undefined;
}

export interface DealEntity extends BaseEntity {
  entityType: 'deal';
  domain: 'terra';
  propertyId?: string | undefined;
  stage: 'prospect' | 'qualified' | 'diligence' | 'negotiation' | 'closed' | 'lost';
  estimatedValueUsd?: number | undefined;
  counterparty?: string | undefined;
}

export interface IncidentEntity extends BaseEntity {
  entityType: 'incident';
  domain: 'security' | 'sentra';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'triaging' | 'contained' | 'resolved' | 'closed';
  attackVector?: string | undefined;
  affectedSystems?: string[] | undefined;
}

export interface ThreatEntity extends BaseEntity {
  entityType: 'threat';
  domain: 'security' | 'sentra';
  indicatorType: 'ip' | 'domain' | 'hash' | 'url' | 'email' | 'actor' | 'ttp';
  indicatorValue: string;
  tlpLevel: 'white' | 'green' | 'amber' | 'red';
  ttl?: Date | undefined;
}

export interface CyberAssetEntity extends BaseEntity {
  entityType: 'cyber_asset';
  domain: 'sentra';
  assetType: 'endpoint' | 'server' | 'network' | 'cloud' | 'ot' | 'identity' | 'data';
  criticality: 'critical' | 'high' | 'medium' | 'low';
  recoveryTimeObjectiveMins?: number | undefined;
  backupStatus: 'current' | 'stale' | 'missing' | 'unknown';
  controlGap?: boolean | undefined;
  exposureScore?: number | undefined;
}

export interface ControlEntity extends BaseEntity {
  entityType: 'control';
  domain: 'sentra';
  controlFamily: 'identify' | 'protect' | 'detect' | 'respond' | 'recover';
  status: 'effective' | 'partial' | 'ineffective' | 'not_tested';
  driftDetected: boolean;
  lastTestedAt?: Date | undefined;
  framework?: string | undefined;
}

export interface MatterEntity extends BaseEntity {
  entityType: 'matter';
  domain: 'counsel';
  matterType: 'litigation' | 'transaction' | 'advisory' | 'recovery' | 'regulatory';
  status: 'open' | 'discovery' | 'negotiation' | 'closed' | 'settled';
  clientId?: string | undefined;
  filingDeadline?: Date | undefined;
}

export interface ObligationEntity extends BaseEntity {
  entityType: 'obligation';
  domain: 'counsel';
  matterId: string;
  obligationType: 'filing' | 'discovery' | 'response' | 'hearing' | 'contract' | 'regulatory';
  deadline: Date;
  status: 'open' | 'in_progress' | 'met' | 'missed' | 'waived';
  dependsOn?: string[] | undefined;
  riskIfMissed?: string | undefined;
}

export interface EngagementEntity extends BaseEntity {
  entityType: 'engagement';
  domain: 'carlota';
  clientId?: string | undefined;
  engagementType: 'advisory' | 'strategy' | 'brand' | 'operations';
  status: 'inquiry' | 'active' | 'delivered' | 'invoiced' | 'complete';
}

export interface BriefEntity extends BaseEntity {
  entityType: 'brief';
  domain: 'pulse';
  period: string;
  sections: string[];
  modelId?: string | undefined;
  proofId?: string | undefined;
}

// ---------------------------------------------------------------------------
// Lyte — Business Observability Entity Shapes
// ---------------------------------------------------------------------------

export interface OpportunityEntity extends BaseEntity {
  entityType: 'opportunity';
  domain: 'lyte';
  stage:
    | 'identified'
    | 'qualified'
    | 'proposal'
    | 'negotiation'
    | 'closed_won'
    | 'closed_lost'
    | 'stalled';
  estimatedValueUsd?: number | undefined;
  closeProbability?: number | undefined;
  daysInStage?: number | undefined;
  ownerName?: string | undefined;
  accountName?: string | undefined;
  stalledDays?: number | undefined;
  approvalChainId?: string | undefined;
}

export interface ProjectEntity extends BaseEntity {
  entityType: 'project';
  domain: 'lyte';
  status: 'active' | 'blocked' | 'stalled' | 'at_risk' | 'on_track' | 'complete';
  phase: string;
  owner?: string | undefined;
  dueDate?: Date | undefined;
  valueAtRiskUsd?: number | undefined;
  blockerCount?: number | undefined;
}

export interface ApprovalChainEntity extends BaseEntity {
  entityType: 'approval_chain';
  domain: 'lyte' | 'platform';
  linkedEntityId?: string | undefined;
  linkedEntityType?: EntityType | undefined;
  currentStep?: number | undefined;
  totalSteps?: number | undefined;
  stalledAtStepName?: string | undefined;
  stalledDays?: number | undefined;
  valueAtRiskUsd?: number | undefined;
  status: 'active' | 'stalled' | 'approved' | 'rejected' | 'escalated' | 'void';
}

export interface StakeholderEntity extends BaseEntity {
  entityType: 'stakeholder';
  domain: 'lyte' | 'platform';
  role: string;
  orgId: string;
  email?: string | undefined;
  engagementLevel?: 'champion' | 'supporter' | 'neutral' | 'skeptic' | 'blocker' | undefined;
  lastEngagedAt?: Date | undefined;
  approvalAuthority?: boolean | undefined;
}

export interface DeliverableEntity extends BaseEntity {
  entityType: 'deliverable';
  domain: 'lyte';
  type: 'report' | 'analysis' | 'approval' | 'contract' | 'presentation' | 'milestone';
  linkedProjectId?: string | undefined;
  owner?: string | undefined;
  dueDate?: Date | undefined;
  status: 'not_started' | 'in_progress' | 'blocked' | 'overdue' | 'complete';
  stalledDays?: number | undefined;
}

export type DomainEntity =
  | VesselEntity
  | VoyageEntity
  | PropertyEntity
  | DealEntity
  | IncidentEntity
  | ThreatEntity
  | CyberAssetEntity
  | ControlEntity
  | MatterEntity
  | ObligationEntity
  | EngagementEntity
  | BriefEntity
  | OpportunityEntity
  | ProjectEntity
  | ApprovalChainEntity
  | StakeholderEntity
  | DeliverableEntity;

export function isEntityType(value: unknown): value is EntityType {
  return ALL_ENTITY_TYPES.includes(value as EntityType);
}
