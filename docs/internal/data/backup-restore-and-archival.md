# Backup, Restore & Tenant Archival Policy

**Date:** 2026-04-02  
**Author:** Engineering  
**Status:** Active  
**Related:** `scripts/backup-db.sh`, `docs/disaster-recovery.md`

---

## Backup Policy

### Schedule

| Backup Type | Frequency | Retention |
|---|---|---|
| Daily | Every day (automated) | 7 most recent |
| Weekly | Every Sunday (automated) | 4 most recent |
| Pre-migration | Before any schema migration | Keep until next migration |
| Pre-deployment | Before significant deployments | Keep 30 days |

### Backup Location

Backups are stored in the `./backups/` directory (local) or mounted object storage in production. The backup manifest at `./backups/backup_manifest.json` is updated after every successful backup and is checked by the `/api/backup/status` health endpoint.

### Running a Backup

```bash
# Standard backup
./scripts/backup-db.sh

# Dry run (tests connectivity without writing)
./scripts/backup-db.sh --dry-run

# Custom backup directory
BACKUP_DIR=/var/backups/szl ./scripts/backup-db.sh

# Required env
export DATABASE_URL="postgresql://..."
```

### What is backed up

- Full schema: all tables in the `public` schema
- All data including organization records, users, audit logs, signals, workflows
- Format: gzip-compressed plain SQL (`pg_dump --format=plain`)
- Owner/ACL info excluded (`--no-owner --no-acl`) for portability

---

## Restore Procedure

### Full Database Restore

```bash
# 1. Stop the API server to prevent writes during restore

# 2. Drop and recreate the target database
psql "$DATABASE_URL_ADMIN" -c "DROP DATABASE szl_platform;"
psql "$DATABASE_URL_ADMIN" -c "CREATE DATABASE szl_platform;"

# 3. Restore from backup
gunzip -c ./backups/daily_20260402T120000Z.sql.gz | psql "$DATABASE_URL"

# 4. Verify restore
psql "$DATABASE_URL" -c "\dt public.*" | wc -l
psql "$DATABASE_URL" -c "SELECT count(*) FROM users;"

# 5. Restart API server
```

### Point-in-Time Restore

For production environments using PostgreSQL with WAL archiving:
```bash
# Set recovery_target_time in postgresql.conf
recovery_target_time = '2026-04-02 14:30:00 UTC'

# Restore base backup, then let WAL replay to target time
# See docs/disaster-recovery.md for full PITR procedure
```

### Single-Table Restore

```bash
# Extract a single table from a backup dump
gunzip -c ./backups/daily_20260402T120000Z.sql.gz \
  | grep -A 1000 "COPY public.audit_events " \
  | head -n $(grep -n "^\\\." <(gunzip -c ./backups/daily_20260402T120000Z.sql.gz) | head -1 | cut -d: -f1) \
  | psql "$DATABASE_URL"
```

---

## Tenant Deletion Policy

### Definition

Tenant deletion is the permanent removal of all data belonging to a specific organization from the platform. This is an irreversible operation.

### When triggered

- Customer formally requests account deletion (GDPR/CCPA right to erasure).
- Contract termination with data deletion clause.
- Internal cleanup of test or demo tenants.

### Pre-deletion checklist

1. Confirm written authorization from the account owner.
2. Create a full database backup labeled `pre-deletion-org-<slug>`.
3. Export a final audit log package for the org and deliver to the customer (if requested).
4. Notify the customer that deletion is permanent and irreversible.
5. Verify no active subscriptions or billing obligations remain.

### Deletion procedure

```bash
# 1. Take backup first
./scripts/backup-db.sh

# 2. Identify the org ID
psql "$DATABASE_URL" -c "SELECT id, slug, name FROM organizations WHERE slug = 'target-org';"

# 3. Delete the organization — cascades to all related data
# WARNING: This is irreversible
psql "$DATABASE_URL" -c "DELETE FROM organizations WHERE slug = 'target-org';"

# 4. Verify cascade deletion
psql "$DATABASE_URL" -c "SELECT count(*) FROM org_members WHERE org_id = <id>;"
psql "$DATABASE_URL" -c "SELECT count(*) FROM files WHERE org_id = <id>;"
psql "$DATABASE_URL" -c "SELECT count(*) FROM azure_tenants WHERE organization_id = <id>;"

# 5. Record the deletion in the audit log
psql "$DATABASE_URL" -c "
  INSERT INTO audit_events (action, entity_type, entity_id, new_values, created_at)
  VALUES ('delete', 'organization', 'target-org', '{\"deleted_by\": \"admin\", \"reason\": \"customer_request\"}', NOW());
"

# 6. Revoke any SCIM tokens for the org's Azure tenant
psql "$DATABASE_URL" -c "
  UPDATE scim_tokens SET is_active = false
  WHERE tenant_id IN (
    SELECT id FROM azure_tenants WHERE organization_id IS NULL
    -- (already null after cascade)
  );
"
```

### Cascade Coverage

The following tables cascade-delete when an organization is deleted:
- `org_members` (cascade on org_id)
- `files` (cascade on org_id)
- `connectors` (cascade on org_id)
- `subscriptions` (cascade on org_id)
- `alloy_workflows`, `alloy_signals`, `alloy_workflow_runs` (cascade on org_id)
- `szl_*` canonical tables (cascade on org_id)

Tables that reference organizations with `SET NULL`:
- `audit_events.user_id` → user records retained for audit integrity
- `azure_tenants.organization_id` → Azure tenant record retained with null org ref

---

## Tenant Archival Policy

Archival is an alternative to deletion — the tenant's data is preserved but access is suspended.

### When used

- Expired trial with potential re-engagement.
- Suspended account pending payment resolution.
- End-of-contract with data retention obligation.

### Archival procedure

```bash
# 1. Suspend the organization
psql "$DATABASE_URL" -c "
  UPDATE organizations SET status = 'suspended', is_active = false, updated_at = NOW()
  WHERE slug = 'target-org';
"

# 2. Deactivate all user sessions for org members
psql "$DATABASE_URL" -c "
  DELETE FROM sessions WHERE user_id IN (
    SELECT user_id FROM org_members WHERE org_id = (
      SELECT id FROM organizations WHERE slug = 'target-org'
    )
  );
"

# 3. Suspend Azure tenant
psql "$DATABASE_URL" -c "
  UPDATE azure_tenants SET status = 'suspended', updated_at = NOW()
  WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'target-org');
"

# 4. Revoke SCIM tokens
psql "$DATABASE_URL" -c "
  UPDATE scim_tokens SET is_active = false, updated_at = NOW()
  WHERE tenant_id IN (
    SELECT id FROM azure_tenants WHERE organization_id = (
      SELECT id FROM organizations WHERE slug = 'target-org'
    )
  );
"

# 5. Record in audit log
psql "$DATABASE_URL" -c "
  INSERT INTO audit_events (action, entity_type, entity_id, new_values, created_at)
  VALUES ('archive', 'organization', 'target-org', '{\"reason\": \"contract_end\", \"archived_by\": \"admin\"}', NOW());
"
```

### Effect of archival

- All API requests for suspended org users return `403 Organization suspended`.
- Org data is preserved in the database — no records deleted.
- Data export can be triggered for the customer at any time during the archival period.
- Re-activation is possible by setting `status = 'active'` and `is_active = true`.

### Archival retention

Archived tenants are retained for 90 days after contract end date. After 90 days, the tenant is eligible for permanent deletion per the deletion procedure above. Customer is notified at 30 days, 7 days, and 1 day before permanent deletion.

---

## Disaster Recovery Objectives

| Metric | Target |
|---|---|
| Recovery Time Objective (RTO) | 4 hours |
| Recovery Point Objective (RPO) | 24 hours (daily backup) |
| With WAL archiving | < 5 minutes RPO |

See `docs/disaster-recovery.md` for the full disaster recovery runbook.
