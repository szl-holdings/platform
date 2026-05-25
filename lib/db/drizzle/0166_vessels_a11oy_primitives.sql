-- Vessels A11oy primitive backend (Task #5318).
-- Real persisted tables mapped to the A11oy primitive model:
--   fleet            = Anatomy
--   vessel position  = Substance state-log
--   route            = Connection (with null-space-projected RF coexistence)
--   port-call / risk = Transformation
-- Idempotent: every statement uses IF NOT EXISTS guards.

CREATE TABLE IF NOT EXISTS "vessels_a11oy_fleet" (
  "id"            SERIAL PRIMARY KEY,
  "org_id"        INTEGER REFERENCES "organizations"("id") ON DELETE CASCADE,
  "fleet_ref"     TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "operator"      TEXT,
  "vessel_count"  INTEGER NOT NULL DEFAULT 0,
  "anatomy_seal"  TEXT,
  "metadata"      JSONB,
  "created_at"    TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "vessels_a11oy_fleet_org_ref_idx"
  ON "vessels_a11oy_fleet" ("org_id", "fleet_ref");

CREATE TABLE IF NOT EXISTS "vessels_a11oy_position_log" (
  "id"           BIGSERIAL PRIMARY KEY,
  "org_id"       INTEGER REFERENCES "organizations"("id") ON DELETE CASCADE,
  "fleet_ref"    TEXT NOT NULL,
  "vessel_imo"   TEXT NOT NULL,
  "latitude"     DOUBLE PRECISION NOT NULL,
  "longitude"    DOUBLE PRECISION NOT NULL,
  "speed_knots"  DOUBLE PRECISION,
  "heading_deg"  DOUBLE PRECISION,
  "source"       TEXT NOT NULL DEFAULT 'ais',
  "recorded_at"  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "vessels_a11oy_position_log_vessel_idx"
  ON "vessels_a11oy_position_log" ("vessel_imo", "recorded_at" DESC);
CREATE INDEX IF NOT EXISTS "vessels_a11oy_position_log_fleet_idx"
  ON "vessels_a11oy_position_log" ("fleet_ref", "recorded_at" DESC);

CREATE TABLE IF NOT EXISTS "vessels_a11oy_risk_snapshot" (
  "id"                  SERIAL PRIMARY KEY,
  "org_id"              INTEGER REFERENCES "organizations"("id") ON DELETE CASCADE,
  "fleet_ref"           TEXT NOT NULL,
  "vessel_imo"          TEXT,
  "perturbation_bound"  DOUBLE PRECISION NOT NULL,
  "severity"            TEXT NOT NULL DEFAULT 'normal'
    CHECK (severity IN ('normal','watch','elevated','critical')),
  "factors"             JSONB,
  "receipt_hash"        TEXT,
  "computed_at"         TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "vessels_a11oy_risk_fleet_idx"
  ON "vessels_a11oy_risk_snapshot" ("fleet_ref", "computed_at" DESC);
CREATE INDEX IF NOT EXISTS "vessels_a11oy_risk_org_idx"
  ON "vessels_a11oy_risk_snapshot" ("org_id");

CREATE TABLE IF NOT EXISTS "vessels_a11oy_route" (
  "id"                        SERIAL PRIMARY KEY,
  "org_id"                    INTEGER REFERENCES "organizations"("id") ON DELETE CASCADE,
  "fleet_ref"                 TEXT NOT NULL,
  "vessel_imo"                TEXT NOT NULL,
  "origin_port"               TEXT NOT NULL,
  "destination_port"          TEXT NOT NULL,
  "waypoints"                 JSONB NOT NULL DEFAULT '[]'::jsonb,
  "rf_coexistence_vector"     JSONB,
  "anatomy_boundary_ok"       BOOLEAN NOT NULL DEFAULT TRUE,
  "anatomy_boundary_notes"    TEXT,
  "receipt_hash"              TEXT,
  "created_at"                TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "vessels_a11oy_route_fleet_idx"
  ON "vessels_a11oy_route" ("fleet_ref", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "vessels_a11oy_route_vessel_idx"
  ON "vessels_a11oy_route" ("vessel_imo", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "vessels_a11oy_coexistence_report" (
  "id"                      SERIAL PRIMARY KEY,
  "org_id"                  INTEGER REFERENCES "organizations"("id") ON DELETE CASCADE,
  "fleet_ref"               TEXT NOT NULL,
  "route_id"                INTEGER REFERENCES "vessels_a11oy_route"("id") ON DELETE CASCADE,
  "rf_bands"                JSONB NOT NULL,
  "null_space_projection"   JSONB NOT NULL,
  "interference_score"      DOUBLE PRECISION NOT NULL,
  "receipt_hash"            TEXT,
  "computed_at"             TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "vessels_a11oy_coexistence_fleet_idx"
  ON "vessels_a11oy_coexistence_report" ("fleet_ref", "computed_at" DESC);
