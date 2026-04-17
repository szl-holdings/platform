# Release Discipline Pass

Generated: 2026-04-16
Phase: J — Repo Hygiene & Release Discipline

---

## Purpose

A point-in-time audit of release discipline across the repository. Identifies what is working, what needs attention, and what is deferred.

---

## Audit Findings

### CI/CD Gate — PASS

| Check | Status | Notes |
|-------|--------|-------|
| Lint enforced on PR/push | PASS | `ci.yml` → `pnpm run lint` |
| TypeCheck enforced on PR/push | PASS | `ci.yml` → `pnpm run typecheck` |
| Tests enforced on PR/push | PASS | `ci.yml` → `pnpm run test` |
| Build enforced on PR/push | PASS | `ci.yml` → `pnpm -r run build` |
| Gate job requiring all to pass | PASS | `ci / CI Gate` job |
| Security scan on schedule | PASS | `security.yml` — scheduled dependency audit |
| CodeQL on push/PR | PASS | `codeql.yml` |
| Dependency review on PR | PASS | `dependency-review.yml` |
| E2E tests on push/PR | PASS | `e2e.yml` (Playwright) |
| Lighthouse perf audits | PASS | `lighthouse.yml` |

---

### Release Process — MOSTLY PASS

| Check | Status | Notes |
|-------|--------|-------|
| SemVer versioning defined | PASS | `ops/github/release-plan.md` |
| Release notes template defined | PASS | Same doc |
| CHANGELOG.md present | PASS | Root of repo |
| GitHub Releases workflow | PASS | `release.yml` |
| Automated release on tag | PASS | `deploy-production.yml` triggers on release publish |
| Release checklist documented | PASS | `ops/benchmark/release-verification-pack.md` |
| Post-deploy smoke tests documented | PASS | `ops/observability/post-deploy-smoke-tests.md` |
| Rollback criteria defined | PASS | Same doc |

---

### Repo Hygiene — PASS (with caveats)

| Check | Status | Notes |
|-------|--------|-------|
| `.replit` reflects canon only | PASS | Only api-server and mockup-sandbox listed as artifacts; no deprecated refs |
| `.replit [userenv.shared]` contains only public values | PASS | VAPID_PUBLIC_KEY, VAPID_SUBJECT — both public by design |
| No secrets in source code | PASS | None found |
| Archived artifacts have DEPRECATED.md / ARCHIVED.md | PASS | prism-counsel, stephen-site, lyte-command-center, imperium, firestorm (redirects) |
| Legacy CI workflows disabled/noted | PARTIAL | `prism-counsel-ci.yml` still present — archived status documented; workflow itself is now disabled |
| CI matrix covers canonical apps | PARTIAL | `e2e.yml` updated to remove lyte-command-center; add command |
| `npm-publish.yml` / Maven / NuGet / RubyGems workflows | DEFERRED | Likely GitHub template artifacts — evaluate for removal at next hygiene pass |

---

### Secret & Security Discipline — PASS (with open items)

| Check | Status | Notes |
|-------|--------|-------|
| Core platform secrets in Replit Secrets | PASS | 5/6 confirmed |
| AI service keys in Replit Secrets | PASS | 3/4 confirmed |
| Auth (Clerk) keys in Replit Secrets | PASS | 3/3 confirmed |
| `OAUTH_STATE_SECRET` in Replit Secrets | ACTION NEEDED | Removed from .replit; confirm it's been added to Replit Secrets |
| `VAPID_PRIVATE_KEY` in Replit Secrets | ACTION NEEDED | Removed from .replit; confirm it's been added to Replit Secrets |
| External service secrets (Stripe, SendGrid, Mapbox) | UNCONFIRMED | See `ops/security/secret-inventory.md` |
| `INTEGRATION_TEST_TOKEN` not in source | ✅ RESOLVED | Literal removed from source; test reads from env var; fails fast if unset |
| Secret guidance consistent across ops docs | PASS | `production-hardening-checklist.md` and `production-secret-checklist.md` aligned (no contradictions) |

---

### Documentation — PASS

| Check | Status | Notes |
|-------|--------|-------|
| SLO catalog exists | PASS | `ops/observability/slo-catalog.md` |
| Alert matrix exists | PASS | `ops/observability/alert-matrix.md` |
| Deployment decision documented | PASS | `ops/replit/deployment-decision.md` |
| Secret inventory documented | PASS | `ops/security/secret-inventory.md` |
| Disposition matrix current | PASS | `ops/frontier/disposition-matrix.md` |
| Benchmark deliverables complete | PASS | `ops/benchmark/` (this pass) |

---

## Open Action Items (Priority Order)

| Priority | Action | Owner |
|----------|--------|-------|
| HIGH | Add `OAUTH_STATE_SECRET` to Replit Secrets (new value) | Platform ops |
| HIGH | Add `VAPID_PRIVATE_KEY` to Replit Secrets (new value) | Platform ops |
| ~~HIGH~~ DONE | ~~Move `INTEGRATION_TEST_TOKEN` to GitHub Secrets / env var~~ Token removed from source (task #721); add to GitHub Actions Secrets to complete provisioning | Engineering |
| MEDIUM | Confirm `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `MAPBOX_ACCESS_TOKEN` in Replit Secrets | Platform ops |
| MEDIUM | Evaluate and remove `npm-publish.yml`, `maven-publish.yml`, `rubygems-publish.yml`, `nuget-publish.yml` if unused | Engineering |
| LOW | Pin `actions/setup-node` to SHA in all workflows that use version tag | Engineering |
| LOW | Update CI node-version from `20` to `24` to match `.replit` runtime | Engineering |
