-- Platform Operations Tables
-- Creates platform_job_runs and artifact_approvals tables for durable operational state.
-- Note: platform_job_runs is distinct from the canonical workflow_runs table.

-- Ensure feature_flags schema is up to date with all required columns
ALTER TABLE IF EXISTS "feature_flags" ADD COLUMN IF NOT EXISTS "scope" text DEFAULT 'global';
ALTER TABLE IF EXISTS "feature_flags" ADD COLUMN IF NOT EXISTS "targeting_json" jsonb;
ALTER TABLE IF EXISTS "feature_flags" ADD COLUMN IF NOT EXISTS "product" text;
ALTER TABLE IF EXISTS "feature_flags" ADD COLUMN IF NOT EXISTS "required_platform_role" text;

CREATE TABLE IF NOT EXISTS "platform_job_runs" (
  "id" serial PRIMARY KEY NOT NULL,
  "run_id" text NOT NULL UNIQUE,
  "workflow_type" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "domain" text NOT NULL,
  "triggered_by" text NOT NULL DEFAULT 'scheduler',
  "triggered_by_user_id" integer REFERENCES "public"."users"("id") ON DELETE set null,
  "payload" jsonb,
  "result" jsonb,
  "error" text,
  "retries" integer NOT NULL DEFAULT 0,
  "correlation_id" text,
  "workflow_run_id" text,
  "signal_id" text,
  "artifact_id" text,
  "started_at" timestamp,
  "completed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "artifact_approvals" (
  "id" serial PRIMARY KEY NOT NULL,
  "approval_id" text NOT NULL UNIQUE,
  "artifact_type" text NOT NULL,
  "artifact_id" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "domain" text NOT NULL,
  "summary" text NOT NULL,
  "requested_by_user_id" integer REFERENCES "public"."users"("id") ON DELETE set null,
  "requested_by_label" text,
  "reviewed_by_user_id" integer REFERENCES "public"."users"("id") ON DELETE set null,
  "reviewed_by_label" text,
  "review_note" text,
  "correlation_id" text,
  "workflow_run_id" text,
  "requested_at" timestamp NOT NULL DEFAULT now(),
  "reviewed_at" timestamp,
  "expires_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "platform_job_runs_type_idx" ON "platform_job_runs" ("workflow_type");
CREATE INDEX IF NOT EXISTS "platform_job_runs_status_idx" ON "platform_job_runs" ("status");
CREATE INDEX IF NOT EXISTS "platform_job_runs_domain_idx" ON "platform_job_runs" ("domain");
CREATE INDEX IF NOT EXISTS "platform_job_runs_correlation_idx" ON "platform_job_runs" ("correlation_id");
CREATE INDEX IF NOT EXISTS "artifact_approvals_status_idx" ON "artifact_approvals" ("status");
CREATE INDEX IF NOT EXISTS "artifact_approvals_domain_idx" ON "artifact_approvals" ("domain");
