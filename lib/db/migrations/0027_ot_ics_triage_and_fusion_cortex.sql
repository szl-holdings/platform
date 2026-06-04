-- Add triage columns to ot_ics_decoded_frames
ALTER TABLE ot_ics_decoded_frames
  ADD COLUMN IF NOT EXISTS triage_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS acknowledged_by TEXT,
  ADD COLUMN IF NOT EXISTS incident_ref TEXT;

CREATE INDEX IF NOT EXISTS ot_ics_decoded_frames_triage_status_idx
  ON ot_ics_decoded_frames (triage_status);

-- Create fusion_cortex_alerts table
CREATE TABLE IF NOT EXISTS fusion_cortex_alerts (
  id SERIAL PRIMARY KEY,
  alert_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  severity TEXT NOT NULL,
  category TEXT NOT NULL,
  confidence NUMERIC(5,4) NOT NULL DEFAULT 0,
  affected_domains TEXT[] NOT NULL DEFAULT '{}',
  affected_entities JSONB NOT NULL DEFAULT '[]',
  evidence_chain JSONB NOT NULL DEFAULT '[]',
  recommended_actions TEXT[] NOT NULL DEFAULT '{}',
  advisory_context TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  pattern_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS fusion_cortex_alerts_alert_id_unique
  ON fusion_cortex_alerts (alert_id);
CREATE INDEX IF NOT EXISTS fusion_cortex_alerts_alert_id_idx
  ON fusion_cortex_alerts (alert_id);
CREATE INDEX IF NOT EXISTS fusion_cortex_alerts_status_idx
  ON fusion_cortex_alerts (status);
CREATE INDEX IF NOT EXISTS fusion_cortex_alerts_severity_idx
  ON fusion_cortex_alerts (severity);
CREATE INDEX IF NOT EXISTS fusion_cortex_alerts_generated_at_idx
  ON fusion_cortex_alerts (generated_at);
CREATE INDEX IF NOT EXISTS fusion_cortex_alerts_expires_at_idx
  ON fusion_cortex_alerts (expires_at);
