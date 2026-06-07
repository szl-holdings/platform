CREATE TABLE IF NOT EXISTS "team_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"team" text NOT NULL,
	"actor_id" integer,
	"recipient_id" integer,
	"urgency" text DEFAULT 'warning' NOT NULL,
	"message" text,
	"in_app_delivered" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_pages" ADD CONSTRAINT "team_pages_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_pages" ADD CONSTRAINT "team_pages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_pages_team_created_at_idx" ON "team_pages" ("team","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_pages_created_at_idx" ON "team_pages" ("created_at");
