-- Migration: Add org_id to vessels tables for tenant isolation (Task #1048, AF-003 / AF-007)
-- The drizzle schema in lib/db/src/schema/vessels.ts has declared
-- `orgId: integer("org_id")` on vessels_fleets, vessels, and vessels_alert_rules
-- since the original tenant-scoping work, but the column had not been pushed to
-- the live DB. The vessels routes (artifacts/api-server/src/routes/vessels.ts)
-- already filter every fleet/vessel/alert-rule query by req.tenantOrgId via the
-- tenantScope() middleware and the *OrgWhere() helpers; this migration brings
-- the database into line so those filters actually have a column to match on.
--
-- Columns are nullable so existing rows continue to read as "platform" rows
-- visible only to elevated (super_admin / admin) users — matches the comment
-- block in routes/vessels.ts:251-257 explaining the NULL-row semantics.

ALTER TABLE "vessels_fleets"      ADD COLUMN IF NOT EXISTS "org_id" integer;
ALTER TABLE "vessels"             ADD COLUMN IF NOT EXISTS "org_id" integer;
ALTER TABLE "vessels_alert_rules" ADD COLUMN IF NOT EXISTS "org_id" integer;

CREATE INDEX IF NOT EXISTS "vessels_fleets_org_id_idx"      ON "vessels_fleets" ("org_id");
CREATE INDEX IF NOT EXISTS "vessels_org_id_idx"             ON "vessels" ("org_id");
CREATE INDEX IF NOT EXISTS "vessels_alert_rules_org_id_idx" ON "vessels_alert_rules" ("org_id");

COMMENT ON COLUMN "vessels_fleets".org_id IS
  'Tenant scope. NULL = platform row, visible only to elevated admins. Set to the requesting org by tenantScope() in artifacts/api-server/src/routes/vessels.ts.';
COMMENT ON COLUMN "vessels".org_id IS
  'Tenant scope. NULL = platform row, visible only to elevated admins. Set to the requesting org by tenantScope() in artifacts/api-server/src/routes/vessels.ts.';
COMMENT ON COLUMN "vessels_alert_rules".org_id IS
  'Tenant scope. NULL = platform row, visible only to elevated admins. Set to the requesting org by tenantScope() in artifacts/api-server/src/routes/vessels.ts.';
