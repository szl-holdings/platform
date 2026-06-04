-- Platform-wide and per-tenant settings tables
-- These were defined in the Drizzle schema (lib/db/src/schema/settings.ts)
-- but missing from the incremental migrations. Using IF NOT EXISTS for idempotency.

CREATE TABLE IF NOT EXISTS "platform_settings" (
  "id" serial PRIMARY KEY,
  "namespace" text NOT NULL,
  "key" text NOT NULL,
  "value" jsonb,
  "value_type" text NOT NULL DEFAULT 'string',
  "label" text,
  "description" text,
  "category" text NOT NULL DEFAULT 'general',
  "is_public" boolean NOT NULL DEFAULT false,
  "created_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "updated_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "platform_settings_ns_key_uq"
  ON "platform_settings" ("namespace", "key");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenant_settings" (
  "id" serial PRIMARY KEY,
  "org_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "namespace" text NOT NULL,
  "key" text NOT NULL,
  "value" jsonb,
  "value_type" text NOT NULL DEFAULT 'string',
  "label" text,
  "category" text NOT NULL DEFAULT 'general',
  "created_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "updated_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_settings_org_ns_key_uq"
  ON "tenant_settings" ("org_id", "namespace", "key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_settings_org_idx"
  ON "tenant_settings" ("org_id");
