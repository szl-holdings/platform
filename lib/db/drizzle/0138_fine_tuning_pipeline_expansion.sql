-- Fine-Tuning Pipeline Expansion Migration
-- Adds: quality gate columns, canary columns, trigger configs table

-- Add quality gate columns to fine_tuning_jobs
ALTER TABLE fine_tuning_jobs
  ADD COLUMN IF NOT EXISTS triggered_by TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS quality_gate_passed BOOLEAN,
  ADD COLUMN IF NOT EXISTS quality_report JSONB;

-- Add canary traffic splitting columns to fine_tuned_model_registry
ALTER TABLE fine_tuned_model_registry
  ADD COLUMN IF NOT EXISTS canary_traffic_pct INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS canary_requests_total INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS canary_requests_success INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS canary_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS canary_promote_threshold INTEGER DEFAULT 100;

-- Add quality report to fine_tuning_datasets
ALTER TABLE fine_tuning_datasets
  ADD COLUMN IF NOT EXISTS quality_report JSONB;

-- Create per-agent trigger configuration table
CREATE TABLE IF NOT EXISTS fine_tuning_trigger_configs (
  id SERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  correction_threshold INTEGER NOT NULL DEFAULT 50,
  eval_score_drop_threshold REAL NOT NULL DEFAULT 0.05,
  calibration_bias_threshold REAL NOT NULL DEFAULT 0.15,
  cooldown_hours INTEGER NOT NULL DEFAULT 24,
  last_triggered_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  last_decision TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookup by agent
CREATE INDEX IF NOT EXISTS idx_fine_tuning_trigger_configs_agent_id
  ON fine_tuning_trigger_configs (agent_id);

-- Index for canary lifecycle queries
CREATE INDEX IF NOT EXISTS idx_fine_tuned_model_registry_lifecycle
  ON fine_tuned_model_registry (lifecycle, is_active);

-- Index for triggered_by on jobs
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_triggered_by
  ON fine_tuning_jobs (triggered_by);
