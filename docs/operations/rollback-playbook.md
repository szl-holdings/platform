# Rollback Playbook — SZL Holdings Platform

**Version:** 1.0 | **Date:** April 2026 | **Audience:** On-call engineers, release owners, operators

**Related:** [RELEASE_INTELLIGENCE.md](release-intelligence.md) · [OPERATIONS-RUNBOOK.md](operations-runbook.md) · [DEPLOYMENT-GUIDE.md](deployment-guide.md) · [ENVIRONMENT_VALIDATION.md](environment-validation.md)

---

## Rollback Decision Rule

> **If a deployment happened in the last 2 hours and caused the issue — rollback first, investigate second.**

Do not attempt to hotfix forward when:
- The issue is a SEV1 or SEV2 affecting multiple tenants
- Data integrity is at risk
- A fix would take more than 1 hour to develop and test
- The root cause is unclear

---

## Rollback Criteria (When to Trigger)

Trigger a rollback when ANY of the following are true post-deployment:

| Signal | Threshold | Action |
|--------|-----------|--------|
| `/api/health` status | Returns non-200 for > 2 minutes | **Immediate rollback** |
| Error rate | > 2% in any 5-minute window | Rollback |
| P95 latency | > 5 seconds sustained for > 5 minutes | Rollback |
| Authentication failures | > 10% of login attempts | Rollback |
| Data corruption detected | Any confirmed corruption | **Immediate rollback + SEV1** |
| Complete feature outage | Core workflow unusable for any tenant | Rollback |
| SEV1 incident | Any confirmed SEV1 | **Immediate rollback** |

---

## Rollback Procedures

### 1. Replit Environment Rollback

Use the Replit checkpoint system for the development/staging environment.

**Steps:**
1. Open Replit checkpoint history in the workspace
2. Identify the last known good checkpoint (before the failing deployment)
3. Select "Restore" on that checkpoint
4. After restoration, restart all affected workflows via the Replit workflow panel
5. Verify health:
   ```bash
   curl -f $REPLIT_DEV_DOMAIN/api/health
   ```
6. Run smoke tests:
   ```bash
   node scripts/qa/smoke-routes.js
   ```
7. Confirm `/api/health` returns `{"status":"healthy"}`
8. Monitor for 30 minutes

**Target time:** < 10 minutes from decision to restored state

---

### 2. Azure Production Rollback — Deployment Slot Swap

Azure deployment slots enable near-zero-downtime blue/green rollback.

**Pre-requisite:** Active deployment slot ("staging" slot) must contain the previous known good version.

**Steps:**

```bash
# Step 1: Verify the staging slot contains the good version
az webapp show \
  --resource-group szl-production \
  --name szl-api \
  --slot staging \
  --query state

# Step 2: Swap slots (staging → production)
az webapp deployment slot swap \
  --resource-group szl-production \
  --name szl-api \
  --slot staging \
  --target-slot production

# Step 3: Verify production health after swap
curl -f https://api.szlholdings.com/api/health

# Step 4: Scale up if needed (in case traffic spiked during incident)
az webapp scale \
  --resource-group szl-production \
  --name szl-api \
  --instance-count 3
```

**Target time:** < 5 minutes from decision to slot swap complete

---

### 3. Azure Production Rollback — Code Redeploy

Use when no valid deployment slot is available.

**Steps:**

```bash
# Step 1: Identify the last known good release tag
git log --tags --simplify-by-decoration --pretty="format:%d %H" | head -20

# Step 2: Check out the last known good tag
git checkout tags/v{LAST_GOOD_VERSION}

# Step 3: Build
pnpm --filter @workspace/api-server build

# Step 4: Deploy
az webapp deploy \
  --resource-group szl-production \
  --name szl-api \
  --src-path artifacts/api-server/dist.zip

# Step 5: Run database rollback if applicable (see below)
# Step 6: Verify health
curl -f https://api.szlholdings.com/api/health
```

**Target time:** < 20 minutes from decision to redeployment

---

### 4. Database Rollback

**WARNING:** Database rollbacks are destructive. Only execute with explicit approval and after a backup is confirmed.

**When needed:** Migration introduced breaking schema changes that cannot be forward-fixed quickly.

**Pre-requisites:**
- Production database backup taken within last 24 hours (or immediately before migration)
- Migration rollback script prepared and tested in staging

**Steps:**

```bash
# Step 1: Confirm backup exists and is recent
# (check Azure PostgreSQL automated backup console)

# Step 2: Take an emergency snapshot before rollback
pg_dump $PROD_DATABASE_URL > /tmp/emergency_snapshot_$(date +%Y%m%d_%H%M).sql

# Step 3: Apply rollback migration
DATABASE_URL="$PROD_DATABASE_URL" psql -f infra/migrations/rollback/v{VERSION}_rollback.sql

# Step 4: Verify schema is in expected state
DATABASE_URL="$PROD_DATABASE_URL" pnpm --filter artifacts/api-server db:status

# Step 5: Restart API server
az webapp restart \
  --resource-group szl-production \
  --name szl-api

# Step 6: Verify health
curl -f https://api.szlholdings.com/api/health/detailed
```

**Target time:** < 30 minutes (requires on-call DBA or senior engineer approval)

---

### 5. Feature Flag Kill Switch

For features behind feature flags, the fastest rollback is a kill switch toggle — no deployment required.

**Steps:**
1. Set the feature flag to `false` (disabled) in the flag service admin UI or API
2. Verify the change propagates within 60 seconds (test in a browser)
3. Confirm the affected feature is no longer accessible
4. Notify affected tenants if the outage was visible
5. File a SEV incident if kill switch was triggered by a production issue

**Target time:** < 2 minutes from decision

---

## Feature Flag Kill Switch Reference

| Feature | Flag Key | Kill Switch | Emergency Contact |
|---------|----------|------------|-------------------|
| AI recommendations | `ai-recommendations-enabled` | Set to `false` | Engineering lead |
| Governed workflows | `governed-workflows-enabled` | Set to `false` | Engineering lead |
| Decision Fabric | `decision-fabric-enabled` | Set to `false` | Engineering lead |
| ATLAS Spatial Runtime | `ENABLE_ATLAS_SPATIAL_RUNTIME` | Set to `false` | Engineering lead |
| MCP Gateway | `mcp-gateway-enabled` | Set to `false` | Engineering lead |

---

## Post-Rollback Actions

Complete within 1 hour of rollback:

1. **Confirm system stability** — 30-minute clean monitoring window post-rollback
2. **Notify stakeholders** — Inform affected tenants, internal team, and leadership via established channels
3. **File SEV incident** — Open incident in [INCIDENT_RESPONSE.md](incident-response.md)
4. **Preserve logs** — Do not delete or overwrite any logs from the failed deployment period
5. **Root cause analysis** — Begin investigation immediately; target RCA within 24 hours
6. **Rollback report** — Document what failed, what was rolled back, and timeline

---

## Rollback Sign-Off

| Step | Action | Owner | Time |
|------|--------|-------|------|
| Decision | Rollback authorized | Engineering Lead | |
| Execution | Rollback completed | On-call engineer | |
| Verification | Health confirmed | On-call engineer | |
| Communication | Stakeholders notified | Release owner | |
| Incident filed | SEV filed | On-call engineer | |

---

## Rollback Testing

Every major release must include a rollback test in staging before production deployment:

1. Deploy release to staging
2. Execute the applicable rollback procedure (checkpoint or slot swap)
3. Verify system returns to previous state
4. Document results in the release notes

**Acceptance criteria:** Rollback to previous stable state completed in < 15 minutes.

---

*Last updated: 2026-04-16*
