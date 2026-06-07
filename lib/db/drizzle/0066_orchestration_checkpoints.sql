-- Migration: orchestration_checkpoints table
-- Persists in-flight cognitive-runtime checkpoints so that ≤1s of work is
-- lost on a crash and a restarted process can resume from the last
-- saved phase/step of any active CognitiveLoopRun.

CREATE TABLE IF NOT EXISTS "orchestration_checkpoints" (
  "ref" text PRIMARY KEY,
  "run_id" text NOT NULL,
  "agent_id" text NOT NULL,
  "objective" text NOT NULL,
  "phase" text NOT NULL,
  "step_index" integer NOT NULL DEFAULT 0,
  "snapshot" jsonb NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
  "expires_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "orchestration_checkpoints_run_id_idx" ON "orchestration_checkpoints" ("run_id");
CREATE INDEX IF NOT EXISTS "orchestration_checkpoints_agent_id_idx" ON "orchestration_checkpoints" ("agent_id");
CREATE INDEX IF NOT EXISTS "orchestration_checkpoints_created_at_idx" ON "orchestration_checkpoints" ("created_at");
CREATE INDEX IF NOT EXISTS "orchestration_checkpoints_expires_at_idx" ON "orchestration_checkpoints" ("expires_at");
