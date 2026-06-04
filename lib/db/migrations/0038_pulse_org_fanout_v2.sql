-- Pulse Org-Wide Fan-Out v2
-- Adds tables for org publications, per-recipient deliveries, recurrence schedules,
-- per-user opt-out preferences, per-org channel configs, and an audit log.
-- All statements use CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS pulse_org_publications (
  id SERIAL PRIMARY KEY,
  publication_id TEXT NOT NULL UNIQUE,
  briefing_id TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'consolidated',
  channels JSONB NOT NULL DEFAULT '[]',
  schedule_id INTEGER,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','in_progress','completed','failed','cancelled')),
  total_recipients INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  suppressed_count INTEGER NOT NULL DEFAULT 0,
  published_by INTEGER,
  audience_filter JSONB,
  metadata JSONB,
  enqueued_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pulse_org_publications_status_idx ON pulse_org_publications(status);
CREATE INDEX IF NOT EXISTS pulse_org_publications_briefing_idx ON pulse_org_publications(briefing_id);

CREATE TABLE IF NOT EXISTS pulse_org_publication_deliveries (
  id SERIAL PRIMARY KEY,
  publication_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','delivered','failed','suppressed','retrying')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  provider_message_id TEXT,
  suppress_reason TEXT,
  delivered_at TIMESTAMP,
  next_retry_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT pulse_org_deliveries_pub_user_channel_unique UNIQUE (publication_id, user_id, channel)
);

CREATE INDEX IF NOT EXISTS pulse_org_deliveries_pub_status_idx ON pulse_org_publication_deliveries(publication_id, status);
CREATE INDEX IF NOT EXISTS pulse_org_deliveries_retry_idx ON pulse_org_publication_deliveries(next_retry_at) WHERE next_retry_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS pulse_org_deliveries_user_idx ON pulse_org_publication_deliveries(user_id);

CREATE TABLE IF NOT EXISTS pulse_org_schedules (
  id SERIAL PRIMARY KEY,
  schedule_id TEXT NOT NULL UNIQUE,
  org_id INTEGER,
  domain TEXT NOT NULL DEFAULT 'consolidated',
  channels JSONB NOT NULL DEFAULT '[]',
  pinned_briefing_id TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekdays','weekly','monthly','custom')),
  interval INTEGER NOT NULL DEFAULT 1,
  weekdays JSONB DEFAULT '[]',
  time_of_day TEXT NOT NULL DEFAULT '09:00',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  paused BOOLEAN NOT NULL DEFAULT FALSE,
  next_run_at TIMESTAMP,
  last_run_at TIMESTAMP,
  created_by INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pulse_org_schedules_next_run_idx ON pulse_org_schedules(next_run_at) WHERE paused = FALSE AND next_run_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS pulse_org_user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  email_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
  sms_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
  slack_dm_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
  push_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
  unsubscribe_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT pulse_org_user_prefs_user_unique UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS pulse_org_channel_configs (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL UNIQUE,
  slack_webhook_url TEXT,
  slack_channel TEXT,
  teams_webhook_url TEXT,
  sms_sender_id TEXT,
  outbound_webhook_url TEXT,
  outbound_webhook_secret TEXT,
  email_from_name TEXT,
  email_from_address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pulse_org_audit_log (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  user_id INTEGER,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pulse_org_audit_log_action_idx ON pulse_org_audit_log(action);
CREATE INDEX IF NOT EXISTS pulse_org_audit_log_entity_idx ON pulse_org_audit_log(entity_type, entity_id);
