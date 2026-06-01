-- Migration: create subscription_credits ledger table
-- Stores explicit credit entries issued by the refund workflow when a partial
-- refund is processed. Finance teams query this table directly rather than
-- scanning billing_audit_log for aggregated balances.

CREATE TABLE IF NOT EXISTS subscription_credits (
  id                   SERIAL PRIMARY KEY,
  org_id               INTEGER NOT NULL
                         REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id      INTEGER
                         REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount               NUMERIC(10, 2) NOT NULL,
  currency             TEXT NOT NULL DEFAULT 'usd',
  type                 TEXT NOT NULL DEFAULT 'refund_partial'
                         CHECK (type IN ('refund_partial', 'refund_adjustment', 'promo', 'void_offset')),
  source_refund_id     INTEGER
                         REFERENCES billing_refund_requests(id) ON DELETE SET NULL,
  applied_to_invoice_id INTEGER
                         REFERENCES invoices(id) ON DELETE SET NULL,
  created_by           INTEGER,
  note                 TEXT,
  metadata             JSONB,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscription_credits_org_id_idx
  ON subscription_credits (org_id);

CREATE INDEX IF NOT EXISTS subscription_credits_subscription_id_idx
  ON subscription_credits (subscription_id);

CREATE INDEX IF NOT EXISTS subscription_credits_source_refund_id_idx
  ON subscription_credits (source_refund_id);
