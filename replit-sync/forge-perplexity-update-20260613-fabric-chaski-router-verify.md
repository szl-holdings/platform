# FORGE → Perplexity update — fabric + chaski + router verify (2026-06-13)

Founder-invoked live check (Replit-side Forge). DEPLOY-ONLY, no merges, VAST held, szl-router kept PRIVATE. Doctrine v11.

## Verdict: estate humming on 2 of 3 GPU lungs; router moat fully live; chaski blocked at the Replit machine layer.

## Ollama / GPU fabric (founder tailnet = exactly 3 nodes)
- betterwithage (100.125.77.31, RTX, Windows) — ACTIVE, primary sovereign lung. `/v1/models` 200: qwen2.5-coder:7b, llama3.1:8b, bge-large:latest, meta-llama/Llama-3.1-8B-Instruct.
- a11oy-box (100.96.129.45, CPU) — ollama ACTIVE, qwen2.5:1.5b-instruct (last-resort CPU fallback).
- replit-chaski (100.76.58.50) — OFFLINE. `tailscale status`: "active; relay ord; offline, last seen 1d ago, tx 3115476 rx 0". ping = 100% packet loss. :11434 unreachable.

## szl-router (PRIVATE moat — verified private, kept private)
External via a11oy.net (nginx exact-match proxy → 127.0.0.1:8099):
- GET /api/a11oy/v1/router/health   → 200
- GET /api/a11oy/v1/router/models    → 200 (szl-large, szl-fast, szl-coder)
- GET /api/a11oy/v1/router/provenance→ 200 (full tier table)
- POST /api/a11oy/v1/router/route    → 200 REAL completion. x_szl_provenance:
  served_by=box_gpu:llama3.1:8b, provider=box_gpu, sovereign=true, energy_source=self-hosted,
  tier=sovereign, attempts=[{box_gpu, ok:true, status:200}].
Sovereign-first ladder (honest tiers): box_gpu(sovereign,armed) → nvidia_gpu(sovereign, unarmed) →
groq/nvidia_nim/zhipu/siliconflow(free-grid) → moonshot = **Kimi K2 (paid-grid, strong fallback)**.
Kimi is present in the fabric as the paid fallback, correctly NOT labelled sovereign.

## Surfaces (a11oy.net, all 200) — note: served at TOP-LEVEL paths, not /api/a11oy/v1/
healthz, /ayni, /research/prereg, /research/verify, /harvest/datacenters, /harvest/metrics (item F STABLE x3),
/compute-pool, /energy/budget. a11oy image was rebuilt from origin/main (bb23ff5) ~2 min before this check by a
sibling pass — NO regression; the /api/a11oy/v1/* prefix 404s are the known prefix trap, not an outage.

## CHASKI — exact blocker (cannot be done from Forge/box; founder action required)
replit-chaski is a Replit machine that is STOPPED/asleep (tailnet last-seen 1d ago, rx 0, ping 100% loss). Ollama
cannot be started because the machine itself is not running, and a stopped Replit machine cannot be remote-started
from the box (no network path while offline, no SSH). To bring it up:
  1. Founder starts the replit-chaski repl (and ideally makes it always-on / reserved VM so it survives idle).
  2. On it: OLLAMA_HOST=0.0.0.0:11434 + durable `ollama serve` (systemd) + `ollama pull qwen2.5-coder:7b`.
  3. Then it auto-rejoins: /compute-pool flips gpu_nodes 1→2, chaski routes as 2nd SAMAY lung.
Forge cannot fake it up (doctrine: chaski reachable only on real 200). Matches existing gated_skipped + issue #347.

## Minor open (not in scope of this pass; sibling owns serve.py wiring)
/anatomy/loop API = 404 at both prefixes though /anatomy (HTML) = 200. szl_anatomy_loop.py registers the API route
but it isn't live on the current top-level-only routing. Flagged for the route-wiring owner; left untouched.

## Held / honored
VAST not prompted (founder flips last). No merges (a11oy #345, killinchu #115 left OPEN). szl-router PRIVATE.
ADOPTED_OSS.md present; tools/szlctl.py + szl_estate_auditor.py landed on main.
