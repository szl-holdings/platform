-- Migration 0094: Add lyte_entity_nodes and lyte_entity_edges tables
-- These tables back the Lyte Entity Graph page with DB-sourced node/edge data,
-- replacing the static seed import in the frontend. Seeded by seed-lyte-surfaces.ts.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lyte_entity_nodes" (
  "id" text PRIMARY KEY NOT NULL,
  "label" text NOT NULL,
  "type" text NOT NULL,
  "status" text NOT NULL,
  "sublabel" text,
  "policy_state" text NOT NULL,
  "confidence" double precision NOT NULL DEFAULT 1.0,
  "freshness" text NOT NULL DEFAULT 'live',
  "x" double precision NOT NULL DEFAULT 0,
  "y" double precision NOT NULL DEFAULT 0,
  "metadata" jsonb,
  "order_idx" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lyte_entity_edges" (
  "id" text PRIMARY KEY NOT NULL,
  "source_id" text NOT NULL,
  "target_id" text NOT NULL,
  "label" text NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "strength" text NOT NULL DEFAULT 'normal',
  "proof_ref" text,
  "order_idx" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
