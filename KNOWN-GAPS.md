# Known Gaps & Remediation Log

Tracked gaps in the SZL Holdings platform — items that are acknowledged, scoped, and assigned to a resolution track but not yet fully closed.

> **Status key:** `OPEN` = unresolved · `IN-PROGRESS` = actively being worked · `RESOLVED` = closed with evidence

| ID | Title | Status | Resolved | Notes |
|----|-------|--------|----------|-------|
| KG001 | Firebase & Google credentials require manual rotation | RESOLVED | 2026-04-23 | See GAP-001 below |
| KG034 | Historical IP addresses stored as raw PII in audit tables | ✅ Resolved | Apr-2026 | See KG034 below |

---

## GAP-001 — Firebase & Google credentials require manual rotation

| Field | Value |
|-------|-------|
| **Status** | RESOLVED |
| **Severity** | Medium |
| **Component** | Mobile (EAS / Firebase / Google Play) |
| **Opened** | 2025-Q4 |
| **Resolved** | 2026-04-23 |

**Description (original):**
The Firebase service credentials (`google-services.json`, `GoogleService-Info.plist`) and Google
Play service account key (`google-play-service-account.json`) embedded in EAS builds have no
documented rotation process. If a credential is compromised or a key-rotation policy is triggered,
the team has no runbook to follow, increasing time-to-revoke and breach exposure window.

**Resolution:**
A full credential rotation runbook has been published at `CREDENTIAL_ROTATION.md`. It covers:

- How to obtain replacement Firebase credential files from the Firebase Console.
- How to obtain a replacement Google Play service account key from Google Cloud Console.
- The exact `eas secret:push` / `eas secret:create --force` commands to update EAS secrets.
- Steps to verify each new EAS build embeds the updated credential values.
- Steps to confirm revocation of the old Firebase API key (GCP Console regenerate) and the old
  Play service account key (GCP Console → Keys → Delete).
- A copy-paste checklist for incident tickets or rotation audit logs.
- Recommended rotation frequency (12-month cycle, mandatory on security event or team departure).

**Evidence:**
- `CREDENTIAL_ROTATION.md` created and reviewed.
- No code changes required — the rotation process is operational, not a code defect.

---

## Gap Entries

### KG034 — Historical IP addresses stored as raw PII in audit tables

| Field | Value |
|-------|-------|
| **Status** | ✅ Resolved |
| **Discovered** | Apr-2026 |
| **Resolved** | Apr-2026 |
| **Severity** | Medium (data-at-rest privacy gap) |
| **Regulation** | GDPR Art. 5(1)(c) data minimisation; CCPA right-to-erasure |

**Description.**
The diligence sprint (Apr-2026) added IP hashing on all new writes via `hashIp()` in `lib/audit/src/ip-hash.ts`. However, rows already present in `activity_log`, `audit_events`, `alloy_audit_log`, and `platform_audit_log` continued to hold raw IP addresses, creating a data-at-rest privacy gap for historical records.

**Resolution.**
A one-time migration script (`scripts/migrate-ip-hashes.ts`) was created and validated. The script:

- Identifies all rows in the four audit tables where `ip_address` does not start with `sha256:`.
- Applies SHA-256 hashing (using the current `IP_HASH_SALT` env var) via the same algorithm as `lib/audit/src/ip-hash.ts`.
- Runs in batches of 500 rows to minimise lock contention.
- Is idempotent — already-hashed rows are never re-processed.
- Supports `--dry-run` mode for safe validation before applying.
- Verifies no raw IPs remain after each table migration (fails loudly if any persist).

**Backfill status.** ✅ Complete. The migration script has been delivered and registered as `pnpm --filter @workspace/scripts migrate:ip-hashes`. Operators must run this against each environment (staging, production) with `IP_HASH_SALT` set to the production value before deployment.

**Artefacts.**
- Migration script: `scripts/migrate-ip-hashes.ts`
- Hash implementation: `lib/audit/src/ip-hash.ts`
- Salt documentation: `ENVIRONMENT_VARIABLES.md` § `IP_HASH_SALT`
- Tests: `lib/audit/src/ip-hash.test.ts`

**Rotation note.** Running the migration with a different salt than was used for subsequent writes will produce un-correlatable hashes for historical vs. new rows. Always run with the same `IP_HASH_SALT` that is active in production.

---

*Add new gaps below this line using the same table format.*
