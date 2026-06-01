#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# backup-restore.sh — Restore a database dump from object storage
#
# Usage:
#   ./scripts/backup-restore.sh <remote-filename> [--target-schema NAME]
#   ./scripts/backup-restore.sh --latest [--target-schema NAME]
#
# Behavior:
#   - Downloads <remote-filename> (or the most recent daily_*.sql.gz)
#     from the configured object-storage backend into a temp directory
#   - Optionally rewrites the dump's search_path to <target-schema>
#     (default: restore_scratch) so the restore lands in an isolated schema
#   - Pipes the decompressed SQL into psql against $DATABASE_URL
#   - Exits non-zero on any failure
#
# Env: same backend env vars as backup-upload.sh
# Required env: DATABASE_URL
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REMOTE_NAME=""
TARGET_SCHEMA="restore_scratch"
USE_LATEST="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --latest) USE_LATEST="true"; shift ;;
    --target-schema) TARGET_SCHEMA="$2"; shift 2 ;;
    *) REMOTE_NAME="$1"; shift ;;
  esac
done

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[restore] ERROR: DATABASE_URL is not set." >&2
  exit 1
fi

BACKEND="${BACKUP_REMOTE_BACKEND:-none}"
if [[ "$BACKEND" == "none" ]]; then
  echo "[restore] ERROR: BACKUP_REMOTE_BACKEND is not configured." >&2
  exit 2
fi

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

log() { echo "[restore] $*"; }

# ─── List remote backups (returns sorted filenames, newest last) ──────────────
list_remote() {
  case "$BACKEND" in
    local-fs)
      local dir="${BACKUP_REMOTE_LOCAL_DIR:?BACKUP_REMOTE_LOCAL_DIR required}"
      ls "$dir"/*.sql.gz 2>/dev/null | xargs -n1 basename | sort
      ;;
    azure-blob)
      local container="${AZURE_STORAGE_CONTAINER:?AZURE_STORAGE_CONTAINER required}"
      local prefix="${AZURE_STORAGE_PREFIX:-}"
      local auth_args=()
      if [[ -n "${AZURE_STORAGE_CONNECTION_STRING:-}" ]]; then
        auth_args+=(--connection-string "$AZURE_STORAGE_CONNECTION_STRING")
      else
        auth_args+=(--account-name "${AZURE_STORAGE_ACCOUNT:?}" --sas-token "${AZURE_STORAGE_SAS_TOKEN:?}")
      fi
      az storage blob list --container-name "$container" --prefix "$prefix" \
        "${auth_args[@]}" --query "[].name" -o tsv | xargs -n1 basename | sort
      ;;
    *) echo "[restore] ERROR: unknown backend: $BACKEND" >&2; exit 2 ;;
  esac
}

# ─── Download one file ────────────────────────────────────────────────────────
download_remote() {
  local name="$1"; local dest="$2"
  case "$BACKEND" in
    local-fs)
      local dir="${BACKUP_REMOTE_LOCAL_DIR}"
      cp "$dir/$name" "$dest"
      ;;
    azure-blob)
      local container="${AZURE_STORAGE_CONTAINER}"
      local prefix="${AZURE_STORAGE_PREFIX:-}"
      local auth_args=()
      if [[ -n "${AZURE_STORAGE_CONNECTION_STRING:-}" ]]; then
        auth_args+=(--connection-string "$AZURE_STORAGE_CONNECTION_STRING")
      else
        auth_args+=(--account-name "${AZURE_STORAGE_ACCOUNT}" --sas-token "${AZURE_STORAGE_SAS_TOKEN}")
      fi
      az storage blob download --container-name "$container" \
        --name "${prefix}${name}" --file "$dest" \
        "${auth_args[@]}" --no-progress >/dev/null
      ;;
  esac
}

# ─── Resolve which file to restore ────────────────────────────────────────────
if [[ "$USE_LATEST" == "true" ]]; then
  REMOTE_NAME=$(list_remote | grep -E '^(daily|weekly)_' | tail -1 || true)
  if [[ -z "$REMOTE_NAME" ]]; then
    log "ERROR: no remote backups found."
    exit 1
  fi
  log "Latest remote backup: $REMOTE_NAME"
fi

if [[ -z "$REMOTE_NAME" ]]; then
  log "ERROR: must specify <remote-filename> or --latest"
  exit 2
fi

LOCAL_PATH="$TMP_DIR/$REMOTE_NAME"
log "Downloading $REMOTE_NAME from $BACKEND → $LOCAL_PATH"
download_remote "$REMOTE_NAME" "$LOCAL_PATH"

if [[ ! -s "$LOCAL_PATH" ]]; then
  log "ERROR: downloaded file is empty: $LOCAL_PATH"
  exit 1
fi

log "Verifying gzip integrity..."
gzip -t "$LOCAL_PATH"

log "Creating target schema: $TARGET_SCHEMA"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -c "CREATE SCHEMA IF NOT EXISTS \"$TARGET_SCHEMA\";" >/dev/null

log "Restoring into schema $TARGET_SCHEMA..."
zcat "$LOCAL_PATH" \
  | sed "s/SET search_path = public/SET search_path = $TARGET_SCHEMA, public/g" \
  | psql "$DATABASE_URL" -v ON_ERROR_STOP=1 >/dev/null

log "Restore complete. Schema: $TARGET_SCHEMA"
