-- Task #2482: Notify on-call hand-offs so people know when they're up.
--
-- Adds a per-schedule "warning_minutes" column (how far in advance to nudge
-- the next on-call) and a dedup ledger so the minutely scheduler can be re-
-- run safely without double-notifying.
--
-- The dedup key is (team, handoff_at, kind, user_id): each unique hand-off
-- moment can produce at most one "warning" and one "handoff" notification
-- per recipient.

ALTER TABLE "on_call_schedules"
  ADD COLUMN IF NOT EXISTS "warning_minutes" INTEGER NOT NULL DEFAULT 30;

CREATE TABLE IF NOT EXISTS "on_call_handoff_notifications" (
  "id" SERIAL PRIMARY KEY,
  "team" TEXT NOT NULL,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "handoff_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "kind" TEXT NOT NULL,
  "notification_id" INTEGER,
  "in_app_delivered" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "on_call_handoff_notifications_dedup"
  ON "on_call_handoff_notifications" ("team", "handoff_at", "kind", "user_id");
