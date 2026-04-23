# Known Gaps

Tracked gaps in the SZL Holdings platform — items that are acknowledged, scoped, and assigned to a resolution track but not yet fully closed.

> **Status key:** `OPEN` = unresolved · `IN-PROGRESS` = actively being worked · `RESOLVED` = closed with evidence

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

*Add new gaps below this line using the same table format.*
