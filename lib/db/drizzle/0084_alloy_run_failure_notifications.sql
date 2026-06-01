CREATE TABLE IF NOT EXISTS "alloy_run_failure_notifications" (
"id" serial PRIMARY KEY NOT NULL,
"run_id" integer NOT NULL,
"user_id" integer NOT NULL,
"kind" text NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "alloy_run_failure_notifications_dedup"
  ON "alloy_run_failure_notifications" ("run_id", "user_id", "kind");
