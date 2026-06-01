-- Pipeline Command — shared sales pipeline (org-scoped, with audit log).
-- Replaces per-browser localStorage state in artifacts/szl-holdings/src/pages/pipeline-command.tsx.

CREATE TABLE IF NOT EXISTS "pipeline_deals" (
  "id" serial PRIMARY KEY,
  "org_id" integer NOT NULL,
  "account" text NOT NULL,
  "vertical" text NOT NULL,
  "champion" text NOT NULL DEFAULT '',
  "champion_title" text NOT NULL DEFAULT '',
  "stage" text NOT NULL DEFAULT 'Researched',
  "fit_score" integer NOT NULL DEFAULT 7,
  "next_step" text NOT NULL DEFAULT '',
  "notes" text NOT NULL DEFAULT '',
  "created_by_user_id" integer,
  "updated_by_user_id" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pipeline_deals_org_idx" ON "pipeline_deals" ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pipeline_deals_stage_idx" ON "pipeline_deals" ("stage");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pipeline_deals_updated_idx" ON "pipeline_deals" ("updated_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pipeline_deal_events" (
  "id" serial PRIMARY KEY,
  "deal_id" integer NOT NULL,
  "org_id" integer NOT NULL,
  "account_snapshot" text NOT NULL DEFAULT '',
  "from_stage" text,
  "to_stage" text NOT NULL,
  "actor_user_id" integer,
  "actor_email" text,
  "actor_name" text,
  "note" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pipeline_deal_events_deal_idx" ON "pipeline_deal_events" ("deal_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pipeline_deal_events_org_idx" ON "pipeline_deal_events" ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pipeline_deal_events_created_idx" ON "pipeline_deal_events" ("created_at");
