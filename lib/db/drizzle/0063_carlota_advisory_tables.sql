-- Migration: Carlota Jo advisory tool tables
-- Tables: carlota_engagements, carlota_diagnostics, carlota_scenarios

CREATE TABLE IF NOT EXISTS "carlota_engagements" (
  "id"                    SERIAL PRIMARY KEY,
  "external_id"           TEXT NOT NULL UNIQUE,
  "organization_id"       INTEGER,
  "client_account_id"     INTEGER,
  "created_by_user_id"    INTEGER,
  "client"                TEXT NOT NULL,
  "engagement"            TEXT NOT NULL,
  "status"                TEXT NOT NULL DEFAULT 'active',
  "fee_type"              TEXT NOT NULL DEFAULT 'fixed',
  "contracted_value"      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  "invoiced"              NUMERIC(12, 2) NOT NULL DEFAULT 0,
  "collected"             NUMERIC(12, 2) NOT NULL DEFAULT 0,
  "cost_to_date"          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  "forecasted_cost"       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  "margin_target"         REAL NOT NULL DEFAULT 0,
  "phase"                 TEXT NOT NULL DEFAULT 'active',
  "rate_realisation_pct"  REAL NOT NULL DEFAULT 100,
  "write_offs"            NUMERIC(12, 2) NOT NULL DEFAULT 0,
  "scope_creep_hours"     INTEGER NOT NULL DEFAULT 0,
  "start_date"            TEXT,
  "end_date"              TEXT,
  "alerts"                JSONB NOT NULL DEFAULT '[]',
  "created_at"            TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "carlota_diagnostics" (
  "id"                 SERIAL PRIMARY KEY,
  "external_id"        TEXT NOT NULL UNIQUE,
  "organization_id"    INTEGER,
  "client_account_id"  INTEGER,
  "created_by_user_id" INTEGER NOT NULL,
  "company_name"       TEXT NOT NULL DEFAULT '',
  "industry"           TEXT NOT NULL DEFAULT '',
  "stage"              TEXT NOT NULL DEFAULT '',
  "report"             JSONB NOT NULL DEFAULT '{}',
  "created_at"         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "carlota_scenarios" (
  "id"                 SERIAL PRIMARY KEY,
  "external_id"        TEXT NOT NULL UNIQUE,
  "organization_id"    INTEGER,
  "client_account_id"  INTEGER,
  "created_by_user_id" INTEGER NOT NULL,
  "label"              TEXT NOT NULL DEFAULT '',
  "details"            TEXT NOT NULL DEFAULT '',
  "context"            TEXT,
  "result"             JSONB NOT NULL DEFAULT '{}',
  "created_at"         TIMESTAMP NOT NULL DEFAULT NOW()
);
