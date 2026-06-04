-- Link proposal drafts to advisory clients
ALTER TABLE "carlota_proposal_drafts"
  ADD COLUMN IF NOT EXISTS "client_external_id" text;

CREATE INDEX IF NOT EXISTS "carlota_proposal_drafts_client_external_idx"
  ON "carlota_proposal_drafts" ("client_external_id");
