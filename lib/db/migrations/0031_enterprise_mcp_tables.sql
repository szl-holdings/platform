-- Enterprise IdP Registry
-- Stores approved enterprise identity providers allowed to issue ID-JAG assertions
-- for MCP gateway access via the RFC urn:ietf:params:oauth:grant-type:jwt-bearer flow.
CREATE TABLE IF NOT EXISTS "enterprise_idp_registry" (
  "id"                      serial PRIMARY KEY,
  "tenant_id"               integer NOT NULL REFERENCES "azure_tenants"("id") ON DELETE CASCADE,
  "name"                    text NOT NULL,
  "issuer_url"              text NOT NULL,
  "jwks_uri"                text NOT NULL,
  "expected_audience"       text NOT NULL,
  "allowed_redirect_uris"   jsonb DEFAULT '[]',
  "claims_to_role_mapping"  jsonb DEFAULT '{}',
  "auto_provision_users"    boolean NOT NULL DEFAULT false,
  "default_role"            text NOT NULL DEFAULT 'viewer',
  "enabled"                 boolean NOT NULL DEFAULT true,
  "jwks_cache_ttl_seconds"  integer NOT NULL DEFAULT 3600,
  "require_email_verified"  boolean NOT NULL DEFAULT true,
  "notes"                   text,
  "created_by_user_id"      integer,
  "created_at"              timestamp NOT NULL DEFAULT now(),
  "updated_at"              timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "enterprise_idp_registry_tenant_id_idx"
  ON "enterprise_idp_registry" ("tenant_id");

-- Composite index for per-tenant uniqueness (fast tenant-scoped lookups).
CREATE UNIQUE INDEX IF NOT EXISTS "enterprise_idp_registry_tenant_issuer_uidx"
  ON "enterprise_idp_registry" ("tenant_id", "issuer_url");

-- Global uniqueness: issuer URLs must be unique across ALL tenants so the MCP
-- gateway can resolve an incoming JWT unambiguously to a single IdP config.
-- If two tenants used the same issuer URL the gateway registry (keyed by issuerUrl)
-- would silently overwrite one config with the other, causing cross-tenant policy
-- contamination. Enforce this at the schema level to make the constraint explicit.
CREATE UNIQUE INDEX IF NOT EXISTS "enterprise_idp_registry_issuer_url_uidx"
  ON "enterprise_idp_registry" ("issuer_url");

-- MCP Enterprise Audit Log
-- Records all ID-JAG exchange events, token issuances, and revocations for
-- compliance, security monitoring, and debugging.
CREATE TABLE IF NOT EXISTS "mcp_enterprise_audit" (
  "id"            serial PRIMARY KEY,
  "tenant_id"     integer REFERENCES "azure_tenants"("id") ON DELETE SET NULL,
  "idp_id"        integer REFERENCES "enterprise_idp_registry"("id") ON DELETE SET NULL,
  "event_type"    text NOT NULL,
  "issuer"        text,
  "subject"       text,
  "email"         text,
  "mapped_role"   text,
  "mcp_scope"     text,
  "user_id"       integer,
  "error_code"    text,
  "error_message" text,
  "metadata"      jsonb DEFAULT '{}',
  "ip_address"    text,
  "created_at"    timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "mcp_enterprise_audit_tenant_id_idx"
  ON "mcp_enterprise_audit" ("tenant_id");

CREATE INDEX IF NOT EXISTS "mcp_enterprise_audit_subject_issuer_idx"
  ON "mcp_enterprise_audit" ("issuer", "subject");

CREATE INDEX IF NOT EXISTS "mcp_enterprise_audit_created_at_idx"
  ON "mcp_enterprise_audit" ("created_at" DESC);

-- MCP Revoked Subjects
-- Centralized revocation registry; validated on every MCP token check so that
-- revoked employees lose access immediately without waiting for token expiry.
CREATE TABLE IF NOT EXISTS "mcp_revoked_subjects" (
  "id"          serial PRIMARY KEY,
  "tenant_id"   integer REFERENCES "azure_tenants"("id") ON DELETE CASCADE,
  "idp_id"      integer REFERENCES "enterprise_idp_registry"("id") ON DELETE CASCADE,
  "issuer"      text NOT NULL,
  "subject"     text NOT NULL,
  "revoked_at"  timestamp NOT NULL DEFAULT now(),
  "revoked_by"  text,
  "reason"      text
);

CREATE UNIQUE INDEX IF NOT EXISTS "mcp_revoked_subjects_issuer_subject_uidx"
  ON "mcp_revoked_subjects" ("issuer", "subject");

CREATE INDEX IF NOT EXISTS "mcp_revoked_subjects_tenant_id_idx"
  ON "mcp_revoked_subjects" ("tenant_id");
