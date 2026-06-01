CREATE TABLE IF NOT EXISTS "partner_pilots" (
  "id" SERIAL PRIMARY KEY,
  "external_id" TEXT NOT NULL UNIQUE,
  "organization_id" INTEGER,
  "name" TEXT NOT NULL,
  "product" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'prospect',
  "tier" TEXT NOT NULL DEFAULT 'design-partner',
  "region" TEXT,
  "industry" TEXT,
  "primary_contact" TEXT,
  "contact_email" TEXT,
  "pilot_started_at" TIMESTAMP,
  "contract_value_usd" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_pilots_product_idx" ON "partner_pilots" ("product");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_pilots_status_idx" ON "partner_pilots" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_pilots_organization_idx" ON "partner_pilots" ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_pilots_created_at_idx" ON "partner_pilots" ("created_at");
