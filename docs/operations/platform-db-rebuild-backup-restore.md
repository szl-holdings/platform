# Platform Postgres: rebuild, encrypted backup, restore drill

Status: PROPOSED (local branch). Nothing here is enabled until the data owner
names the production host, the private R2 bucket and the backup recipient key.

## 1. Build a NEW database from source (audit F1, gap G2)

The drizzle journal alone cannot build an empty database (23/148 entries ALTER
tables created only by historical `drizzle-kit push`). `rebuild-fresh` applies
the reviewed baseline generated from `lib/db/src/schema`, then replays the
journal and `lib/db/migrations/*.sql` statement by statement, and records both
trackers. It refuses any database that is not empty and requires
`REBUILD_FRESH_CONFIRM=<database name>`.

    DATABASE_URL=... REBUILD_FRESH_CONFIRM=<db> pnpm --filter @szl-holdings/db rebuild:fresh
    pnpm --filter @szl-holdings/db migrate      # must report nothing pending

- `lib/db/baseline/BASELINE.json` pins the baseline sha256; CI (`db-rebuild.yml`)
  fails if `src/schema` changes without `baseline:write`.
- `lib/db/baseline/replay-allowlist.json` lists the 10 reviewed statements that
  cannot apply on a source-derived schema, each with a reason. Anything else fails closed.
- Before this is the authoritative baseline for production, compare it with a
  read-only schema-only dump of the named host (audit A2).

## 2. Encrypted full backup

`lib/db/scripts/backup-encrypted.mjs` (scheduled by `.github/workflows/db-backup.yml`):
full `pg_dump --format=custom` of all schemas (trackers included), from an exported
REPEATABLE READ snapshot, streamed into `age` public-key encryption. A manifest
records sizes, plaintext/ciphertext sha256 and exact per-table row counts from the
same snapshot. There is no unencrypted mode. The private key never enters CI.

`scripts/backup-db.sh` (plain gzip, `--schema=public` only, so the drizzle tracker
is NOT in those dumps) should be retired once this is enabled.

## 3. Restore drill (spec R1)

    RESTORE_ADMIN_URL=<isolated scratch server> BACKUP_AGE_IDENTITY_FILE=<key> \
    RESTORE_DRILL_CONFIRM=throwaway node lib/db/scripts/restore-drill.mjs <name>.manifest.json --report drill.json

Restores into a new `restore_drill_<ts>` database (never an existing one), checks
hashes, exact row counts, trackers, constraint validity, extensions and
sequences, reports measured restore time and backup age, then drops the database.
Backups contain PII: run drills only on an isolated server inside the agreed
data-sharing scope.
