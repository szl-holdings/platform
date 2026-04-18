/**
 * Signal type definitions for the SZL Holdings platform.
 *
 * Signals are the raw inputs that flow into the canonical nine-step loop.
 * Every signal is typed, domain-scoped, and carries a freshness timestamp
 * and confidence estimate.
 *
 * RULE: The correlationId on a signal must be propagated through all
 * downstream artifacts (recommendation, simulation, proof entry, outcome
 * record). Never generate a new correlationId mid-loop.
 *
 * Source of truth: ontology.md § Signals
 */

import type { Domain } from "./domains.js";
import type { EntityType, FreshnessLevel } from "./entities.js";
import type { EvidenceRef } from "./evidence.js";

// ---------------------------------------------------------------------------
// Signal Severity
// ---------------------------------------------------------------------------

export const SIGNAL_SEVERITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
] as const;

export type SignalSeverity = (typeof SIGNAL_SEVERITIES)[number];

// ---------------------------------------------------------------------------
// Signal Sources
// ---------------------------------------------------------------------------

export const SIGNAL_SOURCES = [
  "ais_feed",          // AIS maritime telemetry
  "stix_taxii",        // Threat intelligence feeds
  "sanctions_list",    // OFAC / UN / EU / UK sanctions
  "court_record",      // Legal database (CourtListener)
  "property_registry", // Property and lien records
  "market_feed",       // Financial / market data
  "internal_event",    // Platform-generated event
  "agent_output",      // AI agent-generated signal
  "human_input",       // Operator-submitted signal
  "webhook",           // External webhook integration
  "ais_api",           // AIS REST API providers (MarineTraffic, AISHub, etc.)
  "cve_feed",          // NVD CVE / CISA KEV
  "osint_feed",        // AlienVault OTX, MISP, GreyNoise
] as const;

export type SignalSource = (typeof SIGNAL_SOURCES)[number];

// ---------------------------------------------------------------------------
// Signal Types
// ---------------------------------------------------------------------------

export const SIGNAL_TYPES = [
  // Maritime / Vessels
  "ais_dark",              // vessel went dark (AIS off)
  "ais_position",          // vessel position update
  "sanctions_hit",         // entity matched sanctions list
  "voyage_anomaly",        // route or voyage deviation
  "port_arrival",          // vessel arrived at port
  "cargo_discrepancy",     // cargo manifest anomaly
  // Real Estate / Terra
  "distress_filing",       // property distress signal
  "ownership_change",      // ownership graph change
  "lien_filed",            // lien recorded against property
  "tax_delinquency",       // tax delinquency indicator
  "foreclosure_filing",    // foreclosure action filed
  // Security
  "threat_indicator",      // IOC from threat feed
  "cve_published",         // new CVE relevant to org
  "incident_detected",     // security incident signal
  "ttp_observed",          // MITRE ATT&CK TTP observed
  // Counsel
  "court_filing",          // new court document
  "matter_deadline",       // upcoming legal deadline
  "settlement_offer",      // settlement offer received
  // Platform
  "policy_violation",      // agent or action violated policy
  "freshness_degraded",    // entity freshness dropped below threshold
  "agent_drift",           // agent output quality degraded
  "cross_domain_alert",    // correlation across domains
  "approval_overdue",      // approval request past SLA
  "workflow_stalled",      // workflow step not progressing
] as const;

export type SignalType = (typeof SIGNAL_TYPES)[number];

// ---------------------------------------------------------------------------
// Signal Shape
// ---------------------------------------------------------------------------

/**
 * The canonical signal object. All signal connectors and event fabric
 * handlers must produce and consume this shape.
 *
 * RULE: correlationId must be propagated, never regenerated, through all
 * downstream artifacts produced in response to this signal.
 */
export interface Signal {
  id: string;
  signalType: SignalType;
  domain: Domain;
  orgId: string;
  severity: SignalSeverity;
  confidence: number;         // 0..1
  freshness: FreshnessLevel;
  source: SignalSource;
  payload: Record<string, unknown>;
  correlationId: string;      // propagated through the nine-step loop
  emittedAt: Date;
  expiresAt?: Date | undefined;
  entityRef?: {
    entityType: EntityType;
    entityId: string;
  } | undefined;
  evidence?: EvidenceRef[] | undefined;
}

// ---------------------------------------------------------------------------
// Signal Type → Domain mapping
// ---------------------------------------------------------------------------

export const SIGNAL_TYPE_DOMAINS: Record<SignalType, Domain[]> = {
  ais_dark: ["vessels"],
  ais_position: ["vessels"],
  sanctions_hit: ["vessels", "security", "counsel"],
  voyage_anomaly: ["vessels"],
  port_arrival: ["vessels"],
  cargo_discrepancy: ["vessels"],
  distress_filing: ["terra"],
  ownership_change: ["terra"],
  lien_filed: ["terra"],
  tax_delinquency: ["terra"],
  foreclosure_filing: ["terra"],
  threat_indicator: ["security", "sentra"],
  cve_published: ["security", "sentra"],
  incident_detected: ["security", "sentra"],
  ttp_observed: ["security", "sentra"],
  court_filing: ["counsel"],
  matter_deadline: ["counsel"],
  settlement_offer: ["counsel"],
  policy_violation: ["platform"],
  freshness_degraded: ["platform"],
  agent_drift: ["platform"],
  cross_domain_alert: ["platform", "vessels", "terra", "security", "counsel", "carlota", "pulse", "command", "lyte", "sentra"],
  approval_overdue: ["platform"],
  workflow_stalled: ["platform"],
};

export function isSignalType(value: unknown): value is SignalType {
  return SIGNAL_TYPES.includes(value as SignalType);
}
