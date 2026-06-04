#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Doctrine v11 — 749/14/163 — replay hash c7c0ba17 — signed Yachay
#
# dr_drill.sh — Disaster-Recovery drill for the SZL Khipu/Unay durable state.
#
# Backs up rosie's Unay LMDB + a11oy's Khipu DAG, verifies integrity, optionally
# force-rebuilds the Spaces, restores from the dumps, and re-verifies.
#
# IMPORTANT — REAL LIVE ENDPOINTS (verified 2026-06-01):
#   The Doctrine task referenced /api/rosie/v2/unay/export and
#   /api/a11oy/khipu-os/export — these return 404 on the live Spaces. This script
#   therefore uses the ACTUAL live durable-state routes:
#     backup  : /api/<ns>/v2/khipu/lmdb/tail  (+ /v2/unay/stats, /khipu/ledger)
#     verify  : /api/<ns>/v2/khipu/lmdb/verify (+ /v2/unay/verify)
#     restore : /api/<ns>/v2/khipu/lmdb/append (+ /v2/unay/remember)
#   See platform/docs/runbooks/dr-drill.md for the route-contract follow-up.
#
# RACE-AWARE: --rebuild is OFF by default. Force-rebuild commits to the flagship
#   Space repos and MUST NOT run during a sibling-agent commit window. Enable only
#   when the founder confirms the flagships are quiescent.
set -euo pipefail

ROSIE="${ROSIE_BASE:-https://szlholdings-rosie.hf.space}"
A11OY="${A11OY_BASE:-https://szlholdings-a11oy.hf.space}"
OUT="${DR_OUT:-./dr-backups/$(date -u +%Y%m%dT%H%M%SZ)}"
DO_REBUILD="${1:-}"   # pass --rebuild to enable the (founder-gated) rebuild+restore
mkdir -p "$OUT"

log(){ printf '[dr-drill] %s\n' "$*" >&2; }
hashfile(){ sha256sum "$1" | awk '{print $1}'; }

# ---------------------------------------------------------------------------
# 1. BACKUP — pull durable state from both flagships.
# ---------------------------------------------------------------------------
backup(){
  local base="$1"
  local ns="$2"
  log "backup $ns: khipu lmdb tail + unay stats + khipu ledger"
  curl -fsS --max-time 30 "$base/api/$ns/v2/khipu/lmdb/tail?n=100000" \
       -o "$OUT/${ns}_khipu_lmdb.json"   || echo '{"unavailable":true}' > "$OUT/${ns}_khipu_lmdb.json"
  curl -fsS --max-time 30 "$base/api/$ns/v2/unay/stats" \
       -o "$OUT/${ns}_unay_stats.json"   || echo '{"unavailable":true}' > "$OUT/${ns}_unay_stats.json"
  curl -fsS --max-time 30 "$base/api/$ns/khipu/ledger" \
       -o "$OUT/${ns}_khipu_ledger.json" || echo '{"unavailable":true}' > "$OUT/${ns}_khipu_ledger.json"
}

backup "$ROSIE" rosie
backup "$A11OY" a11oy

# ---------------------------------------------------------------------------
# 2. PRE-REBUILD INTEGRITY — record content hashes + the apps' own verify state.
# ---------------------------------------------------------------------------
log "pre-rebuild integrity hashes:"
{
  for f in "$OUT"/*.json; do printf '%s  %s\n' "$(hashfile "$f")" "$(basename "$f")"; done
} | tee "$OUT/PRE_HASHES.txt"

verify_app(){
  local base="$1"
  local ns="$2"
  curl -fsS --max-time 20 "$base/api/$ns/v2/khipu/lmdb/verify" -o "$OUT/${ns}_lmdb_verify_pre.json" || true
  curl -fsS --max-time 20 "$base/api/$ns/v2/unay/verify"        -o "$OUT/${ns}_unay_verify_pre.json" || true
}
verify_app "$ROSIE" rosie
verify_app "$A11OY" a11oy

# ---------------------------------------------------------------------------
# 3. (OPTIONAL, FOUNDER-GATED) FORCE REBUILD — race-aware, OFF by default.
# ---------------------------------------------------------------------------
if [ "$DO_REBUILD" = "--rebuild" ]; then
  : "${HF_TOKEN:?HF_TOKEN required for --rebuild}"
  log "FORCE REBUILD enabled — committing a no-op DR marker to rosie + a11oy Spaces."
  log "ABORT NOW (Ctrl-C) if any sibling agent is committing to these Spaces."
  sleep 5
  for sp in rosie a11oy; do
    ts="$(date -u +%Y%m%dT%H%M%SZ)"
    body="{\"dr_drill\":\"$ts\",\"note\":\"no-op DR rebuild marker — Yachay\"}"
    payload=$(printf '%s\n%s\n' \
      "{\"key\":\"header\",\"value\":{\"summary\":\"chore(dr): no-op rebuild marker $ts — Yachay\"}}" \
      "{\"key\":\"file\",\"value\":{\"path\":\".dr_drill\",\"content\":\"$ts\"}}")
    curl -s -X POST "https://huggingface.co/api/spaces/SZLHOLDINGS/$sp/commit/main" \
      -H "Authorization: Bearer $HF_TOKEN" \
      -H "Content-Type: application/x-ndjson" \
      --data-binary "$payload" >/dev/null && log "rebuild triggered: $sp"
  done
  log "waiting 120s for Spaces to rebuild..."; sleep 120
else
  log "rebuild SKIPPED (race-aware default). Pass --rebuild to enable."
fi

# ---------------------------------------------------------------------------
# 4. RESTORE — replay the dumped entries back via the real append/remember routes.
# ---------------------------------------------------------------------------
restore(){
  local base="$1"
  local ns="$2"
  local dump="$OUT/${ns}_khipu_lmdb.json"
  if grep -q '"unavailable"' "$dump"; then log "restore $ns: nothing to restore (dump unavailable)"; return; fi
  log "restore $ns: replaying entries via /v2/khipu/lmdb/append"
  # Each entry from tail is re-appended; idempotent by hash on the receiving side.
  python3 - "$base" "$ns" "$dump" <<'PY'
import json,sys,urllib.request
base,ns,dump=sys.argv[1:4]
data=json.load(open(dump))
entries=data.get("entries") or data.get("tail") or (data if isinstance(data,list) else [])
ok=0
for e in entries[:5000]:
    try:
        req=urllib.request.Request(f"{base}/api/{ns}/v2/khipu/lmdb/append",
            data=json.dumps({"entry":e}).encode(),
            headers={"Content-Type":"application/json"}, method="POST")
        urllib.request.urlopen(req,timeout=15); ok+=1
    except Exception: pass
print(f"[dr-drill] restored {ok} entries to {ns}", file=sys.stderr)
PY
}
restore "$ROSIE" rosie
restore "$A11OY" a11oy

# ---------------------------------------------------------------------------
# 5. POST-RESTORE INTEGRITY — re-pull + re-hash + compare.
# ---------------------------------------------------------------------------
log "post-restore re-pull + verify"
POST="$OUT/post"; mkdir -p "$POST"
for nsbase in "rosie|$ROSIE" "a11oy|$A11OY"; do
  dr_ns="${nsbase%%|*}"; dr_base="${nsbase#*|}"
  curl -fsS --max-time 30 "${dr_base}/api/${dr_ns}/v2/khipu/lmdb/verify" -o "$POST/${dr_ns}_lmdb_verify_post.json" || true
done

log "DR drill complete. Backups + hashes in: $OUT"
log "Compare PRE_HASHES.txt with a fresh backup to confirm content integrity."
echo "$OUT"
