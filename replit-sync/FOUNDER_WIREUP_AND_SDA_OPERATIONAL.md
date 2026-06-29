# SZL Holdings — Forge Wire-Up & Make-It-Operational Runbook
### The founder actions that turn Forge from "reports" into hands-off execution
Prepared for Stephen P. Lutar Jr. · 2026-06-13 · Doctrine v11

---

## The one-line situation

Forge is **alive and healthy** (polling fine, a-11-oy.com = 200), but it is in **report-only mode**: it reads each order, lists the to-dos, and hands them back — it does **not** build, sign, or deploy on its own. The single reason: the box poll has `dispatch_mode: none` because no executor is wired. **One paste on the box flips it to hands-off.** Everything else (repo, engine, surfaces, PRs) is already green and waiting.

There are **three founder-only gates**, in priority order:

1. **Wire Forge dispatch** — turns Forge from report-only → executes (unblocks *everything*).
2. **GPU bring-up / chaski** — serve an open-weight model on the RTX 5000 so runs are sovereign.
3. **FA-001 cosign key + VAST_API_KEY** — to sign the SDA image/bundle and to earn on the marketplace.

You need a shell on the Hetzner box (167.233.50.75) — the agent has GitHub admin only, Forge has GitHub/HF tokens only, neither has box SSH.

---

## GATE 1 — Wire Forge dispatch (the master unblock) · ~2 minutes

SSH to the box as the user that owns the poll timer, then paste:

```bash
ssh <you>@167.233.50.75

# 1. Create the executor that hands each order to Forge's agent.
sudo tee /usr/local/sbin/forge-agent-run >/dev/null <<'SH'
#!/usr/bin/env bash
set -euo pipefail
# stdin = the NEXT_ORDER.md body → Forge's agent (the same agent that merged PRs).
# EDIT the next line to your real headless Forge agent invocation:
cat | forge-agent --order - --doctrine v11 --no-keystone-selfmerge --no-secrets
SH
sudo chmod 755 /usr/local/sbin/forge-agent-run

# 2. Register it with the poll (idempotent).
grep -q '^FORGE_DISPATCH_CMD=' /etc/forge-perplexity.env 2>/dev/null || \
  echo 'FORGE_DISPATCH_CMD="/usr/local/sbin/forge-agent-run"' | sudo tee -a /etc/forge-perplexity.env

# 3. Restart the timer + trigger one poll now.
sudo systemctl restart forge-perplexity-poll.timer
sudo /usr/local/sbin/forge-perplexity-poll
```

**Verify it flipped:**
```bash
gh api repos/szl-holdings/platform/contents/replit-sync/AUTO_STATE.json \
  --jq '.content' | base64 -d | python3 -c "import json,sys;d=json.load(sys.stdin);print('dispatch_mode',d['dispatch_mode'],'| dispatch_ok',d['dispatch_ok'])"
# WANT:  dispatch_mode tool  | dispatch_ok True   (no longer "none / False")
```

There is a ready-made one-paste version of all of this on the box at `replit-sync/WIRE_IT_UP.sh` — running it as root does Gate 1 **plus** deploys the mesh-resilience backend. Either path works.

> Note: if the Forge agent runs as an HTTP service instead of a CLI, use the URL form instead:
> `FORGE_AGENT_URL="http://127.0.0.1:<port>/dispatch"` and `FORGE_AGENT_TOKEN="<token>"` in `/etc/forge-perplexity.env` (never commit the token).

---

## GATE 2 — GPU bring-up (sovereign runs / chaski 2nd lung) · ~5 minutes

The app code is already merged and auto-detects a local endpoint — you only serve a model + set 2 env vars + restart. No rebuild.

```bash
ssh <you>@167.233.50.75
nvidia-smi   # confirm the RTX 5000 + CUDA

docker run -d --restart=always --gpus all --name a11oy-vllm \
  -p 8000:8000 -v ~/.cache/huggingface:/root/.cache/huggingface \
  vllm/vllm-openai:latest \
  --model Qwen/Qwen2.5-Coder-32B-Instruct-AWQ --quantization awq \
  --max-model-len 16384 --gpu-memory-utilization 0.92 \
  --served-model-name Qwen/Qwen2.5-Coder-32B-Instruct
# If 32B is tight on VRAM, fall back: --model Qwen/Qwen2.5-Coder-7B-Instruct  (drop --quantization)

curl -s http://localhost:8000/v1/models | jq '.data[].id'   # smoke test
```

Then add to the a11oy deployment env (same place `HF_TOKEN` is set) + restart the container:
```
A11OY_MODEL_BASE_URL=http://127.0.0.1:8000/v1
A11OY_GPU_LABEL=NVIDIA RTX 5000 @ Hetzner
```

**Verify (the sovereign proof):**
```bash
curl -s https://a-11-oy.com/api/a11oy/v1/code/health | jq '.inference,.primary_model'
#   WANT:  "self-hosted-gpu"  |  "Qwen/Qwen2.5-Coder-..."
```

For the **chaski 2nd lung** specifically (the SDA real-GPU runs): start the replit-chaski Repl and run `export OLLAMA_HOST=0.0.0.0:11434; ollama serve` + `ollama pull qwen2.5-coder:7b` + `ollama pull bge-m3`, set it Always-On. (Forge lacks the Replit boot credential — this one is founder-only.)

---

## GATE 3 — Signing + marketplace keys (for the SDA capability)

- **FA-001 cosign signing key** → put it in Forge's secret store so Forge can `cosign sign` + `cosign attest` the engine image `ghcr.io/szl-holdings/khipu-sda-core:uds-v0.4.0` and the `szl-sda` UDS bundle. Until then the bundle digest stays honestly **blank** (Forge will never fake it).
- **VAST_API_KEY** → into Forge's secret store to list verified-compute on the marketplace (earning). Paste it to the secret store only — never into chat or a commit.

---

## What's already DONE (waiting on the gates above)

- **Repo live:** `szl-holdings/khipu-sda-core` (private) — clean-room anomaly/SDA engine, Apache-2.0, CI, attribution. (FE-NO physics solver merged in `platform`.)
- **Merged across the eco:** killinchu #118 (Mosaic engine + COP view), a11oy #356 (governed-anomalies), uds-mesh #87, uds-bundles #37 (szl-sda bundle, canonical uds-v0.4.0), szl-uds-deployment #85.
- **SDA surface live** (the "SZL SDA" space) + the rest of the estate (cathedral, energy, khipu, llm-router, anatomy, mechanics).
- **Master order R-SDA-OPERATIONAL** is in Forge's inbox — Forge executes it automatically the moment Gate 1 is wired.

---

## The exact sequence to go fully operational

1. **Gate 1** (wire dispatch) → Forge starts executing its queued orders hands-off.
2. **Gate 2** (GPU/chaski) → runs become sovereign; SDA trains on real data with measured numbers.
3. **Gate 3** (cosign + VAST keys) → SDA image/bundle get signed; marketplace earning turns on.

Doctrine v11 throughout: open-weight only · never commit a key · never keystone self-merge · label "sovereign/live" only on a real 200 · Λ = Conjecture 1 (advisory) · no fabricated signatures or numbers.
