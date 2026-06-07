-- Sync state for Command portal directive cascade, coalition partners, and
-- strategic reserve drawdowns. Previously stored in browser localStorage; now
-- persisted to PostgreSQL so changes are shared across devices.

CREATE TABLE IF NOT EXISTS "command_directives" (
  "id" text PRIMARY KEY,
  "tenant_id" text NOT NULL DEFAULT '_global_',
  "title" text NOT NULL,
  "body" text NOT NULL,
  "priority" text NOT NULL,
  "status" text NOT NULL,
  "classification" text NOT NULL,
  "issued_by" text NOT NULL,
  "issued_at" timestamptz NOT NULL,
  "cascaded_to" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "cascade_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "command_directives_tenant_idx"
  ON "command_directives" ("tenant_id");

CREATE TABLE IF NOT EXISTS "command_coalition_partners" (
  "id" text PRIMARY KEY,
  "tenant_id" text NOT NULL DEFAULT '_global_',
  "name" text NOT NULL,
  "role" text NOT NULL,
  "domain" text NOT NULL,
  "trust_score" integer NOT NULL,
  "status" text NOT NULL,
  "classification" text NOT NULL,
  "last_contact" timestamptz NOT NULL,
  "notes" text NOT NULL DEFAULT '',
  "alerts" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "command_coalition_partners_tenant_idx"
  ON "command_coalition_partners" ("tenant_id");

CREATE TABLE IF NOT EXISTS "command_reserve_pools" (
  "id" text PRIMARY KEY,
  "tenant_id" text NOT NULL DEFAULT '_global_',
  "name" text NOT NULL,
  "category" text NOT NULL,
  "total_capacity" real NOT NULL,
  "current_level" real NOT NULL,
  "unit" text NOT NULL,
  "status" text NOT NULL,
  "classification" text NOT NULL,
  "last_drawdown" timestamptz,
  "notes" text NOT NULL DEFAULT '',
  "trend_history" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "command_reserve_pools_tenant_idx"
  ON "command_reserve_pools" ("tenant_id");

CREATE TABLE IF NOT EXISTS "command_drawdown_requests" (
  "id" text PRIMARY KEY,
  "tenant_id" text NOT NULL DEFAULT '_global_',
  "pool_id" text NOT NULL,
  "amount" real NOT NULL,
  "justification" text NOT NULL,
  "requested_by" text NOT NULL,
  "requested_at" timestamptz NOT NULL,
  "status" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "command_drawdown_requests_tenant_idx"
  ON "command_drawdown_requests" ("tenant_id");
CREATE INDEX IF NOT EXISTS "command_drawdown_requests_pool_idx"
  ON "command_drawdown_requests" ("pool_id");
