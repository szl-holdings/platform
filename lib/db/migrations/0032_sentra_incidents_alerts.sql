-- Sentra: incident and alert persistence tables
-- Migrates Sentra from in-memory stores to real DB storage.

CREATE TABLE IF NOT EXISTS sentra_incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'triaging', 'escalated', 'contained', 'resolved')),
  mitre_stage TEXT NOT NULL DEFAULT 'Initial Access',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  assigned_to TEXT,
  affected_assets JSONB NOT NULL DEFAULT '[]',
  tags JSONB NOT NULL DEFAULT '[]',
  timeline JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sentra_incidents_status_idx ON sentra_incidents (status);
CREATE INDEX IF NOT EXISTS sentra_incidents_severity_idx ON sentra_incidents (severity);
CREATE INDEX IF NOT EXISTS sentra_incidents_detected_at_idx ON sentra_incidents (detected_at);

CREATE TABLE IF NOT EXISTS sentra_alerts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'suppressed')),
  description TEXT NOT NULL,
  asset TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  linked_incident_id TEXT REFERENCES sentra_incidents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sentra_alerts_status_idx ON sentra_alerts (status);
CREATE INDEX IF NOT EXISTS sentra_alerts_severity_idx ON sentra_alerts (severity);
CREATE INDEX IF NOT EXISTS sentra_alerts_detected_at_idx ON sentra_alerts (detected_at);
