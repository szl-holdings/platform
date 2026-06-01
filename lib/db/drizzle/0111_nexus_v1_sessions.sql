-- NEXUS Unified Intelligence Protocol v1 — Sessions table
-- Tracks cross-domain conversation context for multi-turn investigations.
-- Task #3574

CREATE TABLE IF NOT EXISTS "nexus_v1_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "org_id" integer,
  "user_id" integer,
  "domains_touched" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "context_summary" text DEFAULT '' NOT NULL,
  "decision_graph" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "turn_count" integer DEFAULT 0 NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp
);

CREATE INDEX IF NOT EXISTS "nexus_v1_sessions_org_idx" ON "nexus_v1_sessions" ("org_id");
CREATE INDEX IF NOT EXISTS "nexus_v1_sessions_user_idx" ON "nexus_v1_sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "nexus_v1_sessions_updated_idx" ON "nexus_v1_sessions" ("updated_at");
CREATE INDEX IF NOT EXISTS "nexus_v1_sessions_expires_idx" ON "nexus_v1_sessions" ("expires_at");
