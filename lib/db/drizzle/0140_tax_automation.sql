-- Tax Automation Beyond Stripe Tax Defaults
-- Task #2962: Exemption certificates, tax IDs, category overrides,
-- and extended billing_tax_calculations audit fields.
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "tax_ids" (
    "id" serial PRIMARY KEY NOT NULL,
    "org_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "tax_id_type" text NOT NULL,
    "tax_id_value" text NOT NULL,
    "jurisdiction" text NOT NULL,
    "validated_at" timestamp,
    "validation_status" text NOT NULL DEFAULT 'pending',
    "validation_response" jsonb,
    "is_active" boolean NOT NULL DEFAULT true,
    "metadata" jsonb,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tax_ids_org_id_idx" ON "tax_ids" ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tax_ids_jurisdiction_idx" ON "tax_ids" ("jurisdiction");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tax_ids_type_idx" ON "tax_ids" ("tax_id_type");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "tax_exemption_certificates" (
    "id" serial PRIMARY KEY NOT NULL,
    "org_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "certificate_number" text,
    "jurisdiction" text NOT NULL,
    "exemption_type" text NOT NULL DEFAULT 'resale',
    "file_url" text,
    "issued_at" timestamp,
    "expires_at" timestamp,
    "status" text NOT NULL DEFAULT 'active',
    "reviewed_by" integer,
    "reviewed_at" timestamp,
    "notes" text,
    "metadata" jsonb,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tax_exemption_certs_org_id_idx" ON "tax_exemption_certificates" ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tax_exemption_certs_jurisdiction_idx" ON "tax_exemption_certificates" ("jurisdiction");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tax_exemption_certs_expires_at_idx" ON "tax_exemption_certificates" ("expires_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tax_exemption_certs_status_idx" ON "tax_exemption_certificates" ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "tax_category_overrides" (
    "id" serial PRIMARY KEY NOT NULL,
    "org_id" integer REFERENCES "organizations"("id") ON DELETE CASCADE,
    "scope" text NOT NULL,
    "scope_ref" text NOT NULL,
    "jurisdiction" text NOT NULL,
    "tax_behavior" text NOT NULL DEFAULT 'taxable',
    "tax_code" text,
    "tax_rate" numeric(6, 4),
    "reason_code" text NOT NULL,
    "description" text,
    "is_active" boolean NOT NULL DEFAULT true,
    "applied_by" integer,
    "expires_at" timestamp,
    "metadata" jsonb,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tax_category_overrides_scope_ref_idx" ON "tax_category_overrides" ("scope", "scope_ref");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tax_category_overrides_org_id_idx" ON "tax_category_overrides" ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tax_category_overrides_jurisdiction_idx" ON "tax_category_overrides" ("jurisdiction");
--> statement-breakpoint

-- Extend billing_tax_calculations with full audit fields
ALTER TABLE "billing_tax_calculations"
    ADD COLUMN IF NOT EXISTS "input_snapshot" jsonb,
    ADD COLUMN IF NOT EXISTS "basis_amount" numeric(10, 2),
    ADD COLUMN IF NOT EXISTS "exemption_applied" text,
    ADD COLUMN IF NOT EXISTS "source" text NOT NULL DEFAULT 'stripe_tax',
    ADD COLUMN IF NOT EXISTS "reverse_charge" boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "override_reason" text,
    ADD COLUMN IF NOT EXISTS "tamper_hash" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "billing_tax_calculations_source_idx" ON "billing_tax_calculations" ("source");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "billing_tax_calculations_jurisdiction_idx" ON "billing_tax_calculations" ("jurisdiction");
