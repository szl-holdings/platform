-- Migration: Add org_id to vessels parent tables for tenant isolation (AF-003 / AF-007 Phase 1)
--
-- The drizzle schema declares `orgId: integer("org_id")` on vessels_fleets,
-- vessels, and vessels_alert_rules. Routes filter by req.tenantOrgId via
-- tenantScope() and the *OrgWhere() helpers; this migration brings the database
-- into line so those filters have a column to match on.
--
-- Columns are nullable so existing rows continue to read as "platform" rows
-- visible only to elevated (super_admin / admin) users.
--
-- Phase 2 (sub-resource tables vessels_positions / vessels_cargo / vessels_routes)
-- is in a separate forward migration: 0094_vessels_subresource_org_id.sql.

ALTER TABLE "vessels_fleets"      ADD COLUMN IF NOT EXISTS "org_id" integer;
ALTER TABLE "vessels"             ADD COLUMN IF NOT EXISTS "org_id" integer;
ALTER TABLE "vessels_alert_rules" ADD COLUMN IF NOT EXISTS "org_id" integer;

CREATE INDEX IF NOT EXISTS "vessels_fleets_org_id_idx"      ON "vessels_fleets" ("org_id");
CREATE INDEX IF NOT EXISTS "vessels_org_id_idx"             ON "vessels" ("org_id");
CREATE INDEX IF NOT EXISTS "vessels_alert_rules_org_id_idx" ON "vessels_alert_rules" ("org_id");

COMMENT ON COLUMN "vessels_fleets".org_id IS
  'Tenant scope. NULL = platform row, visible only to elevated admins.';
COMMENT ON COLUMN "vessels".org_id IS
  'Tenant scope. NULL = platform row, visible only to elevated admins.';
COMMENT ON COLUMN "vessels_alert_rules".org_id IS
  'Tenant scope. NULL = platform row, visible only to elevated admins.';
