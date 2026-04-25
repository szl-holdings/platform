-- 0105: Add last_digest_sent_at to notification_preferences
-- Tracks when the most recent Lyte digest email was sent per user.
-- The DAILY_LYTE_DIGEST job uses this column to skip users who received
-- a digest within the last 20 hours, preventing duplicate delivery on
-- job retries or accidental double-runs.

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS last_digest_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS notification_preferences_last_digest_sent_at_idx
  ON notification_preferences (last_digest_sent_at);
