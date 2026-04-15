CREATE TABLE IF NOT EXISTS "terra_action_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "external_id" text UNIQUE,
  "property_id" text NOT NULL,
  "issue" text NOT NULL,
  "severity" text DEFAULT 'medium' NOT NULL,
  "owner_name" text NOT NULL,
  "owner_role" text NOT NULL,
  "due_date" text,
  "status" text DEFAULT 'open' NOT NULL,
  "recommended_action" text,
  "resolved_at" timestamp,
  "is_demo" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "terra_action_property_idx" ON "terra_action_items" ("property_id");
CREATE INDEX IF NOT EXISTS "terra_action_status_idx" ON "terra_action_items" ("status");
CREATE INDEX IF NOT EXISTS "terra_action_severity_idx" ON "terra_action_items" ("severity");
CREATE INDEX IF NOT EXISTS "terra_action_created_idx" ON "terra_action_items" ("created_at");
