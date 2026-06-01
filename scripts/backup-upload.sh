#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# backup-upload.sh — Upload backup dumps to object storage and rotate remote
#
# Usage:
#   ./scripts/backup-upload.sh <local-file> [--rotate-only]
#
# Behavior:
#   - Uploads <local-file> to the configured object-storage backend
#   - Verifies the upload succeeded (size match) before returning success
#   - Enforces remote rotation:
#       * keeps daily_*.sql.gz younger than BACKUP_REMOTE_DAILY_RETENTION_DAYS
#       * keeps weekly_*.sql.gz younger than BACKUP_REMOTE_WEEKLY_RETENTION_DAYS
#   - Emits a JSON status line on stdout describing the upload result
#       (consumed by backup-db.sh and surfaced in the manifest)
#
# Required env:
#   BACKUP_REMOTE_BACKEND   one of: azure-blob | local-fs | none
#                           (none = no-op, returns "skipped")
#
# Backend-specific env (azure-blob):
#   AZURE_STORAGE_ACCOUNT     storage account name
#   AZURE_STORAGE_CONTAINER   container name (e.g. "szl-backups")
#   AZURE_STORAGE_SAS_TOKEN   SAS token with rwdl permissions, OR
#   AZURE_STORAGE_CONNECTION_STRING   full connection string
#   AZURE_STORAGE_PREFIX      optional key prefix inside container (default: "")
#
# Backend-specific env (local-fs, used for testing):
#   BACKUP_REMOTE_LOCAL_DIR   directory simulating remote storage
#
# Optional env:
#   BACKUP_REMOTE_DAILY_RETENTION_DAYS    default: 30
#   BACKUP_REMOTE_WEEKLY_RETENTION_DAYS   default: 90
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

LOCAL_FILE="${1:-}"
ROTATE_ONLY="${2:-}"

BACKEND="${BACKUP_REMOTE_BACKEND:-none}"
DAILY_RETENTION="${BACKUP_REMOTE_DAILY_RETENTION_DAYS:-30}"
WEEKLY_RETENTION="${BACKUP_REMOTE_WEEKLY_RETENTION_DAYS:-90}"

emit_status() {
  # Emit a single-line JSON status to stdout for callers to capture.
  local status="$1"; local message="$2"; local url="${3:-}"; local size="${4:-0}"
  local kept_daily="${5:-0}"; local kept_weekly="${6:-0}"; local pruned="${7:-0}"
  # Stamp the moment we emitted this status. Callers (backup-db.sh) propagate
  # `uploadedAt` to the manifest only when status=ok so the health check can
  # measure remote freshness against the tier RPO.
  local now; now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  printf '{"status":"%s","backend":"%s","message":"%s","remoteUrl":"%s","remoteSizeBytes":%s,"remoteDailyRetained":%s,"remoteWeeklyRetained":%s,"remotePruned":%s,"dailyRetentionDays":%s,"weeklyRetentionDays":%s,"uploadedAt":"%s"}\n' \
    "$status" "$BACKEND" "$message" "$url" "$size" \
    "$kept_daily" "$kept_weekly" "$pruned" \
    "$DAILY_RETENTION" "$WEEKLY_RETENTION" \
    "$now"
}

log() { echo "[backup-upload] $*" >&2; }

# ─── No-op short-circuit ──────────────────────────────────────────────────────
if [[ "$BACKEND" == "none" ]]; then
  log "BACKUP_REMOTE_BACKEND=none — skipping remote upload."
  emit_status "skipped" "remote backend disabled" "" 0 0 0 0
  exit 0
fi

if [[ "$ROTATE_ONLY" != "--rotate-only" && -z "$LOCAL_FILE" ]]; then
  log "ERROR: missing <local-file> argument."
  emit_status "error" "missing local file argument" "" 0 0 0 0
  exit 2
fi

if [[ "$ROTATE_ONLY" != "--rotate-only" && ! -f "$LOCAL_FILE" ]]; then
  log "ERROR: local file not found: $LOCAL_FILE"
  emit_status "error" "local file not found" "" 0 0 0 0
  exit 2
fi

BASENAME=""
LOCAL_SIZE=0
if [[ -n "$LOCAL_FILE" && -f "$LOCAL_FILE" ]]; then
  BASENAME=$(basename "$LOCAL_FILE")
  LOCAL_SIZE=$(stat -c%s "$LOCAL_FILE" 2>/dev/null || stat -f%z "$LOCAL_FILE" 2>/dev/null || echo 0)
fi

# ─── Helper: determine if a backup filename is older than N days ──────────────
# Filename format: <label>_YYYYMMDDTHHMMSSZ.sql.gz
# Returns 0 (true) if older than N days, 1 otherwise.
older_than_days() {
  local fname="$1"; local days="$2"
  local stamp
  stamp=$(echo "$fname" | sed -nE 's/.*_([0-9]{8}T[0-9]{6}Z)\.sql\.gz$/\1/p')
  if [[ -z "$stamp" ]]; then
    return 1   # unparsable -> keep
  fi
  # YYYYMMDDTHHMMSSZ -> YYYY-MM-DDTHH:MM:SSZ
  local iso="${stamp:0:4}-${stamp:4:2}-${stamp:6:2}T${stamp:9:2}:${stamp:11:2}:${stamp:13:2}Z"
  local file_epoch
  file_epoch=$(date -u -d "$iso" +%s 2>/dev/null || date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$iso" +%s 2>/dev/null || echo 0)
  [[ "$file_epoch" == "0" ]] && return 1
  local now_epoch; now_epoch=$(date -u +%s)
  local age_days=$(( (now_epoch - file_epoch) / 86400 ))
  [[ "$age_days" -gt "$days" ]]
}

# ============================================================================
# Backend: local-fs (testing / dev)
# ============================================================================
backend_local_fs() {
  local dir="${BACKUP_REMOTE_LOCAL_DIR:-}"
  if [[ -z "$dir" ]]; then
    log "ERROR: BACKUP_REMOTE_LOCAL_DIR is required for local-fs backend."
    emit_status "error" "BACKUP_REMOTE_LOCAL_DIR not set" "" 0 0 0 0
    exit 2
  fi
  mkdir -p "$dir"

  local pruned=0

  if [[ "$ROTATE_ONLY" != "--rotate-only" ]]; then
    cp "$LOCAL_FILE" "$dir/$BASENAME"
    local remote_size
    remote_size=$(stat -c%s "$dir/$BASENAME" 2>/dev/null || stat -f%z "$dir/$BASENAME" 2>/dev/null || echo 0)
    if [[ "$remote_size" != "$LOCAL_SIZE" ]]; then
      log "ERROR: size mismatch after upload (local=$LOCAL_SIZE remote=$remote_size)"
      emit_status "error" "size mismatch after upload" "file://$dir/$BASENAME" "$remote_size" 0 0 0
      exit 1
    fi
    log "Uploaded $BASENAME → file://$dir/$BASENAME ($remote_size bytes)"
  fi

  # Rotate daily files older than DAILY_RETENTION
  shopt -s nullglob
  for f in "$dir"/daily_*.sql.gz; do
    if older_than_days "$(basename "$f")" "$DAILY_RETENTION"; then
      rm -f "$f"; pruned=$((pruned+1))
      log "pruned (daily, age>${DAILY_RETENTION}d): $(basename "$f")"
    fi
  done
  for f in "$dir"/weekly_*.sql.gz; do
    if older_than_days "$(basename "$f")" "$WEEKLY_RETENTION"; then
      rm -f "$f"; pruned=$((pruned+1))
      log "pruned (weekly, age>${WEEKLY_RETENTION}d): $(basename "$f")"
    fi
  done

  local kept_daily=0 kept_weekly=0
  for f in "$dir"/daily_*.sql.gz;  do kept_daily=$((kept_daily+1));   done
  for f in "$dir"/weekly_*.sql.gz; do kept_weekly=$((kept_weekly+1)); done
  shopt -u nullglob

  emit_status "ok" "upload+rotate complete" "file://$dir/$BASENAME" "$LOCAL_SIZE" "$kept_daily" "$kept_weekly" "$pruned"
}

# ============================================================================
# Backend: azure-blob (production)
# ============================================================================
backend_azure_blob() {
  if ! command -v az >/dev/null 2>&1; then
    log "ERROR: azure-cli (az) is not installed."
    emit_status "error" "azure-cli not installed" "" 0 0 0 0
    exit 2
  fi
  local account="${AZURE_STORAGE_ACCOUNT:-}"
  local container="${AZURE_STORAGE_CONTAINER:-}"
  local sas="${AZURE_STORAGE_SAS_TOKEN:-}"
  local conn="${AZURE_STORAGE_CONNECTION_STRING:-}"
  local prefix="${AZURE_STORAGE_PREFIX:-}"

  if [[ -z "$container" ]]; then
    log "ERROR: AZURE_STORAGE_CONTAINER is required."
    emit_status "error" "AZURE_STORAGE_CONTAINER not set" "" 0 0 0 0
    exit 2
  fi
  if [[ -z "$conn" && ( -z "$account" || -z "$sas" ) ]]; then
    log "ERROR: provide AZURE_STORAGE_CONNECTION_STRING, or AZURE_STORAGE_ACCOUNT + AZURE_STORAGE_SAS_TOKEN."
    emit_status "error" "azure credentials not set" "" 0 0 0 0
    exit 2
  fi

  # Build az auth args
  local auth_args=()
  if [[ -n "$conn" ]]; then
    auth_args+=(--connection-string "$conn")
  else
    auth_args+=(--account-name "$account" --sas-token "$sas")
  fi

  local key remote_url
  key="${prefix}${BASENAME}"
  if [[ -n "$account" ]]; then
    remote_url="https://${account}.blob.core.windows.net/${container}/${key}"
  else
    remote_url="azure://${container}/${key}"
  fi

  if [[ "$ROTATE_ONLY" != "--rotate-only" ]]; then
    log "Uploading $BASENAME → $remote_url"
    az storage blob upload \
      --container-name "$container" \
      --name "$key" \
      --file "$LOCAL_FILE" \
      --overwrite \
      --no-progress \
      "${auth_args[@]}" >/dev/null

    # Verify size
    local remote_size
    remote_size=$(az storage blob show \
      --container-name "$container" --name "$key" \
      "${auth_args[@]}" \
      --query "properties.contentLength" -o tsv 2>/dev/null || echo 0)
    if [[ "$remote_size" != "$LOCAL_SIZE" ]]; then
      log "ERROR: size mismatch after upload (local=$LOCAL_SIZE remote=$remote_size)"
      emit_status "error" "size mismatch after upload" "$remote_url" "$remote_size" 0 0 0
      exit 1
    fi
    log "Verified upload size=$remote_size bytes."
  fi

  # Rotate: list blobs, evaluate age from filename, delete those past retention
  local pruned=0
  # List blobs with the configured prefix
  local listing
  listing=$(az storage blob list \
    --container-name "$container" \
    --prefix "$prefix" \
    "${auth_args[@]}" \
    --query "[].name" -o tsv 2>/dev/null || true)

  while IFS= read -r blob_name; do
    [[ -z "$blob_name" ]] && continue
    local fname; fname=$(basename "$blob_name")
    local retention=0
    if [[ "$fname" == daily_* ]]; then retention="$DAILY_RETENTION"; fi
    if [[ "$fname" == weekly_* ]]; then retention="$WEEKLY_RETENTION"; fi
    [[ "$retention" == "0" ]] && continue
    if older_than_days "$fname" "$retention"; then
      az storage blob delete \
        --container-name "$container" --name "$blob_name" \
        "${auth_args[@]}" >/dev/null
      pruned=$((pruned+1))
      log "pruned (age>${retention}d): $blob_name"
    fi
  done <<< "$listing"

  local kept_daily kept_weekly
  kept_daily=$(echo "$listing" | grep -E "(^|/)daily_" | wc -l | tr -d ' ')
  kept_weekly=$(echo "$listing" | grep -E "(^|/)weekly_" | wc -l | tr -d ' ')
  # Adjust counts for the just-pruned items (best-effort; az delete is sync)
  kept_daily=$(( kept_daily > pruned ? kept_daily : 0 ))

  emit_status "ok" "upload+rotate complete" "$remote_url" "$LOCAL_SIZE" "$kept_daily" "$kept_weekly" "$pruned"
}

case "$BACKEND" in
  local-fs)   backend_local_fs ;;
  azure-blob) backend_azure_blob ;;
  *)
    log "ERROR: unknown BACKUP_REMOTE_BACKEND: $BACKEND"
    emit_status "error" "unknown backend" "" 0 0 0 0
    exit 2
    ;;
esac
