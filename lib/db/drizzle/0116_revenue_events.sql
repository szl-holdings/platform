CREATE TABLE IF NOT EXISTS "revenue_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"product" text DEFAULT 'lyte' NOT NULL,
	"customer_id" text,
	"subscription_id" text,
	"invoice_id" text,
	"amount" numeric(12, 2),
	"currency" text DEFAULT 'usd' NOT NULL,
	"idempotency_key" text,
	"metadata" jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "revenue_events_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revenue_events_product_idx" ON "revenue_events" USING btree ("product");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revenue_events_event_type_idx" ON "revenue_events" USING btree ("event_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revenue_events_customer_idx" ON "revenue_events" USING btree ("customer_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revenue_events_occurred_at_idx" ON "revenue_events" USING btree ("occurred_at");
