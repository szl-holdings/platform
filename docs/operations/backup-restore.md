# Backup & Restore — SZL Holdings Platform

**Version:** 1.2 · **Last updated:** 2026-04-20 (object-storage archival enabled)
**Audience:** Engineering, DevOps, security reviewers, enterprise evaluators
**Companion docs:** [DATA-RETENTION.md](../security/data-retention.md) · [INCIDENT_RESPONSE.md](incident-response.md) · [TENANCY-MODEL.md](../architecture/tenancy-model.md)

---

## Purpose

Document the SZL Holdings platform's backup, restore, and disaster recovery posture across all editions and tiers, with explicit RPO/RTO targets and tested runbooks.

---

## Backup Inventory

| Asset class | What it includes | Backup mechanism | Retention |
|-------------|------------------|------------------|-----------|
| Application database | All tenant-scoped data, audit trail, config | Managed PostgreSQL automated snapshots | 30 days (Starter), 90 days (Pro), 365 days (Enterprise) |
| Object storage | Customer-uploaded files, generated docs | Azure Blob soft-delete + cross-region replica (Pro/Enterprise) | 30 days soft-delete |
| Secrets and config | Environment-injected secrets | Replit secrets store + Azure Key Vault (Enterprise) | Versioned indefinitely |
| Source code | Repository | GitHub | Indefinite |
| Container artifacts | Build images | Container registry | Indefinite |
| Audit logs (Proof Chain) | Append-only audit entries | Live in PostgreSQL + nightly export to immutable storage | Per [DATA-RETENTION.md](../security/data-retention.md) |
| AI traces | Eval traces, evaluator stats | PostgreSQL + nightly snapshot | 90 days operational; older archived |

---

## Recovery Objectives by Tier

| Tier | RPO (data loss tolerance) | RTO (downtime tolerance) | Backup cadence |
|------|--------------------------:|-------------------------:|----------------|
| Demo | best effort | best effort | Nightly |
| Pilot | 24 hours | 8 hours | Nightly |
| Standard (Pro) | 4 hours | 4 hours | Hourly WAL + nightly snapshot |
| Enterprise | 1 hour | 2 hours | Continuous WAL + hourly snapshot + cross-region |
| Sovereign (FY27) | Customer-defined | Customer-defined | Customer-managed |

**RPO** = Recovery Point Objective: maximum data loss in a disaster scenario.
**RTO** = Recovery Time Objective: maximum downtime to restore service.

---

## Backup Mechanisms

### Database snapshots (PostgreSQL)

- **Cadence:** Hourly (Pro), Nightly (Starter), Continuous WAL (Enterprise)
- **Storage:** Managed PostgreSQL provider (Replit / Azure)
- **Retention:** Per edition table above
- **Verification:** Weekly automated restore test to a staging environment; manual quarterly verification of point-in-time recovery on Pro and Enterprise

### Cross-region replication (Pro and Enterprise)

- **Mechanism:** Read replica in a secondary region (Azure paired region)
- **Lag:** Typically < 5 seconds; alerts fire at > 60 seconds
- **Failover:** Manual promotion via documented runbook (target: 30 minutes)

### Object storage replication

- **Mechanism:** Azure Blob geo-redundant storage
- **Replication SLA:** Provider's GZRS terms
- **Soft-delete:** 30 days

### Audit trail export

- **Mechanism:** Nightly job exports the day's Proof Chain entries to write-once immutable storage
- **Format:** JSON Lines, signed with HMAC of `BACKUP_SIGNING_KEY`
- **Storage:** Separate cloud account (Enterprise) to prevent same-blast-radius compromise

---

## Restore Procedures

### Scenario A: Single-tenant data corruption

| Step | Action | Owner | Target time |
|------|--------|-------|------------|
| 1 | Detect via support or monitoring | On-call | < 30 min |
| 2 | Confirm scope (which `org_id`, which tables) | DBA + on-call | < 30 min |
| 3 | Identify last known-good snapshot | DBA | < 15 min |
| 4 | Restore affected rows to a side schema | DBA | < 1 hr |
| 5 | Diff against current state; reconcile | DBA + customer CSM | < 2 hr |
| 6 | Apply reconciliation transaction | DBA | < 30 min |
| 7 | Verify with customer | CSM | < 2 hr |
| 8 | Document and add to incident record | On-call | < 1 hr |

### Scenario B: Full database loss

| Step | Action | Owner | Target time |
|------|--------|-------|------------|
| 1 | Detect (provider alert or monitoring) | On-call | < 5 min |
| 2 | Declare SEV1; notify per [INCIDENT_RESPONSE.md](incident-response.md) | On-call | < 15 min |
| 3 | Promote standby (Pro/Enterprise) or restore from snapshot (Starter) | DBA | < 30 min (Pro) / < 4 hr (Starter) |
| 4 | Verify schema and audit trail integrity | DBA | < 30 min |
| 5 | Bring application servers online against restored DB | DevOps | < 30 min |
| 6 | Customer-facing status update | Founder | continuous |
| 7 | Post-mortem | Founder + DBA | < 7 days |

### Scenario C: Region-wide outage (Enterprise)

| Step | Action | Owner | Target time |
|------|--------|-------|------------|
| 1 | Detect provider outage | On-call | < 5 min |
| 2 | Declare SEV1 | Founder | < 15 min |
| 3 | Initiate cross-region failover runbook | DevOps lead | < 30 min |
| 4 | Promote secondary region database | DBA | < 30 min |
| 5 | Update DNS / load balancer | DevOps | < 15 min |
| 6 | Validate end-to-end | QA + on-call | < 30 min |
| 7 | Communicate to customers | Founder + CSM | continuous |

Total Enterprise RTO target: 2 hours.

### Scenario D: Object storage loss

| Step | Action | Owner |
|------|--------|-------|
| 1 | Detect (provider alert or customer report) | On-call |
| 2 | Identify affected objects | DevOps |
| 3 | Restore from soft-delete (within 30 days) | DevOps |
| 4 | Restore from geo-replicated copy if soft-delete expired | DevOps |
| 5 | Verify with customer | CSM |

### Scenario E: Audit trail corruption

The Proof Chain is append-only. Corruption — by definition — implies tampering or platform fault.

| Step | Action | Owner |
|------|--------|-------|
| 1 | Detect via integrity check (weekly automated) or manual | Security lead |
| 2 | Declare security incident per [SECURITY.md](../../SECURITY.md) | Security lead |
| 3 | Cross-reference live audit trail against nightly export | DBA + Security |
| 4 | Identify divergence range | Security |
| 5 | Restore from nightly export if necessary | DBA |
| 6 | Forensic investigation (separate workstream) | Security |
| 7 | Customer notification per [DATA-RETENTION.md](../security/data-retention.md) | Founder |

---

## Testing Cadence

| Test | Frequency | Owner | Last verified |
|------|-----------|-------|---------------|
| Backup script execution (`backup-db.sh`) | Nightly automated via `.github/workflows/backup.yml` | DevOps | 2026-04-20 (first DR drill) |
| **Automated backup restore drill** | **Weekly (Sunday 03:00 UTC)** via `backup_restore_drill` platform job | Automated / on-call | 2026-04-23 (drill scheduler wired) |
| Database restore to scratch schema | Quarterly (manual drill) | DBA | 2026-04-20 (first DR drill — see `docs/operations/dr-drill-2026-04-20.md`) |
| **Object-storage restore-from-cloud drill** | **Quarterly** (recurring item; see drill template §3 Step 7) | DevOps | 2026-04-20 (first execution against `local-fs` transport pipeline; **first execution against real Azure Blob scheduled 2026-07-01**) |
| Point-in-time recovery (Pro) | Quarterly | DBA | TBD per cohort — requires Azure PostgreSQL Flexible Server |
| Cross-region failover (Enterprise) | Annually with each Enterprise customer; tabletop quarterly | DevOps + Customer | Per customer onboarding |
| Object storage soft-delete restore | Quarterly | DevOps | TBD |
| Audit trail integrity verification | Weekly automated (append-only Proof Chain check) | Security | Continuous |
| Full DR tabletop | Quarterly | Founder + DevOps | 2026-04-20 (first drill); next 2026-07-01 |

Untested backups are not real backups. The cadence above is enforced via reminders and reviewed in quarterly DR review.

### Backup Automation

Backup runs automatically via `.github/workflows/backup.yml` on a nightly cron (`0 2 * * *` UTC). The workflow:
- Installs `pg_dump` and the Azure CLI, then runs `scripts/backup-db.sh` against `DATABASE_URL`
- Ships the dump to durable object storage via `scripts/backup-upload.sh` (Azure Blob in production)
- Verifies both the local manifest status and the remote upload status before completing — the job **fails** if the remote upload was required and did not succeed
- Uploads a short-lived secondary copy to GitHub Actions artifacts (7-day retention) for fast incident-response access; this is **not** the system of record
- Can be triggered manually via `workflow_dispatch` with `--dry-run` support

**Rotation policy (object storage — production system of record):** `scripts/backup-upload.sh` enforces remote rotation against the configured backend after each upload:
- `daily_*.sql.gz` files older than `BACKUP_REMOTE_DAILY_RETENTION_DAYS` (default 30) are deleted (Starter tier).
- `weekly_*.sql.gz` files older than `BACKUP_REMOTE_WEEKLY_RETENTION_DAYS` (default 90) are deleted (Pro tier).
- File age is derived from the timestamp embedded in the filename (`<label>_YYYYMMDDTHHMMSSZ.sql.gz`), so rotation is correct even when remote `Last-Modified` is reset by re-uploads.
- Retention is enforced both via this script-level prune and via an Azure Blob lifecycle policy (defense in depth).

**Rotation policy (persistent storage / server deployments):** `scripts/backup-db.sh` additionally enforces a local 7 daily + 4 weekly window against `BACKUP_DIR`. This handles VM/container deployments that retain a working set of recent dumps locally.

**Rotation policy (CI ephemeral runners):** Each run starts with a clean filesystem, so the local-window logic is a no-op there. The remote-rotation logic above is what enforces retention for the CI path.

**Security note for CI artifacts:** SQL dump artifacts contain sensitive data. The CI artifact copy is unencrypted — the repository must remain private. The object-storage copy uses Azure Blob server-side encryption (Microsoft-managed keys today; customer-managed keys planned). Before the first regulated-tier customer, migrate to customer-managed keys (BYOK).

**Required CI secrets:**
- `DATABASE_URL` — connection string for the production database.
- One of:
  - `AZURE_STORAGE_CONNECTION_STRING` (preferred), **or**
  - `AZURE_STORAGE_ACCOUNT` + `AZURE_STORAGE_SAS_TOKEN` (SAS must include `rwdl` permissions on the container).
- `AZURE_STORAGE_CONTAINER` — destination container (e.g. `szl-backups`).
- Optional: `AZURE_STORAGE_PREFIX` — key prefix inside the container (e.g. `prod/`).

If the Azure secrets are absent the workflow logs a warning, falls back to artifact-only mode, and stays green — keeping CI usable for forks and preview environments. Production CI **must** set the secrets to meet the documented retention SLA.

### Restoring from Object Storage

The end-to-end restore path is exercised by `scripts/backup-restore.sh`:

```bash
# 1. Provision a clean scratch DATABASE (not just a schema — see note below)
#    with the public schema empty and required extensions installed.
SCRATCH=dr_scratch_$(date +%s)
psql "$DATABASE_URL" -c "CREATE DATABASE $SCRATCH;"
PGDATABASE=$SCRATCH psql -c "DROP SCHEMA public CASCADE;
                              CREATE SCHEMA public;
                              CREATE EXTENSION IF NOT EXISTS vector;"

# 2. Restore the most recent remote backup into the scratch database.
PGDATABASE=$SCRATCH \
  BACKUP_REMOTE_BACKEND=azure-blob \
  AZURE_STORAGE_CONNECTION_STRING=... \
  AZURE_STORAGE_CONTAINER=szl-backups \
  ./scripts/backup-restore.sh --latest --target-schema public

# 3. Verify integrity (sample row counts vs source) then drop the scratch DB.
PGDATABASE=$SCRATCH psql -tAc "SELECT COUNT(*) FROM entity_relationships;"
psql "$DATABASE_URL"  -c   "DROP DATABASE $SCRATCH;"
```

The script downloads the blob, verifies gzip integrity, rewrites the dump's `search_path` to the target schema, and pipes it into `psql` with `ON_ERROR_STOP=1`. The transport pipeline (upload, rotation, download, verification) is regression-tested by `tests/scripts/backup-upload-restore.test.sh` using the `local-fs` backend, which runs without cloud credentials in CI.

**Required extensions:** `pgvector` (`CREATE EXTENSION vector`) — must be present in the scratch database before replay; the dump references `public.vector(1024)` columns but does not emit a `CREATE EXTENSION` statement that the restoring role can execute on managed PostgreSQL.

**Note on `--target-schema` (finding from 2026-04-20 DR drill):** Current `pg_dump` output uses `SELECT pg_catalog.set_config('search_path','',false);` and fully-qualified `public.<table>` identifiers, so the search_path rewrite in `scripts/backup-restore.sh` only relocates the dump if the target schema is also named `public`. For scratch restores, **provision a separate database** as shown above rather than a side schema in the live database. (Tracked as a follow-up to either fix or remove the flag.)

**Quarterly drill cadence:** The object-storage restore-from-cloud drill is a recurring quarterly DR item (see `docs/operations/dr-drill-2026-04-20.md` §3 Step 7). Each execution records elapsed time per sub-step and feeds back into the RTO targets below.

#### Measured RTO calibration (from object-storage restore drills)

| Drill date | Backend | Dump size | Tables | Download + gzip verify | psql replay | Total restore wall-clock | Row-count drift |
|------------|---------|-----------|--------|------------------------|-------------|--------------------------|-----------------|
| 2026-04-20 | local-fs (transport pipeline) | 63 MB compressed | 724 | 5 sec | 106 sec | ~2 min 23 sec | 0 |
| 2026-07-01 | azure-blob (planned) | TBD | TBD | TBD | TBD | TBD | TBD |

These measurements confirm that for current dump sizes (≤ ~100 MB compressed), the **Pilot tier RTO target of < 8 hours is met by a wide margin** (observed ~2.5 min restore + < 30 min app reconnect ≪ 8 h). Restore time scales roughly linearly with dump size; at the current growth rate we have headroom to ~200× before approaching the 8-hour Pilot target. Pro and Enterprise tier targets continue to require Azure PostgreSQL Flexible Server with WAL streaming + cross-region replicas (production architecture target; not exercised on Replit-managed PostgreSQL).

---

## Customer-Facing Backup Posture

Customers can request:

| Action | Available at |
|--------|--------------|
| Audit trail export (org-scoped) | All tiers, on-demand |
| Tenant data export | All tiers, on-demand or per [DATA-RETENTION.md](../security/data-retention.md) |
| Snapshot restore for their tenant | Enterprise (negotiated) |
| Point-in-time restore for their tenant | Enterprise (negotiated) |
| Confirmation of last successful backup | All tiers, in support response |

---

## What We Do Not Do (And Why)

| We do not | Why |
|-----------|-----|
| Allow customers to delete their own audit trail | Defeats the purpose of an immutable trail |
| Offer < 1-hour RPO at Starter or Pro | Cost-to-value ratio does not justify; Enterprise offers it |
| Promise air-gapped backup at Enterprise yet | FY27 roadmap |
| Encrypt backups with customer-supplied keys (BYOK) | Roadmap; not GA |
| Backup development databases | Development is ephemeral by design |

---

## Known Gaps

From [KNOWN-GAPS.md](known-gaps.md) and updated after 2026-04-20 DR drill:

- **DR tabletop executed 2026-04-20** — RESOLVED. First drill completed; restore verified in ~25 seconds. See `docs/operations/dr-drill-2026-04-20.md`. Quarterly cadence scheduled; next drill 2026-07-01.
- **Backup automation now configured** — RESOLVED. `.github/workflows/backup.yml` runs nightly. Requires `DATABASE_URL` CI secret to be set for production database.
- **Hourly WAL streaming (Pro tier RPO)** — Replit-managed PostgreSQL does not expose WAL streaming. 4-hour RPO target for Pro tier requires Azure PostgreSQL Flexible Server in production. Not a silent gap; production architecture targets Azure.
- **Cross-region failover runbook not yet executed against live load** — planned tabletop scheduled per first Enterprise customer provisioning.
- **Object storage backup target configured** — RESOLVED (task #2679). Nightly backups are now shipped to Azure Blob via `scripts/backup-upload.sh`, with 30-day daily / 90-day weekly remote rotation enforced after each run. Restore path (`scripts/backup-restore.sh`) downloads from object storage and replays into a scratch schema. Transport plumbing is regression-tested by `tests/scripts/backup-upload-restore.test.sh`. Encryption at rest uses Microsoft-managed keys; CMK/BYOK remains FY27 roadmap.
- **Quarterly object-storage restore-from-cloud drill** — added to the DR drill template as a recurring item (task #2692). First execution recorded 2026-04-20 against the regression-tested `local-fs` transport pipeline (~2 min 23 sec total restore wall-clock for a 63 MB / 724-table dump, zero row-count drift). First execution against **real Azure Blob** scheduled for the 2026-07-01 drill cycle; blocked only on attaching `AZURE_STORAGE_CONNECTION_STRING` and `AZURE_STORAGE_CONTAINER` workspace secrets. RTO calibration table populated in §"Restoring from Object Storage".
- **Customer BYOK for backup encryption** — not yet implemented; FY27 roadmap.

These gaps are documented honestly. They do not represent silent risk.

---

## Related Documents

| Document | Path |
|----------|------|
| DR drill record (2026-04-20) | [docs/operations/dr-drill-2026-04-20.md](dr-drill-2026-04-20.md) |
| **Manual restore runbook** | **[docs/operations/runbook-manual-restore.md](runbook-manual-restore.md)** |
| Ops readiness summary | [docs/operations/ops-readiness.md](ops-readiness.md) |
| Observability audit | [audit/operations/observability-audit.md](../../audit/operations/observability-audit.md) |
| Backup CI workflow | [.github/workflows/backup.yml](.github/workflows/backup.yml) |
| Data retention | [DATA-RETENTION.md](../security/data-retention.md) |
| Incident response | [INCIDENT_RESPONSE.md](incident-response.md) |
| Tenancy model | [TENANCY-MODEL.md](../architecture/tenancy-model.md) |
| Security | [SECURITY.md](../../SECURITY.md) |
| Known gaps | [KNOWN-GAPS.md](known-gaps.md) |
| Trust Center | [TRUST_CENTER_INDEX.md](../security/trust-center-index.md) |
| Tenant tiers | [TENANT_TIERS.md](../product/tenant-tiers.md) |
| Backup runbook | `infra/runbooks/RUNBOOK_BACKUP.md` |
| Restore runbook | `infra/runbooks/RUNBOOK_RESTORE.md` |
