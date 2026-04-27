-- Constellation Graph & Ontology Schema
-- Cross-domain canonical entity/edge model with provenance, freshness, confidence, and sensitivity

DO $$ BEGIN
  CREATE TYPE cst_sensitivity_tier AS ENUM (
    'public',
    'internal',
    'confidential',
    'restricted',
    'top_secret'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS cst_nodes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id            UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  domain                  TEXT NOT NULL,
  entity_type             TEXT NOT NULL,
  labels                  TEXT[] DEFAULT '{}',
  name                    TEXT NOT NULL,
  description             TEXT,
  provenance_source_id    TEXT,
  provenance_source_type  TEXT,
  provenance_source_label TEXT,
  freshness               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confidence              REAL NOT NULL DEFAULT 1.0,
  owner_id                TEXT,
  owner_type              TEXT,
  owner_org_id            TEXT,
  sensitivity_tier        cst_sensitivity_tier NOT NULL DEFAULT 'internal',
  related_action_ids      JSONB DEFAULT '[]',
  related_document_ids    JSONB DEFAULT '[]',
  related_execution_ids   JSONB DEFAULT '[]',
  related_risk_ids        JSONB DEFAULT '[]',
  extensions              JSONB DEFAULT '{}',
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cst_nodes_domain_idx         ON cst_nodes (domain);
CREATE INDEX IF NOT EXISTS cst_nodes_entity_type_idx    ON cst_nodes (entity_type);
CREATE INDEX IF NOT EXISTS cst_nodes_canonical_id_idx   ON cst_nodes (canonical_id);
CREATE INDEX IF NOT EXISTS cst_nodes_active_idx         ON cst_nodes (is_active);
CREATE INDEX IF NOT EXISTS cst_nodes_name_idx           ON cst_nodes (name);
CREATE INDEX IF NOT EXISTS cst_nodes_domain_type_idx    ON cst_nodes (domain, entity_type);
CREATE INDEX IF NOT EXISTS cst_nodes_sensitivity_idx    ON cst_nodes (sensitivity_tier);
CREATE INDEX IF NOT EXISTS cst_nodes_confidence_idx     ON cst_nodes (confidence);

CREATE TABLE IF NOT EXISTS cst_node_types (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain              TEXT NOT NULL,
  type_key            TEXT NOT NULL,
  display_name        TEXT NOT NULL,
  description         TEXT,
  default_sensitivity cst_sensitivity_tier NOT NULL DEFAULT 'internal',
  extension_schema    JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (domain, type_key)
);

CREATE INDEX IF NOT EXISTS cst_node_types_domain_idx ON cst_node_types (domain);

CREATE TABLE IF NOT EXISTS cst_node_aliases (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id       UUID NOT NULL REFERENCES cst_nodes(id) ON DELETE CASCADE,
  alias_type    TEXT NOT NULL,
  alias_value   TEXT NOT NULL,
  source_system TEXT,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (alias_type, alias_value)
);

CREATE INDEX IF NOT EXISTS cst_aliases_node_idx  ON cst_node_aliases (node_id);
CREATE INDEX IF NOT EXISTS cst_aliases_value_idx ON cst_node_aliases (alias_value);

CREATE TABLE IF NOT EXISTS cst_edges (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id      UUID NOT NULL REFERENCES cst_nodes(id) ON DELETE CASCADE,
  to_node_id        UUID NOT NULL REFERENCES cst_nodes(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  confidence        REAL NOT NULL DEFAULT 1.0,
  source_id         TEXT,
  source_type       TEXT,
  source_label      TEXT,
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  extensions        JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_node_id, to_node_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS cst_edges_from_idx   ON cst_edges (from_node_id);
CREATE INDEX IF NOT EXISTS cst_edges_to_idx     ON cst_edges (to_node_id);
CREATE INDEX IF NOT EXISTS cst_edges_type_idx   ON cst_edges (relationship_type);
CREATE INDEX IF NOT EXISTS cst_edges_active_idx ON cst_edges (active);

CREATE TABLE IF NOT EXISTS cst_edge_evidence (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edge_id        UUID NOT NULL REFERENCES cst_edges(id) ON DELETE CASCADE,
  evidence_type  TEXT NOT NULL,
  payload        JSONB DEFAULT '{}',
  source_id      TEXT,
  source_label   TEXT,
  confidence     REAL NOT NULL DEFAULT 1.0,
  recorded_by    TEXT,
  recorded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cst_evidence_edge_idx        ON cst_edge_evidence (edge_id);
CREATE INDEX IF NOT EXISTS cst_evidence_type_idx        ON cst_edge_evidence (evidence_type);
CREATE INDEX IF NOT EXISTS cst_evidence_recorded_at_idx ON cst_edge_evidence (recorded_at);
