-- Task #1912: Persist governance state across server restarts.
-- Adds two durable tables for governance state that previously lived in
-- in-memory Maps:
--   * guardian_tiers      — operator-editable tier definitions
--   * guardrail_configs   — runtime guardrail configurations
-- orgId NULL = global default for both tables.

CREATE TABLE IF NOT EXISTS "guardian_tiers" (
  "id" SERIAL PRIMARY KEY,
  "org_id" INTEGER REFERENCES "organizations"("id") ON DELETE CASCADE,
  "tier" TEXT NOT NULL,
  "tier_number" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "risk_level" INTEGER NOT NULL,
  "controls" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "updated_by_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "guardian_tiers_org_tier_idx" ON "guardian_tiers" ("org_id", "tier");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guardian_tiers_enabled_idx" ON "guardian_tiers" ("enabled");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "guardrail_configs" (
  "id" SERIAL PRIMARY KEY,
  "org_id" INTEGER REFERENCES "organizations"("id") ON DELETE CASCADE,
  "guardrail_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "guardrail_type" TEXT NOT NULL,
  "config" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "applies_to_tier" TEXT,
  "enforcement" TEXT NOT NULL DEFAULT 'enforce',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_by_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "guardrail_configs_org_guardrail_idx" ON "guardrail_configs" ("org_id", "guardrail_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guardrail_configs_type_idx" ON "guardrail_configs" ("guardrail_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guardrail_configs_tier_idx" ON "guardrail_configs" ("applies_to_tier");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guardrail_configs_enabled_idx" ON "guardrail_configs" ("enabled");
