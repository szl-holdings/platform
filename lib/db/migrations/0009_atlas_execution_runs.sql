-- Migration: ATLAS execution run persistence
-- Tables: atlas_signals, atlas_evidence, atlas_outcomes, atlas_runs

CREATE TABLE IF NOT EXISTS "atlas_signals" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "domain"       TEXT NOT NULL,
  "signal_type"  TEXT NOT NULL,
  "severity"     TEXT NOT NULL CHECK (severity IN ('info','low','medium','high','critical')),
  "title"        TEXT NOT NULL,
  "description"  TEXT NOT NULL,
  "confidence"   REAL NOT NULL DEFAULT 0.5,
  "source"       TEXT NOT NULL,
  "payload"      JSONB NOT NULL DEFAULT '{}',
  "status"       TEXT NOT NULL DEFAULT 'raw' CHECK (status IN ('raw','normalized','processed','acknowledged','resolved')),
  "tenant_id"    TEXT NOT NULL DEFAULT 'default',
  "workflow_id"  TEXT,
  "created_at"   TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "atlas_signals_domain_idx"     ON "atlas_signals" ("domain");
CREATE INDEX IF NOT EXISTS "atlas_signals_tenant_idx"     ON "atlas_signals" ("tenant_id");
CREATE INDEX IF NOT EXISTS "atlas_signals_workflow_idx"   ON "atlas_signals" ("workflow_id");
CREATE INDEX IF NOT EXISTS "atlas_signals_created_at_idx" ON "atlas_signals" ("created_at" DESC);

CREATE TABLE IF NOT EXISTS "atlas_evidence" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "domain"       TEXT NOT NULL,
  "workflow_id"  TEXT NOT NULL,
  "label"        TEXT NOT NULL,
  "value"        TEXT NOT NULL,
  "source"       TEXT NOT NULL,
  "captured_by"  TEXT NOT NULL,
  "immutable"    BOOLEAN NOT NULL DEFAULT FALSE,
  "captured_at"  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "atlas_evidence_domain_workflow_idx" ON "atlas_evidence" ("domain", "workflow_id");

CREATE TABLE IF NOT EXISTS "atlas_outcomes" (
  "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "domain"                TEXT NOT NULL,
  "workflow_id"           TEXT NOT NULL,
  "signal_id"             TEXT,
  "recommendation_id"     TEXT,
  "title"                 TEXT NOT NULL,
  "summary"               TEXT NOT NULL,
  "status"                TEXT NOT NULL CHECK (status IN ('success','partial','failed','rolled_back')),
  "financial_impact_usd"  REAL,
  "operational_severity"  TEXT,
  "entities_affected"     INTEGER,
  "recorded_by"           TEXT NOT NULL,
  "evidence"              JSONB NOT NULL DEFAULT '[]',
  "metadata"              JSONB DEFAULT '{}',
  "recorded_at"           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "atlas_outcomes_domain_idx"    ON "atlas_outcomes" ("domain");
CREATE INDEX IF NOT EXISTS "atlas_outcomes_workflow_idx"  ON "atlas_outcomes" ("workflow_id");
CREATE INDEX IF NOT EXISTS "atlas_outcomes_recorded_idx"  ON "atlas_outcomes" ("recorded_at" DESC);

CREATE TABLE IF NOT EXISTS "atlas_runs" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "domain"            TEXT NOT NULL,
  "workflow_id"       TEXT NOT NULL UNIQUE,
  "workflow_name"     TEXT NOT NULL,
  "trigger_signal_id" TEXT,
  "replayable"        BOOLEAN NOT NULL DEFAULT TRUE,
  "signal_snapshot"   JSONB NOT NULL DEFAULT '[]',
  "run_snapshot"      JSONB NOT NULL DEFAULT '{}',
  "latency_ms"        INTEGER,
  "steps_completed"   INTEGER,
  "steps_failed"      INTEGER,
  "policy_checks"     INTEGER,
  "policies_blocked"  INTEGER,
  "evidence_count"    INTEGER,
  "snapshot_at"       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "atlas_runs_domain_idx"      ON "atlas_runs" ("domain");
CREATE INDEX IF NOT EXISTS "atlas_runs_snapshot_idx"    ON "atlas_runs" ("snapshot_at" DESC);
