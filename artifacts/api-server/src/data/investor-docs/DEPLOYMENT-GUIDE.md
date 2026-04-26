# Deployment Guide — SZL Holdings Platform

**Date:** April 2026 | **Audience:** Engineers, operators, enterprise evaluators

**Related:** [OPERATIONS-RUNBOOK.md](OPERATIONS-RUNBOOK.md) · [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md) · [KNOWN-GAPS.md](KNOWN-GAPS.md)

---

## Overview

SZL Holdings operates a two-environment deployment model:

| Environment | Platform | Purpose | Status |
|-------------|----------|---------|--------|
| Development / Staging | Replit | Active development, internal preview, investor demo | Live — 10+ workflows |
| Production | Azure App Service | Enterprise customer-facing, multi-tenant | Architecture ready; not yet live |

---

## Replit Environment (Development / Staging)

### How It Works

The Replit workspace is a pnpm monorepo where each artifact is a separate service bound to a unique `$PORT` assigned by Replit. Services are exposed via path-based proxy routing (not direct localhost access).

**Preview URL pattern:** `https://$REPLIT_DEV_DOMAIN/<artifact-preview-path>/`

### Starting Services

Each artifact has a dedicated workflow managed through the Replit interface. Critical workflows:

| Workflow | Must Run First? |
|----------|----------------|
| `artifacts/api-server: api` | **Yes** — all frontends depend on this |
| `artifacts/szl-holdings: web` | No, but serves as primary landing |
| `artifacts/aegis: web` | No |
| `artifacts/vessels: web` | No |

Always start the API server workflow before any frontend workflow.

### Publishing (Staging Deployment)

Publishing via Replit creates an autoscaled deployment with:
- Automatic HTTPS/TLS
- Managed PostgreSQL
- Environment secret management
- Health check monitoring
- Zero-downtime deploys (rolling restart)

```bash
# Build all artifacts before publishing
pnpm -r build

# API server build (primary)
pnpm --filter @workspace/api-server build

# Publish via Replit UI or CLI
```

### Environment Variables in Replit

All secrets are managed via Replit Secrets (not `.env` files):

1. Open the Replit Secrets panel
2. Add variable name and value
3. Restart affected workflows after adding secrets

**Minimum required secrets:**
- `DATABASE_URL` — auto-provisioned by Replit
- `SESSION_SECRET` — strong random string, 32+ characters
- `SECRET_ENCRYPTION_KEY` — separate from `SESSION_SECRET`
- `ADMIN_PIN` — for CMS admin access

---

## Azure Production Deployment

Full production infrastructure is defined in `/infra/` using Azure Bicep templates.

### Infrastructure Components

| Resource | Configuration |
|----------|--------------|
| **App Service** | Node.js 22 LTS, Linux, P2v3 (autoscale) |
| **PostgreSQL Flexible Server** | General Purpose tier, 4 vCores, automated backups |
| **Azure Key Vault** | Centralized secrets management; referenced by App Service |
| **Redis Cache** | Session store and real-time cache (C1 Standard) |
| **CDN / Front Door** | Static asset delivery, SSL termination |
| **Application Insights** | APM, distributed tracing, log analytics |

### Deployment Steps

#### 1. Deploy Infrastructure

```bash
az deployment group create \
  --resource-group szl-production \
  --template-file infra/main.bicep \
  --parameters @infra/parameters.json
```

#### 2. Configure Secrets in Key Vault

```bash
az keyvault secret set --vault-name szl-keyvault \
  --name DATABASE-URL --value "postgresql://..."

az keyvault secret set --vault-name szl-keyvault \
  --name SESSION-SECRET --value "$(openssl rand -hex 32)"

az keyvault secret set --vault-name szl-keyvault \
  --name SECRET-ENCRYPTION-KEY --value "$(openssl rand -hex 32)"

az keyvault secret set --vault-name szl-keyvault \
  --name STRIPE-SECRET-KEY --value "sk_live_..."
```

#### 3. Build and Deploy API Server

```bash
pnpm --filter @workspace/api-server build

az webapp deploy \
  --resource-group szl-production \
  --name szl-api \
  --src-path artifacts/api-server/dist.zip
```

#### 4. Deploy Frontend Artifacts

```bash
pnpm -r build

# Deploy static assets to CDN / Azure Blob Storage
# No deploy script exists in the repository — this step is handled via CI/CD pipeline
# (e.g., GitHub Actions or Azure DevOps) using the build output in each artifact's dist/ folder
```

#### 5. Run Database Migrations

```bash
# Against production DB — run from CI/CD context
DATABASE_URL="$PROD_DATABASE_URL" pnpm --filter artifacts/api-server db:migrate
```

**Always take a database backup before running migrations in production.**

### Multi-Tenant Configuration

Enterprise deployments use per-tenant configuration stored in the database:

- Tenant-scoped configuration encrypted in Key Vault
- Azure AD integration for SSO + SCIM 2.0 user sync
- Tenant provisioning wizard (4-step onboarding)
- Per-tenant billing via Stripe

---

## Hard Blocker Pre-Deploy Verification

Before executing any production deployment for public or design-partner launch, verify all hard blockers from [LAUNCH_BLOCKERS.md](LAUNCH_BLOCKERS.md) are resolved. This is a mandatory pre-step, not optional:

| Blocker | Verification Step | Status |
|---------|-----------------|--------|
| **LB-001** Firebase/Google credential rotation | Run `git log --all --full-history -- '**/google-services.json'` — clean. Rotation confirmed by Founder. | ☐ |
| **LB-002** External uptime monitoring live | Verify monitor is active and alerting on `GET /api/health` from external service | ☐ |
| **LB-003** Error tracking configured | Confirm Sentry (or equivalent) is receiving events in production; `SENTRY_DSN` set | ☐ |
| **LB-004** Production DB separate from dev | Confirm `DATABASE_URL` in production differs from development; no seed data present | ☐ |
| **LB-005** Production secrets independent | Confirm `SESSION_SECRET`, `SECRET_ENCRYPTION_KEY`, `ADMIN_PIN`, `CORS_ORIGINS` are production-specific | ☐ |
| **LB-006** OTEL exporter wired | Confirm `OTEL_EXPORTER_OTLP_ENDPOINT` set; at least one trace visible in observability backend | ☐ |
| **LB-007** Legal review complete | Confirm Privacy Policy, ToS, and design-partner agreements reviewed and approved by counsel | ☐ |

**Do not proceed to the deployment steps below until all seven boxes are checked.**

For full blocker details, resolution guidance, and the formal sign-off table, see [LAUNCH_BLOCKERS.md](LAUNCH_BLOCKERS.md).

---

## Pre-Deployment Checklist

Complete this checklist before every production deployment. Full version: [DEPLOYMENT_READINESS.md](DEPLOYMENT_READINESS.md).

### Environment & Secrets
- [ ] `DATABASE_URL` points to the correct production connection string
- [ ] `SESSION_SECRET` is environment-specific (32+ chars, not shared with dev)
- [ ] `SECRET_ENCRYPTION_KEY` set independently from `SESSION_SECRET`
- [ ] `CORS_ORIGINS` set to production allowed origins
- [ ] `ADMIN_PIN` set (hashed at rest)
- [ ] All third-party API keys valid (Stripe, Mapbox, etc.)
- [ ] No secrets in committed code (`git log` clean)

### Database
- [ ] All migrations applied and verified in staging before production
- [ ] Migration is backwards-compatible
- [ ] Production database backup taken before migration
- [ ] Demo/seed data NOT present in production

### Code Quality
- [ ] `pnpm test` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds for all artifacts

### Security
- [ ] No new unvalidated user inputs
- [ ] CSRF tokens on all state-changing endpoints
- [ ] Authentication required on all private routes
- [ ] Admin/internal routes not in public navigation

### Post-Deploy Verification
- [ ] `GET /api/health` returns 200
- [ ] Authentication flow works end-to-end
- [ ] Contact/demo forms submit successfully
- [ ] No JavaScript errors in browser console
- [ ] Monitor error rate and latency for 30 minutes post-deploy

---

## Database Management

```bash
# Push schema changes (development)
pnpm --filter db push

# Force reset + push (development only — destroys data)
yes '' | pnpm --filter db push --force

# Run migrations (production)
pnpm --filter artifacts/api-server db:migrate

# Seed demo data (development / staging)
pnpm seed:demo
```

---

## Health Checks

| Endpoint | Type | Use |
|----------|------|-----|
| `GET /api/health` | Public liveness | Load balancer health check |
| `GET /api/health/detailed` | Authenticated system status | Monitoring dashboards, on-call checks |

Detailed health includes: database pool metrics, queue depth, AI provider reachability, error rate, P95 latency.

---

## CI/CD Pipeline

The workspace uses a post-merge setup script (`scripts/post-merge.sh`) that runs automatically after task branch merges:

1. `pnpm install` — Install / sync dependencies
2. `pnpm --filter db push` — Push schema changes to development DB
3. Build integrity check

**CI gates (run on every commit):**
- `pnpm audit --audit-level high` — blocks on vulnerable dependencies
- Secret pattern scan — blocks if credentials detected in source
- `pnpm typecheck` — blocks on type errors
- `pnpm lint` — blocks on lint errors
- `pnpm -r build` — blocks on build failures

---

## Rollback Procedures

### Replit Rollback

Replit maintains a checkpoint system. To rollback:
1. Open Replit checkpoint history
2. Select last known good checkpoint
3. Restore and restart workflows
4. Verify `GET /api/health` returns 200

### Azure Rollback

Azure deployment slots enable blue/green swap:

```bash
# Swap deployment slots (swap staging → production)
az webapp deployment slot swap \
  --resource-group szl-production \
  --name szl-api \
  --slot staging \
  --target-slot production
```

Full rollback procedures: `infra/runbooks/RUNBOOK_ROLLBACK.md`

### Rollback Decision Criteria

Rollback immediately (before investigation) if:
- A deployment happened in the last 2 hours and caused the issue
- Data integrity is at risk
- Fix would take more than 1 hour

---

## Mobile Deployment (APEX / Expo)

Mobile apps are built via Expo Application Services (EAS).

```bash
# Local build (development)
cd artifacts/szl-holdings-mobile
npx expo start

# EAS production build (iOS / Android)
eas build --platform all --profile production

# EAS submit to App Store / Play Store
eas submit --platform all
```

**Note:** EAS Build configuration (`eas.json`) and automated distribution pipeline are not yet configured — tracked in [KNOWN-GAPS.md](KNOWN-GAPS.md).

---

*See also: [OPERATIONS-RUNBOOK.md](OPERATIONS-RUNBOOK.md) · [DEPLOYMENT_READINESS.md](DEPLOYMENT_READINESS.md) · [docs/deployment.md](docs/deployment.md)*
---

### GitHub Actions Workflows

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| CI | `ci.yml` | Push / PR | Lint, typecheck, build all packages |
| Release | `release.yml` | Push to main / manual | Semantic versioning and GitHub Release |
| Deploy Staging | `deploy-staging.yml` | Push to main | Staging deployment via Replit API |
| Deploy Production | `deploy-production.yml` | Release published / manual | Production deployment via Replit API |

### Post-Merge Script

The `scripts/post-merge.sh` script runs automatically after task branch merges:
1. `pnpm install` — Install / update dependencies
2. `pnpm --filter db push` — Apply schema changes
3. Build integrity verification

---

## Related Documents

| Document | Path |
|----------|------|
| **Launch blockers (authoritative)** | `LAUNCH_BLOCKERS.md` |
| **Go/No-Go checklist** | `GO_NO_GO_CHECKLIST.md` |
| **Operational readiness scorecard** | `OPERATIONAL_READINESS_SCORECARD.md` |
| **Public launch readiness framework** | `PUBLIC_LAUNCH_READINESS.md` |
| **Executive launch summary** | `EXECUTIVE_LAUNCH_SUMMARY.md` |
| Source deployment notes | `docs/deployment.md` |
| Deployment readiness checklist (deprecated) | `DEPLOYMENT_READINESS.md` |
| Environment variable matrix | `ENV_MATRIX.md` |
| Operations runbook | `OPERATIONS-RUNBOOK.md` |
| Rollback runbook | `infra/runbooks/RUNBOOK_ROLLBACK.md` |
| Secrets runbook | `infra/runbooks/RUNBOOK_SECRETS.md` |
| Disaster recovery | `docs/disaster-recovery.md` |
| Production readiness | `docs/production-readiness.md` |

---

*See also: [OPERATIONS-RUNBOOK.md](OPERATIONS-RUNBOOK.md) · [DEPLOYMENT_READINESS.md](DEPLOYMENT_READINESS.md) · [docs/deployment.md](docs/deployment.md)*

*Last verified against source code: 2026-04-16*
