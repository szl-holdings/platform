-- Migration: 0149_model_passports
-- Creates the model_passports table for the signed Model Passport registry.
-- Each row represents one (model × quantization_tier × policy_envelope × tenant_scope) tuple.

CREATE TABLE IF NOT EXISTS "model_passports" (
  "id"                   TEXT        NOT NULL PRIMARY KEY,
  "tenant_id"            INTEGER,
  "display_name"         TEXT        NOT NULL,
  "version"              TEXT        NOT NULL DEFAULT '1.0.0',
  "provider"             TEXT        NOT NULL,
  "provider_model_id"    TEXT        NOT NULL,
  "quant_tier"           TEXT        NOT NULL DEFAULT 'hosted',
  "lanes"                JSONB       NOT NULL DEFAULT '[]',
  "state"                TEXT        NOT NULL DEFAULT 'draft'
                           CHECK ("state" IN ('draft','proposed','approved','active','deprecated','revoked')),
  "signed_json"          JSONB       NOT NULL,
  "signature"            TEXT        NOT NULL,
  "signer_public_key"    TEXT        NOT NULL,
  "provenance_hash"      TEXT        NOT NULL,
  "downgrade_to"         JSONB       NOT NULL DEFAULT '[]',
  "cost_per_1k_tokens_usd" TEXT      NOT NULL DEFAULT '0',
  "p50_latency_ms"       INTEGER,
  "p95_latency_ms"       INTEGER,
  "eval_pass_rate"       TEXT,
  "autonomy_tier"        TEXT        NOT NULL DEFAULT 'advisory',
  "approvals"            JSONB       NOT NULL DEFAULT '[]',
  "revoked_at"           TIMESTAMPTZ,
  "revoked_by"           TEXT,
  "revocation_reason"    TEXT,
  "created_at"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "model_passports_state_idx"
  ON "model_passports" ("state");

CREATE INDEX IF NOT EXISTS "model_passports_tenant_idx"
  ON "model_passports" ("tenant_id");

CREATE INDEX IF NOT EXISTS "model_passports_provider_idx"
  ON "model_passports" ("provider");

CREATE INDEX IF NOT EXISTS "model_passports_quant_tier_idx"
  ON "model_passports" ("quant_tier");
