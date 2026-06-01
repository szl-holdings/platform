# Runbook: Rollback — SZL Holdings Platform

> Emergency rollback procedures for production deployments. Execute these steps when a deployment must be reversed.

---

## When to Rollback

Rollback immediately if:
- Error rate increased > 2x baseline within 30 minutes of deployment
- Health check at `/api/health` fails after deployment
- Authentication is broken for any users
- A SEV1 or SEV2 incident is declared

**Rollback decision principle:** If in doubt, roll back. It is faster to rollback and investigate than to debug in production under load.

---

## Step 1: Declare Intent

Notify the team immediately via Slack that a rollback is being executed. Update status page if user-facing impact is occurring.

---

## Step 2: Application Rollback

### Option A — Azure Deployment Slot Swap (Preferred, < 5 minutes)

If blue/green deployment was used:

```bash
az webapp deployment slot swap \
  --resource-group $AZURE_RESOURCE_GROUP \
  --name szl-holdings-prod \
  --slot production \
  --target-slot staging
```

This immediately swaps back to the previous state.

### Option B — Deploy Previous Release

If slot swap is not available, deploy the previous build artifact:

```bash
# Identify the last known good commit
git log --oneline -10

# Checkout and build the previous release
git checkout <previous-commit-hash>
pnpm build

# Deploy
az webapp deploy --resource-group $AZURE_RESOURCE_GROUP \
  --name szl-holdings-prod \
  --src-path artifacts/szl-holdings/dist
```

---

## Step 3: Database Rollback (If Needed)

Database rollbacks are riskier than code rollbacks. Only execute if the deployment included schema changes that are causing failures.

**Warning:** Database rollbacks may cause data loss for any records created after the migration ran.

```bash
# Rollback the most recent migration
pnpm --filter artifacts/api-server db:rollback

# Verify state
pnpm --filter artifacts/api-server db:status
```

If point-in-time restore is needed (data loss scenario):
1. Follow [BACKUP_AND_RECOVERY.md](../../BACKUP_AND_RECOVERY.md) — Scenario 1
2. This will require taking the application offline

---

## Step 4: Verify Rollback

```bash
# Health check
curl -f https://szlholdings.com/api/health

# Smoke tests
BASE_URL=https://szlholdings.com pnpm qa:routes
```

Manual verification:
- [ ] Landing page loads correctly
- [ ] Auth works
- [ ] No console errors on critical pages

---

## Step 5: Communicate

1. Update status page: "We've identified and resolved an issue with a recent deployment. Services are restored."
2. Notify internal team that rollback is complete
3. Note the rollback in CHANGELOG.md with a brief description

---

## Step 6: Post-Mortem

1. Document what went wrong
2. What change caused the issue
3. Why it wasn't caught in staging/testing
4. Action items to prevent recurrence

File in `docs/internal/incidents/YYYY-MM-DD-rollback.md`. See [INCIDENT_RESPONSE.md](../../INCIDENT_RESPONSE.md) for template.

---

## Rollback Decision Tree

```
New deployment went out
        │
        ▼
Error rate spike or health check failure?
  Yes → Rollback immediately (Steps 1–4)
  No  → Continue monitoring for 30 min

Users reporting auth/data issues?
  Yes → Assess: is it code or data?
    Code → Code rollback (Option A or B)
    Data → Database point-in-time restore (BACKUP_AND_RECOVERY.md)

Monitoring clean after 30 min?
  Yes → Deployment successful, document
  No  → Rollback and investigate
```

---

## Rollback Time Targets

| Rollback Type | Target Time |
|--------------|-------------|
| Slot swap (blue/green) | < 5 minutes |
| Deploy previous artifact | < 20 minutes |
| Database migration rollback | < 30 minutes |
| Point-in-time database restore | 1–2 hours |
