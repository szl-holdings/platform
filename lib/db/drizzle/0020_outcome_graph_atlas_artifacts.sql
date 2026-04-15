CREATE TABLE IF NOT EXISTS "outcome_graph" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer REFERENCES "organizations"("id") ON DELETE cascade,
  "domain" text NOT NULL DEFAULT 'general',
  "entity_type" text NOT NULL,
  "entity_id" text,
  "recommendation_id" text,
  "recommendation_text" text NOT NULL,
  "recommendation_action" text,
  "agent_id" text,
  "model_id" text,
  "model_provider" text,
  "confidence" real NOT NULL DEFAULT 0.5,
  "status" text NOT NULL DEFAULT 'pending',
  "user_decision" text,
  "decided_by_user_id" integer REFERENCES "users"("id") ON DELETE set null,
  "decided_at" timestamp,
  "override_reason" text,
  "correction_reason" text,
  "action_executed" text,
  "action_executed_at" timestamp,
  "outcome_result" text,
  "outcome_notes" text,
  "outcome_recorded_at" timestamp,
  "time_to_outcome_ms" integer,
  "domain_conditions" jsonb DEFAULT '{}',
  "later_impact" jsonb DEFAULT '{}',
  "proof_chain_id" integer,
  "correlation_id" text,
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outcome_graph_org_idx" ON "outcome_graph" ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outcome_graph_domain_idx" ON "outcome_graph" ("domain");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outcome_graph_entity_idx" ON "outcome_graph" ("entity_type", "entity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outcome_graph_status_idx" ON "outcome_graph" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outcome_graph_agent_idx" ON "outcome_graph" ("agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outcome_graph_created_idx" ON "outcome_graph" ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outcome_graph_correlation_idx" ON "outcome_graph" ("correlation_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outcome_graph_learning_jobs" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer REFERENCES "organizations"("id") ON DELETE cascade,
  "domain" text NOT NULL DEFAULT 'general',
  "job_type" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "input_sample_size" integer,
  "output_summary" jsonb DEFAULT '{}',
  "changes_applied" jsonb DEFAULT '[]',
  "error_message" text,
  "started_at" timestamp,
  "completed_at" timestamp,
  "triggered_by" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outcome_learning_org_idx" ON "outcome_graph_learning_jobs" ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outcome_learning_domain_idx" ON "outcome_graph_learning_jobs" ("domain");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outcome_learning_status_idx" ON "outcome_graph_learning_jobs" ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "atlas_artifacts" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer REFERENCES "organizations"("id") ON DELETE cascade,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "template_type" text NOT NULL,
  "domain" text NOT NULL DEFAULT 'general',
  "entity_type" text,
  "entity_id" text,
  "version" integer NOT NULL DEFAULT 1,
  "parent_artifact_id" integer,
  "status" text NOT NULL DEFAULT 'draft',
  "content" jsonb DEFAULT '{}',
  "sections" jsonb DEFAULT '[]',
  "metadata" jsonb DEFAULT '{}',
  "proof_chain_id" integer,
  "outcome_graph_id" integer,
  "correlation_id" text,
  "generated_by" text,
  "generated_by_user_id" integer REFERENCES "users"("id") ON DELETE set null,
  "reviewed_by_user_id" integer REFERENCES "users"("id") ON DELETE set null,
  "reviewed_at" timestamp,
  "approved_by_user_id" integer REFERENCES "users"("id") ON DELETE set null,
  "approved_at" timestamp,
  "expires_at" timestamp,
  "is_latest" boolean NOT NULL DEFAULT true,
  "share_token" text,
  "share_expires_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "atlas_artifacts_org_idx" ON "atlas_artifacts" ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "atlas_artifacts_template_idx" ON "atlas_artifacts" ("template_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "atlas_artifacts_domain_idx" ON "atlas_artifacts" ("domain");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "atlas_artifacts_entity_idx" ON "atlas_artifacts" ("entity_type", "entity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "atlas_artifacts_status_idx" ON "atlas_artifacts" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "atlas_artifacts_slug_idx" ON "atlas_artifacts" ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "atlas_artifacts_share_token_idx" ON "atlas_artifacts" ("share_token");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "atlas_artifacts_created_idx" ON "atlas_artifacts" ("created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "atlas_export_jobs" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer REFERENCES "organizations"("id") ON DELETE cascade,
  "artifact_id" integer NOT NULL REFERENCES "atlas_artifacts"("id") ON DELETE cascade,
  "format" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "file_url" text,
  "file_size_bytes" integer,
  "error_message" text,
  "requested_by_user_id" integer REFERENCES "users"("id") ON DELETE set null,
  "started_at" timestamp,
  "completed_at" timestamp,
  "expires_at" timestamp,
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "atlas_export_artifact_idx" ON "atlas_export_jobs" ("artifact_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "atlas_export_status_idx" ON "atlas_export_jobs" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "atlas_export_org_idx" ON "atlas_export_jobs" ("org_id");
