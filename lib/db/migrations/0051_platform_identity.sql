-- platform_keys — envelope-encrypted signing keys for the key custody service
CREATE TABLE IF NOT EXISTS "platform_keys" (
  "id" serial PRIMARY KEY,
  "key_id" text NOT NULL UNIQUE,
  "did" text NOT NULL,
  "key_version" text NOT NULL DEFAULT '1',
  "ed25519_public_key" text NOT NULL,
  "mldsa65_public_key" text NOT NULL,
  "ed25519_secret_key_enc" text NOT NULL,
  "mldsa65_secret_key_enc" text NOT NULL,
  "kek_source" text NOT NULL DEFAULT 'env',
  "scheme_version" text NOT NULL DEFAULT 'hybrid-v1',
  "is_active" boolean NOT NULL DEFAULT true,
  "revoked_at" timestamp,
  "revocation_reason" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "platform_keys_did_idx" ON "platform_keys" ("did");
CREATE INDEX IF NOT EXISTS "platform_keys_active_idx" ON "platform_keys" ("is_active");
CREATE UNIQUE INDEX IF NOT EXISTS "platform_keys_did_version_uniq" ON "platform_keys" ("did", "key_version");

-- platform_dids — intra-platform DID registry (did:plat:* method)
CREATE TABLE IF NOT EXISTS "platform_dids" (
  "id" serial PRIMARY KEY,
  "did" text NOT NULL UNIQUE,
  "actor_kind" text NOT NULL,
  "display_name" text NOT NULL,
  "org_id" text,
  "active_key_id" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "revoked_at" timestamp,
  "revocation_reason" text,
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "platform_dids_actor_kind_idx" ON "platform_dids" ("actor_kind");
CREATE INDEX IF NOT EXISTS "platform_dids_active_idx" ON "platform_dids" ("is_active");
CREATE INDEX IF NOT EXISTS "platform_dids_org_idx" ON "platform_dids" ("org_id");

-- platform_did_documents — W3C DID document snapshots
CREATE TABLE IF NOT EXISTS "platform_did_documents" (
  "id" serial PRIMARY KEY,
  "did" text NOT NULL,
  "version" text NOT NULL DEFAULT '1',
  "document" jsonb NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "platform_did_docs_did_idx" ON "platform_did_documents" ("did");
CREATE UNIQUE INDEX IF NOT EXISTS "platform_did_docs_did_version_uniq" ON "platform_did_documents" ("did", "version");

-- did_webvh_log — deferred did:webvh history log (off by default)
CREATE TABLE IF NOT EXISTS "did_webvh_log" (
  "id" serial PRIMARY KEY,
  "did" text NOT NULL,
  "event_type" text NOT NULL,
  "key_id" text,
  "payload" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "did_webvh_log_did_idx" ON "did_webvh_log" ("did");
CREATE INDEX IF NOT EXISTS "did_webvh_log_event_type_idx" ON "did_webvh_log" ("event_type");

-- Extend audit_chain_events with nullable hybrid-signature columns.
-- Legacy rows that predate this migration will have all columns NULL (legacy_unsigned).
-- New rows written after this migration will have these populated (hybrid_verified).
ALTER TABLE "audit_chain_events" ADD COLUMN IF NOT EXISTS "ed25519_sig" text;
ALTER TABLE "audit_chain_events" ADD COLUMN IF NOT EXISTS "mldsa65_sig" text;
ALTER TABLE "audit_chain_events" ADD COLUMN IF NOT EXISTS "signing_did" text;
ALTER TABLE "audit_chain_events" ADD COLUMN IF NOT EXISTS "key_id" text;
ALTER TABLE "audit_chain_events" ADD COLUMN IF NOT EXISTS "scheme_version" text;
ALTER TABLE "audit_chain_events" ADD COLUMN IF NOT EXISTS "sig_public_key_ed25519" text;
ALTER TABLE "audit_chain_events" ADD COLUMN IF NOT EXISTS "sig_public_key_mldsa65" text;

CREATE INDEX IF NOT EXISTS "audit_chain_signing_did_idx" ON "audit_chain_events" ("signing_did");
CREATE INDEX IF NOT EXISTS "audit_chain_sig_scheme_idx" ON "audit_chain_events" ("scheme_version");
