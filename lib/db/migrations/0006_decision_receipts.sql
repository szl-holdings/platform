-- Decision Receipts table
-- Stores structured, cryptographically-signed records of every governed decision
-- as specified in ops/frontier/final-frontier-report.md §5.2 and
-- ops/benchmark/action-and-decision-receipts.md

CREATE TABLE IF NOT EXISTS decision_receipts (
  id                      SERIAL PRIMARY KEY,
  receipt_id              TEXT NOT NULL UNIQUE,
  domain                  TEXT NOT NULL,
  action_type             TEXT NOT NULL,
  action_label            TEXT NOT NULL,
  actor_user_id           INTEGER,
  actor_name              TEXT,
  actor_role              TEXT,
  timestamp               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_snapshot           JSONB NOT NULL DEFAULT '{}',
  ai_recommendation       JSONB,
  alternatives_considered JSONB NOT NULL DEFAULT '[]',
  rationale               TEXT,
  outcome                 TEXT NOT NULL,
  risk_level              TEXT,
  confidence              REAL,
  decision_id             TEXT,
  workflow_id             TEXT,
  approval_id             INTEGER,
  non_repudiation_hash    TEXT NOT NULL,
  hash_algorithm          TEXT NOT NULL DEFAULT 'sha256',
  metadata                JSONB NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decision_receipts_actor  ON decision_receipts(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_decision_receipts_domain ON decision_receipts(domain);
CREATE INDEX IF NOT EXISTS idx_decision_receipts_created ON decision_receipts(created_at DESC);
