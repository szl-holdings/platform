-- Migration: ATLAS Spatial Runtime core schema
-- Creates spatial twin snapshots, scenario branches, drift assessments,
-- scene memory index, and worldline signal overlays tables.

CREATE TABLE IF NOT EXISTS "spatial_twin_snapshots" (
  "id" serial PRIMARY KEY,
  "org_id" integer REFERENCES "organizations"("id") ON DELETE CASCADE,
  "twin_id" text NOT NULL,
  "entity_id" text NOT NULL,
  "twin_category" text NOT NULL,
  "sequence_number" integer NOT NULL DEFAULT 0,
  "state" jsonb NOT NULL DEFAULT '{}',
  "predicted_states" jsonb DEFAULT '[]',
  "alerts" jsonb DEFAULT '[]',
  "confidence_score" real NOT NULL DEFAULT 0.5,
  "parent_snapshot_id" integer,
  "derived_branch_id" text,
  "proof_chain_id" integer,
  "model_lane" text,
  "prompt_hash" text,
  "rendered_artifact_hash" text,
  "source_evidence_list" jsonb DEFAULT '[]',
  "coordinates" jsonb,
  "spatial_context" jsonb DEFAULT '{}',
  "metadata" jsonb DEFAULT '{}',
  "snapshot_at" timestamp NOT NULL DEFAULT NOW(),
  "created_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "spatial_snapshots_twin_idx" ON "spatial_twin_snapshots" ("twin_id");
CREATE INDEX IF NOT EXISTS "spatial_snapshots_entity_idx" ON "spatial_twin_snapshots" ("entity_id");
CREATE INDEX IF NOT EXISTS "spatial_snapshots_category_idx" ON "spatial_twin_snapshots" ("twin_category");
CREATE INDEX IF NOT EXISTS "spatial_snapshots_org_idx" ON "spatial_twin_snapshots" ("org_id");
CREATE INDEX IF NOT EXISTS "spatial_snapshots_seq_idx" ON "spatial_twin_snapshots" ("twin_id", "sequence_number");
CREATE INDEX IF NOT EXISTS "spatial_snapshots_at_idx" ON "spatial_twin_snapshots" ("snapshot_at");
CREATE INDEX IF NOT EXISTS "spatial_snapshots_branch_idx" ON "spatial_twin_snapshots" ("derived_branch_id");

CREATE TABLE IF NOT EXISTS "scenario_branches" (
  "id" serial PRIMARY KEY,
  "org_id" integer REFERENCES "organizations"("id") ON DELETE CASCADE,
  "branch_id" text NOT NULL UNIQUE,
  "twin_id" text NOT NULL,
  "entity_id" text NOT NULL,
  "twin_category" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "baseline_snapshot_id" integer REFERENCES "spatial_twin_snapshots"("id") ON DELETE SET NULL,
  "branch_snapshot_id" integer REFERENCES "spatial_twin_snapshots"("id") ON DELETE SET NULL,
  "parameters" jsonb NOT NULL DEFAULT '{}',
  "delta_metrics" jsonb DEFAULT '{}',
  "risk_assessment" text,
  "recommended_actions" jsonb DEFAULT '[]',
  "confidence_score" real NOT NULL DEFAULT 0.5,
  "status" text NOT NULL DEFAULT 'pending',
  "proof_chain_id" integer,
  "correlation_id" text,
  "created_by_user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "metadata" jsonb DEFAULT '{}',
  "completed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "scenario_branches_twin_idx" ON "scenario_branches" ("twin_id");
CREATE INDEX IF NOT EXISTS "scenario_branches_entity_idx" ON "scenario_branches" ("entity_id");
CREATE INDEX IF NOT EXISTS "scenario_branches_org_idx" ON "scenario_branches" ("org_id");
CREATE INDEX IF NOT EXISTS "scenario_branches_status_idx" ON "scenario_branches" ("status");
CREATE INDEX IF NOT EXISTS "scenario_branches_created_idx" ON "scenario_branches" ("created_at");
CREATE INDEX IF NOT EXISTS "scenario_branches_branch_id_idx" ON "scenario_branches" ("branch_id");

CREATE TABLE IF NOT EXISTS "drift_assessments" (
  "id" serial PRIMARY KEY,
  "org_id" integer REFERENCES "organizations"("id") ON DELETE CASCADE,
  "twin_id" text NOT NULL,
  "entity_id" text NOT NULL,
  "twin_category" text NOT NULL,
  "current_snapshot_id" integer REFERENCES "spatial_twin_snapshots"("id") ON DELETE SET NULL,
  "approved_snapshot_id" integer REFERENCES "spatial_twin_snapshots"("id") ON DELETE SET NULL,
  "drift_status" text NOT NULL DEFAULT 'stable',
  "drift_score" real NOT NULL DEFAULT 0,
  "divergent_fields" jsonb DEFAULT '[]',
  "trusted_source_deltas" jsonb DEFAULT '[]',
  "confidence_downgrade_reason" text,
  "original_confidence" real,
  "adjusted_confidence" real,
  "blocked_reason" text,
  "assessed_at" timestamp NOT NULL DEFAULT NOW(),
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "drift_assessments_twin_idx" ON "drift_assessments" ("twin_id");
CREATE INDEX IF NOT EXISTS "drift_assessments_entity_idx" ON "drift_assessments" ("entity_id");
CREATE INDEX IF NOT EXISTS "drift_assessments_org_idx" ON "drift_assessments" ("org_id");
CREATE INDEX IF NOT EXISTS "drift_assessments_status_idx" ON "drift_assessments" ("drift_status");
CREATE INDEX IF NOT EXISTS "drift_assessments_assessed_idx" ON "drift_assessments" ("assessed_at");

CREATE TABLE IF NOT EXISTS "scene_memory_index" (
  "id" serial PRIMARY KEY,
  "org_id" integer REFERENCES "organizations"("id") ON DELETE CASCADE,
  "twin_id" text NOT NULL,
  "entity_id" text NOT NULL,
  "twin_category" text NOT NULL,
  "snapshot_id" integer REFERENCES "spatial_twin_snapshots"("id") ON DELETE CASCADE,
  "overlap_score" real NOT NULL DEFAULT 0,
  "recency_score" real NOT NULL DEFAULT 0,
  "trust_weight" real NOT NULL DEFAULT 0.7,
  "causal_relevance_score" real NOT NULL DEFAULT 0,
  "composite_rank_score" real NOT NULL DEFAULT 0,
  "retrieval_tags" jsonb DEFAULT '[]',
  "spatial_overlap" jsonb DEFAULT '{}',
  "causal_links" jsonb DEFAULT '[]',
  "metadata" jsonb DEFAULT '{}',
  "indexed_at" timestamp NOT NULL DEFAULT NOW(),
  "expires_at" timestamp
);

CREATE INDEX IF NOT EXISTS "scene_memory_twin_idx" ON "scene_memory_index" ("twin_id");
CREATE INDEX IF NOT EXISTS "scene_memory_entity_idx" ON "scene_memory_index" ("entity_id");
CREATE INDEX IF NOT EXISTS "scene_memory_org_idx" ON "scene_memory_index" ("org_id");
CREATE INDEX IF NOT EXISTS "scene_memory_rank_idx" ON "scene_memory_index" ("composite_rank_score");
CREATE INDEX IF NOT EXISTS "scene_memory_snapshot_idx" ON "scene_memory_index" ("snapshot_id");
CREATE INDEX IF NOT EXISTS "scene_memory_indexed_idx" ON "scene_memory_index" ("indexed_at");

CREATE TABLE IF NOT EXISTS "worldline_signal_overlays" (
  "id" serial PRIMARY KEY,
  "org_id" integer REFERENCES "organizations"("id") ON DELETE CASCADE,
  "overlay_id" text NOT NULL UNIQUE,
  "signal_type" text NOT NULL,
  "source_id" integer,
  "source_trust_class" text NOT NULL DEFAULT 'inferred',
  "signal_timestamp" timestamp NOT NULL,
  "expires_at" timestamp,
  "coordinates" jsonb,
  "bounding_region" jsonb,
  "affected_entity_ids" jsonb DEFAULT '[]',
  "affected_twin_categories" jsonb DEFAULT '[]',
  "payload" jsonb NOT NULL DEFAULT '{}',
  "confidence_score" real NOT NULL DEFAULT 0.7,
  "causal_linkage" jsonb DEFAULT '[]',
  "severity" text NOT NULL DEFAULT 'info',
  "is_active" boolean NOT NULL DEFAULT true,
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  "updated_at" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "wl_overlays_signal_type_idx" ON "worldline_signal_overlays" ("signal_type");
CREATE INDEX IF NOT EXISTS "wl_overlays_org_idx" ON "worldline_signal_overlays" ("org_id");
CREATE INDEX IF NOT EXISTS "wl_overlays_timestamp_idx" ON "worldline_signal_overlays" ("signal_timestamp");
CREATE INDEX IF NOT EXISTS "wl_overlays_active_idx" ON "worldline_signal_overlays" ("is_active");
CREATE INDEX IF NOT EXISTS "wl_overlays_trust_idx" ON "worldline_signal_overlays" ("source_trust_class");
CREATE INDEX IF NOT EXISTS "wl_overlays_severity_idx" ON "worldline_signal_overlays" ("severity");
CREATE INDEX IF NOT EXISTS "wl_overlays_overlay_id_idx" ON "worldline_signal_overlays" ("overlay_id");
