-- Migration 0021: KG tenant scope + cross-domain unique constraint
-- Adds tenant_id to kg_entities for multi-tenant isolation,
-- and a unique constraint on kg_cross_domain_links.relationship_id.

-- Add tenant_id to kg_entities (nullable; NULL = org-agnostic/shared entity)
ALTER TABLE kg_entities ADD COLUMN IF NOT EXISTS tenant_id TEXT;
CREATE INDEX IF NOT EXISTS kg_entities_tenant_idx ON kg_entities (tenant_id) WHERE tenant_id IS NOT NULL;

-- Add unique constraint so cross-domain links reference each relationship exactly once
ALTER TABLE kg_cross_domain_links
  DROP CONSTRAINT IF EXISTS kg_xdomain_rel_unique;
ALTER TABLE kg_cross_domain_links
  ADD CONSTRAINT kg_xdomain_rel_unique UNIQUE (relationship_id);
