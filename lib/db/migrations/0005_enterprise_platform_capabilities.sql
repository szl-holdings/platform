-- Migration: Enterprise & Platform Capabilities
-- Task #3560 — adds 6 new domain tables:
--   1. international_payment_rails  (SEPA/BACS rails)
--   2. esignature_requests          (DocuSign e-signature)
--   3. esignature_events            (signing event log)
--   4. court_filings                (court filing automation)
--   5. court_filing_events          (filing event log)
--   6. plugin_registry              (plugin/extension registry)
--   7. plugin_installations         (org-level plugin installs)
--   8. billing_disputes             (chargeback management)
--   9. treasury_accounts            (stablecoin + fiat accounts)
--  10. treasury_balance_snapshots   (balance point-in-time)
--  11. treasury_transactions        (on-chain/bank transactions)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. International Payment Rails (SEPA / BACS)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS international_payment_rails (
  id                    SERIAL PRIMARY KEY,
  org_id                INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rail                  TEXT NOT NULL CHECK (rail IN ('sepa', 'bacs', 'swift', 'ach')),
  currency              TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','active','suspended','cancelled')),
  mandate_ref           TEXT,
  mandate_status        TEXT DEFAULT 'pending'
                          CHECK (mandate_status IN ('pending','signed','revoked',NULL)),
  bank_account_last4    TEXT,
  bank_name             TEXT,
  account_holder_name   TEXT,
  provider              TEXT NOT NULL DEFAULT 'stripe'
                          CHECK (provider IN ('stripe','adyen','wise','internal')),
  provider_source_id    TEXT,
  metadata              JSONB,
  activated_at          TIMESTAMP,
  cancelled_at          TIMESTAMP,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS intl_rails_org_id_idx  ON international_payment_rails(org_id);
CREATE INDEX IF NOT EXISTS intl_rails_rail_idx     ON international_payment_rails(rail);
CREATE INDEX IF NOT EXISTS intl_rails_status_idx   ON international_payment_rails(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. E-Signature Requests
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS esignature_requests (
  id                    SERIAL PRIMARY KEY,
  org_id                INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  matter_id             INTEGER,
  requested_by_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  provider              TEXT NOT NULL DEFAULT 'docusign'
                          CHECK (provider IN ('docusign','hellosign','internal')),
  provider_envelope_id  TEXT UNIQUE,
  document_title        TEXT NOT NULL,
  document_url          TEXT,
  status                TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN (
                            'draft','sent','delivered','partially_signed',
                            'completed','declined','voided','expired'
                          )),
  signatories           JSONB NOT NULL DEFAULT '[]',
  completed_at          TIMESTAMP,
  expires_at            TIMESTAMP,
  metadata              JSONB,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS esig_requests_org_id_idx     ON esignature_requests(org_id);
CREATE INDEX IF NOT EXISTS esig_requests_matter_id_idx  ON esignature_requests(matter_id);
CREATE INDEX IF NOT EXISTS esig_requests_status_idx     ON esignature_requests(status);
CREATE INDEX IF NOT EXISTS esig_requests_envelope_id_idx ON esignature_requests(provider_envelope_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. E-Signature Events
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS esignature_events (
  id                SERIAL PRIMARY KEY,
  request_id        INTEGER NOT NULL REFERENCES esignature_requests(id) ON DELETE CASCADE,
  event_type        TEXT NOT NULL,
  signatory_email   TEXT,
  signatory_name    TEXT,
  payload           JSONB,
  occurred_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS esig_events_request_id_idx ON esignature_events(request_id);
CREATE INDEX IF NOT EXISTS esig_events_type_idx       ON esignature_events(event_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Court Filings
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS court_filings (
  id                                    SERIAL PRIMARY KEY,
  org_id                                INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  matter_id                             INTEGER,
  submitted_by_id                       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  filing_type                           TEXT NOT NULL DEFAULT 'other'
                                          CHECK (filing_type IN (
                                            'complaint','motion','answer','brief',
                                            'notice','order','stipulation','subpoena','other'
                                          )),
  jurisdiction                          TEXT NOT NULL,
  court_name                            TEXT,
  case_number                           TEXT,
  document_title                        TEXT NOT NULL,
  document_url                          TEXT,
  electronic_filing_system              TEXT NOT NULL DEFAULT 'manual'
                                          CHECK (electronic_filing_system IN (
                                            'pacer','odyssey','tyler_efsp','nycourts','ca_efiling','manual'
                                          )),
  efs_confirmation_number               TEXT,
  status                                TEXT NOT NULL DEFAULT 'draft'
                                          CHECK (status IN (
                                            'draft','ready','submitted','accepted',
                                            'rejected','pending_review','filed','failed'
                                          )),
  electronically_supported_jurisdiction BOOLEAN NOT NULL DEFAULT FALSE,
  due_date                              TIMESTAMP,
  submitted_at                          TIMESTAMP,
  accepted_at                           TIMESTAMP,
  rejected_at                           TIMESTAMP,
  filing_fee_amount                     DECIMAL(12,4),
  filing_fee_currency                   TEXT DEFAULT 'USD',
  metadata                              JSONB,
  created_at                            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at                            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS court_filings_org_id_idx    ON court_filings(org_id);
CREATE INDEX IF NOT EXISTS court_filings_matter_id_idx ON court_filings(matter_id);
CREATE INDEX IF NOT EXISTS court_filings_status_idx    ON court_filings(status);
CREATE INDEX IF NOT EXISTS court_filings_jurisdiction_idx ON court_filings(jurisdiction);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Court Filing Events
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS court_filing_events (
  id          SERIAL PRIMARY KEY,
  filing_id   INTEGER NOT NULL REFERENCES court_filings(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  actor_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes       TEXT,
  payload     JSONB,
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS court_filing_events_filing_id_idx ON court_filing_events(filing_id);
CREATE INDEX IF NOT EXISTS court_filing_events_type_idx      ON court_filing_events(event_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Plugin Registry
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plugin_registry (
  id                    SERIAL PRIMARY KEY,
  slug                  TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  version               TEXT NOT NULL,
  description           TEXT,
  author                TEXT,
  category              TEXT DEFAULT 'general',
  capabilities          JSONB NOT NULL DEFAULT '[]',
  config_schema         JSONB,
  governance_inherited  BOOLEAN NOT NULL DEFAULT TRUE,
  proof_chain_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  design_system_version TEXT DEFAULT '1.0.0',
  billing_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  pricing_model         TEXT DEFAULT 'free'
                          CHECK (pricing_model IN ('free','flat','usage')),
  published             BOOLEAN NOT NULL DEFAULT FALSE,
  installation_count    INTEGER NOT NULL DEFAULT 0,
  metadata              JSONB,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS plugin_registry_slug_idx      ON plugin_registry(slug);
CREATE INDEX IF NOT EXISTS plugin_registry_category_idx  ON plugin_registry(category);
CREATE INDEX IF NOT EXISTS plugin_registry_published_idx ON plugin_registry(published);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Plugin Installations (per-org)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plugin_installations (
  id          SERIAL PRIMARY KEY,
  plugin_id   INTEGER NOT NULL REFERENCES plugin_registry(id) ON DELETE CASCADE,
  org_id      INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  installed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  config      JSONB NOT NULL DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','disabled','uninstalled')),
  installed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (plugin_id, org_id)
);

CREATE INDEX IF NOT EXISTS plugin_installations_org_id_idx    ON plugin_installations(org_id);
CREATE INDEX IF NOT EXISTS plugin_installations_plugin_id_idx ON plugin_installations(plugin_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Billing Disputes (Chargebacks)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS billing_disputes (
  id                    SERIAL PRIMARY KEY,
  org_id                INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  external_dispute_id   TEXT NOT NULL UNIQUE,
  provider              TEXT NOT NULL DEFAULT 'stripe'
                          CHECK (provider IN ('stripe','adyen','internal')),
  reason                TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'open'
                          CHECK (status IN (
                            'open','under_review','charge_refunded','won','lost',
                            'warning_closed','warning_needs_response','warning_under_review',
                            'needs_response','accepted'
                          )),
  amount_disputed       DECIMAL(12,4) NOT NULL DEFAULT 0,
  currency              TEXT NOT NULL DEFAULT 'USD',
  payment_intent_id     TEXT,
  charge_id             TEXT,
  evidence_submitted    BOOLEAN NOT NULL DEFAULT FALSE,
  evidence_payload      JSONB,
  respond_by_date       TIMESTAMP,
  resolved_at           TIMESTAMP,
  metadata              JSONB,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS billing_disputes_org_id_idx  ON billing_disputes(org_id);
CREATE INDEX IF NOT EXISTS billing_disputes_status_idx  ON billing_disputes(status);
CREATE INDEX IF NOT EXISTS billing_disputes_ext_id_idx  ON billing_disputes(external_dispute_id);
CREATE INDEX IF NOT EXISTS billing_disputes_respond_by_idx ON billing_disputes(respond_by_date);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Treasury Accounts
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS treasury_accounts (
  id              SERIAL PRIMARY KEY,
  org_id          INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  currency        TEXT NOT NULL,
  currency_type   TEXT NOT NULL DEFAULT 'fiat'
                    CHECK (currency_type IN ('fiat','stablecoin','crypto')),
  network         TEXT,
  wallet_address  TEXT,
  provider        TEXT NOT NULL DEFAULT 'internal'
                    CHECK (provider IN ('coinbase_commerce','coinbase_prime','fireblocks','internal')),
  provider_account_id TEXT,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  metadata        JSONB,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS treasury_accounts_org_id_idx       ON treasury_accounts(org_id);
CREATE INDEX IF NOT EXISTS treasury_accounts_currency_type_idx ON treasury_accounts(currency_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Treasury Balance Snapshots
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS treasury_balance_snapshots (
  id          SERIAL PRIMARY KEY,
  account_id  INTEGER NOT NULL REFERENCES treasury_accounts(id) ON DELETE CASCADE,
  balance     DECIMAL(28,8) NOT NULL DEFAULT 0,
  balance_usd DECIMAL(18,4),
  usd_rate    DECIMAL(18,8),
  snapped_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS treasury_snapshots_account_id_idx ON treasury_balance_snapshots(account_id);
CREATE INDEX IF NOT EXISTS treasury_snapshots_snapped_at_idx ON treasury_balance_snapshots(snapped_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. Treasury Transactions
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS treasury_transactions (
  id              SERIAL PRIMARY KEY,
  account_id      INTEGER NOT NULL REFERENCES treasury_accounts(id) ON DELETE CASCADE,
  tx_type         TEXT NOT NULL DEFAULT 'credit'
                    CHECK (tx_type IN ('credit','debit','transfer','fee','yield')),
  amount          DECIMAL(28,8) NOT NULL,
  currency        TEXT NOT NULL,
  amount_usd      DECIMAL(18,4),
  tx_hash         TEXT,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'confirmed'
                    CHECK (status IN ('pending','confirmed','failed','cancelled')),
  metadata        JSONB,
  occurred_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS treasury_transactions_account_id_idx ON treasury_transactions(account_id);
CREATE INDEX IF NOT EXISTS treasury_transactions_tx_type_idx    ON treasury_transactions(tx_type);
CREATE INDEX IF NOT EXISTS treasury_transactions_occurred_at_idx ON treasury_transactions(occurred_at);
