# Current Environment Promotion Model

**Date:** April 16, 2026
**Status:** Authoritative
**Scope:** How code and configuration moves from development to production, and how environments are isolated from each other

---

## 1. Environment Overview

| Environment | Host | Database | Secrets | Domain | Accessibility |
|-------------|------|----------|---------|--------|--------------|
| **Development** | Replit workspace | Replit-managed PostgreSQL | Replit Secrets | `*.replit.dev` | Workspace collaborators only |
| **Staging** | Azure App Service (staging slot) | Azure PostgreSQL Flexible (staging) | Azure Key Vault (staging vault) | `staging.szlholdings.com` | Internal team only |
| **Production** | Azure App Service (prod) | Azure PostgreSQL Flexible (prod) | Azure Key Vault (prod vault) | `szlholdings.com` | Public |

> **Current state:** As of April 2026, the production environment is Replit-hosted (not Azure). The model above reflects the production-intent architecture. Azure staging and production slots are not yet provisioned. The Replit deployment serves as the current production environment.

---

## 2. Promotion Gates

### Development → Staging

A code change may be promoted to staging when:

- [ ] All CI checks pass (lint, type-check, unit tests, integration tests, build)
- [ ] API health endpoint returns healthy in development
- [ ] Smoke test suite passes: `pnpm qa:site`
- [ ] No outstanding `CRITICAL` or `HIGH` severity items in the gap register that the change touches
- [ ] CHANGELOG entry written
- [ ] Peer review completed (at minimum: founder review for changes touching auth, billing, or data schema)

### Staging → Production

A build may be promoted to production when:

- [ ] All development → staging gates passed
- [ ] Staging deployment is healthy for a minimum 24-hour soak period (for non-emergency changes)
- [ ] Full smoke test suite passed in staging environment
- [ ] Stripe live keys configured and tested in staging (if billing changes)
- [ ] CORS_ORIGINS updated for custom domain (GAP-004 — required before DNS cutover)
- [ ] Sentry DSN configured for error monitoring (GAP-006 — required before first paid tenant)
- [ ] Release notes finalized
- [ ] Git tag created (`git tag -a vX.Y.Z`)
- [ ] GitHub Release created from tag
- [ ] Founder sign-off for MAJOR and MINOR releases

### Emergency Production Patch (Hotfix Path)

For critical bug fixes that cannot wait for the standard promotion cycle:

1. Author fix in development
2. Abbreviated validation: build + health check + targeted smoke test (not full suite)
3. Deploy directly to production with founder awareness
4. Create `PATCH` version tag immediately after
5. Document the abbreviated validation in the release notes
6. Full validation suite run post-deploy within 4 hours

---

## 3. Data Promotion Rules

**Data does not move across environment boundaries.** This is an absolute rule.

| What | Rule |
|------|------|
| Development data | Synthetic/seeded only. Never from production. |
| Staging data | Anonymized or freshly seeded only. Never real customer data. |
| Production data | Real. No staging or development systems access it. |
| Schema migrations | Applied forward-only via `pnpm db:push`. Never share migration state across environments. |
| Seed scripts | `pnpm seed:demo` — development only. Never run against staging or production. |

---

## 4. Secrets Promotion

Secrets are **environment-specific and never shared** across environments.

| Environment | Secret Storage | Rotation |
|-------------|--------------|----------|
| Development | Replit Secrets | Per Replit workspace isolation |
| Staging | Azure Key Vault (staging vault) | Separate from production vault |
| Production | Azure Key Vault (production vault) | 90–180 day schedule per `docs/SECRETS_POLICY.md` |

**Promoting a secret:** When a new integration requires a new secret in production, the process is:

1. Create the secret in the production Key Vault (not copied from development — new value)
2. Verify the application picks up the secret on next deployment
3. Record the secret name (not value) in the canonical secrets map (`docs/audit/env-canonical-map.md`)
4. Add to rotation schedule

---

## 5. Current Replit → Azure Promotion Path

The following steps are required to promote from the current Replit deployment to the Azure production architecture. This is the path to production-grade hosting.

### Phase 1: Staging (Pre-conditions)

- [ ] Provision Azure App Service (staging slot + production slot)
- [ ] Provision Azure PostgreSQL Flexible Server (staging instance)
- [ ] Provision Azure Key Vault (staging vault)
- [ ] Configure managed identity for App Service → Key Vault access
- [ ] Run schema migration: `pnpm db:push` against staging database
- [ ] Seed staging with representative demo data
- [ ] Deploy all artifacts to staging slot
- [ ] Validate all CI checks and smoke tests in staging

### Phase 2: Production Cut-Over

- [ ] Provision Azure PostgreSQL Flexible Server (production instance)
- [ ] Provision Azure Key Vault (production vault)
- [ ] Configure all live secrets in production Key Vault
- [ ] Update `CORS_ORIGINS` to include `szlholdings.com` (GAP-004)
- [ ] Configure Sentry DSN for production (GAP-006)
- [ ] Configure Stripe live keys (GAP-005)
- [ ] Configure Redis for session persistence (GAP-003)
- [ ] Deploy all artifacts to production slot
- [ ] DNS cutover: `szlholdings.com` → Azure App Service endpoint
- [ ] Verify all health checks post-cutover
- [ ] Monitor for 24 hours before declaring production stable

### Timeline Estimate

| Phase | Effort |
|-------|--------|
| Phase 1 (Staging) | 2–3 days |
| Phase 2 (Production cut-over) | 1 day (with 24-hour soak) |

---

## 6. Rollback Across Environments

| Situation | Rollback Mechanism |
|-----------|------------------|
| Bad code in development | Replit checkpoint restore (5–10 min) |
| Bad code in staging | Azure slot swap back; or redeploy last known good tag |
| Bad code in production (Azure) | Azure slot swap to staging slot (< 1 min for slot swap) |
| Bad database migration in production | Azure PostgreSQL point-in-time restore |

See `docs/releases/current-rollback-doctrine.md` for the full rollback runbook.

---

## Related Documents

- `docs/releases/current-release-doctrine.md` — release process
- `docs/releases/current-rollback-doctrine.md` — rollback procedures
- `docs/ENVIRONMENT_SEPARATION.md` — detailed environment isolation rules
- `docs/SECRETS_POLICY.md` — secrets management policy
- `docs/audit/env-canonical-map.md` — canonical environment variable map
