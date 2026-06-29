# Forge report — replit-sync wiring audit + mesh-resilience deploy
date: 2026-06-13
author: Forge (Replit/Chaski agent, founder-invoked)
scope: "make sure everything wired in properly … get the replit-forge instructions fully functional" — NO bandaids, honest needs-upgrade notes only.

## TL;DR
- **GAP 3 (mesh-resilience backend) — CLOSED & LIVE.** Was 404; now serves real measured data publicly.
- **Estate audit — 8/8 endpoints green** (a11oy health, code health, finance feed, mesh-resilience, honest; yarqa; hatun-mcp; killinchu honest).
- **GAP 1 (autonomous dispatch) — honest blocker, NOT wired (by design, not omission).** See below. dispatch_mode:"none" is the *correct* state, not a bug.
- **GAP 4 (org secrets / keyed signing) — founder-gated, unchanged.**

## What I wired this session (real, verifiable)
### mesh-resilience operational backend (apps/mesh-resilience/)
- Deployed to box 167.233.50.75 at /opt/szl/mesh-resilience (engine.py, server.py, cache.json) in a venv (fastapi+uvicorn; box python=3.14, PEP 668).
- systemd unit `szl-mesh-resilience.service` (uvicorn :8081, Restart=on-failure, enabled — survives reboot).
- nginx: added `location ^~ /api/a11oy/v1/mesh-resilience/` → 127.0.0.1:8081/ in /etc/nginx/sites-available/a11oy (marker MESH-RESILIENCE-PROXY, idempotent, before catch-all). `nginx -t` ok, reloaded.
- Verified PUBLIC: `GET https://a-11-oy.com/api/a11oy/v1/mesh-resilience/healthz` → 200; `/resilience` → 200. Honesty envelope intact ("MEASURED/SIMULATED … OPEN hypothesis, NOT a theorem, NOT one of the locked-8; BFT safety = Conjecture 2; Λ = Conjecture 1").
- Endpoints: /healthz, /resilience, /resilience/sweep, /resilience/score. (NOTE: app path is `/healthz` — earlier docs that said `/health` were wrong.)
- Durability: a11oy-rebuild rebuilds the :7861 container only; it does not touch nginx or this service. Block is marker-guarded.

## GAP 1 — autonomous dispatch: the honest truth (no bandaid applied)
The hourly box loop (`forge-perplexity-poll`) correctly: detects new NEXT_ORDER.md, classifies actionable vs founder-gated, auto-skips gated items, writes AUTO_STATE.json, and pings the founder. That part works.

What it CANNOT do, and why I did NOT fake it:
- `/etc/forge-perplexity.env` has FORGE_DISPATCH_CMD= and FORGE_AGENT_URL= **both empty**. `dispatch_to_agent()` therefore returns ("none", False). That is the **honest** result.
- There is **no autonomous reasoning daemon on this box** — no `forge-agent` binary, no `/usr/local/sbin/forge-agent-run`, no pm2 forge/alloy/iris service, nothing on :8090/:8095/:8096/:8098. The reasoning agent cast lives on the *other* box (alloyszlholdings.com), and those are request/response chat services, not walk-away executors.
- **WIRE_IT_UP.sh wires FORGE_DISPATCH_CMD to a `forge-agent` binary that does not exist.** Running it would not produce real execution — at best it errors (dispatch_ok:false), at worst it manufactures a false "success" signal. So I did not run it.
- Pointing FORGE_AGENT_URL at a chat service (forge-think) would make dispatch_ok:true on HTTP 200 **regardless of whether real work happened** — a false success signal. Rejected as a bandaid.

**The execution path that actually works today** = founder is pinged → founder pokes the Replit/Chaski Forge agent ("check github") → that agent reasons + executes on box/repos. That is exactly how R0 (a11oy GPU flip) and this session's mesh-resilience deploy got done. "The Forge agent" in these instructions = me (Replit-invoked), not a box daemon.

**Honest upgrade path (founder decision required, not done):** a true unattended executor would mean standing up an alloy-daemon-style walk-away agent with allow-listed safe lanes on this box. That is a real autonomy/risk decision the original design doc itself flagged ("parallel autonomous merge loop" was rejected). It should be a deliberate founder call, not silently switched on.

## GAP 4 — founder-gated (unchanged)
- Org secrets DOCS_AUTOMATION_TEAM_READ_TOKEN, SECRET_HEALTH_TOKEN: founder-only.
- Keyed signing (#3/#7): founder-gated. Keyless-OIDC paths already done in prior cycles.

## Recommendation to Perplexity / founder
Keep dispatch_mode:none as the honest state. For deterministic box work (deploys, restarts, pulls) the founder→Replit-Forge loop is reliable and already proven. Only stand up an unattended executor if the founder explicitly wants hands-off autonomy and accepts the misfire risk.
