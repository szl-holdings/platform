-- Migration: Add denormalized org_id to vessels sub-resource tables (AF-007 Phase 2)
--
-- Adds nullable org_id to vessels_positions, vessels_cargo, and vessels_routes —
-- the sub-resource tables in the original AF-007 P1 finding scope that were not
-- covered by 0076 (which addressed only the parent tables).
--
-- The application layer enforces tenant isolation on these tables via
-- getVesselInOrg() on the parent vessel; the denormalized org_id column closes
-- the residual risk that a future query forgets the parent-ownership check, and
-- lets DB-level tooling (raw SQL, BI extracts, RLS) apply tenant scoping
-- uniformly.
--
-- Backfill is idempotent: only updates rows where org_id is still NULL, copying
-- from the parent vessels.org_id.

ALTER TABLE "vessels_positions" ADD COLUMN IF NOT EXISTS "org_id" integer;
ALTER TABLE "vessels_cargo"     ADD COLUMN IF NOT EXISTS "org_id" integer;
ALTER TABLE "vessels_routes"    ADD COLUMN IF NOT EXISTS "org_id" integer;

CREATE INDEX IF NOT EXISTS "vessels_positions_org_id_idx" ON "vessels_positions" ("org_id");
CREATE INDEX IF NOT EXISTS "vessels_cargo_org_id_idx"     ON "vessels_cargo"     ("org_id");
CREATE INDEX IF NOT EXISTS "vessels_routes_org_id_idx"    ON "vessels_routes"    ("org_id");

COMMENT ON COLUMN "vessels_positions".org_id IS
  'Tenant scope (denormalized from parent vessels.org_id).';
COMMENT ON COLUMN "vessels_cargo".org_id IS
  'Tenant scope (denormalized from parent vessels.org_id).';
COMMENT ON COLUMN "vessels_routes".org_id IS
  'Tenant scope (denormalized from parent vessels.org_id).';

UPDATE "vessels_positions" p
   SET "org_id" = v."org_id"
  FROM "vessels" v
 WHERE p."vessel_id" = v."id"
   AND p."org_id" IS NULL
   AND v."org_id" IS NOT NULL;

UPDATE "vessels_cargo" c
   SET "org_id" = v."org_id"
  FROM "vessels" v
 WHERE c."vessel_id" = v."id"
   AND c."org_id" IS NULL
   AND v."org_id" IS NOT NULL;

UPDATE "vessels_routes" r
   SET "org_id" = v."org_id"
  FROM "vessels" v
 WHERE r."vessel_id" = v."id"
   AND r."org_id" IS NULL
   AND v."org_id" IS NOT NULL;
