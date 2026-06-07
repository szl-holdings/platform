# Runbook: Deployment — SZL Holdings Platform

> ⚠️ **STALE — AZURE PATH ARCHIVED**  
> This runbook describes the deprecated Azure Container Apps deployment path.  
> **Deployment doctrine changed 2026-04-16: Replit is the sole primary deployment target.**  
> See `docs/ops/deploy-runbook.md` for the current canonical runbook.  
> This file is retained for reference only (Azure enterprise integration context).

> Step-by-step deployment procedure for standard production releases.

---

## Pre-Deployment Requirements

- [ ] [RELEASE_CHECKLIST.md](../../RELEASE_CHECKLIST.md) completed
- [ ] All tests passing (`pnpm test`)
- [ ] Database migrations validated in staging
- [ ] Production secrets confirmed in Azure Key Vault
- [ ] Rollback plan ready

---

## Deployment Sequence

Production deployments must follow this sequence to prevent dependency failures:

1. **Database migrations** (zero-downtime migrations only)
2. **API server** (backend must be ready before frontend deploys)
3. **Web artifacts** (deploy in parallel if independent)
4. **Mobile apps** (submit to Expo EAS after web is stable)

---

## Step 1: Database Migration

```bash
# From the API server artifact directory
pnpm --filter artifacts/api-server db:migrate
```

Verify the migration applied:
```bash
pnpm --filter artifacts/api-server db:status
```

**If migration fails:** Do NOT proceed. See [RUNBOOK_ROLLBACK.md](RUNBOOK_ROLLBACK.md).

---

## Step 2: Deploy API Server (Azure)

```bash
# Navigate to infra directory
cd infra

# Deploy API server module
az deployment group create \
  --resource-group $AZURE_RESOURCE_GROUP \
  --template-file modules/api-server.bicep \
  --parameters parameters.json

# Verify health check
curl -f https://api.szlholdings.com/api/health
```

**Expected response:**
```json
{ "status": "ok", "version": "x.y.z", "timestamp": "..." }
```

If health check fails, do NOT proceed to web artifact deployment.

---

## Step 3: Deploy Web Artifacts (Azure App Service)

```bash
# Build all web artifacts
pnpm build

# Deploy SZL Holdings main site
az webapp deploy --resource-group $AZURE_RESOURCE_GROUP \
  --name szl-holdings-prod \
  --src-path artifacts/szl-holdings/dist

# Deploy other artifacts as needed
az webapp deploy --resource-group $AZURE_RESOURCE_GROUP \
  --name lyte-command-center-prod \
  --src-path artifacts/lyte-command-center/dist
```

Verify each artifact after deployment:
```bash
# Check each deployed URL
curl -f https://szlholdings.com
curl -f https://szlholdings.com/lyte-command-center/
```

---

## Step 4: Smoke Test

After all artifacts deployed:

```bash
# Run automated smoke tests against production
BASE_URL=https://szlholdings.com pnpm qa:routes
```

Manual checks:
- [ ] Landing page loads without errors
- [ ] Auth flow works (login, session)
- [ ] Contact form submits successfully
- [ ] `/api/health` returns 200

---

## Step 5: Monitor

Watch for 30 minutes post-deployment:
- Azure Application Insights for error rate spike
- Azure App Service metrics for response time
- Status page health (if configured)

If error rate increases > 2x baseline → execute rollback.

---

## Step 6: Communicate

1. Update CHANGELOG.md with release entry (if not already done)
2. Notify internal stakeholders
3. Update status page if any disruption occurred during deploy

---

## Blue/Green Deployment (Preferred for SEV-sensitive changes)

Azure App Service deployment slots enable zero-downtime deployments:

```bash
# Deploy to staging slot
az webapp deployment slot swap \
  --resource-group $AZURE_RESOURCE_GROUP \
  --name szl-holdings-prod \
  --slot staging \
  --target-slot production
```

1. Deploy to `staging` slot
2. Verify on staging URL
3. Swap slots (zero-downtime cutover)
4. Monitor production slot
5. If issues: swap back immediately

---

## Rollback

If deployment fails at any step: see [RUNBOOK_ROLLBACK.md](RUNBOOK_ROLLBACK.md).
