-- FORGE Model Foundry — governed fine-tuning pipeline persistence.
-- Stores foundry runs (with full state in `data` jsonb) and per-tenant budgets.

CREATE TABLE IF NOT EXISTS "model_foundry_runs" (
  "id"                  serial PRIMARY KEY NOT NULL,
  "run_id"              text NOT NULL UNIQUE,
  "tenant_id"           text NOT NULL,
  "agent_id"            text NOT NULL,
  "family_id"           text NOT NULL,
  "dataset_id"          text NOT NULL,
  "stage"               text NOT NULL,
  "risk_tier"           text NOT NULL DEFAULT 'standard',
  "hf_job_id"           text,
  "hf_mode"             text NOT NULL DEFAULT 'simulated',
  "published_model_id"  text,
  "model_card_sha"      text,
  "est_cost_usd"        real NOT NULL DEFAULT 0,
  "budget_cap_usd"      real,
  "dataset_hash"        text,
  "dataset_bytes"       integer,
  "provenance_proof_id" integer,
  "model_card_proof_id" integer,
  "created_by"          text,
  "approved_by"         text,
  "data"                jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at"          timestamptz NOT NULL DEFAULT NOW(),
  "updated_at"          timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "model_foundry_runs_tenant_idx" ON "model_foundry_runs" ("tenant_id");
CREATE INDEX IF NOT EXISTS "model_foundry_runs_stage_idx"  ON "model_foundry_runs" ("stage");
CREATE INDEX IF NOT EXISTS "model_foundry_runs_created_idx" ON "model_foundry_runs" ("created_at" DESC);

CREATE TABLE IF NOT EXISTS "model_foundry_tenant_budgets" (
  "tenant_id"        text PRIMARY KEY NOT NULL,
  "monthly_cap_usd"  real NOT NULL DEFAULT 50,
  "per_run_cap_usd"  real NOT NULL DEFAULT 5,
  "updated_at"       timestamptz NOT NULL DEFAULT NOW()
);

-- Seed sensible defaults for known tenants. Idempotent.
INSERT INTO "model_foundry_tenant_budgets" ("tenant_id", "monthly_cap_usd", "per_run_cap_usd") VALUES
  ('vessels', 100, 8),
  ('sentra',  100, 8),
  ('counsel',  75, 6),
  ('terra',    75, 6),
  ('a11oy',   150, 10)
ON CONFLICT ("tenant_id") DO NOTHING;
