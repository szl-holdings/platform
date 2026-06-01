CREATE TABLE IF NOT EXISTS "fund_portfolio_financials" (
  "id" serial PRIMARY KEY NOT NULL,
  "company_slug" text NOT NULL,
  "company_name" text NOT NULL,
  "period_type" text DEFAULT 'quarterly' NOT NULL,
  "period_label" text NOT NULL,
  "period_start" text NOT NULL,
  "period_end" text NOT NULL,
  "reporting_status" text DEFAULT 'draft' NOT NULL,
  "revenue" numeric(18, 2),
  "revenue_prior_period" numeric(18, 2),
  "gross_profit" numeric(18, 2),
  "gross_margin_pct" numeric(8, 4),
  "operating_expenses" numeric(18, 2),
  "ebitda" numeric(18, 2),
  "net_income" numeric(18, 2),
  "cogs" numeric(18, 2),
  "sales_marketing_expense" numeric(18, 2),
  "rd_expense" numeric(18, 2),
  "ga_expense" numeric(18, 2),
  "cash_and_equivalents" numeric(18, 2),
  "total_assets" numeric(18, 2),
  "total_liabilities" numeric(18, 2),
  "total_equity" numeric(18, 2),
  "accounts_receivable" numeric(18, 2),
  "accounts_payable" numeric(18, 2),
  "deferred_revenue" numeric(18, 2),
  "operating_cash_flow" numeric(18, 2),
  "investing_cash_flow" numeric(18, 2),
  "financing_cash_flow" numeric(18, 2),
  "free_cash_flow" numeric(18, 2),
  "burn_rate" numeric(18, 2),
  "runway_months" numeric(6, 1),
  "capital_raised" numeric(18, 2),
  "notes" text,
  "metadata" jsonb,
  "submitted_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fund_financials_company_idx" ON "fund_portfolio_financials" ("company_slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fund_financials_period_idx" ON "fund_portfolio_financials" ("period_label");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fund_financials_status_idx" ON "fund_portfolio_financials" ("reporting_status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fund_portfolio_kpis" (
  "id" serial PRIMARY KEY NOT NULL,
  "company_slug" text NOT NULL,
  "company_name" text NOT NULL,
  "period_label" text NOT NULL,
  "period_start" text NOT NULL,
  "period_end" text NOT NULL,
  "mrr" numeric(18, 2),
  "arr" numeric(18, 2),
  "mrr_growth_pct" numeric(8, 4),
  "total_customers" integer,
  "new_customers" integer,
  "churned_customers" integer,
  "churn_rate_pct" numeric(8, 4),
  "net_revenue_retention_pct" numeric(8, 4),
  "cac" numeric(18, 2),
  "ltv" numeric(18, 2),
  "ltv_cac_ratio" numeric(8, 4),
  "magic_number" numeric(8, 4),
  "payback_period_months" numeric(6, 1),
  "avg_contract_value" numeric(18, 2),
  "headcount" integer,
  "revenue_per_employee" numeric(18, 2),
  "notes" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fund_kpis_company_idx" ON "fund_portfolio_kpis" ("company_slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fund_kpis_period_idx" ON "fund_portfolio_kpis" ("period_label");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fund_lp_reports" (
  "id" serial PRIMARY KEY NOT NULL,
  "report_type" text DEFAULT 'quarterly' NOT NULL,
  "reporting_period" text NOT NULL,
  "period_start" text NOT NULL,
  "period_end" text NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "gross_irr" numeric(8, 4),
  "net_irr" numeric(8, 4),
  "tvpi" numeric(8, 4),
  "dpi" numeric(8, 4),
  "rvpi" numeric(8, 4),
  "pme" numeric(8, 4),
  "fund_nav" numeric(18, 2),
  "total_commitments" numeric(18, 2),
  "called_capital" numeric(18, 2),
  "distributed_capital" numeric(18, 2),
  "unrealized_value" numeric(18, 2),
  "management_fees_accrued" numeric(18, 2),
  "management_fees_paid" numeric(18, 2),
  "carried_interest_accrued" numeric(18, 2),
  "carried_interest_paid" numeric(18, 2),
  "preferred_return_rate" numeric(6, 4),
  "carry_rate" numeric(6, 4),
  "management_fee_rate" numeric(6, 4),
  "narrative_summary" text,
  "disclosures" text,
  "disclaimers" text,
  "approved_by" text,
  "approved_at" timestamp,
  "distributed_at" timestamp,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fund_lp_reports_period_idx" ON "fund_lp_reports" ("reporting_period");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fund_lp_reports_status_idx" ON "fund_lp_reports" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fund_lp_reports_type_idx" ON "fund_lp_reports" ("report_type");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fund_nav_records" (
  "id" serial PRIMARY KEY NOT NULL,
  "nav_date" text NOT NULL,
  "total_nav_cents" bigint NOT NULL,
  "called_capital_cents" bigint NOT NULL,
  "uncalled_commitments_cents" bigint DEFAULT 0 NOT NULL,
  "distributed_cents" bigint DEFAULT 0 NOT NULL,
  "unrealized_value_cents" bigint DEFAULT 0 NOT NULL,
  "management_fees_paid_cents" bigint DEFAULT 0 NOT NULL,
  "carry_accrued_cents" bigint DEFAULT 0 NOT NULL,
  "gross_irr" numeric(8, 4),
  "net_irr" numeric(8, 4),
  "tvpi" numeric(8, 4),
  "dpi" numeric(8, 4),
  "rvpi" numeric(8, 4),
  "notes" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fund_nav_date_idx" ON "fund_nav_records" ("nav_date");
