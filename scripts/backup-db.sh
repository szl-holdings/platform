#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# backup-db.sh — Automated PostgreSQL database backup with rotation
#
# Usage:
#   ./scripts/backup-db.sh [--dry-run]
#
# Behavior:
#   - Creates timestamped compressed SQL dumps in ./backups/
#   - Keeps last 7 daily backups and last 4 weekly backups (taken on Sundays)
#   - Writes a backup_manifest.json file for the health check endpoint
#   - Exits non-zero on any failure
#
# Required env:
#   DATABASE_URL   PostgreSQL connection string
#
# Optional env:
#   BACKUP_DIR     Override backup directory (default: ./backups)
#   PG_DUMP_ARGS   Extra args passed to pg_dump
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
MANIFEST_FILE="${BACKUP_DIR}/backup_manifest.json"
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
DAY_OF_WEEK=$(date -u +"%u")  # 7 = Sunday
DRY_RUN="${1:-}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[backup] ERROR: DATABASE_URL is not set." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

# ─── Determine filename ───────────────────────────────────────────────────────
if [[ "$DAY_OF_WEEK" == "7" ]]; then
  LABEL="weekly"
else
  LABEL="daily"
fi

FILENAME="${BACKUP_DIR}/${LABEL}_${TIMESTAMP}.sql.gz"

echo "[backup] Starting ${LABEL} backup → ${FILENAME}"

# ─── Run pg_dump ──────────────────────────────────────────────────────────────
if [[ "$DRY_RUN" == "--dry-run" ]]; then
  echo "[backup] DRY RUN — skipping actual pg_dump"
  FILESIZE=0
else
  pg_dump ${PG_DUMP_ARGS:-} "$DATABASE_URL" \
    --format=plain \
    --no-owner \
    --no-acl \
    --schema=public \
    | gzip -9 > "$FILENAME"

  FILESIZE=$(stat -c%s "$FILENAME" 2>/dev/null || stat -f%z "$FILENAME" 2>/dev/null || echo 0)
  echo "[backup] Backup complete. Size: ${FILESIZE} bytes"
fi

# ─── Rotation: keep last 7 daily backups ─────────────────────────────────────
echo "[backup] Rotating daily backups (keep last 7)..."
{ ls -t "${BACKUP_DIR}"/daily_*.sql.gz 2>/dev/null || true; } | tail -n +8 | xargs -r rm -f
DAILY_KEPT=$({ ls "${BACKUP_DIR}"/daily_*.sql.gz 2>/dev/null || true; } | wc -l)
echo "[backup] Daily backups retained: ${DAILY_KEPT}"

# ─── Rotation: keep last 4 weekly backups ────────────────────────────────────
echo "[backup] Rotating weekly backups (keep last 4)..."
{ ls -t "${BACKUP_DIR}"/weekly_*.sql.gz 2>/dev/null || true; } | tail -n +5 | xargs -r rm -f
WEEKLY_KEPT=$({ ls "${BACKUP_DIR}"/weekly_*.sql.gz 2>/dev/null || true; } | wc -l)
echo "[backup] Weekly backups retained: ${WEEKLY_KEPT}"

# ─── Write manifest ───────────────────────────────────────────────────────────
LAST_BACKUP_FILE=$({ ls -t "${BACKUP_DIR}"/*.sql.gz 2>/dev/null || true; } | head -1)
LAST_BACKUP_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LAST_BACKUP_SIZE=$(stat -c%s "${LAST_BACKUP_FILE}" 2>/dev/null || stat -f%z "${LAST_BACKUP_FILE}" 2>/dev/null || echo 0)
BACKUP_COUNT=$({ ls "${BACKUP_DIR}"/*.sql.gz 2>/dev/null || true; } | wc -l)

cat > "${MANIFEST_FILE}" <<EOF
{
  "lastBackupAt": "${LAST_BACKUP_TIME}",
  "lastBackupFile": "${LAST_BACKUP_FILE}",
  "lastBackupSizeBytes": ${LAST_BACKUP_SIZE},
  "label": "${LABEL}",
  "totalBackups": ${BACKUP_COUNT},
  "dailyRetained": ${DAILY_KEPT},
  "weeklyRetained": ${WEEKLY_KEPT},
  "backupDir": "${BACKUP_DIR}",
  "status": "ok"
}
EOF

echo "[backup] Manifest written to ${MANIFEST_FILE}"
echo "[backup] Done. Last backup: ${LAST_BACKUP_TIME}"
