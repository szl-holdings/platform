-- Migration: 0167_formula_drift_buckets (task #4960)
-- Durable storage for the ROSIE drift detector's rolling-window buckets.
-- The api-server's in-memory detector write-throughs each observation
-- here so that restarting the process resumes accumulation instead of
-- re-earning the samplesMin threshold from scratch.
--
-- See lib/db/src/schema/formula_drift_buckets.ts for the concurrency
-- model (monotonic `revision` + `tombstoned_at` soft-delete) that
-- protects against stale cross-process writes.

CREATE TABLE IF NOT EXISTS "formula_drift_buckets" (
  "formula_id"        TEXT             NOT NULL,
  "parameter"         TEXT             NOT NULL,
  "old_value"         DOUBLE PRECISION NOT NULL,
  "candidate_value"   DOUBLE PRECISION NOT NULL,
  "from_version"      TEXT             NOT NULL,
  "thesis_citation"   TEXT             NOT NULL,
  "irreversibility"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "observed_history"  JSONB            NOT NULL DEFAULT '[]'::jsonb,
  "baseline_history"  JSONB            NOT NULL DEFAULT '[]'::jsonb,
  "gap_history"       JSONB            NOT NULL DEFAULT '[]'::jsonb,
  "total_samples"     INTEGER          NOT NULL DEFAULT 0,
  "revision"          BIGINT           NOT NULL DEFAULT 0,
  "tombstoned_at"     TIMESTAMPTZ,
  "updated_at"        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("formula_id", "parameter")
);

-- Idempotent column adds for environments that ran the prior shape of
-- this migration before the revision/tombstone fields were introduced.
ALTER TABLE "formula_drift_buckets"
  ADD COLUMN IF NOT EXISTS "revision"      BIGINT      NOT NULL DEFAULT 0;
ALTER TABLE "formula_drift_buckets"
  ADD COLUMN IF NOT EXISTS "tombstoned_at" TIMESTAMPTZ;

-- Janitor index: live buckets only. Lets `loadBuckets()` skip
-- tombstoned rows without a full scan.
CREATE INDEX IF NOT EXISTS "formula_drift_buckets_live_idx"
  ON "formula_drift_buckets" ("formula_id", "parameter")
  WHERE "tombstoned_at" IS NULL;
