# Environment Validation — SZL Holdings Platform

**Version:** 1.0 | **Date:** April 2026 | **Audience:** Engineers, release owners, operators

**Related:** [RELEASE_INTELLIGENCE.md](RELEASE_INTELLIGENCE.md) · [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) · [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) · [ENV_MATRIX.md](ENV_MATRIX.md)

---

## Purpose

This checklist validates that each environment (development, staging, production) is correctly configured before a release is promoted. Complete the applicable stage before promoting to the next environment.

---

## Stage 1 — Development → Staging Promotion Gate

Complete before publishing to Replit staging / demo environment.

### Code & Build

- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm lint` passes with zero errors
- [ ] `pnpm -r build` succeeds for all artifacts
- [ ] `pnpm test` passes with no failures
- [ ] No `console.log` in production code paths

### Environment Configuration

- [ ] `DATABASE_URL` is set and points to the staging database (not development)
- [ ] `SESSION_SECRET` is set in Replit Secrets (32+ characters)
- [ ] `SECRET_ENCRYPTION_KEY` is set and distinct from `SESSION_SECRET`
- [ ] `ADMIN_PIN` is set
- [ ] `NODE_ENV` is `production` in published environment
- [ ] `CORS_ORIGINS` set to staging domain
- [ ] No secrets in `.env` files committed to version control

### Database

- [ ] All Drizzle migrations applied (`pnpm --filter artifacts/api-server db:migrate`)
- [ ] Schema matches expected state (no pending migrations)
- [ ] Demo/seed data present if staging is used for demo (or confirmed absent if clean)
- [ ] Migration is backwards-compatible with the previous deployed version

### Health Check

- [ ] `GET /api/health` returns `{"status":"healthy"}` with HTTP 200
- [ ] `GET /api/health/detailed` returns full system status without errors

### Smoke Tests

Run: `node scripts/qa/smoke-routes.js`

- [ ] All public routes return expected HTTP status codes
- [ ] Authentication flow completes successfully
- [ ] API endpoints respond within 2 seconds
- [ ] No JavaScript console errors on key pages
- [ ] Contact form renders and validates

### Feature Flags

- [ ] All new feature flags registered in the flag registry
- [ ] New flags default to `false` (off) unless intentionally enabled for staging
- [ ] Kill switches defined for all major new features

---

## Stage 2 — Staging → Production Promotion Gate

Complete before deploying to Azure production. Also verify all hard blockers from [LAUNCH_BLOCKERS.md](LAUNCH_BLOCKERS.md) are resolved.

### All Stage 1 checks must pass first

### Secrets & Security (Production-Specific)

- [ ] `DATABASE_URL` points to production Azure PostgreSQL (not staging)
- [ ] `SESSION_SECRET` is unique to production (never reused from dev/staging)
- [ ] `SECRET_ENCRYPTION_KEY` is unique to production
- [ ] All secrets confirmed in Azure Key Vault
- [ ] `SENTRY_DSN` set for production error tracking
- [ ] `CORS_ORIGINS` set to production domain only
- [ ] `ALLOY_INTERNAL_TOKEN` is a production-specific value (32+ chars)
- [ ] `OTEL_EXPORTER_OTLP_ENDPOINT` set; telemetry verified in observability backend
- [ ] `DEMO_MODE=false` or unset in production
- [ ] External uptime monitoring configured and alerting on `/api/health`

### Database (Production)

- [ ] Production database backup taken immediately before migration
- [ ] Migrations tested against a clone of production schema
- [ ] Migration rollback script prepared and tested
- [ ] Demo/seed data NOT present in production
- [ ] Connection pool settings tuned for expected load (`DB_POOL_MAX`)

### Infrastructure

- [ ] Azure App Service health check configured pointing to `/api/health`
- [ ] Azure deployment slots (blue/green) configured
- [ ] CDN cache invalidation prepared for static assets
- [ ] SSL/TLS certificate valid and auto-renewing
- [ ] DNS records verified for production domain
- [ ] Application Insights configured and receiving events

### Legal & Compliance

- [ ] Privacy Policy reviewed and current
- [ ] Terms of Service reviewed by counsel
- [ ] Cookie consent mechanism functional (if applicable)
- [ ] GDPR/CCPA compliance verified for analytics tools

### Release Artifacts

- [ ] `CHANGELOG.md` updated with release notes
- [ ] `RELEASE_CHECKLIST.md` fully signed off
- [ ] `ROUTE_INVENTORY.md` updated if new routes added
- [ ] `ENV_MATRIX.md` updated if new variables added
- [ ] Feature flags configured for staged rollout (Stage 0 = internal only)

---

## Stage 3 — Post-Deployment Verification (Production)

Run immediately after production deployment completes.

### Health Verification (First 5 minutes)

```bash
# Primary health check
curl -f https://api.szlholdings.com/api/health
# Expected: {"status":"healthy"}

# Detailed health (with internal token)
curl -H "X-Internal-Token: $ALLOY_INTERNAL_TOKEN" \
  https://api.szlholdings.com/api/health/detailed
```

- [ ] `/api/health` returns 200 with `{"status":"healthy"}`
- [ ] Database connectivity confirmed in detailed health
- [ ] Job queue depth < 10
- [ ] No error alerts in Sentry (first 5 minutes)

### Critical Path Verification (First 15 minutes)

- [ ] Landing page loads without errors
- [ ] Authentication login/logout flow works
- [ ] At least one API endpoint returns correct data
- [ ] No JavaScript console errors on main pages
- [ ] Mobile app connects to production API (if applicable)

### Monitoring Confirmation (First 30 minutes)

- [ ] Error rate < 0.5%
- [ ] P95 latency < 2 seconds
- [ ] No new Sentry error classes
- [ ] Uptime monitor shows green
- [ ] On-call engineer available and monitoring

---

## Environment Validation Sign-Off

| Stage | Environment | Validated By | Date | Notes |
|-------|-------------|--------------|------|-------|
| Stage 1 | Staging | | | |
| Stage 2 | Production Pre-Deploy | | | |
| Stage 3 | Production Post-Deploy | | | |

---

## Automated Validation Commands

```bash
# Run full pre-release validation suite
pnpm qa:site                          # Route smoke tests
pnpm typecheck                        # TypeScript validation
pnpm lint                             # Code quality
node scripts/qa/check-links.js        # Link validation
node scripts/qa/check-metadata.js     # SEO/meta validation
node scripts/qa/smoke-routes.js       # Route health

# Health check
curl -f $BASE_URL/api/health

# Build validation
pnpm -r build
```

---

*Last updated: 2026-04-16*
