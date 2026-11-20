# Qullqa — Python-first legacy database seam (candidate, offline)

This is a **source-owned, standard-library Python pilot**, not a deployment.
It ports the *shape and synthetic observation behavior* of the legacy
`lib/db/src/schema/health_checks.ts` table without starting Replit, copying
customer rows, inventing a PostgreSQL schema, or creating another migration
runner. The Drizzle schema remains the source of truth until a separately
reviewed migration decision and an independent database catalog readback.

## Reproduce on Python 3.11+

From the `platform` repository root:

```sh
python -m unittest discover -s lib/db/python/tests -v
python lib/db/python/qullqa_health.py --schema lib/db/src/schema/health_checks.ts --synthetic-restore-drill
node lib/db/scripts/check-journal.mjs
```

Only the **second** command uses synthetic SQLite files in a temporary
directory. The source fingerprint is a SHA-256 of the exact source file,
with an explicit `STATIC_SOURCE_PATTERN_ONLY` qualification; it does not
parse the full TypeScript language, verify any live catalog, sign evidence or
certify deployed schema parity.

## Executable local API contract (not advertised in production)

`CandidateApp` implements WSGI for optional, **locally configured** use.
No HTTP server is started by this package's CLI.

| Path | Response | Meaning |
| --- | --- | --- |
| `GET /healthz` | 200 JSON | Python process executes; **not** database readiness |
| `GET /readyz` | 503 JSON | PostgreSQL production source/restore/RLS are unverified |
| `GET /api/qullqa/v1/health-checks` | 503 without configured token; 403 if wrong token; 200 only for authorized local synthetic records | No production rows; response visibly marked `LOCAL_SYNTHETIC_ONLY` |
| Other paths or methods | 404/405 JSON | Fail closed, no HTML 200 fallback |

The only write helper is `record_synthetic`: it requires an existing
Qullqa-marked disposable SQLite file, validates a small test-only schema,
uses parameterized SQL in one marker-checked transaction, and cannot
connect to PostgreSQL. A record's status is **source-reported**, not
independently measured. A missing store returns JSON `rows: null`, not
an invented zero.

`backup_and_verify_synthetic` creates a new SQLite backup and restores
it into another new file, checks SQLite integrity plus canonical row digest,
refuses overwrite, and closes file handles on Windows. This does **not**
test a PostgreSQL physical or logical backup. It neither calls nor wraps
`pg_basebackup`, `pg_verifybackup`, `pg_dump`, nor `pg_restore`.

## Existing source owner and nonduplication

- Exact base for this work: `szl-holdings/platform@8c1fc5b9b06385c3639bcf0bd297e944c14cd797`.
- Existing platform PR #1070 already landed the serialized manual migration
  runner; #1086 already landed the high-water journal admission guard.
  This candidate changes **neither** one.
- The 148 historical Drizzle journal entries contain 39 previously
  allow-listed anomalies and one orphan SQL file. These remain a separate
  **reconciliation HOLD**; no migration-history rewrite is proposed.
- Existing repository guidance reports 799+ tables. This pilot ports one
  existing seam, and must never be represented as a replacement of all
  source definitions or live provisioned tables.

## Required before any release

1. Identify the actual, separately authorized **legacy platform production**
   PostgreSQL project and read-only principal; the connected Neon validation
   project is not production proof, and an unrelated production project is
   not authority for this app. No credentials or customer tables are read
   by this pilot.
2. Inventory **actual route ownership**, service dependencies, tenancy/RLS,
   key management, retention and current production catalog in a bounded
   read-only transaction. Compare it to source-owned Drizzle schema.
3. Reconcile historical migrations without backfilling a guessed state.
   Preserve the existing guarded migration lane until independently verified.
4. For PostgreSQL 18: check the exact running patch level. The 2026-11-12
   PostgreSQL 18.7 release warns existing incremental backups may be
   unreliable; once upgraded, take a fresh full backup if applicable, and
   perform an independently verified **disposable test restore**.
   See https://www.postgresql.org/docs/18/release-18-7.html and
   https://www.postgresql.org/docs/18/app-pgverifybackup.html.
5. Build the next Python slice only after route/contract mapping, authenticated
   negative tests, migration parity, performance budget and owner-reviewed
   staged deployment plan. Keep Replit decommissioned and protected-main
   approvals intact. No production migration, payment action, or deployment
   is included here.

**Proof boundary:** source pattern matching, 22 offline regression tests
(including actual 127.0.0.1 HTTP), synthetic backup/restore, and JS journal
gate; no signed production evidence, live data, deployment or restored
PostgreSQL recovery point.
