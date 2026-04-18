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

import type { Domain } from "./domains.js";
import type { EvidenceRef } from "./evidence.js";

// ---------------------------------------------------------------------------
// Freshness
// ---------------------------------------------------------------------------

export const FRESHNESS_LEVELS = ["live", "recent", "stale", "expired"] as const;

export type FreshnessLevel = (typeof FRESHNESS_LEVELS)[number];

export const FRESHNESS_LABELS: Record<FreshnessLevel, string> = {
  live: "Live",
  recent: "Recent",
  stale: "Stale",
  expired: "Expired",
};

/**
 * Thresholds (in milliseconds) that define each freshness tier.
 * Source: telemetry-model.md § Freshness Registry (platform defaults).
 * Per-domain overrides are defined in packages/telemetry-standards.
 */
export const FRESHNESS_THRESHOLDS = {
  live: 5 * 60 * 1000,       // 5 minutes
  recent: 60 * 60 * 1000,    // 1 hour
  stale: 24 * 60 * 60 * 1000, // 24 hours
  // expired = anything older than stale threshold
} as const;

export function computeFreshness(updatedAt: Date, now: Date = new Date()): FreshnessLevel {
  const ageMs = now.getTime() - updatedAt.getTime();
  if (ageMs <= FRESHNESS_THRESHOLDS.live) return "live";
  if (ageMs <= FRESHNESS_THRESHOLDS.recent) return "recent";
  if (ageMs <= FRESHNESS_THRESHOLDS.stale) return "stale";
  return "expired";
}

// ---------------------------------------------------------------------------
// Policy State
// ---------------------------------------------------------------------------

export const POLICY_STATES = [
  "cleared",
  "conditional",
  "blocked",
  "flagged",
  "pending",
] as const;

export type PolicyState = (typeof POLICY_STATES)[number];

export const POLICY_STATE_LABELS: Record<PolicyState, string> = {
  cleared: "Cleared",
  conditional: "Conditional",
  blocked: "Blocked",
  flagged: "Flagged",
  pending: "Pending Review",
};

// ---------------------------------------------------------------------------
// Entity Types
// ---------------------------------------------------------------------------

/**
 * Platform-wide entity types (present in every domain).
 */
export const PLATFORM_ENTITY_TYPES = [
  "signal",
  "recommendation",
  "action",
  "approval",
  "workflow",
  "evidence",
  "outcome",
  "policy",
  "audit_event",
  "agent_run",
  "org",
  "agent",
  "model",
] as const;

/**
 * Domain-specific entity types.
 */
export const DOMAIN_ENTITY_TYPES = [
  // Vessels
  "vessel",
  "voyage",
  // Terra
  "property",
  "deal",
  // Security (Aegis / Sentra)
  "incident",
  "threat",
  // Counsel
  "matter",
  // Carlota Jo
  "engagement",
  // Pulse
  "brief",
] as const;

export const ALL_ENTITY_TYPES = [
  ...PLATFORM_ENTITY_TYPES,
  ...DOMAIN_ENTITY_TYPES,
] as const;

export type EntityType = (typeof ALL_ENTITY_TYPES)[number];

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  signal: "Signal",
  recommendation: "Recommendation",
  action: "Action",
  approval: "Approval",
  workflow: "Workflow",
  evidence: "Evidence",
  outcome: "Outcome",
  policy: "Policy",
  audit_event: "Audit Event",
  agent_run: "Agent Run",
  org: "Organization",
  agent: "AI Agent",
  model: "AI Model",
  vessel: "Vessel",
  voyage: "Voyage",
  property: "Property",
  deal: "Deal",
  incident: "Incident",
  threat: "Threat",
  engagement: "Engagement",
  matter: "Matter",
  brief: "Brief",
};

export const ENTITY_TYPE_DOMAINS: Record<EntityType, Domain[]> = {
  signal: ["platform", "vessels", "terra", "security", "counsel", "carlota", "pulse", "command", "lyte", "sentra"],
  recommendation: ["platform", "vessels", "terra", "security", "counsel", "carlota", "pulse", "command", "lyte", "sentra"],
  action: ["platform", "vessels", "terra", "security", "counsel", "carlota", "pulse", "command", "lyte", "sentra"],
  approval: ["platform", "vessels", "terra", "security", "counsel", "carlota", "pulse", "command", "lyte", "sentra"],
  workflow: ["platform", "vessels", "terra", "security", "counsel", "carlota", "pulse", "command", "lyte", "sentra"],
  evidence: ["platform", "vessels", "terra", "security", "counsel", "carlota", "pulse", "command", "lyte", "sentra"],
  outcome: ["platform", "vessels", "terra", "security", "counsel", "carlota", "pulse", "command", "lyte", "sentra"],
  policy: ["platform"],
  audit_event: ["platform", "vessels", "terra", "security", "counsel", "carlota", "pulse", "command", "lyte", "sentra"],
  agent_run: ["platform"],
  org: ["platform"],
  agent: ["platform"],
  model: ["platform"],
  vessel: ["vessels"],
  voyage: ["vessels"],
  property: ["terra"],
  deal: ["terra"],
  incident: ["security", "sentra"],
  threat: ["security", "sentra"],
  matter: ["counsel"],
  engagement: ["carlota"],
  brief: ["pulse"],
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
  confidence: number;         // 0..1
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
  entityType: "vessel";
  domain: "vessels";
  imoNumber?: string | undefined;
  mmsi?: string | undefined;
  flag?: string | undefined;
  vesselType?: string | undefined;
  aisStatus?: "active" | "dark" | "spoofed" | "unknown" | undefined;
  lastPositionLat?: number | undefined;
  lastPositionLon?: number | undefined;
  sanctionsStatus: "clear" | "matched" | "pending_check" | "watchlist";
}

export interface VoyageEntity extends BaseEntity {
  entityType: "voyage";
  domain: "vessels";
  vesselId: string;
  departurePort?: string | undefined;
  destinationPort?: string | undefined;
  cargoType?: string | undefined;
  estimatedArrival?: Date | undefined;
  voyageCostUsd?: number | undefined;
  riskScore?: number | undefined;
}

export interface PropertyEntity extends BaseEntity {
  entityType: "property";
  domain: "terra";
  address: string;
  borough?: string | undefined;
  ownerName?: string | undefined;
  distressSignals: string[];
  assessedValueUsd?: number | undefined;
  distressScore?: number | undefined;
}

export interface DealEntity extends BaseEntity {
  entityType: "deal";
  domain: "terra";
  propertyId?: string | undefined;
  stage: "prospect" | "qualified" | "diligence" | "negotiation" | "closed" | "lost";
  estimatedValueUsd?: number | undefined;
  counterparty?: string | undefined;
}

export interface IncidentEntity extends BaseEntity {
  entityType: "incident";
  domain: "security";
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "triaging" | "contained" | "resolved" | "closed";
  attackVector?: string | undefined;
  affectedSystems?: string[] | undefined;
}

export interface ThreatEntity extends BaseEntity {
  entityType: "threat";
  domain: "security";
  indicatorType: "ip" | "domain" | "hash" | "url" | "email" | "actor" | "ttp";
  indicatorValue: string;
  tlpLevel: "white" | "green" | "amber" | "red";
  ttl?: Date | undefined;
}

export interface MatterEntity extends BaseEntity {
  entityType: "matter";
  domain: "counsel";
  matterType: "litigation" | "transaction" | "advisory" | "recovery" | "regulatory";
  status: "open" | "discovery" | "negotiation" | "closed" | "settled";
  clientId?: string | undefined;
  filingDeadline?: Date | undefined;
}

export interface EngagementEntity extends BaseEntity {
  entityType: "engagement";
  domain: "carlota";
  clientId?: string | undefined;
  engagementType: "advisory" | "strategy" | "brand" | "operations";
  status: "inquiry" | "active" | "delivered" | "invoiced" | "complete";
}

export interface BriefEntity extends BaseEntity {
  entityType: "brief";
  domain: "pulse";
  period: string;
  sections: string[];
  modelId?: string | undefined;
  proofId?: string | undefined;
}

export type DomainEntity =
  | VesselEntity
  | VoyageEntity
  | PropertyEntity
  | DealEntity
  | IncidentEntity
  | ThreatEntity
  | MatterEntity
  | EngagementEntity
  | BriefEntity;

export function isEntityType(value: unknown): value is EntityType {
  return ALL_ENTITY_TYPES.includes(value as EntityType);
}
