-- Sovereign Substrate: registry of AI artifacts published to HuggingFace
-- Buckets with cryptographic Proof Packets. Backs the /sovereign catalog
-- and the sovereign.searchArtifacts MCP tool.

CREATE TABLE IF NOT EXISTS "sovereign_artifacts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "kind" varchar(40) NOT NULL,
  "task" varchar(80),
  "bucket" varchar(40) NOT NULL,
  "bucket_uri" text NOT NULL,
  "packet_uri" text NOT NULL,
  "content_hash" text NOT NULL,
  "packet_hash" text NOT NULL,
  "trust_tier" varchar(20) NOT NULL DEFAULT 'experimental',
  "visibility" varchar(20) NOT NULL DEFAULT 'private',
  "bias_score" numeric(5, 4),
  "mirror_eval_score" numeric(5, 4),
  "eval_summary" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "source_model_version_id" varchar,
  "signer_id" varchar(120) NOT NULL,
  "public_key_id" varchar(120) NOT NULL,
  "revocation_url" text,
  "verification_state" varchar(20) NOT NULL DEFAULT 'unverified',
  "last_verified_at" timestamp,
  "expires_at" timestamp,
  "published_at" timestamp NOT NULL DEFAULT now(),
  "license" varchar(60),
  "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "is_revoked" boolean NOT NULL DEFAULT false,
  "org_id" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "sovereign_artifacts_content_uniq"
  ON "sovereign_artifacts" ("content_hash", "bucket");
CREATE INDEX IF NOT EXISTS "sovereign_artifacts_kind_idx"
  ON "sovereign_artifacts" ("kind", "trust_tier");
CREATE INDEX IF NOT EXISTS "sovereign_artifacts_bucket_idx"
  ON "sovereign_artifacts" ("bucket");
