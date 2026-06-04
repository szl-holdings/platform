-- Migration 0042: Schema maintenance pass
-- Task #3171: Add missing DB indexes, expand corridors table,
-- add lyte_priority_items table, and backfill campaign_id column.

--> statement-breakpoint

-- 1. Add org_id to certification_programs for multi-tenant scoping
ALTER TABLE "certification_programs"
  ADD COLUMN IF NOT EXISTS "org_id" integer REFERENCES "organizations"("id") ON DELETE SET NULL;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cert_programs_org_idx" ON "certification_programs" ("org_id");

--> statement-breakpoint

-- 2. Add missing status index on certification_status.overall_status
CREATE INDEX IF NOT EXISTS "cert_status_overall_status_idx" ON "certification_status" ("overall_status");

--> statement-breakpoint

-- 3. Expand the corridors table with operational columns
ALTER TABLE "corridors"
  ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'operational';

--> statement-breakpoint
ALTER TABLE "corridors"
  ADD COLUMN IF NOT EXISTS "controlled_by_nation" text;

--> statement-breakpoint
ALTER TABLE "corridors"
  ADD COLUMN IF NOT EXISTS "sanctioned_territory" integer NOT NULL DEFAULT 0;

--> statement-breakpoint
ALTER TABLE "corridors"
  ADD COLUMN IF NOT EXISTS "alternative_route_ids" jsonb DEFAULT '[]'::jsonb;

--> statement-breakpoint
ALTER TABLE "corridors"
  ADD COLUMN IF NOT EXISTS "insurance_premium_modifier" numeric(5, 4) DEFAULT '1.0000';

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corridors_status_idx" ON "corridors" ("status");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corridors_risk_level_idx" ON "corridors" ("risk_level");

--> statement-breakpoint

-- 4. Create lyte_priority_items table with campaign_id (new table path)
CREATE TABLE IF NOT EXISTS "lyte_priority_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "workspace_id" integer REFERENCES "lyte_workspaces"("id") ON DELETE CASCADE,
  "campaign_id" integer,
  "title" text NOT NULL,
  "description" text,
  "priority" text NOT NULL DEFAULT 'medium',
  "status" text NOT NULL DEFAULT 'open',
  "owner" text,
  "due_at" timestamp,
  "resolved_at" timestamp,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

--> statement-breakpoint

-- Backfill path: add campaign_id if table already existed without the column
ALTER TABLE "lyte_priority_items"
  ADD COLUMN IF NOT EXISTS "campaign_id" integer;

--> statement-breakpoint

-- Backfill strategy: campaign_id = NULL is the deterministic sentinel for unassociated items.
-- Priority items exist independently of campaigns; NULL means "no campaign" (not missing data).
-- Explicitly anchor the default so any future ALTER ADD on other envs carries the same intent.
ALTER TABLE "lyte_priority_items"
  ALTER COLUMN "campaign_id" SET DEFAULT NULL;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lyte_priority_items_workspace_idx" ON "lyte_priority_items" ("workspace_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lyte_priority_items_campaign_idx" ON "lyte_priority_items" ("campaign_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lyte_priority_items_status_idx" ON "lyte_priority_items" ("status");
