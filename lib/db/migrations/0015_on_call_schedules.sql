-- Task #2432: Real on-call schedules.
-- Adds a per-team rotation config plus an explicit shift/override table so
-- teams can swap who's on call without redeploying. The /teams/:team route
-- consults these tables before falling back to the legacy ISO-week rotation.

CREATE TABLE IF NOT EXISTS "on_call_schedules" (
  "id" SERIAL PRIMARY KEY,
  "team" TEXT NOT NULL,
  "rotation_interval_hours" INTEGER NOT NULL DEFAULT 168,
  "member_order" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "handoff_anchor" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "updated_by" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "on_call_schedules_team_unique"
  ON "on_call_schedules" ("team");

CREATE TABLE IF NOT EXISTS "on_call_shifts" (
  "id" SERIAL PRIMARY KEY,
  "team" TEXT NOT NULL,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "kind" TEXT NOT NULL DEFAULT 'override',
  "start_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "end_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "note" TEXT,
  "created_by" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "on_call_shifts_team_range_idx"
  ON "on_call_shifts" ("team", "start_at", "end_at");
