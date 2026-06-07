-- Alloy Platform Core — Canonical Schema
-- Task #123: Signal, Workflow, Approval, Action, Artifact, Owner, AuditLog
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_owners" (
    "id" serial PRIMARY KEY NOT NULL,
    "external_id" text UNIQUE,
    "name" text NOT NULL,
    "type" text NOT NULL DEFAULT 'user',
    "email" text,
    "domain" text,
    "metadata" jsonb DEFAULT '{}',
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_signals" (
    "id" serial PRIMARY KEY NOT NULL,
    "external_id" text UNIQUE,
    "source" text NOT NULL,
    "source_type" text NOT NULL DEFAULT 'api',
    "domain" text NOT NULL,
    "raw_payload" jsonb,
    "title" text NOT NULL,
    "summary" text,
    "category" text,
    "severity" text NOT NULL DEFAULT 'medium',
    "score" real DEFAULT 0,
    "confidence" real DEFAULT 0.5,
    "tags" jsonb DEFAULT '[]',
    "owner_id" integer REFERENCES "alloy_owners"("id"),
    "owner_user_id" integer REFERENCES "users"("id"),
    "status" text NOT NULL DEFAULT 'raw',
    "normalized_at" timestamp,
    "scored_at" timestamp,
    "dedupe_key" text UNIQUE,
    "environment" text DEFAULT 'production',
    "metadata" jsonb DEFAULT '{}',
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_signals_domain_idx" ON "alloy_signals" ("domain");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_signals_severity_idx" ON "alloy_signals" ("severity");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_signals_status_idx" ON "alloy_signals" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_signals_source_type_idx" ON "alloy_signals" ("source_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_signals_owner_idx" ON "alloy_signals" ("owner_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_signals_created_idx" ON "alloy_signals" ("created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_workflows" (
    "id" serial PRIMARY KEY NOT NULL,
    "external_id" text UNIQUE,
    "name" text NOT NULL,
    "type" text NOT NULL DEFAULT 'investigation',
    "domain" text NOT NULL,
    "trigger_signal_id" integer REFERENCES "alloy_signals"("id"),
    "trigger_type" text NOT NULL DEFAULT 'signal',
    "status" text NOT NULL DEFAULT 'pending',
    "priority" text NOT NULL DEFAULT 'medium',
    "owner_id" integer REFERENCES "alloy_owners"("id"),
    "owner_user_id" integer REFERENCES "users"("id"),
    "assigned_user_id" integer REFERENCES "users"("id"),
    "steps" jsonb DEFAULT '[]',
    "current_step" integer DEFAULT 0,
    "inputs" jsonb DEFAULT '{}',
    "outputs" jsonb DEFAULT '{}',
    "context" jsonb DEFAULT '{}',
    "retry_count" integer NOT NULL DEFAULT 0,
    "max_retries" integer NOT NULL DEFAULT 3,
    "requires_approval" boolean NOT NULL DEFAULT false,
    "approval_state" text DEFAULT 'none',
    "confidence_score" real DEFAULT 0.5,
    "error_message" text,
    "scheduled_at" timestamp,
    "started_at" timestamp,
    "completed_at" timestamp,
    "environment" text DEFAULT 'production',
    "metadata" jsonb DEFAULT '{}',
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_workflows_domain_idx" ON "alloy_workflows" ("domain");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_workflows_status_idx" ON "alloy_workflows" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_workflows_type_idx" ON "alloy_workflows" ("type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_workflows_owner_idx" ON "alloy_workflows" ("owner_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_workflows_priority_idx" ON "alloy_workflows" ("priority");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_workflows_created_idx" ON "alloy_workflows" ("created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_workflow_runs" (
    "id" serial PRIMARY KEY NOT NULL,
    "workflow_id" integer NOT NULL REFERENCES "alloy_workflows"("id") ON DELETE CASCADE,
    "run_number" integer NOT NULL DEFAULT 1,
    "status" text NOT NULL DEFAULT 'started',
    "trigger" text,
    "inputs" jsonb DEFAULT '{}',
    "outputs" jsonb DEFAULT '{}',
    "steps_executed" jsonb DEFAULT '[]',
    "owner_user_id" integer REFERENCES "users"("id"),
    "approval_state" text DEFAULT 'none',
    "approved_by_user_id" integer REFERENCES "users"("id"),
    "retry_count" integer NOT NULL DEFAULT 0,
    "error_message" text,
    "duration_ms" integer,
    "started_at" timestamp DEFAULT now() NOT NULL,
    "completed_at" timestamp,
    "metadata" jsonb DEFAULT '{}'
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_workflow_runs_workflow_idx" ON "alloy_workflow_runs" ("workflow_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_workflow_runs_status_idx" ON "alloy_workflow_runs" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_workflow_runs_started_idx" ON "alloy_workflow_runs" ("started_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_approvals" (
    "id" serial PRIMARY KEY NOT NULL,
    "workflow_id" integer NOT NULL REFERENCES "alloy_workflows"("id") ON DELETE CASCADE,
    "run_id" integer REFERENCES "alloy_workflow_runs"("id"),
    "requested_by_user_id" integer REFERENCES "users"("id"),
    "reviewer_user_id" integer REFERENCES "users"("id"),
    "status" text NOT NULL DEFAULT 'pending',
    "reason" text,
    "review_note" text,
    "required_roles" jsonb DEFAULT '[]',
    "expires_at" timestamp,
    "reviewed_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_approvals_workflow_idx" ON "alloy_approvals" ("workflow_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_approvals_status_idx" ON "alloy_approvals" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_approvals_reviewer_idx" ON "alloy_approvals" ("reviewer_user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_actions" (
    "id" serial PRIMARY KEY NOT NULL,
    "external_id" text UNIQUE,
    "workflow_id" integer REFERENCES "alloy_workflows"("id"),
    "signal_id" integer REFERENCES "alloy_signals"("id"),
    "type" text NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "status" text NOT NULL DEFAULT 'queued',
    "priority" text NOT NULL DEFAULT 'medium',
    "assigned_user_id" integer REFERENCES "users"("id"),
    "owner_id" integer REFERENCES "alloy_owners"("id"),
    "payload" jsonb DEFAULT '{}',
    "result" jsonb,
    "error_message" text,
    "due_at" timestamp,
    "started_at" timestamp,
    "completed_at" timestamp,
    "metadata" jsonb DEFAULT '{}',
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_actions_workflow_idx" ON "alloy_actions" ("workflow_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_actions_signal_idx" ON "alloy_actions" ("signal_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_actions_status_idx" ON "alloy_actions" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_actions_type_idx" ON "alloy_actions" ("type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_actions_assigned_idx" ON "alloy_actions" ("assigned_user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_artifacts" (
    "id" serial PRIMARY KEY NOT NULL,
    "external_id" text UNIQUE,
    "workflow_id" integer REFERENCES "alloy_workflows"("id"),
    "signal_id" integer REFERENCES "alloy_signals"("id"),
    "type" text NOT NULL,
    "title" text NOT NULL,
    "content" text NOT NULL,
    "format" text NOT NULL DEFAULT 'markdown',
    "confidence_score" real DEFAULT 0.5,
    "requires_approval" boolean NOT NULL DEFAULT false,
    "approval_state" text DEFAULT 'none',
    "approved_by_user_id" integer REFERENCES "users"("id"),
    "version" integer NOT NULL DEFAULT 1,
    "parent_artifact_id" integer,
    "tags" jsonb DEFAULT '[]',
    "domain" text NOT NULL,
    "owner_id" integer REFERENCES "alloy_owners"("id"),
    "owner_user_id" integer REFERENCES "users"("id"),
    "metadata" jsonb DEFAULT '{}',
    "published_at" timestamp,
    "archived_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_artifacts_workflow_idx" ON "alloy_artifacts" ("workflow_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_artifacts_signal_idx" ON "alloy_artifacts" ("signal_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_artifacts_type_idx" ON "alloy_artifacts" ("type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_artifacts_domain_idx" ON "alloy_artifacts" ("domain");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_artifacts_owner_idx" ON "alloy_artifacts" ("owner_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_artifacts_approval_idx" ON "alloy_artifacts" ("approval_state");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alloy_audit_log" (
    "id" serial PRIMARY KEY NOT NULL,
    "entity_type" text NOT NULL,
    "entity_id" integer NOT NULL,
    "action" text NOT NULL,
    "actor_user_id" integer REFERENCES "users"("id"),
    "actor_type" text NOT NULL DEFAULT 'system',
    "previous_state" jsonb,
    "new_state" jsonb,
    "diff" jsonb,
    "notes" text,
    "ip_address" text,
    "user_agent" text,
    "correlation_id" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_audit_log_entity_idx" ON "alloy_audit_log" ("entity_type", "entity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_audit_log_actor_idx" ON "alloy_audit_log" ("actor_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_audit_log_created_idx" ON "alloy_audit_log" ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_audit_log_action_idx" ON "alloy_audit_log" ("action");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_signals_owner_user_idx" ON "alloy_signals" ("owner_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_workflows_owner_user_idx" ON "alloy_workflows" ("owner_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_workflow_runs_owner_user_idx" ON "alloy_workflow_runs" ("owner_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alloy_artifacts_owner_user_idx" ON "alloy_artifacts" ("owner_user_id");
