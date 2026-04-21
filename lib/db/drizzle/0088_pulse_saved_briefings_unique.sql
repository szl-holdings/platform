-- Migration: pulse_saved_briefings_unique
--
-- Adds a unique constraint on (user_id, briefing_id) in pulse_saved_briefings
-- so that the ON CONFLICT DO NOTHING upsert in the save-for-later endpoints
-- works correctly. Without this constraint the INSERT ... ON CONFLICT clause
-- raises a "there is no unique or exclusion constraint matching the ON CONFLICT
-- specification" error at runtime.
--
-- The constraint is also created as a UNIQUE INDEX which doubles as the lookup
-- index for the GET /briefings/saved query that filters by user_id.
--
-- Safe to re-run: CREATE UNIQUE INDEX IF NOT EXISTS is idempotent.

CREATE UNIQUE INDEX IF NOT EXISTS "pulse_saved_briefings_user_briefing_unique"
  ON "pulse_saved_briefings" ("user_id", "briefing_id");
