-- Migration: 0008_lyte_dashboards
-- Creates the lyte_dashboards table for Dashboard Builder persistence

CREATE TABLE IF NOT EXISTS "lyte_dashboards" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "widgets" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "template" text,
  "is_shared" boolean NOT NULL DEFAULT false,
  "share_token" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "lyte_dashboards_user_idx" ON "lyte_dashboards"("user_id");
CREATE INDEX IF NOT EXISTS "lyte_dashboards_share_token_idx" ON "lyte_dashboards"("share_token");
