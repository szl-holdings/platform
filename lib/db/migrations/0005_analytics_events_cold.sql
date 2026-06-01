CREATE TABLE IF NOT EXISTS analytics_events_cold (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  source_app TEXT NOT NULL,
  session_id TEXT,
  user_id TEXT,
  organization_id INTEGER,
  tenant_id TEXT,
  properties JSONB DEFAULT '{}',
  dimensions JSONB DEFAULT '{}',
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  archive_batch TEXT
);

CREATE INDEX IF NOT EXISTS ae_cold_event_name_idx ON analytics_events_cold (event_name);
CREATE INDEX IF NOT EXISTS ae_cold_domain_idx ON analytics_events_cold (domain);
CREATE INDEX IF NOT EXISTS ae_cold_user_idx ON analytics_events_cold (user_id);
CREATE INDEX IF NOT EXISTS ae_cold_org_idx ON analytics_events_cold (organization_id);
CREATE INDEX IF NOT EXISTS ae_cold_occurred_idx ON analytics_events_cold (occurred_at);
CREATE INDEX IF NOT EXISTS ae_cold_archived_idx ON analytics_events_cold (archived_at);
