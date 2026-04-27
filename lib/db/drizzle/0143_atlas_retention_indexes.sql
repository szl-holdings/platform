-- Migration: Add captured_at index on atlas_evidence to support
-- efficient time-based retention prune scans (atlas_retention_prune job).

CREATE INDEX IF NOT EXISTS "atlas_evidence_captured_at_idx" ON "atlas_evidence" ("captured_at" DESC);
