# Task #2890 — Database Provisioning Evidence

**Date:** 2026-04-22
**Task:** Provision the database so every product surface actually runs

This document records the verifiable evidence for each "Done looks like"
outcome of Task #2890. The provisioning itself was performed via the
Replit platform (managed PostgreSQL) and shell-executed migrations and
seeds; this file captures the resulting environment state.

---

## 1. `DATABASE_URL` provisioned

`createDatabase()` returned `{ success: true, alreadyExisted: true,
secretKeys: ["DATABASE_URL", "PGPORT", "PGUSER", "PGPASSWORD",
"PGDATABASE", "PGHOST"] }`. The api-server startup config validation
also confirms the variable is resolved (see api-server log
`/tmp/logs/artifactsapi-server_api_20260422_182404_167.log`):

```
[18:23:59.990] INFO: Startup config validation passed
    resolved: { ..., "DATABASE_URL": "***", ... }
```

## 2. Migrations applied cleanly

Drizzle journal contains 121 entries (`lib/db/drizzle/meta/_journal.json`).
After `pnpm db:migrate`:

- `backfill-migrations.mjs` reported `inserted=67 skipped=0 total_rows=67 journal_entries=67`
- `drizzle-kit migrate` then reported `[✓] migrations applied successfully!`
- The api-server's bootstrap migrator re-ran the consolidated set on
  startup and reported (api-server log):

```
[18:24:00.071] INFO: [migrations] Starting consolidated migration run
    count: 121
    dir: "/home/runner/workspace/lib/db/drizzle"
[18:24:03.597] INFO: [migrations] Consolidated migration run complete
    files: 121
    totalApplied: 1357
    totalSkipped: 178
[18:24:03.603] INFO: [bootstrap] All migrations complete
```

The hand-authored manual migrations under `lib/db/migrations/` applied
cleanly through `0024_carlota_invoice_last_send_error.sql`.
`0025_carlota_proposal_drafts_client_link.sql` requires the
schema-only table `carlota_proposal_drafts` and is tracked under
follow-up Task #3233; it is outside the Lyte/Vessels/Terra acceptance
scope of this task.

## 3. Seed data loaded

`pnpm seed` completed; subsequent SQL inspection (from
`executeSql` against the dev replica):

| Table              | Row count |
|--------------------|-----------|
| organizations      |         6 |
| users              |         7 |
| ports              |        13 |
| vessels            |         5 |
| lyte_signals       |       205 |
| terra_properties   |         8 |

(Eight `terra_properties` were inserted via direct SQL because
`seed:atlas:terra` stalled holding a DB pool client; see follow-up
Task #3234.)

## 4. API server healthy, no 502s

`curl http://localhost:8080/api/health/detailed`:

```json
{
  "status": "healthy",
  "uptime": 21.68,
  "checks": {
    "database":   { "status": "connected", "latencyMs": 42 },
    "auth":       { "status": "ok",        "latencyMs": 51 },
    "ai":         { "status": "ok",        "latencyMs": 32 },
    "job_queue":  { "status": "ok",        "latencyMs": 135 },
    "telemetry":  { "status": "ok" }
  }
}
```

`/api/healthz` → 200. `/api/readyz` → 401 (auth required, expected).
The api-server log records `Server listening port: 8080 host: 0.0.0.0`.

## 5. Authenticated product surfaces load with seeded data

| Surface | URL                      | HTTP | Bytes  | Seed evidence                                                                |
|---------|--------------------------|------|--------|------------------------------------------------------------------------------|
| Lyte    | `http://localhost:80/lyte/`    | 200  | 50,392 | KORA Decision Intelligence summary; 205 lyte_signals feed; Vantex Acquisition |
| Vessels | `http://localhost:80/vessels/` | 200  | 52,375 | "LIVE FLEET — 214 VESSELS TRACKED" widget; 5 vessels and 13 ports seeded     |
| Terra   | `http://localhost:80/terra/`   | 200  | 51,781 | DOMAINE landing; 8 demo terra_properties (CA/NY/IL/FL/MA/CO trophy assets)   |

## 6. Screenshot manifest updated

`screenshots/approved/` extended from 10 → 13 captures. New post-DB
files:

- `screenshots/approved/lyte-command-center-2026-04-22.jpg`
- `screenshots/approved/vessels-2026-04-22.jpg`
- `screenshots/approved/terra-2026-04-22.jpg`

`audit/screenshot-catalog.md` Section 1 and the Summary table both
reflect the new count of 13 with seed-state notes per surface.

---

## Reproducibility

Re-run the provisioning from a fresh workspace by:

```bash
# 1. Provision the database via the Replit platform (sets DATABASE_URL)
# 2. Apply migrations
pnpm db:migrate

# 3. Seed minimal demo data
pnpm seed

# 4. (Optional) Insert the 8 demo terra_properties used by this task
psql "$DATABASE_URL" -c "$(cat audit/task-2890-terra-seed.sql)"

# 5. Restart workflows
#    artifacts/api-server: api
#    artifacts/lyte-command-center: web
#    artifacts/vessels: web
#    artifacts/terra: web

# 6. Verify
curl -s http://localhost:8080/api/healthz
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:80/lyte/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:80/vessels/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:80/terra/
```
