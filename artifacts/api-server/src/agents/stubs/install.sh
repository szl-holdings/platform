#!/usr/bin/env bash
# Sentra EDR Agent — Linux stub
# Usage: bash install.sh --token <enrollment_token> --api <api_base_url>
# Uninstall: bash install.sh --uninstall
set -euo pipefail

SENTRA_DIR="${HOME}/.sentra-agent"
TOKEN_FILE="${SENTRA_DIR}/agent.token"
ID_FILE="${SENTRA_DIR}/agent.id"
PID_FILE="${SENTRA_DIR}/agent.pid"
LOG_FILE="${SENTRA_DIR}/agent.log"
HEARTBEAT_INTERVAL=30  # seconds
POLL_INTERVAL=10       # seconds
RULE_COMMENT="sentra-agent-isolation"

ENROLLMENT_TOKEN=""
API_BASE=""
UNINSTALL=false

# ── Argument parsing ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --token) ENROLLMENT_TOKEN="$2"; shift 2 ;;
    --api)   API_BASE="$2"; shift 2 ;;
    --uninstall) UNINSTALL=true; shift ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

# ── Uninstall path ────────────────────────────────────────────────────────────
if [[ "$UNINSTALL" == "true" ]]; then
  echo "[sentra] uninstalling agent…"
  # Remove firewall isolation rules if present
  if command -v iptables &>/dev/null; then
    iptables -D INPUT -m comment --comment "$RULE_COMMENT" -j DROP 2>/dev/null || true
    iptables -D OUTPUT -m comment --comment "$RULE_COMMENT" -j DROP 2>/dev/null || true
    echo "[sentra] iptables rules removed"
  fi
  # Kill running agent if PID file exists
  if [[ -f "$PID_FILE" ]]; then
    OLD_PID=$(cat "$PID_FILE")
    kill "$OLD_PID" 2>/dev/null && echo "[sentra] agent process $OLD_PID stopped" || true
    rm -f "$PID_FILE"
  fi
  rm -rf "$SENTRA_DIR"
  echo "[sentra] uninstall complete"
  exit 0
fi

# ── Validate required args ────────────────────────────────────────────────────
if [[ -z "$ENROLLMENT_TOKEN" || -z "$API_BASE" ]]; then
  echo "Usage: bash install.sh --token <enrollment_token> --api <api_base_url>" >&2
  exit 1
fi

mkdir -p "$SENTRA_DIR"
chmod 700 "$SENTRA_DIR"

# ── Firewall helpers ──────────────────────────────────────────────────────────
isolate() {
  if ! command -v iptables &>/dev/null; then
    echo "[sentra] iptables not available; skipping isolation" >> "$LOG_FILE"
    return 0
  fi
  # Idempotent: check before adding
  if ! iptables -C INPUT -m comment --comment "$RULE_COMMENT" -j DROP 2>/dev/null; then
    iptables -A INPUT  -m comment --comment "$RULE_COMMENT" -j DROP
    iptables -A OUTPUT -m comment --comment "$RULE_COMMENT" -j DROP
    echo "[sentra] host isolated via iptables" >> "$LOG_FILE"
  else
    echo "[sentra] isolation rules already present" >> "$LOG_FILE"
  fi
}

release() {
  if ! command -v iptables &>/dev/null; then
    echo "[sentra] iptables not available; skipping release" >> "$LOG_FILE"
    return 0
  fi
  iptables -D INPUT  -m comment --comment "$RULE_COMMENT" -j DROP 2>/dev/null || true
  iptables -D OUTPUT -m comment --comment "$RULE_COMMENT" -j DROP 2>/dev/null || true
  echo "[sentra] host released from iptables isolation" >> "$LOG_FILE"
}

# ── Enrollment token exchange ─────────────────────────────────────────────────
exchange_token() {
  local hostname os
  hostname=$(hostname -f 2>/dev/null || hostname)
  os="linux"
  local version="1.0.0"
  local payload
  payload=$(printf '{"enrollmentToken":"%s","hostname":"%s","os":"%s","version":"%s"}' \
    "$ENROLLMENT_TOKEN" "$hostname" "$os" "$version")
  local response
  response=$(curl -fsSL -X POST \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "${API_BASE}/sentra/agents/exchange" 2>&1) || {
    echo "[sentra] exchange failed: $response" >> "$LOG_FILE"
    return 1
  }
  local agent_token agent_id
  agent_token=$(echo "$response" | grep -o '"agentToken":"[^"]*"' | cut -d'"' -f4)
  agent_id=$(echo "$response"    | grep -o '"agentId":"[^"]*"'    | cut -d'"' -f4)
  if [[ -z "$agent_token" || -z "$agent_id" ]]; then
    echo "[sentra] exchange response missing fields: $response" >> "$LOG_FILE"
    return 1
  fi
  echo "$agent_token" > "$TOKEN_FILE"
  echo "$agent_id"    > "$ID_FILE"
  chmod 600 "$TOKEN_FILE" "$ID_FILE"
  echo "[sentra] enrolled as $agent_id" >> "$LOG_FILE"
}

# ── Main heartbeat + poll loop ────────────────────────────────────────────────
run_loop() {
  local agent_token agent_id last_heartbeat=0
  agent_token=$(cat "$TOKEN_FILE")
  agent_id=$(cat "$ID_FILE")
  local hostname os version
  hostname=$(hostname -f 2>/dev/null || hostname)
  os="linux"
  version="1.0.0"

  echo "[sentra] starting loop for agent $agent_id" >> "$LOG_FILE"
  echo $$ > "$PID_FILE"

  while true; do
    local now
    now=$(date +%s)

    # Heartbeat every HEARTBEAT_INTERVAL seconds
    if (( now - last_heartbeat >= HEARTBEAT_INTERVAL )); then
      local hb_payload
      hb_payload=$(printf '{"hostname":"%s","os":"%s","version":"%s"}' "$hostname" "$os" "$version")
      curl -fsSL -X POST \
        -H "Authorization: Bearer $agent_token" \
        -H "Content-Type: application/json" \
        -d "$hb_payload" \
        "${API_BASE}/sentra/agents/heartbeat" >> "$LOG_FILE" 2>&1 || true
      last_heartbeat=$now
    fi

    # Poll for commands
    local poll_response cmd_id cmd_kind
    poll_response=$(curl -fsSL \
      -H "Authorization: Bearer $agent_token" \
      "${API_BASE}/sentra/agents/poll" 2>/dev/null) || { sleep "$POLL_INTERVAL"; continue; }
    cmd_id=$(echo "$poll_response"   | grep -o '"id":"[^"]*"'   | head -1 | cut -d'"' -f4)
    cmd_kind=$(echo "$poll_response" | grep -o '"kind":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [[ -n "$cmd_id" && -n "$cmd_kind" ]]; then
      echo "[sentra] received command $cmd_kind ($cmd_id)" >> "$LOG_FILE"
      local ack_success="true" ack_output=""
      case "$cmd_kind" in
        isolate)
          if isolate 2>>"$LOG_FILE"; then
            ack_output="Host isolated via iptables"
          else
            ack_success="false"; ack_output="iptables isolation failed"
          fi ;;
        release)
          if release 2>>"$LOG_FILE"; then
            ack_output="Host released from isolation"
          else
            ack_success="false"; ack_output="iptables release failed"
          fi ;;
        uninstall)
          ack_output="Uninstall acknowledged; stopping agent"
          ack_success="true" ;;
        *)
          ack_success="false"; ack_output="Unknown command: $cmd_kind" ;;
      esac
      local ack_payload
      ack_payload=$(printf '{"success":%s,"output":"%s"}' "$ack_success" "$ack_output")
      curl -fsSL -X POST \
        -H "Authorization: Bearer $agent_token" \
        -H "Content-Type: application/json" \
        -d "$ack_payload" \
        "${API_BASE}/sentra/agents/commands/${cmd_id}/ack" >> "$LOG_FILE" 2>&1 || true
      if [[ "$cmd_kind" == "uninstall" ]]; then
        bash "$0" --uninstall
        exit 0
      fi
    fi

    sleep "$POLL_INTERVAL"
  done
}

# ── Entry point ───────────────────────────────────────────────────────────────
touch "$LOG_FILE"
echo "[sentra] agent starting on $(date)" >> "$LOG_FILE"

if [[ -f "$TOKEN_FILE" && -f "$ID_FILE" ]]; then
  echo "[sentra] existing token found; skipping exchange" >> "$LOG_FILE"
else
  exchange_token
fi

# Run in background
run_loop &
disown
echo "[sentra] agent running (PID $!). Log: $LOG_FILE"
