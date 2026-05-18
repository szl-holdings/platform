-- Sentra — Detector Framework tables (#5186).
-- Migration 0165: persisted detector / detector-run / finding tables consumed
-- by artifacts/api-server/src/routes/sentra-detector-framework.ts. The schema
-- mirrors lib/db/src/schema/sentra_detectors.ts.
-- Idempotent: all statements use IF NOT EXISTS / IF EXISTS guards.

CREATE TABLE IF NOT EXISTS "sentra_detectors" (
  "id"                  TEXT PRIMARY KEY,
  "label"               TEXT NOT NULL,
  "description"         TEXT NOT NULL,
  "kind"                TEXT NOT NULL,
  "runtime"             TEXT NOT NULL,
  "inputs"              JSONB NOT NULL DEFAULT '[]'::jsonb,
  "cost_class"          TEXT NOT NULL,
  "governance_class"    TEXT NOT NULL,
  "attack_techniques"   JSONB,
  "version"             TEXT,
  "sidecar_base_url"    TEXT,
  "chain_receipt_id"    TEXT,
  "enabled"             TEXT NOT NULL DEFAULT 'true',
  "registered_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "last_seen_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "sentra_detectors_runtime_idx"
  ON "sentra_detectors" ("runtime");

CREATE TABLE IF NOT EXISTS "sentra_detector_runs" (
  "id"               TEXT PRIMARY KEY,
  "detector_id"      TEXT NOT NULL,
  "started_at"       TIMESTAMPTZ NOT NULL,
  "finished_at"      TIMESTAMPTZ NOT NULL,
  "duration_ms"      INTEGER NOT NULL,
  "status"           TEXT NOT NULL,
  "triggered_by"     TEXT NOT NULL,
  "findings_count"   INTEGER NOT NULL DEFAULT 0,
  "chain_receipt_id" TEXT,
  "error_message"    TEXT,
  "trace"            JSONB NOT NULL DEFAULT '[]'::jsonb,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "sentra_detector_runs_detector_idx"
  ON "sentra_detector_runs" ("detector_id");
CREATE INDEX IF NOT EXISTS "sentra_detector_runs_started_idx"
  ON "sentra_detector_runs" ("started_at");

CREATE TABLE IF NOT EXISTS "sentra_findings" (
  "id"                  TEXT PRIMARY KEY,
  "detector_id"         TEXT NOT NULL,
  "run_id"              TEXT NOT NULL,
  "severity"            TEXT NOT NULL,
  "score_bps"           INTEGER NOT NULL,
  "title"               TEXT NOT NULL,
  "summary"             TEXT NOT NULL,
  "attack_techniques"   JSONB,
  "affected_assets"     JSONB NOT NULL DEFAULT '[]'::jsonb,
  "evidence"            JSONB NOT NULL DEFAULT '{}'::jsonb,
  "recommended_action"  JSONB,
  "governance_class"    TEXT NOT NULL,
  "status"              TEXT NOT NULL DEFAULT 'open',
  "chain_receipt_id"    TEXT,
  "emitted_at"          TIMESTAMPTZ NOT NULL,
  "resolved_at"         TIMESTAMPTZ,
  "resolved_by"         TEXT,
  "resolution_note"     TEXT,
  "created_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "sentra_findings_detector_idx"
  ON "sentra_findings" ("detector_id");
CREATE INDEX IF NOT EXISTS "sentra_findings_run_idx"
  ON "sentra_findings" ("run_id");
CREATE INDEX IF NOT EXISTS "sentra_findings_status_idx"
  ON "sentra_findings" ("status");
CREATE INDEX IF NOT EXISTS "sentra_findings_severity_idx"
  ON "sentra_findings" ("severity");
CREATE INDEX IF NOT EXISTS "sentra_findings_emitted_idx"
  ON "sentra_findings" ("emitted_at");
