-- Migration: 0167_proof_chain_attestations
--
-- Backfill of historical audit_chain_events to hybrid (Ed25519+ML-DSA-65) signatures.
-- The original ledger is NOT rewritten — attestations are appended as a parallel record
-- so hash chains stay intact and integrity is preserved.
--
-- Tables:
--   proof_chain_hybrid_attestations    — one row per attested audit_chain_event
--   proof_chain_attestation_quarantine — entries whose integrity guard failed
--   proof_chain_attestation_checkpoint — resumable cursor for the Temporal backfill workflow

CREATE TABLE IF NOT EXISTS "proof_chain_hybrid_attestations" (
  "id"                       SERIAL       PRIMARY KEY,
  "event_id"                 INTEGER      NOT NULL UNIQUE,
  "event_hash"               TEXT         NOT NULL,
  "org_id"                   INTEGER,
  "ed25519_sig"              TEXT         NOT NULL,
  "mldsa65_sig"              TEXT         NOT NULL,
  "sig_public_key_ed25519"   TEXT         NOT NULL,
  "sig_public_key_mldsa65"   TEXT         NOT NULL,
  "attesting_did"            TEXT         NOT NULL,
  "key_id"                   TEXT         NOT NULL,
  "scheme_version"           TEXT         NOT NULL DEFAULT 'hybrid-ed25519-mldsa65-v1',
  "cert_thumbprint"          TEXT,
  "attested_at"              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "attestation_kind"         TEXT         NOT NULL DEFAULT 'backfill'
    CHECK ("attestation_kind" IN ('backfill','catch_up')),
  "metadata"                 JSONB        NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS "pcha_event_idx"      ON "proof_chain_hybrid_attestations"("event_id");
CREATE INDEX IF NOT EXISTS "pcha_org_idx"        ON "proof_chain_hybrid_attestations"("org_id");
CREATE INDEX IF NOT EXISTS "pcha_did_idx"        ON "proof_chain_hybrid_attestations"("attesting_did");
CREATE INDEX IF NOT EXISTS "pcha_attested_idx"   ON "proof_chain_hybrid_attestations"("attested_at");

CREATE TABLE IF NOT EXISTS "proof_chain_attestation_quarantine" (
  "id"                  SERIAL       PRIMARY KEY,
  "event_id"            INTEGER      NOT NULL UNIQUE,
  "org_id"              INTEGER,
  "expected_prev_hash"  TEXT,
  "actual_prev_hash"    TEXT,
  "expected_event_hash" TEXT,
  "actual_event_hash"   TEXT,
  "failure_reason"      TEXT         NOT NULL,
  "decision"            TEXT         NOT NULL DEFAULT 'pending'
    CHECK ("decision" IN ('pending','accepted','known_bad','escalated')),
  "decided_by"          INTEGER,
  "decided_at"          TIMESTAMPTZ,
  "decision_note"       TEXT,
  "quarantined_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "pcaq_event_idx"    ON "proof_chain_attestation_quarantine"("event_id");
CREATE INDEX IF NOT EXISTS "pcaq_decision_idx" ON "proof_chain_attestation_quarantine"("decision");
CREATE INDEX IF NOT EXISTS "pcaq_org_idx"      ON "proof_chain_attestation_quarantine"("org_id");

CREATE TABLE IF NOT EXISTS "proof_chain_attestation_checkpoint" (
  "id"                  TEXT         PRIMARY KEY,
  "last_event_id"       INTEGER      NOT NULL DEFAULT 0,
  "total_attested"      INTEGER      NOT NULL DEFAULT 0,
  "total_quarantined"   INTEGER      NOT NULL DEFAULT 0,
  "total_skipped"       INTEGER      NOT NULL DEFAULT 0,
  "started_at"          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "completed_at"        TIMESTAMPTZ,
  "status"              TEXT         NOT NULL DEFAULT 'running'
    CHECK ("status" IN ('running','paused','completed','failed')),
  "summary"             JSONB
);
