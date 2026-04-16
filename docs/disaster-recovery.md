# Disaster Recovery & Backup Strategy

> **DEPRECATED** — This document has been superseded by [`ops/infra/recovery-and-backup-model.md`](../ops/infra/recovery-and-backup-model.md).
> This file is retained for historical reference only. Do not update it.

## Overview

This document describes the backup strategy, data retention policy, and disaster
recovery procedures for the SZL Holdings platform. It covers all tenant data,
PostgreSQL database backups, and step-by-step recovery playbooks.

---

## 1. Backup Strategy

### Automated Daily Backups

The backup script (`scripts/backup-db.sh`) exports the full PostgreSQL schema
(`public`) to a compressed SQL dump. It runs automatically (cron or CI schedule)
and stores files in the `backups/` directory.

**Retention:**
- **Daily backups** — 7 most recent daily dumps (Mon–Sat)
- **Weekly backups** — 4 most recent weekly dumps (taken every Sunday)

**File naming:** `daily_20260401T020000Z.sql.gz` / `weekly_20260330T020000Z.sql.gz`

**Backup manifest:** A `backups/backup_manifest.json` file is updated after each
run and is consumed by the health check endpoint at `GET /api/healthz`.

### Manual Backup

To trigger a backup manually:
```bash
./scripts/backup-db.sh
```

To test without writing:
```bash
./scripts/backup-db.sh --dry-run
```

From the Admin UI: navigate to **SZL Holdings → Admin → Backup & Recovery**
and click **"Run Backup Now"**.

---

## 2. Point-in-Time Recovery

### Full Restore from Backup Dump

1. **Stop all application traffic** (take the API server offline to prevent
   writes during restore).

2. **Create a backup of the current (corrupted) state** if possible:
   ```bash
   pg_dump "$DATABASE_URL" | gzip > backups/pre-recovery-snapshot.sql.gz
   ```

3. **Drop and recreate the public schema:**
   ```bash
   psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
   ```

4. **Restore from the chosen backup dump:**
   ```bash
   gunzip -c backups/daily_20260401T020000Z.sql.gz | psql "$DATABASE_URL"
   ```

5. **Re-apply any migrations that ran after the backup:**
   ```bash
   pnpm --filter @workspace/db run migrate
   ```

6. **Verify row counts** using the admin seed validation endpoint:
   ```
   GET /api/admin/seed/validate
   ```

7. **Restart the application** and confirm health checks pass:
   ```
   GET /api/healthz
   ```

### Partial Table Restore

If only one or a few tables were corrupted:

```bash
# Extract only specific tables from a dump
gunzip -c backups/daily_20260401T020000Z.sql.gz \
  | grep -A 9999 "COPY vessels " \
  | psql "$DATABASE_URL"
```

---

## 3. Migration Rollback Procedure

Rollback scripts are in `scripts/rollback/` and should be applied in reverse
order (newest migration first). Always backup before rolling back.

```bash
# 1. Create a backup
./scripts/backup-db.sh

# 2. Apply the rollback script
psql "$DATABASE_URL" -f scripts/rollback/005_rollback_platform_jobs.sql

# 3. Update Drizzle schema to match and regenerate types
pnpm --filter @workspace/db run generate

# 4. Restart the API server
```

See `scripts/rollback/README.md` for the full ordered rollback table.

---

## 4. Data Export (GDPR / Tenant Self-Service)

Tenants can request a full export of their data via:

```
POST /api/admin/backup/export-tenant
```

The export is a ZIP archive containing JSON files for each data domain. Admins
can also trigger exports from the **Backup & Recovery** panel in the Admin UI.

---

## 5. Data Retention Policy

| Data Category | Retention Period | Notes |
|---|---|---|
| User accounts | Indefinite (while active) | Deleted on request per GDPR |
| Audit events | 2 years | Required for compliance |
| Usage events | 1 year | Billing reconciliation |
| Session data | 30 days | Auto-expired by `expires_at` |
| Webhook events | 90 days | Rotated via scheduled job |
| Connector logs | 90 days | Diagnostic use |
| Daily backups | 7 days | Rotating, overwritten |
| Weekly backups | 28 days | Rotating (4 weeks) |
| Pre-recovery snapshots | Until manually deleted | Always label with date |

### GDPR Right to Erasure

To remove all data for a specific user:

1. Locate the user by email in `/api/admin/users`
2. Use the data export endpoint to capture their data (for your records)
3. Delete records from all tables where `user_id` = their ID
4. Remove from `users`, `user_roles`, `sessions`, `api_keys`, `audit_events`
5. Document the deletion in your internal compliance log

---

## 6. Health Monitoring

The `/api/healthz` endpoint reports backup recency:

```json
{
  "status": "ok",
  "backup": {
    "status": "ok",
    "lastBackupAt": "2026-04-01T02:00:00Z",
    "lastBackupSizeBytes": 2457600,
    "ageHours": 1.5,
    "warning": false
  }
}
```

A `warning: true` is returned if no backup has been taken in the last 24 hours.

---

## 7. Emergency Contacts & Escalation

1. **Replit Platform issues** → [Replit Support](https://replit.com/support)
2. **Database unreachable** → Check `DATABASE_URL` secret, verify Replit DB provisioning
3. **Data corruption suspected** → Immediately stop writes, snapshot current state, begin recovery
4. **Contact SZL DevOps** → via admin@szlholdings.com

---

## 8. Backup Verification Checklist

Run this checklist after every restore:

- [ ] `GET /api/healthz` returns `status: "ok"` with recent backup timestamp
- [ ] `GET /api/admin/seed/validate` shows expected row counts
- [ ] `GET /api/admin/overview` shows healthy database status
- [ ] Key tables are queryable: `users`, `organizations`, `audit_events`
- [ ] Application logins succeed
- [ ] No error spikes in application logs
