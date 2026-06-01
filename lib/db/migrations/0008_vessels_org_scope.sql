-- Wave 2 Security Hardening: Add org_id to vessels scope tables
-- Enables tenant-level data isolation so each organization only sees its own fleet data.
-- Columns are nullable to preserve backward compatibility with existing unseeded rows;
-- new rows written via the API will always have org_id populated from req.tenantOrgId.

ALTER TABLE vessels_fleets ADD COLUMN IF NOT EXISTS org_id integer REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE vessels ADD COLUMN IF NOT EXISTS org_id integer REFERENCES organizations(id) ON DELETE SET NULL;

-- Alert rules have no vessel_id link, so they need their own org_id for tenant isolation
ALTER TABLE vessels_alert_rules ADD COLUMN IF NOT EXISTS org_id integer REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vessels_fleets_org_id ON vessels_fleets(org_id);
CREATE INDEX IF NOT EXISTS idx_vessels_org_id ON vessels(org_id);
CREATE INDEX IF NOT EXISTS idx_vessels_alert_rules_org_id ON vessels_alert_rules(org_id);
