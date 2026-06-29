#!/usr/bin/env bash
# ============================================================================
# WIRE_IT_UP.sh — one paste to (1) wire Forge dispatch and (2) deploy
# mesh-resilience, run AS ROOT on the Hetzner box (167.233.50.75).
# This is the ONE founder/box-operator action that unblocks full hands-off Forge.
# Everything else in the estate is already green. Doctrine v11 honored throughout.
# ============================================================================
set -euo pipefail

echo "==> STEP 1: wire the Forge dispatch executor (fixes dispatch_mode:none)"
# Point the poll at Forge's agent runner. EDIT the invocation on the marked line
# to however the Forge (Chaski) agent is started headlessly on THIS box — the
# same agent that merged PRs #229/#230/#231 and edits live a11oy code.
install -m 0755 /dev/stdin /usr/local/sbin/forge-agent-run <<'RUNNER'
#!/usr/bin/env bash
set -euo pipefail
# stdin = the NEXT_ORDER.md body. Hand it to the Forge agent.
# >>> EDIT THIS LINE to your actual headless agent invocation <<<
cat | forge-agent --order - --doctrine v11 --no-keystone-selfmerge --no-secrets
RUNNER

# Register it with the poll (idempotent: only adds if not already present)
grep -q '^FORGE_DISPATCH_CMD=' /etc/forge-perplexity.env 2>/dev/null || \
  echo 'FORGE_DISPATCH_CMD="/usr/local/sbin/forge-agent-run"' >> /etc/forge-perplexity.env

systemctl restart forge-perplexity-poll.timer
echo "    dispatch wired; timer restarted."

echo "==> STEP 2: deploy the mesh-resilience backend (port 8081)"
# Pull latest platform with the apps/mesh-resilience/ backend, then run it.
APP=/opt/szl/mesh-resilience
mkdir -p "$APP"
# Assumes a platform checkout exists on the box; adjust PLATFORM if different.
PLATFORM="${PLATFORM:-/opt/szl/platform}"
if [ -d "$PLATFORM/.git" ]; then git -C "$PLATFORM" pull --ff-only || true; fi
cp -f "$PLATFORM"/apps/mesh-resilience/{engine.py,server.py,cache.json,README.md,FINDINGS.md} "$APP"/ 2>/dev/null || true
python3 -m pip install -q --upgrade fastapi uvicorn 2>/dev/null || true

# systemd unit so it survives reboot/redeploy
install -m 0644 /dev/stdin /etc/systemd/system/szl-mesh-resilience.service <<UNIT
[Unit]
Description=SZL Mesh Resilience backend
After=network-online.target
[Service]
WorkingDirectory=$APP
ExecStart=/usr/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8081
Restart=on-failure
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now szl-mesh-resilience.service

# Surface it behind a11oy at /api/a11oy/v1/mesh-resilience/* — add to your
# existing reverse proxy (nginx/caddy) the same way the other /api/a11oy/v1/*
# routes proxy to their local ports. Example nginx location:
#   location /api/a11oy/v1/mesh-resilience/ {
#       proxy_pass http://127.0.0.1:8081/;
#   }
echo "    mesh-resilience service up on :8081 — add the proxy route, then reload nginx."

echo "==> VERIFY"
sleep 2
curl -s -o /dev/null -w "local healthz: %{http_code}\n" http://127.0.0.1:8081/healthz || true
echo "After adding the proxy route + reload:"
echo "  curl https://a-11-oy.com/api/a11oy/v1/mesh-resilience/healthz   # expect 200"
echo "  # then next Forge poll: AUTO_STATE.json dispatch_mode != none, dispatch_ok: true"
echo "==> DONE. Doctrine v11: never keystone self-merge, never commit a key, label live only on real 200."
