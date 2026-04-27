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
--
-- The pulse_saved_briefings table itself is only declared in the TS schema
-- (lib/db/src/schema/pulse.ts) and has no SQL CREATE TABLE elsewhere in the
-- migration tree, so the bare CREATE INDEX below used to WARN on every boot
-- ("relation \"pulse_saved_briefings\" does not exist"). We declare the table
-- here with CREATE TABLE IF NOT EXISTS — mirroring the TS schema — so the
-- index target always resolves and the migration runner stays quiet.

CREATE TABLE IF NOT EXISTS "pulse_saved_briefings" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "briefing_id" text NOT NULL,
  "saved_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pulse_saved_briefings_user_briefing_unique"
  ON "pulse_saved_briefings" ("user_id", "briefing_id");
