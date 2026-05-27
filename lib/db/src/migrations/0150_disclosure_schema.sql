// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
-- Migration: 0150_disclosure_schema
-- Operationalizes third-party legal disclosure agreements.
-- Creates disclosure registry, legal agreement lifecycle, and
-- compliance framework control tables.
--
-- Table creation order respects FK dependencies:
--   1. disclosure_recipients
--   2. legal_agreements            (referenced by disclosure_records.agreement_id)
--   3. legal_agreement_versions    (references legal_agreements)
--   4. disclosure_records          (references disclosure_recipients + legal_agreements)
--   5. disclosure_subprocessors
--   6. compliance_framework_controls
--   7. compliance_control_evidence

-- ─── Disclosure Recipients ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "disclosure_recipients" (
  "id"                  SERIAL        PRIMARY KEY,
  "org_id"              INTEGER       NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "recipient_id"        TEXT          NOT NULL UNIQUE,
  "name"                TEXT          NOT NULL,
  "type"                TEXT          NOT NULL CHECK ("type" IN ('subprocessor','controller','third_party','partner','regulator','other')),
  "country"             TEXT,
  "legal_basis"         TEXT          NOT NULL CHECK ("legal_basis" IN ('contract','legal_obligation','vital_interests','public_task','legitimate_interests','consent','other')),
  "data_categories"     JSONB         NOT NULL DEFAULT '[]',
  "purpose_description" TEXT          NOT NULL,
  "contact_email"       TEXT,
  "safeguards"          TEXT,
  "is_approved"         BOOLEAN       NOT NULL DEFAULT false,
  "approved_at"         TIMESTAMPTZ,
  "approved_by"         TEXT,
  "archived_at"         TIMESTAMPTZ,
  "metadata"            JSONB,
  "created_at"          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updated_at"          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "dr_org_id_idx"      ON "disclosure_recipients"("org_id");
CREATE INDEX IF NOT EXISTS "dr_type_idx"         ON "disclosure_recipients"("type");
CREATE INDEX IF NOT EXISTS "dr_legal_basis_idx"  ON "disclosure_recipients"("legal_basis");

-- ─── Legal Agreements ─────────────────────────────────────────────────────────
-- Created before disclosure_records so the FK from disclosure_records.agreement_id
-- can reference legal_agreements.agreement_id.

CREATE TABLE IF NOT EXISTS "legal_agreements" (
  "id"                    SERIAL        PRIMARY KEY,
  "org_id"                INTEGER       NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "agreement_id"          TEXT          NOT NULL UNIQUE,
  "agreement_type"        TEXT          NOT NULL CHECK ("agreement_type" IN ('msa','dpa','nda','sla','addendum','other')),
  "counterparty_name"     TEXT          NOT NULL,
  "counterparty_email"    TEXT,
  "status"                TEXT          NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft','sent','under_review','countersigned','active','expired','terminated')),
  "version"               TEXT          NOT NULL DEFAULT '1.0',
  "linked_matter_id"      TEXT,
  "linked_recipient_id"   TEXT,
  "effective_date"        TIMESTAMPTZ,
  "expiry_date"           TIMESTAMPTZ,
  "sent_at"               TIMESTAMPTZ,
  "countersigned_at"      TIMESTAMPTZ,
  "terminated_at"         TIMESTAMPTZ,
  "termination_reason"    TEXT,
  "content_hash"          TEXT,
  "proof_ledger_entry_id" TEXT,
  "tags"                  JSONB         NOT NULL DEFAULT '[]',
  "metadata"              JSONB,
  "created_at"            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updated_at"            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "la_org_id_idx"       ON "legal_agreements"("org_id");
CREATE INDEX IF NOT EXISTS "la_type_idx"          ON "legal_agreements"("agreement_type");
CREATE INDEX IF NOT EXISTS "la_status_idx"        ON "legal_agreements"("status");
CREATE INDEX IF NOT EXISTS "la_counterparty_idx"  ON "legal_agreements"("counterparty_name");
CREATE INDEX IF NOT EXISTS "la_expiry_idx"        ON "legal_agreements"("expiry_date");

-- ─── Legal Agreement Versions ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "legal_agreement_versions" (
  "id"                  SERIAL        PRIMARY KEY,
  "agreement_id"        TEXT          NOT NULL REFERENCES "legal_agreements"("agreement_id") ON DELETE CASCADE,
  "org_id"              INTEGER       NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "version"             TEXT          NOT NULL,
  "change_description"  TEXT,
  "content_snapshot"    TEXT,
  "content_hash"        TEXT,
  "authored_by"         TEXT,
  "status"              TEXT          NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft','active','superseded','archived')),
  "created_at"          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "lav_agreement_id_idx"  ON "legal_agreement_versions"("agreement_id");
CREATE INDEX IF NOT EXISTS "lav_org_id_idx"         ON "legal_agreement_versions"("org_id");

-- ─── Disclosure Records ───────────────────────────────────────────────────────
-- Placed after disclosure_recipients and legal_agreements since it references both.

CREATE TABLE IF NOT EXISTS "disclosure_records" (
  "id"                    SERIAL        PRIMARY KEY,
  "org_id"                INTEGER       NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "disclosure_id"         TEXT          NOT NULL UNIQUE,
  "recipient_id"          TEXT          NOT NULL REFERENCES "disclosure_recipients"("recipient_id") ON DELETE RESTRICT,
  "agreement_id"          TEXT          REFERENCES "legal_agreements"("agreement_id") ON DELETE SET NULL,
  "data_categories"       JSONB         NOT NULL DEFAULT '[]',
  "legal_basis"           TEXT          NOT NULL CHECK ("legal_basis" IN ('contract','legal_obligation','vital_interests','public_task','legitimate_interests','consent','other')),
  "purpose_description"   TEXT          NOT NULL,
  "transfer_mechanism"    TEXT          CHECK ("transfer_mechanism" IN ('standard_contractual_clauses','adequacy_decision','binding_corporate_rules','derogation','api_integration','other')),
  "status"                TEXT          NOT NULL DEFAULT 'pending_approval' CHECK ("status" IN ('active','pending_approval','approved','expired','terminated','archived')),
  "effective_at"          TIMESTAMPTZ,
  "expires_at"            TIMESTAMPTZ,
  "last_reviewed_at"      TIMESTAMPTZ,
  "proof_ledger_entry_id" TEXT,
  "metadata"              JSONB,
  "created_at"            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updated_at"            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "drec_org_id_idx"       ON "disclosure_records"("org_id");
CREATE INDEX IF NOT EXISTS "drec_recipient_id_idx"  ON "disclosure_records"("recipient_id");
CREATE INDEX IF NOT EXISTS "drec_status_idx"        ON "disclosure_records"("status");
CREATE INDEX IF NOT EXISTS "drec_expires_at_idx"    ON "disclosure_records"("expires_at");

-- ─── Disclosure Subprocessors ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "disclosure_subprocessors" (
  "id"                    SERIAL        PRIMARY KEY,
  "org_id"                INTEGER       NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "subprocessor_id"       TEXT          NOT NULL UNIQUE,
  "name"                  TEXT          NOT NULL,
  "country"               TEXT          NOT NULL,
  "service_description"   TEXT          NOT NULL,
  "data_categories"       JSONB         NOT NULL DEFAULT '[]',
  "dpa_reference"         TEXT,
  "certifications"        JSONB         NOT NULL DEFAULT '[]',
  "status"                TEXT          NOT NULL DEFAULT 'pending' CHECK ("status" IN ('active','pending','removed','under_review')),
  "added_at"              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "removed_at"            TIMESTAMPTZ,
  "last_audited_at"       TIMESTAMPTZ,
  "proof_ledger_entry_id" TEXT,
  "metadata"              JSONB,
  "created_at"            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updated_at"            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "dsp_org_id_idx"  ON "disclosure_subprocessors"("org_id");
CREATE INDEX IF NOT EXISTS "dsp_status_idx"  ON "disclosure_subprocessors"("status");

-- ─── Compliance Framework Controls ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "compliance_framework_controls" (
  "id"                       SERIAL        PRIMARY KEY,
  "org_id"                   INTEGER       REFERENCES "organizations"("id") ON DELETE CASCADE,
  "control_id"               TEXT          NOT NULL UNIQUE,
  "framework"                TEXT          NOT NULL CHECK ("framework" IN ('eu-ai-act','nist-ai-rmf','iso-42001','csa-agentic')),
  "control_ref"              TEXT          NOT NULL,
  "control_title"            TEXT          NOT NULL,
  "description"              TEXT          NOT NULL,
  "a11oy_primitive"          TEXT,
  "evidence_source"          TEXT,
  "freshness_threshold_days" INTEGER       NOT NULL DEFAULT 30,
  "drilldown_type"           TEXT          CHECK ("drilldown_type" IN ('proof-ledger','mirror-eval','behavioral-audit','system-card','red-team','covenant','welfare','snapshot','pillpintu','cavd')),
  "drilldown_detail"         TEXT,
  "is_active"                BOOLEAN       NOT NULL DEFAULT true,
  "created_at"               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updated_at"               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "cfc_framework_idx"  ON "compliance_framework_controls"("framework");
CREATE INDEX IF NOT EXISTS "cfc_org_id_idx"      ON "compliance_framework_controls"("org_id");

-- ─── Compliance Control Evidence ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "compliance_control_evidence" (
  "id"                SERIAL        PRIMARY KEY,
  "org_id"            INTEGER       REFERENCES "organizations"("id") ON DELETE CASCADE,
  "control_id"        TEXT          NOT NULL REFERENCES "compliance_framework_controls"("control_id") ON DELETE CASCADE,
  "evidence_status"   TEXT          NOT NULL DEFAULT 'gap' CHECK ("evidence_status" IN ('fresh','stale','gap')),
  "last_evidence_at"  TIMESTAMPTZ,
  "last_assessed_at"  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "evidence_ref"      TEXT,
  "notes"             TEXT,
  "is_stale"          BOOLEAN       NOT NULL DEFAULT false,
  "metadata"          JSONB,
  "created_at"        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updated_at"        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "cce_control_id_idx"    ON "compliance_control_evidence"("control_id");
CREATE INDEX IF NOT EXISTS "cce_org_id_idx"         ON "compliance_control_evidence"("org_id");
CREATE INDEX IF NOT EXISTS "cce_status_idx"         ON "compliance_control_evidence"("evidence_status");
CREATE INDEX IF NOT EXISTS "cce_last_assessed_idx"  ON "compliance_control_evidence"("last_assessed_at");
