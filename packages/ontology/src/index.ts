/**
 * @workspace/ontology
 *
 * Canonical entity, entity-link, entity-snapshot, signal, and evidence type
 * definitions for the SZL Holdings platform.
 *
 * This package is the single source of truth for:
 * - Entity types, domain taxonomy, freshness levels, confidence conventions,
 *   and policy states (ontology.md)
 * - Signal types and their domain assignments
 * - Entity link types and their directional semantics
 * - Entity snapshot shapes for Proof Chain and Replay Core
 * - Evidence reference shapes for traceable autonomy
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

export * from "./domains.js";
export * from "./entities.js";
export * from "./signals.js";
export * from "./entity-links.js";
export * from "./entity-snapshot.js";
export * from "./evidence.js";

export const ONTOLOGY_VERSION = "1.0.0" as const;
