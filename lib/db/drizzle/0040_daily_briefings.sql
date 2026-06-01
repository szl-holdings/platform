-- Migration: Daily Briefings
-- Server-generated daily intelligence summaries produced by the CORTEX Fusion engine.
-- Each row is one briefing keyed by (orgId, briefingDate).
-- The signals JSONB column stores aggregated cross-domain intelligence signals.

CREATE TABLE IF NOT EXISTS "daily_briefings" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer,
	"briefing_date" text NOT NULL,
	"headline" text NOT NULL,
	"executive_summary" text NOT NULL,
	"signals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"domain_scores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"total_alerts" integer DEFAULT 0 NOT NULL,
	"critical_count" integer DEFAULT 0 NOT NULL,
	"high_count" integer DEFAULT 0 NOT NULL,
	"overall_health" text DEFAULT 'nominal' NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_briefings" ADD CONSTRAINT "daily_briefings_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_briefings_org_date_idx" ON "daily_briefings" USING btree ("org_id","briefing_date");
CREATE INDEX IF NOT EXISTS "daily_briefings_date_idx" ON "daily_briefings" USING btree ("briefing_date");
CREATE INDEX IF NOT EXISTS "daily_briefings_generated_at_idx" ON "daily_briefings" USING btree ("generated_at");
