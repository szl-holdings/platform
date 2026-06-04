# Recovery and Backup Model

Updated: 2026-04-16

## Recovery Objectives

| Metric | Target | Current State |
|--------|--------|--------------|
| Recovery Time Objective (RTO) | 2 hours | Manual restore from dump: ~30–60 min |
| Recovery Point Objective (RPO) | 24 hours | Daily automated backups |
| Backup Verification Frequency | Weekly | Not yet automated |
| Last Tested Recovery | Not yet tested | Required before production go-live |

---

## Backup Schedule

| Type | Schedule | Retention | Storage |
|------|----------|-----------|---------|
| Daily full dump | 02:00 UTC (cron) | 7 days (Mon–Sat) | `backups/` directory |
| Weekly full dump | 02:00 UTC Sunday | 28 days (4 weeks) | `backups/` directory |
| Pre-recovery snapshot | On-demand (before any restore) | Manual deletion | `backups/pre-recovery-*.sql.gz` |
| Replit PostgreSQL backup | Automatic (Replit-managed) | Replit SLA | Replit infrastructure |
| Azure PITR (production target) | Continuous | 35-day window | Azure-managed |

---

## Backup Procedure

### Automated (Script)

```bash
./scripts/backup-db.sh           # Full backup
./scripts/backup-db.sh --dry-run  # Verify without writing
```

Output: `backups/daily_<ISO8601>.sql.gz` or `backups/weekly_<ISO8601>.sql.gz`

Manifest updated at: `backups/backup_manifest.json`

Health endpoint exposes last backup age: `GET /api/healthz`

### Manual (Admin UI)

1. Navigate to **SZL Holdings → Admin → Backup & Recovery**
2. Click **"Run Backup Now"**
3. Download the resulting dump file

---

## Restore Procedure

### Full Database Restore

```bash
# 1. Stop application traffic (take API offline)
# 2. Snapshot current (possibly corrupted) state
pg_dump "$DATABASE_URL" | gzip > backups/pre-recovery-$(date -u +%Y%m%dT%H%M%SZ).sql.gz

# 3. Drop and recreate schema
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 4. Restore from backup
gunzip -c backups/daily_20260415T020000Z.sql.gz | psql "$DATABASE_URL"

# 5. Re-apply any migrations after the backup point
pnpm --filter @workspace/db run migrate

# 6. Verify
curl https://<api-url>/api/healthz
curl https://<api-url>/api/admin/seed/validate

# 7. Restart application
```

### Partial Table Restore

```bash
# Extract specific table from dump (example: vessels table)
gunzip -c backups/daily_<date>.sql.gz \
  | grep -A 99999 "COPY public.vessels " \
  | psql "$DATABASE_URL"
```

### Migration Rollback

Rollback scripts are in `scripts/rollback/`. Apply in reverse order (newest first):

```bash
./scripts/backup-db.sh                                      # Always backup first
psql "$DATABASE_URL" -f scripts/rollback/005_rollback_platform_jobs.sql
pnpm --filter @workspace/db run generate                   # Regenerate types
```

See `scripts/rollback/README.md` for the ordered rollback table.

---

## Azure Production Recovery (Target State)

When running on Azure PostgreSQL Flexible Server:

| Recovery Method | RTO | Steps |
|----------------|-----|-------|
| Point-in-Time Restore | ~15 min | Azure Portal → Server → Restore → Select timestamp → New server |
| Backup dump restore | ~30–60 min | Same as above but from gzip dump |
| Geo-redundant backup (future) | ~60 min | Requires GRS tier; restore to secondary region |

Azure Portal path: **Resource Group → PostgreSQL server → Backup → Point-in-time restore**

---

## Data Retention Policy

| Data Category | Retention | Notes |
|---------------|-----------|-------|
| User accounts | Indefinite (while active) | Deleted on GDPR request |
| Audit events | 2 years | Required for compliance |
| Usage events | 1 year | Billing reconciliation |
| Session data | 30 days | Auto-expired via `expires_at` |
| Webhook events | 90 days | Rotated via scheduled job |
| Daily backups | 7 days | Rotating, auto-overwritten |
| Weekly backups | 28 days | Rotating (4 weeks) |
| Pre-recovery snapshots | Manual deletion | Label clearly with date and reason |

---

## Health Monitoring

The `/api/healthz` endpoint reports backup recency:

```json
{
  "status": "ok",
  "backup": {
    "status": "ok",
    "lastBackupAt": "2026-04-15T02:00:00Z",
    "lastBackupSizeBytes": 2457600,
    "ageHours": 1.5,
    "warning": false
  }
}
```

`warning: true` is returned if no backup has run in the past 24 hours. Set up an alert on this field.

---

## Backup Verification Checklist

Run weekly or before any major deployment:

- [ ] `GET /api/healthz` returns `backup.warning: false`
- [ ] `GET /api/admin/seed/validate` shows expected row counts
- [ ] Download most recent backup and verify gzip integrity: `gunzip -t backups/daily_<latest>.sql.gz`
- [ ] Restore to a scratch database and run `GET /api/admin/seed/validate` against it
- [ ] Confirm all rollback scripts exist for migrations since last verified backup

---

## Emergency Contacts

| Issue | Contact |
|-------|---------|
| Replit platform down | https://replit.com/support |
| Database unreachable | Check `DATABASE_URL` secret → Replit DB console |
| Data corruption suspected | Stop writes immediately → snapshot → begin restore |
| Azure infrastructure | Azure Portal → Support request |
| Internal escalation | admin@szlholdings.com |

---

*Supersedes: `BACKUP_AND_RECOVERY.md`, `docs/disaster-recovery.md` (both remain as reference; this is the canonical ops document)*
