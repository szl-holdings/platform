# Post-Deploy Verification

**Owner:** CTO / Founder
**Last updated:** April 2026
**Version:** 1.0

---

## Purpose

This document defines the complete set of smoke tests that must run after every deployment to staging or production. Tests are organized by verification path. All automated checks must pass before declaring a deployment healthy. Manual checks are required on the first deploy to any new environment.

---

## How to Use This Document

1. Run **automated checks** first (copy-paste the curl commands, or run via CI).
2. If all automated checks pass and the deployment is to a new environment, run the **manual verification steps**.
3. Record pass/fail results in the deployment log.
4. If any check fails: initiate rollback immediately (see rollback procedure at end of this doc).

Set `DOMAIN` and smoke test credentials before running. Credentials must be stored in environment variables — **never hardcoded or committed to source control**. Provision these accounts in each environment using your secrets manager.

```bash
# Target environment
export DOMAIN=staging.szlholdings.com  # or: app.szlholdings.com for production

# Smoke test credentials (set from secrets manager, not inline)
# Store in Replit Secrets panel or CI secret store
export SMOKE_USER_EMAIL      # viewer-only test account
export SMOKE_USER_PASSWORD   # stored in secrets manager
export SMOKE_OPERATOR_EMAIL  # operator-role test account
export SMOKE_OPERATOR_PASSWORD
export SMOKE_PARTNER_EMAIL   # partner-role test account
export SMOKE_PARTNER_PASSWORD
```

Smoke accounts must be provisioned in each environment before first use. They should have minimal permissions and be clearly marked as test accounts (e.g., `smoke-user@internal.szlholdings.com`). Do not reuse these accounts for any human access.

---

## Smoke Test Suite

### 1. Homepage Path

**What it verifies:** The flagship web app loads and serves content correctly.

```bash
# SZL Holdings homepage returns 200
status=$(curl -sf -o /dev/null -w "%{http_code}" "https://$DOMAIN/")
echo "Homepage: $status"
[ "$status" = "200" ] || echo "FAIL: Homepage returned $status"

# Check content type is HTML
curl -sf -I "https://$DOMAIN/" | grep -i "content-type: text/html" \
  || echo "WARN: Homepage not returning HTML content-type"

# Verify no redirect loop (Location header should not point back to /)
curl -sf -o /dev/null -w "%{redirect_url}" "https://$DOMAIN/" | grep -qv "^https\?://$DOMAIN/$" \
  || echo "INFO: Redirect detected on /"
```

**Pass criteria:**
- HTTP 200 response
- Content-Type is `text/html`
- Page loads within 3 seconds

**Manual check (new environment only):**
- Open `https://$DOMAIN/` in a browser
- Hero section, navigation, and footer render correctly
- No visible JavaScript errors in browser console
- No broken images or missing styles

---

### 2. Trust Path

**What it verifies:** The trust center and security-facing pages are accessible. Critical for investor and partner credibility.

```bash
# Trust center paths (adjust slugs to match actual routes)
for path in /trust /trust/security /trust/compliance /trust/privacy; do
  status=$(curl -sf -o /dev/null -w "%{http_code}" "https://$DOMAIN$path")
  echo "Trust $path: $status"
  [ "$status" = "200" ] || echo "FAIL: $path returned $status"
done
```

**Pass criteria:**
- All trust path routes return HTTP 200
- No redirects to login (trust pages must be publicly accessible)

**Manual check (new environment only):**
- Open trust/security page — verify security posture content renders
- Open trust/compliance page — verify compliance badges/content render
- Confirm no "Login required" gate on any public trust path

---

### 3. API Health

**What it verifies:** The API server is running, database is connected, and system is ready to serve requests.

```bash
# Liveness: API server process is alive
curl -sf "https://$DOMAIN/api/health/live" \
  | jq -e '.status == "ok"' > /dev/null \
  && echo "PASS: API liveness" \
  || echo "FAIL: API liveness check failed"

# Readiness: Database is connected and API is ready
curl -sf "https://$DOMAIN/api/health/ready" \
  | jq -e '.status == "ready"' > /dev/null \
  && echo "PASS: API readiness" \
  || echo "FAIL: API readiness check failed"

# Detailed health: All subsystems healthy
curl -sf "https://$DOMAIN/api/health" | jq '{
  status: .status,
  db_latency_ms: .db.latencyMs,
  version: .version,
  uptime_seconds: .uptime
}'

# DB latency warning
db_latency=$(curl -sf "https://$DOMAIN/api/health" | jq '.db.latencyMs')
echo "DB latency: ${db_latency}ms"
[ "${db_latency:-9999}" -lt 500 ] \
  && echo "PASS: DB latency within threshold" \
  || echo "WARN: DB latency ${db_latency}ms exceeds 500ms threshold"

# Version check: confirm the correct build is deployed
echo "Deployed version: $(curl -sf https://$DOMAIN/api/health | jq -r '.version')"
```

**Pass criteria:**
- `/api/health/live` → 200 `{"status":"ok"}`
- `/api/health/ready` → 200 `{"status":"ready"}`
- Database latency < 500ms
- Version matches expected release tag

---

### 4. Auth Flow

**What it verifies:** Users can authenticate and the session lifecycle works correctly.

```bash
# Step 1: Attempt login with smoke test credentials
LOGIN_RESPONSE=$(curl -sf -X POST "https://$DOMAIN/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$SMOKE_USER_EMAIL\",\"password\":\"$SMOKE_USER_PASSWORD\"}" \
  -c /tmp/smoke-cookies.txt)

echo "Login response: $LOGIN_RESPONSE"

# Check that we get a valid session (not an error)
echo "$LOGIN_RESPONSE" | jq -e '.data != null' > /dev/null \
  && echo "PASS: Login returned data" \
  || echo "WARN: Login returned null data — check smoke account exists in this environment"

# Step 2: Use session to access authenticated endpoint
AUTH_CHECK=$(curl -sf "https://$DOMAIN/api/user/me" \
  -b /tmp/smoke-cookies.txt)
echo "Authenticated user: $AUTH_CHECK" | jq '{id: .id, role: .role}'

# Step 3: Logout
curl -sf -X POST "https://$DOMAIN/api/auth/logout" \
  -b /tmp/smoke-cookies.txt \
  && echo "PASS: Logout succeeded" \
  || echo "FAIL: Logout failed"

# Step 4: Confirm session is invalidated
curl -sf "https://$DOMAIN/api/user/me" \
  -b /tmp/smoke-cookies.txt \
  -o /dev/null -w "%{http_code}" \
  | grep -q "401" \
  && echo "PASS: Session invalidated after logout" \
  || echo "FAIL: Session still valid after logout"

# Clean up
rm -f /tmp/smoke-cookies.txt
```

**Pass criteria:**
- Login with smoke account returns a valid session
- Authenticated endpoint returns user data
- Logout succeeds
- Session is invalidated after logout (401 on subsequent request)

**Note:** Smoke test credentials (`$SMOKE_USER_EMAIL`) must be provisioned in every environment before running these tests. This account should have viewer-level permissions only. Credentials are injected from your secrets manager — never hardcoded.

**Manual check (new environment only):**
- Log in via the web UI — confirm redirect to dashboard
- Confirm session cookie has `HttpOnly`, `SameSite=Strict`, `Secure` flags in browser dev tools
- Log out — confirm redirect to login page
- Attempt to access an authenticated route directly after logout — confirm redirect to login

---

### 5. Operator Flow

**What it verifies:** An authenticated operator can load their workspace and access the core operator surfaces.

```bash
# Login as smoke operator
LOGIN_RESPONSE=$(curl -sf -X POST "https://$DOMAIN/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$SMOKE_OPERATOR_EMAIL\",\"password\":\"$SMOKE_OPERATOR_PASSWORD\"}" \
  -c /tmp/smoke-op-cookies.txt)

echo "Operator login: $(echo $LOGIN_RESPONSE | jq '.data.role')"

# Verify operator can access their workspace
WORKSPACE=$(curl -sf "https://$DOMAIN/api/operator/workspace" \
  -b /tmp/smoke-op-cookies.txt)
echo "Workspace: $(echo $WORKSPACE | jq '{id: .id, status: .status}')"

# Verify Alloy action queue loads
ACTION_QUEUE=$(curl -sf "https://$DOMAIN/api/alloy/actions?status=pending&limit=5" \
  -b /tmp/smoke-op-cookies.txt)
echo "Action queue: $(echo $ACTION_QUEUE | jq 'length') pending actions"

# Verify operator dashboard route accessible
DASH=$(curl -sf -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/operator/dashboard" \
  -b /tmp/smoke-op-cookies.txt)
echo "Operator dashboard: $DASH"
[ "$DASH" = "200" ] || echo "FAIL: Operator dashboard returned $DASH"

# Clean up
rm -f /tmp/smoke-op-cookies.txt
```

**Pass criteria:**
- Operator login succeeds with operator-role account
- Workspace endpoint returns a valid workspace object
- Alloy action queue is accessible (can be empty, must not return 5xx)
- Operator dashboard API route returns 200

**Manual check (new environment only):**
- Log in as an operator via web UI
- Confirm workspace-switching UI renders correctly
- Open Alloy — action queue renders (even if empty)
- Open at least one domain app (Aegis, Terra, or Vessels) — confirm it loads data

---

### 6. Partner Flow

**What it verifies:** A partner-tier account can access their permitted surfaces and is correctly gated from internal-only data.

```bash
# Login as smoke partner
LOGIN_RESPONSE=$(curl -sf -X POST "https://$DOMAIN/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$SMOKE_PARTNER_EMAIL\",\"password\":\"$SMOKE_PARTNER_PASSWORD\"}" \
  -c /tmp/smoke-partner-cookies.txt)

echo "Partner login: $(echo $LOGIN_RESPONSE | jq '.data.role')"

# Verify partner can access permitted surfaces
PARTNER_PROFILE=$(curl -sf "https://$DOMAIN/api/partner/profile" \
  -b /tmp/smoke-partner-cookies.txt)
echo "Partner profile: $(echo $PARTNER_PROFILE | jq '{id: .id, tier: .tier}')"

# Verify partner is BLOCKED from internal admin routes
ADMIN_ATTEMPT=$(curl -sf -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/admin/users" \
  -b /tmp/smoke-partner-cookies.txt)
[ "$ADMIN_ATTEMPT" = "403" ] \
  && echo "PASS: Partner correctly blocked from admin routes (403)" \
  || echo "FAIL: Partner got $ADMIN_ATTEMPT on admin route — expected 403"

# Verify partner is BLOCKED from operator-internal data
OP_ATTEMPT=$(curl -sf -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/operator/workspace" \
  -b /tmp/smoke-partner-cookies.txt)
[ "$OP_ATTEMPT" = "403" ] \
  && echo "PASS: Partner correctly blocked from operator workspace (403)" \
  || echo "FAIL: Partner got $OP_ATTEMPT on operator route — expected 403"

# Carlota Jo partner portal accessible
CARLOTA=$(curl -sf -o /dev/null -w "%{http_code}" "https://$DOMAIN/carlota-jo/" \
  -b /tmp/smoke-partner-cookies.txt)
echo "Carlota Jo portal: $CARLOTA"

# Clean up
rm -f /tmp/smoke-partner-cookies.txt
```

**Pass criteria:**
- Partner login succeeds with partner-role account
- Partner profile endpoint returns valid data
- Admin routes return 403 for partner accounts
- Operator-internal routes return 403 for partner accounts
- Partner-accessible surfaces (Carlota Jo portal) return 200

**Manual check (new environment only):**
- Log in as a partner via web UI
- Confirm partner sees only their permitted navigation items
- Attempt to navigate directly to an internal route — confirm access denied
- Submit a form action (e.g., booking request in Carlota Jo) — confirm it queues successfully

---

## Automated Suite Runner

Run all checks sequentially with a summary:

```bash
#!/bin/bash
set -e
DOMAIN=${DOMAIN:-"staging.szlholdings.com"}
PASS=0; FAIL=0

check() {
  local name="$1"
  local cmd="$2"
  local expected="$3"
  result=$(eval "$cmd" 2>/dev/null)
  if [ "$result" = "$expected" ]; then
    echo "PASS: $name"
    PASS=$((PASS+1))
  else
    echo "FAIL: $name (got '$result', expected '$expected')"
    FAIL=$((FAIL+1))
  fi
}

echo "=== Post-Deploy Smoke Tests: $DOMAIN ==="

# API Health
check "API liveness" "curl -sf https://$DOMAIN/api/health/live | jq -r '.status'" "ok"
check "API readiness" "curl -sf https://$DOMAIN/api/health/ready | jq -r '.status'" "ready"

# Web Apps
for path in "/" "/firestorm/" "/terra/" "/vessels/" "/carlota-jo/" "/command/"; do
  check "Web app $path" "curl -sf -o /dev/null -w '%{http_code}' https://$DOMAIN$path" "200"
done

# Auth sanity
check "Auth endpoint exists" "curl -sf -o /dev/null -w '%{http_code}' -X POST https://$DOMAIN/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"\"}'" "400"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && echo "STATUS: HEALTHY" || echo "STATUS: DEGRADED — review failures before proceeding"
```

---

## Rollback Procedure

If any smoke test fails on production:

1. **Immediate:** Go to Replit deployment dashboard → select previous deployment version → click "Redeploy".
2. **Verify:** Run `GET /api/health/live` — should return 200 within 3 minutes.
3. **Re-run:** Execute this smoke test suite against the rolled-back version.
4. **Document:** Record the failure in the incident log with timestamp, failing tests, and rollback action taken.
5. **Investigate:** Do not re-promote until root cause is identified and verified in staging.

Rollback SLA targets:
- Detection to rollback initiated: < 5 minutes
- Rollback complete and healthy: < 10 minutes

---

*See also: [Release & Operations Control](./release-and-operations-control.md) · [Incident & Support Playbook](./incident-and-support-playbook.md) · [Alert Matrix](../observability/alert-matrix.md)*
