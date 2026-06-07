-- ─────────────────────────────────────────────────────────────────────────────
-- Rollback for migration: 0005_platform_ops_tables
-- Reverts:
--   - artifact_approvals table + indexes
--   - platform_job_runs table + indexes
--   - feature_flags columns: scope, targeting_json, product, required_platform_role
--
-- WARNING: Run a full database backup before executing this script.
-- Run: ./scripts/backup-db.sh
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- Drop artifact_approvals and its indexes
DROP INDEX IF EXISTS "artifact_approvals_domain_idx";
DROP INDEX IF EXISTS "artifact_approvals_status_idx";
DROP TABLE IF EXISTS "artifact_approvals" CASCADE;

-- Drop platform_job_runs and its indexes
DROP INDEX IF EXISTS "platform_job_runs_correlation_idx";
DROP INDEX IF EXISTS "platform_job_runs_domain_idx";
DROP INDEX IF EXISTS "platform_job_runs_status_idx";
DROP INDEX IF EXISTS "platform_job_runs_type_idx";
DROP TABLE IF EXISTS "platform_job_runs" CASCADE;

-- Revert added columns on feature_flags
ALTER TABLE "feature_flags"
  DROP COLUMN IF EXISTS "required_platform_role",
  DROP COLUMN IF EXISTS "product",
  DROP COLUMN IF EXISTS "targeting_json",
  DROP COLUMN IF EXISTS "scope";

COMMIT;
