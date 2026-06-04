-- NET-30 Enterprise Invoice Lifecycle
-- Adds 7 tables: net30_invoices, net30_invoice_line_items, net30_invoice_payments,
-- net30_credit_memos, net30_dunning_log, net30_dunning_config, net30_aging_snapshots
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "net30_invoices" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "invoice_number" text NOT NULL,
  "external_customer_id" text,
  "customer_name" text NOT NULL,
  "customer_email" text,
  "terms" text NOT NULL DEFAULT 'NET-30',
  "custom_terms_days" integer,
  "po_number" text,
  "billing_address" jsonb,
  "shipping_address" jsonb,
  "subtotal" numeric(14, 2) NOT NULL DEFAULT '0',
  "discount_amount" numeric(14, 2) NOT NULL DEFAULT '0',
  "discount_percent" numeric(5, 2),
  "tax_amount" numeric(14, 2) NOT NULL DEFAULT '0',
  "total_amount" numeric(14, 2) NOT NULL DEFAULT '0',
  "paid_amount" numeric(14, 2) NOT NULL DEFAULT '0',
  "credit_applied" numeric(14, 2) NOT NULL DEFAULT '0',
  "outstanding_balance" numeric(14, 2) NOT NULL DEFAULT '0',
  "currency" text NOT NULL DEFAULT 'usd',
  "status" text NOT NULL DEFAULT 'draft',
  "due_date" timestamp,
  "issued_date" timestamp,
  "sent_at" timestamp,
  "paid_at" timestamp,
  "stripe_invoice_id" text,
  "stripe_hosted_invoice_url" text,
  "stripe_pdf_url" text,
  "dunning_enabled" boolean NOT NULL DEFAULT true,
  "dunning_paused_at" timestamp,
  "last_dunning_at" timestamp,
  "next_dunning_at" timestamp,
  "dunning_step" integer NOT NULL DEFAULT 0,
  "collections_at" timestamp,
  "collections_packet_url" text,
  "notes" text,
  "internal_notes" text,
  "attachments" jsonb,
  "approved_by" integer,
  "approved_at" timestamp,
  "sent_by" integer,
  "metadata" jsonb,
  "created_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "net30_invoices_org_id_idx" ON "net30_invoices" ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "net30_invoices_status_idx" ON "net30_invoices" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "net30_invoices_due_date_idx" ON "net30_invoices" ("due_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "net30_invoices_invoice_number_idx" ON "net30_invoices" ("invoice_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "net30_invoices_next_dunning_idx" ON "net30_invoices" ("next_dunning_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "net30_invoice_line_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "invoice_id" integer NOT NULL REFERENCES "net30_invoices"("id") ON DELETE CASCADE,
  "description" text NOT NULL,
  "product_code" text,
  "quantity" numeric(12, 4) NOT NULL DEFAULT '1',
  "unit_price" numeric(14, 2) NOT NULL,
  "line_total" numeric(14, 2) NOT NULL,
  "taxable" boolean NOT NULL DEFAULT false,
  "tax_category" text,
  "sort_order" integer NOT NULL DEFAULT 0,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "net30_line_items_invoice_id_idx" ON "net30_invoice_line_items" ("invoice_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "net30_invoice_payments" (
  "id" serial PRIMARY KEY NOT NULL,
  "invoice_id" integer NOT NULL REFERENCES "net30_invoices"("id") ON DELETE CASCADE,
  "amount" numeric(14, 2) NOT NULL,
  "currency" text NOT NULL DEFAULT 'usd',
  "method" text NOT NULL DEFAULT 'stripe',
  "reference" text,
  "stripe_payment_intent_id" text,
  "stripe_charge_id" text,
  "paid_at" timestamp NOT NULL,
  "recorded_by" integer,
  "notes" text,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "net30_payments_invoice_id_idx" ON "net30_invoice_payments" ("invoice_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "net30_payments_paid_at_idx" ON "net30_invoice_payments" ("paid_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "net30_credit_memos" (
  "id" serial PRIMARY KEY NOT NULL,
  "invoice_id" integer NOT NULL REFERENCES "net30_invoices"("id") ON DELETE CASCADE,
  "org_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "memo_number" text NOT NULL,
  "amount" numeric(14, 2) NOT NULL,
  "currency" text NOT NULL DEFAULT 'usd',
  "reason" text NOT NULL DEFAULT 'other',
  "description" text,
  "applied_at" timestamp NOT NULL DEFAULT now(),
  "created_by" integer,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "net30_credit_memos_invoice_id_idx" ON "net30_credit_memos" ("invoice_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "net30_credit_memos_org_id_idx" ON "net30_credit_memos" ("org_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "net30_dunning_log" (
  "id" serial PRIMARY KEY NOT NULL,
  "invoice_id" integer NOT NULL REFERENCES "net30_invoices"("id") ON DELETE CASCADE,
  "org_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "step" integer NOT NULL,
  "days_overdue" integer NOT NULL,
  "recipient" text NOT NULL,
  "template" text NOT NULL DEFAULT 'standard_reminder',
  "subject" text,
  "success" boolean NOT NULL DEFAULT false,
  "error" text,
  "message_id" text,
  "dispatched_at" timestamp NOT NULL DEFAULT now(),
  "metadata" jsonb
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "net30_dunning_log_invoice_id_idx" ON "net30_dunning_log" ("invoice_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "net30_dunning_log_dispatched_at_idx" ON "net30_dunning_log" ("dispatched_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "net30_dunning_config" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "cadence_days" jsonb NOT NULL DEFAULT '[3,7,14,21]',
  "template_name" text NOT NULL DEFAULT 'standard_reminder',
  "enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "net30_dunning_config_org_id_idx" ON "net30_dunning_config" ("org_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "net30_aging_snapshots" (
  "id" serial PRIMARY KEY NOT NULL,
  "org_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "snapshot_date" timestamp NOT NULL,
  "current" numeric(14, 2) NOT NULL DEFAULT '0',
  "bucket_1_30" numeric(14, 2) NOT NULL DEFAULT '0',
  "bucket_31_60" numeric(14, 2) NOT NULL DEFAULT '0',
  "bucket_61_90" numeric(14, 2) NOT NULL DEFAULT '0',
  "bucket_90_plus" numeric(14, 2) NOT NULL DEFAULT '0',
  "total_outstanding" numeric(14, 2) NOT NULL DEFAULT '0',
  "invoice_count" integer NOT NULL DEFAULT 0,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "net30_aging_snapshots_org_id_idx" ON "net30_aging_snapshots" ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "net30_aging_snapshots_snapshot_date_idx" ON "net30_aging_snapshots" ("snapshot_date");
