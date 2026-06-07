-- Add per-rule email notification cooldown columns to platform_alert_rules.
-- notify_cooldown_minutes: how long (in minutes) to suppress repeat emails after
--   one has been sent for this rule (default 60 minutes).
-- last_notified_at: timestamp of the most recent successful email dispatch for
--   the rule; used to enforce the cooldown window.

ALTER TABLE platform_alert_rules
  ADD COLUMN IF NOT EXISTS notify_cooldown_minutes INTEGER NOT NULL DEFAULT 60;

ALTER TABLE platform_alert_rules
  ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ;
