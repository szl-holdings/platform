-- Crisis Arena: crowdsourced business crisis simulation platform
-- engagements, submissions, architect_profiles, reputation_events, triage_events

CREATE TABLE IF NOT EXISTS "crisis_arena_engagements" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "owner_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "scoped_assets" jsonb NOT NULL DEFAULT '[]',
  "scoped_domains" jsonb NOT NULL DEFAULT '[]',
  "archetype_filter" jsonb NOT NULL DEFAULT '[]',
  "payout_pool" integer NOT NULL DEFAULT 0,
  "deadline" timestamp NOT NULL,
  "status" text NOT NULL DEFAULT 'open',
  "submission_count" integer NOT NULL DEFAULT 0,
  "accepted_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "crisis_arena_eng_tenant_idx" ON "crisis_arena_engagements" ("tenant_id");
CREATE INDEX IF NOT EXISTS "crisis_arena_eng_owner_idx" ON "crisis_arena_engagements" ("owner_id");
CREATE INDEX IF NOT EXISTS "crisis_arena_eng_status_idx" ON "crisis_arena_engagements" ("status");

CREATE TABLE IF NOT EXISTS "crisis_arena_submissions" (
  "id" text PRIMARY KEY NOT NULL,
  "engagement_id" text NOT NULL REFERENCES "crisis_arena_engagements"("id") ON DELETE CASCADE,
  "architect_id" text NOT NULL,
  "title" text NOT NULL,
  "narrative" text NOT NULL,
  "archetype" text NOT NULL,
  "business_impact_score" integer NOT NULL DEFAULT 0,
  "status" text NOT NULL DEFAULT 'pending',
  "reputation_awarded" integer NOT NULL DEFAULT 0,
  "payout_awarded" integer NOT NULL DEFAULT 0,
  "triage_justification" text,
  "graduated_incident_id" text,
  "impact_estimate" jsonb NOT NULL DEFAULT '{}',
  "kill_chain" jsonb NOT NULL DEFAULT '[]',
  "submitted_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "crisis_arena_sub_eng_idx" ON "crisis_arena_submissions" ("engagement_id");
CREATE INDEX IF NOT EXISTS "crisis_arena_sub_architect_idx" ON "crisis_arena_submissions" ("architect_id");
CREATE INDEX IF NOT EXISTS "crisis_arena_sub_status_idx" ON "crisis_arena_submissions" ("status");

CREATE TABLE IF NOT EXISTS "crisis_arena_architect_profiles" (
  "id" text PRIMARY KEY NOT NULL,
  "handle" text NOT NULL UNIQUE,
  "display_name" text NOT NULL,
  "bio" text,
  "reputation_score" integer NOT NULL DEFAULT 0,
  "accepted_count" integer NOT NULL DEFAULT 0,
  "submission_count" integer NOT NULL DEFAULT 0,
  "total_impact_usd" integer NOT NULL DEFAULT 0,
  "badges" jsonb NOT NULL DEFAULT '[]',
  "archetype_stats" jsonb NOT NULL DEFAULT '[]',
  "top_scenario_titles" jsonb NOT NULL DEFAULT '[]',
  "is_public" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "crisis_arena_profile_handle_idx" ON "crisis_arena_architect_profiles" ("handle");
CREATE INDEX IF NOT EXISTS "crisis_arena_profile_rep_idx" ON "crisis_arena_architect_profiles" ("reputation_score");

CREATE TABLE IF NOT EXISTS "crisis_arena_reputation_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "architect_id" text NOT NULL,
  "delta" integer NOT NULL,
  "reason" text NOT NULL,
  "submission_id" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "crisis_arena_rep_architect_idx" ON "crisis_arena_reputation_events" ("architect_id");
CREATE INDEX IF NOT EXISTS "crisis_arena_rep_created_idx" ON "crisis_arena_reputation_events" ("created_at");

CREATE TABLE IF NOT EXISTS "crisis_arena_triage_events" (
  "id" text PRIMARY KEY NOT NULL,
  "submission_id" text NOT NULL,
  "engagement_id" text NOT NULL,
  "action" text NOT NULL,
  "actor" text NOT NULL,
  "justification" text NOT NULL,
  "payout_amount" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "crisis_arena_triage_sub_idx" ON "crisis_arena_triage_events" ("submission_id");
CREATE INDEX IF NOT EXISTS "crisis_arena_triage_eng_idx" ON "crisis_arena_triage_events" ("engagement_id");
