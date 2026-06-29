# SZL Estate — Wiring Audit & Repair Instructions
Generated 2026-06-13 ~02:20 UTC (verified live). Doctrine v11.

## TL;DR
The estate is almost fully wired. Live surfaces are green (a11oy, code-brain, verticals,
yarqa, hatun-mcp, anatomy all 200/302). There are **4 open wiring gaps**, all needing
**box root or org-admin token-minting** — none are agent-fixable from GitHub. One paste on
the Hetzner box (`replit-sync/WIRE_IT_UP.sh`) closes 3 of the 4.

---

## WHAT'S WIRED (verified 200/302, no action)
| Surface | Endpoint | Status |
|---|---|---|
| a11oy platform | https://a-11-oy.com/healthz | 200 (doctrine v11, kernel c7c0ba17) |
| Chaski code-brain | https://a-11-oy.com/api/a11oy/code/healthz | 200 (live, open-weight) |
| Verticals feed | /api/a11oy/v1/vert/finance/feed | 200 (24 LIVE sources, 0 stale) |
| yarqa Space | szlholdings-yarqa.hf.space/healthz | 200 |
| hatun-mcp Space | szlholdings-hatun-mcp.hf.space/healthz | 200 |
| anatomy Space | szlholdings-anatomy.static.hf.space | 302 (live; bare .hf.space 404s by design) |
| All repo main CI | push events | green across all 12 repos |
| Action pins | 10-repo pin-SHA scan | 0 bad pins |
| Dependabot | org-wide | 0 open alerts |

---

## GAP 1 — Forge dispatch executor (THE keystone wire)  [BOX ROOT]
**State:** `AUTO_STATE.json` → `dispatch_mode: none, dispatch_ok: false`. The hourly box poll
READS + classifies every order and hands box actions to "Forge agent", but no
`FORGE_DISPATCH_CMD` / `FORGE_AGENT_URL` is set in `/etc/forge-perplexity.env`, so nothing
executes. This blocks the GPU flip (GAP 2) and the whole R1-R7 dev plan.
**Repair (run AS ROOT on 167.233.50.75):**
```bash
# from replit-sync/WIRE_IT_UP.sh STEP 1 — EDIT the one marked line to your real
# headless Chaski/Forge agent launch command, then:
install -m 0755 /dev/stdin /usr/local/sbin/forge-agent-run <<'RUNNER'
#!/usr/bin/env bash
set -euo pipefail
cat | forge-agent --order - --doctrine v11 --no-keystone-selfmerge --no-secrets   # <-- EDIT
RUNNER
grep -q '^FORGE_DISPATCH_CMD=' /etc/forge-perplexity.env 2>/dev/null || \
  echo 'FORGE_DISPATCH_CMD="/usr/local/sbin/forge-agent-run"' >> /etc/forge-perplexity.env
systemctl restart forge-perplexity-poll.timer
```
**Verify:** next poll → `AUTO_STATE.json` shows `dispatch_mode` != none, `dispatch_ok: true`.

## GAP 2 — a-11-oy.com sovereign GPU flip  [BOX ROOT; auto once GAP 1 wired]
**State:** live endpoint = `sovereign:false, inference:hf-router, base_url:router.huggingface.co/v1`.
App code is DONE (#324) — only the box action remains. Once GAP 1 is wired, Forge does this
autonomously from order R0-GO. To do it directly:
```bash
ollama pull qwen2.5-coder:7b                  # keep llama3.1:8b
curl -s http://127.0.0.1:11434/v1/models      # MUST 200 with the model BEFORE rebuild
# set on a-11-oy.com deploy env (NOT committed):
#   A11OY_MODEL_BASE_URL=http://127.0.0.1:11434/v1
#   A11OY_GPU_LABEL="NVIDIA RTX 5000 @ Hetzner (betterwithage)"
sudo a11oy-rebuild
```
**Verify:** `curl -s https://a-11-oy.com/api/a11oy/code/healthz | jq '.sovereign,.inference,.key_resolution.base_url'`
→ want `true "self-hosted-gpu" "http://127.0.0.1:11434/v1"`.
**Honesty floor:** model server MUST be up before rebuild; the half-state (env set + server
down) is the only unacceptable outcome — else run the honest revert.

## GAP 3 — mesh-resilience backend not deployed  [BOX ROOT; in same paste]
**State:** `/api/a11oy/v1/mesh-resilience/health` → 404. Code is committed at
`platform/apps/mesh-resilience/` (FastAPI, cache-backed) but no server runs on the box.
**Repair:** `WIRE_IT_UP.sh` STEP 2 installs `szl-mesh-resilience.service` (uvicorn :8081) and
prints the nginx proxy block:
```nginx
location /api/a11oy/v1/mesh-resilience/ { proxy_pass http://127.0.0.1:8081/; }
```
Add that route, `nginx -s reload`. **Verify:** the /health endpoint returns 200.

## GAP 4 — two missing ORG SECRETS  [ORG-ADMIN, mint+paste a PAT — FOUNDER ONLY]
The agent will NOT mint/paste tokens (doctrine: never put secrets in chat/issues), and the
agent token lacks `admin:org`. These are founder-only by design:
- `DOCS_AUTOMATION_TEAM_READ_TOKEN` (.github #48) — docs-automation workflows fail without it.
  `gh secret set --org szl-holdings DOCS_AUTOMATION_TEAM_READ_TOKEN --visibility all`
  (paste a service-account PAT with read:org, read:packages, read:project)
- `SECRET_HEALTH_TOKEN` (szl-doctrine #3) — the secret-health workflow fails LOUDLY by design.
  `gh secret set --org szl-holdings SECRET_HEALTH_TOKEN --visibility all`
  (paste a fine-grained PAT: Secrets:read, Metadata:read, Administration:read)

---

## ONE-PASTE THAT CLOSES GAPS 1+2+3
SSH to the box as root, edit the single marked agent-launch line, then:
```bash
bash replit-sync/WIRE_IT_UP.sh   # from a platform checkout on the box
```
GAP 4 is a separate founder action (two `gh secret set` commands above).

## What the agent CAN'T do and why (honest)
- No Hetzner box root (neither this agent nor Forge's poll has it) → GAPs 1-3 are box-gated.
- No `admin:org` secret scope + doctrine forbids handling secrets → GAP 4 is founder-gated.
- Everything reachable from GitHub/HF (orders, code, PRs, CI, pins, deps) is already done.
