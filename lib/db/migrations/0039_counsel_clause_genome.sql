-- Counsel Clause Genome + Drafting Agent
-- Adds tables for clause library, playbook rules, and draft sessions.
-- All statements use IF NOT EXISTS guards for idempotency.

CREATE TABLE IF NOT EXISTS counsel_clauses (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  clause_type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  matter_id TEXT,
  matter_name TEXT,
  document_ref TEXT,
  jurisdiction TEXT,
  risk_score REAL NOT NULL DEFAULT 0,
  risk_tags JSONB NOT NULL DEFAULT '[]',
  taxonomy_tags JSONB NOT NULL DEFAULT '[]',
  provenance_envelope JSONB,
  confidence_band JSONB,
  precedent_links JSONB NOT NULL DEFAULT '[]',
  effective_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','superseded','draft','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cc_org_type_idx ON counsel_clauses(org_id, clause_type);
CREATE INDEX IF NOT EXISTS cc_matter_idx ON counsel_clauses(matter_id);
CREATE INDEX IF NOT EXISTS cc_risk_idx ON counsel_clauses(risk_score);

CREATE TABLE IF NOT EXISTS counsel_playbook_rules (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  clause_type TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  description TEXT,
  required_language TEXT,
  prohibited_terms JSONB NOT NULL DEFAULT '[]',
  risk_threshold REAL NOT NULL DEFAULT 0.5,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical','high','medium','low')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cpr_org_type_idx ON counsel_playbook_rules(org_id, clause_type);
CREATE INDEX IF NOT EXISTS cpr_severity_idx ON counsel_playbook_rules(severity);

CREATE TABLE IF NOT EXISTS counsel_draft_sessions (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  clause_type TEXT NOT NULL,
  context TEXT,
  matter_id TEXT,
  draft_text TEXT NOT NULL,
  citations JSONB NOT NULL DEFAULT '[]',
  provenance_envelope JSONB NOT NULL,
  confidence_band JSONB NOT NULL,
  risk_diff JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','rejected','superseded')),
  created_by INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cds_org_type_idx ON counsel_draft_sessions(org_id, clause_type);
CREATE INDEX IF NOT EXISTS cds_matter_idx ON counsel_draft_sessions(matter_id);
CREATE INDEX IF NOT EXISTS cds_created_idx ON counsel_draft_sessions(created_at);
