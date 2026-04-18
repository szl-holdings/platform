CREATE TABLE IF NOT EXISTS "mesh_signals" (
  "signal_id" UUID PRIMARY KEY,
  "source" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "severity" TEXT,
  "stage" TEXT NOT NULL,
  "tenant_id" TEXT,
  "session_id" TEXT,
  "freshness" REAL NOT NULL,
  "confidence" REAL NOT NULL,
  "occurred_at" TIMESTAMPTZ NOT NULL,
  "received_at" TIMESTAMPTZ NOT NULL,
  "processed_at" TIMESTAMPTZ,
  "expires_at" TIMESTAMPTZ,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_signals_domain_idx" ON "mesh_signals" ("domain");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_signals_type_idx" ON "mesh_signals" ("type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_signals_tenant_id_idx" ON "mesh_signals" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_signals_occurred_at_idx" ON "mesh_signals" ("occurred_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_signals_received_at_idx" ON "mesh_signals" ("received_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mesh_evidence_items" (
  "evidence_id" UUID PRIMARY KEY,
  "type" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "signal_id" UUID,
  "summary" TEXT NOT NULL,
  "confidence" REAL NOT NULL,
  "freshness" REAL NOT NULL,
  "weight" REAL NOT NULL DEFAULT 1,
  "observed_at" TIMESTAMPTZ NOT NULL,
  "expires_at" TIMESTAMPTZ,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_evidence_items_domain_idx" ON "mesh_evidence_items" ("domain");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_evidence_items_type_idx" ON "mesh_evidence_items" ("type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_evidence_items_signal_id_idx" ON "mesh_evidence_items" ("signal_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_evidence_items_observed_at_idx" ON "mesh_evidence_items" ("observed_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mesh_recommendations" (
  "recommendation_id" UUID PRIMARY KEY,
  "domain" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "suggested_action" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "confidence" REAL NOT NULL,
  "freshness" REAL NOT NULL,
  "tenant_id" TEXT,
  "generated_by" TEXT,
  "generated_at" TIMESTAMPTZ NOT NULL,
  "expires_at" TIMESTAMPTZ,
  "resolved_at" TIMESTAMPTZ,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_recommendations_domain_idx" ON "mesh_recommendations" ("domain");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_recommendations_status_idx" ON "mesh_recommendations" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_recommendations_tenant_id_idx" ON "mesh_recommendations" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_recommendations_generated_at_idx" ON "mesh_recommendations" ("generated_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mesh_entity_snapshots" (
  "entity_id" TEXT PRIMARY KEY,
  "snapshot_id" UUID NOT NULL,
  "entity_type" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "health" TEXT NOT NULL DEFAULT 'unknown',
  "tenant_id" TEXT,
  "snapshot_at" TIMESTAMPTZ NOT NULL,
  "valid_until" TIMESTAMPTZ,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_entity_snapshots_domain_idx" ON "mesh_entity_snapshots" ("domain");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_entity_snapshots_entity_type_idx" ON "mesh_entity_snapshots" ("entity_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_entity_snapshots_health_idx" ON "mesh_entity_snapshots" ("health");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_entity_snapshots_tenant_id_idx" ON "mesh_entity_snapshots" ("tenant_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mesh_evidence_entity_links" (
  "evidence_id" UUID NOT NULL,
  "entity_id" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "linked_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("evidence_id", "entity_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_evidence_entity_links_entity_id_idx" ON "mesh_evidence_entity_links" ("entity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mesh_evidence_entity_links_evidence_id_idx" ON "mesh_evidence_entity_links" ("evidence_id");
