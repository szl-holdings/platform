-- Migration: alloy_policy_versions_studio
--
-- Persists the Alloy Policy Authoring Studio's compiled policies, version
-- history, and per-studio test case definitions so they survive page reloads.
-- Without these tables the Studio's "Save Version", "Sign", and "Add Test
-- Case" actions are confined to React component state and are lost the
-- moment the operator refreshes the page.
--
-- See:
--   lib/db/src/schema/alloy_policy_versions.ts
--   artifacts/api-server/src/routes/alloy-policy-compiler.ts
--   artifacts/command/src/operations/pages/alloy-policy-compiler.tsx

CREATE TABLE IF NOT EXISTS "alloy_policy_versions" (
  "id" serial PRIMARY KEY,
  "external_id" text NOT NULL UNIQUE,
  "studio_id" text NOT NULL DEFAULT 'default',
  "version_number" integer NOT NULL,
  "input" text NOT NULL,
  "policy" jsonb NOT NULL,
  "author" text NOT NULL,
  "author_id" text NOT NULL,
  "message" text NOT NULL,
  "signers" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "saved_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "alloy_policy_versions_studio_idx"
  ON "alloy_policy_versions" ("studio_id", "version_number");

CREATE INDEX IF NOT EXISTS "alloy_policy_versions_saved_idx"
  ON "alloy_policy_versions" ("saved_at");

CREATE TABLE IF NOT EXISTS "alloy_policy_test_cases" (
  "id" serial PRIMARY KEY,
  "external_id" text NOT NULL UNIQUE,
  "studio_id" text NOT NULL DEFAULT 'default',
  "name" text NOT NULL,
  "context" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "expected_outcome" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "alloy_policy_test_cases_studio_idx"
  ON "alloy_policy_test_cases" ("studio_id");
