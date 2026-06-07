-- Migration: Create signal_chain_executions table for persistent audit trail
-- Backs the Signal Chain Engine's compliance-grade execution history.

CREATE TABLE IF NOT EXISTS "signal_chain_executions" (
  "id"               SERIAL PRIMARY KEY,
  "chain_id"         TEXT NOT NULL,
  "trigger_domain"   TEXT NOT NULL,
  "payload_snapshot" JSONB,
  "outcomes"         JSONB,
  "triggered_at"     TIMESTAMP NOT NULL DEFAULT NOW(),
  "status"           TEXT NOT NULL DEFAULT 'completed'
);

CREATE INDEX IF NOT EXISTS "signal_chain_executions_chain_id_idx"     ON "signal_chain_executions" ("chain_id");
CREATE INDEX IF NOT EXISTS "signal_chain_executions_triggered_at_idx" ON "signal_chain_executions" ("triggered_at" DESC);
