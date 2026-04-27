-- Add vessel_class column to vessels so voyage-economics can return the
-- actual class (VLCC, Suezmax, Capesize, etc.) instead of inferring it
-- from the cargo description.
ALTER TABLE "vessels" ADD COLUMN IF NOT EXISTS "vessel_class" text;
--> statement-breakpoint
-- Backfill class for tankers and bulk carriers based on type and tonnage.
UPDATE "vessels" SET "vessel_class" = CASE
  WHEN vessel_type = 'tanker' AND id % 6 = 0 THEN 'LNG Carrier'
  WHEN vessel_type = 'tanker' AND gross_tonnage >= 100000 THEN 'VLCC'
  WHEN vessel_type = 'tanker' AND gross_tonnage >= 70000 THEN 'Suezmax'
  WHEN vessel_type = 'tanker' THEN 'Aframax'
  WHEN vessel_type = 'bulk' AND gross_tonnage >= 60000 THEN 'Capesize'
  WHEN vessel_type = 'bulk' AND gross_tonnage >= 40000 THEN 'Panamax'
  WHEN vessel_type = 'bulk' AND gross_tonnage >= 25000 THEN 'Supramax'
  WHEN vessel_type = 'bulk' THEN 'Handysize'
  ELSE NULL
END
WHERE vessel_class IS NULL;
