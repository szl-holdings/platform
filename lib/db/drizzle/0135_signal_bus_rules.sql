CREATE TABLE IF NOT EXISTS signal_bus_rules (
  rule_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  enabled TEXT NOT NULL DEFAULT 'true',
  source_domain TEXT NOT NULL,
  source_type TEXT NOT NULL,
  min_severity TEXT NOT NULL DEFAULT 'info',
  conditions JSONB NOT NULL DEFAULT '{}',
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL,
  target_domain TEXT,
  org_id TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_fired_at TIMESTAMPTZ,
  fire_count TEXT NOT NULL DEFAULT '0'
);

CREATE INDEX IF NOT EXISTS signal_bus_rules_domain_type_idx ON signal_bus_rules (source_domain, source_type);
CREATE INDEX IF NOT EXISTS signal_bus_rules_enabled_idx ON signal_bus_rules (enabled);
CREATE INDEX IF NOT EXISTS signal_bus_rules_org_id_idx ON signal_bus_rules (org_id);

CREATE TABLE IF NOT EXISTS signal_bus_routed_events (
  event_id UUID PRIMARY KEY,
  rule_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  source_signal_id TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  source_type TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_result JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  org_id TEXT,
  routed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS signal_bus_routed_events_rule_id_idx ON signal_bus_routed_events (rule_id);
CREATE INDEX IF NOT EXISTS signal_bus_routed_events_source_signal_idx ON signal_bus_routed_events (source_signal_id);
CREATE INDEX IF NOT EXISTS signal_bus_routed_events_routed_at_idx ON signal_bus_routed_events (routed_at);
CREATE INDEX IF NOT EXISTS signal_bus_routed_events_status_idx ON signal_bus_routed_events (status);
CREATE INDEX IF NOT EXISTS signal_bus_routed_events_org_id_idx ON signal_bus_routed_events (org_id);

CREATE TABLE IF NOT EXISTS signal_bus_dead_letters (
  dead_letter_id UUID PRIMARY KEY,
  rule_id UUID,
  source_signal_id TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  source_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  payload JSONB NOT NULL,
  retry_count TEXT NOT NULL DEFAULT '0',
  org_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS signal_bus_dead_letters_rule_id_idx ON signal_bus_dead_letters (rule_id);
CREATE INDEX IF NOT EXISTS signal_bus_dead_letters_created_at_idx ON signal_bus_dead_letters (created_at);
