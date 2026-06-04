-- Migration: Add tenant scope (org_id) to terra_covenants (RR-18 / Track 4 §2.1)
--
-- terra_covenants previously had no organization scope, meaning rows from
-- different tenants were indistinguishable. This migration:
--   1. Ensures the bootstrap demo organization (id=1) exists.
--   2. Adds nullable org_id so existing rows can be backfilled in-place.
--   3. Backfills all existing rows to the bootstrap org.
--   4. Tightens to NOT NULL with FK to organizations.id ON DELETE CASCADE.
--   5. Replaces the (property_external_id, covenant_type) unique index with
--      (org_id, property_external_id, covenant_type) so two tenants can hold
--      covenants on the same external property without colliding.

-- 1. Defensive: ensure bootstrap org id=1 exists for backfill.
INSERT INTO "organizations" (id, name, slug, org_type, plan)
VALUES (1, 'SZL Holdings (Demo)', 'szl-holdings-demo', 'internal', 'enterprise')
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint

SELECT setval(
  pg_get_serial_sequence('organizations', 'id'),
  GREATEST((SELECT MAX(id) FROM organizations), 1)
);
--> statement-breakpoint

-- 2. Add nullable column (idempotent).
ALTER TABLE "terra_covenants"
  ADD COLUMN IF NOT EXISTS "org_id" integer;
--> statement-breakpoint

-- 3. Backfill any pre-existing rows to the bootstrap demo org.
UPDATE "terra_covenants"
   SET "org_id" = 1
 WHERE "org_id" IS NULL;
--> statement-breakpoint

-- 4a. Enforce NOT NULL now that all rows are populated.
ALTER TABLE "terra_covenants"
  ALTER COLUMN "org_id" SET NOT NULL;
--> statement-breakpoint

-- 4b. Add FK constraint (drop-then-add for idempotent re-runs).
ALTER TABLE "terra_covenants"
  DROP CONSTRAINT IF EXISTS "terra_covenants_org_id_fkey";
--> statement-breakpoint

ALTER TABLE "terra_covenants"
  ADD CONSTRAINT "terra_covenants_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "terra_covenant_org_idx"
  ON "terra_covenants" ("org_id");
--> statement-breakpoint

-- 5. Replace the legacy (property_external_id, covenant_type) unique index
--    with one scoped by org_id. Two tenants tracking the same external property
--    must not collide on the unique constraint.
DROP INDEX IF EXISTS "terra_covenant_property_type_uq";
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "terra_covenant_org_property_type_uq"
  ON "terra_covenants" ("org_id", "property_external_id", "covenant_type");
--> statement-breakpoint

COMMENT ON COLUMN "terra_covenants"."org_id" IS
  'Tenant scope — every covenant belongs to exactly one organization (RR-18).';
