-- SRE Observability Foundation: SLO definitions, SLO measurement snapshots, and incident management
-- Task 3417: SRE observability foundation — SLOs, error budgets, slow query detection, incident management

CREATE TABLE IF NOT EXISTS slo_definitions (
  id SERIAL PRIMARY KEY,
  service_group TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('latency_p50', 'latency_p95', 'latency_p99', 'error_rate', 'availability')),
  target_value REAL NOT NULL,
  window_hours INTEGER NOT NULL DEFAULT 720,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS slo_definitions_service_group_metric_type_idx ON slo_definitions (service_group, metric_type);

CREATE TABLE IF NOT EXISTS slo_measurements (
  id SERIAL PRIMARY KEY,
  slo_definition_id INTEGER NOT NULL REFERENCES slo_definitions(id) ON DELETE CASCADE,
  service_group TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  window_hours INTEGER NOT NULL,
  compliance_pct REAL NOT NULL,
  error_budget_remaining_pct REAL NOT NULL,
  burn_rate_1h REAL,
  burn_rate_6h REAL,
  burn_rate_24h REAL,
  request_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  p50_ms REAL,
  p95_ms REAL,
  p99_ms REAL,
  alert_fired BOOLEAN NOT NULL DEFAULT false,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS slo_measurements_service_group_measured_at_idx ON slo_measurements (service_group, measured_at);
CREATE INDEX IF NOT EXISTS slo_measurements_slo_definition_id_idx ON slo_measurements (slo_definition_id);

CREATE TABLE IF NOT EXISTS sre_incidents (
  id SERIAL PRIMARY KEY,
  incident_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'mitigating', 'resolved', 'postmortem')),
  affected_services TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  root_cause TEXT,
  resolution_notes TEXT,
  postmortem_url TEXT,
  assignee TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  slo_impacted BOOLEAN NOT NULL DEFAULT false,
  impacted_slo_services TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sre_incidents_status_idx ON sre_incidents (status);
CREATE INDEX IF NOT EXISTS sre_incidents_detected_at_idx ON sre_incidents (detected_at);
CREATE INDEX IF NOT EXISTS sre_incidents_severity_status_idx ON sre_incidents (severity, status);

CREATE TABLE IF NOT EXISTS sre_incident_timeline (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES sre_incidents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'status_changed', 'update', 'assigned', 'resolved', 'postmortem_added', 'slo_linked')),
  message TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  author TEXT,
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sre_incident_timeline_incident_id_idx ON sre_incident_timeline (incident_id);
CREATE INDEX IF NOT EXISTS sre_incident_timeline_occurred_at_idx ON sre_incident_timeline (occurred_at);

-- Seed initial SLO definitions for the 6 critical API groups (idempotent WHERE NOT EXISTS)
INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'auth', 'availability', 99.9, 720, '99.9% of auth requests succeed over a 30-day window'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='auth' AND metric_type='availability');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'auth', 'error_rate', 0.1, 720, 'Error rate for auth requests stays below 0.1% over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='auth' AND metric_type='error_rate');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'auth', 'latency_p95', 200.0, 720, '95th percentile auth latency stays under 200ms over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='auth' AND metric_type='latency_p95');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'auth', 'latency_p99', 500.0, 720, '99th percentile auth latency stays under 500ms over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='auth' AND metric_type='latency_p99');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'decisions', 'availability', 99.5, 720, '99.5% of decision requests succeed over a 30-day window'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='decisions' AND metric_type='availability');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'decisions', 'error_rate', 0.5, 720, 'Error rate for decision requests stays below 0.5% over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='decisions' AND metric_type='error_rate');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'decisions', 'latency_p95', 500.0, 720, '95th percentile decision latency stays under 500ms over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='decisions' AND metric_type='latency_p95');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'decisions', 'latency_p99', 2000.0, 720, '99th percentile decision latency stays under 2000ms over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='decisions' AND metric_type='latency_p99');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'billing', 'availability', 99.9, 720, '99.9% of billing requests succeed over a 30-day window'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='billing' AND metric_type='availability');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'billing', 'error_rate', 0.1, 720, 'Error rate for billing requests stays below 0.1% over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='billing' AND metric_type='error_rate');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'billing', 'latency_p95', 1000.0, 720, '95th percentile billing latency stays under 1000ms over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='billing' AND metric_type='latency_p95');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'ai_engine', 'availability', 99.0, 720, '99.0% of AI engine requests succeed over a 30-day window'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='ai_engine' AND metric_type='availability');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'ai_engine', 'error_rate', 1.0, 720, 'Error rate for AI engine requests stays below 1.0% over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='ai_engine' AND metric_type='error_rate');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'ai_engine', 'latency_p95', 3000.0, 720, '95th percentile AI engine latency stays under 3000ms over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='ai_engine' AND metric_type='latency_p95');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'document_pipeline', 'availability', 99.0, 720, '99.0% of document pipeline requests succeed over a 30-day window'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='document_pipeline' AND metric_type='availability');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'document_pipeline', 'error_rate', 1.0, 720, 'Error rate for document pipeline stays below 1.0% over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='document_pipeline' AND metric_type='error_rate');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'document_pipeline', 'latency_p95', 5000.0, 720, '95th percentile document pipeline latency stays under 5000ms over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='document_pipeline' AND metric_type='latency_p95');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'platform', 'availability', 99.5, 720, '99.5% of platform API requests succeed over a 30-day window'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='platform' AND metric_type='availability');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'platform', 'error_rate', 0.5, 720, 'Error rate for platform API requests stays below 0.5% over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='platform' AND metric_type='error_rate');

INSERT INTO slo_definitions (service_group, metric_type, target_value, window_hours, description)
SELECT 'platform', 'latency_p95', 500.0, 720, '95th percentile platform API latency stays under 500ms over 30 days'
WHERE NOT EXISTS (SELECT 1 FROM slo_definitions WHERE service_group='platform' AND metric_type='latency_p95');
