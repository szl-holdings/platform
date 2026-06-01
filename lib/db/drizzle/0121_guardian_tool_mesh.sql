CREATE TABLE IF NOT EXISTS "guardian_policies" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer,
  "name" text NOT NULL,
  "description" text,
  "tier" text NOT NULL,
  "conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "action" text NOT NULL,
  "priority" integer DEFAULT 100 NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "owner" text,
  "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_by_id" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "guardian_policies" ADD CONSTRAINT "guardian_policies_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "guardian_policies" ADD CONSTRAINT "guardian_policies_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guardian_policies_org_idx" ON "guardian_policies" ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guardian_policies_tier_idx" ON "guardian_policies" ("tier");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guardian_policies_enabled_idx" ON "guardian_policies" ("enabled");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guardian_policies_priority_idx" ON "guardian_policies" ("priority");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guardian_policy_assignments" (
  "id" serial PRIMARY KEY NOT NULL,
  "policy_id" integer NOT NULL,
  "subject_type" text NOT NULL,
  "subject_id" text NOT NULL,
  "context" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "granted_by_id" integer,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "guardian_policy_assignments" ADD CONSTRAINT "guardian_policy_assignments_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "guardian_policies"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "guardian_policy_assignments" ADD CONSTRAINT "guardian_policy_assignments_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guardian_policy_assignments_policy_idx" ON "guardian_policy_assignments" ("policy_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guardian_policy_assignments_subject_idx" ON "guardian_policy_assignments" ("subject_type","subject_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "guardian_policy_assignments_unique_idx" ON "guardian_policy_assignments" ("policy_id","subject_type","subject_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tool_mesh_tools" (
  "id" serial PRIMARY KEY NOT NULL,
  "tool_id" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "version" text DEFAULT '1.0.0' NOT NULL,
  "description" text NOT NULL,
  "domain_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "policy_tier" text NOT NULL,
  "allowed_environments" jsonb DEFAULT '["development","staging","production"]'::jsonb NOT NULL,
  "input_schema" jsonb,
  "output_schema" jsonb,
  "rate_limits" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "timeout_ms" integer DEFAULT 30000 NOT NULL,
  "failure_modes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "approval_required" boolean DEFAULT false NOT NULL,
  "owner" text,
  "observability_hooks" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_mesh_tools_policy_tier_idx" ON "tool_mesh_tools" ("policy_tier");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_mesh_tools_enabled_idx" ON "tool_mesh_tools" ("enabled");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tool_mesh_tool_versions" (
  "id" serial PRIMARY KEY NOT NULL,
  "tool_db_id" integer NOT NULL,
  "version" text NOT NULL,
  "changelog" text,
  "schema_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "published_by_id" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tool_mesh_tool_versions" ADD CONSTRAINT "tool_mesh_tool_versions_tool_db_id_fkey" FOREIGN KEY ("tool_db_id") REFERENCES "tool_mesh_tools"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tool_mesh_tool_versions" ADD CONSTRAINT "tool_mesh_tool_versions_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_mesh_tool_versions_tool_idx" ON "tool_mesh_tool_versions" ("tool_db_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tool_mesh_tool_versions_tool_version_idx" ON "tool_mesh_tool_versions" ("tool_db_id","version");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tool_mesh_tool_permissions" (
  "id" serial PRIMARY KEY NOT NULL,
  "tool_db_id" integer NOT NULL,
  "subject_type" text NOT NULL,
  "subject_id" text NOT NULL,
  "permission" text DEFAULT 'invoke' NOT NULL,
  "granted_by_id" integer,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tool_mesh_tool_permissions" ADD CONSTRAINT "tool_mesh_tool_permissions_tool_db_id_fkey" FOREIGN KEY ("tool_db_id") REFERENCES "tool_mesh_tools"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tool_mesh_tool_permissions" ADD CONSTRAINT "tool_mesh_tool_permissions_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_mesh_tool_permissions_tool_idx" ON "tool_mesh_tool_permissions" ("tool_db_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_mesh_tool_permissions_subject_idx" ON "tool_mesh_tool_permissions" ("subject_type","subject_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tool_mesh_tool_permissions_unique_idx" ON "tool_mesh_tool_permissions" ("tool_db_id","subject_type","subject_id","permission");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tool_mesh_action_approvals" (
  "id" serial PRIMARY KEY NOT NULL,
  "request_id" text NOT NULL UNIQUE,
  "tool_id" text NOT NULL,
  "action" text NOT NULL,
  "agent_id" text,
  "session_id" text,
  "workflow_id" text,
  "org_id" integer,
  "status" text DEFAULT 'pending' NOT NULL,
  "policy_id" integer,
  "decision_reason" text,
  "requested_by_id" integer,
  "approved_by_id" integer,
  "approved_at" timestamp,
  "rejected_by_id" integer,
  "rejected_at" timestamp,
  "expires_at" timestamp,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tool_mesh_action_approvals" ADD CONSTRAINT "tool_mesh_action_approvals_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tool_mesh_action_approvals" ADD CONSTRAINT "tool_mesh_action_approvals_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "guardian_policies"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tool_mesh_action_approvals" ADD CONSTRAINT "tool_mesh_action_approvals_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tool_mesh_action_approvals" ADD CONSTRAINT "tool_mesh_action_approvals_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tool_mesh_action_approvals" ADD CONSTRAINT "tool_mesh_action_approvals_rejected_by_id_fkey" FOREIGN KEY ("rejected_by_id") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_mesh_action_approvals_tool_idx" ON "tool_mesh_action_approvals" ("tool_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_mesh_action_approvals_status_idx" ON "tool_mesh_action_approvals" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_mesh_action_approvals_org_idx" ON "tool_mesh_action_approvals" ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_mesh_action_approvals_agent_idx" ON "tool_mesh_action_approvals" ("agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_mesh_action_approvals_created_idx" ON "tool_mesh_action_approvals" ("created_at");
