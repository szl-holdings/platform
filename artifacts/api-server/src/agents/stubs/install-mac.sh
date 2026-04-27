#!/usr/bin/env bash
# Sentra EDR Agent — macOS stub
# Usage: bash install-mac.sh --token <enrollment_token> --api <api_base_url>
# Uninstall: bash install-mac.sh --uninstall
set -euo pipefail

SENTRA_DIR="${HOME}/.sentra-agent"
TOKEN_FILE="${SENTRA_DIR}/agent.token"
ID_FILE="${SENTRA_DIR}/agent.id"
PID_FILE="${SENTRA_DIR}/agent.pid"
LOG_FILE="${SENTRA_DIR}/agent.log"
HEARTBEAT_INTERVAL=30
POLL_INTERVAL=10
PFCTL_ANCHOR="com.sentra.isolation"

ENROLLMENT_TOKEN=""
API_BASE=""
UNINSTALL=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --token) ENROLLMENT_TOKEN="$2"; shift 2 ;;
    --api)   API_BASE="$2"; shift 2 ;;
    --uninstall) UNINSTALL=true; shift ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [[ "$UNINSTALL" == "true" ]]; then
  echo "[sentra] uninstalling agent…"
  if command -v pfctl &>/dev/null; then
    sudo pfctl -a "$PFCTL_ANCHOR" -F all 2>/dev/null || true
    echo "[sentra] pfctl anchor $PFCTL_ANCHOR flushed"
  fi
  if [[ -f "$PID_FILE" ]]; then
    OLD_PID=$(cat "$PID_FILE")
    kill "$OLD_PID" 2>/dev/null && echo "[sentra] agent process $OLD_PID stopped" || true
    rm -f "$PID_FILE"
  fi
  rm -rf "$SENTRA_DIR"
  echo "[sentra] uninstall complete"
  exit 0
fi

if [[ -z "$ENROLLMENT_TOKEN" || -z "$API_BASE" ]]; then
  echo "Usage: bash install-mac.sh --token <enrollment_token> --api <api_base_url>" >&2
  exit 1
fi

mkdir -p "$SENTRA_DIR"
chmod 700 "$SENTRA_DIR"

isolate() {
  if ! command -v pfctl &>/dev/null; then
    echo "[sentra] pfctl not available; skipping isolation" >> "$LOG_FILE"
    return 0
  fi
  # Idempotent anchor rule
  printf 'block in all\nblock out all\n' | sudo pfctl -a "$PFCTL_ANCHOR" -f - 2>>"$LOG_FILE"
  sudo pfctl -e 2>>"$LOG_FILE" || true
  echo "[sentra] host isolated via pfctl anchor $PFCTL_ANCHOR" >> "$LOG_FILE"
}

release() {
  if ! command -v pfctl &>/dev/null; then
    echo "[sentra] pfctl not available; skipping release" >> "$LOG_FILE"
    return 0
  fi
  sudo pfctl -a "$PFCTL_ANCHOR" -F all 2>/dev/null || true
  echo "[sentra] host released from pfctl isolation" >> "$LOG_FILE"
}

exchange_token() {
  local hostname os version payload response agent_token agent_id
  hostname=$(hostname -f 2>/dev/null || hostname)
  os="macos"
  version="1.0.0"
  payload=$(printf '{"enrollmentToken":"%s","hostname":"%s","os":"%s","version":"%s"}' \
    "$ENROLLMENT_TOKEN" "$hostname" "$os" "$version")
  response=$(curl -fsSL -X POST \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "${API_BASE}/sentra/agents/exchange" 2>&1) || {
    echo "[sentra] exchange failed: $response" >> "$LOG_FILE"
    return 1
  }
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

run_loop() {
  local agent_token agent_id last_heartbeat=0
  agent_token=$(cat "$TOKEN_FILE")
  agent_id=$(cat "$ID_FILE")
  local hostname os version
  hostname=$(hostname -f 2>/dev/null || hostname)
  os="macos"
  version="1.0.0"

  echo "[sentra] starting loop for agent $agent_id" >> "$LOG_FILE"
  echo $$ > "$PID_FILE"

  while true; do
    local now
    now=$(date +%s)

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
            ack_output="Host isolated via pfctl"
          else
            ack_success="false"; ack_output="pfctl isolation failed"
          fi ;;
        release)
          if release 2>>"$LOG_FILE"; then
            ack_output="Host released from pfctl isolation"
          else
            ack_success="false"; ack_output="pfctl release failed"
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

touch "$LOG_FILE"
echo "[sentra] agent starting on $(date)" >> "$LOG_FILE"

if [[ -f "$TOKEN_FILE" && -f "$ID_FILE" ]]; then
  echo "[sentra] existing token found; skipping exchange" >> "$LOG_FILE"
else
  exchange_token
fi

run_loop &
disown
echo "[sentra] agent running (PID $!). Log: $LOG_FILE"
