-- ─────────────────────────────────────────────────────────────────────────────
-- Rollback for migration: 0006_firestorm_hardening_platform
-- Reverts:
--   - firestorm_hardening_controls table + indexes
--   - Added columns on firestorm_findings (remediation_owner, due_date, audit_trail)
--   - Added columns on firestorm_compliance_controls (owner, due_date, audit_trail)
--
-- WARNING: Run a full database backup before executing this script.
-- Run: ./scripts/backup-db.sh
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- Drop firestorm_hardening_controls table and its indexes
DROP INDEX IF EXISTS "idx_hardening_controls_priority";
DROP INDEX IF EXISTS "idx_hardening_controls_status";
DROP INDEX IF EXISTS "idx_hardening_controls_category";
DROP TABLE IF EXISTS "firestorm_hardening_controls" CASCADE;

-- Revert columns added to firestorm_findings
ALTER TABLE "firestorm_findings"
  DROP COLUMN IF EXISTS "audit_trail",
  DROP COLUMN IF EXISTS "due_date",
  DROP COLUMN IF EXISTS "remediation_owner";

-- Revert columns added to firestorm_compliance_controls
ALTER TABLE "firestorm_compliance_controls"
  DROP COLUMN IF EXISTS "audit_trail",
  DROP COLUMN IF EXISTS "due_date",
  DROP COLUMN IF EXISTS "owner";

COMMIT;
