#!/usr/bin/env bash
# =============================================================================
# WIRE_FORGE_DISPATCH_ON.sh
# ONE paste to turn Forge's hands-off execution ON. Run AS ROOT on the Hetzner
# box (a-11-oy.com, 167.233.50.75). This is the single founder/box-operator action
# that flips AUTO_STATE.json from  dispatch_mode:none / dispatch_ok:false  to a
# real executing loop, so the pinned NEXT_ORDER.md jobs (jtoken MEASURED, UDS
# recut, box redeploy, chaski standby) actually run instead of being reported.
#
# Built 2026-06-14 (CTO) on top of FORGE_DISPATCH_WIRING.md + WIRE_FORGE_PERSISTENT.sh.
# Hardened 2026-06-15. Fixes the reasons prior wiring kept falling back to "none":
#   (1) the poll SERVICE unit didn't load /etc/forge-perplexity.env  -> drop-in below
#   (2) the runner pointed at a placeholder `forge-agent`             -> see STEP 1/2
#   (3) the runner used `cat | agent` which could exit 141 (SIGPIPE) and look
#       like a dispatch failure -> now feeds stdin directly via `exec`
#
# Doctrine v11: never keystone self-merge, never commit a key, never weaken a gate,
# label `live` only on a real 200. This script NEVER echoes or writes a secret.
#
# USAGE (normal):
#   sudo bash WIRE_FORGE_DISPATCH_ON.sh
# USAGE (force the exact headless agent command — preferred if auto-detect is wrong):
#   sudo FORGE_AGENT_INVOCATION='<your real headless agent, reads order on stdin>' bash WIRE_FORGE_DISPATCH_ON.sh
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# >>> THE ONE THING TO CHECK <<<
# What command launches your Forge/Chaski agent HEADLESSLY on this box (the same
# agent that merged PRs #229/#230/#231 and edits live a11oy code)? It must read
# the order body on STDIN and do the GitHub + box work. Leave blank to auto-detect.
# Examples:
#   FORGE_AGENT_INVOCATION='forge-agent --order - --doctrine v11 --no-keystone-selfmerge --no-secrets'
#   FORGE_AGENT_INVOCATION='/opt/forge/bin/run --stdin-order --doctrine v11'
#   FORGE_AGENT_INVOCATION='claude -p --dangerously-skip-permissions'   # if Forge = Claude Code headless
# ---------------------------------------------------------------------------
FORGE_AGENT_INVOCATION="${FORGE_AGENT_INVOCATION:-}"

ENVF=/etc/forge-perplexity.env
RUNNER=/usr/local/sbin/forge-agent-run

if [ "$(id -u)" -ne 0 ]; then
  echo "!! Run as root:  sudo bash $0" >&2; exit 1
fi

echo "============================================================"
echo "==> STEP 0: diagnose current state"
echo "============================================================"
echo "--- $ENVF FORGE_* lines:"; grep -E '^FORGE_' "$ENVF" 2>/dev/null || echo "  (none yet)"

# Robust unit auto-detection. Try active units, then ALL units, then unit FILES
# (covers a stopped/never-started service and timer naming variants). We resolve
# the SERVICE (the unit the timer actually launches) because that is the unit
# that must load the EnvironmentFile.
detect_unit() {
  # $1 = suffix (service|timer)
  local suffix="$1" hit=""
  hit=$(systemctl list-units --all --type="$suffix" --no-legend 2>/dev/null \
          | awk '{print $1}' | grep -oE "forge-perplexity[^ ]*\.$suffix" | head -1)
  if [ -z "$hit" ]; then
    hit=$(systemctl list-unit-files --type="$suffix" --no-legend 2>/dev/null \
            | awk '{print $1}' | grep -oE "forge-perplexity[^ ]*\.$suffix" | head -1)
  fi
  printf '%s' "$hit"
}
SVC=$(detect_unit service)
TMR=$(detect_unit timer)

# If the timer is found but the service isn't, derive the service from the
# timer's Unit= (or by name convention: foo.timer -> foo.service).
if [ -z "$SVC" ] && [ -n "$TMR" ]; then
  SVC=$(systemctl cat "$TMR" 2>/dev/null | grep -iE '^\s*Unit=' | head -1 | cut -d= -f2- | tr -d ' ')
  [ -z "$SVC" ] && SVC="${TMR%.timer}.service"
fi
# If the service is found but the timer isn't, derive the timer by convention.
if [ -z "$TMR" ] && [ -n "$SVC" ]; then
  if systemctl list-unit-files "${SVC%.service}.timer" >/dev/null 2>&1; then
    TMR="${SVC%.service}.timer"
  fi
fi

POLL=$(command -v forge-perplexity-poll 2>/dev/null || echo /usr/local/sbin/forge-perplexity-poll)
echo "--- poll service : ${SVC:-<not found>}"
echo "--- poll timer   : ${TMR:-<not found>}"
echo "--- poll binary  : ${POLL}"
if [ -n "${SVC:-}" ]; then
  echo "--- service EnvironmentFile / ExecStart:"
  systemctl cat "$SVC" 2>/dev/null | grep -iE 'EnvironmentFile|ExecStart' || true
fi

echo
echo "============================================================"
echo "==> STEP 1: auto-detect the headless agent (if not set above)"
echo "============================================================"
if [ -z "$FORGE_AGENT_INVOCATION" ]; then
  for cand in forge-agent forge-run chaski-agent claude; do
    if command -v "$cand" >/dev/null 2>&1; then
      case "$cand" in
        forge-agent)  FORGE_AGENT_INVOCATION='forge-agent --order - --doctrine v11 --no-keystone-selfmerge --no-secrets' ;;
        forge-run)    FORGE_AGENT_INVOCATION='forge-run --stdin-order --doctrine v11' ;;
        chaski-agent) FORGE_AGENT_INVOCATION='chaski-agent --order - --doctrine v11' ;;
        claude)       FORGE_AGENT_INVOCATION='claude -p --dangerously-skip-permissions' ;;
      esac
      echo "  detected '$cand' on PATH -> using: $FORGE_AGENT_INVOCATION"
      break
    fi
  done
fi
if [ -z "$FORGE_AGENT_INVOCATION" ]; then
  echo "  !! No agent auto-detected on PATH. Defaulting the runner to 'forge-agent ...'."
  echo "     If that command does not exist on this box, the runner will FAIL LOUDLY"
  echo "     (clear error, non-zero exit) — it will NOT silently fall back to none."
  echo "     Re-run with the real command:"
  echo "       sudo FORGE_AGENT_INVOCATION='<your real headless agent>' bash $0"
  FORGE_AGENT_INVOCATION='forge-agent --order - --doctrine v11 --no-keystone-selfmerge --no-secrets'
fi
# First token = the binary that must exist on PATH (used for the success verdict).
AGENT_BIN="${FORGE_AGENT_INVOCATION%% *}"

echo
echo "============================================================"
echo "==> STEP 2: install the dispatch runner"
echo "============================================================"
# The runner receives the NEXT_ORDER.md body on stdin and hands it to the agent.
# Heredoc is UNQUOTED so ${FORGE_AGENT_INVOCATION} expands at INSTALL time (baked
# into the file). Anything that must survive to RUNTIME is backslash-escaped
# (\${AGENT_CMD[...]}). It feeds stdin straight through with `exec` (NOT `cat |`,
# which could raise SIGPIPE/141 and masquerade as a dispatch failure). It FAILS
# LOUDLY (exit 127) if the agent binary is missing — never a silent revert to none.
install -m 0755 /dev/stdin "$RUNNER" <<RUNNER_EOF
#!/usr/bin/env bash
set -euo pipefail
# Generated by WIRE_FORGE_DISPATCH_ON.sh — agent invocation baked in at install time.
AGENT_CMD=( ${FORGE_AGENT_INVOCATION} )
if ! command -v "\${AGENT_CMD[0]}" >/dev/null 2>&1; then
  echo "forge-agent-run: ERROR — agent command '\${AGENT_CMD[0]}' not found on PATH." >&2
  echo "forge-agent-run: set FORGE_AGENT_INVOCATION to the real headless agent and re-run WIRE_FORGE_DISPATCH_ON.sh." >&2
  exit 127
fi
# stdin (the NEXT_ORDER.md body) is passed straight through to the agent.
exec "\${AGENT_CMD[@]}"
RUNNER_EOF
echo "  installed $RUNNER -> ${FORGE_AGENT_INVOCATION}"
# Sanity: the generated runner must be valid bash.
if bash -n "$RUNNER" 2>/dev/null; then
  echo "  runner bash -n: OK"
else
  echo "  !! runner failed bash -n — aborting before touching env/units." >&2
  exit 1
fi

echo
echo "============================================================"
echo "==> STEP 3: persist FORGE_DISPATCH_CMD in the env file (idempotent)"
echo "============================================================"
# Idempotency guard: do not duplicate the line, and do not clobber a DIFFERENT
# working command someone may have set on purpose — only set/repair it to point
# at our runner if it is missing or already points at $RUNNER.
touch "$ENVF"
CUR=$(grep -E '^FORGE_DISPATCH_CMD=' "$ENVF" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '"' || true)
if [ -z "$CUR" ]; then
  echo "FORGE_DISPATCH_CMD=\"$RUNNER\"" >> "$ENVF"
  echo "  added FORGE_DISPATCH_CMD=\"$RUNNER\""
elif [ "$CUR" = "$RUNNER" ]; then
  echo "  FORGE_DISPATCH_CMD already points at $RUNNER (no change)"
else
  echo "  !! FORGE_DISPATCH_CMD is already set to a DIFFERENT command:"
  echo "       $CUR"
  echo "     Leaving it untouched (idempotency guard — not clobbering a working dispatch)."
  echo "     If you intend to switch to this script's runner, edit $ENVF by hand:"
  echo "       FORGE_DISPATCH_CMD=\"$RUNNER\""
fi

echo
echo "============================================================"
echo "==> STEP 4: THE PERSISTENCE FIX — make the poll service load the env file"
echo "============================================================"
# This is why prior wiring reverted to none: the timer-fired SERVICE didn't load
# /etc/forge-perplexity.env, so FORGE_DISPATCH_CMD was lost each tick. The drop-in
# is idempotent (same content every run); we only daemon-reload if it changed.
if [ -n "${SVC:-}" ]; then
  DROPDIR="/etc/systemd/system/${SVC}.d"
  DROPIN="$DROPDIR/10-dispatch-env.conf"
  mkdir -p "$DROPDIR"
  NEWCONF=$(printf '[Service]\nEnvironmentFile=%s\n' "$ENVF")
  if [ -f "$DROPIN" ] && [ "$(cat "$DROPIN")" = "$NEWCONF" ]; then
    echo "  drop-in already correct: $DROPIN (no change)"
  else
    printf '%s\n' "$NEWCONF" > "$DROPIN"
    systemctl daemon-reload
    echo "  drop-in written: $DROPIN (EnvironmentFile=$ENVF); daemon-reloaded"
  fi
else
  echo "  !! poll service not auto-detected — manually add to its unit and reload:"
  echo "       sudo systemctl edit <your-poll>.service   # then add:"
  echo "       [Service]"
  echo "       EnvironmentFile=$ENVF"
  echo "       sudo systemctl daemon-reload"
fi

echo
echo "============================================================"
echo "==> STEP 5: restart timer + fire one poll now"
echo "============================================================"
if [ -n "${TMR:-}" ]; then
  systemctl restart "$TMR" && echo "  restarted $TMR"
fi
echo "  firing one poll (this runs the agent against the pinned NEXT_ORDER.md)..."
set +e
if [ -n "${SVC:-}" ]; then
  systemctl start "$SVC"
else
  "$POLL"
fi
POLLRC=$?
set -e
echo "  poll exit code: $POLLRC"

echo
echo "============================================================"
echo "==> STEP 6: VERIFY dispatch flipped"
echo "============================================================"
sleep 3
echo "--- local env now carries:"
grep -E '^FORGE_DISPATCH_CMD=' "$ENVF" || echo "  (FORGE_DISPATCH_CMD not present!)"

DMODE=""; DOK=""
if command -v gh >/dev/null 2>&1; then
  echo "--- AUTO_STATE.json (fetched fresh from GitHub):"
  STATE_JSON=$(gh api repos/szl-holdings/platform/contents/replit-sync/AUTO_STATE.json \
                 --jq '.content' 2>/dev/null | base64 -d 2>/dev/null || true)
  if [ -n "$STATE_JSON" ]; then
    DMODE=$(printf '%s' "$STATE_JSON" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("dispatch_mode"))' 2>/dev/null || true)
    DOK=$(printf '%s' "$STATE_JSON" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(str(d.get("dispatch_ok")).lower())' 2>/dev/null || true)
    echo "  dispatch_mode: ${DMODE:-?}  |  dispatch_ok: ${DOK:-?}"
  else
    echo "  (could not fetch AUTO_STATE.json via gh — check manually below)"
  fi
else
  echo "  (gh not on this box — verify from anywhere with:)"
  echo "    gh api repos/szl-holdings/platform/contents/replit-sync/AUTO_STATE.json \\"
  echo "      --jq '.content' | base64 -d | python3 -c \\"
  echo "      'import sys,json;d=json.load(sys.stdin);print(d[\"dispatch_mode\"],d[\"dispatch_ok\"])'"
fi

echo
echo "------------------------------ VERDICT ------------------------------"
if [ -n "$DMODE" ] && [ "$DMODE" != "none" ] && [ "$DOK" = "true" ]; then
  echo "SUCCESS: dispatch_mode=$DMODE, dispatch_ok=true — Forge is now EXECUTING the pinned orders."
else
  echo "STILL-NONE: dispatch did not flip (dispatch_mode=${DMODE:-?}, dispatch_ok=${DOK:-?})."
  echo "  Most likely the agent command was wrong/missing. Re-run with the REAL agent:"
  echo "    sudo FORGE_AGENT_INVOCATION='<your real headless agent>' bash $0"
  echo "  (auto-detect candidates: forge-agent | forge-run | chaski-agent | claude)"
  echo "  This run used: $AGENT_BIN"
fi
echo "---------------------------------------------------------------------"
echo
echo "Doctrine v11 held: no keystone self-merge, no committed key, no weakened gate."
echo "Watch it work: energy jtoken panel flips MEASURED, box redeploys, UDS bundle recuts."
echo "============================================================"
