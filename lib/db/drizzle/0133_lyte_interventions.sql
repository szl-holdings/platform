-- Migration 0097: Add lyte_interventions audit table
-- Persistent ledger for operator interventions on Lyte drift / debt items.
-- Replaces the in-memory ledger in routes/lyte.ts so audit trail survives
-- process restarts and is shared across all replicas.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lyte_interventions" (
  "id" text PRIMARY KEY NOT NULL,
  "item_id" text NOT NULL,
  "item_kind" text NOT NULL,
  "item_title" text NOT NULL,
  "type" text NOT NULL,
  "actor" text NOT NULL,
  "notes" text,
  "new_owner" text,
  "proof_ref" text NOT NULL,
  "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lyte_interventions_item_id_idx" ON "lyte_interventions" ("item_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lyte_interventions_item_kind_idx" ON "lyte_interventions" ("item_kind");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lyte_interventions_timestamp_idx" ON "lyte_interventions" ("timestamp" DESC);
