# Credential compromise

**Runbook ID:** `credential_compromise`
**Incident class key:** `credential-compromise`
**Source:** `services/sentra-core/src/sentra_core/incident_response.py::credential_compromise()`

## When to invoke
- Anomalous authentication signal: impossible travel, brute-force burst, or
  exposed token reported by Sentra detectors.
- ATT&CK `T1078` (Valid Accounts) or `T1003` (OS Credential Dumping) edge
  against an identity-kind asset.

## Steps (mirrors the DSL)
1. **rotate_secrets** — rotate every secret associated with `affected_assets`.
2. **invalidate_sessions** — kill all live sessions for the impacted
   identities.
3. **audit_recent_auth** — pull the last 24 hours of auth events for the
   impacted identities.

## Evidence
Auth logs, token-rotation receipts, and any tooling output (e.g. okta or
Azure AD admin logs) should be added to an evidence pack and committed to
yawar topic `sentra.evidence`.

## Recovery exit
New credentials issued, MFA re-enrolled, and a post-incident note attached.
