CREATE TABLE IF NOT EXISTS "nexus_situation_rooms" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "status" text NOT NULL DEFAULT 'active',
  "priority" text NOT NULL DEFAULT 'P2',
  "operators" jsonb NOT NULL DEFAULT '[]',
  "entities" jsonb NOT NULL DEFAULT '[]',
  "domains" jsonb NOT NULL DEFAULT '[]',
  "tag" text NOT NULL DEFAULT 'general',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "nexus_room_notes" (
  "id" text PRIMARY KEY NOT NULL,
  "room_id" text NOT NULL REFERENCES "nexus_situation_rooms"("id") ON DELETE CASCADE,
  "author" text NOT NULL DEFAULT 'Nexus Operator',
  "content" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "nexus_proof_chain" (
  "id" text PRIMARY KEY NOT NULL,
  "action_id" text NOT NULL,
  "action_type" text NOT NULL,
  "operator" text NOT NULL DEFAULT 'Nexus Operator',
  "target_domain" text NOT NULL,
  "payload" jsonb NOT NULL DEFAULT '{}',
  "status" text NOT NULL DEFAULT 'executed',
  "decision" text,
  "tx_hash" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "nexus_settings" (
  "id" text PRIMARY KEY NOT NULL DEFAULT 'global',
  "config" jsonb NOT NULL DEFAULT '{}',
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "nexus_room_notes_room_id_idx" ON "nexus_room_notes"("room_id");
CREATE INDEX IF NOT EXISTS "nexus_proof_chain_status_idx" ON "nexus_proof_chain"("status");
CREATE INDEX IF NOT EXISTS "nexus_proof_chain_created_at_idx" ON "nexus_proof_chain"("created_at" DESC);
