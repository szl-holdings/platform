-- Task #2638: Add a unique key on terra_properties so reseeding can't duplicate listings.
--
-- terra_properties only had a unique constraint on the (nullable) external_id
-- column, so any seed/import path that left external_id NULL could insert
-- duplicate property rows on every restart. Task #1217 worked around this in
-- terra-seed.ts with a coarse all-tables guard, but the underlying schema was
-- still fragile -- any other insert path bypassing that guard would duplicate.
--
-- This migration:
--   1. Repoints child FKs (terra_listings, terra_transactions) from any
--      duplicate property rows to the canonical (lowest-id) row, so we can
--      safely delete the duplicates without losing listing/transaction data.
--   2. Deletes the duplicate property rows.
--   3. Adds a unique index on (address, city, state) -- the only natural key
--      that's guaranteed non-null on every row -- so future inserts using
--      ON CONFLICT DO NOTHING are idempotent against reseed.

-- 1a. Repoint listings FKs to the canonical (min id) property per natural key.
WITH canonical AS (
  SELECT
    id,
    MIN(id) OVER (PARTITION BY address, city, state) AS canonical_id
  FROM terra_properties
)
UPDATE terra_listings AS l
SET property_id = c.canonical_id
FROM canonical AS c
WHERE l.property_id = c.id
  AND c.id <> c.canonical_id;

-- 1b. Repoint transactions FKs to the canonical property per natural key.
WITH canonical AS (
  SELECT
    id,
    MIN(id) OVER (PARTITION BY address, city, state) AS canonical_id
  FROM terra_properties
)
UPDATE terra_transactions AS t
SET property_id = c.canonical_id
FROM canonical AS c
WHERE t.property_id = c.id
  AND c.id <> c.canonical_id;

-- 2. Delete the now-orphaned duplicate property rows (keep min id per group).
DELETE FROM terra_properties
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY address, city, state ORDER BY id) AS rn
    FROM terra_properties
  ) ranked
  WHERE ranked.rn > 1
);

-- 3. Enforce the natural key going forward.
CREATE UNIQUE INDEX IF NOT EXISTS "terra_property_address_city_state_uniq"
  ON "terra_properties" ("address", "city", "state");
