/**
 * @workspace/ontology
 *
 * Canonical entity, entity-link, entity-snapshot, signal, and evidence type
 * definitions for the SZL Holdings platform. Also provides Zod-validated
 * Signal, EvidenceItem, and Recommendation schemas for the living signal mesh.
 *
 * This package is the single source of truth for:
 * - Entity types, domain taxonomy, freshness levels, confidence conventions,
 *   and policy states (ontology.md)
 * - Signal types and their domain assignments
 * - Entity link types and their directional semantics
 * - Entity snapshot shapes for Proof Chain and Replay Core
 * - Evidence reference shapes for traceable autonomy
 * - Zod-validated Signal, EvidenceItem, and Recommendation contracts
 *
 * IMPORT RULE: Every package that emits, stores, or reasons about governed
 * intelligence concepts must import from @workspace/ontology or derive from
 * its types. Do not redefine these types locally.
 *
 * DO NOT:
 * - Strip evidence, freshness, confidence, or policyState from entities
 * - Regenerate correlationId mid-loop
 * - Introduce new entity types without updating this package and ontology.md
 */

// Canonical ontology types (interface-based)
export * from "./domains.js";
export * from "./entities.js";
export * from "./signals.js";
export * from "./entity-links.js";
export * from "./entity-snapshot.js";

// Signal mesh contracts (Zod-validated)
export * from "./signal.js";
export * from "./entity.js";

// Shared evidence & recommendation (interface-based + Zod schemas)
export * from "./evidence.js";

export const ONTOLOGY_VERSION = "1.0.0" as const;

export const SIGNAL_PIPELINE_STAGES = [
  "intake",
  "normalize",
  "enrich",
  "entity-resolve",
  "correlate",
  "score",
  "recommend",
  "policy-evaluate",
  "telemetry-writeback",
] as const;

export type SignalPipelineStage = typeof SIGNAL_PIPELINE_STAGES[number];
