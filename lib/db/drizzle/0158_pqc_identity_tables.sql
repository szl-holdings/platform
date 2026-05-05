CREATE TABLE IF NOT EXISTS "pqc_ca_root_keys" (
  "id" serial PRIMARY KEY NOT NULL,
  "issuer_name" text NOT NULL UNIQUE,
  "ed25519_public_key" text NOT NULL,
  "mldsa65_public_key" text NOT NULL,
  "ed25519_secret_key_enc" text NOT NULL,
  "mldsa65_secret_key_enc" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "pqc_certificates" (
  "id" serial PRIMARY KEY NOT NULL,
  "cert_id" text NOT NULL UNIQUE,
  "version" integer DEFAULT 1 NOT NULL,
  "issuer" text NOT NULL,
  "subject" text NOT NULL,
  "subject_did" text NOT NULL,
  "ed25519_public_key" text NOT NULL,
  "mldsa65_public_key" text NOT NULL,
  "not_before" timestamp NOT NULL,
  "not_after" timestamp NOT NULL,
  "serial_number" text NOT NULL UNIQUE,
  "thumbprint" text NOT NULL UNIQUE,
  "issuer_signature" jsonb,
  "issued_at" timestamp DEFAULT now() NOT NULL,
  "revoked_at" timestamp,
  "revocation_reason" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "pqc_transparency_log" (
  "id" serial PRIMARY KEY NOT NULL,
  "log_index" integer NOT NULL,
  "entry_type" text NOT NULL,
  "cert_thumbprint" text NOT NULL,
  "cert_id" text NOT NULL,
  "subject_did" text NOT NULL,
  "entry_hash" text NOT NULL,
  "merkle_root" text NOT NULL,
  "tree_size" integer NOT NULL,
  "timestamp" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "pqc_cert_subject_did_idx" ON "pqc_certificates" ("subject_did");
CREATE INDEX IF NOT EXISTS "pqc_cert_thumbprint_idx" ON "pqc_certificates" ("thumbprint");
CREATE INDEX IF NOT EXISTS "pqc_cert_active_idx" ON "pqc_certificates" ("is_active");
CREATE INDEX IF NOT EXISTS "pqc_cert_issuer_idx" ON "pqc_certificates" ("issuer");
CREATE INDEX IF NOT EXISTS "pqc_tlog_cert_thumbprint_idx" ON "pqc_transparency_log" ("cert_thumbprint");
CREATE UNIQUE INDEX IF NOT EXISTS "pqc_tlog_log_index_uniq" ON "pqc_transparency_log" ("log_index");
CREATE INDEX IF NOT EXISTS "pqc_tlog_entry_type_idx" ON "pqc_transparency_log" ("entry_type");
