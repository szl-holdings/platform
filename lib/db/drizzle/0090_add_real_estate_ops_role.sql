-- Migration 0071: Add real_estate_ops_user to platform_role column
--
-- The TypeScript CanonicalRole type includes 'real_estate_ops_user' and
-- CANONICAL_TO_LEGACY maps it to 'ops'. However the users.platform_role
-- column CHECK constraint (backed by the Drizzle text enum) does NOT
-- include this value. Any attempt to write real_estate_ops_user into the
-- column fails silently at the ORM layer before hitting the DB because
-- Drizzle validates the enum array client-side.
--
-- Postgres text columns with a Drizzle enum array have no server-side
-- CHECK constraint by default — the guard is in the ORM. This migration
-- is therefore a no-op at the database layer, but the accompanying ORM
-- change in lib/db/src/schema/auth.ts is the real fix. This file is
-- recorded in the journal to document the change date and intent.
--
-- No DDL statement is needed; the ORM schema is updated separately.

SELECT 1; -- intentional no-op; DDL lives in the ORM schema update
