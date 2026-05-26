---
name: GitHub org 2FA enforcement silently no-ops via API
description: PATCH /orgs/{org} accepts two_factor_requirement_enabled and returns 200 but the field stays false on free-tier orgs.
---

`PATCH /orgs/{org}` with `{"two_factor_requirement_enabled": true}` returns **200 OK** but the response body still shows `two_factor_requirement_enabled: false`. No error, no warning.

**Why:** GitHub silently rejects org-level 2FA enforcement via the REST API on free-tier orgs (and possibly when there is no validated billing contact / security manager seat). It is enforceable only from the org Settings → Authentication security web UI, never via the API.

**How to apply:** Don't treat a 200 from that PATCH as success — re-read the field and verify. If it stays false and the org is on the free plan, surface it as a manual step ("turn this on at https://github.com/organizations/<org>/settings/security"), don't loop retrying. Personal-account 2FA status is unrelated; it can be on while the org-level requirement still won't flip.
