CREATE TABLE IF NOT EXISTS "operator_model_registry" (
  "id" text PRIMARY KEY,
  "hf_model_id" text NOT NULL,
  "display_name" text NOT NULL,
  "provider" text NOT NULL DEFAULT 'huggingface',
  "capabilities" jsonb NOT NULL DEFAULT '[]',
  "tier" text NOT NULL DEFAULT 'local',
  "context_window" integer NOT NULL DEFAULT 4096,
  "max_output_tokens" integer NOT NULL DEFAULT 1024,
  "input_cost_per_1k_tokens" real NOT NULL DEFAULT 0,
  "output_cost_per_1k_tokens" real NOT NULL DEFAULT 0,
  "license" text NOT NULL DEFAULT 'unknown',
  "description" text NOT NULL DEFAULT '',
  "is_active" boolean NOT NULL DEFAULT true,
  "seeded" boolean NOT NULL DEFAULT false,
  "created_by" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "omr_hf_model_id_idx" ON "operator_model_registry" ("hf_model_id");
CREATE INDEX IF NOT EXISTS "omr_provider_idx" ON "operator_model_registry" ("provider");
CREATE INDEX IF NOT EXISTS "omr_active_idx" ON "operator_model_registry" ("is_active");

CREATE TABLE IF NOT EXISTS "governance_gate_config" (
  "id" serial PRIMARY KEY,
  "model_registry_id" text NOT NULL REFERENCES "operator_model_registry" ("id") ON DELETE CASCADE,
  "license_approved" boolean NOT NULL DEFAULT false,
  "sensitivity_allowance" text NOT NULL DEFAULT 'internal',
  "live_inference_enabled" boolean,
  "production_approved" boolean,
  "updated_by" text,
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "ggc_model_unique" UNIQUE ("model_registry_id")
);

CREATE INDEX IF NOT EXISTS "ggc_model_registry_idx" ON "governance_gate_config" ("model_registry_id");

CREATE TABLE IF NOT EXISTS "governance_gate_bypasses" (
  "id" text PRIMARY KEY,
  "model_registry_id" text NOT NULL REFERENCES "operator_model_registry" ("id") ON DELETE CASCADE,
  "gate_name" text NOT NULL,
  "granted_by_user_id" integer,
  "granted_by_name" text NOT NULL,
  "reason" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "revoked_at" timestamp,
  "revoked_by" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ggb_model_registry_idx" ON "governance_gate_bypasses" ("model_registry_id");
CREATE INDEX IF NOT EXISTS "ggb_gate_name_idx" ON "governance_gate_bypasses" ("gate_name");
CREATE INDEX IF NOT EXISTS "ggb_expires_idx" ON "governance_gate_bypasses" ("expires_at");
CREATE INDEX IF NOT EXISTS "ggb_active_idx" ON "governance_gate_bypasses" ("is_active");
