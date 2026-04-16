# Release Checklist — SZL Holdings Platform

> Complete this checklist before every production release. Sign off on each section.

Release version: ___________
Release date: ___________
Release owner: ___________

**Related:** [RELEASE_INTELLIGENCE.md](RELEASE_INTELLIGENCE.md) · [ENVIRONMENT_VALIDATION.md](ENVIRONMENT_VALIDATION.md) · [ROLLBACK_PLAYBOOK.md](ROLLBACK_PLAYBOOK.md) · [RELEASE_PROCESS.md](RELEASE_PROCESS.md)

---

## Code Quality

- [ ] `pnpm test` passes with no failures
- [ ] `pnpm typecheck` passes with no errors
- [ ] `pnpm lint` passes with no errors (or warnings are documented and accepted)
- [ ] `pnpm build` succeeds for all affected artifacts
- [ ] No `console.log` statements left in production code (check with `pnpm lint`)
- [ ] No TODO comments in code changed in this release (or documented exceptions)
- [ ] All pull request reviews completed (if applicable)

---

## Environment & Secrets

- [ ] All required environment variables confirmed in target environment
- [ ] No secrets committed to version control (`git log --all` clean)
- [ ] `DATABASE_URL` points to correct environment database
- [ ] `SESSION_SECRET` is environment-specific (not shared)
- [ ] Third-party API keys valid and not expired (Stripe, HuggingFace, Mapbox)
- [ ] Azure Key Vault references validated (production)
- [ ] Full environment validation: [ENVIRONMENT_VALIDATION.md](ENVIRONMENT_VALIDATION.md) Stage 2 complete

---

## Database

- [ ] All new migrations are applied and verified in staging
- [ ] Migration is backwards-compatible OR migration window is coordinated
- [ ] No destructive schema changes without data backup first
- [ ] Production database backup taken before migration
- [ ] Migration rollback script prepared and tested in staging

---

## Smoke Tests

Run the following before every production release:

```bash
node scripts/qa/smoke-routes.js       # Route health (all routes return expected status)
node scripts/qa/check-links.js        # Broken link detection
node scripts/qa/check-metadata.js     # Meta tag validation
curl -f $BASE_URL/api/health          # Health endpoint
```

- [ ] `smoke-routes.js` passes — all routes return expected HTTP status codes
- [ ] `check-links.js` passes — no broken external links
- [ ] `check-metadata.js` passes — no missing meta tags on public pages
- [ ] `/api/health` returns 200 with `{"status":"healthy"}`
- [ ] `/api/health/detailed` returns all subsystems green
- [ ] Authentication flow smoke tested end-to-end

---

## Staged Rollout Configuration

All user-facing features must be rolled out in stages. See [RELEASE_INTELLIGENCE.md](RELEASE_INTELLIGENCE.md) for the full staged rollout model.

- [ ] Staged rollout plan documented for this release (which stages, which tenants)
- [ ] Feature flags set to Stage 0 (internal only — 5%) before production deployment
- [ ] Stage progression criteria defined (what metrics must pass before advancing)
- [ ] Stage 0 internal testing window: minimum 24 hours at 5% before advancing

**Rollout schedule:**

| Stage | Target | Start Date | Approval |
|-------|--------|-----------|---------|
| Stage 0 — Internal (5%) | SZL team only | | Engineering lead |
| Stage 1 — Beta (10–15%) | Design partners | | Engineering + Product |
| Stage 2 — Gradual (25%) | Random 25% | | Engineering + Product |
| Stage 3 — Majority (50%) | Random 50% | | Engineering + Founder |
| Stage 4 — Full (100%) | All tenants | | Engineering + Founder |

---

## Feature Flags & Kill Switches

- [ ] All new feature flags registered in the flag service (target path: `lib/feature-flags/`) with required metadata
- [ ] New flags default to `false` (off) in production
- [ ] Kill switch defined for every major new user-facing feature
- [ ] Kill switch tested in staging (can be toggled; takes effect within 60 seconds)
- [ ] Flag expiry date set (temporary flags only; max 90 days without renewal)
- [ ] Flag owner assigned

**New flags in this release:**

| Flag Key | Type | Default | Owner | Expires |
|----------|------|---------|-------|---------|
| | | | | |

---

## Content & Copy

- [ ] All new/changed public-facing copy reviewed and approved
- [ ] No placeholder text on any public route
- [ ] Contact form validated (test submission received)
- [ ] All external links tested
- [ ] Legal pages current: `/legal/privacy`, `/legal/terms`

---

## Performance

- [ ] Lighthouse score acceptable on landing page (≥ 85 target)
- [ ] No new large bundle additions (check build output size)
- [ ] All images optimized
- [ ] Lazy loading confirmed on below-fold content

---

## SEO & Metadata

- [ ] New public pages have `<title>` and `<meta name="description">`
- [ ] OG tags present on new public pages
- [ ] Sitemap updated if new routes added
- [ ] See [SEO_MAP.md](SEO_MAP.md) for expected coverage

---

## Analytics

- [ ] New events added for any new user-facing feature (see [ANALYTICS-EVENTS.md](ANALYTICS-EVENTS.md))
- [ ] New CTA events tracking correctly
- [ ] Demo request tracking verified
- [ ] Activation events fire on first governed decision (if applicable)
- [ ] No PII in any analytics events (audit run)
- [ ] Analytics events verified in PostHog / GA4 staging environment

---

## Security

- [ ] No new unvalidated user inputs
- [ ] CSRF tokens applied to all state-changing endpoints
- [ ] Authentication required on all private routes
- [ ] No admin/internal routes exposed in public navigation
- [ ] CORS config reviewed if new origins added

---

## Documentation

- [ ] `CHANGELOG.md` updated with this release's changes
- [ ] `ROUTE_INVENTORY.md` updated if new routes added
- [ ] `ENV_MATRIX.md` updated if new variables added
- [ ] `README.md` updated if architecture changed
- [ ] Screenshots refreshed if UI changed significantly

---

## Screenshots

- [ ] Screenshots current (run `pnpm capture:screens` if needed)
- [ ] README.md screenshot references valid

---

## Rollback Plan

- [ ] Previous deployment state documented (which version is currently live)
- [ ] Database rollback script prepared and tested in staging (if migration involved)
- [ ] Rollback via deployment slot (blue/green) confirmed available
- [ ] Rollback can be completed in < 15 minutes
- [ ] [ROLLBACK_PLAYBOOK.md](ROLLBACK_PLAYBOOK.md) reviewed and current
- [ ] On-call engineer designated and available for 60 minutes post-deploy

---

## Post-Deploy Monitoring Plan

Monitoring is mandatory for 60 minutes after every production deployment.

**First 5 minutes — verify:**

- [ ] `GET /api/health` returns 200
- [ ] `GET /api/health/detailed` returns all subsystems green
- [ ] No new error events in Sentry (first 5 minutes)
- [ ] Critical user paths accessible (list specific paths below)

**Critical paths to test manually after deploy:**
1. _______________
2. _______________
3. _______________

**First 30 minutes — monitor thresholds:**

| Signal | Threshold | Action if Breached |
|--------|-----------|-------------------|
| Error rate | < 1% | Investigate; > 2% = rollback |
| P95 latency | < 2.5s | Investigate; > 5s = rollback |
| Auth failures | < 5/min | Investigate |
| DB errors | 0 | Immediate investigation |

- [ ] Monitoring dashboard open and being watched for 30 minutes
- [ ] On-call contact confirmed for full 60-minute window

---

## Sign-off

| Area | Reviewer | Signed Off | Date |
|------|----------|------------|------|
| Engineering | | | |
| Product | | | |
| Security | | | |
| Go-live | Stephen Lutar | | |

---

_Last updated: 2026-04-16_
