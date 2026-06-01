-- 0032_billing_foundation_hardening.sql
-- Billing platform foundation: idempotent Stripe event dedupe table,
-- payment methods mirror, refund request scaffold, tax calculation records,
-- alternative rail accounts, and billing audit log.
-- All statements use IF NOT EXISTS so re-runs are safe.

-- ─── billing_webhook_events ───────────────────────────────────────────────────
-- Dedupe table for Stripe webhook events. The UNIQUE constraint on
-- stripe_event_id ensures that duplicate deliveries (Stripe retries) are
-- detected before any side-effect is executed.

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id                SERIAL PRIMARY KEY,
  stripe_event_id   TEXT NOT NULL,
  event_type        TEXT NOT NULL,
  processed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  org_id            INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  status            TEXT NOT NULL DEFAULT 'processed'
                      CHECK (status IN ('processed', 'skipped', 'failed')),
  error_message     TEXT,
  metadata          JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_webhook_events_stripe_event_id_unique
  ON billing_webhook_events(stripe_event_id);

CREATE INDEX IF NOT EXISTS billing_webhook_events_event_type_idx
  ON billing_webhook_events(event_type);

CREATE INDEX IF NOT EXISTS billing_webhook_events_processed_at_idx
  ON billing_webhook_events(processed_at);

-- ─── billing_payment_methods ──────────────────────────────────────────────────
-- Mirrors Stripe PaymentMethod objects per org. Updated by the
-- payment_method.attached / payment_method.detached webhook events.

CREATE TABLE IF NOT EXISTS billing_payment_methods (
  id                          SERIAL PRIMARY KEY,
  org_id                      INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_payment_method_id    TEXT NOT NULL,
  stripe_customer_id          TEXT NOT NULL,
  type                        TEXT NOT NULL DEFAULT 'card',
  brand                       TEXT,
  last4                       TEXT,
  exp_month                   INTEGER,
  exp_year                    INTEGER,
  is_default                  BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                    JSONB,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_payment_methods_stripe_pm_id_unique
  ON billing_payment_methods(stripe_payment_method_id);

CREATE INDEX IF NOT EXISTS billing_payment_methods_org_id_idx
  ON billing_payment_methods(org_id);

CREATE INDEX IF NOT EXISTS billing_payment_methods_customer_id_idx
  ON billing_payment_methods(stripe_customer_id);

-- ─── billing_refund_requests ──────────────────────────────────────────────────
-- Tracks refund requests through their lifecycle. The multi-step approval
-- workflow is handled by the custom-refunds task; this table is the shared
-- data contract.

CREATE TABLE IF NOT EXISTS billing_refund_requests (
  id                          SERIAL PRIMARY KEY,
  org_id                      INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_charge_id            TEXT,
  stripe_refund_id            TEXT,
  stripe_payment_intent_id    TEXT,
  amount                      NUMERIC(10, 2),
  currency                    TEXT NOT NULL DEFAULT 'usd',
  reason                      TEXT NOT NULL DEFAULT 'requested_by_customer'
                                CHECK (reason IN ('duplicate','fraudulent','requested_by_customer','other')),
  status                      TEXT NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','approved','rejected','processing','completed','failed')),
  requested_by                INTEGER,
  approved_by                 INTEGER,
  notes                       TEXT,
  idempotency_key             TEXT UNIQUE,
  metadata                    JSONB,
  requested_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at                TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS billing_refund_requests_org_id_idx
  ON billing_refund_requests(org_id);

CREATE INDEX IF NOT EXISTS billing_refund_requests_status_idx
  ON billing_refund_requests(status);

CREATE INDEX IF NOT EXISTS billing_refund_requests_charge_id_idx
  ON billing_refund_requests(stripe_charge_id);

-- ─── billing_tax_calculations ─────────────────────────────────────────────────
-- Snapshots of Stripe Tax calculation results per invoice. The tax automation
-- task will extend this with jurisdiction-level overrides and reconciliation.

CREATE TABLE IF NOT EXISTS billing_tax_calculations (
  id                          SERIAL PRIMARY KEY,
  org_id                      INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_invoice_id           TEXT,
  stripe_tax_calculation_id   TEXT,
  tax_amount_exclusive        NUMERIC(10, 2),
  tax_amount_inclusive        NUMERIC(10, 2),
  currency                    TEXT NOT NULL DEFAULT 'usd',
  jurisdiction                TEXT,
  tax_type                    TEXT,
  tax_rate                    NUMERIC(6, 4),
  metadata                    JSONB,
  calculated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS billing_tax_calculations_org_id_idx
  ON billing_tax_calculations(org_id);

CREATE INDEX IF NOT EXISTS billing_tax_calculations_invoice_id_idx
  ON billing_tax_calculations(stripe_invoice_id);

-- ─── billing_rail_accounts ────────────────────────────────────────────────────
-- Alternative payment rail metadata per org. The ACH/crypto integration is
-- handled by the alternative-rails task; this table is the shared contract.

CREATE TABLE IF NOT EXISTS billing_rail_accounts (
  id                  SERIAL PRIMARY KEY,
  org_id              INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rail                TEXT NOT NULL DEFAULT 'card'
                        CHECK (rail IN ('card','ach','crypto','wire','sepa')),
  external_account_id TEXT,
  account_label       TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('active','pending','inactive','rejected')),
  is_default          BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at         TIMESTAMPTZ,
  metadata            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS billing_rail_accounts_org_id_idx
  ON billing_rail_accounts(org_id);

CREATE INDEX IF NOT EXISTS billing_rail_accounts_rail_idx
  ON billing_rail_accounts(rail);

-- ─── billing_audit_log ────────────────────────────────────────────────────────
-- Immutable audit trail for every billing-mutating action. Written via
-- writeBillingAudit() in lib/billing-audit.ts and never updated post-insert.

CREATE TABLE IF NOT EXISTS billing_audit_log (
  id                      SERIAL PRIMARY KEY,
  org_id                  INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  actor_id                INTEGER,
  actor_email             TEXT,
  action                  TEXT NOT NULL,
  resource                TEXT NOT NULL,
  resource_id             TEXT,
  before                  JSONB,
  after                   JSONB,
  stripe_event_id         TEXT,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  stripe_invoice_id       TEXT,
  idempotency_key         TEXT,
  ip_address              TEXT,
  user_agent              TEXT,
  metadata                JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS billing_audit_log_org_id_idx
  ON billing_audit_log(org_id);

CREATE INDEX IF NOT EXISTS billing_audit_log_action_idx
  ON billing_audit_log(action);

CREATE INDEX IF NOT EXISTS billing_audit_log_created_at_idx
  ON billing_audit_log(created_at);

CREATE INDEX IF NOT EXISTS billing_audit_log_actor_id_idx
  ON billing_audit_log(actor_id);
