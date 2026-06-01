ALTER TABLE "lyte_pressure_cells"
  ADD COLUMN IF NOT EXISTS "acknowledged_by" text;

ALTER TABLE "lyte_pressure_cells"
  ADD COLUMN IF NOT EXISTS "acknowledged_at" timestamp with time zone;
