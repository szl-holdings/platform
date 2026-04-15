# Deployment Guide — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Engineers, DevOps, release managers

> This guide consolidates `docs/deployment.md`, `DEPLOYMENT_READINESS.md`, `.github/workflows/deploy-staging.yml`, and `.github/workflows/deploy-production.yml` into one canonical deployment reference.

---

## Deployment Environments

| Environment | Platform | Purpose | Trigger |
|-------------|----------|---------|---------|
| **Development** | Replit workspace | Active development, feature branches, live previews | Automatic (always running) |
| **Staging** | Replit (published) | Pre-production validation, demo environment | Push to `main` / `master` |
| **Production** | Azure App Service | Customer-facing, multi-tenant | GitHub Release published or manual dispatch |

---

## Pre-Deployment Checklist

Before deploying to staging or production, complete the following:

### Environment & Secrets

- [ ] `DATABASE_URL` set for target environment (production string, not dev)
- [ ] `SESSION_SECRET` set — strong random string (≥ 32 characters, never reused across environments)
- [ ] `SECRET_ENCRYPTION_KEY` set for production (primary encryption key for `lib/crypto.ts`)
- [ ] `ADMIN_PIN` set — unique per environment
- [ ] `CORS_ORIGINS` configured — must match frontend domain(s) exactly
- [ ] All third-party API keys validated and active (Stripe, OpenAI, Mapbox, etc.)
- [ ] Azure Key Vault configured with all secrets (production only)
- [ ] No secrets committed to source control — verify with `git status`

### Application

- [ ] All migrations applied: `pnpm --filter @szl-holdings/db run db:migrate`
- [ ] Production database backup taken before deployment
- [ ] Demo data NOT present in production
- [ ] `pnpm build` passes with no errors
- [ ] `pnpm typecheck` passes with no errors
- [ ] `pnpm lint` passes with no errors
- [ ] Health check endpoint responds: `GET /api/health`

### Content & Trust

- [ ] No placeholder text ("Lorem ipsum", "TODO", "COMING SOON") visible on public routes
- [ ] Legal pages present: `/legal/privacy`, `/legal/terms`, `/accessibility`
- [ ] Trust Center accessible at `/trust-center`
- [ ] Contact forms tested and verified

### Monitoring

- [ ] Azure Application Insights configured (production)
- [ ] Uptime monitoring configured for critical routes
- [ ] On-call contact designated

See `DEPLOYMENT_READINESS.md` for the full checklist with sign-off fields.

---

## Staging Deployment

### Automated (GitHub Actions)

Staging deployment triggers automatically on every push to `main` or `master`.

**Workflow:** `.github/workflows/deploy-staging.yml`

```
Push to main/master
    │
    ▼
Verify REPLIT_STAGING_DEPLOY_TOKEN (GitHub secret)
    │
    ├── Token absent → Skip (warning in workflow summary)
    │
    └── Token present → POST to Replit deployment API
            REPLIT_STAGING_APP_ID + REPLIT_STAGING_DEPLOY_TOKEN
```

**Required GitHub secrets (Settings → Environments → staging):**
- `REPLIT_STAGING_APP_ID` — Replit App ID for the staging deployment
- `REPLIT_STAGING_DEPLOY_TOKEN` — Replit deploy token for staging

If these secrets are not configured, the staging workflow logs a warning and skips deployment — it does **not** fail the CI run.

### Manual (Replit)

1. Open the Replit workspace
2. Use the Replit deployment panel to publish
3. Replit automatically:
   - Provisions HTTPS/TLS
   - Manages PostgreSQL connection
   - Applies environment secrets
   - Performs zero-downtime deploy

### Post-Staging Verification

```bash
curl https://<staging-domain>/api/health
curl https://<staging-domain>/api/health/ready
```

Run `pnpm qa:site` against the staging URL for automated validation.

---

## Production Deployment

### Automated (GitHub Release)

Production deployment triggers automatically when a GitHub Release is published.

**Workflow:** `.github/workflows/deploy-production.yml`

```
GitHub Release published
    │
    ▼
Deploy to production environment
    │
    ├── Verify REPLIT_DEPLOY_TOKEN
    │
    └── POST to Replit production deployment API
            REPLIT_APP_ID + REPLIT_DEPLOY_TOKEN
```

### Manual Dispatch

Production can also be deployed via manual `workflow_dispatch`:

1. Go to GitHub Actions → "Deploy — Production"
2. Click "Run workflow"
3. Enter the ref (tag, branch, or SHA) to deploy
4. Type `deploy` in the confirmation field (required)
5. Click "Run workflow"

**Required GitHub secrets (Settings → Environments → production):**
- `REPLIT_APP_ID` — Replit App ID for production
- `REPLIT_DEPLOY_TOKEN` — Replit deploy token for production

### Azure Production Deployment

For enterprise Azure deployments, the infrastructure is defined in `/infra/` using Bicep templates.

#### Step 1: Deploy Infrastructure

```bash
az deployment group create \
  --resource-group szl-production \
  --template-file infra/main.bicep \
  --parameters @infra/parameters.json
```

**Azure resources provisioned:**
- App Service (Node.js 20 LTS, Linux, autoscale)
- PostgreSQL Flexible Server (General Purpose tier, automated backups)
- Key Vault (centralized secrets management)
- Redis Cache (session store, real-time cache)
- CDN (static asset delivery via Azure Front Door)
- Application Insights (APM, distributed tracing, log analytics)

#### Step 2: Configure Secrets in Key Vault

```bash
az keyvault secret set --vault-name szl-keyvault --name DATABASE-URL --value "postgresql://..."
az keyvault secret set --vault-name szl-keyvault --name SESSION-SECRET --value "..."
az keyvault secret set --vault-name szl-keyvault --name SECRET-ENCRYPTION-KEY --value "..."
az keyvault secret set --vault-name szl-keyvault --name STRIPE-SECRET-KEY --value "..."
az keyvault secret set --vault-name szl-keyvault --name OPENAI-API-KEY --value "..."
# ... all secrets from ENV_MATRIX.md
```

#### Step 3: Build and Deploy API Server

```bash
pnpm --filter @workspace/api-server build
az webapp deploy --resource-group szl-production --name szl-api --src-path dist/
```

#### Step 4: Build and Deploy Frontend Artifacts

```bash
pnpm -r build
# Deploy static assets to Azure CDN / Blob Storage
az storage blob upload-batch \
  --destination '$web' \
  --source artifacts/szl-holdings/dist \
  --account-name szlstatic
```

---

## Environment Configuration

### Critical Variables for All Environments

| Variable | Description | Secret |
|----------|-------------|--------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | HMAC key for WebSocket tickets; fallback encryption key | Yes |
| `SECRET_ENCRYPTION_KEY` | Primary encryption key (`lib/crypto.ts`) | Yes |
| `NODE_ENV` | `development` / `production` | No |
| `PORT` | Server port (auto-assigned by Replit) | No |
| `CORS_ORIGINS` | Comma-separated allowed origins — required in production | No |

See `ENV_MATRIX.md` for the complete environment variable reference.

### Environment-Specific Configuration

**Development (Replit):**
```
NODE_ENV=development
LOG_LEVEL=debug
# All secrets managed via Replit Secrets panel
```

**Staging (Replit published):**
```
NODE_ENV=production
APP_ENV=staging
LOG_LEVEL=info
CORS_ORIGINS=https://<staging-domain>
```

**Production (Azure):**
```
NODE_ENV=production
APP_ENV=production
LOG_LEVEL=warn
# All secrets managed via Azure Key Vault
APPLICATIONINSIGHTS_CONNECTION_STRING=<from Key Vault>
REDIS_CONNECTION_STRING=<from Key Vault>
```

---

## Database Management

### Schema Changes

```bash
# Development — push schema changes (no migration file, destructive)
pnpm --filter @szl-holdings/db run db:push

# Development — force push (reset + apply)
yes '' | pnpm --filter db push --force

# Staging / Production — generate and apply migrations (safe)
pnpm --filter @szl-holdings/db run db:generate
pnpm --filter @szl-holdings/db run db:migrate
```

### Seeding

```bash
# Seed demo data (development only)
pnpm --filter scripts run seed
```

**Never seed demo data into staging or production.**

### Multi-Tenant Configuration (Azure)

Enterprise deployments use per-tenant configuration stored in the `azure_tenants` table:
- Tenant-scoped Power BI workspace config (encrypted)
- Per-tenant embed token issuance with Row-Level Security
- Azure AD integration for SSO
- Tenant provisioning wizard (4-step onboarding)

---

## Health Checks & Post-Deploy Verification

After any deployment, verify:

```bash
# Liveness check
curl https://<domain>/api/health/live

# Readiness check (database connectivity)
curl https://<domain>/api/health/ready

# Full health status
curl https://<domain>/api/health

# Detailed diagnostics (requires auth or internal token)
curl -H "X-Internal-Token: $ALLOY_INTERNAL_TOKEN" https://<domain>/api/health/detailed
```

**Verification checklist:**
- [ ] Landing page loads correctly
- [ ] `GET /api/health` returns `200 healthy`
- [ ] Authentication flow works end-to-end
- [ ] Contact form submission succeeds
- [ ] No JavaScript errors in browser console
- [ ] Mobile view renders correctly

---

## Rollback

### Replit Rollback

Replit creates automatic checkpoints. If a deployment breaks something:
1. Open the Replit checkpoint panel
2. Select the last known-good checkpoint
3. Restore to that checkpoint

### Azure Rollback

Azure App Service deployment slots support blue/green swap:

```bash
# Swap staging slot back to production
az webapp deployment slot swap \
  --resource-group szl-production \
  --name szl-api \
  --slot staging \
  --target-slot production
```

### Database Rollback

```bash
# Stop traffic first, then restore from backup
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
gunzip -c backups/daily_<timestamp>.sql.gz | psql "$DATABASE_URL"
pnpm --filter @szl-holdings/db run db:migrate  # Re-apply to current version
```

See `infra/runbooks/RUNBOOK_ROLLBACK.md` for the full rollback playbook. Rollback should complete in < 15 minutes.

---

## CI/CD Pipeline

### GitHub Actions Workflows

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| CI | `ci.yml` | Push / PR | Lint, typecheck, build |
| E2E Tests | `e2e.yml` | Push / PR | Playwright E2E tests |
| Lighthouse CI | `lighthouse.yml` | Push / PR | Performance audits |
| CodeQL | `codeql.yml` | Push / PR | Security analysis |
| Security Audit | `security.yml` | Scheduled | Dependency audit |
| Deploy Staging | `deploy-staging.yml` | Push to main | Staging deployment |
| Deploy Production | `deploy-production.yml` | Release published | Production deployment |

### Post-Merge Script

The `scripts/post-merge.sh` script runs automatically after task branch merges:
1. `pnpm install` — Install / update dependencies
2. `pnpm --filter db push` — Apply schema changes
3. Build integrity verification

---

## Related Documents

| Document | Path |
|----------|------|
| Source deployment notes | `docs/deployment.md` |
| Deployment readiness checklist | `DEPLOYMENT_READINESS.md` |
| Environment variable matrix | `ENV_MATRIX.md` |
| Operations runbook | `OPERATIONS-RUNBOOK.md` |
| Rollback runbook | `infra/runbooks/RUNBOOK_ROLLBACK.md` |
| Secrets runbook | `infra/runbooks/RUNBOOK_SECRETS.md` |
| Disaster recovery | `docs/disaster-recovery.md` |
| Production readiness | `docs/production-readiness.md` |
