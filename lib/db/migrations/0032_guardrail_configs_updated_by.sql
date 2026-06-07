-- Migration: add updated_by_id to guardrail_configs
-- Tracks which user last modified a guardrail config so the Command
-- Governance UI can display "Updated by <user> on <date>" metadata.

ALTER TABLE guardrail_configs
  ADD COLUMN IF NOT EXISTS updated_by_id integer
    REFERENCES users(id)
    ON DELETE SET NULL;
