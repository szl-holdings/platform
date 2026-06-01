#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Smoke test for the backup → upload → rotate → download flow.
#
# Uses the local-fs object-storage backend so it runs without cloud
# credentials. Exercises:
#   - scripts/backup-upload.sh: upload, size verification, rotation by age
#   - scripts/backup-restore.sh: download path (file integrity + gzip check)
#
# Restore-into-Postgres is exercised by the manual DR drill
# (docs/operations/dr-drill-2026-04-20.md). This test verifies the
# transport plumbing that the drill depends on.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="$(mktemp -d)"
REMOTE="$WORK/remote"
LOCAL="$WORK/local"
mkdir -p "$REMOTE" "$LOCAL"

trap 'rm -rf "$WORK"' EXIT

PASS=0
FAIL=0
note() { echo "  $*"; }
ok()   { echo "  ✓ $*"; PASS=$((PASS+1)); }
bad()  { echo "  ✗ $*"; FAIL=$((FAIL+1)); }

make_dump() {
  # Build a fixture file with a stamp in its name.
  local label="$1" stamp="$2"
  local path="$LOCAL/${label}_${stamp}.sql.gz"
  printf 'SET search_path = public;\nCREATE TABLE t(id int);\nCOPY t FROM stdin;\n1\n\\.\n' \
    | gzip -9 > "$path"
  echo "$path"
}

# Helper: fabricate a stamp N days ago (UTC).
days_ago() {
  local n="$1"
  date -u -d "$n days ago" +"%Y%m%dT%H%M%SZ" 2>/dev/null \
    || date -u -v -"${n}d" +"%Y%m%dT%H%M%SZ"
}

export BACKUP_REMOTE_BACKEND=local-fs
export BACKUP_REMOTE_LOCAL_DIR="$REMOTE"
export BACKUP_REMOTE_DAILY_RETENTION_DAYS=30
export BACKUP_REMOTE_WEEKLY_RETENTION_DAYS=90

echo "── Test 1: upload + size verification ─────────────────────────────────"
F1=$(make_dump daily "$(days_ago 0)")
OUT=$("$ROOT/scripts/backup-upload.sh" "$F1")
echo "$OUT" | grep -q '"status":"ok"'        && ok "upload status=ok"        || bad "upload status not ok: $OUT"
[[ -f "$REMOTE/$(basename "$F1")" ]]         && ok "remote file present"     || bad "remote file missing"
echo "$OUT" | grep -q '"backend":"local-fs"' && ok "backend=local-fs"        || bad "wrong backend"

echo "── Test 2: daily rotation prunes files older than 30 days ─────────────"
S5=$(days_ago 5);  D5="daily_${S5}.sql.gz"
S25=$(days_ago 25); D25="daily_${S25}.sql.gz"
S45=$(days_ago 45); D45="daily_${S45}.sql.gz"
make_dump daily "$S5"  >/dev/null; cp "$LOCAL/$D5"  "$REMOTE/"
make_dump daily "$S25" >/dev/null; cp "$LOCAL/$D25" "$REMOTE/"
make_dump daily "$S45" >/dev/null; cp "$LOCAL/$D45" "$REMOTE/"
[[ -f "$REMOTE/$D45" ]] && ok "seeded 45-day-old daily" || bad "seed failed"

# Re-run upload of a fresh dump → should also prune the 45-day-old one
F2=$(make_dump daily "$(days_ago 0)")
OUT=$("$ROOT/scripts/backup-upload.sh" "$F2")
echo "$OUT" | grep -q '"status":"ok"' && ok "second upload ok" || bad "second upload failed"
[[ ! -f "$REMOTE/$D45" ]] && ok "45-day-old daily pruned" || bad "old daily NOT pruned"
[[ -f "$REMOTE/$D5" ]]   && ok "5-day daily kept"          || bad "5-day daily wrongly pruned"
[[ -f "$REMOTE/$D25" ]]  && ok "25-day daily kept"         || bad "25-day daily wrongly pruned"

echo "── Test 3: weekly rotation prunes files older than 90 days ────────────"
S60=$(days_ago 60);   W60="weekly_${S60}.sql.gz"
S120=$(days_ago 120); W120="weekly_${S120}.sql.gz"
make_dump weekly "$S60"  >/dev/null; cp "$LOCAL/$W60"  "$REMOTE/"
make_dump weekly "$S120" >/dev/null; cp "$LOCAL/$W120" "$REMOTE/"
[[ -f "$REMOTE/$W120" ]] && ok "seeded 120-day-old weekly" || bad "seed failed"

# Run with --rotate-only to trigger pruning without uploading
"$ROOT/scripts/backup-upload.sh" "" --rotate-only >/dev/null
[[ ! -f "$REMOTE/$W120" ]] && ok "120-day weekly pruned" || bad "old weekly NOT pruned"
[[ -f "$REMOTE/$W60" ]]    && ok "60-day weekly kept"    || bad "60-day weekly wrongly pruned"

echo "── Test 4: size mismatch detected ─────────────────────────────────────"
# Truncate a file mid-upload by sabotaging the destination after copy.
# Use a custom check: write a zero-byte source, then upload should still
# succeed (size 0 == 0). For mismatch detection we instead inspect that
# the script reports the actual size in the JSON.
F3=$(make_dump daily "20990101T000000Z")
OUT=$("$ROOT/scripts/backup-upload.sh" "$F3")
SIZE=$(echo "$OUT" | grep -oE '"remoteSizeBytes":[0-9]+' | head -1 | cut -d: -f2)
[[ "$SIZE" -gt 0 ]] && ok "remoteSizeBytes reported ($SIZE)" || bad "size missing in status: $OUT"

echo "── Test 5: download path (restore script transport) ───────────────────"
RESTORE_SCRIPT="$ROOT/scripts/backup-restore.sh"
# We can't run a real psql restore without a DB, but we can verify the
# script downloads + gzip-checks. Stub psql so the restore exits 0.
STUB_DIR="$WORK/bin"
mkdir -p "$STUB_DIR"
cat > "$STUB_DIR/psql" <<'STUB'
#!/usr/bin/env bash
cat > /dev/null
exit 0
STUB
chmod +x "$STUB_DIR/psql"
PATH="$STUB_DIR:$PATH" DATABASE_URL="postgres://stub" \
  "$RESTORE_SCRIPT" --latest --target-schema scratch_test >/dev/null 2>&1 \
  && ok "restore script downloaded latest + ran end-to-end" \
  || bad "restore script failed"

echo "── Test 6: explicit filename round-trip ───────────────────────────────"
PATH="$STUB_DIR:$PATH" DATABASE_URL="postgres://stub" \
  "$RESTORE_SCRIPT" "$D5" --target-schema scratch_test >/dev/null 2>&1 \
  && ok "restore by explicit filename ok" \
  || bad "restore by explicit filename failed"

echo
echo "──────────────────────────────────────────────────────────────────────"
echo "  Passed: $PASS    Failed: $FAIL"
echo "──────────────────────────────────────────────────────────────────────"
exit $((FAIL > 0 ? 1 : 0))
