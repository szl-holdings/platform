CREATE TABLE IF NOT EXISTS "terra_leases" (
  "id" serial PRIMARY KEY NOT NULL,
  "external_id" text UNIQUE,
  "document_name" text NOT NULL,
  "tenant" text NOT NULL,
  "premises" text,
  "property_address" text,
  "lease_type" text,
  "commencement_date" text,
  "expiration_date" text,
  "base_rent" numeric(16,2),
  "rent_per_sqft" numeric(10,2),
  "sqft" integer,
  "escalations" text,
  "options" jsonb NOT NULL DEFAULT '[]',
  "cam" numeric(14,2),
  "ti_allowance" numeric(14,2),
  "security_deposit" numeric(14,2),
  "termination_option" text,
  "exclusive_use" text,
  "co_tenancy" text,
  "confidence" integer NOT NULL DEFAULT 85,
  "flags" jsonb NOT NULL DEFAULT '[]',
  "raw_data" jsonb,
  "owner_user_id" integer,
  "is_demo" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_lease_tenant_idx" ON "terra_leases" ("tenant");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_lease_created_idx" ON "terra_leases" ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_lease_expiration_idx" ON "terra_leases" ("expiration_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_lease_owner_idx" ON "terra_leases" ("owner_user_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "terra_pro_forma_projects" (
  "id" serial PRIMARY KEY NOT NULL,
  "external_id" text UNIQUE,
  "project_name" text NOT NULL,
  "property_type" text,
  "inputs" jsonb NOT NULL DEFAULT '{}',
  "results" jsonb,
  "owner_name" text,
  "owner_user_id" integer,
  "is_demo" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_pro_forma_name_idx" ON "terra_pro_forma_projects" ("project_name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_pro_forma_created_idx" ON "terra_pro_forma_projects" ("created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "terra_exchanges_1031" (
  "id" serial PRIMARY KEY NOT NULL,
  "external_id" text UNIQUE,
  "relinquished_property" text NOT NULL,
  "relinquished_address" text,
  "sale_date" text,
  "sale_price" numeric(16,2),
  "adjusted_basis" numeric(16,2),
  "deferred_gain" numeric(16,2),
  "qi" text,
  "qi_contact" text,
  "status" text NOT NULL DEFAULT 'identification',
  "identification_deadline" text,
  "exchange_deadline" text,
  "identified_properties" jsonb NOT NULL DEFAULT '[]',
  "compliance_items" jsonb NOT NULL DEFAULT '[]',
  "tax_savings" numeric(14,2),
  "owner_user_id" integer,
  "is_demo" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_exchange_status_idx" ON "terra_exchanges_1031" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_exchange_created_idx" ON "terra_exchanges_1031" ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_exchange_owner_idx" ON "terra_exchanges_1031" ("owner_user_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "terra_tax_appeals" (
  "id" serial PRIMARY KEY NOT NULL,
  "external_id" text UNIQUE,
  "name" text NOT NULL,
  "address" text,
  "property_type" text,
  "sqft" integer,
  "assessed_value" numeric(16,2),
  "avm_value" numeric(16,2),
  "tax_rate" numeric(8,4),
  "over_assessed_pct" numeric(8,2),
  "annual_tax" numeric(14,2),
  "potential_savings" numeric(14,2),
  "appeal_deadline" text,
  "appeal_status" text NOT NULL DEFAULT 'eligible',
  "juris" text,
  "comparables" jsonb NOT NULL DEFAULT '[]',
  "appeal_strength" text NOT NULL DEFAULT 'moderate',
  "notes" text,
  "owner_user_id" integer,
  "is_demo" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_tax_appeal_status_idx" ON "terra_tax_appeals" ("appeal_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_tax_appeal_created_idx" ON "terra_tax_appeals" ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_tax_appeal_owner_idx" ON "terra_tax_appeals" ("owner_user_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "terra_waterfall_structures" (
  "id" serial PRIMARY KEY NOT NULL,
  "external_id" text UNIQUE,
  "name" text NOT NULL,
  "description" text,
  "inputs" jsonb NOT NULL DEFAULT '{}',
  "results" jsonb,
  "owner_name" text,
  "owner_user_id" integer,
  "is_demo" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_waterfall_name_idx" ON "terra_waterfall_structures" ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_waterfall_created_idx" ON "terra_waterfall_structures" ("created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "terra_construction_projects" (
  "id" serial PRIMARY KEY NOT NULL,
  "external_id" text UNIQUE,
  "name" text NOT NULL,
  "address" text,
  "type" text,
  "total_budget" numeric(16,2),
  "total_spent" numeric(16,2),
  "overall_pct" integer NOT NULL DEFAULT 0,
  "start_date" text,
  "projected_completion" text,
  "revised_completion" text,
  "status" text NOT NULL DEFAULT 'on-track',
  "gc" text,
  "architect" text,
  "milestones" jsonb NOT NULL DEFAULT '[]',
  "budget_lines" jsonb NOT NULL DEFAULT '[]',
  "photos" jsonb NOT NULL DEFAULT '[]',
  "owner_user_id" integer,
  "is_demo" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_construction_status_idx" ON "terra_construction_projects" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_construction_created_idx" ON "terra_construction_projects" ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_construction_owner_idx" ON "terra_construction_projects" ("owner_user_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "terra_tenant_applications" (
  "id" serial PRIMARY KEY NOT NULL,
  "external_id" text UNIQUE,
  "name" text NOT NULL,
  "type" text NOT NULL DEFAULT 'individual',
  "target_unit" text,
  "proposed_rent" numeric(14,2),
  "lease_term_months" integer,
  "submitted_date" text,
  "status" text NOT NULL DEFAULT 'pending',
  "overall_score" integer NOT NULL DEFAULT 50,
  "recommendation" text NOT NULL DEFAULT 'conditional',
  "credit_score" integer,
  "annual_income" numeric(14,2),
  "income_verified" boolean NOT NULL DEFAULT false,
  "rent_to_income_ratio" numeric(6,2),
  "prior_evictions" integer NOT NULL DEFAULT 0,
  "background_clear" boolean NOT NULL DEFAULT true,
  "screening_data" jsonb NOT NULL DEFAULT '{}',
  "flags" jsonb NOT NULL DEFAULT '[]',
  "notes" text,
  "owner_user_id" integer,
  "is_demo" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_tenant_status_idx" ON "terra_tenant_applications" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_tenant_recommendation_idx" ON "terra_tenant_applications" ("recommendation");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_tenant_created_idx" ON "terra_tenant_applications" ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_tenant_owner_idx" ON "terra_tenant_applications" ("owner_user_id");
--> statement-breakpoint

ALTER TABLE "terra_leases" ADD COLUMN IF NOT EXISTS "owner_user_id" integer;
--> statement-breakpoint
ALTER TABLE "terra_exchanges_1031" ADD COLUMN IF NOT EXISTS "owner_user_id" integer;
--> statement-breakpoint
ALTER TABLE "terra_tax_appeals" ADD COLUMN IF NOT EXISTS "owner_user_id" integer;
--> statement-breakpoint
ALTER TABLE "terra_construction_projects" ADD COLUMN IF NOT EXISTS "owner_user_id" integer;
--> statement-breakpoint
ALTER TABLE "terra_tenant_applications" ADD COLUMN IF NOT EXISTS "owner_user_id" integer;
