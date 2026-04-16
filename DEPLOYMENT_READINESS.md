# Deployment Readiness Checklist

> **DEPRECATED** — This document has been superseded by [`ops/frontier/launch-readiness-scorecard.md`](ops/frontier/launch-readiness-scorecard.md) and [`ops/infra/target-production-architecture.md`](ops/infra/target-production-architecture.md).
> This file is retained for historical reference only. Do not update it.

> Pre-deployment verification for the SZL Holdings platform. Complete all applicable sections before any production deployment.

---

## Environment & Secrets

- [ ] `DATABASE_URL` set for target environment (production connection string, not dev)
- [ ] `SESSION_SECRET` set — strong random string (≥32 characters, never reused across environments)
- [ ] `ADMIN_PIN` set — unique per environment
- [ ] `REPLIT_DOMAINS` configured (for Replit Auth) or replaced with production OAuth config
- [ ] All third-party API keys validated and active (Stripe, HuggingFace, Mapbox, etc.)
- [ ] Azure Key Vault configured with all secrets (production deployments)
- [ ] No secrets present in committed code or environment files
- [ ] `.env` files not committed (verify with `git status`)

---

## Public Deployment Checklist

### Content & Copy
- [ ] All public-facing copy reviewed and approved
- [ ] No placeholder text ("Lorem ipsum", "TODO", "COMING SOON") visible on public routes
- [ ] Contact forms tested (submissions land in the correct inbox)
- [ ] Email addresses valid and monitored
- [ ] All external links tested and functional
- [ ] Legal pages present: `/legal/privacy`, `/legal/terms`, `/accessibility`
- [ ] Trust Center accessible at `/trust-center`

### Performance
- [ ] Lighthouse score ≥ 85 on landing page (Performance, SEO, Accessibility)
- [ ] Time to First Contentful Paint < 2.5s on 4G connection
- [ ] All images optimized (WebP preferred, explicit width/height, lazy loading on below-fold)
- [ ] Code splitting confirmed (lazy-loaded routes, not all JS in a single bundle)
- [ ] No console errors on any public page

### SEO
- [ ] Every public page has unique `<title>` and `<meta name="description">`
- [ ] OG tags present on all public pages (og:title, og:description, og:image)
- [ ] `robots.txt` present and correctly configured
- [ ] `sitemap.xml` generated and accessible
- [ ] Canonical URLs set correctly
- [ ] See [SEO_MAP.md](SEO_MAP.md) for complete route inventory

### Trust & Legal
- [ ] Privacy policy current and accurate
- [ ] Terms of service reviewed by counsel
- [ ] Cookie consent banner functional (if applicable)
- [ ] Trust Center content reviewed and accurate
- [ ] GDPR/CCPA compliance verified (if applicable)
- [ ] Security contact page / SECURITY.md present

### Analytics
- [ ] Analytics initialized on all public routes
- [ ] Event tracking verified (CTA clicks, form submissions, demo requests)
- [ ] No PII sent to analytics providers
- [ ] See [ANALYTICS_PLAN.md](ANALYTICS_PLAN.md) for event taxonomy

---

## Private / Internal Deployment Checklist

### Access Control
- [ ] Admin routes (`/admin`, `/ops/*`) not linked from public navigation
- [ ] Internal routes require authentication
- [ ] RBAC roles confirmed for all internal users
- [ ] Session expiry configured appropriately

### Database
- [ ] All migrations applied (`pnpm --filter artifacts/api-server db:migrate`)
- [ ] Migration rollback scripts tested
- [ ] Demo data NOT present in production (verify with DB query)
- [ ] Production database backup taken before deployment

---

## Screenshots

- [ ] Screenshots refreshed and reflect current UI
- [ ] README.md screenshot references point to valid files
- [ ] Screenshots stored in `docs/media/screenshots/`
- [ ] Run `pnpm capture:screens` to regenerate if needed

---

## Rollback Readiness

- [ ] Previous deployment state documented (which version is live)
- [ ] Database rollback script available and tested
- [ ] Azure deployment slots configured (blue/green swap available)
- [ ] [RUNBOOK_ROLLBACK.md](infra/runbooks/RUNBOOK_ROLLBACK.md) reviewed and current
- [ ] Incident response contacts confirmed

---

## Domain & DNS

- [ ] DNS records updated/verified for target domain
- [ ] SSL/TLS certificate valid and auto-renewing (Azure App Service or CDN)
- [ ] `www` redirect configured (if applicable)
- [ ] Custom domain validated in Azure App Service

---

## Monitoring

- [ ] Health check endpoints responding (`/api/health`)
- [ ] Azure Application Insights configured (production)
- [ ] Uptime monitoring configured for critical routes
- [ ] Alert thresholds set for error rate, response time, and CPU/memory
- [ ] On-call contact designated for production incidents

---

## Incident Readiness

- [ ] [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) reviewed by relevant team members
- [ ] [INCIDENT_SEVERITY_MATRIX.md](INCIDENT_SEVERITY_MATRIX.md) confirmed
- [ ] Communication channels (Slack/email) confirmed
- [ ] Rollback can be completed in < 15 minutes

---

## Post-Deployment Verification

After deploying, verify:
- [ ] Landing page loads correctly
- [ ] API health check: `GET /api/health` returns 200
- [ ] Authentication flow works end-to-end
- [ ] Contact form submission succeeds
- [ ] No JavaScript errors in browser console
- [ ] Mobile view renders correctly (test on real device or BrowserStack)
- [ ] Run `pnpm qa:site` against production URL

---

## Sign-off

| Item | Owner | Status |
|------|-------|--------|
| Technical readiness | Engineering | |
| Content readiness | Product | |
| Legal review | Counsel | |
| Security review | Security | |
| Go-live approval | Stephen Lutar | |
