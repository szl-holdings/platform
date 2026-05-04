CREATE TABLE IF NOT EXISTS "doctrine_system_cards" (
  "id" serial PRIMARY KEY NOT NULL,
  "card_id" text NOT NULL,
  "agent_id" text NOT NULL,
  "version" text NOT NULL,
  "ratified_at" timestamp NOT NULL,
  "ratified_by" text NOT NULL,
  "constitution_summary" jsonb DEFAULT '{}' NOT NULL,
  "eval_scores" jsonb DEFAULT '{}' NOT NULL,
  "welfare_summary" jsonb DEFAULT '{}' NOT NULL,
  "alignment_decision" text NOT NULL,
  "red_team_pass_rate" numeric(5, 3) DEFAULT '0' NOT NULL,
  "covenant_lift_usd" numeric(12, 2) DEFAULT '0' NOT NULL,
  "known_limitations" jsonb DEFAULT '[]' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_sc_agent_idx" ON "doctrine_system_cards" ("agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_sc_version_idx" ON "doctrine_system_cards" ("version");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doctrine_sc_card_idx" ON "doctrine_system_cards" ("card_id");
