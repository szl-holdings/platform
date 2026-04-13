-- ─────────────────────────────────────────────────────────────────────────────
-- Rollback for migration: 0019_terra_broker_schema (formerly 0004_terra_broker_schema)
-- Reverts: terra_transactions, terra_inquiries, terra_listings,
--          terra_properties, terra_agents, terra_brokerages tables + all indexes
--
-- WARNING: Run a full database backup before executing this script.
-- Run: ./scripts/backup-db.sh
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- Drop in dependency order (dependents first)
DROP INDEX IF EXISTS "terra_transaction_status_idx";
DROP INDEX IF EXISTS "terra_transaction_closed_idx";
DROP INDEX IF EXISTS "terra_transaction_property_idx";
DROP INDEX IF EXISTS "terra_transaction_brokerage_idx";
DROP INDEX IF EXISTS "terra_transaction_agent_idx";
DROP TABLE IF EXISTS "terra_transactions" CASCADE;

DROP INDEX IF EXISTS "terra_inquiry_score_idx";
DROP INDEX IF EXISTS "terra_inquiry_created_idx";
DROP INDEX IF EXISTS "terra_inquiry_status_idx";
DROP INDEX IF EXISTS "terra_inquiry_agent_idx";
DROP INDEX IF EXISTS "terra_inquiry_listing_idx";
DROP TABLE IF EXISTS "terra_inquiries" CASCADE;

DROP INDEX IF EXISTS "terra_listing_score_idx";
DROP INDEX IF EXISTS "terra_listing_created_idx";
DROP INDEX IF EXISTS "terra_listing_property_idx";
DROP INDEX IF EXISTS "terra_listing_brokerage_idx";
DROP INDEX IF EXISTS "terra_listing_agent_idx";
DROP INDEX IF EXISTS "terra_listing_status_idx";
DROP TABLE IF EXISTS "terra_listings" CASCADE;

DROP INDEX IF EXISTS "terra_property_created_idx";
DROP INDEX IF EXISTS "terra_property_owner_type_idx";
DROP INDEX IF EXISTS "terra_property_owner_idx";
DROP INDEX IF EXISTS "terra_property_active_idx";
DROP INDEX IF EXISTS "terra_property_zip_idx";
DROP INDEX IF EXISTS "terra_property_submarket_idx";
DROP INDEX IF EXISTS "terra_property_type_idx";
DROP TABLE IF EXISTS "terra_properties" CASCADE;

DROP INDEX IF EXISTS "terra_agent_created_idx";
DROP INDEX IF EXISTS "terra_agent_specialty_idx";
DROP INDEX IF EXISTS "terra_agent_status_idx";
DROP INDEX IF EXISTS "terra_agent_brokerage_idx";
DROP TABLE IF EXISTS "terra_agents" CASCADE;

DROP INDEX IF EXISTS "terra_brokerage_created_idx";
DROP INDEX IF EXISTS "terra_brokerage_status_idx";
DROP INDEX IF EXISTS "terra_brokerage_slug_idx";
DROP TABLE IF EXISTS "terra_brokerages" CASCADE;

COMMIT;
