-- Geo-Intel pin persistence
-- Stores the mutable state of geospatial intelligence pins surfaced on the
-- Command map (PERSONNEL, WEATHER, and any ad-hoc layers added at runtime).
-- The in-memory store in services/geo-intel-store.ts hydrates from this
-- table on boot and writes through on every mutation so threat-level
-- changes, new ephemeral pins, and removals survive API server restarts.
-- All statements use IF NOT EXISTS / ON CONFLICT guards for idempotency.

CREATE TABLE IF NOT EXISTS geo_intel_pins (
  id TEXT PRIMARY KEY,
  layer TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  label TEXT NOT NULL,
  sublabel TEXT NOT NULL,
  classification TEXT NOT NULL,
  threat TEXT NOT NULL,
  stale BOOLEAN NOT NULL DEFAULT FALSE,
  detail_summary TEXT NOT NULL,
  detail_source TEXT NOT NULL,
  detail_timestamp TEXT NOT NULL,
  detail_confidence INTEGER NOT NULL,
  detail_tags JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS geo_intel_pins_layer_idx ON geo_intel_pins (layer);
CREATE INDEX IF NOT EXISTS geo_intel_pins_threat_idx ON geo_intel_pins (threat);

-- Baseline operator pins (PERSONNEL + WEATHER) so the in-memory store is
-- never empty on a cold start. ON CONFLICT DO NOTHING preserves operator
-- mutations across re-runs of this migration.
INSERT INTO geo_intel_pins
  (id, layer, lat, lng, label, sublabel, classification, threat, stale,
   detail_summary, detail_source, detail_timestamp, detail_confidence, detail_tags)
VALUES
  (
    'geo-personnel-001', 'PERSONNEL', 40.7128, -74.006,
    'EXEC — New York', 'Authorized administrator',
    'SOVEREIGN', 'NOMINAL', FALSE,
    'C-suite executive access via Zero Trust NAC. MFA verified. Session active. Read-only mode.',
    'Entra ID / Conditional Access', 'T-00:02', 100,
    '["C-SUITE","MFA-VERIFIED","READ-ONLY"]'::jsonb
  ),
  (
    'geo-personnel-002', 'PERSONNEL', 34.0522, -118.2437,
    'DEVOPS — Los Angeles', 'Infrastructure engineer',
    'RESTRICTED', 'NOMINAL', FALSE,
    'Senior DevOps engineer. Active deployment pipeline session. Azure RBAC: Contributor on Compute RG. Approved change window.',
    'Entra ID / Azure RBAC', 'T-00:08', 100,
    '["DEVOPS","CONTRIBUTOR","CHANGE-WINDOW"]'::jsonb
  ),
  (
    'geo-personnel-003', 'PERSONNEL', 48.8566, 2.3522,
    'ANALYST — Paris', 'Security analyst — read-only',
    'CONFIDENTIAL', 'NOMINAL', FALSE,
    'SOC analyst reviewing threat telemetry. Reader role on Aegis SIEM workspace. No anomalies.',
    'Entra ID / Aegis Access Log', 'T-00:14', 100,
    '["SOC","READER","NOMINAL"]'::jsonb
  ),
  (
    'geo-weather-001', 'WEATHER', 38.9072, -77.0369,
    'WEATHER-DC — Thunderstorm risk', 'AZ-1 availability concern',
    'OPEN', 'LOW', FALSE,
    'Severe thunderstorm watch in DC metro. Azure US East AZ-1 may experience power fluctuation. HA failover pre-warmed to AZ-2.',
    'NOAA API / Azure Health', 'T-00:30', 78,
    '["WEATHER","AZ-RISK","PRE-WARMED"]'::jsonb
  ),
  (
    'geo-weather-002', 'WEATHER', 35.6762, 139.6503,
    'WEATHER-Tokyo — Seismic alert', 'APAC edge node monitoring',
    'OPEN', 'LOW', FALSE,
    'M4.2 earthquake registered near Tokyo. Azure Japan East CDN edge operating normally. No infrastructure impact detected.',
    'JMA / Azure Health Advisories', 'T-01:15', 90,
    '["SEISMIC","MONITORING","NO-IMPACT"]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;
