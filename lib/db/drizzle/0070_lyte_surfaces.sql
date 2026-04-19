CREATE TABLE IF NOT EXISTS "lyte_drift_items" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "program" text NOT NULL,
  "team" text NOT NULL,
  "stale_days" integer NOT NULL,
  "owners" jsonb NOT NULL,
  "evidence" jsonb NOT NULL,
  "status" text NOT NULL,
  "last_activity" text NOT NULL,
  "impact" text NOT NULL,
  "proof_ref" text NOT NULL,
  "order_idx" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lyte_drift_history" (
  "id" serial PRIMARY KEY NOT NULL,
  "date" text NOT NULL,
  "count" integer NOT NULL,
  "order_idx" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lyte_pressure_cells" (
  "id" serial PRIMARY KEY NOT NULL,
  "team" text NOT NULL,
  "workflow" text NOT NULL,
  "account" text NOT NULL,
  "program" text NOT NULL,
  "sponsor" text NOT NULL,
  "open_count" integer NOT NULL,
  "overdue" integer NOT NULL,
  "blocked" integer NOT NULL,
  "escalated" integer NOT NULL,
  "score" integer NOT NULL,
  "order_idx" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lyte_debt_items" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "team" text NOT NULL,
  "owner" text NOT NULL,
  "type" text NOT NULL,
  "score" integer NOT NULL,
  "age_days" integer NOT NULL,
  "escalations" integer NOT NULL,
  "program" text NOT NULL,
  "evidence" jsonb NOT NULL,
  "proof_ref" text NOT NULL,
  "status" text NOT NULL,
  "order_idx" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lyte_debt_score_history" (
  "id" serial PRIMARY KEY NOT NULL,
  "date" text NOT NULL,
  "critical" integer NOT NULL,
  "high" integer NOT NULL,
  "medium" integer NOT NULL,
  "order_idx" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lyte_replay_scenarios" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "decision" text NOT NULL,
  "outcome" text NOT NULL,
  "date_range" text NOT NULL,
  "events" jsonb NOT NULL,
  "order_idx" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lyte_board_metrics" (
  "id" serial PRIMARY KEY NOT NULL,
  "label" text NOT NULL UNIQUE,
  "value" text NOT NULL,
  "delta" text,
  "trend" text NOT NULL,
  "context" text NOT NULL,
  "good" text NOT NULL,
  "order_idx" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lyte_board_risks" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "severity" text NOT NULL,
  "domain" text NOT NULL,
  "signal" text NOT NULL,
  "recommendation" text NOT NULL,
  "proof_ref" text NOT NULL,
  "intervention_owner" text NOT NULL,
  "deadline" text NOT NULL,
  "order_idx" integer DEFAULT 0 NOT NULL
);
