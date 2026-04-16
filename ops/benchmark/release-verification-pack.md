# Release Verification Pack

Generated: 2026-04-16
Phase: H — Observability & Release Control

---

## Purpose

Every release requires passing a verification gate before it is considered shipped. This pack defines that gate. It is the canonical checklist used by the release owner for every version tag.

---

## Pre-Release Gate

### Code Quality

- [ ] `pnpm run lint` — zero errors
- [ ] `pnpm run typecheck` — zero errors
- [ ] `pnpm run test` — all tests pass
- [ ] `pnpm run build` — all artifacts build without error
- [ ] CI gate (`ci / CI Gate`) passes in GitHub

### Security

- [ ] `pnpm run security:audit` — no new critical or high CVEs introduced
- [ ] No secrets in client bundle: `grep -r "sk-\|sk_live\|PRIVATE" dist/` returns nothing
- [ ] `ops/security/secret-inventory.md` is current (no new unknowns)

### Content & Documentation

- [ ] `CHANGELOG.md` has entry for this version
- [ ] `docs/releases/v{X}.{Y}.{Z}.md` exists with substantive release notes
- [ ] Version in release notes matches git tag
- [ ] No internal paths, placeholder data, or stub features referenced in release notes

### Artifacts

- [ ] All canonical artifacts build and load: szl-holdings, aegis, terra, vessels, carlota-jo, command, api-server
- [ ] Deprecated artifacts (firestorm, lyte-command-center, imperium, prism-counsel, stephen-site) are not referenced in release notes

---

## Post-Deploy Verification

Run immediately after deployment succeeds:

### Automated Smoke Tests

```bash
DOMAIN=<your-production-domain>

# Liveness + readiness
curl -sf https://$DOMAIN/api/health/live && echo "PASS: live"
curl -sf https://$DOMAIN/api/health/ready && echo "PASS: ready"

# Version check
curl -sf https://$DOMAIN/api/health | jq '.version'

# Web apps
for path in / /aegis/ /terra/ /vessels/ /carlota-jo/ /command/; do
  status=$(curl -sf -o /dev/null -w "%{http_code}" "https://$DOMAIN$path")
  echo "$status $path"
done

# DB latency check
curl -sf https://$DOMAIN/api/health | jq '.services.database.latencyMs'
```

### Manual Spot Checks

- [ ] SZL Holdings homepage loads — hero, nav, footer intact
- [ ] Command Portal (`/command/`) — health score visible, no console errors
- [ ] Aegis (`/aegis/`) — sidebar and workspace nav functional
- [ ] Terra (`/terra/`) — map or property view loads
- [ ] Login/logout cycle completes without error
- [ ] No console errors in browser DevTools Network tab
- [ ] No raw secrets visible in page source

---

## Rollback Decision Gate

Trigger rollback if any of the following are true within 30 minutes of deploy:

| Trigger | Action |
|---------|--------|
| `/api/health/live` non-200 | Immediate rollback |
| 5xx error rate > 5% for > 5 min | Immediate rollback |
| Any P0 alert fires | Immediate rollback |
| Login flow broken | Immediate rollback |
| Flagship app fails to load | Rollback if not fixed in 15 min |

### Rollback Steps

1. Revert to previous deployment version in Replit
2. Confirm `/api/health/live` returns 200
3. Re-run smoke test suite
4. Write incident note in `ops/incidents/` with timeline and root cause

---

## Release Sign-Off

| Role | Action |
|------|--------|
| Release owner | Completes this checklist |
| Second reviewer (if available) | Spot-checks manual steps |
| System | CI gate must be green |

---

## Related Documents

- Smoke tests: `ops/observability/post-deploy-smoke-tests.md`
- Alert matrix: `ops/observability/alert-matrix.md`
- SLO catalog: `ops/observability/slo-catalog.md`
- Founder release ritual: `ops/benchmark/founder-release-ritual.md`
