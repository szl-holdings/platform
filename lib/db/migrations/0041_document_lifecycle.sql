-- Document Lifecycle Engine
-- DB-backed configurable state machine for document management
-- with audit trail and per-org workflow configurations.
-- All statements use IF NOT EXISTS guards for idempotency.

CREATE TABLE IF NOT EXISTS document_lifecycle (
  id SERIAL PRIMARY KEY,
  document_id TEXT NOT NULL UNIQUE,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL DEFAULT 'draft',
  domain TEXT NOT NULL DEFAULT 'counsel',
  matter_id INTEGER,
  fund_id TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  signature_status TEXT NOT NULL DEFAULT 'none',
  jurisdiction_code TEXT,
  frozen_metrics JSONB,
  created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS doc_lifecycle_org_id_idx ON document_lifecycle(org_id);
CREATE INDEX IF NOT EXISTS doc_lifecycle_document_id_idx ON document_lifecycle(document_id);
CREATE INDEX IF NOT EXISTS doc_lifecycle_state_idx ON document_lifecycle(lifecycle_state);
CREATE INDEX IF NOT EXISTS doc_lifecycle_domain_idx ON document_lifecycle(domain);
CREATE INDEX IF NOT EXISTS doc_lifecycle_type_idx ON document_lifecycle(document_type);
CREATE INDEX IF NOT EXISTS doc_lifecycle_matter_id_idx ON document_lifecycle(matter_id);
CREATE INDEX IF NOT EXISTS doc_lifecycle_fund_id_idx ON document_lifecycle(fund_id);

CREATE TABLE IF NOT EXISTS document_audit_trail (
  id SERIAL PRIMARY KEY,
  document_id TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  performed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  performed_by_name TEXT,
  role_used TEXT NOT NULL,
  reason TEXT,
  metadata JSONB,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS doc_audit_document_id_idx ON document_audit_trail(document_id);
CREATE INDEX IF NOT EXISTS doc_audit_org_id_idx ON document_audit_trail(org_id);
CREATE INDEX IF NOT EXISTS doc_audit_occurred_at_idx ON document_audit_trail(occurred_at);
CREATE INDEX IF NOT EXISTS doc_audit_performed_by_idx ON document_audit_trail(performed_by_id);

CREATE TABLE IF NOT EXISTS lifecycle_workflow_config (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  document_type TEXT NOT NULL,
  states JSONB NOT NULL,
  transitions JSONB NOT NULL,
  role_matrix JSONB NOT NULL,
  is_active TEXT NOT NULL DEFAULT 'true',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lifecycle_wf_org_id_idx ON lifecycle_workflow_config(org_id);
CREATE INDEX IF NOT EXISTS lifecycle_wf_domain_idx ON lifecycle_workflow_config(domain);
CREATE INDEX IF NOT EXISTS lifecycle_wf_type_idx ON lifecycle_workflow_config(document_type);

-- E-signature ↔ Document Lifecycle binding
ALTER TABLE esignature_requests ADD COLUMN IF NOT EXISTS lifecycle_document_id TEXT;
CREATE INDEX IF NOT EXISTS esig_requests_lifecycle_doc_idx ON esignature_requests(lifecycle_document_id);
