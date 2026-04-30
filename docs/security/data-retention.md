# Data Retention Policy — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026 · **Classification:** Internal
**Owner:** Engineering · **Review cycle:** Annual or on material change

---

## Overview

This document defines how long different categories of data are retained on the SZL Holdings platform, who is responsible for enforcement, and what procedures govern deletion, archival, and export.

Data retention is enforced at the application level via scheduled jobs and at the database level via retention policies on partitioned tables where applicable.

---

## Data Categories & Retention Periods

### 1. Operational Data

| Data Category | Retention Period | Notes |
|---------------|-----------------|-------|
| User sessions | 24 hours (active) + 7 days (inactive) | Invalidated on logout |
| API request logs | 90 days | Retained for debugging and rate limit analysis |
| Error logs | 90 days | PII scrubbed before logging |
| Health check / metrics | 30 days | Aggregated after 7 days |

### 2. Proof Chain Records

| Data Category | Retention Period | Notes |
|---------------|-----------------|-------|
| Proof chain entries (all) | Indefinite | Immutable — no deletion permitted by policy |
| Proof chain AI-generated content | Per proof retention policy | Retracted proofs are marked but not deleted — audit integrity requires retention |
| Export audit log | Indefinite | Immutable record of all content exported from the platform |

**Rationale:** The proof chain is an immutable audit ledger. Deletion of proof records would compromise the integrity of the audit trail and is prohibited. Even retracted content retains its proof record — the retraction status is recorded as a new state, not a deletion.

### 3. Covenant Policy Decisions

| Data Category | Retention Period | Notes |
|---------------|-----------------|-------|
| Policy decision log (in-memory) | Up to 1,000 recent decisions (rolling) | Overflow dropped — persistent log in database |
| Policy decision log (database) | 2 years | Required for compliance audit |
| Policy changes & version history | Indefinite | Policy changes are themselves audit events |

### 4. Audit Trail

| Data Category | Retention Period | Notes |
|---------------|-----------------|-------|
| Decision audit entries | Minimum 2 years | Immutable append-only |
| Human approval/denial records | Minimum 5 years | Required for compliance and legal holds |
| AI agent action records | Minimum 2 years | Required for AI governance audits |
| Export events | Minimum 5 years | Regulatory requirement |
| Security incident records | Minimum 7 years | Required for insurance and legal purposes |

### 5. Domain-Specific Business Data

| Domain | Data Category | Retention Period | Notes |
|--------|---------------|-----------------|-------|
| Aegis | Threat intelligence signals | 1 year | STIX/TAXII feeds expire per source policy |
| Aegis | Incident records | Minimum 5 years | Required for regulatory reporting |
| Terra | Property valuations | 7 years | Regulatory requirement (real estate) |
| Terra | Transaction records | 7 years | Required for audit and tax purposes |
| Vessels | AIS position data | 1 year | IMO data retention requirement |
| Vessels | Sanctions check records | 7 years | OFAC/regulatory requirement |
| Vessels | Voyage P&L records | 5 years | Commercial requirement |
| Counsel | Legal matter records | Per matter configuration | Client-controlled retention |
| Lyte | Financial analysis records | 5 years | Regulatory requirement |
| Carlota Jo | Client communication records | 3 years | Standard consulting retention |

### 6. AI & Model Data

| Data Category | Retention Period | Notes |
|---------------|-----------------|-------|
| Prompt hashes (SHA-256 truncated) | Per proof chain policy | Stored as hash only — no raw prompts stored |
| Model inference logs | 30 days | Scrubbed of content after 7 days, metadata retained |
| Outcome graph / learning job data | 3 years | Required for model calibration history |
| Recommendation records | 3 years | Required for outcome tracking and learning |
| Confidence calibration data | 2 years | Required for model improvement |

### 7. User & Account Data

| Data Category | Retention Period | Notes |
|---------------|-----------------|-------|
| User account data (active users) | Duration of relationship | Deleted on account closure + 30 days |
| User account data (deleted accounts) | 30 days post-deletion | Required for recovery window |
| User activity logs | 1 year | Aggregated after 90 days |
| Organization data | Duration of contract | Deleted per data deletion agreement |

---

## Deletion Procedures

### Standard Deletion

Standard deletion (user-requested, account closure):

1. Mark account/org as `pending_deletion`
2. After 30-day grace period, set status to `deleted`
3. Scrub PII fields — replace with anonymized values
4. Retain records required for legal/regulatory purposes with PII removed
5. Proof chain and audit log records are retained (PII scrubbed)

### Right to Erasure (GDPR Article 17)

For verified GDPR erasure requests:

1. Identify all personal data associated with the data subject
2. Assess retention exceptions (legal obligation, legitimate interest, public interest)
3. For non-excepted data: anonymize in place (not deleted — audit integrity)
4. For excepted data: document legal basis for continued retention
5. Respond to data subject within 30 days with confirmation and any exceptions noted

**Note:** Proof chain records that form part of the platform's immutable audit trail are retained under the legitimate interest of audit integrity, with PII fields anonymized where technically feasible.

### Legal Holds

Legal holds override standard retention periods:

1. Legal team applies hold via platform admin interface
2. Hold flags records as `legal_hold` — immune to scheduled deletion
3. Hold remains until explicitly released by authorized legal team member
4. Hold activity is itself logged in the immutable audit trail

---

## Enforcement

### Automated Enforcement

- Scheduled database jobs run nightly to identify and process expired records
- Retention jobs are logged and their outcomes are part of the audit trail
- Failed retention jobs generate alerts and are retried with exponential backoff

### Manual Review

- Quarterly review of retention policies by Engineering + Legal
- Annual data inventory audit to identify undocumented data categories
- Retention policy changes require Engineering and Legal approval

---

## Related Documents

| Document | Path |
|----------|------|
| Trust Center Index | [TRUST_CENTER_INDEX.md](trust-center-index.md) |
| Tenancy Model | [TENANCY-MODEL.md](../architecture/tenancy-model.md) |
| Backup & Recovery | [BACKUP-RESTORE.md](../operations/backup-restore.md) |
| Access Control Matrix | [ACCESS-CONTROL-MATRIX.md](access-control-matrix.md) |
| Proof and Policy Model | [PROOF_AND_POLICY_MODEL.md](../architecture/proof-and-policy-model.md) |
