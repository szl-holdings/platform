ALTER TABLE "fund_inbound_deals" ADD COLUMN IF NOT EXISTS "notes" text;
--> statement-breakpoint
ALTER TABLE "fund_inbound_deals" ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
