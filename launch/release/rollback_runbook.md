# Rollback Runbook
**Phase:** 5 + 9  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

---

## Rollback Decision Criteria

**Roll back immediately if:**
- Authentication is broken for more than 5 minutes
- Database migrations caused data loss or corruption
- A P0 security vulnerability is discovered post-deploy
- More than 10% of API health checks fail in 5 minutes
- Payment processing (Stripe) returns errors

**Investigate before rolling back if:**
- A single API route returns errors (may be isolatable fix)
- UI visual issues with no functional impact
- A non-critical connector goes stale

---

## Rollback Method: Replit Checkpoint

The fastest and safest rollback path for this platform is the Replit checkpoint system.

### Steps:

1. Navigate to the Replit project
2. Open the **History** panel (version control)
3. Locate the last known-good checkpoint (before the failed deploy)
4. Click **Restore** — this restores both code AND database snapshot
5. Confirm all workflows restart successfully
6. Run `curl $BASE_URL/api/health` to verify
7. Notify stakeholders of rollback

**Expected rollback time:** 2–5 minutes

---

## Rollback Method: Code-Only Revert

If only code changes need to be reverted (not data):

```bash
# Revert to previous known-good commit
git log --oneline -10              # Find the good commit SHA
git revert <bad-commit-sha>        # Create a revert commit
# Push and redeploy

# Verify
curl $BASE_URL/api/health
curl $BASE_URL/api/version         # Confirm reverted version
```

---

## Database Rollback

If a migration caused issues:

1. **Stop all API server instances** to prevent further writes
2. **Restore from backup** taken before migration
3. **Verify data integrity** with `SELECT COUNT(*) FROM decisions WHERE tenant_id = 'org-demo-szl'`
4. **Restart API servers**
5. **Verify health:** `GET /api/health/detailed`

**Note:** Schema rollbacks without backup restoration are only possible if the migration was additive (new columns/tables). Destructive changes require backup restoration.

---

## Communication Protocol

| Event | Who to Notify | Channel | SLA |
|---|---|---|---|
| Rollback initiated | Engineering lead | Slack #incident | Immediate |
| Rollback complete | All hands | Slack #ops | Within 15 min |
| Root cause identified | Founder | Direct message | Within 1h |
| Incident resolved | All stakeholders | Email | Within 24h |

---

## Post-Rollback Checklist

- [ ] All 15 artifact workflows confirmed running
- [ ] `GET /api/health` returns 200
- [ ] Auth flow working (login → dashboard)
- [ ] Demo Launchpad at `/command/demo` accessible
- [ ] Sentry showing no new error spike (if Sentry configured)
- [ ] Uptime monitor shows green (if configured)
- [ ] Root cause documented in incident log
