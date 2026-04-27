-- Migration: Add carlota_radar_competitors for per-account Competitive Radar
-- persistence (Task #2064).
--
-- Backs lib/db/src/schema/carlota_jo.ts → carlotaRadarCompetitorsTable and
-- the GET/PUT /carlota/radar-competitors endpoints in
-- artifacts/api-server/src/routes/carlota-jo.ts. Replaces the previous
-- localStorage-only persistence on artifacts/carlota-jo so the tracked
-- competitor list survives across devices/browsers and is shared per
-- organization (or per user, for users without an org).
--
-- Scoping rules (matched in carlota-jo.ts → radarCompetitorScopeFilter):
--   * organization_id IS NOT NULL → row belongs to an organization (shared
--     across all users in that org)
--   * organization_id IS NULL     → row belongs to a single user (fallback
--     for users without an org)
--   * client_id partitions the list per Carlota advisory client view
--     (NULL = whole-portfolio view)
--
-- Partial unique indexes enforce one row per scope+client combination so
-- repeated PUTs always overwrite the same row (avoids duplicate-row drift).

CREATE TABLE IF NOT EXISTS "carlota_radar_competitors" (
  "id"              serial PRIMARY KEY,
  "organization_id" integer,
  "user_id"         integer,
  "client_id"       text,
  "competitors"     jsonb     NOT NULL DEFAULT '[]'::jsonb,
  "created_at"      timestamp NOT NULL DEFAULT NOW(),
  "updated_at"      timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "carlota_radar_competitors_scope_idx"
  ON "carlota_radar_competitors" ("organization_id", "user_id", "client_id");

CREATE UNIQUE INDEX IF NOT EXISTS "carlota_radar_competitors_org_scope_uidx"
  ON "carlota_radar_competitors" ("organization_id", (COALESCE("client_id", '')))
  WHERE "organization_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "carlota_radar_competitors_user_scope_uidx"
  ON "carlota_radar_competitors" ("user_id", (COALESCE("client_id", '')))
  WHERE "organization_id" IS NULL AND "user_id" IS NOT NULL;
