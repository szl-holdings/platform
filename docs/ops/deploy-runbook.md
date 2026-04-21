# Deploy Runbook

**Platform:** SZL Holdings — Replit Production Deployment  
**Updated:** 2026-04-21  
**Deployment target:** Replit Autoscale  
**Audience:** Engineers, DevOps, release managers

> **Scope:** This runbook covers the Replit production deployment path only.
> Azure infrastructure (Bicep templates in `infra/`) is retained for enterprise integrations (SSO, Power BI) but is NOT the production deployment host.
> See `infra/runbooks/RUNBOOK_DEPLOYMENT.md` for the legacy Azure path (archived).

---

## Deployment Model Overview

```
Developer → push to main
    ↓
GitHub Actions CI gate (lint + typecheck + test + build + integration + security + readiness)
    ↓
deploy-staging.yml → Replit staging environment (auto, on CI pass)
    ↓
Manual QA + smoke tests on staging
    ↓
GitHub Release published (semver tag)
    ↓
deploy-production.yml → Replit production environment (triggered by release)
    ↓
Post-deploy health verification
```

---

## Preconditions

### Required Secrets (GitHub Settings → Environments)

All secrets must be set before automated deploy will succeed. Without them, the deploy workflows emit a warning and skip gracefully.

#### Production Environment (`production`)

| Secret | Purpose | How to obtain |
|--------|---------|---------------|
| `REPLIT_APP_ID` | Replit app identifier | Replit dashboard → your Repl → URL contains the app ID |
| `REPLIT_DEPLOY_TOKEN` | Auth token to trigger Replit deploy API | Replit dashboard → Deploy → API tokens |

#### Staging Environment (`staging`)

| Secret | Purpose | How to obtain |
|--------|---------|---------------|
| `REPLIT_STAGING_APP_ID` | Staging Repl identifier | Replit dashboard → staging Repl |
| `REPLIT_STAGING_DEPLOY_TOKEN` | Auth token for staging deploy | Replit dashboard → Deploy → API tokens |

#### Integration Tests (repo-level secrets)

| Secret | Purpose |
|--------|---------|
| `INTEGRATION_TEST_TOKEN` | Bearer token for live integration test suite |

### Required Replit Secrets (production environment)

Set these in Replit Secrets (Settings → Secrets) for the production Repl:

| Secret | Classification | Notes |
|--------|---------------|-------|
| `DATABASE_URL` | required-prod | Replit-managed PostgreSQL (injected automatically) |
| `SESSION_SECRET` | required-prod | `openssl rand -hex 32` |
| `OAUTH_STATE_SECRET` | required-prod | `openssl rand -hex 32` |
| `ALLOY_INTERNAL_TOKEN` | required-prod | Internal service auth token (not the dev value) |
| `NODE_ENV` | required-prod | Set to `production` |
| `CORS_ORIGINS` | required-prod | `https://*.replit.app,https://*.replit.dev,https://*.repl.co` |
| `PUBLIC_APP_URL` | required-prod | `https://szlholdings.replit.app` |
| `GUARDIAN_ENFORCE` | required-prod | `true` |
| `STRIPE_SECRET_KEY` | required-prod | Live mode key (if billing active) |
| `STRIPE_WEBHOOK_SECRET` | required-prod | From Stripe dashboard |
| `RESEND_API_KEY` | optional | For transactional email |
| `OPENAI_API_KEY` | optional | AI features; falls back to mock |
| `ANTHROPIC_API_KEY` | optional | AI features; falls back to mock |

---

## Step-by-Step: Automated Deploy (Normal Path)

### Step 1: Verify CI passes

1. Open GitHub Actions on the target commit.
2. Confirm the **CI Gate** job is green (all jobs: lint, typecheck, test, build, integration-test, docs-claims-check, secret-scan, readiness-gate, proof-chain-checks, route-security-matrix).
3. If any job is red, do not proceed.

### Step 2: Staging deploy (automatic)

After CI passes on `main`, `deploy-staging.yml` triggers automatically.

```bash
# Verify staging deploy completed
# GitHub Actions → deploy-staging.yml → most recent run → green
```

If `REPLIT_STAGING_DEPLOY_TOKEN` is not configured, the job warns and skips. In that case, verify the main branch state against the Replit dev environment directly.

### Step 3: Run staging smoke tests

```bash
# Point at staging URL
BASE_URL=https://<staging-repl>.<user>.repl.co node scripts/qa/smoke-product-mode.js

# Full site QA
BASE_URL=https://<staging-repl>.<user>.repl.co pnpm verify:health
```

Confirm:
- `GET /api/health` returns `{ "status": "ok" }`
- `GET /api/health` `services.database.status` is `ok` (not `degraded`)
- Authentication redirects work (no 500 errors)
- Core routes load without error boundary crashes

### Step 4: Publish a GitHub Release

1. Go to GitHub → Releases → Draft a new release.
2. Tag: `vX.Y.Z` (semver). Target: `main`.
3. Write release notes.
4. Click **Publish release**.

This triggers `deploy-production.yml` automatically.

### Step 5: Verify production deploy

```bash
# Health check
curl https://szlholdings.replit.app/api/health

# Expected response
{
  "status": "ok",
  "timestamp": "...",
  "version": "X.Y.Z",
  "uptime": ...,
  "services": {
    "database": { "status": "ok" },
    "storage": { "status": "ok" },
    "auth": { "status": "ok" },
    "ai": { "status": "ok" }
  }
}
```

Run the production smoke suite:

```bash
BASE_URL=https://szlholdings.replit.app node scripts/qa/smoke-product-mode.js
```

---

## Step-by-Step: Manual Deploy (Hotfix Path)

Use this when you need to deploy a specific ref without a full release cycle.

### Option A: `workflow_dispatch` via GitHub UI

1. GitHub Actions → **Deploy — Production** → **Run workflow**.
2. Fill in:
   - `ref`: the SHA, branch, or tag to deploy (leave blank for latest).
   - `confirm`: type exactly `deploy`.
3. Click **Run workflow**.

### Option B: GitHub CLI

```bash
gh workflow run deploy-production.yml \
  -f ref=<SHA or tag> \
  -f confirm=deploy
```

### Option C: Replit Deploy button (direct)

For urgent hotfixes when GitHub Actions is unavailable:

1. Open the Replit workspace for the production Repl.
2. Click **Deploy** in the Replit UI.
3. Confirm deployment settings.
4. Verify health after deploy.

---

## Database Migration

Run migrations **before** deploying new API server code that depends on schema changes:

```bash
# Against production (set DATABASE_URL to production value)
DATABASE_URL=<production-url> pnpm migrate

# Verify schema is current
DATABASE_URL=<production-url> pnpm --filter @szl-holdings/db run status
```

**Constraint:** Drizzle uses `db:push` (forward-only). There are no down-migrations. For breaking schema changes, see the [Rollback section](#rollback).

---

## Post-Deploy Verification Checklist

- [ ] `GET /api/health` → `{ "status": "ok" }` at production URL
- [ ] `services.database.status` is `ok`
- [ ] `services.auth.status` is `ok`
- [ ] Core routes load without error boundaries (szl-holdings, api-server, at minimum)
- [ ] Authentication flow completes (login → session → protected route)
- [ ] No elevated error rate in application logs (Replit → Logs)
- [ ] `pnpm verify:health` (pointed at production) exits 0

---

## Rollback

### Application Code Rollback

**Preferred:** Replit checkpoint system (fastest, no git operations needed).

1. Replit UI → Version history / Checkpoints.
2. Identify the last known good checkpoint.
3. Restore checkpoint.
4. Verify health: `GET /api/health`.
5. Run smoke tests.
6. Restart all affected workflows in Replit.

**Alternative:** Re-trigger deploy workflow with prior known-good tag.

```bash
gh workflow run deploy-production.yml \
  -f ref=<previous-good-tag> \
  -f confirm=deploy
```

### Database Rollback

**For additive changes** (new columns/tables): No rollback required — old code handles absence gracefully.

**For breaking changes**: Restore from Replit PostgreSQL snapshot.

1. Replit → Database → Snapshots.
2. Restore snapshot from before the breaking migration.
3. Verify API health after restore.
4. Re-run non-breaking migrations if needed.

### Rollback Decision Criteria

Roll back immediately if any of these are true:
- Error rate > 5% sustained for > 15 minutes
- `GET /api/health` returns non-200 for > 5 minutes
- Data corruption detected
- Security vulnerability actively exploited
- Database connection failures affecting > 10% of requests

---

## Missing Credentials — What's Needed

The following secrets are **not currently configured** and must be set before automated deploy is fully operational:

| Secret | Environment | Where to Set |
|--------|------------|-------------|
| `REPLIT_APP_ID` | GitHub `production` | GitHub Settings → Environments → production → Secrets |
| `REPLIT_DEPLOY_TOKEN` | GitHub `production` | GitHub Settings → Environments → production → Secrets |
| `REPLIT_STAGING_APP_ID` | GitHub `staging` | GitHub Settings → Environments → staging → Secrets |
| `REPLIT_STAGING_DEPLOY_TOKEN` | GitHub `staging` | GitHub Settings → Environments → staging → Secrets |
| `INTEGRATION_TEST_TOKEN` | GitHub repo-level | GitHub Settings → Secrets and variables → Actions |

Without these, the deploy workflows will warn and skip gracefully — CI still passes, but actual deployment does not occur. The Replit Deploy button remains a viable manual alternative.

---

## References

- `audit/deployment-readiness-report.md` — Full CI/infra status inventory
- `docs/DEPLOYMENT_MODEL.md` — Deployment doctrine and architecture
- `docs/PRODUCTION_READINESS_CHECKLIST.md` — Full production go-live checklist
- `docs/ROLLBACK_AND_CANARY_PLAN.md` — Rollback procedures and canary strategy
- `infra/runbooks/RUNBOOK_ROLLBACK.md` — Detailed rollback runbook
- `infra/runbooks/RUNBOOK_SECRETS.md` — Secrets management
- `infra/runbooks/RUNBOOK_INCIDENT_RESPONSE.md` — Incident response
- `.env.example` — Canonical environment variable list with classifications
- `docs/ops/local-bootstrap.md` — Local development setup
