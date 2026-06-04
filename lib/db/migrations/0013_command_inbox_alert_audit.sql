-- Task #2278: Persist a full operator-action audit history for Command Inbox alerts.
-- The companion command_inbox_alert_states table is overwritten on every
-- action and cannot answer "who acted, when". This immutable append-only
-- table records every acknowledge / snooze / resolve / un-snooze.

CREATE TABLE IF NOT EXISTS "command_inbox_alert_audit" (
  "id" SERIAL PRIMARY KEY,
  "alert_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL DEFAULT '_global_',
  "action" TEXT NOT NULL,
  "snoozed_until" TIMESTAMP WITH TIME ZONE,
  "actor_id" INTEGER,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "command_inbox_alert_audit_alert_idx"
  ON "command_inbox_alert_audit" ("alert_id");

CREATE INDEX IF NOT EXISTS "command_inbox_alert_audit_alert_tenant_idx"
  ON "command_inbox_alert_audit" ("alert_id", "tenant_id");

CREATE INDEX IF NOT EXISTS "command_inbox_alert_audit_created_at_idx"
  ON "command_inbox_alert_audit" ("created_at");
