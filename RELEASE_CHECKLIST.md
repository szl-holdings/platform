# Release Checklist — SZL Holdings Platform

> Complete this checklist before every production release. Sign off on each section.

Release version: ___________
Release date: ___________
Release owner: ___________

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

---

## Database

- [ ] All new migrations are applied and verified in staging
- [ ] Migration is backwards-compatible OR migration window is coordinated
- [ ] No destructive schema changes without data backup first
- [ ] Production database backup taken before migration
- [ ] Migration can be rolled back if needed

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

- [ ] New CTA events tracking correctly
- [ ] Demo request tracking verified
- [ ] No PII in analytics events
- [ ] See [EVENT_TAXONOMY.md](EVENT_TAXONOMY.md) for event naming

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

- [ ] Previous deployment state documented
- [ ] Database rollback script tested (if migration involved)
- [ ] Rollback can be completed in < 15 minutes
- [ ] [RUNBOOK_ROLLBACK.md](infra/runbooks/RUNBOOK_ROLLBACK.md) is current

---

## Post-Deploy Verification Plan

- [ ] Health check endpoint to verify: `GET /api/health`
- [ ] Critical user paths to test manually: (list specific paths)
- [ ] Monitoring dashboard to check for 30 minutes post-deploy
- [ ] On-call contact confirmed

---

## Sign-off

| Area | Reviewer | Signed Off |
|------|----------|------------|
| Engineering | | |
| Product | | |
| Security | | |
| Go-live | Stephen Lutar | |

---

_Last updated: 2026-04-03_
