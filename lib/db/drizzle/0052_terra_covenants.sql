CREATE TABLE IF NOT EXISTS "terra_covenants" (
  "id" serial PRIMARY KEY NOT NULL,
  "external_id" text UNIQUE,
  "property_external_id" text NOT NULL,
  "property_address" text NOT NULL,
  "borough" text,
  "lender" text NOT NULL,
  "loan_agreement_id" text,
  "loan_agreement_url" text,
  "covenant_type" text NOT NULL,
  "label" text,
  "threshold_value" numeric(12,4) NOT NULL,
  "comparator" text NOT NULL DEFAULT 'gte',
  "remedy_period_days" integer NOT NULL DEFAULT 60,
  "required_approvers" jsonb NOT NULL DEFAULT '["terra-risk-officer"]',
  "active" boolean NOT NULL DEFAULT true,
  "is_demo" boolean NOT NULL DEFAULT false,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "last_evaluated_at" timestamp,
  "last_status" text,
  "last_measured_value" numeric(12,4),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_covenant_property_idx" ON "terra_covenants" ("property_external_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_covenant_lender_idx" ON "terra_covenants" ("lender");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_covenant_type_idx" ON "terra_covenants" ("covenant_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_covenant_active_idx" ON "terra_covenants" ("active");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "terra_covenant_property_type_uq" ON "terra_covenants" ("property_external_id", "covenant_type");
