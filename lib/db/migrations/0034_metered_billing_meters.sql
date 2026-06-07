-- Migration: 0034_metered_billing_meters
-- Adds first-class meter definitions, per-plan allotments, admin corrections,
-- and usage threshold notification dedup tables required for usage-based /
-- metered billing on top of the existing seat and flat-tier billing layer.

-- ── billing_meters ────────────────────────────────────────────────────────────
-- Each row defines a billable meter: key, display name, aggregation logic,
-- billing window, and optional Stripe price attachment.

CREATE TABLE IF NOT EXISTS billing_meters (
  id              SERIAL PRIMARY KEY,
  key             TEXT NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  unit            TEXT NOT NULL DEFAULT 'unit',
  aggregation     TEXT NOT NULL DEFAULT 'sum'
                  CHECK (aggregation IN ('sum', 'last', 'unique_count')),
  billing_window  TEXT NOT NULL DEFAULT 'month'
                  CHECK (billing_window IN ('day', 'month', 'billing_cycle')),
  stripe_price_id TEXT,
  stripe_meter_id TEXT,
  pricing_model   TEXT NOT NULL DEFAULT 'per_unit'
                  CHECK (pricing_model IN ('per_unit', 'graduated', 'volume', 'package')),
  included_units  NUMERIC(18,6) NOT NULL DEFAULT 0,
  unit_amount     NUMERIC(12,6),
  product         TEXT NOT NULL DEFAULT 'platform',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS billing_meters_key_idx     ON billing_meters (key);
CREATE INDEX IF NOT EXISTS billing_meters_product_idx ON billing_meters (product);

-- Seed well-known platform meters used by Lyte, Sentra, Vessels, Pulse, and
-- agent compute so dashboards render without requiring manual admin setup.
INSERT INTO billing_meters (key, display_name, unit, aggregation, billing_window, pricing_model, included_units, product, description)
VALUES
  ('lyte.decision_runs',   'Lyte Decision Runs',         'run',      'sum',          'month', 'per_unit',  1000, 'lyte',    'AI decision intelligence runs per billing period'),
  ('sentra.scans',         'Sentra Security Scans',      'scan',     'sum',          'month', 'per_unit',  500,  'sentra',  'Active threat and compliance scans per billing period'),
  ('vessels.alert_evals',  'Vessels Alert Evaluations',  'eval',     'sum',          'month', 'per_unit',  2000, 'vessels', 'Maritime alert evaluations and risk assessments'),
  ('pulse.briefings',      'Pulse Executive Briefings',  'briefing', 'sum',          'month', 'per_unit',  30,   'pulse',   'AI-generated executive briefings per billing period'),
  ('agent.compute_mins',   'Agent Compute Minutes',      'min',      'sum',          'month', 'per_unit',  600,  'platform','Agent runtime compute in minutes per billing period'),
  ('api.calls',            'API Calls',                  'call',     'sum',          'month', 'per_unit',  10000,'platform','Total API calls across all platform services'),
  ('storage.gb',           'Storage GB',                 'GB',       'last',         'month', 'per_unit',  5,    'platform','Storage consumed at end of billing period in GB')
ON CONFLICT (key) DO NOTHING;

-- ── billing_meter_allotments ──────────────────────────────────────────────────
-- Per-plan included allotment for each meter. Overages beyond included_units
-- are billed at overage_unit_amount.

CREATE TABLE IF NOT EXISTS billing_meter_allotments (
  id                  SERIAL PRIMARY KEY,
  plan_id             INTEGER NOT NULL,
  meter_id            INTEGER NOT NULL REFERENCES billing_meters(id) ON DELETE CASCADE,
  included_units      NUMERIC(18,6) NOT NULL DEFAULT 0,
  stripe_price_id     TEXT,
  overage_unit_amount NUMERIC(12,6),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan_id, meter_id)
);

CREATE INDEX IF NOT EXISTS billing_meter_allotments_plan_idx   ON billing_meter_allotments (plan_id);
CREATE INDEX IF NOT EXISTS billing_meter_allotments_meter_idx  ON billing_meter_allotments (meter_id);

-- ── metering_corrections ──────────────────────────────────────────────────────
-- Admin adjustments (positive or negative) applied to usage for a specific
-- org + meter key + period. Every correction is audited.

CREATE TABLE IF NOT EXISTS metering_corrections (
  id                       SERIAL PRIMARY KEY,
  org_id                   INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meter_key                TEXT NOT NULL,
  quantity                 NUMERIC(18,6) NOT NULL,
  reason_code              TEXT NOT NULL DEFAULT 'other'
                           CHECK (reason_code IN ('data_correction','customer_request','system_error','promotional','other')),
  reason                   TEXT,
  applied_to_period_start  TIMESTAMPTZ,
  applied_to_period_end    TIMESTAMPTZ,
  created_by               INTEGER,
  applied_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata                 JSONB
);

CREATE INDEX IF NOT EXISTS metering_corrections_org_idx    ON metering_corrections (org_id);
CREATE INDEX IF NOT EXISTS metering_corrections_meter_idx  ON metering_corrections (org_id, meter_key);
CREATE INDEX IF NOT EXISTS metering_corrections_applied_idx ON metering_corrections (applied_at);

-- ── usage_threshold_notifications ─────────────────────────────────────────────
-- Idempotency guard: one row per org/meter/threshold/period prevents re-firing
-- of 50 / 80 / 100% usage warning emails in the same billing window.

CREATE TABLE IF NOT EXISTS usage_threshold_notifications (
  id           SERIAL PRIMARY KEY,
  org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meter_key    TEXT NOT NULL,
  threshold    INTEGER NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  notified_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, meter_key, threshold, period_start)
);

CREATE INDEX IF NOT EXISTS usage_threshold_notif_org_idx ON usage_threshold_notifications (org_id);
