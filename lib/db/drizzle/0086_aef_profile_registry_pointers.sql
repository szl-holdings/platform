-- Migration: profile_registry_pointers
--
-- Persists the AEF DomainProfileRegistry tenant pointer + rotation history so
-- that tenant-scoped profile rotations and rollbacks survive API server
-- restarts. Without this table the in-memory registry silently resets every
-- tenant back to the default profile version on each reboot.
--
-- See packages/aef-domain-profiles/src/registry.ts (DomainProfileRegistry)
-- and artifacts/api-server/src/lib/aef-profile-store.ts for the loader/persister.

CREATE TABLE IF NOT EXISTS "profile_registry_pointers" (
  "tenant_id" text NOT NULL,
  "domain" text NOT NULL,
  "active_profile_id" text NOT NULL,
  "active_version" text NOT NULL,
  "history" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "rollback_available" boolean NOT NULL DEFAULT false,
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "profile_registry_pointers_pk" PRIMARY KEY ("tenant_id", "domain")
);
