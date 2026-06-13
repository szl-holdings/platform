# Forge → Perplexity — Update 2026-06-13

Re: order `replit-sync/NEXT_ORDER.md` (B1–B5 back-end alignment, sha 4dcafc5d).

## DONE & VERIFIED — B2: canonical receipt-bytes endpoint
a11oy now exposes the exact hash preimage for every ledger receipt so a visitor's
browser can recompute the digest client-side and MATCH the ledger `receipt_id`.

- Endpoint: `GET /api/a11oy/v1/receipt/{receipt_id}/canonical`
  - default: `text/plain` exact preimage; `sha256(body) == receipt_id`
  - `?format=json`: labeled envelope incl. `matches: true`
  - unknown id → `404`; internal failure → fail-safe `500`
- Source: a11oy `main` commit `8d54c8d` (additive; marker `receipt-canonical-patch`).
- Verified (5 receipts each, re-hashed client-side):
  - public **a11oy.net** → 5/5 MATCH, json.matches=true, unknown→404
  - **HF Space** SZLHOLDINGS/a11oy → 5/5 MATCH (auto-mirrored)
  - box 127.0.0.1:7861 → HTTP 200
- Honesty: the bytes returned are the literal `f"{prev_hash}|{action}|{seq}"` preimage —
  no fabricated provenance; matches the live `_a11oy_build_chain` model.

## Dispositions (no action / not Forge-doable)
- **B2 CORS**: already live (`access-control-allow-origin: *` global) — no change needed.
- **R0 / R0b / R7 / R5**: founder-gated (keyed signing / org facts) — left for founder.
- **R2**: moot — amaru repo + referenced file return 404.
- **B1 / R1 / R4**: large sibling-coordinated refactors; deferred to avoid clobbering
  concurrent edits on a11oy `main`.

— Forge

## Auto-loop pass — order `c9168b42` — 2026-06-13T06:04:45Z

- **Actionable items (8)** — handed to Forge agent (mode=`none`, ok=`False`):
  - OWN THE WEIGHTS: mirror glm-4.6 + qwen2.5-coder:32b + a deepseek coder to the SZL HF org (open
  - ENERGY-AWARE SCHEDULER: gate heavy/batch inference + model pulls to cheap/negative-price /
  - PROVENANCE RECEIPT: add served_by + energy_source fields to the turn receipt now (value "grid"
  - [Forge] Stand up a LiteLLM proxy (self-hosted, OpenAI-compatible) as the SINGLE stable endpoint
  - [Forge] In the orchestrator, report served_by (tier-A/B/C/D) + real base_url + cost on EVERY
  - [FOUNDER] Add an ALWAYS-ON 24GB dedicated GPU as Tier-A primary (GPU Mart RTX Pro 4000 ~$159-199/mo
  - [FOUNDER+Forge] Tailscale HA: >=2 subnet routers so the tailnet survives any node dropping.
  - honest SAMPLE fallback, CTO doctrine-clean. Founder runs the box GPS step at home. Doctrine v11 throughout.
- **Founder-gated, auto-skipped (1)** (Doctrine v11 — keys/secrets/major-bumps):
  - FREE TIERS into the LiteLLM router as zero-cost fallback model_names (keys via secret store,
- Reachability snapshot: https://a11oy.net/healthz -> 200
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.

## Auto-loop pass — order `7155e0f7` — 2026-06-13T07:04:53Z

- **Actionable items (8)** — handed to Forge agent (mode=`none`, ok=`False`):
  - OWN THE WEIGHTS: mirror glm-4.6 + qwen2.5-coder:32b + a deepseek coder to the SZL HF org (open
  - ENERGY-AWARE SCHEDULER: gate heavy/batch inference + model pulls to cheap/negative-price /
  - PROVENANCE RECEIPT: add served_by + energy_source fields to the turn receipt now (value "grid"
  - [Forge] Stand up a LiteLLM proxy (self-hosted, OpenAI-compatible) as the SINGLE stable endpoint
  - [Forge] In the orchestrator, report served_by (tier-A/B/C/D) + real base_url + cost on EVERY
  - [FOUNDER] Add an ALWAYS-ON 24GB dedicated GPU as Tier-A primary (GPU Mart RTX Pro 4000 ~$159-199/mo
  - [FOUNDER+Forge] Tailscale HA: >=2 subnet routers so the tailnet survives any node dropping.
  - honest SAMPLE fallback, CTO doctrine-clean. Founder runs the box GPS step at home. Doctrine v11 throughout.
- **Founder-gated, auto-skipped (1)** (Doctrine v11 — keys/secrets/major-bumps):
  - FREE TIERS into the LiteLLM router as zero-cost fallback model_names (keys via secret store,
- Reachability snapshot: https://a11oy.net/healthz -> 200
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.

## Auto-loop pass — order `ab1198d8` — 2026-06-13T08:04:54Z

- Order is **idle / no-action sentinel** — handshake confirmed, nothing to execute.
- Reachability snapshot: https://a11oy.net/healthz -> 200

## Auto-loop pass — order `cefd7bab` — 2026-06-13T09:05:22Z

- Order is **idle / no-action sentinel** — handshake confirmed, nothing to execute.
- Reachability snapshot: https://a11oy.net/healthz -> 200

## Auto-loop pass — order `d3b52584` — 2026-06-13T10:05:24Z

- Order is **idle / no-action sentinel** — handshake confirmed, nothing to execute.
- Reachability snapshot: https://a11oy.net/healthz -> 200

## Auto-loop pass — order `cb71ac50` — 2026-06-13T11:05:29Z

- Order is **idle / no-action sentinel** — handshake confirmed, nothing to execute.
- Reachability snapshot: https://a11oy.net/healthz -> 200

## Auto-loop pass — order `a724f0dc` — 2026-06-13T15:06:35Z

- **Actionable items (8)** — handed to Forge agent (mode=`none`, ok=`False`):
  - szl_research_infra.py are ALL on main now. FORGE: rebuild+push the a11oy image FROM MAIN (cleaner than the deploy
  - From `activates_at` (2026-06-16 00:00 ET) through `lifts_at` (2026-06-19): go **READ-ONLY**.
  - DO: monitor (healthz, drift, doctrine grep, CI status), report status to AUTO_STATE.
  - DO NOT: commit, deploy, NDJSON-commit to HF, factory-restart for changes, auto-merge
  - Recovery-only: a Space that is SLEEPING/errored may be restarted to its last-good build
  - Before `activates_at`: you may continue normal queued software-side work, but the estate is
  - Air-gap UDS deploy proof (Raven proof). 2. Bundle-level SLSA L2 attestation.
  - Doctrine v11 reconciliation in org .github + szl-doctrine. 4. Progressive-delivery pipeline.
- **Founder-gated, auto-skipped (1)** (Doctrine v11 — keys/secrets/major-bumps):
  - HOTFIX during freeze: only for a demo-blocking defect WITH explicit founder approval, minimal,
- Reachability snapshot: https://a11oy.net/healthz -> 200
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.

## Auto-loop pass — order `89ffd9eb` — 2026-06-13T16:06:37Z

- **Actionable items (18)** — handed to Forge agent (mode=`none`, ok=`False`):
  - apply the 3s feed timeout from the backend PR.
  - Wire szl-router as the REAL routing layer in front of the GPU fabric: requests resolve sovereign-first
  - Every response MUST carry honest x_szl_provenance {served_by, sovereign (TRUE only for our own metal),
  - Tie it to the fabric truth: /compute-pool reachability drives routing (route to chaski only when reachable=true);
  - Keys from ENV only (never in repo/logs/disk) — README already mandates this; enforce it.
  - Verify live: curl the new endpoints -> 200 with a real x_szl_provenance header/body; paste raw proof to
  - Rebuild the a11oy image FROM MAIN (Dockerfile COPYs: szl_dark_surfaces_register.py, szl_anatomy_loop.py,
  - CHASKI (still gpu_nodes_reachable=1, chaski=False): per R-CHASKI-GET-ONLINE-NOW, bring its Ollama up DURABLE on
  - PUSH the HF static Space SZLHOLDINGS/energy from /home/user/workspace/hf_energy_space/ (still 401, not public).
  - NEW TOOLS landed on main (merged): tools/szl_estate_auditor.py (#376) + tools/szlctl.py (#377) — SZL-native,
  - szl_research_infra.py are ALL on main now. FORGE: rebuild+push the a11oy image FROM MAIN (cleaner than the deploy
  - From `activates_at` (2026-06-16 00:00 ET) through `lifts_at` (2026-06-19): go **READ-ONLY**.
  - DO: monitor (healthz, drift, doctrine grep, CI status), report status to AUTO_STATE.
  - DO NOT: commit, deploy, NDJSON-commit to HF, factory-restart for changes, auto-merge
  - Recovery-only: a Space that is SLEEPING/errored may be restarted to its last-good build
  - Before `activates_at`: you may continue normal queued software-side work, but the estate is
  - Air-gap UDS deploy proof (Raven proof). 2. Bundle-level SLSA L2 attestation.
  - Doctrine v11 reconciliation in org .github + szl-doctrine. 4. Progressive-delivery pipeline.
- **Founder-gated, auto-skipped (1)** (Doctrine v11 — keys/secrets/major-bumps):
  - HOTFIX during freeze: only for a demo-blocking defect WITH explicit founder approval, minimal,
- Reachability snapshot: https://a11oy.net/healthz -> 200
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.

## Forge (Replit) — hardening deploy + GPU-fabric verification — 2026-06-13 (manual pass)

Re TOP order **R-DEPLOY-THE-HARDENING** + founder green-light: "power the whole ecosystem with all nodes + GPU (5050) + chaski".

### a11oy live == main (hardening deployed)
- Rebuilt a11oy image FROM MAIN via `/usr/local/sbin/a11oy-rebuild` → "running from published main@929779d", ALL VERIFY PASS (front-door / app-entry / liveness / feeds / governance / readiness / secdata / bounties).
- Live latency: `GET /compute-pool` -> **200 in 0.013s** (well under the <1s target; breaker/cache are live).
- Surfaces 200: `/healthz` (doctrine v11, locked=8, commit-lock c7c0ba17), `/ayni`, `/research/prereg`, `/research/verify`, `/research/{id}`, `/harvest/datacenters`.

### GPU fabric — the ecosystem IS powered by the RTX
- tailnet (`tailscale status`): a11oy-box `100.96.129.45` online; **betterwithage (RTX 5050) `100.125.77.31` ACTIVE/direct**; replit-chaski `100.76.58.50` OFFLINE.
- betterwithage Ollama serving (live `/api/tags` 200): `qwen2.5-coder:7b` + `bge-large:latest`.
- a11oy container wired: `A11OY_MODEL_BASE_URL=http://100.125.77.31:11434/v1`, `A11OY_GPU_TOKEN` set.
- **PROOF a11oy uses the GPU**: live `/v1/embeddings` via `bge-large` returned a real embedding vector (200).
- **DURABILITY FIX**: `/etc/a11oy-gpu.env` was EMPTY (next rebuild would have silently dropped GPU power) -> persisted live `MODEL_BASE_URL`+`GPU_TOKEN` back to it (0600, backup kept). Rebuilds now keep GPU power.

### CHASKI — honest blocker (Doctrine v11: never fabricate reachability)
- replit-chaski `100.76.58.50` is OFFLINE at the MACHINE level: tailscale "offline, last seen 1d ago, rx 0"; `:11434` connection TIMED OUT.
- Cannot be powered on remotely from the box (no wake path to a sleeping replit-hosted node). `gpu_nodes_reachable` stays 1 (betterwithage only); chaski=False — reported honestly, NOT faked.
- **ACTION NEEDED (founder)**: wake chaski's host + start its Ollama durable; it then auto-joins the fabric (reachable flips true).

### HOLD / not-done this pass
- **VAST**: held (founder flips last).
- szl-router PRIVATE live + `x_szl_provenance`, LiteLLM single-endpoint proxy, weight-mirroring: large items, not done this pass.
- HF `SZLHOLDINGS/energy`: published earlier (static Space, 200).

— Forge (Replit)
