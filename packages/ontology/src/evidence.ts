/**
 * Evidence types for the SZL Holdings platform.
 *
 * Evidence references link recommendations and actions to the source
 * material that supports them. This is the core of traceable autonomy —
 * every claim has a receipt. Evidence metadata must never be stripped.
 *
 * Source of truth: ontology.md § Evidence References
 */

import type { FreshnessLevel } from "./entities.js";

export const EVIDENCE_SOURCE_TYPES = [
  "ais_record",
  "sanctions_entry",
  "court_document",
  "property_record",
  "threat_feed_entry",
  "audit_log_entry",
  "simulation_result",
  "agent_output",
  "human_annotation",
  "external_api_response",
] as const;

export type EvidenceSourceType = (typeof EVIDENCE_SOURCE_TYPES)[number];

/**
 * A reference to a piece of evidence that supports a recommendation,
 * action, or entity state. Carried on BaseEntity and on Signal objects.
 *
 * RULE: Evidence references must be preserved when entities are
 * serialized, passed between packages, or returned from API routes.
 */
export interface EvidenceRef {
  evidenceId: string;
  label: string;
  sourceType: EvidenceSourceType;
  url?: string | undefined;
  extractedAt: Date;
  confidence: number;       // 0..1
  freshness: FreshnessLevel;
}

export const PROOF_SOURCE_CLASSES = [
  "llm_generated",
  "human_authored",
  "system_computed",
  "external_ingested",
  "hybrid",
] as const;

export type ProofSourceClass = (typeof PROOF_SOURCE_CLASSES)[number];

export const REVIEW_STATES = [
  "unreviewed",
  "approved",
  "flagged",
  "retracted",
] as const;

export type ReviewState = (typeof REVIEW_STATES)[number];

export const EXPORT_SAFETY_STATES = [
  "safe",
  "restricted",
  "pending_review",
  "blocked",
] as const;

export type ExportSafetyState = (typeof EXPORT_SAFETY_STATES)[number];

/**
 * A Proof Chain entry — the immutable record that every consequential
 * AI output and action produces.
 *
 * RULE: ProofEntry rows are append-only. Updates create new entries,
 * not modifications to existing ones.
 */
export interface ProofEntry {
  id: string;
  contentId: string;
  sourceClass: ProofSourceClass;
  modelId?: string | undefined;
  promptHash?: string | undefined;
  parentProofId?: string | undefined;
  inputSources: EvidenceRef[];
  reviewState: ReviewState;
  exportSafetyState: ExportSafetyState;
  actorId: string;
  actorType: "human" | "agent" | "system";
  orgId: string;
  createdAt: Date;
  reviewedAt?: Date | undefined;
  reviewedBy?: string | undefined;
}
