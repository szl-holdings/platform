-- Task #1847: Persist Blockchain BoL records so new documents survive server restarts.
-- Adds two durable tables for the Vessels Blockchain Bill of Lading module that
-- previously lived in an in-memory Map in artifacts/api-server/src/routes/vessels-modules.ts:
--   * vessels_bills_of_lading      — BoL document core fields
--   * vessels_bol_chain_events     — append-only chain events; hashes are recomputed at read time

CREATE TABLE IF NOT EXISTS "vessels_bills_of_lading" (
  "id" TEXT PRIMARY KEY,
  "vessel_name" TEXT NOT NULL,
  "imo" TEXT NOT NULL DEFAULT '',
  "voyage_id" TEXT NOT NULL DEFAULT '',
  "shipper" TEXT NOT NULL,
  "consignee" TEXT NOT NULL,
  "notify_party" TEXT NOT NULL DEFAULT '',
  "cargo" TEXT NOT NULL,
  "quantity" TEXT NOT NULL DEFAULT '',
  "quantity_mt" NUMERIC(16,2) NOT NULL DEFAULT 0,
  "unit" TEXT NOT NULL DEFAULT 'MT',
  "origin_port" TEXT NOT NULL,
  "destination_port" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'issued',
  "lc_ref" TEXT NOT NULL DEFAULT '',
  "lc_issuer" TEXT NOT NULL DEFAULT '',
  "lc_amount" NUMERIC(18,2) NOT NULL DEFAULT 0,
  "lc_status" TEXT NOT NULL DEFAULT 'pending',
  "auto_lc_release" BOOLEAN NOT NULL DEFAULT true,
  "transfer_count" INTEGER NOT NULL DEFAULT 0,
  "delivery_confirmed" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  "inserted_at" TIMESTAMP NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "vessels_bol_chain_events" (
  "id" SERIAL PRIMARY KEY,
  "bol_id" TEXT NOT NULL REFERENCES "vessels_bills_of_lading"("id") ON DELETE CASCADE,
  "sequence" INTEGER NOT NULL,
  "event_type" TEXT NOT NULL,
  "actor" TEXT NOT NULL,
  "event_timestamp" TEXT NOT NULL,
  "confirmed" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "vessels_bol_chain_events_bol_seq_idx" ON "vessels_bol_chain_events" ("bol_id", "sequence");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vessels_bol_chain_events_bol_idx" ON "vessels_bol_chain_events" ("bol_id");
