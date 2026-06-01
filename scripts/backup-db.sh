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
#   BACKUP_DIR              Override backup directory (default: ./backups)
#   PG_DUMP_ARGS            Extra args passed to pg_dump
#   BACKUP_REMOTE_BACKEND   If set to azure-blob | local-fs, the dump is
#                           shipped to object storage via scripts/backup-upload.sh
#                           after the local dump completes. Remote rotation
#                           (30-day daily / 90-day weekly) is enforced there.
#                           If unset or "none", upload is skipped (back-compat).
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

# ─── Remote upload (object storage) ───────────────────────────────────────────
# Skipped automatically if BACKUP_REMOTE_BACKEND is unset or "none".
# On success, merges remote-upload status into the manifest.
REMOTE_BACKEND="${BACKUP_REMOTE_BACKEND:-none}"
if [[ "$DRY_RUN" == "--dry-run" ]]; then
  echo "[backup] DRY RUN — skipping remote upload."
  REMOTE_STATUS_JSON='{"status":"skipped","backend":"'"$REMOTE_BACKEND"'","message":"dry-run"}'
elif [[ "$REMOTE_BACKEND" == "none" ]]; then
  echo "[backup] BACKUP_REMOTE_BACKEND not configured — local-only backup."
  REMOTE_STATUS_JSON='{"status":"skipped","backend":"none","message":"remote backend disabled"}'
else
  UPLOAD_SCRIPT="$(dirname "$0")/backup-upload.sh"
  if [[ ! -x "$UPLOAD_SCRIPT" ]]; then
    chmod +x "$UPLOAD_SCRIPT" 2>/dev/null || true
  fi
  echo "[backup] Uploading to remote backend: $REMOTE_BACKEND"
  set +e
  REMOTE_STATUS_JSON=$("$UPLOAD_SCRIPT" "$FILENAME")
  UPLOAD_RC=$?
  set -e
  if [[ $UPLOAD_RC -ne 0 ]]; then
    echo "[backup] ERROR: remote upload failed (rc=$UPLOAD_RC)" >&2
    # Rewrite manifest with failed remote status, then exit non-zero
    if [[ -z "$REMOTE_STATUS_JSON" ]]; then
      REMOTE_STATUS_JSON='{"status":"error","backend":"'"$REMOTE_BACKEND"'","message":"upload script failed"}'
    fi
  fi
fi

# Merge remote status into manifest. If jq is unavailable, fall back to a
# simpler concatenation (Linux runners always have jq).
#
# In addition to the nested `remoteUpload` block we surface two flat fields
# (`lastRemoteUploadAt`, `lastRemoteUploadStatus`) so the in-process health
# check can read them cheaply without parsing the nested object on every
# request, and so external monitoring (e.g. log-based) can grep for them.
if command -v jq >/dev/null 2>&1; then
  TMP_MANIFEST=$(mktemp)
  jq --argjson r "$REMOTE_STATUS_JSON" '
    . + {
      remoteUpload: $r,
      lastRemoteUploadStatus: ($r.status // "unknown"),
      lastRemoteUploadAt: (if ($r.status // "") == "ok" then ($r.uploadedAt // null) else (.lastRemoteUploadAt // null) end)
    }
  ' "${MANIFEST_FILE}" > "$TMP_MANIFEST"
  mv "$TMP_MANIFEST" "${MANIFEST_FILE}"
else
  # No-jq fallback: extract status + uploadedAt with grep so we can also
  # surface the flat lastRemoteUploadAt / lastRemoteUploadStatus fields
  # the health check reads.
  REMOTE_STATUS=$(echo "$REMOTE_STATUS_JSON" | grep -oE '"status":"[^"]+"' | head -1 | cut -d'"' -f4)
  REMOTE_UPLOADED_AT=$(echo "$REMOTE_STATUS_JSON" | grep -oE '"uploadedAt":"[^"]*"' | head -1 | cut -d'"' -f4)
  PRESERVED_LAST_AT=""
  if [[ "$REMOTE_STATUS" != "ok" ]]; then
    PRESERVED_LAST_AT=$(grep -oE '"lastRemoteUploadAt":"[^"]*"' "${MANIFEST_FILE}" | head -1 | cut -d'"' -f4 || true)
    EFFECTIVE_LAST_AT="$PRESERVED_LAST_AT"
  else
    EFFECTIVE_LAST_AT="$REMOTE_UPLOADED_AT"
  fi
  if [[ -n "$EFFECTIVE_LAST_AT" ]]; then
    LAST_AT_JSON="\"$EFFECTIVE_LAST_AT\""
  else
    LAST_AT_JSON="null"
  fi
  # Strip trailing } and append remoteUpload + flat fields
  sed -i.bak 's/}$/,/' "${MANIFEST_FILE}"
  {
    printf '  "remoteUpload": %s,\n' "$REMOTE_STATUS_JSON"
    printf '  "lastRemoteUploadStatus": "%s",\n' "${REMOTE_STATUS:-unknown}"
    printf '  "lastRemoteUploadAt": %s\n}\n' "$LAST_AT_JSON"
  } >> "${MANIFEST_FILE}"
  rm -f "${MANIFEST_FILE}.bak"
fi

# If remote was required and failed, fail the whole job
if [[ "$REMOTE_BACKEND" != "none" && "$DRY_RUN" != "--dry-run" ]]; then
  REMOTE_STATUS=$(echo "$REMOTE_STATUS_JSON" | grep -oE '"status":"[^"]+"' | head -1 | cut -d'"' -f4)
  if [[ "$REMOTE_STATUS" != "ok" ]]; then
    echo "[backup] FATAL: remote upload status='$REMOTE_STATUS' — failing job." >&2
    exit 1
  fi
  echo "[backup] Remote upload OK."
fi

echo "[backup] Done. Last backup: ${LAST_BACKUP_TIME}"
