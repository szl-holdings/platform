# Release Checklist

> SZL Holdings Platform · Release Discipline

Use this checklist before every release (patch, minor, or major). The `pnpm release:check` command runs the automated portions.

---

## Pre-Release Automated Gate

Run `pnpm release:check` — this executes:
- `pnpm verify:env` — required environment variable check
- `pnpm verify:claims:strict` — platform claims validation
- `pnpm test:unit` — API server unit tests
- `pnpm test:smoke` — smoke route tests
- `pnpm audit:mocks` — mock/stub register audit
- `pnpm audit:routes` — route coverage audit
- `pnpm audit:deps` — dependency audit
- `pnpm brand:check` — brand compliance

**All checks must pass green before proceeding.**

For a full pre-release readiness sweep (includes build, security audit, and product-mode smoke), run:
```
pnpm audit:series-a
```

This executes `brand:check → typecheck → test → audit:mocks → audit:routes → audit:deps → audit:copy → security:audit → smoke:product-mode → build`.

---

## Content Checklist

### CHANGELOG

- [ ] `CHANGELOG.md` updated with all changes since last release
- [ ] Entry format follows [Keep a Changelog](https://keepachangelog.com/) conventions
- [ ] Breaking changes are clearly marked
- [ ] Version number matches the planned release tag

### Documentation

- [ ] `README.md` is accurate and up to date
- [ ] `docs/APP_STATUS.md` reflects current artifact readiness states
- [ ] `docs/platform-facts.md` is current — run `pnpm metrics:validate`
- [ ] Any new environment variables added to `docs/operations/known-gaps.md` or env docs
- [ ] API spec updated if endpoints changed (`lib/api-spec/`)

### Screenshots

- [ ] All README screenshots reflect the current release
- [ ] Screenshot `assets/readme/products/` files are current
- [ ] `docs/assets/screenshots/current/` is updated

---

## Security Checklist

- [ ] No secrets or credentials in the release commit
- [ ] `pnpm security:vuln` shows no Critical or High severity findings (or all findings are documented exceptions)
- [ ] `pnpm security:license` — all dependency licenses are acceptable
- [ ] `.env.example` is current with all new environment variables (with placeholder values only)
- [ ] gitleaks pre-commit check passes

---

## Database / Migration Checklist

- [ ] All migrations are included and tested
- [ ] Migration is reversible (or rollback plan documented)
- [ ] Seed data updated if schema changed
- [ ] `pnpm db:migrate` runs without errors in a clean environment

---

## Release Execution

1. Ensure `master`/`main` branch is up to date and all above checks pass
2. Update `CHANGELOG.md` with the new version and date
3. Commit: `chore(release): vX.Y.Z`
4. Push to `master` — `release.yml` creates the tag and GitHub Release automatically
5. Confirm staging deployment succeeds
6. Confirm production deployment succeeds (triggered by release publication)
7. Verify the live production deployment is healthy via `pnpm verify:health`

---

## Post-Release

- [ ] GitHub Release description is accurate (review auto-generated notes)
- [ ] Notify design partners of changes that affect their evaluation
- [ ] Update `docs/audit/RELEASE_READINESS.md` if applicable
- [ ] Archive any release-specific demo scripts to `docs/investor/`

---

*SZL Holdings Platform · Release Discipline*
