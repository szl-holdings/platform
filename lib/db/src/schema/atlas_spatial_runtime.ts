import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";
import { usersTable } from "./auth";

export const SPATIAL_TWIN_CATEGORIES = [
  "vessel",
  "property",
  "posture",
  "matter",
  "portfolio",
  "incident",
  "port",
] as const;
export type SpatialTwinCategory = (typeof SPATIAL_TWIN_CATEGORIES)[number];

export const DRIFT_STATUS_VALUES = [
  "stable",
  "watch",
  "degraded",
  "blocked",
] as const;
export type DriftStatus = (typeof DRIFT_STATUS_VALUES)[number];

export const OVERLAY_SIGNAL_TYPES = [
  "weather",
  "sanctions",
  "regulatory",
  "threat_intel",
  "market",
  "litigation",
] as const;
export type OverlaySignalType = (typeof OVERLAY_SIGNAL_TYPES)[number];

export const SOURCE_TRUST_CLASSES = [
  "authoritative",
  "verified",
  "inferred",
  "unverified",
] as const;
export type SourceTrustClass = (typeof SOURCE_TRUST_CLASSES)[number];

export const MODEL_LANE_TYPES = [
  "reasoning",
  "multimodal",
  "simulation",
  "summarization",
  "rendering",
] as const;
export type ModelLaneType = (typeof MODEL_LANE_TYPES)[number];

export const spatialTwinSnapshotsTable = pgTable("spatial_twin_snapshots", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  twinId: text("twin_id").notNull(),
  entityId: text("entity_id").notNull(),
  twinCategory: text("twin_category", { enum: SPATIAL_TWIN_CATEGORIES }).notNull(),
  sequenceNumber: integer("sequence_number").notNull().default(0),
  state: jsonb("state").notNull().default({}),
  predictedStates: jsonb("predicted_states").default([]),
  alerts: jsonb("alerts").default([]),
  confidenceScore: real("confidence_score").notNull().default(0.5),
  parentSnapshotId: integer("parent_snapshot_id"),
  derivedBranchId: text("derived_branch_id"),
  proofChainId: integer("proof_chain_id"),
  modelLane: text("model_lane"),
  promptHash: text("prompt_hash"),
  renderedArtifactHash: text("rendered_artifact_hash"),
  sourceEvidenceList: jsonb("source_evidence_list").default([]),
  coordinates: jsonb("coordinates"),
  spatialContext: jsonb("spatial_context").default({}),
  metadata: jsonb("metadata").default({}),
  snapshotAt: timestamp("snapshot_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("spatial_snapshots_twin_idx").on(table.twinId),
  index("spatial_snapshots_entity_idx").on(table.entityId),
  index("spatial_snapshots_category_idx").on(table.twinCategory),
  index("spatial_snapshots_org_idx").on(table.orgId),
  index("spatial_snapshots_seq_idx").on(table.twinId, table.sequenceNumber),
  index("spatial_snapshots_at_idx").on(table.snapshotAt),
  index("spatial_snapshots_branch_idx").on(table.derivedBranchId),
]);

export const scenarioBranchesTable = pgTable("scenario_branches", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  branchId: text("branch_id").notNull().unique(),
  twinId: text("twin_id").notNull(),
  entityId: text("entity_id").notNull(),
  twinCategory: text("twin_category", { enum: SPATIAL_TWIN_CATEGORIES }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  baselineSnapshotId: integer("baseline_snapshot_id").references(() => spatialTwinSnapshotsTable.id, { onDelete: "set null" }),
  branchSnapshotId: integer("branch_snapshot_id").references(() => spatialTwinSnapshotsTable.id, { onDelete: "set null" }),
  parameters: jsonb("parameters").notNull().default({}),
  deltaMetrics: jsonb("delta_metrics").default({}),
  riskAssessment: text("risk_assessment"),
  recommendedActions: jsonb("recommended_actions").default([]),
  confidenceScore: real("confidence_score").notNull().default(0.5),
  status: text("status", {
    enum: ["pending", "running", "completed", "failed", "archived"],
  }).notNull().default("pending"),
  proofChainId: integer("proof_chain_id"),
  correlationId: text("correlation_id"),
  createdByUserId: integer("created_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  metadata: jsonb("metadata").default({}),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("scenario_branches_twin_idx").on(table.twinId),
  index("scenario_branches_entity_idx").on(table.entityId),
  index("scenario_branches_org_idx").on(table.orgId),
  index("scenario_branches_status_idx").on(table.status),
  index("scenario_branches_created_idx").on(table.createdAt),
  index("scenario_branches_branch_id_idx").on(table.branchId),
]);

export const driftAssessmentsTable = pgTable("drift_assessments", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  twinId: text("twin_id").notNull(),
  entityId: text("entity_id").notNull(),
  twinCategory: text("twin_category", { enum: SPATIAL_TWIN_CATEGORIES }).notNull(),
  currentSnapshotId: integer("current_snapshot_id").references(() => spatialTwinSnapshotsTable.id, { onDelete: "set null" }),
  approvedSnapshotId: integer("approved_snapshot_id").references(() => spatialTwinSnapshotsTable.id, { onDelete: "set null" }),
  driftStatus: text("drift_status", { enum: DRIFT_STATUS_VALUES }).notNull().default("stable"),
  driftScore: real("drift_score").notNull().default(0),
  divergentFields: jsonb("divergent_fields").default([]),
  trustedSourceDeltas: jsonb("trusted_source_deltas").default([]),
  confidenceDowngradeReason: text("confidence_downgrade_reason"),
  originalConfidence: real("original_confidence"),
  adjustedConfidence: real("adjusted_confidence"),
  blockedReason: text("blocked_reason"),
  assessedAt: timestamp("assessed_at").notNull().defaultNow(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("drift_assessments_twin_idx").on(table.twinId),
  index("drift_assessments_entity_idx").on(table.entityId),
  index("drift_assessments_org_idx").on(table.orgId),
  index("drift_assessments_status_idx").on(table.driftStatus),
  index("drift_assessments_assessed_idx").on(table.assessedAt),
]);

export const sceneMemoryIndexTable = pgTable("scene_memory_index", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  twinId: text("twin_id").notNull(),
  entityId: text("entity_id").notNull(),
  twinCategory: text("twin_category", { enum: SPATIAL_TWIN_CATEGORIES }).notNull(),
  snapshotId: integer("snapshot_id").references(() => spatialTwinSnapshotsTable.id, { onDelete: "cascade" }),
  overlapScore: real("overlap_score").notNull().default(0),
  recencyScore: real("recency_score").notNull().default(0),
  trustWeight: real("trust_weight").notNull().default(0.7),
  causalRelevanceScore: real("causal_relevance_score").notNull().default(0),
  compositeRankScore: real("composite_rank_score").notNull().default(0),
  retrievalTags: jsonb("retrieval_tags").default([]),
  spatialOverlap: jsonb("spatial_overlap").default({}),
  causalLinks: jsonb("causal_links").default([]),
  metadata: jsonb("metadata").default({}),
  indexedAt: timestamp("indexed_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  index("scene_memory_twin_idx").on(table.twinId),
  index("scene_memory_entity_idx").on(table.entityId),
  index("scene_memory_org_idx").on(table.orgId),
  index("scene_memory_rank_idx").on(table.compositeRankScore),
  index("scene_memory_snapshot_idx").on(table.snapshotId),
  index("scene_memory_indexed_idx").on(table.indexedAt),
]);

export const worldlineSignalOverlaysTable = pgTable("worldline_signal_overlays", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  overlayId: text("overlay_id").notNull().unique(),
  signalType: text("signal_type", { enum: OVERLAY_SIGNAL_TYPES }).notNull(),
  sourceId: integer("source_id"),
  sourceTrustClass: text("source_trust_class", { enum: SOURCE_TRUST_CLASSES }).notNull().default("inferred"),
  signalTimestamp: timestamp("signal_timestamp").notNull(),
  expiresAt: timestamp("expires_at"),
  coordinates: jsonb("coordinates"),
  boundingRegion: jsonb("bounding_region"),
  affectedEntityIds: jsonb("affected_entity_ids").default([]),
  affectedTwinCategories: jsonb("affected_twin_categories").default([]),
  payload: jsonb("payload").notNull().default({}),
  confidenceScore: real("confidence_score").notNull().default(0.7),
  causalLinkage: jsonb("causal_linkage").default([]),
  severity: text("severity", { enum: ["info", "warning", "critical"] }).notNull().default("info"),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("wl_overlays_signal_type_idx").on(table.signalType),
  index("wl_overlays_org_idx").on(table.orgId),
  index("wl_overlays_timestamp_idx").on(table.signalTimestamp),
  index("wl_overlays_active_idx").on(table.isActive),
  index("wl_overlays_trust_idx").on(table.sourceTrustClass),
  index("wl_overlays_severity_idx").on(table.severity),
  index("wl_overlays_overlay_id_idx").on(table.overlayId),
]);

export const insertSpatialTwinSnapshotSchema = createInsertSchema(spatialTwinSnapshotsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSpatialTwinSnapshot = z.infer<typeof insertSpatialTwinSnapshotSchema>;
export type SpatialTwinSnapshot = typeof spatialTwinSnapshotsTable.$inferSelect;

export const insertScenarioBranchSchema = createInsertSchema(scenarioBranchesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertScenarioBranch = z.infer<typeof insertScenarioBranchSchema>;
export type ScenarioBranch = typeof scenarioBranchesTable.$inferSelect;

export const insertDriftAssessmentSchema = createInsertSchema(driftAssessmentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertDriftAssessment = z.infer<typeof insertDriftAssessmentSchema>;
export type DriftAssessment = typeof driftAssessmentsTable.$inferSelect;

export const insertSceneMemoryIndexSchema = createInsertSchema(sceneMemoryIndexTable).omit({
  id: true,
  indexedAt: true,
});
export type InsertSceneMemoryIndex = z.infer<typeof insertSceneMemoryIndexSchema>;
export type SceneMemoryIndex = typeof sceneMemoryIndexTable.$inferSelect;

export const insertWorldlineSignalOverlaySchema = createInsertSchema(worldlineSignalOverlaysTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWorldlineSignalOverlay = z.infer<typeof insertWorldlineSignalOverlaySchema>;
export type WorldlineSignalOverlay = typeof worldlineSignalOverlaysTable.$inferSelect;
