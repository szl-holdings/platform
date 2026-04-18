-- Migration: tenant_id columns on atlas_evidence, atlas_outcomes, atlas_runs
-- Enables tenant-scoped row-level access control on ATLAS run history.

ALTER TABLE "atlas_evidence" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "atlas_outcomes" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "atlas_runs"     ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;

CREATE INDEX IF NOT EXISTS "atlas_evidence_tenant_idx" ON "atlas_evidence" ("tenant_id");
CREATE INDEX IF NOT EXISTS "atlas_outcomes_tenant_idx" ON "atlas_outcomes" ("tenant_id");
CREATE INDEX IF NOT EXISTS "atlas_runs_tenant_idx"     ON "atlas_runs"     ("tenant_id");
