# Runbook: Manual Database Restore

**Version:** 1.0 · **Last updated:** 2026-04-23  
**Audience:** On-call engineers, DBAs  
**Severity applicability:** SEV1 (full loss) · SEV2 (corruption) · Drill exercises

---

## Overview

This runbook documents how to perform a manual database restore from backup. It covers:

1. Identifying and locating the most recent backup
2. Verifying backup integrity before restore
3. Restoring to a scratch / target database
4. Running smoke verification checks
5. Cutting traffic to the restored database (for full-loss scenarios)
6. Post-restore checklist

For automated weekly drill results, see: `GET /api/admin/backup/drill/status`  
For the backup-restore architecture, see: `docs/operations/backup-restore.md`  
For incident escalation, see: `docs/operations/incident-response.md`

---

## Prerequisites

| Item | Required |
|------|---------|
| `DATABASE_URL` | Connection string for the primary (source) database |
| `SCRATCH_DATABASE_URL` | Connection string for the scratch / restore target (separate database) |
| `BACKUP_DIR` | Local path where backup `.sql.gz` files are stored (default: `./backups/`) |
| `pg_dump` / `psql` / `gunzip` | PostgreSQL client tools installed on the restore machine |
| `AZURE_STORAGE_CONNECTION_STRING` (optional) | Required only if restoring from remote object storage |

---

## Step 1 — Identify the most recent backup

### From local disk

```bash
ls -lht $BACKUP_DIR/*.sql.gz | head -5
```

Look for the most recent file by timestamp. Backup filenames follow the pattern:
- `daily_YYYYMMDDTHHMMSSZ.sql.gz`
- `weekly_YYYYMMDDTHHMMSSZ.sql.gz`

### From the backup API

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://$HOST/api/admin/backup/status
```

The response includes `backups[]` sorted newest-first with `filename`, `sizeBytes`, and `createdAt`.

### From remote object storage (Azure Blob)

```bash
az storage blob list \
  --connection-string "$AZURE_STORAGE_CONNECTION_STRING" \
  --container-name "$AZURE_STORAGE_CONTAINER" \
  --prefix "${AZURE_STORAGE_PREFIX:-prod/}" \
  --output table \
  | sort -k4 -r | head -5
```

Download the latest:

```bash
LATEST_BLOB=$(az storage blob list \
  --connection-string "$AZURE_STORAGE_CONNECTION_STRING" \
  --container-name "$AZURE_STORAGE_CONTAINER" \
  --prefix "${AZURE_STORAGE_PREFIX:-prod/}" \
  --query "[].name" -o tsv | sort -r | head -1)

az storage blob download \
  --connection-string "$AZURE_STORAGE_CONNECTION_STRING" \
  --container-name "$AZURE_STORAGE_CONTAINER" \
  --name "$LATEST_BLOB" \
  --file "./restore_target.sql.gz"

BACKUP_FILE="./restore_target.sql.gz"
```

---

## Step 2 — Verify backup integrity

**Always verify before restoring.** A corrupted backup detected early saves time.

```bash
gunzip -t "$BACKUP_FILE" && echo "✓ Gzip integrity OK" || echo "✗ CORRUPT — do not restore this file"
```

If the integrity check fails:
1. Try the next-most-recent backup file.
2. Page the on-call DBA — a corrupted backup is a SEV2 event in itself.
3. Check remote object storage for an alternative copy (see Step 1 above).

---

## Step 3 — Provision a clean scratch database

**Do NOT restore into the production database.** Always restore into a separate scratch database first.

On Replit-managed PostgreSQL, provisioning a second database requires platform support. For production incidents:
- Use an Azure PostgreSQL Flexible Server instance designated for DR drills.
- Connection string is stored in `SCRATCH_DATABASE_URL` (set in Azure Key Vault for production).

```bash
SCRATCH_DB="dr_scratch_$(date +%s)"

# Create the scratch database (requires superuser on the PostgreSQL server)
psql "$DATABASE_URL" -c "CREATE DATABASE $SCRATCH_DB;"

# Prepare the schema
SCRATCH_URL="${DATABASE_URL%/*}/$SCRATCH_DB"

psql "$SCRATCH_URL" -c "
  DROP SCHEMA IF EXISTS public CASCADE;
  CREATE SCHEMA public;
  CREATE EXTENSION IF NOT EXISTS vector;
"
```

> **Note (from 2026-04-20 DR drill):** Current `pg_dump` output uses fully-qualified `public.<table>` identifiers. Restore into a database with a `public` schema — not a side schema — to avoid search_path mapping issues.

---

## Step 4 — Restore the backup

```bash
SCRATCH_URL="${DATABASE_URL%/*}/$SCRATCH_DB"

gunzip -c "$BACKUP_FILE" | psql \
  --set ON_ERROR_STOP=on \
  "$SCRATCH_URL" \
  2>&1 | tee /tmp/restore_$(date +%s).log

echo "Exit code: $?"
```

Expected output: a stream of `CREATE TABLE`, `INSERT`, `ALTER TABLE` statements. The restore is complete when `psql` exits with code 0.

**If `ON_ERROR_STOP` triggers:** Check `/tmp/restore_*.log` for the failing statement. Common causes:
- Missing extension (`vector`) — install it first (Step 3)
- Permission errors — ensure the restore user owns the target schema
- Encoding mismatch — use `--encoding=UTF8` if needed

---

## Step 5 — Run smoke verification queries

After restore, validate that critical tables are present and contain data:

```bash
SCRATCH_URL="${DATABASE_URL%/*}/$SCRATCH_DB"

psql "$SCRATCH_URL" -c "
SELECT
  'users'         AS tbl, COUNT(*) AS rows FROM users UNION ALL
  SELECT 'organizations',  COUNT(*) FROM organizations UNION ALL
  SELECT 'audit_events',   COUNT(*) FROM audit_events UNION ALL
  SELECT 'feature_flags',  COUNT(*) FROM feature_flags UNION ALL
  SELECT 'vessels',        COUNT(*) FROM vessels UNION ALL
  SELECT 'lyte_signals',   COUNT(*) FROM lyte_signals;
"
```

Compare row counts against the source database:

```bash
psql "$DATABASE_URL" -c "
SELECT
  'users'         AS tbl, COUNT(*) AS rows FROM users UNION ALL
  SELECT 'organizations',  COUNT(*) FROM organizations UNION ALL
  SELECT 'audit_events',   COUNT(*) FROM audit_events UNION ALL
  SELECT 'feature_flags',  COUNT(*) FROM feature_flags UNION ALL
  SELECT 'vessels',        COUNT(*) FROM vessels UNION ALL
  SELECT 'lyte_signals',   COUNT(*) FROM lyte_signals;
"
```

**Acceptable drift:** RPO ≤ 24h means row counts may differ by up to one day's writes. Zero drift should be observed for a drill against an up-to-date backup.

---

## Step 6 — Cut traffic to the restored database (full-loss scenario only)

If the production database is gone and you are promoting the scratch to production:

```bash
# 1. Update DATABASE_URL in Replit Secrets / Azure Key Vault to point at the restored DB.
# 2. Restart all API server instances:
#    pnpm --filter api-server run build && <restart command>
# 3. Verify health endpoint:
curl https://$HOST/api/healthz

# 4. Notify the on-call team and open the customer-facing incident update.
```

If this is a partial restore (single-tenant data recovery), do NOT update `DATABASE_URL`. Instead:
- Extract the specific rows from the scratch database.
- Apply them via a reconciliation transaction against the live database.
- Document the reconciliation in the incident record.

---

## Step 7 — Cleanup

```bash
# Drop the scratch database when no longer needed
psql "$DATABASE_URL" -c "DROP DATABASE IF EXISTS $SCRATCH_DB;"

# Remove the local dump if downloaded from remote
rm -f "$BACKUP_FILE"
```

---

## Step 8 — Post-restore checklist

- [ ] Smoke queries pass (Step 5)
- [ ] Row count drift within RPO window
- [ ] Audit trail continuous (`SELECT MAX(created_at) FROM audit_events`)
- [ ] Application health check green (`GET /api/healthz`)
- [ ] Incident record updated with restore timestamp and outcome
- [ ] Post-mortem scheduled (within 7 days for SEV1)
- [ ] Drill record written: `POST /api/admin/backup/drill/run` (or automatic weekly drill)

---

## Automated Weekly Drill

The platform runs an automated drill every **Sunday at 03:00 UTC**. The drill:
1. Locates the most recent local backup file.
2. Verifies gzip integrity (`gunzip -t`).
3. Creates an ephemeral scratch database (`CREATE DATABASE dr_drill_<ts>`).
4. Restores the full backup dump into the scratch database using `gunzip -c | psql`.
5. Runs domain-specific smoke checks (COUNT + sample SELECT per domain table) against the **restored** data.
6. Drops the scratch database (`DROP DATABASE dr_drill_<ts>`).
7. Persists the result in `platform_job_runs` (type: `backup_restore_drill`).
8. Writes an audit log entry.
9. Sends a failure alert email to `SZL_INTERNAL_EMAIL` if the drill fails.

The drill fails immediately if:
- No backup file is found, or gzip integrity check fails.
- The restore process (`psql`) exits non-zero.
- Any domain smoke check table is missing or unqueryable in the restored database.

**Admin status page:** `GET /api/admin/backup/drill/status` (requires `admin` role)  
**Manual trigger:** `POST /api/admin/backup/drill/run` (requires `admin` role)

---

## Escalation

| Scenario | Action |
|----------|--------|
| Backup file not found | Check `backup_manifest.json` in `$BACKUP_DIR`; check remote Azure Blob; page on-call |
| Gzip integrity failure | Try next backup; escalate to SEV2; check backup pipeline |
| psql restore errors | Check restore log; check PostgreSQL version compatibility; escalate to DBA |
| Row count drift > RPO | Data loss event; escalate to SEV1; notify customers per `incident-response.md` |
| Drill alert email received | Investigate immediately; manual restore drill within 24h |

---

## Related Documents

| Document | Path |
|----------|------|
| Backup architecture & procedures | `docs/operations/backup-restore.md` |
| DR drill record (2026-04-20) | `docs/operations/dr-drill-2026-04-20.md` |
| Incident response | `docs/operations/incident-response.md` |
| Data retention | `docs/security/data-retention.md` |
| Backup CI workflow | `.github/workflows/backup.yml` |
| Restore script | `scripts/backup-restore.sh` |
