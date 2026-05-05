-- Migration: 0150_hf_registry
-- Creates the hf_model_registry and hf_failover_chains tables for the
-- HF inference operator workflow API (task #4246).
-- Operators use these tables to propose, license, gate, and retire
-- HuggingFace models through the control-plane API without touching code.

CREATE TABLE IF NOT EXISTS "hf_failover_chains" (
  "id"                SERIAL      NOT NULL PRIMARY KEY,
  "name"              TEXT        NOT NULL,
  "lane"              TEXT        NOT NULL,
  "primary_model_id"  TEXT        NOT NULL,
  "fallback_model_ids" JSONB      NOT NULL DEFAULT '[]',
  "is_active"         BOOLEAN     NOT NULL DEFAULT true,
  "is_seeded"         BOOLEAN     NOT NULL DEFAULT false,
  "created_by_id"     INTEGER     REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "hf_failover_chains_lane_idx"
  ON "hf_failover_chains" ("lane");

CREATE INDEX IF NOT EXISTS "hf_failover_chains_active_idx"
  ON "hf_failover_chains" ("is_active");

CREATE TABLE IF NOT EXISTS "hf_model_registry" (
  "id"                       SERIAL      NOT NULL PRIMARY KEY,
  "model_id"                 TEXT        NOT NULL UNIQUE,
  "display_name"             TEXT        NOT NULL,
  "provider"                 TEXT        NOT NULL DEFAULT 'huggingface',
  "lifecycle_state"          TEXT        NOT NULL DEFAULT 'proposed'
                               CHECK ("lifecycle_state" IN ('proposed','under_review','approved','active','retired')),

  "license_id"               TEXT,
  "license_source_url"       TEXT,
  "license_approver_id"      INTEGER     REFERENCES "users"("id") ON DELETE SET NULL,
  "license_approval_id"      INTEGER,
  "license_expires_at"       TIMESTAMPTZ,
  "license_approved_at"      TIMESTAMPTZ,

  "sensitivity_allowance"    TEXT        NOT NULL DEFAULT 'internal'
                               CHECK ("sensitivity_allowance" IN ('public','internal','confidential','restricted')),

  "gate_license_approved"    BOOLEAN     NOT NULL DEFAULT false,
  "gate_sensitivity_match"   BOOLEAN     NOT NULL DEFAULT false,
  "gate_live_inference_allowed" BOOLEAN  NOT NULL DEFAULT false,
  "gate_production_approved" BOOLEAN     NOT NULL DEFAULT false,

  "failover_chain_id"        INTEGER     REFERENCES "hf_failover_chains"("id") ON DELETE SET NULL,

  "context_window"           INTEGER,
  "max_output_tokens"        INTEGER,
  "capabilities"             JSONB       DEFAULT '[]',
  "tier"                     TEXT,

  "last_inference_at"        TIMESTAMPTZ,
  "recent_failure_count"     INTEGER     NOT NULL DEFAULT 0,

  "proposed_by_id"           INTEGER     REFERENCES "users"("id") ON DELETE SET NULL,
  "proposed_at"              TIMESTAMPTZ NOT NULL DEFAULT now(),
  "approved_at"              TIMESTAMPTZ,
  "retired_at"               TIMESTAMPTZ,

  "notes"                    TEXT,
  "org_id"                   INTEGER     REFERENCES "organizations"("id") ON DELETE CASCADE,

  "created_at"               TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "hf_model_registry_lifecycle_idx"
  ON "hf_model_registry" ("lifecycle_state");

CREATE INDEX IF NOT EXISTS "hf_model_registry_org_idx"
  ON "hf_model_registry" ("org_id");

CREATE INDEX IF NOT EXISTS "hf_model_registry_proposed_by_idx"
  ON "hf_model_registry" ("proposed_by_id");

CREATE INDEX IF NOT EXISTS "hf_model_registry_failover_chain_idx"
  ON "hf_model_registry" ("failover_chain_id");
