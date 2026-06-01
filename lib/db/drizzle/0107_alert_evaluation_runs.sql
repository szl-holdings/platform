CREATE TABLE IF NOT EXISTS "alert_evaluation_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"evaluated_at" timestamp DEFAULT now() NOT NULL,
	"rules_checked" integer DEFAULT 0 NOT NULL,
	"rules_fired" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"errors" text,
	"metrics" jsonb,
	"triggered_by" text DEFAULT 'scheduled' NOT NULL
);
