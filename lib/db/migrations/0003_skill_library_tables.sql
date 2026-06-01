-- Migration: Create skill_library tables (skills and skill_runs)
-- These tables back the @workspace/skill-library package's durable persistence layer.
--
-- Drift guard (RR-21): a `skills` table may already exist from `drizzle push`
-- without the columns this migration assumes. The ADD COLUMN IF NOT EXISTS
-- block below brings any pre-existing `skills` row up to the shape required
-- by the indexes that follow. This keeps the migration idempotent across both
-- a clean DB and a `drizzle push`-bootstrapped DB.

CREATE TABLE IF NOT EXISTS "skills" (
  "id"                  SERIAL PRIMARY KEY,
  "skill_id"            TEXT NOT NULL UNIQUE,
  "name"                TEXT NOT NULL,
  "description"         TEXT NOT NULL,
  "category"            TEXT NOT NULL,
  "objective"           TEXT NOT NULL,
  "input_fields"        JSONB NOT NULL DEFAULT '[]',
  "steps"               JSONB NOT NULL DEFAULT '[]',
  "tools_used"          TEXT[] NOT NULL DEFAULT '{}',
  "expected_outputs"    TEXT[] NOT NULL DEFAULT '{}',
  "success_criteria"    JSONB NOT NULL DEFAULT '[]',
  "failure_conditions"  JSONB NOT NULL DEFAULT '[]',
  "total_runs"          INTEGER NOT NULL DEFAULT 0,
  "successful_runs"     INTEGER NOT NULL DEFAULT 0,
  "failed_runs"         INTEGER NOT NULL DEFAULT 0,
  "success_rate"        REAL NOT NULL DEFAULT 0,
  "avg_latency_ms"      REAL NOT NULL DEFAULT 0,
  "last_run_at"         TIMESTAMPTZ,
  "last_failure_at"     TIMESTAMPTZ,
  "last_failure_reason" TEXT,
  "is_builtin"          BOOLEAN NOT NULL DEFAULT FALSE,
  "enabled"             BOOLEAN NOT NULL DEFAULT TRUE,
  "version"             TEXT NOT NULL DEFAULT '1.0.0',
  "tags"                TEXT[] NOT NULL DEFAULT '{}',
  "created_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drift guard: ensure all columns required by the indexes below exist on
-- pre-existing `skills` tables (created via drizzle push without these
-- columns). Defaults match the CREATE TABLE definition above.
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "category"   TEXT NOT NULL DEFAULT 'uncategorized';
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "enabled"    BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "is_builtin" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS "skills_category_idx"   ON "skills" ("category");
CREATE INDEX IF NOT EXISTS "skills_enabled_idx"     ON "skills" ("enabled");
CREATE INDEX IF NOT EXISTS "skills_is_builtin_idx"  ON "skills" ("is_builtin");

CREATE TABLE IF NOT EXISTS "skill_runs" (
  "id"           SERIAL PRIMARY KEY,
  "run_id"       TEXT NOT NULL UNIQUE,
  "skill_id"     TEXT NOT NULL,
  "skill_name"   TEXT NOT NULL,
  "status"       TEXT NOT NULL,
  "inputs"       JSONB NOT NULL DEFAULT '{}',
  "outputs"      JSONB,
  "steps"        JSONB NOT NULL DEFAULT '[]',
  "error"        TEXT,
  "started_at"   TIMESTAMPTZ NOT NULL,
  "completed_at" TIMESTAMPTZ,
  "latency_ms"   INTEGER
);

CREATE INDEX IF NOT EXISTS "skill_runs_skill_id_idx"   ON "skill_runs" ("skill_id");
CREATE INDEX IF NOT EXISTS "skill_runs_status_idx"     ON "skill_runs" ("status");
CREATE INDEX IF NOT EXISTS "skill_runs_started_at_idx" ON "skill_runs" ("started_at");
