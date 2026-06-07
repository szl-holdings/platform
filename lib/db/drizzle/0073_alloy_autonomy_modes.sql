-- Migration: Alloy autonomy modes — durable per-tenant + per-domain store
-- Backs PATCH /api/alloy/autonomy-mode and the gating in /alloy/recommend.
-- Replaces the in-memory Map in artifacts/api-server/src/lib/autonomy-store.ts.

CREATE TABLE IF NOT EXISTS alloy_autonomy_modes (
  id SERIAL PRIMARY KEY,
  tenant_org_id INTEGER,
  domain TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'ask-to-act',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT,
  reason TEXT
);

-- Unique per (tenant, domain). Two partial indexes because Postgres treats
-- NULLs as distinct by default, so a plain UNIQUE(tenant_org_id, domain) would
-- allow duplicate (NULL, "x.y") rows.
CREATE UNIQUE INDEX IF NOT EXISTS alloy_autonomy_modes_tenant_domain_uniq
  ON alloy_autonomy_modes (tenant_org_id, domain)
  WHERE tenant_org_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS alloy_autonomy_modes_global_domain_uniq
  ON alloy_autonomy_modes (domain)
  WHERE tenant_org_id IS NULL;

CREATE INDEX IF NOT EXISTS alloy_autonomy_modes_tenant_idx
  ON alloy_autonomy_modes (tenant_org_id);

-- Domains are stored lowercased so lookups are case-insensitive (matching the
-- prior in-memory store). Backfill any pre-existing rows that may have been
-- written before normalization was introduced.
UPDATE alloy_autonomy_modes
   SET domain = lower(domain)
 WHERE domain <> lower(domain);

COMMENT ON TABLE alloy_autonomy_modes IS 'Per-tenant + per-domain autonomy mode for Alloy side-effecting workflow steps. Survives api-server restart and is shared across replicas.';
COMMENT ON COLUMN alloy_autonomy_modes.mode IS 'One of: observe, recommend, draft, ask-to-act, approved-act.';
COMMENT ON COLUMN alloy_autonomy_modes.tenant_org_id IS 'NULL means a global/default mode (no specific tenant).';
