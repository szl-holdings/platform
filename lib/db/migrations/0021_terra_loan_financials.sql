-- Terra loan financials table
-- Stores quarterly lender financial statements (NOI, debt service, occupancy,
-- appraised value, outstanding balance) per loan agreement so covenant
-- measurement reads audited figures instead of distress-derived proxies.

CREATE TABLE IF NOT EXISTS "terra_loan_financials" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_agreement_id" text NOT NULL,
	"property_external_id" text NOT NULL,
	"statement_period" text NOT NULL,
	"statement_date" text NOT NULL,
	"source" text DEFAULT 'lender-portal' NOT NULL,
	"noi" numeric(16, 2),
	"debt_service" numeric(16, 2),
	"occupancy_rate" numeric(5, 4),
	"appraised_value" numeric(16, 2),
	"outstanding_balance" numeric(16, 2),
	"is_audited" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"ingested_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "terra_loan_fin_loan_idx" ON "terra_loan_financials" ("loan_agreement_id");
CREATE INDEX IF NOT EXISTS "terra_loan_fin_property_idx" ON "terra_loan_financials" ("property_external_id");
CREATE INDEX IF NOT EXISTS "terra_loan_fin_period_idx" ON "terra_loan_financials" ("statement_period");
CREATE INDEX IF NOT EXISTS "terra_loan_fin_date_idx" ON "terra_loan_financials" ("statement_date");
CREATE UNIQUE INDEX IF NOT EXISTS "terra_loan_fin_loan_period_uniq" ON "terra_loan_financials" ("loan_agreement_id","statement_period");
