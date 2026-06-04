-- Migration: Add memory_records and memory_links tables for Memory Fabric
-- Memory Fabric is the platform-level persistent memory layer that stores
-- agent observations, entity state, and executive briefing context.

CREATE TABLE IF NOT EXISTS "memory_records" (
  "id" serial PRIMARY KEY NOT NULL,
  "external_id" text NOT NULL UNIQUE,
  "tier" text NOT NULL,
  "key" text NOT NULL,
  "value" jsonb,
  "scope_id" text,
  "confidence" numeric(5, 4) NOT NULL DEFAULT '1',
  "sensitivity" text NOT NULL DEFAULT 'internal',
  "retention_policy" text NOT NULL DEFAULT 'persistent',
  "expires_at" timestamp,
  "max_age_days" integer,
  "is_stale" boolean NOT NULL DEFAULT false,
  "provenance_source" text NOT NULL,
  "provenance_source_id" text,
  "provenance_author" text,
  "provenance_method" text NOT NULL DEFAULT 'agent',
  "linked_entities" jsonb DEFAULT '[]',
  "linked_traces" jsonb DEFAULT '[]',
  "linked_actions" jsonb DEFAULT '[]',
  "tags" jsonb DEFAULT '[]',
  "metadata" jsonb DEFAULT '{}',
  "last_accessed_at" timestamp,
  "last_updated_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "memory_links" (
  "id" serial PRIMARY KEY NOT NULL,
  "source_record_id" text NOT NULL,
  "target_record_id" text NOT NULL,
  "link_type" text NOT NULL DEFAULT 'references',
  "strength" numeric(5, 4) DEFAULT '1',
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "memory_records_tier_idx" ON "memory_records" ("tier");
CREATE INDEX IF NOT EXISTS "memory_records_key_idx" ON "memory_records" ("key");
CREATE INDEX IF NOT EXISTS "memory_records_scope_idx" ON "memory_records" ("scope_id");
CREATE INDEX IF NOT EXISTS "memory_records_sensitivity_idx" ON "memory_records" ("sensitivity");
CREATE INDEX IF NOT EXISTS "memory_records_expires_idx" ON "memory_records" ("expires_at");
CREATE INDEX IF NOT EXISTS "memory_records_stale_idx" ON "memory_records" ("is_stale");
CREATE INDEX IF NOT EXISTS "memory_records_created_idx" ON "memory_records" ("created_at");

CREATE INDEX IF NOT EXISTS "memory_links_source_idx" ON "memory_links" ("source_record_id");
CREATE INDEX IF NOT EXISTS "memory_links_target_idx" ON "memory_links" ("target_record_id");
CREATE INDEX IF NOT EXISTS "memory_links_type_idx" ON "memory_links" ("link_type");
