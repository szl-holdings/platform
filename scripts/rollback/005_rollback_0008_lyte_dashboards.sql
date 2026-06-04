-- ─────────────────────────────────────────────────────────────────────────────
-- Rollback for migration: 0008_lyte_dashboards
-- Reverts: lyte_dashboards table + indexes
--
-- WARNING: Run a full database backup before executing this script.
-- Run: ./scripts/backup-db.sh
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

DROP INDEX IF EXISTS "lyte_dashboards_share_token_idx";
DROP INDEX IF EXISTS "lyte_dashboards_user_idx";
DROP TABLE IF EXISTS "lyte_dashboards" CASCADE;

COMMIT;
