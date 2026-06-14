#!/usr/bin/env bash
# mesh_join.sh — SZL Sovereign GPU Mesh node-join + auto-detect probe.
#
# WHAT IT DOES (idempotent, safe to re-run):
#   1. Ensures tailscale is installed and the node is up on the betterwithage tailnet.
#   2. Probes the GPU with nvidia-smi (handles the NO-GPU case gracefully).
#   3. Writes a node-capability JSON: hostname, tailscale_ip, gpu_name, vram_mb, role, label.
#   4. Registers that capability with the coordinator (best-effort; also drops a local copy
#      into a shared dir so mesh_serve.py can read it even if the network register fails).
#
# DOCTRINE: never writes a secret to the JSON or to disk. The Tailscale auth key and the
# coordinator token come ONLY from the environment. Capability JSON carries NO secrets.
# Models are not selected here — the coordinator computes placement from detected VRAM.
#
# ENV (all optional except where noted):
#   TS_AUTHKEY            Tailscale auth key (env-only; NEVER committed). If unset, falls
#                         back to interactive `tailscale up`.
#   TS_HOSTNAME           Override the tailscale hostname (default: system hostname).
#   COORDINATOR_URL       e.g. http://100.x.y.z:8080  (coordinator over the tailnet).
#   COORDINATOR_TOKEN     bearer token for /register (env-only; NEVER committed).
#   CAP_DIR               where capability JSONs live (default: /var/lib/szl-mesh/caps).
#   FORCE_ROLE            optionally pin a role (coordinator|proxy|cpu) — otherwise computed.
#
# EXIT: 0 on success (capability written), non-zero only on unrecoverable error.

set -euo pipefail

# ---------- config ----------
CAP_DIR="${CAP_DIR:-/var/lib/szl-mesh/caps}"
TS_HOSTNAME="${TS_HOSTNAME:-$(hostname -s 2>/dev/null || hostname)}"
TAILNET_TAG="tag:szl-mesh"            # ACL tag; harmless if not configured server-side
LABEL="LIVE"                          # this run probed real hardware → LIVE
log() { printf '[mesh_join] %s\n' "$*" >&2; }

mkdir -p "$CAP_DIR"

# ---------- 1. tailscale install (idempotent) ----------
ensure_tailscale() {
  if command -v tailscale >/dev/null 2>&1; then
    log "tailscale present: $(tailscale version | head -n1)"
    return 0
  fi
  log "tailscale not found — installing via official script"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL https://tailscale.com/install.sh | sh
  else
    log "ERROR: curl missing; install tailscale manually, then re-run." ; return 1
  fi
}

# ---------- 1b. tailscale up (idempotent) ----------
ensure_tailnet() {
  # Already up with an IP? Then we're joined; do nothing destructive.
  local existing
  existing="$(tailscale ip -4 2>/dev/null | head -n1 || true)"
  if [ -n "$existing" ]; then
    log "already on tailnet as $existing — not re-authing"
    return 0
  fi
  if [ -n "${TS_AUTHKEY:-}" ]; then
    log "joining tailnet with provided auth key (env-only, not logged)"
    sudo tailscale up --authkey "${TS_AUTHKEY}" --hostname "${TS_HOSTNAME}" \
         --advertise-tags="${TAILNET_TAG}" --accept-routes || {
      log "tagged auth failed (tag may be unconfigured) — retrying untagged"
      sudo tailscale up --authkey "${TS_AUTHKEY}" --hostname "${TS_HOSTNAME}" --accept-routes
    }
  else
    log "no TS_AUTHKEY in env — falling back to interactive tailscale up"
    sudo tailscale up --hostname "${TS_HOSTNAME}" --accept-routes
  fi
}

get_ts_ip() {
  tailscale ip -4 2>/dev/null | head -n1
}

# ---------- 2. GPU probe (graceful no-GPU) ----------
# Echoes "GPU_NAME|VRAM_MB|CC". On no GPU echoes "|0|".
probe_gpu() {
  if ! command -v nvidia-smi >/dev/null 2>&1; then
    log "nvidia-smi absent → CPU node"
    printf '|0|'
    return 0
  fi
  local out
  if ! out="$(nvidia-smi --query-gpu=name,memory.total,compute_cap \
              --format=csv,noheader,nounits 2>/dev/null)"; then
    log "nvidia-smi present but query failed (no usable GPU / driver issue) → CPU node"
    printf '|0|'
    return 0
  fi
  if [ -z "$out" ]; then
    log "nvidia-smi returned no rows → CPU node"
    printf '|0|'
    return 0
  fi
  # Sum VRAM across all GPUs on the box; take the first GPU name + compute cap as label.
  local total=0 name="" cc=""
  while IFS=',' read -r g_name g_mem g_cc; do
    g_name="$(echo "$g_name" | sed 's/^ *//;s/ *$//')"
    g_mem="$(echo "$g_mem"  | sed 's/[^0-9]//g')"
    g_cc="$(echo  "$g_cc"   | sed 's/^ *//;s/ *$//')"
    [ -z "$g_mem" ] && g_mem=0
    total=$(( total + g_mem ))
    [ -z "$name" ] && name="$g_name"
    [ -z "$cc" ]   && cc="$g_cc"
  done <<< "$out"
  log "detected GPU(s): ${name} cc=${cc} total_vram=${total}MB"
  printf '%s|%s|%s' "$name" "$total" "$cc"
}

# ---------- 3. role decision (tier computed by coordinator; this is a coarse self-role) ----------
decide_role() {
  local vram="$1"
  if [ -n "${FORCE_ROLE:-}" ]; then echo "$FORCE_ROLE"; return; fi
  if [ "$vram" -ge 1 ] 2>/dev/null; then
    echo "gpu-worker"          # exact tier (T1/T2/T3) is computed by mesh_serve.py
  else
    echo "cpu"                 # orchestration / proxy / k3d-UDS / redundancy
  fi
}

# ---------- main ----------
ensure_tailscale
ensure_tailnet

TS_IP="$(get_ts_ip || true)"
if [ -z "$TS_IP" ]; then
  log "WARNING: could not read tailscale IP; recording empty (coordinator will reject until set)"
  TS_IP=""
fi

PROBE="$(probe_gpu)"
GPU_NAME="${PROBE%%|*}"
REST="${PROBE#*|}"
VRAM_MB="${REST%%|*}"
CC="${REST#*|}"
[ -z "$VRAM_MB" ] && VRAM_MB=0
ROLE="$(decide_role "$VRAM_MB")"
[ -z "$GPU_NAME" ] && GPU_NAME="none"
[ -z "$CC" ] && CC="none"

TS_NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
CAP_FILE="${CAP_DIR}/${TS_HOSTNAME}.json"

# Write capability JSON (NO secrets). Atomic via temp + mv (idempotent overwrite).
TMP="$(mktemp "${CAP_DIR}/.${TS_HOSTNAME}.XXXXXX")"
cat > "$TMP" <<EOF
{
  "hostname": "${TS_HOSTNAME}",
  "tailscale_ip": "${TS_IP}",
  "gpu_name": "${GPU_NAME}",
  "vram_mb": ${VRAM_MB},
  "compute_capability": "${CC}",
  "role": "${ROLE}",
  "label": "${LABEL}",
  "reported_at": "${TS_NOW}",
  "schema": "szl-mesh.capability/v1"
}
EOF
mv -f "$TMP" "$CAP_FILE"
log "wrote capability: $CAP_FILE"
cat "$CAP_FILE" >&2

# ---------- 4. register with coordinator (best-effort, non-fatal) ----------
if [ -n "${COORDINATOR_URL:-}" ]; then
  log "registering with coordinator at ${COORDINATOR_URL}/register"
  AUTH_HDR=()
  [ -n "${COORDINATOR_TOKEN:-}" ] && AUTH_HDR=(-H "Authorization: Bearer ${COORDINATOR_TOKEN}")
  if curl -fsS --max-time 10 "${AUTH_HDR[@]}" \
       -H "Content-Type: application/json" \
       -X POST "${COORDINATOR_URL%/}/register" \
       --data-binary "@${CAP_FILE}" >/dev/null 2>&1; then
    log "registered OK"
  else
    log "register failed (coordinator down or unreachable) — local capability JSON still written; "
    log "coordinator can read ${CAP_FILE} from the shared CAP_DIR on next plan. Non-fatal."
  fi
else
  log "no COORDINATOR_URL set — skipping network register; local capability JSON is authoritative for now"
fi

log "DONE. role=${ROLE} vram_mb=${VRAM_MB} ip=${TS_IP}"
exit 0
