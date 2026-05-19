-- Sovereign Substrate storage augmentation: expose the bucket URI, packet
-- hash, and most recent verification state on the existing HF model registry
-- so the FORGE Model Registry UI can render a "Storage" column with the
-- linked Proof Packet.

ALTER TABLE "hf_model_registry"
  ADD COLUMN IF NOT EXISTS "sovereign_artifact_id" varchar(64),
  ADD COLUMN IF NOT EXISTS "sovereign_bucket_uri" text,
  ADD COLUMN IF NOT EXISTS "sovereign_packet_hash" text,
  ADD COLUMN IF NOT EXISTS "sovereign_verification_state" varchar(20),
  ADD COLUMN IF NOT EXISTS "sovereign_last_verified_at" timestamptz;

CREATE INDEX IF NOT EXISTS "hf_model_registry_sovereign_artifact_idx"
  ON "hf_model_registry" ("sovereign_artifact_id");
