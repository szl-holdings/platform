CREATE TABLE IF NOT EXISTS "a11oy_agent_identities" (
  "id" serial PRIMARY KEY,
  "agent_id" text NOT NULL UNIQUE,
  "agent_name" text NOT NULL,
  "public_key" text NOT NULL,
  "public_key_algorithm" text NOT NULL DEFAULT 'Ed25519',
  "key_fingerprint" text NOT NULL,
  "capabilities" jsonb DEFAULT '[]',
  "max_autonomy" text NOT NULL DEFAULT 'recommend_only',
  "cert_id" text,
  "cert_issuer" text,
  "cert_issued_at" timestamp,
  "cert_expires_at" timestamp,
  "cert_signature_hex" text,
  "cert_payload" text,
  "attestation_status" text NOT NULL DEFAULT 'pending',
  "domain" text,
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "a11oy_agent_id_status_idx" ON "a11oy_agent_identities" ("attestation_status");
CREATE INDEX IF NOT EXISTS "a11oy_agent_id_domain_idx" ON "a11oy_agent_identities" ("domain");

CREATE TABLE IF NOT EXISTS "a11oy_hf_access_audit" (
  "id" serial PRIMARY KEY,
  "external_id" text NOT NULL UNIQUE,
  "agent_id" text NOT NULL,
  "agent_name" text NOT NULL,
  "resource_uri" text NOT NULL,
  "resource_type" text NOT NULL,
  "purpose" text NOT NULL,
  "identity_token" text,
  "duration_ms" integer NOT NULL DEFAULT 0,
  "success" boolean NOT NULL DEFAULT true,
  "proof_hash" text NOT NULL,
  "metadata" jsonb DEFAULT '{}',
  "accessed_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "a11oy_hf_audit_agent_idx" ON "a11oy_hf_access_audit" ("agent_id");
CREATE INDEX IF NOT EXISTS "a11oy_hf_audit_resource_type_idx" ON "a11oy_hf_access_audit" ("resource_type");
CREATE INDEX IF NOT EXISTS "a11oy_hf_audit_accessed_idx" ON "a11oy_hf_access_audit" ("accessed_at");
CREATE INDEX IF NOT EXISTS "a11oy_hf_audit_success_idx" ON "a11oy_hf_access_audit" ("success");

CREATE TABLE IF NOT EXISTS "a11oy_provenance_nodes" (
  "id" serial PRIMARY KEY,
  "node_id" text NOT NULL UNIQUE,
  "kind" text NOT NULL,
  "label" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "proof_hash" text NOT NULL,
  "metadata" jsonb DEFAULT '{}',
  "node_created_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "a11oy_prov_node_kind_idx" ON "a11oy_provenance_nodes" ("kind");

CREATE TABLE IF NOT EXISTS "a11oy_provenance_edges" (
  "id" serial PRIMARY KEY,
  "edge_id" text NOT NULL UNIQUE,
  "source_node_id" text NOT NULL,
  "target_node_id" text NOT NULL,
  "relation" text NOT NULL,
  "proof_hash" text NOT NULL,
  "signer_agent_id" text,
  "signer_fingerprint" text,
  "edge_signature_hex" text,
  "metadata" jsonb DEFAULT '{}',
  "edge_timestamp" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "a11oy_prov_edge_source_idx" ON "a11oy_provenance_edges" ("source_node_id");
CREATE INDEX IF NOT EXISTS "a11oy_prov_edge_target_idx" ON "a11oy_provenance_edges" ("target_node_id");
CREATE INDEX IF NOT EXISTS "a11oy_prov_edge_relation_idx" ON "a11oy_provenance_edges" ("relation");

CREATE TABLE IF NOT EXISTS "a11oy_agent_reputation" (
  "id" serial PRIMARY KEY,
  "agent_id" text NOT NULL,
  "agent_name" text NOT NULL,
  "overall_score" real NOT NULL DEFAULT 0,
  "successful_deployments" integer NOT NULL DEFAULT 0,
  "total_deployments" integer NOT NULL DEFAULT 0,
  "evaluation_pass_rate" real NOT NULL DEFAULT 0,
  "governance_compliance_rate" real NOT NULL DEFAULT 0,
  "cost_efficiency" real NOT NULL DEFAULT 0,
  "provenance_depth" integer NOT NULL DEFAULT 0,
  "computed_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "a11oy_reputation_agent_idx" ON "a11oy_agent_reputation" ("agent_id");
CREATE INDEX IF NOT EXISTS "a11oy_reputation_score_idx" ON "a11oy_agent_reputation" ("overall_score");
CREATE INDEX IF NOT EXISTS "a11oy_reputation_computed_idx" ON "a11oy_agent_reputation" ("computed_at");
