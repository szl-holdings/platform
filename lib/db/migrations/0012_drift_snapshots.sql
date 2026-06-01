-- Task #1153: Persist drift snapshots across server restarts.
-- Adds a durable table for drift summaries that previously lived in an
-- in-memory array inside artifacts/api-server/src/routes/drift.ts.

CREATE TABLE IF NOT EXISTS "drift_snapshots" (
  "id" SERIAL PRIMARY KEY,
  "measured_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "overall_drift_score" REAL NOT NULL,
  "status" TEXT NOT NULL,
  "summary" JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS "drift_snapshots_measured_at_idx" ON "drift_snapshots" ("measured_at");
