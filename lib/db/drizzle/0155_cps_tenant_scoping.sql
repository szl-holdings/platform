ALTER TABLE "cps_runs" ADD COLUMN IF NOT EXISTS "tenant_id" text NOT NULL DEFAULT 'default';
ALTER TABLE "cps_approvals" ADD COLUMN IF NOT EXISTS "tenant_id" text NOT NULL DEFAULT 'default';
ALTER TABLE "cps_proof_bundles" ADD COLUMN IF NOT EXISTS "tenant_id" text NOT NULL DEFAULT 'default';

CREATE INDEX IF NOT EXISTS "cps_runs_tenant_id_idx" ON "cps_runs" ("tenant_id");
CREATE INDEX IF NOT EXISTS "cps_approvals_tenant_id_idx" ON "cps_approvals" ("tenant_id");
CREATE INDEX IF NOT EXISTS "cps_proof_bundles_tenant_id_idx" ON "cps_proof_bundles" ("tenant_id");
