ALTER TABLE IF EXISTS "pc_matters" ADD COLUMN IF NOT EXISTS "practice_area" text;
--> statement-breakpoint
ALTER TABLE IF EXISTS "pc_matters" ADD COLUMN IF NOT EXISTS "date_of_loss" timestamp;
--> statement-breakpoint
ALTER TABLE IF EXISTS "pc_matters" ADD COLUMN IF NOT EXISTS "service_date" timestamp;
--> statement-breakpoint
ALTER TABLE IF EXISTS "pc_matters" ADD COLUMN IF NOT EXISTS "incident_date" timestamp;
--> statement-breakpoint
ALTER TABLE IF EXISTS "pc_matters" ADD COLUMN IF NOT EXISTS "discovery_date" timestamp;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pc_matters_practice_area_idx" ON "pc_matters" ("practice_area");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pc_matters_date_of_loss_idx" ON "pc_matters" ("date_of_loss");
