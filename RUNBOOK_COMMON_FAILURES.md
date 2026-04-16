# Runbook: Common Failures — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** On-call engineering, Incident Commanders
**Companion docs:** [INCIDENT_COMMAND_PLAYBOOK.md](INCIDENT_COMMAND_PLAYBOOK.md) · [SEVERITY_MODEL.md](SEVERITY_MODEL.md)

> This runbook covers the most common failure scenarios and the fastest path to resolution for each. It is not a debugging guide — it is a response guide. Follow steps in order.

---

## How to Use This Runbook

1. Identify the failure scenario from the list below
2. Follow the steps for that scenario in order
3. If the scenario is not covered or steps do not resolve the issue, escalate to engineering lead
4. Log every action taken in the incident record

---

## Scenario Index

- [1. API Server Not Responding](#1-api-server-not-responding)
- [2. Authentication Broken (Users Cannot Log In)](#2-authentication-broken)
- [3. Database Connection Failure](#3-database-connection-failure)
- [4. Deployment Rollback](#4-deployment-rollback)
- [5. WebSocket Connection Failures](#5-websocket-connection-failures)
- [6. AI Service Degraded or Unavailable](#6-ai-service-degraded-or-unavailable)
- [7. Credential Exposure / Secret Rotation](#7-credential-exposure--secret-rotation)
- [8. High Error Rate on a Specific Route](#8-high-error-rate-on-a-specific-route)
- [9. Tenant Data Isolation Concern](#9-tenant-data-isolation-concern)
- [10. Object Storage / File Upload Failure](#10-object-storage--file-upload-failure)

---

## 1. API Server Not Responding

**Symptoms:** `GET /api/health` returns non-200, timeout, or connection refused. All API routes affected.

**Classify:** P0 if all routes affected. P1 if partial.

### Steps

1. Check `GET /api/health` — what does it return?
2. Check workflow status: is the API server process running? (Replit: check workflow console; Azure: check App Service)
3. Check server logs for crash or startup failure
4. Has there been a recent deployment? If yes → **go to Scenario 4: Rollback**
5. If no recent deployment: restart the API server process
6. Wait 60 seconds, check `GET /api/health` again
7. If still failing: check database connectivity (→ Scenario 3)
8. If still failing: check environment variables are loaded (secrets missing can cause startup failure)
9. If no resolution within 15 minutes: escalate to senior engineer; notify IC

**Verification:** `GET /api/health` returns 200. Spot-check one authenticated route.

---

## 2. Authentication Broken

**Symptoms:** Users cannot log in. OIDC callback failing. "Unauthorized" on all protected routes.

**Classify:** P0 (affects all users).

### Steps

1. Determine: is the issue with OIDC/SSO or credential (email/password) login, or both?
2. Check `SESSION_SECRET` environment variable — is it set and valid?
3. Check OIDC provider configuration (Replit Auth / Azure AD) — is the IdP itself responding?
4. Check `/api/auth/*` route logs for specific error messages
5. Has `SESSION_SECRET` been rotated recently? If yes, all existing sessions are invalid — users must re-login (this is expected behavior, not a bug)
6. Check the PostgreSQL `sessions` table — can the server read from it?
7. Has there been a recent deployment? If yes → **go to Scenario 4: Rollback**
8. Restart the API server process
9. Test login flow with a known test account
10. If OIDC provider is down: fall back to credential login if available; communicate to users

**Verification:** Log in successfully with a test account. Confirm session persists across page reload.

---

## 3. Database Connection Failure

**Symptoms:** `GET /api/health` returns DB error. Queries failing across routes. `ECONNREFUSED` or `ETIMEDOUT` in logs.

**Classify:** P0 if all queries failing. P1 if intermittent.

### Steps

1. Check `DATABASE_URL` environment variable — is it set and correct?
2. Check database host availability: `pg_isready -d $DATABASE_URL` or use the management console
3. Is the Replit-managed PostgreSQL service up? Check Replit status page or Azure PostgreSQL service health
4. Check connection pool settings — is the pool exhausted? (Look for "too many clients" errors)
5. Check for long-running queries blocking connections (review `pg_stat_activity`)
6. If connection pool exhausted: restart the API server to reset connections
7. If database host is unreachable: escalate to infrastructure — this is a managed service issue
8. If in production on Azure: check Azure Database for PostgreSQL service health dashboard
9. Do not run ad-hoc queries on production without explicit approval

**Verification:** `GET /api/health/db` returns healthy. One successful read query completes.

---

## 4. Deployment Rollback

**Symptoms:** Recent deployment caused regressions. Users reporting broken functionality immediately after deploy.

**Classify:** P1 minimum; P0 if core auth or all routes affected.

### Steps

1. **Confirm the deployment timeline.** When was the last deploy? What changed?
2. **Make the rollback decision quickly** — if deploy was within last 2 hours and cause is unclear → rollback immediately
3. **Replit environment (development):**
   - Identify the last known-good checkpoint in Replit history
   - Restore to that checkpoint
   - Restart all workflows
4. **GitHub/Azure (production):**
   - Identify the last known-good commit SHA
   - Trigger a redeployment of that commit via CI/CD pipeline
   - Or: use Azure deployment slots to swap back to the previous slot
5. Wait 60 seconds after restart
6. Run the post-rollback verification checklist:
   - [ ] `GET /api/health` → 200
   - [ ] Authentication flow works
   - [ ] The original broken route/feature is working again
   - [ ] No new errors in logs
7. **Communicate:** Update status page. Notify IC.
8. **After rollback:** investigate the root cause before re-deploying the fix

**Verification:** All critical paths working. Original regression no longer reproducible.

---

## 5. WebSocket Connection Failures

**Symptoms:** Real-time features not updating. WebSocket connection errors in browser console. `ws: unauthorized` or ticket validation errors in server logs.

**Classify:** P2 (partial degradation). Escalate to P1 if affecting core workflow features.

### Steps

1. Check server logs for WebSocket ticket validation errors
2. Has `SESSION_SECRET` changed? WebSocket tickets are signed with `SESSION_SECRET` — rotating it invalidates all existing tickets (expected behavior)
3. Check the WebSocket upgrade endpoint — is it responding?
4. Check if the issue is all users or a specific org (org-scoped WebSocket channels)
5. Ask affected users to clear browser cache and re-authenticate — this forces new ticket generation
6. Check for proxy/firewall issues if on enterprise network (WebSocket upgrade may be blocked)
7. Restart the API server to reset WebSocket state if stuck
8. Verify org_id prefix on channel names is correct in recent code changes

**Verification:** Real-time updates flow in affected features for a test user.

---

## 6. AI Service Degraded or Unavailable

**Symptoms:** AI analysis requests failing or timing out. `500` or `503` on `/api/ai/*` routes. Proof Chain entries not being written.

**Classify:** P2 (AI degradation). P1 if AI governance layer (Covenant Policy, Proof Chain) is not recording.

### Steps

1. Check which AI provider is failing: HuggingFace (primary), OpenAI (fallback 1), Anthropic (fallback 2), Gemini (fallback 3)
2. Test the fallback chain — is the multi-provider fallback kicking in?
3. Check provider status pages: HuggingFace Status, OpenAI Status, Anthropic Status
4. Check API key validity — have keys expired or been rotated without updating the environment?
5. Check rate limit headers in API responses — are we being throttled?
6. If all providers failing: AI features are offline. Non-AI features continue. Communicate to affected users.
7. If Proof Chain is not recording: this is P1 (governance critical path). Escalate to engineering immediately.
8. Check `lib/ai-engine/` logs for specific error messages

**Verification:** Submit a test AI query and confirm Proof Chain entry is created with correct provider attribution.

---

## 7. Credential Exposure / Secret Rotation

**Symptoms:** Secret committed to source control, API key exposed in logs, credential breach suspected.

**Classify:** P0 if exposure is confirmed or strongly suspected.

### Steps

1. **Rotate immediately** — treat any exposed credential as compromised. Do not wait to confirm exploitation.
2. Identify which credential was exposed: which service, which environment (dev/prod)
3. **Do not delete the git commit history manually** — if the credential is in git, use `git filter-repo` or contact GitHub support (for public repos)
4. Rotate in this order:
   - Revoke the old credential at the provider (Azure, Stripe, OpenAI, etc.)
   - Generate a new credential
   - Update Replit Secrets (development) or Azure Key Vault (production) with the new credential
   - Restart affected services
5. Audit access logs for the exposed credential for signs of unauthorized use
6. Notify stephen@szlholdings.com immediately
7. Log in `KNOWN-GAPS.md` under incident log
8. If the exposure involved customer data access: escalate to security incident (→ see **Security Incident Addendum** in [INCIDENT_COMMAND_PLAYBOOK.md](INCIDENT_COMMAND_PLAYBOOK.md))

**Verification:** Old credential is rejected. New credential is accepted. Services restart cleanly.

---

## 8. High Error Rate on a Specific Route

**Symptoms:** A specific route (`/api/vessels/*`, `/api/ai/*`, etc.) returning elevated 500 rates. Other routes healthy.

**Classify:** P2 minimum. P1 if it is a core product route with customer impact.

### Steps

1. Identify the exact route(s) affected from logs or monitoring
2. When did the error rate spike? Correlate with recent deployments
3. Pull a sample of error responses — what is the specific error message?
4. Common causes and checks:
   - **Zod validation error:** New required field missing from request schema — check recent schema changes
   - **Database query error:** Missing migration, changed column, or constraint violation
   - **Null pointer / undefined access:** New code path not handling edge case
   - **Rate limit from upstream:** Third-party API returning 429
   - **Tenant scope error:** Query without required `org_id` — check middleware configuration
5. If cause is clear and fix is < 30 minutes: fix forward with close monitoring
6. If cause is unclear or fix is > 30 minutes: consider rollback (→ Scenario 4)
7. Communicate status: is this affecting specific users or customers? Notify them per [SUPPORT_OPERATIONS.md](SUPPORT_OPERATIONS.md)

**Verification:** Error rate returns to baseline. Affected route returns expected responses.

---

## 9. Tenant Data Isolation Concern

**Symptoms:** User reports seeing data that doesn't belong to their org. Potential cross-tenant data leak.

**Classify:** P0 — treat as confirmed breach until proven otherwise.

### Steps

1. **Immediately preserve logs** — do not rotate or delete anything
2. Notify stephen@szlholdings.com and security@szlholdings.com — **do not wait for confirmation**
3. Engage legal counsel before making any public statement
4. Identify which query returned cross-tenant data — find the route handler
5. Check for missing `WHERE org_id = ?` predicate in the identified query
6. Check `tenantScope` middleware — is it applied to this route?
7. Determine scope: how many orgs could have seen other tenants' data? For how long?
8. If a code defect is confirmed: patch, deploy, and verify the fix closes the isolation gap
9. After patch: audit the Proof Chain for any cross-tenant access events
10. Customer notification: per GDPR/CCPA requirements and legal guidance

**Verification:** The affected query now correctly enforces `org_id` scoping. Audit confirms no further cross-tenant data accessible.

---

## 10. Object Storage / File Upload Failure

**Symptoms:** File uploads failing. Documents not accessible. `403` or `404` on storage URLs.

**Classify:** P2 (partial degradation).

### Steps

1. Check the storage provider status (Replit object storage or Azure Blob)
2. Check storage credentials in environment variables — have they expired or been rotated?
3. Check storage ACL settings — are objects set to private by default? (They should be)
4. Verify `org_id` is present in the storage key prefix for the affected file
5. Check file size — is the upload exceeding the 100MB limit?
6. Check MIME type validation — is the file type on the allowlist?
7. If Azure Blob: check the Azure portal for storage service health and replication status
8. If soft-delete is enabled (production): check if the blob was soft-deleted and can be recovered

**Verification:** A test file upload succeeds. The file is retrievable at the correct path.

---

## Escalation When This Runbook Doesn't Resolve the Issue

If you have followed the steps for a scenario and the issue is not resolved within:
- **P0:** 30 minutes
- **P1:** 2 hours
- **P2:** 4 hours

Then:
1. Escalate to the Incident Commander immediately
2. Provide: what you've tried, current state, specific error messages, any hypothesis
3. IC will engage additional engineering resources or escalate to external support

---

*Runbook — Common Failures last reviewed: **2026-04-16** · Update this document after every significant incident where a new failure mode is encountered.*
