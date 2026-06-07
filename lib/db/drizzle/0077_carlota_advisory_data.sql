-- Migration: Carlota Jo per-client advisory data tables (Task #2067)
-- Tables: per-client margin history, ROI benchmarks, ROI trend, radar signals,
--         competitor rankings, market trend.

CREATE TABLE IF NOT EXISTS "carlota_advisory_clients" (
  "id"          SERIAL PRIMARY KEY,
  "external_id" TEXT NOT NULL UNIQUE,
  "name"        TEXT NOT NULL,
  "industry"    TEXT NOT NULL DEFAULT '',
  "sort_order"  INTEGER NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "carlota_client_margin_history" (
  "id"                 SERIAL PRIMARY KEY,
  "client_external_id" TEXT NOT NULL,
  "month"              TEXT NOT NULL,
  "margin"             REAL NOT NULL DEFAULT 0,
  "sort_order"         INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "carlota_client_margin_history_client_idx"
  ON "carlota_client_margin_history" ("client_external_id");

CREATE TABLE IF NOT EXISTS "carlota_client_roi_benchmarks" (
  "id"                       SERIAL PRIMARY KEY,
  "client_external_id"       TEXT NOT NULL UNIQUE,
  "avg_roi"                  INTEGER NOT NULL DEFAULT 0,
  "avg_payback_months"       INTEGER NOT NULL DEFAULT 0,
  "avg_rate_realisation_pct" INTEGER NOT NULL DEFAULT 100,
  "blended_margin_pct"       INTEGER NOT NULL DEFAULT 0,
  "client_retention_pct"     INTEGER NOT NULL DEFAULT 0,
  "nps_score"                INTEGER NOT NULL DEFAULT 0,
  "updated_at"               TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "carlota_client_roi_trend" (
  "id"                 SERIAL PRIMARY KEY,
  "client_external_id" TEXT NOT NULL,
  "month"              TEXT NOT NULL,
  "avg_roi"            INTEGER NOT NULL DEFAULT 0,
  "sort_order"         INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "carlota_client_roi_trend_client_idx"
  ON "carlota_client_roi_trend" ("client_external_id");

CREATE TABLE IF NOT EXISTS "carlota_client_radar_signals" (
  "id"                 SERIAL PRIMARY KEY,
  "client_external_id" TEXT NOT NULL,
  "competitor"         TEXT NOT NULL,
  "event"              TEXT NOT NULL,
  "impact"             TEXT NOT NULL DEFAULT 'medium',
  "direction"          TEXT NOT NULL DEFAULT 'neutral',
  "signal_date"        TEXT NOT NULL DEFAULT '',
  "detail"             TEXT NOT NULL DEFAULT '',
  "sort_order"         INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "carlota_client_radar_signals_client_idx"
  ON "carlota_client_radar_signals" ("client_external_id");

CREATE TABLE IF NOT EXISTS "carlota_client_competitors" (
  "id"                 SERIAL PRIMARY KEY,
  "client_external_id" TEXT NOT NULL,
  "name"               TEXT NOT NULL,
  "score"              INTEGER NOT NULL DEFAULT 50,
  "trend"              TEXT NOT NULL DEFAULT 'flat',
  "share"              INTEGER NOT NULL DEFAULT 0,
  "sort_order"         INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "carlota_client_competitors_client_idx"
  ON "carlota_client_competitors" ("client_external_id");

CREATE TABLE IF NOT EXISTS "carlota_client_market_trend" (
  "id"                 SERIAL PRIMARY KEY,
  "client_external_id" TEXT NOT NULL,
  "month"              TEXT NOT NULL,
  "you"                INTEGER NOT NULL DEFAULT 0,
  "market"             INTEGER NOT NULL DEFAULT 0,
  "sort_order"         INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "carlota_client_market_trend_client_idx"
  ON "carlota_client_market_trend" ("client_external_id");
