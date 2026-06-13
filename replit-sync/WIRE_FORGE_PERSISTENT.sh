#!/usr/bin/env bash
# =============================================================================
# WIRE_FORGE_PERSISTENT.sh — make the Forge dispatch wiring SURVIVE restarts.
# Run AS ROOT on the Hetzner box (167.233.50.75).
#
# WHY: dispatch_mode flipped forge-agent-manual->none again (02:36Z ok, 03:04Z
# none). The earlier wiring did not persist — almost certainly because the poll
# SERVICE unit doesn't load /etc/forge-perplexity.env, so FORGE_DISPATCH_CMD is
# lost on the next timer-fired run. This binds it permanently and verifies it.
# Doctrine v11/v12; no secrets written.
# =============================================================================
set -euo pipefail
ENVF=/etc/forge-perplexity.env
RUNNER=/usr/local/sbin/forge-agent-run

echo "==> 0) diagnose current state"
echo "  --- $ENVF FORGE_* lines:"; grep -E '^FORGE_' "$ENVF" 2>/dev/null || echo "  (none)"
SVC=$(systemctl list-units --type=service 2>/dev/null | grep -oE 'forge-perplexity[^ ]*\.service' | head -1)
TMR=$(systemctl list-timers 2>/dev/null | grep -oE 'forge-perplexity[^ ]*\.timer' | head -1)
echo "  --- poll service: ${SVC:-?}   timer: ${TMR:-?}"
[ -n "$SVC" ] && { echo "  --- service unit EnvironmentFile?"; systemctl cat "$SVC" 2>/dev/null | grep -iE 'EnvironmentFile|ExecStart' || true; }

echo "==> 1) install the runner (EDIT the agent line to your real headless Chaski launch)"
install -m 0755 /dev/stdin "$RUNNER" <<'RUNNER_EOF'
#!/usr/bin/env bash
set -euo pipefail
# stdin = NEXT_ORDER.md body. >>> EDIT the next line to your actual headless agent <<<
cat | forge-agent --order - --doctrine v11 --no-keystone-selfmerge --no-secrets
RUNNER_EOF

echo "==> 2) persist FORGE_DISPATCH_CMD in the env file (idempotent)"
touch "$ENVF"
grep -q '^FORGE_DISPATCH_CMD=' "$ENVF" || echo "FORGE_DISPATCH_CMD=\"$RUNNER\"" >> "$ENVF"

echo "==> 3) THE FIX — make the poll SERVICE load the env file (the missing persistence link)"
if [ -n "${SVC:-}" ]; then
  mkdir -p "/etc/systemd/system/${SVC}.d"
  cat > "/etc/systemd/system/${SVC}.d/10-dispatch-env.conf" <<DROPIN
[Service]
EnvironmentFile=$ENVF
DROPIN
  systemctl daemon-reload
  echo "  drop-in written: /etc/systemd/system/${SVC}.d/10-dispatch-env.conf"
else
  echo "  !! could not auto-detect the poll service name — set EnvironmentFile=$ENVF on it manually."
fi

echo "==> 4) restart timer AND fire one poll now"
[ -n "${TMR:-}" ] && systemctl restart "$TMR"
[ -n "${SVC:-}" ] && systemctl start "$SVC" || true

echo "==> 5) VERIFY it persisted (this is the proof): after the next poll, AUTO_STATE.json"
echo "    replit-sync/AUTO_STATE.json should show dispatch_mode != none, dispatch_ok: true."
echo "    Check: grep -E 'dispatch_mode|dispatch_ok' on the committed AUTO_STATE.json after ~1 poll."
echo "DONE. If dispatch_mode is STILL none next poll, the poll reads env from a different path —"
echo "paste 'systemctl cat $SVC' output and we'll point EnvironmentFile at the right file."
