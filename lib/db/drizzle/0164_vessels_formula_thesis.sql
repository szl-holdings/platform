-- Vessels — Formula Thesis tables.
-- Migration 0164: persisted Λ-receipt-backed compute surfaces for vessels.
-- Idempotent: all statements use IF NOT EXISTS / IF EXISTS guards.

CREATE TABLE IF NOT EXISTS "vessels_risk_history" (
  "id"                 SERIAL PRIMARY KEY,
  "vessel_id"          INTEGER NOT NULL REFERENCES "vessels"("id") ON DELETE CASCADE,
  "org_id"             INTEGER REFERENCES "organizations"("id") ON DELETE CASCADE,
  "lambda_score"       DOUBLE PRECISION NOT NULL,
  "severity"           DOUBLE PRECISION NOT NULL,
  "likelihood"         DOUBLE PRECISION NOT NULL,
  "value_at_risk_usd"  DOUBLE PRECISION NOT NULL,
  "cap_usd"            DOUBLE PRECISION NOT NULL DEFAULT 1000000,
  "drift_score"        DOUBLE PRECISION,
  "factors"            JSONB,
  "formula_version"    TEXT NOT NULL DEFAULT 'lambda-v10',
  "receipt_hash"       TEXT,
  "computed_at"        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "vessels_risk_history_vessel_idx"   ON "vessels_risk_history" ("vessel_id");
CREATE INDEX IF NOT EXISTS "vessels_risk_history_org_idx"      ON "vessels_risk_history" ("org_id");
CREATE INDEX IF NOT EXISTS "vessels_risk_history_computed_idx" ON "vessels_risk_history" ("computed_at");

CREATE TABLE IF NOT EXISTS "vessels_anomaly_detections" (
  "id"                  SERIAL PRIMARY KEY,
  "vessel_id"           INTEGER NOT NULL REFERENCES "vessels"("id") ON DELETE CASCADE,
  "org_id"              INTEGER REFERENCES "organizations"("id") ON DELETE CASCADE,
  "detection_ref"       TEXT NOT NULL,
  "anomaly_type"        TEXT NOT NULL CHECK (
    anomaly_type IN ('ais_blackout','route_deviation','speed_spike','unexpected_port','sts_transfer','dark_loiter','cargo_mismatch')
  ),
  "severity"            TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  "anomaly_score"       DOUBLE PRECISION NOT NULL,
  "confidence"          DOUBLE PRECISION NOT NULL DEFAULT 0.8,
  "summary"             TEXT NOT NULL,
  "evidence"            JSONB,
  "location"            JSONB,
  "status"              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved','dismissed')),
  "a11oy_handoff_id"    TEXT,
  "receipt_hash"        TEXT,
  "detected_at"         TIMESTAMP NOT NULL DEFAULT NOW(),
  "resolved_at"         TIMESTAMP,
  "created_at"          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "vessels_anomaly_detections_ref_unique" ON "vessels_anomaly_detections" ("detection_ref");
CREATE INDEX IF NOT EXISTS "vessels_anomaly_detections_vessel_idx"        ON "vessels_anomaly_detections" ("vessel_id");
CREATE INDEX IF NOT EXISTS "vessels_anomaly_detections_org_idx"           ON "vessels_anomaly_detections" ("org_id");
CREATE INDEX IF NOT EXISTS "vessels_anomaly_detections_detected_idx"      ON "vessels_anomaly_detections" ("detected_at");
CREATE INDEX IF NOT EXISTS "vessels_anomaly_detections_severity_idx"      ON "vessels_anomaly_detections" ("severity");

CREATE TABLE IF NOT EXISTS "vessels_voyage_calculations" (
  "id"                    SERIAL PRIMARY KEY,
  "org_id"                INTEGER REFERENCES "organizations"("id") ON DELETE CASCADE,
  "calculation_ref"       TEXT NOT NULL,
  "vessel_class_id"       TEXT NOT NULL,
  "route_id"              TEXT NOT NULL,
  "charter_type"          TEXT NOT NULL DEFAULT 'time_charter' CHECK (charter_type IN ('time_charter','spot')),
  "cargo_quantity_mt"     DOUBLE PRECISION,
  "total_revenue_usd"     DOUBLE PRECISION NOT NULL,
  "total_costs_usd"       DOUBLE PRECISION NOT NULL,
  "gross_profit_usd"      DOUBLE PRECISION NOT NULL,
  "gross_margin_pct"      DOUBLE PRECISION NOT NULL,
  "tce_rate_usd"          DOUBLE PRECISION NOT NULL,
  "break_even_freight_usd" DOUBLE PRECISION,
  "voyage_days"           DOUBLE PRECISION NOT NULL,
  "monte_carlo_p10"       DOUBLE PRECISION,
  "monte_carlo_p50"       DOUBLE PRECISION,
  "monte_carlo_p90"       DOUBLE PRECISION,
  "estimate"              JSONB NOT NULL,
  "receipt_hash"          TEXT,
  "computed_at"           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "vessels_voyage_calculations_ref_unique" ON "vessels_voyage_calculations" ("calculation_ref");
CREATE INDEX IF NOT EXISTS "vessels_voyage_calculations_org_idx"           ON "vessels_voyage_calculations" ("org_id");
CREATE INDEX IF NOT EXISTS "vessels_voyage_calculations_route_idx"         ON "vessels_voyage_calculations" ("route_id");
CREATE INDEX IF NOT EXISTS "vessels_voyage_calculations_computed_idx"      ON "vessels_voyage_calculations" ("computed_at");

CREATE TABLE IF NOT EXISTS "vessels_bunker_stations" (
  "id"                  SERIAL PRIMARY KEY,
  "station_code"        TEXT NOT NULL,
  "port"                TEXT NOT NULL,
  "country"             TEXT NOT NULL,
  "region"              TEXT NOT NULL,
  "lat"                 DOUBLE PRECISION NOT NULL,
  "lon"                 DOUBLE PRECISION NOT NULL,
  "vlsfo_usd_per_mt"    DOUBLE PRECISION,
  "hfo_usd_per_mt"      DOUBLE PRECISION,
  "mgo_usd_per_mt"      DOUBLE PRECISION,
  "lng_usd_per_mmbtu"   DOUBLE PRECISION,
  "biofuel_available"   BOOLEAN NOT NULL DEFAULT FALSE,
  "avg_wait_hours"      DOUBLE PRECISION NOT NULL DEFAULT 6,
  "quality_score"       DOUBLE PRECISION NOT NULL DEFAULT 0.85,
  "price_as_of"         TIMESTAMP NOT NULL DEFAULT NOW(),
  "created_at"          TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "vessels_bunker_stations_code_unique" ON "vessels_bunker_stations" ("station_code");
CREATE INDEX IF NOT EXISTS "vessels_bunker_stations_port_idx"           ON "vessels_bunker_stations" ("port");
CREATE INDEX IF NOT EXISTS "vessels_bunker_stations_region_idx"         ON "vessels_bunker_stations" ("region");
