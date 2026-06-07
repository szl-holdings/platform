-- Analytics Engine schema migration
-- Creates all tables for the Unified Analytics & Metrics Intelligence Engine

-- Enums (create if not exists pattern)
DO $$ BEGIN
  CREATE TYPE analytics_granularity AS ENUM ('minute', 'hour', 'day', 'week', 'month');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE analytics_attribution_model AS ENUM ('first_touch', 'last_touch', 'linear', 'time_decay');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE analytics_anomaly_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Raw events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  source_app TEXT NOT NULL,
  session_id TEXT,
  user_id TEXT,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  tenant_id TEXT,
  device_type TEXT,
  platform TEXT,
  url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  country TEXT,
  properties JSONB DEFAULT '{}',
  dimensions JSONB DEFAULT '{}',
  numeric_value REAL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  server_side BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS analytics_events_name_idx ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS analytics_events_domain_idx ON analytics_events(domain);
CREATE INDEX IF NOT EXISTS analytics_events_source_idx ON analytics_events(source_app);
CREATE INDEX IF NOT EXISTS analytics_events_user_idx ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS analytics_events_org_idx ON analytics_events(organization_id);
CREATE INDEX IF NOT EXISTS analytics_events_tenant_idx ON analytics_events(tenant_id);
CREATE INDEX IF NOT EXISTS analytics_events_occurred_idx ON analytics_events(occurred_at);
CREATE INDEX IF NOT EXISTS analytics_events_session_idx ON analytics_events(session_id);

-- Metric definitions table
CREATE TABLE IF NOT EXISTS analytics_metric_definitions (
  id SERIAL PRIMARY KEY,
  metric_id TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  calculation_type TEXT NOT NULL,
  event_name TEXT,
  numeric_field TEXT,
  filter_conditions JSONB DEFAULT '[]',
  dimensions JSONB DEFAULT '[]',
  unit TEXT,
  granularities JSONB DEFAULT '["hour","day","week","month"]',
  visualization_type TEXT NOT NULL DEFAULT 'line',
  threshold_warning REAL,
  threshold_critical REAL,
  threshold_direction TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_metric_def_domain_idx ON analytics_metric_definitions(domain);

-- Metric snapshots table (pre-computed aggregations)
CREATE TABLE IF NOT EXISTS analytics_metric_snapshots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  metric_id TEXT NOT NULL,
  granularity analytics_granularity NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  value REAL NOT NULL,
  sample_count INTEGER NOT NULL DEFAULT 0,
  dimensions JSONB DEFAULT '{}',
  domain TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_snap_metric_idx ON analytics_metric_snapshots(metric_id);
CREATE INDEX IF NOT EXISTS analytics_snap_period_idx ON analytics_metric_snapshots(period_start, period_end);
CREATE INDEX IF NOT EXISTS analytics_snap_domain_idx ON analytics_metric_snapshots(domain);
CREATE INDEX IF NOT EXISTS analytics_snap_gran_idx ON analytics_metric_snapshots(granularity);
CREATE UNIQUE INDEX IF NOT EXISTS analytics_snap_unique_idx ON analytics_metric_snapshots(metric_id, granularity, period_start);

-- Attribution touchpoints
CREATE TABLE IF NOT EXISTS analytics_attribution_touchpoints (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  journey_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  domain TEXT NOT NULL,
  touchpoint_type TEXT NOT NULL,
  channel TEXT,
  content TEXT,
  campaign_id TEXT,
  properties JSONB DEFAULT '{}',
  position INTEGER NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS analytics_touch_journey_idx ON analytics_attribution_touchpoints(journey_id);
CREATE INDEX IF NOT EXISTS analytics_touch_entity_idx ON analytics_attribution_touchpoints(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS analytics_touch_domain_idx ON analytics_attribution_touchpoints(domain);

-- Attribution outcomes
CREATE TABLE IF NOT EXISTS analytics_attribution_outcomes (
  id SERIAL PRIMARY KEY,
  journey_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  domain TEXT NOT NULL,
  outcome_type TEXT NOT NULL,
  outcome_value REAL,
  occurred_at TIMESTAMPTZ NOT NULL,
  attribution_computed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS analytics_outcome_journey_idx ON analytics_attribution_outcomes(journey_id);
CREATE INDEX IF NOT EXISTS analytics_outcome_entity_idx ON analytics_attribution_outcomes(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS analytics_outcome_domain_idx ON analytics_attribution_outcomes(domain);

-- Cohort definitions
CREATE TABLE IF NOT EXISTS analytics_cohort_definitions (
  id SERIAL PRIMARY KEY,
  cohort_id TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL,
  entry_conditions JSONB NOT NULL DEFAULT '[]',
  entry_event_name TEXT,
  analysis_type TEXT NOT NULL DEFAULT 'retention',
  window_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_cohort_def_domain_idx ON analytics_cohort_definitions(domain);

-- Funnel definitions
CREATE TABLE IF NOT EXISTS analytics_funnel_definitions (
  id SERIAL PRIMARY KEY,
  funnel_id TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  window_hours INTEGER NOT NULL DEFAULT 168,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_funnel_def_domain_idx ON analytics_funnel_definitions(domain);

-- Anomalies
CREATE TABLE IF NOT EXISTS analytics_anomalies (
  id SERIAL PRIMARY KEY,
  anomaly_id TEXT NOT NULL UNIQUE,
  metric_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  anomaly_type TEXT NOT NULL,
  severity analytics_anomaly_severity NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_start TIMESTAMPTZ NOT NULL,
  observed_value REAL NOT NULL,
  expected_value REAL NOT NULL,
  deviation_percent REAL NOT NULL,
  z_score REAL,
  context JSONB DEFAULT '{}',
  potential_causes JSONB DEFAULT '[]',
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  is_suppressed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS analytics_anomaly_metric_idx ON analytics_anomalies(metric_id);
CREATE INDEX IF NOT EXISTS analytics_anomaly_domain_idx ON analytics_anomalies(domain);
CREATE INDEX IF NOT EXISTS analytics_anomaly_detected_idx ON analytics_anomalies(detected_at);
CREATE INDEX IF NOT EXISTS analytics_anomaly_severity_idx ON analytics_anomalies(severity);

-- Dashboard definitions
CREATE TABLE IF NOT EXISTS analytics_dashboards (
  id SERIAL PRIMARY KEY,
  dashboard_id TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB NOT NULL DEFAULT '[]',
  default_time_range TEXT NOT NULL DEFAULT '7d',
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_dashboard_domain_idx ON analytics_dashboards(domain);

-- Analytics export jobs
CREATE TABLE IF NOT EXISTS analytics_export_jobs (
  id SERIAL PRIMARY KEY,
  export_id TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  export_type TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'csv',
  status TEXT NOT NULL DEFAULT 'pending',
  filter_params JSONB DEFAULT '{}',
  row_count INTEGER,
  file_size_bytes BIGINT,
  download_token TEXT,
  expires_at TIMESTAMPTZ,
  error_message TEXT,
  schedule_frequency TEXT NOT NULL DEFAULT 'once',
  next_run_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  triggered_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  webhook_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_export_domain_idx ON analytics_export_jobs(domain);
CREATE INDEX IF NOT EXISTS analytics_export_status_idx ON analytics_export_jobs(status);
