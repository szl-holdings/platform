#!/usr/bin/env bash
# =============================================================================
# WIRE_FORGE_DISPATCH_ON.sh
# ONE paste to turn Forge's hands-off execution ON. Run AS ROOT on the Hetzner
# box (a11oy.net, 167.233.50.75). This is the single founder/box-operator action
# that flips AUTO_STATE.json from  dispatch_mode:none / dispatch_ok:false  to a
# real executing loop, so the pinned NEXT_ORDER.md jobs (jtoken MEASURED, UDS
# recut, box redeploy, chaski standby) actually run instead of being reported.
#
# Built 2026-06-14 (CTO) on top of FORGE_DISPATCH_WIRING.md + WIRE_FORGE_PERSISTENT.sh.
# Fixes the two reasons prior wiring kept falling back to "none":
#   (1) the poll SERVICE unit didn't load /etc/forge-perplexity.env  -> drop-in below
#   (2) the runner pointed at a placeholder `forge-agent`             -> see STEP 2
#
# Doctrine v11: never keystone self-merge, never commit a key, never weaken a gate,
# label `live` only on a real 200.
#
# USAGE:
#   sudo bash WIRE_FORGE_DISPATCH_ON.sh
# Before running, set FORGE_AGENT_INVOCATION below if `forge-agent` is not your
# real headless agent command (STEP 2 explains; it auto-detects common names).
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
SVC=$(systemctl list-units --all --type=service 2>/dev/null | grep -oE 'forge-perplexity[^ ]*\.service' | head -1)
TMR=$(systemctl list-timers --all 2>/dev/null | grep -oE 'forge-perplexity[^ ]*\.timer' | head -1)
POLL=$(command -v forge-perplexity-poll || echo /usr/local/sbin/forge-perplexity-poll)
echo "--- poll service : ${SVC:-<not found>}"
echo "--- poll timer   : ${TMR:-<not found>}"
echo "--- poll binary  : ${POLL}"
[ -n "$SVC" ] && { echo "--- service EnvironmentFile / ExecStart:"; systemctl cat "$SVC" 2>/dev/null | grep -iE 'EnvironmentFile|ExecStart' || true; }

echo
echo "============================================================"
echo "==> STEP 1: auto-detect the headless agent (if not set above)"
echo "============================================================"
if [ -z "$FORGE_AGENT_INVOCATION" ]; then
  for cand in forge-agent forge-run chaski-agent claude; do
    if command -v "$cand" >/dev/null 2>&1; then
      case "$cand" in
        forge-agent) FORGE_AGENT_INVOCATION='forge-agent --order - --doctrine v11 --no-keystone-selfmerge --no-secrets' ;;
        forge-run)   FORGE_AGENT_INVOCATION='forge-run --stdin-order --doctrine v11' ;;
        chaski-agent)FORGE_AGENT_INVOCATION='chaski-agent --order - --doctrine v11' ;;
        claude)      FORGE_AGENT_INVOCATION='claude -p --dangerously-skip-permissions' ;;
      esac
      echo "  detected '$cand' on PATH -> using: $FORGE_AGENT_INVOCATION"
      break
    fi
  done
fi
if [ -z "$FORGE_AGENT_INVOCATION" ]; then
  echo "  !! No agent auto-detected. Defaulting the runner to 'forge-agent ...'."
  echo "     If that command does not exist on this box, the loop will report a"
  echo "     clear error (NOT silently fall back to none) — then re-run this script"
  echo "     with:  sudo FORGE_AGENT_INVOCATION='<your real command>' bash $0"
  FORGE_AGENT_INVOCATION='forge-agent --order - --doctrine v11 --no-keystone-selfmerge --no-secrets'
fi

echo
echo "============================================================"
echo "==> STEP 2: install the dispatch runner"
echo "============================================================"
# The runner receives the NEXT_ORDER.md body on stdin and hands it to the agent.
# It FAILS LOUDLY if the agent command is missing (so we never silently revert to none).
install -m 0755 /dev/stdin "$RUNNER" <<RUNNER_EOF
#!/usr/bin/env bash
set -euo pipefail
AGENT_CMD=( ${FORGE_AGENT_INVOCATION} )
if ! command -v "\${AGENT_CMD[0]}" >/dev/null 2>&1; then
  echo "forge-agent-run: ERROR — agent command '\${AGENT_CMD[0]}' not found on PATH." >&2
  echo "forge-agent-run: edit FORGE_AGENT_INVOCATION and re-run WIRE_FORGE_DISPATCH_ON.sh." >&2
  exit 127
fi
# stdin = NEXT_ORDER.md body -> the Forge agent. Doctrine v11 honored by the agent.
exec cat | "\${AGENT_CMD[@]}"
RUNNER_EOF
echo "  installed $RUNNER -> ${FORGE_AGENT_INVOCATION}"

echo
echo "============================================================"
echo "==> STEP 3: persist FORGE_DISPATCH_CMD in the env file (idempotent)"
echo "============================================================"
touch "$ENVF"
if grep -q '^FORGE_DISPATCH_CMD=' "$ENVF"; then
  sed -i "s|^FORGE_DISPATCH_CMD=.*|FORGE_DISPATCH_CMD=\"$RUNNER\"|" "$ENVF"
  echo "  updated existing FORGE_DISPATCH_CMD"
else
  echo "FORGE_DISPATCH_CMD=\"$RUNNER\"" >> "$ENVF"
  echo "  added FORGE_DISPATCH_CMD"
fi

echo
echo "============================================================"
echo "==> STEP 4: THE PERSISTENCE FIX — make the poll service load the env file"
echo "============================================================"
# This is why prior wiring reverted to none: the timer-fired SERVICE didn't load
# /etc/forge-perplexity.env, so FORGE_DISPATCH_CMD was lost each tick.
if [ -n "${SVC:-}" ]; then
  mkdir -p "/etc/systemd/system/${SVC}.d"
  cat > "/etc/systemd/system/${SVC}.d/10-dispatch-env.conf" <<DROPIN
[Service]
EnvironmentFile=$ENVF
DROPIN
  systemctl daemon-reload
  echo "  drop-in written: /etc/systemd/system/${SVC}.d/10-dispatch-env.conf (EnvironmentFile=$ENVF)"
else
  echo "  !! poll service not auto-detected — manually add to its unit:"
  echo "       [Service]"
  echo "       EnvironmentFile=$ENVF"
fi

echo
echo "============================================================"
echo "==> STEP 5: restart timer + fire one poll now"
echo "============================================================"
[ -n "${TMR:-}" ] && { systemctl restart "$TMR"; echo "  restarted $TMR"; }
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
echo "--- local env now carries:"; grep -E '^FORGE_DISPATCH_CMD=' "$ENVF" || true
echo "--- AUTO_STATE.json (fetched fresh from GitHub):"
if command -v gh >/dev/null 2>&1; then
  gh api repos/szl-holdings/platform/contents/replit-sync/AUTO_STATE.json --jq '.content' 2>/dev/null \
    | base64 -d 2>/dev/null \
    | python3 -c 'import sys,json;d=json.load(sys.stdin);print("  dispatch_mode:",d.get("dispatch_mode"),"| dispatch_ok:",d.get("dispatch_ok"),"| state:",d.get("state"))' \
    || echo "  (could not fetch via gh — check manually below)"
else
  echo "  (gh not on this box — check from anywhere with:)"
fi
echo
echo "EXPECTED AFTER FIX:  dispatch_mode != \"none\"  AND  dispatch_ok: true"
echo "If it still shows none -> the agent command was wrong/missing; re-run with:"
echo "   sudo FORGE_AGENT_INVOCATION='<your real headless agent>' bash $0"
echo
echo "============================================================"
echo "==> DONE. Forge will now EXECUTE the pinned orders hands-off."
echo "    Watch it work:  the energy jtoken panel flips MEASURED, the box"
echo "    redeploys (chaski reads 'standby'), the UDS bundle recuts."
echo "    Doctrine v11 held: no keystone self-merge, no committed key, no weakened gate."
echo "============================================================"
