CREATE TABLE IF NOT EXISTS "deployments" (
  "id" serial PRIMARY KEY NOT NULL,
  "app_id" text NOT NULL,
  "app_name" text NOT NULL,
  "version" text NOT NULL,
  "environment" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "deployed_at" timestamp DEFAULT now() NOT NULL,
  "deployed_by" text DEFAULT 'system' NOT NULL,
  "commit_sha" text,
  "notes" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deployments_app_env_idx" ON "deployments" ("app_id","environment");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deployments_deployed_at_idx" ON "deployments" ("deployed_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deployments_status_idx" ON "deployments" ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "deployments_one_active_per_app_env_idx"
  ON "deployments" ("app_id","environment")
  WHERE "status" = 'active';
