-- Terra Broker Command Schema
-- Adds 6 tables for brokerage, agent, property, listing, inquiry, and transaction management.
-- Source of truth: lib/db/src/schema/terra.ts (Drizzle ORM). Applied via drizzle-kit push.

CREATE TABLE IF NOT EXISTS "terra_brokerages" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "license_number" text,
  "city" text NOT NULL,
  "state" text NOT NULL,
  "specialty" text,
  "head_count" integer NOT NULL DEFAULT 1,
  "active_listings" integer NOT NULL DEFAULT 0,
  "closed_volume_ltm" numeric(16,2),
  "status" text NOT NULL DEFAULT 'active',
  "is_demo" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "terra_brokerage_slug_idx" ON "terra_brokerages" ("slug");
CREATE INDEX IF NOT EXISTS "terra_brokerage_status_idx" ON "terra_brokerages" ("status");
CREATE INDEX IF NOT EXISTS "terra_brokerage_created_idx" ON "terra_brokerages" ("created_at");

CREATE TABLE IF NOT EXISTS "terra_agents" (
  "id" serial PRIMARY KEY NOT NULL,
  "brokerage_id" integer REFERENCES "terra_brokerages"("id") ON DELETE SET NULL,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "phone" text,
  "license_number" text,
  "specialty" text NOT NULL DEFAULT 'office',
  "status" text NOT NULL DEFAULT 'active',
  "active_listings" integer NOT NULL DEFAULT 0,
  "closed_deals_ltm" integer NOT NULL DEFAULT 0,
  "close_rate_pct" numeric(5,2),
  "avg_days_to_contract" integer,
  "inquiry_conversion_pct" numeric(5,2),
  "last_activity_at" timestamp,
  "is_demo" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "terra_agent_brokerage_idx" ON "terra_agents" ("brokerage_id");
CREATE INDEX IF NOT EXISTS "terra_agent_status_idx" ON "terra_agents" ("status");
CREATE INDEX IF NOT EXISTS "terra_agent_specialty_idx" ON "terra_agents" ("specialty");
CREATE INDEX IF NOT EXISTS "terra_agent_created_idx" ON "terra_agents" ("created_at");

CREATE TABLE IF NOT EXISTS "terra_properties" (
  "id" serial PRIMARY KEY NOT NULL,
  "external_id" text UNIQUE,
  "address" text NOT NULL,
  "city" text NOT NULL,
  "state" text NOT NULL,
  "zip_code" text,
  "submarket" text,
  "property_type" text NOT NULL,
  "sqft" integer,
  "year_built" integer,
  "floors" integer,
  "units" integer,
  "parking_spaces" integer,
  "latitude" numeric(10,7),
  "longitude" numeric(10,7),
  "assessed_value" numeric(16,2),
  "zoning" text,
  "owner_name" text,
  "owner_type" text NOT NULL DEFAULT 'unknown',
  "is_active" boolean NOT NULL DEFAULT true,
  "is_demo" boolean NOT NULL DEFAULT false,
  "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "raw_data" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "terra_property_type_idx" ON "terra_properties" ("property_type");
CREATE INDEX IF NOT EXISTS "terra_property_submarket_idx" ON "terra_properties" ("submarket");
CREATE INDEX IF NOT EXISTS "terra_property_zip_idx" ON "terra_properties" ("zip_code");
CREATE INDEX IF NOT EXISTS "terra_property_active_idx" ON "terra_properties" ("is_active");
CREATE INDEX IF NOT EXISTS "terra_property_owner_idx" ON "terra_properties" ("owner_name");
CREATE INDEX IF NOT EXISTS "terra_property_owner_type_idx" ON "terra_properties" ("owner_type");
CREATE INDEX IF NOT EXISTS "terra_property_created_idx" ON "terra_properties" ("created_at");

CREATE TABLE IF NOT EXISTS "terra_listings" (
  "id" serial PRIMARY KEY NOT NULL,
  "external_id" text UNIQUE,
  "property_id" integer REFERENCES "terra_properties"("id") ON DELETE CASCADE,
  "agent_id" integer REFERENCES "terra_agents"("id") ON DELETE SET NULL,
  "brokerage_id" integer REFERENCES "terra_brokerages"("id") ON DELETE SET NULL,
  "status" text NOT NULL DEFAULT 'active',
  "list_price" numeric(16,2) NOT NULL,
  "price_per_sqft" numeric(10,2),
  "original_list_price" numeric(16,2),
  "cap_rate" numeric(5,2),
  "noi" numeric(14,2),
  "days_on_market" integer NOT NULL DEFAULT 0,
  "inquiry_count" integer NOT NULL DEFAULT 0,
  "view_count" integer NOT NULL DEFAULT 0,
  "price_reductions" integer NOT NULL DEFAULT 0,
  "list_date" text NOT NULL,
  "expiration_date" text,
  "closed_date" text,
  "closed_price" numeric(16,2),
  "opportunity_score" integer NOT NULL DEFAULT 50,
  "market_notes" text,
  "price_history" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "is_demo" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "terra_listing_status_idx" ON "terra_listings" ("status");
CREATE INDEX IF NOT EXISTS "terra_listing_agent_idx" ON "terra_listings" ("agent_id");
CREATE INDEX IF NOT EXISTS "terra_listing_brokerage_idx" ON "terra_listings" ("brokerage_id");
CREATE INDEX IF NOT EXISTS "terra_listing_property_idx" ON "terra_listings" ("property_id");
CREATE INDEX IF NOT EXISTS "terra_listing_created_idx" ON "terra_listings" ("created_at");
CREATE INDEX IF NOT EXISTS "terra_listing_score_idx" ON "terra_listings" ("opportunity_score");

CREATE TABLE IF NOT EXISTS "terra_inquiries" (
  "id" serial PRIMARY KEY NOT NULL,
  "listing_id" integer REFERENCES "terra_listings"("id") ON DELETE SET NULL,
  "assigned_agent_id" integer REFERENCES "terra_agents"("id") ON DELETE SET NULL,
  "buyer_name" text NOT NULL,
  "buyer_email" text,
  "buyer_phone" text,
  "buyer_type" text NOT NULL DEFAULT 'unknown',
  "financing_status" text NOT NULL DEFAULT 'unknown',
  "qualification_score" integer NOT NULL DEFAULT 50,
  "status" text NOT NULL DEFAULT 'new',
  "source" text NOT NULL DEFAULT 'other',
  "message" text,
  "routing_reason" text,
  "last_contact_at" timestamp,
  "next_follow_up_at" timestamp,
  "is_demo" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "terra_inquiry_listing_idx" ON "terra_inquiries" ("listing_id");
CREATE INDEX IF NOT EXISTS "terra_inquiry_agent_idx" ON "terra_inquiries" ("assigned_agent_id");
CREATE INDEX IF NOT EXISTS "terra_inquiry_status_idx" ON "terra_inquiries" ("status");
CREATE INDEX IF NOT EXISTS "terra_inquiry_created_idx" ON "terra_inquiries" ("created_at");
CREATE INDEX IF NOT EXISTS "terra_inquiry_score_idx" ON "terra_inquiries" ("qualification_score");

CREATE TABLE IF NOT EXISTS "terra_transactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "listing_id" integer REFERENCES "terra_listings"("id") ON DELETE SET NULL,
  "property_id" integer REFERENCES "terra_properties"("id") ON DELETE SET NULL,
  "agent_id" integer REFERENCES "terra_agents"("id") ON DELETE SET NULL,
  "brokerage_id" integer REFERENCES "terra_brokerages"("id") ON DELETE SET NULL,
  "buyer_name" text,
  "seller_name" text,
  "sale_price" numeric(16,2) NOT NULL,
  "list_price" numeric(16,2),
  "commission" numeric(14,2),
  "commission_pct" numeric(5,2),
  "days_on_market" integer,
  "days_to_close" integer,
  "closed_date" text NOT NULL,
  "financing_type" text NOT NULL DEFAULT 'conventional',
  "status" text NOT NULL DEFAULT 'completed',
  "notes" text,
  "is_demo" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "terra_transaction_agent_idx" ON "terra_transactions" ("agent_id");
CREATE INDEX IF NOT EXISTS "terra_transaction_brokerage_idx" ON "terra_transactions" ("brokerage_id");
CREATE INDEX IF NOT EXISTS "terra_transaction_property_idx" ON "terra_transactions" ("property_id");
CREATE INDEX IF NOT EXISTS "terra_transaction_closed_idx" ON "terra_transactions" ("closed_date");
CREATE INDEX IF NOT EXISTS "terra_transaction_status_idx" ON "terra_transactions" ("status");
