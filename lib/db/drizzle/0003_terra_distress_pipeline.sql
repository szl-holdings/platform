-- Terra Distress Engine: Property Records, Alerts, and Ingestion Runs
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "terra_distress_properties" (
    "id" serial PRIMARY KEY NOT NULL,
    "external_id" text UNIQUE,
    "address" text NOT NULL,
    "borough" text NOT NULL,
    "county" text NOT NULL,
    "zip_code" text,
    "property_type" text NOT NULL DEFAULT 'unknown',
    "distress_type" text NOT NULL,
    "stage" text NOT NULL,
    "estimated_value" numeric(14, 2) NOT NULL,
    "debt_amount" numeric(14, 2),
    "lien_amount" numeric(14, 2),
    "auction_date" text,
    "filing_date" text NOT NULL,
    "last_activity_date" text NOT NULL,
    "owner_name" text NOT NULL,
    "owner_type" text NOT NULL,
    "opportunity_score" integer NOT NULL DEFAULT 50,
    "confidence_level" text NOT NULL DEFAULT 'medium',
    "score_rationale" text NOT NULL DEFAULT '',
    "latitude" numeric(10, 7),
    "longitude" numeric(10, 7),
    "sqft" integer,
    "year_built" integer,
    "beds" integer,
    "baths" integer,
    "days_in_distress" integer NOT NULL DEFAULT 0,
    "tags" jsonb NOT NULL DEFAULT '[]',
    "timeline" jsonb NOT NULL DEFAULT '[]',
    "price_history" jsonb,
    "connector_source" text NOT NULL DEFAULT '',
    "notes" text,
    "linked_deal_id" text,
    "raw_data" jsonb,
    "ingest_source" text NOT NULL DEFAULT 'seed',
    "ingest_run_id" integer,
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "terra_distress_alerts" (
    "id" serial PRIMARY KEY NOT NULL,
    "external_id" text UNIQUE,
    "property_id" integer REFERENCES "terra_distress_properties"("id") ON DELETE CASCADE,
    "property_external_id" text,
    "alert_type" text NOT NULL,
    "message" text NOT NULL,
    "severity" text NOT NULL DEFAULT 'medium',
    "borough" text,
    "zip_code" text,
    "is_read" boolean NOT NULL DEFAULT false,
    "triggered_at" timestamp NOT NULL DEFAULT now(),
    "expires_at" timestamp,
    "metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "terra_ingestion_runs" (
    "id" serial PRIMARY KEY NOT NULL,
    "source" text NOT NULL,
    "status" text NOT NULL DEFAULT 'running',
    "records_fetched" integer NOT NULL DEFAULT 0,
    "records_inserted" integer NOT NULL DEFAULT 0,
    "records_skipped" integer NOT NULL DEFAULT 0,
    "records_failed" integer NOT NULL DEFAULT 0,
    "alerts_generated" integer NOT NULL DEFAULT 0,
    "error_message" text,
    "metadata" jsonb,
    "started_at" timestamp NOT NULL DEFAULT now(),
    "completed_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_distress_borough_idx" ON "terra_distress_properties" ("borough");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_distress_zip_idx" ON "terra_distress_properties" ("zip_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_distress_type_idx" ON "terra_distress_properties" ("distress_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_distress_score_idx" ON "terra_distress_properties" ("opportunity_score");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_distress_active_idx" ON "terra_distress_properties" ("is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_distress_auction_idx" ON "terra_distress_properties" ("auction_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_alert_property_idx" ON "terra_distress_alerts" ("property_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_alert_severity_idx" ON "terra_distress_alerts" ("severity");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_alert_type_idx" ON "terra_distress_alerts" ("alert_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_alert_borough_idx" ON "terra_distress_alerts" ("borough");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_ingestion_source_idx" ON "terra_ingestion_runs" ("source");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_ingestion_status_idx" ON "terra_ingestion_runs" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terra_distress_fts_idx" ON "terra_distress_properties"
  USING GIN (to_tsvector('english', address || ' ' || owner_name || ' ' || COALESCE(zip_code, '') || ' ' || borough));
