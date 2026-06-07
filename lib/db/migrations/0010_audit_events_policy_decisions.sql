-- Migration: Extend audit_events with policy decision fields
-- Captures the evidence chain of policy approve/reject decisions so that
-- operators can replay why an action was run on the Proof Chain Audit page
-- and feed the same evidence into the executive digest.

ALTER TABLE "audit_events"
  ADD COLUMN IF NOT EXISTS "decision"             TEXT,
  ADD COLUMN IF NOT EXISTS "policy_evaluation_id" TEXT,
  ADD COLUMN IF NOT EXISTS "resolved_mode"        TEXT,
  ADD COLUMN IF NOT EXISTS "confidence"           REAL,
  ADD COLUMN IF NOT EXISTS "blocked_reason"       TEXT,
  ADD COLUMN IF NOT EXISTS "projected_impact"     JSONB,
  ADD COLUMN IF NOT EXISTS "product"              TEXT;

CREATE INDEX IF NOT EXISTS "audit_events_entity_type_decision_idx"
  ON "audit_events" ("entity_type", "decision");

CREATE INDEX IF NOT EXISTS "audit_events_product_idx"
  ON "audit_events" ("product");

CREATE INDEX IF NOT EXISTS "audit_events_resolved_mode_idx"
  ON "audit_events" ("resolved_mode");

CREATE INDEX IF NOT EXISTS "audit_events_created_at_idx"
  ON "audit_events" ("created_at" DESC);
