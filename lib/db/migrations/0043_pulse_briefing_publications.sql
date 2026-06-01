CREATE TABLE IF NOT EXISTS "pulse_briefing_publications" (
	"id" serial PRIMARY KEY NOT NULL,
	"publication_id" text NOT NULL,
	"briefing_id" text NOT NULL,
	"org_id" integer NOT NULL,
	"publisher_user_id" integer NOT NULL,
	"audience_type" text DEFAULT 'all' NOT NULL,
	"audience_roles" jsonb DEFAULT '[]'::jsonb,
	"channels" jsonb NOT NULL DEFAULT '["in_app","push"]'::jsonb,
	"headline_override" text,
	"message_override" text,
	"status" text DEFAULT 'publishing' NOT NULL,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"in_app_delivered" integer DEFAULT 0 NOT NULL,
	"push_sent" integer DEFAULT 0 NOT NULL,
	"push_failed" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pulse_briefing_publications_publication_id_unique" UNIQUE("publication_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pulse_briefing_pubs_org_briefing_idx" ON "pulse_briefing_publications" USING btree ("org_id","briefing_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pulse_briefing_pubs_org_created_idx" ON "pulse_briefing_publications" USING btree ("org_id","created_at" DESC);
