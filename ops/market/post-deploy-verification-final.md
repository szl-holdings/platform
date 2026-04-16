# Post-Deploy Verification — Final

**Last updated:** April 2026  
**Purpose:** Verification steps to run after every production deployment. Covers automated checks, manual verification, and rollback criteria.

---

## Verification Tiers

| Tier | When | Who | Automated? |
|---|---|---|---|
| Automated smoke tests | After every deployment | CI / founder | Yes (when CI is configured) |
| Manual spot-check | After every deployment to production | Founder | No |
| Full manual verification | First deploy to new environment | Founder | No |
| Partner notification | Before and after any deployment affecting active pilots | Founder | No |

---

## Tier 1: Automated Smoke Tests

Run these immediately after any production deployment. Currently run manually; CI automation is on the roadmap.

### API Health

```bash
export DOMAIN="your-production-domain.repl.co"

# Liveness probe
curl -sf https://$DOMAIN/api/health/live || echo "FAIL: liveness probe"

# Readiness probe (includes DB check)
curl -sf https://$DOMAIN/api/health/ready || echo "FAIL: readiness probe"

# Full health (checks DB latency and version)
curl -sf https://$DOMAIN/api/health | jq '{status: .status, version: .version, dbLatencyMs: .db.latencyMs}'
```

**Pass criteria:**
- `/api/health/live` returns 200
- `/api/health/ready` returns 200
- `/api/health` returns `"status": "ok"` and DB latency under 500ms

---

### Web App Availability

```bash
for path in / /firestorm/ /terra/ /vessels/ /carlota-jo/ /command/; do
  status=$(curl -sf -o /dev/null -w "%{http_code}" "https://$DOMAIN$path")
  if [ "$status" = "200" ]; then
    echo "PASS: $path ($status)"
  else
    echo "FAIL: $path returned $status"
  fi
done
```

**Pass criteria:** All paths return 200.

---

### Auth Flow

```bash
# SMOKE_TEST_EMAIL and SMOKE_TEST_PASSWORD must be set in Replit Secrets
PAYLOAD=$(jq -n --arg email "$SMOKE_TEST_EMAIL" --arg password "$SMOKE_TEST_PASSWORD" \
  '{email: $email, password: $password}')

RESPONSE=$(curl -sf -X POST https://$DOMAIN/api/auth/login \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD")

echo $RESPONSE | jq '.data.token' | grep -v '"null"' || echo "WARN: auth returned null token"
```

**Pass criteria:** Login returns a non-null token. Use the smoke test credentials stored in Replit Secrets — never hardcode credentials in scripts.

---

### API Version Check

```bash
curl -sf https://$DOMAIN/api/health | jq '.version'
# Confirm version matches the expected release tag
```

---

## Tier 2: Manual Spot-Check (Every Production Deploy)

After automated checks pass, run this manual spot-check. Takes 5–10 minutes.

- [ ] Load SZL Holdings homepage — verify hero, nav, footer render correctly
- [ ] Navigate to /trust — verify Trust Center loads
- [ ] Navigate to /demo — verify demo request form renders
- [ ] Open Aegis (/firestorm/) — verify sidebar and workspace switching
- [ ] Open Terra (/terra/) — verify map/property views load
- [ ] Open Command Portal (/command/) — verify mode switching
- [ ] Test login with smoke test credentials — verify session is created
- [ ] Test logout — verify session is destroyed
- [ ] Verify no console errors in browser dev tools
- [ ] Verify no secrets visible in page source or network requests

**If any step fails:** Do not consider the deployment complete. Diagnose and either fix forward or roll back.

---

## Tier 3: Full Manual Verification (New Environment Only)

On first deployment to a new environment (e.g., first time deploying to production, or first staging deployment):

**Frontend:**
- [ ] All domain app paths load (/, /firestorm, /terra, /vessels, /carlota-jo, /command)
- [ ] Navigation between domain apps works
- [ ] Trust Center renders with correct content
- [ ] Demo request form submits successfully (verify email received)
- [ ] Contact form submits successfully

**API:**
- [ ] Swagger UI loads at /api/docs
- [ ] Health endpoints all return expected responses
- [ ] Auth flow: register → login → access authenticated endpoint → logout
- [ ] RBAC test: attempt to access an ops+ endpoint with a viewer role — expect 403

**Database:**
- [ ] DB latency reported in /api/health is under 100ms
- [ ] A read operation returns expected data (seeded data if applicable)

**Security:**
- [ ] No secrets in page source or client-visible network responses
- [ ] HttpOnly cookie set on login (verify in browser dev tools)
- [ ] CORS: verify cross-origin requests from unauthorized domains are rejected

---

## Rollback Criteria

Initiate rollback immediately if any of the following are true:

| Condition | Action |
|---|---|
| `/api/health/live` returns non-200 | Immediate rollback |
| Error rate > 5% within 10 minutes of deploy | Immediate rollback |
| Any P0 alert fires within 30 minutes | Immediate rollback |
| Critical user-facing feature is broken | Rollback if not fixable in <30 min |
| Authentication is broken | Immediate rollback |

**P0 definition:** Outage affecting all users, authentication broken, data corruption, or security incident.

---

## Rollback Procedure

1. Navigate to Replit deployment settings
2. Select previous deployment version
3. Redeploy from the previous version
4. Run Tier 1 automated smoke tests on the reverted deployment
5. Confirm health endpoints return 200
6. Notify any affected design partners via direct message
7. Document incident: what failed, when detected, when rolled back, root cause (if known)

Target rollback time: under 15 minutes from P0 identification.

---

## Partner Notification Protocol

Before planned deployments during active pilot periods:

- Notify partners 24 hours in advance of any planned maintenance window
- Maintenance windows: prefer Tue–Thu, 10pm–6am local partner time
- Unplanned outages: notify within 15 minutes of P0 identification
- Post-incident: send brief summary within 24 hours of resolution

Communication channel: direct message to partner technical POC and executive sponsor.

---

## Deployment Log

Maintain a simple deployment log:

| Date | Version | Deployed by | Duration | Outcome | Notes |
|---|---|---|---|---|---|
| 2026-04-01 | v0.1.0 | Founder | 15 min | Success | Initial public release |
| [date] | [version] | [who] | [duration] | [Pass / Rollback] | [notes] |

---

*See also: `environment-and-release-final.md` (release process), `founder-support-control-room.md` (operational visibility)*
