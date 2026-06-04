-- Add digest_config jsonb column to notification_preferences for cross-device
-- Daily Executive Digest configuration sync (Task #637).
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS digest_config jsonb;
