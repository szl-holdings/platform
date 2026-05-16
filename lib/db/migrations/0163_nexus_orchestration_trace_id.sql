-- Migration: 0163_nexus_orchestration_trace_id
-- Adds a durable `trace_id` column to `nexus_orchestration_plans` so the
-- server-assigned trace ID survives restarts and is never silently
-- recomputed from the plan UUID (Task #4870).

ALTER TABLE "nexus_orchestration_plans"
  ADD COLUMN IF NOT EXISTS "trace_id" text;

-- Backfill existing rows using the historical convention so older plans
-- keep the trace ID their clients have already seen / copied.
UPDATE "nexus_orchestration_plans"
SET "trace_id" = 'trace_' || substr("id", 1, 12)
WHERE "trace_id" IS NULL;

CREATE INDEX IF NOT EXISTS "nexus_orchestration_plans_trace_id_idx"
  ON "nexus_orchestration_plans" ("trace_id");
