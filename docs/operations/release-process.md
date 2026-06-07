# Release Process — SZL Holdings Platform

> Documented workflow for preparing, executing, and validating platform releases.

---

## Release Types

| Type | Scope | Frequency | Approval |
|------|-------|-----------|---------|
| **Patch** (0.x.y) | Bug fixes, copy changes, minor tweaks | As needed | Engineering lead |
| **Minor** (0.x.0) | New features, significant UI changes, new routes | Weekly/biweekly | Engineering + Product |
| **Major** (x.0.0) | Breaking changes, major architectural shifts | Quarterly | Full team |
| **Hotfix** | Critical production bug fix | Immediate | Engineering lead only |

---

## Release Workflow

### Step 1 — Prepare

1. Ensure all sprint work is merged and the workspace is in a stable state
2. Run full QA suite: `pnpm qa:site && pnpm qa:links && pnpm qa:routes`
3. Run tests: `pnpm test`
4. Run typecheck: `pnpm typecheck`
5. Run lint: `pnpm lint`
6. Fix all failures before proceeding

### Step 2 — Update Version

1. Determine version bump type (patch/minor/major)
2. Update version in root `package.json`
3. Run `pnpm release:prep` to:
   - Validate current workspace state
   - Update `CHANGELOG.md` with a dated entry
   - Generate release summary

### Step 3 — Update CHANGELOG

Update `CHANGELOG.md` with a structured entry:
```markdown
## [x.y.z] — YYYY-MM-DD

### Added
- Brief description of new features

### Changed
- Breaking or significant changes

### Fixed
- Bug fixes

### Removed
- Deprecated features removed
```

### Step 4 — Pre-Release Checklist

Complete all applicable items in [RELEASE_CHECKLIST.md](release-checklist.md).

### Step 5 — Generate Release Notes

```bash
pnpm release:notes
```

This generates a summary suitable for sharing with stakeholders.

### Step 6 — Deploy

See deployment runbooks:
- [RUNBOOK_DEPLOYMENT.md](../../infra/runbooks/RUNBOOK_DEPLOYMENT.md) — standard deployment
- [RUNBOOK_ROLLBACK.md](rollback-playbook.md) — rollback if needed

**Deployment order:**
1. Database migrations (apply and verify)
2. API server (deploy and verify health check)
3. Web artifacts (deploy one at a time, verify each)
4. Mobile apps (submit to Expo EAS, stage if applicable)

### Step 7 — Post-Deployment Verification

1. Run `pnpm qa:site` against production URL
2. Manually verify critical paths (login, contact form, demo flow)
3. Verify analytics events are firing
4. Monitor error rates for 30 minutes post-deploy
5. Confirm no regression in Sentry (production)

### Step 8 — Communicate

1. Update internal stakeholders (Slack / email)
2. Update status page if there was any downtime
3. File release notes in `docs/releases/`

---

## Hotfix Process

For critical production issues:

1. **Identify and scope** — confirm the issue is production-impacting
2. **Assess severity** — use [INCIDENT_SEVERITY_MATRIX.md](incident-severity.md)
3. **Fix in isolation** — apply the minimal fix needed
4. **Test** — run targeted tests for the affected area
5. **Deploy** — use accelerated deployment (skip full QA if Severity 1)
6. **Document** — update CHANGELOG with hotfix entry
7. **Post-mortem** — file incident report within 48 hours

See [INCIDENT_RESPONSE.md](incident-response.md) for the full incident workflow.

---

## Release Gate Criteria

A release is not ready to ship unless:

- [ ] All tests pass (`pnpm test`)
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] No ESLint errors (`pnpm lint`)
- [ ] CHANGELOG.md updated
- [ ] RELEASE_CHECKLIST.md completed
- [ ] Database migrations are backwards-compatible (or migration window coordinated)
- [ ] No hardcoded secrets in code
- [ ] Screenshots refreshed if UI changed significantly

---

## Versioning Policy

- **Major:** Breaking API changes, major architectural overhaul, significant UX redesign
- **Minor:** New features, new routes, new integrations, backwards-compatible API changes
- **Patch:** Bug fixes, copy changes, performance improvements, dependency updates
- **Hotfix:** Emergency patches to production (versioned as patch, labeled hotfix in CHANGELOG)

All versions follow [Semantic Versioning 2.0.0](https://semver.org/).
