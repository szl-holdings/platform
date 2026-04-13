# Migration Rollback Scripts

This directory contains rollback scripts for the 5 most recent schema migrations.
Each script precisely reverts a specific migration in reverse order.

## Rollback Procedure

1. **Identify the migration to roll back** — check `lib/db/drizzle/` to find the
   original migration file and confirm what was added.

2. **Create a database backup first** — always run a backup before rolling back:
   ```bash
   ./scripts/backup-db.sh
   ```

3. **Run the rollback script** — connect to the database and run the appropriate file:
   ```bash
   psql "$DATABASE_URL" -f scripts/rollback/<migration_file>.sql
   ```

4. **Verify** — confirm the schema state is correct:
   ```bash
   psql "$DATABASE_URL" -c "\dt public.*"
   ```

5. **Update Drizzle metadata** — after rolling back, remove the corresponding entry
   from `lib/db/drizzle/meta/_journal.json` and delete the migration file, then:
   ```bash
   pnpm --filter @workspace/db run generate
   ```

6. **Restart the application:**
   ```bash
   # Restart API server workflow
   ```

## Rollback Order

Roll back in reverse order (newest migration first):

| Priority | Original Migration | Rollback Script |
|---|---|---|
| 1 (newest) | `0008_lyte_dashboards` | `005_rollback_0008_lyte_dashboards.sql` |
| 2 | `0007_azure_tenants_dataverse` | `004_rollback_0007_azure_tenants_dataverse.sql` |
| 3 | `0006_firestorm_hardening_platform` | `003_rollback_0006_firestorm_hardening.sql` |
| 4 | `0005_platform_ops_tables` | `002_rollback_0005_platform_ops_tables.sql` |
| 5 (oldest) | `0019_terra_broker_schema` (formerly `0004_terra_broker_schema`) | `001_rollback_0004_terra_broker_schema.sql` |

## What each script reverts

### 005_rollback_0008_lyte_dashboards.sql
- Drops `lyte_dashboards` table and its two indexes

### 004_rollback_0007_azure_tenants_dataverse.sql
- Drops `dataverse_connections` table
- Drops `azure_tenants_tenant_id_idx` unique index
- Drops `azure_tenants` table

### 003_rollback_0006_firestorm_hardening.sql
- Drops `firestorm_hardening_controls` table + category/status/priority indexes
- Removes `remediation_owner`, `due_date`, `audit_trail` columns from `firestorm_findings`
- Removes `owner`, `due_date`, `audit_trail` columns from `firestorm_compliance_controls`

### 002_rollback_0005_platform_ops_tables.sql
- Drops `artifact_approvals` table + domain/status indexes
- Drops `platform_job_runs` table + correlation/domain/status/type indexes
- Removes `scope`, `targeting_json`, `product`, `required_platform_role` columns from `feature_flags`

### 001_rollback_0004_terra_broker_schema.sql
- Drops `terra_transactions`, `terra_inquiries`, `terra_listings`, `terra_properties`,
  `terra_agents`, `terra_brokerages` tables (in dependency order) and all their indexes

## Point-in-Time Recovery

See `docs/disaster-recovery.md` for full recovery procedures including
full-schema point-in-time recovery using backup dumps.
