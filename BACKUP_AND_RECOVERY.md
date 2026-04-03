# Backup and Recovery — SZL Holdings Platform

> Backup strategy, recovery procedures, and data retention policy for the SZL Holdings platform.

---

## Scope

This document covers:
- PostgreSQL database backups
- Application configuration backups
- Media and static asset backups
- Recovery time and point objectives

---

## Recovery Objectives

| Metric | Target | Notes |
|--------|--------|-------|
| **RTO** (Recovery Time Objective) | < 2 hours | Time to restore service after failure |
| **RPO** (Recovery Point Objective) | < 24 hours | Maximum data loss acceptable |
| **MTTR** (Mean Time to Restore) | < 1 hour | Target for common failure scenarios |

---

## Database Backup

### Development (Replit)

- **Method:** Replit managed PostgreSQL with platform-level backup
- **Frequency:** Per Replit's platform SLA
- **Retention:** Per Replit's platform policy
- **Manual backup:** `scripts/backup-db.sh` — exports to `docs/` or designated storage

To run a manual backup:
```bash
bash scripts/backup-db.sh
```

### Production (Azure)

- **Method:** Azure Database for PostgreSQL Flexible Server automated backups
- **Frequency:** Daily automated full backup + continuous WAL archiving
- **Retention:** 7 days (configurable up to 35 days in Azure)
- **Geographic redundancy:** Zone-redundant storage enabled
- **Point-in-time restore:** Available to within 5 minutes

To initiate a point-in-time restore (production):
1. Navigate to Azure Portal → PostgreSQL Flexible Server
2. Select "Restore" from the toolbar
3. Choose the restore point
4. Deploy to a new server instance
5. Validate and cutover following [RUNBOOK_ROLLBACK.md](infra/runbooks/RUNBOOK_ROLLBACK.md)

---

## Application Code

- **Method:** Replit automatic checkpoints + GitHub repository mirror
- **Frequency:** Continuous (Replit checkpoints on every agent task)
- **Retention:** Per Replit checkpoint policy; GitHub indefinitely
- **Recovery:** Checkout from git or restore from Replit checkpoint

---

## Configuration and Secrets

- **Method:** Azure Key Vault (production) + Replit Secrets (development)
- **Secret rotation:** Quarterly or immediately after any exposure
- **Documentation:** [ENV_MATRIX.md](ENV_MATRIX.md) defines all variables; values never stored in code

**Important:** If secrets must be recovered, follow [RUNBOOK_SECRETS.md](infra/runbooks/RUNBOOK_SECRETS.md).

---

## Static Assets and Media

- **Method:** Azure CDN / Blob Storage for production media assets
- **Frequency:** Assets are generated artifacts — recreatable from source
- **Recovery:** Regenerate screenshots with `pnpm capture:screens`; rebuild media assets from source

---

## Disaster Recovery Scenarios

### Scenario 1: Database Corruption / Data Loss

1. Declare SEV1 incident — see [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md)
2. Take the application offline to prevent further writes
3. Identify the restore point (last known good state)
4. Initiate point-in-time restore in Azure
5. Validate restored database integrity
6. Update connection strings and restart services
7. Verify application functionality
8. Communicate with affected users

**Estimated recovery time:** 1–2 hours

---

### Scenario 2: Application Server Failure

1. Assess whether the issue is code or infrastructure
2. If code: rollback the deployment — see [RUNBOOK_ROLLBACK.md](infra/runbooks/RUNBOOK_ROLLBACK.md)
3. If infrastructure: use Azure App Service deployment slots to swap
4. Verify health check at `/api/health`
5. Monitor for 30 minutes

**Estimated recovery time:** 15–30 minutes

---

### Scenario 3: Replit Workspace Loss

1. Restore from GitHub repository: `git clone [repository]`
2. Restore Replit Secrets (from secure external record)
3. Run `pnpm install`
4. Restart all workflows
5. Reseed development database: `pnpm seed:demo`

**Estimated recovery time:** 1–2 hours

---

### Scenario 4: Secrets Exposure

See [RUNBOOK_SECRETS.md](infra/runbooks/RUNBOOK_SECRETS.md) immediately.

**Summary:**
1. Rotate all exposed secrets immediately
2. Revoke any active sessions
3. Audit access logs for unauthorized use
4. Update all environments with new secrets
5. File security incident report

---

## Data Retention Policy

| Data Type | Retention Period | Storage Location |
|-----------|-----------------|-----------------|
| Production database | 7 years (financial records) | Azure PostgreSQL + Blob |
| Application logs | 90 days | Azure Monitor / Application Insights |
| Audit trail | Permanent (immutable) | PostgreSQL audit table |
| Session data | 24 hours post-expiry | Redis (TTL-managed) |
| Contact form submissions | 2 years | PostgreSQL |
| Media assets (screenshots) | Indefinite | `docs/media/` + Azure Blob |
| Security incident reports | 5 years | `docs/internal/incidents/` |
| Development database | Not formally retained | Replit managed |

---

## Backup Testing

Backups are only trustworthy if tested. Schedule:

| Test | Frequency | Owner |
|------|-----------|-------|
| Point-in-time restore drill (staging) | Quarterly | Engineering |
| Manual backup script validation | Monthly | Engineering |
| Secret rotation and restore | Semi-annually | Security |
| Full disaster recovery drill | Annually | All hands |

Document test results in `docs/internal/dr-tests/`.

---

## Related Documents

- [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md)
- [RUNBOOK_ROLLBACK.md](infra/runbooks/RUNBOOK_ROLLBACK.md)
- [RUNBOOK_SECRETS.md](infra/runbooks/RUNBOOK_SECRETS.md)
- [RUNBOOK_DEPLOYMENT.md](infra/runbooks/RUNBOOK_DEPLOYMENT.md)
- [docs/LOGGING_AND_RETENTION.md](docs/LOGGING_AND_RETENTION.md)
