/**
 * Evidence types for the SZL Holdings platform.
 *
 * Evidence references link recommendations and actions to the source
 * material that supports them. This is the core of traceable autonomy —
 * every claim has a receipt. Evidence metadata must never be stripped.
 *
 * Source of truth: ontology.md § Evidence References
 *
 * Also: EvidenceItem (Zod-validated) — a single atomic fact that backs a
 * recommendation. Recommendation (Zod-validated) — an AI-generated action
 * suggestion with full evidence set. Every recommendation must cite its
 * evidence so operators can interrogate "why does the system believe X?"
 * through the evidence graph read API.
 */

import type { FreshnessLevel } from "./entities.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { EntityRefSchema, ProvenanceSchema, SignalDomainSchema } from "./signal.js";

// ─── Interface-based Evidence Reference (Proof Chain) ────────────────────────

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

// ─── Zod-validated Evidence Item (Signal Mesh) ───────────────────────────────

export const EvidenceTypeSchema = z.enum([
  "signal",
  "historical-pattern",
  "external-data",
  "model-inference",
  "regulatory-rule",
  "operator-knowledge",
  "threshold-trigger",
  "correlation-cluster",
  "anomaly-detection",
  "market-data",
]);
export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;

export const EvidenceItemSchema = z.object({
  evidenceId: z.string().uuid(),

  type: EvidenceTypeSchema,
  domain: SignalDomainSchema,

  signalId: z.string().optional(),
  entityRefs: z.array(EntityRefSchema).default([]),

  summary: z.string(),
  detail: z.string().optional(),
  dataPoint: z.unknown().optional(),

  confidence: z.number().min(0).max(1),
  freshness: z.number().min(0).max(1),
  weight: z.number().min(0).max(1).default(1),

  sourceUrl: z.string().optional(),
  sourceName: z.string().optional(),

  observedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),

  provenance: ProvenanceSchema.optional(),
  tags: z.array(z.string()).default([]),

  schemaVersion: z.string().default("evidence/1.0"),
});
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

export type EvidenceItemInput = Omit<EvidenceItem, "evidenceId" | "schemaVersion">;

export function createEvidenceItem(input: EvidenceItemInput): EvidenceItem {
  return EvidenceItemSchema.parse({
    ...input,
    evidenceId: randomUUID(),
    schemaVersion: "evidence/1.0",
  });
}

export const RecommendationActionSchema = z.enum([
  "acknowledge",
  "escalate",
  "execute",
  "defer",
  "dismiss",
  "monitor",
  "review",
  "approve",
  "reroute",
  "notify",
  "investigate",
  "quarantine",
]);
export type RecommendationAction = z.infer<typeof RecommendationActionSchema>;

export const RecommendationStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
  "expired",
  "executing",
  "completed",
  "failed",
]);
export type RecommendationStatus = z.infer<typeof RecommendationStatusSchema>;

export const RecommendationSchema = z.object({
  recommendationId: z.string().uuid(),

  domain: SignalDomainSchema,
  title: z.string(),
  summary: z.string(),
  rationale: z.string(),

  suggestedAction: RecommendationActionSchema,
  actionPayload: z.record(z.unknown()).default({}),

  confidence: z.number().min(0).max(1),
  freshness: z.number().min(0).max(1),
  projectedImpactUsd: z.number().optional(),
  projectedRiskReductionPct: z.number().min(0).max(100).optional(),
  projectedRiskIncreaseUsd: z.number().optional(),

  evidenceIds: z.array(z.string()).default([]),
  signalIds: z.array(z.string()).default([]),
  entityRefs: z.array(EntityRefSchema).default([]),

  status: RecommendationStatusSchema.default("pending"),
  policyEvaluation: z.object({
    outcome: z.enum(["allow", "require-approval", "block", "pending"]).default("pending"),
    policyIds: z.array(z.string()).default([]),
    reason: z.string().optional(),
    evaluatedAt: z.string().datetime().optional(),
  }).default({ outcome: "pending", policyIds: [] }),

  tenantId: z.string().optional(),
  generatedBy: z.string().optional(),
  provenance: ProvenanceSchema.optional(),

  generatedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  resolvedAt: z.string().datetime().optional(),

  tags: z.array(z.string()).default([]),
  schemaVersion: z.string().default("recommendation/1.0"),
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

export type RecommendationInput = Omit<
  Recommendation,
  | "recommendationId"
  | "schemaVersion"
  | "status"
  | "policyEvaluation"
>;

export function createRecommendation(input: RecommendationInput): Recommendation {
  return RecommendationSchema.parse({
    ...input,
    recommendationId: randomUUID(),
    schemaVersion: "recommendation/1.0",
  });
}
