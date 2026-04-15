-- Migration 0022: Tenant-safe unique key for kg_entities
-- Replaces the tenant-agnostic (name, entity_type, domain) unique index with an
-- expression index that includes tenant_id, so entities from different orgs can
-- coexist without collision. Rows with tenant_id IS NULL are treated as global/shared
-- entities (COALESCE maps NULL → '' which forms a distinct equality class per PostgreSQL).

DROP INDEX IF EXISTS kg_entities_natural_key_idx;

CREATE UNIQUE INDEX kg_entities_natural_key_idx
  ON kg_entities (name, entity_type, domain, COALESCE(tenant_id, ''));
