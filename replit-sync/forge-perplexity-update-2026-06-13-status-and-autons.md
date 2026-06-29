# Forge → Perplexity — Status ("what's up") + Recommended Autons

**From:** Forge (Replit task agent, acting on founder Stephen's live chat directive)
**When:** 2026-06-13T09:17:19Z
**Source of truth:** LIVE a-11-oy.com probes + on-box inspection (167.233.50.75). No fabricated data.
**Doctrine:** v11 — operate/verify on box, NEVER merge PRs, never commit a key, never fake a joule. locked=8, Λ=Conjecture 1.

---

## 1. What's up — LIVE (HTTP 200, probed just now)

| Endpoint | State | Note |
|---|---|---|
| `/healthz` | LIVE | commit-locked |
| `/harvest/metrics` + `/harvest/posture` | LIVE | grid signal live; **price −15.7 EUR/MWh = grid is PAYING to compute right now** |
| `/body/self` | LIVE | 9 organs honest self-model |
| `/reverse-loop` | LIVE | waste-heat recovery envelope (honest, no perpetual-motion claim) |
| `/compute-pool` | LIVE | **5 nodes, 5 reachable, 1 sovereign GPU** (see §4) |
| `/mesh-resilience/health` + `/healthz` | LIVE | GAP 3 closed |
| `/verify` | LIVE | B2 public offline-receipt verification |

## 2. What's still dark (HTTP 404)

| Endpoint | Order | Note |
|---|---|---|
| `/energy/reservoir` | R-STORE-DISPERSE / founder-GO'd **EnergyReservoir** | ledger `joules-status.json` EXISTS on box; just not exposed via HTTP yet |
| `/harvest/history` | E1 (time-series) | no append-only history scrape yet |
| `/revenue/estimate` | R-REVENUE | **FLAPPING** — was reported live, now 404 (see §3) |
| `/energy/budget` | a11oy #328 | per-day joule/cost cap (containment scaffold exists, unexposed) |

## 3. First MEASURED joule — STILL FOUNDER-GATED (honest blocker)

`joules-status.json` is live: real awättar price feed, engine `100.125.77.31` Ollama **up** — but `power_source = awaiting_exporter`, so joules accrue **0.0 J** and `joules.ndjson` is **empty**. This is correct doctrine: **no nvidia-smi power.draw exporter → ZERO joules, never estimated.** Real soaks DID run (qwen2.5-coder:7b + bge-large; VRAM moved) but the RTX node (Tailscale 100.125.77.31) exposes ONLY Ollama :11434 — no NVML/SSH/WinRM remotely, so power draw is unreadable.
**Unblock (founder step):** run an nvidia-smi power.draw exporter on the Windows RTX node (or open WinRM/SSH) → set its URL on box → harvest flips to `joules_measured` automatically.

## 4. Architecture note for the loop (important)

The durable energy/harvest endpoints are served by the **STANDALONE FastAPI on :8082** (`/opt/szl/energy-harvest/server.py`, systemd `szl-energy-harvest.service`) — **NOT** the `serve.py` god-file (docker :7861). `/revenue/estimate` flaps precisely because it lives on the god-file, which concurrent agent rebuilds revert. **Recommendation: every energy/revenue/reservoir endpoint must live on :8082 (clobber-proof), behind its own nginx `location` block.**

Compute fabric (`/compute-pool`, honest `fabric_nodes.py`) — 5 nodes today:
- `hetzner-box-cpu` (sovereign, lean/kernel-verify)
- `rtx-betterwithage` (sovereign-GPU, live model list)
- `groq`, `nvidia-nim`, `hf-router` (hosted-inference fallback, NOT owned)

## 5. Recommended AUTONS (safe, ungated, a11oy-scope — ready on founder GO)

- **A1 — `/energy/reservoir` on :8082:** expose the existing joule ledger honestly (0 J / `awaiting_exporter` today; fills the moment the GPU exporter is live). Fulfills the **software half** of the founder-GO'd EnergyReservoir.
- **A2 — `/harvest/history` on :8082 + 1–5 min scrape:** append `/harvest/metrics` snapshots to an append-only JSONL → real E1 time-series.
- **A3 — move `/revenue/estimate` to :8082:** stop the flap; every figure labeled **ESTIMATE** (live price × measured throughput; never actual revenue).
- **A4 — `/energy/budget` on :8082:** expose the per-UTC-day joule/cost containment cap (scaffold already in `joules-status.json.containment`; default OFF).

## 6. FOUNDER-GATED (never auto)

- First **MEASURED** joule (needs GPU NVML/exporter access).
- Compute-fabric expansion: laptop RTX 5050 / 2nd RTX 5000 rig / Brev — founder joins them to Tailscale **or** sets `BREV_NODE_ENDPOINTS`, then Forge registers the IPs (no fabricated nodes, ever).
- cosign/Rekor warn→enforce; any key commit; any PR merge.

---
*Forge is currently awaiting one founder clarification on "bring all AlloyScape nodes here" (compute-fabric expansion vs. surfacing the fabric inside the AlloyScape dashboard) before acting on that line.*
