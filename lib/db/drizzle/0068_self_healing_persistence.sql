-- Task #1863: Persist self-healing orchestrator history.
-- Replaces the in-memory PATTERNS/buildRuns() data in
-- artifacts/api-server/src/routes/self-healing.ts with durable tables so the
-- Operations Self-Healing page reflects real remediation history, real MTTR
-- savings, and real success rates. Toggling a pattern persists across
-- restarts.

CREATE TABLE IF NOT EXISTS "self_healing_patterns" (
  "id" SERIAL PRIMARY KEY,
  "pattern_key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "trigger" TEXT NOT NULL,
  "runbook" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "self_healing_patterns_key_idx" ON "self_healing_patterns" ("pattern_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "self_healing_patterns_enabled_idx" ON "self_healing_patterns" ("enabled");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "self_healing_runs" (
  "id" SERIAL PRIMARY KEY,
  "run_key" TEXT NOT NULL,
  "pattern_key" TEXT NOT NULL,
  "trigger_signal" TEXT NOT NULL,
  "service" TEXT NOT NULL,
  "detected_at" TIMESTAMP NOT NULL,
  "started_at" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "status" TEXT NOT NULL,
  "steps" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "mttr_saved_mins" INTEGER NOT NULL DEFAULT 0,
  "approver" TEXT,
  "audit_ref" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "self_healing_runs_key_idx" ON "self_healing_runs" ("run_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "self_healing_runs_pattern_idx" ON "self_healing_runs" ("pattern_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "self_healing_runs_status_idx" ON "self_healing_runs" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "self_healing_runs_detected_idx" ON "self_healing_runs" ("detected_at");
