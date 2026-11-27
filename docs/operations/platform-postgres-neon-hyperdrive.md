# Platform Postgres: Neon + Cloudflare Hyperdrive (gap G1)

Status: PROPOSED. Nothing in this document has been created or deployed. Each
step marked **YES** needs the data owner's specific approval, with its cost.

## Architecture

```
Workers (platform-db-gateway, other Workers)
   └─ env.HYPERDRIVE (postgres.js, prepare:true, max 5)  ── Cloudflare Hyperdrive pool + cache
                                                              └─ Neon POOLED endpoint (…-pooler…)  ── runtime role
Node services (api-server etc.)    ── DATABASE_URL = Neon POOLED endpoint (runtime role)
Migrations / rebuild:fresh / pg_dump backup / restore drill
                                   ── DATABASE_URL_DIRECT = Neon DIRECT endpoint (migrator / backup roles)
PR previews                        ── Neon child branch of a schema-only "preview-base" (no production rows)
Recovery                           ── Neon instant restore (PITR, history window) + encrypted pg_dump in private R2
```

Fail-closed rules already in code:
- Workers: no `HYPERDRIVE` binding, or a non-Postgres string -> 503, no fallback (`workers/platform-db-gateway/src/db.ts`).
- Node template apps (nexus, a11oy-factory, szl-frontier): production without `DATABASE_URL` refuses the in-memory PGLite fallback (`src/lib/db-config.ts`).
- Migration tools refuse pooled endpoints (`lib/db/scripts/migration-url.mjs`).

## Roles (least privilege)

| Role | Used by | Grants |
|---|---|---|
| `platform_owner` | Neon project owner, break-glass only | owns schema; never in apps or CI |
| `platform_migrator` | migrations, rebuild:fresh, preview branches | DDL on `public`, `drizzle` |
| `platform_app` | Hyperdrive config, Node runtime | DML only; not owner (so future RLS applies) |
| `platform_backup` | db-backup.yml | `pg_read_all_data`, `default_transaction_read_only=on` |
| `audit_ro` | audits (A1-equivalent), audit-journal-skips | read-only |

## Recommended plan and monthly cost (Neon list prices, 2026-11-04)

Neon **Launch** (pay as you go, no minimum), one project `szl-platform` (region to be chosen with the approval; `aws-us-east-2` is the default proposal):

| Item | Assumption | $/month |
|---|---|---|
| Production compute | 0.5 CU floor, autoscale cap 2 CU, scale-to-zero OFF: 0.5 x 730 h x $0.106 | ~$38.70 |
| Storage | 10 GB x $0.35 | $3.50 |
| Instant restore (PITR) history | 7-day window, ~10 GB changed history x $0.20 | ~$2.00 |
| Preview branches | ≤10 per project included; scale-to-zero after 5 min, ~20 CU-h | ~$2.10 |
| Egress | < 500 GB included | $0 |
| **Expected** | | **~$46 / month** |
| Worst case at the 2 CU cap 24x7 | 2 x 730 x $0.106 + storage | ~$161 / month |

Cloudflare Hyperdrive: included in Workers plans (Workers Paid already covers
unlimited queries; no egress charge): **$0 extra**. R2 for encrypted backups:
~30 daily + 4 weekly dumps of a few GB is within or near R2's free 10 GB-month;
budget **≤ $1/month**.

Upgrade path: Neon **Scale** ($0.222/CU-hour, 30-day history, metrics export,
private networking) ≈ $85/month at the same 0.5 CU floor. Use it when an
Enterprise RPO 1 h / RTO 2 h commitment is sold (G4).

Set a Neon spending notification at $75 and an autoscaling cap of 2 CU.

## Backup and recovery layers

1. **Neon instant restore (PITR)** — any point in the last 7 days (Launch).
   Drill: restore to a *new branch* at a timestamp, run
   `node lib/db/scripts/audit-journal-skips.mjs --db` and row-count checks
   against it, then delete the branch. Never restore in place on production
   without a separate yes.
2. **Encrypted logical backup** — `.github/workflows/db-backup.yml`, daily,
   `pg_dump -Fc` of all schemas via the DIRECT URL, age-encrypted, to a private
   R2 bucket. Survives loss of the Neon account/project.
3. **Restore drill** — `lib/db/scripts/restore-drill.mjs` into an isolated
   scratch server, monthly. Measures real RTO and backup age.

## Setup order (each line is its own YES)

1. Create Neon org/project `szl-platform` on Launch (cost above), roles as listed.
2. `rebuild:fresh` on the empty production database using `DATABASE_URL_DIRECT` (no data yet),
   then `pnpm --filter @szl-holdings/db migrate` (must be a no-op).
3. Create a schema-only root branch `preview-base`; set `vars.NEON_PROJECT_ID`,
   `vars.NEON_PREVIEW_PARENT_BRANCH_ID`, `secrets.NEON_API_KEY`.
4. Create the Hyperdrive config from the POOLED endpoint with `platform_app`;
   put its id in `workers/platform-db-gateway/wrangler.jsonc`; deploy the Worker (no routes).
5. Create the private R2 bucket + bucket-scoped token; set the backup vars and
   `vars.PLATFORM_BACKUP_ENABLED=true`.
6. Data migration (a11oy `/tmp` SQLite, PGLite apps) — later, separate yes.
