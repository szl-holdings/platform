# Current Rollback Doctrine

**Date:** April 16, 2026
**Status:** Authoritative — consolidates `docs/ROLLBACK_AND_CANARY_PLAN.md`
**Scope:** How to roll back a release, database, or configuration change on the current Replit-based deployment

---

## 1. Rollback Decision Criteria

Initiate a rollback when any of the following conditions are met:

| Condition | Response Time |
|-----------|-------------|
| `GET /api/health` returns unhealthy for > 5 minutes | Immediate |
| Error rate > 5% sustained for > 15 minutes | Immediate |
| Data corruption detected | Immediate |
| Security vulnerability actively exploited | Immediate |
| P0 incident not resolvable within 30 minutes | Rollback decision |
| Critical functionality broken for > 1 hour | Rollback decision |

**Rollback authority:** Founder / Platform Engineering lead makes the rollback call. No committee required — speed matters.

---

## 2. Application Code Rollback

### Primary Method: Replit Checkpoint Restore

Replit automatically checkpoints the codebase before each task merge. This is the fastest rollback path.

**Procedure:**

1. Navigate to: Replit UI → Version history / Checkpoints
2. Identify the last known good checkpoint (prior to the problematic merge)
3. Click "Restore" on that checkpoint
4. Verify API health: `GET /api/health` → `{ "status": "healthy" }`
5. Run smoke test: `pnpm qa:site`
6. Restart all affected workflows via Replit workflow UI
7. Confirm monitoring shows healthy state
8. Document the rollback in `docs/audit/security-remediation-log.md` or incident log

**Timeline expectation:** 5–10 minutes for checkpoint restore + verification

### Emergency Method: Git Checkout

If the Replit UI is unavailable or the checkpoint system fails:

```bash
# Find last known good commit
git log --oneline | head -20

# Check out last known good state
git checkout <commit-hash>

# Restart all affected workflows
# (via Replit workflow panel or restart_workflow tool)

# Verify health
curl /api/health
```

---

## 3. Database Rollback

### Constraint: Forward-Only Schema

Drizzle ORM uses `db:push` for schema management. **There are no automatic down-migrations.** This is a known architectural constraint.

### Additive Changes (New Columns / Tables)

No rollback required. Old application code handles absence of new fields gracefully. Simply roll back the application code — the new schema elements are inert.

### Breaking Changes (Columns Removed or Renamed)

**High-risk operation — requires a database snapshot restore:**

1. Navigate to: Replit PostgreSQL → Snapshots
2. Identify the snapshot taken before the breaking migration
3. Restore the snapshot
4. Roll back application code to the version matching the restored schema
5. Verify data integrity: query key tables to confirm expected rows and structure
6. Re-run `pnpm db:push` only if needed to re-align schema

> **Prevention:** Never remove or rename a column in a single deployment. Use the expand/contract pattern:
> - Phase 1: Add new column alongside old
> - Phase 2: Migrate data + update code
> - Phase 3: Remove old column in a subsequent release

### Configuration / Secrets Rollback

If a secrets or environment variable change causes a regression:

1. Revert the affected secret in Replit Secrets (development) or Azure Key Vault (production)
2. Restart the affected workflow(s)
3. Verify health and smoke tests

---

## 4. Partial Rollback (Feature Flag)

For features controlled by feature flags, a rollback can be performed without a code deployment:

1. Navigate to: `GET /api/admin/feature-flags` (requires `super_admin` / `ops` / `exec` role)
2. Disable the flag for the affected feature
3. Verify the affected surface is no longer active

Feature flags are the preferred mitigation for risky incremental changes.

---

## 5. Rollback Verification

After any rollback, verify:

- [ ] `GET /api/health` → `{ "status": "healthy" }`
- [ ] `GET /api/ready` → ready
- [ ] Auth flow works (login → session → authenticated request)
- [ ] Critical user paths smoke-tested
- [ ] Error rate returns to baseline
- [ ] No data loss detected
- [ ] Incident documented

---

## 6. Post-Rollback Process

1. **Root cause analysis** — document what went wrong before re-attempting the change
2. **Gap register update** — add entry to `docs/audit/series-a-gap-register.md` if a systemic weakness was exposed
3. **Re-deploy plan** — detail the fix and additional validation steps required before re-attempting
4. **Stakeholder notification** — if any external-facing degradation occurred, notify relevant parties

---

## 7. Canary Deployment (Future)

The current platform does not yet have a canary deployment capability on Replit. The documented canary plan in `docs/ROLLBACK_AND_CANARY_PLAN.md` is aspirational for the Azure deployment path.

**Current mitigation:** Feature flags serve as the primary mechanism for gradual rollout. High-risk changes should be deployed behind a feature flag before removing the flag globally.

---

## Related Documents

- `docs/ROLLBACK_AND_CANARY_PLAN.md` — extended canary plan (Azure path)
- `docs/releases/current-release-doctrine.md` — how releases are cut
- `docs/releases/current-environment-promotion-model.md` — environment promotion
- `docs/ENVIRONMENT_SEPARATION.md` — environment separation
- `docs/disaster-recovery.md` — broader DR plan
