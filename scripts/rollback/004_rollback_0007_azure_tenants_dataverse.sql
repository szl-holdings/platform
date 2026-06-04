-- ─────────────────────────────────────────────────────────────────────────────
-- Rollback for migration: 0007_azure_tenants_dataverse
-- Reverts: dataverse_connections table, azure_tenants table + index
--
-- WARNING: Run a full database backup before executing this script.
-- Run: ./scripts/backup-db.sh
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

DROP TABLE IF EXISTS "dataverse_connections" CASCADE;
DROP INDEX IF EXISTS "azure_tenants_tenant_id_idx";
DROP TABLE IF EXISTS "azure_tenants" CASCADE;

COMMIT;
