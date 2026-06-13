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

## Auto-loop pass — order `35873754` — 2026-06-13T17:06:55Z

- **Actionable items (24)** — handed to Forge agent (mode=`none`, ok=`False`):
  - chaski-THE-GPU-NODE = the replit-chaski Repl at tailnet 100.76.58.50, currently POWERED OFF (tailscale rx 0,
  - chaski-THE-BRAIN (HF Space orchestrator) = separate: if it is still stub, run forge_hf_activate.py in the
  - VERIFY (real, no bandaid): curl http://100.76.58.50:11434/v1/models -> 200 + model list; then /compute-pool
  - ENERGY SPACE — SOURCE NOW DELIVERED: I placed it at replit-sync/hf_energy_space/ (index.html + assets/{data.js,
  - CHASKI — POWERED OFF (your honest finding: tailscale rx 0, ollama 000, ssh 502). You CANNOT wake it from the box
  - DISPATCH (the real throughput upgrade): dispatch_ok=False, dispatch_mode=none, forge_agent_url=none — you run
  - ZK (prove the OUTPUT without revealing inputs): "ZK proves correctness; TEEs protect execution." SZL already has
  - PROOF-OF-INFERENCE receipt: extend the existing marketplace/verify receipt so each inference job carries a
  - ATTESTATION ENVELOPE: where we run on our own metal, attach a hardware/runtime attestation (what ran, where);
  - The pitch payoff: verified inference is becoming table stakes for pharma/defense/finance buyers (the exact
  - Rebuild a11oy image FROM MAIN. Gate the swap on /api/a11oy/v1/health/ready==200 (K8s maxUnavailable:0 pattern);
  - Rebuild killinchu image FROM MAIN -> finance/* + realestate/* + /elite/wiring 200.
  - Verify: python3 tools/szl_smoke_stress.py smoke TWICE -> require ALL surfaces 200 AND STAY 200, compute-pool <1s,
  - Same rebuild flips: /ayni, /research/prereg, /research/verify, /harvest/datacenters. Wire szl-router live
  - Rebuild a11oy image FROM MAIN (COPY all hardening modules: szl_backend_hardening, szl_prod_hardening,
  - READINESS-GATED swap (K8s maxUnavailable:0): new image must pass /api/a11oy/v1/health/ready (200) BEFORE it
  - ONE canonical deploy path from main; kill any competing/older redeploy reverting surfaces.
  - After swap: run python3 tools/szl_smoke_stress.py smoke TWICE; require ALL surfaces 200 AND STAY 200 across both
  - Same rebuild flips the still-404s: /ayni, /research/prereg, /research/verify, /harvest/datacenters; + killinchu
  - New observability endpoints (when feat/observability lands): /api/a11oy/v1/observability/traces +
  - Mount the jackin-console as the "JACK IN" surface on killinchu (route /jackin and/or folded into
  - Wire it to the REAL existing endpoints (same-origin): /api/killinchu/v1/cuas/{plausibility,wta,
  - ADD the 5-modality FUSION + DroneID layer (JACKIN_GAP_ADDENDUM.md): per-track modality row
  - CONNECT transports must work in-browser over HTTPS (Web Serial + Web Bluetooth = Chrome/Edge +
- Reachability snapshot: https://a11oy.net/healthz -> 200
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.

## Auto-loop pass — order `550839ec` — 2026-06-13T18:06:55Z

- **Actionable items (28)** — handed to Forge agent (mode=`none`, ok=`False`):
  - ENERGY SPACE — confirmed live (SZLHOLDINGS/energy, static, 302). Keep it; verify it reads the live a11oy API.
  - JOULES HONESTY FIX — an Opus PR (fix/joules-honesty) is incoming: single-source joules_label helper, "measured"
  - LATENCY POSTURE — the 5 smoke latency flags (anatomy/loop, heart/pulse, /ayni, sovereign-compute, qbio ~3s) are
  - Re-run python3 tools/szl_smoke_stress.py --mode smoke after the rebuild; target PASS (all 200, latency<2s,
  - chaski-THE-GPU-NODE = the replit-chaski Repl at tailnet 100.76.58.50, currently POWERED OFF (tailscale rx 0,
  - chaski-THE-BRAIN (HF Space orchestrator) = separate: if it is still stub, run forge_hf_activate.py in the
  - VERIFY (real, no bandaid): curl http://100.76.58.50:11434/v1/models -> 200 + model list; then /compute-pool
  - ENERGY SPACE — SOURCE NOW DELIVERED: I placed it at replit-sync/hf_energy_space/ (index.html + assets/{data.js,
  - CHASKI — POWERED OFF (your honest finding: tailscale rx 0, ollama 000, ssh 502). You CANNOT wake it from the box
  - DISPATCH (the real throughput upgrade): dispatch_ok=False, dispatch_mode=none, forge_agent_url=none — you run
  - ZK (prove the OUTPUT without revealing inputs): "ZK proves correctness; TEEs protect execution." SZL already has
  - PROOF-OF-INFERENCE receipt: extend the existing marketplace/verify receipt so each inference job carries a
  - ATTESTATION ENVELOPE: where we run on our own metal, attach a hardware/runtime attestation (what ran, where);
  - The pitch payoff: verified inference is becoming table stakes for pharma/defense/finance buyers (the exact
  - Rebuild a11oy image FROM MAIN. Gate the swap on /api/a11oy/v1/health/ready==200 (K8s maxUnavailable:0 pattern);
  - Rebuild killinchu image FROM MAIN -> finance/* + realestate/* + /elite/wiring 200.
  - Verify: python3 tools/szl_smoke_stress.py smoke TWICE -> require ALL surfaces 200 AND STAY 200, compute-pool <1s,
  - Same rebuild flips: /ayni, /research/prereg, /research/verify, /harvest/datacenters. Wire szl-router live
  - Rebuild a11oy image FROM MAIN (COPY all hardening modules: szl_backend_hardening, szl_prod_hardening,
  - READINESS-GATED swap (K8s maxUnavailable:0): new image must pass /api/a11oy/v1/health/ready (200) BEFORE it
  - ONE canonical deploy path from main; kill any competing/older redeploy reverting surfaces.
  - After swap: run python3 tools/szl_smoke_stress.py smoke TWICE; require ALL surfaces 200 AND STAY 200 across both
  - Same rebuild flips the still-404s: /ayni, /research/prereg, /research/verify, /harvest/datacenters; + killinchu
  - New observability endpoints (when feat/observability lands): /api/a11oy/v1/observability/traces +
  - Mount the jackin-console as the "JACK IN" surface on killinchu (route /jackin and/or folded into
  - Wire it to the REAL existing endpoints (same-origin): /api/killinchu/v1/cuas/{plausibility,wta,
  - ADD the 5-modality FUSION + DroneID layer (JACKIN_GAP_ADDENDUM.md): per-track modality row
  - CONNECT transports must work in-browser over HTTPS (Web Serial + Web Bluetooth = Chrome/Edge +
- **Founder-gated, auto-skipped (1)** (Doctrine v11 — keys/secrets/major-bumps):
  - DISPATCH — wire FORGE_AGENT_URL / FORGE_DISPATCH_CMD in YOUR OWN secret store so you run hands-off (founder does
- Reachability snapshot: https://a11oy.net/healthz -> 200
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.

## Auto-loop pass — order `484a6532` — 2026-06-13T19:07:09Z

- **Actionable items (44)** — handed to Forge agent (mode=`none`, ok=`False`):
  - a11oy: #351 (console honest skeletons + fail-fast KPI + investor copy) + #352 (organ tabs never-blank honest-degrade). Plus the still-pending-deploy #349 (joules honesty single-source) + #350 (anatomy/loop latency fix). Rebuild a11oy image FROM MAIN so all four land live. After deploy confirm: `/anatomy/loop` < 1s, `joules_label` honest, console shows skeletons not bare dots.
  - killinchu: #116 (/elite 48-view honest loading/context/degrade). Rebuild killinchu image FROM MAIN. Confirm /elite views show honest context strips + skeletons, no blank panels.
  - Start the replit-chaski Repl (2nd SAMAY lung / ollama serve) — needs the Replit boot credential you don't have.
  - VAST_API_KEY flip (marketplace earning) — held by founder until everything's ready.
  - a11oy: 12/13 surfaces 200 + fast (~0.46s). /formula/sovereign + /ayni confirmed 200 at ROOT path (path-variant,
  - STRESS: 15/15 concurrent on compute-pool = 200 (rate-limit + cache hold under load).
  - HF: ALL live — a11oy/killinchu/yarqa/hatun-mcp + all 5 static spaces incl the NEW energy space (302 serving).
  - CI: all 12 active repos main push-CI GREEN.
  - #350 anatomy/loop latency fix (4.56s -> 0.6s via circuit breaker + cache; honest gpu_state:sleeping degraded
  - #349 joules-honesty (single-source label; "measured" only with fresh real exporter + evidence fields). Verify
  - Full resilience/observability/prod-hardening stack (#345/#346/#347/#348) — security headers, rate limit,
  - The loop (#341), dark surfaces (#342), research infra (#344), YARQA consolidation, killinchu verticals (#115).
  - MERGED-BUT-NOT-LIVE: joules-honesty fix #349 is on main but NOT deployed (revenue/estimate joules_label=None =
  - ONE REAL CODE GAP: /api/a11oy/v1/anatomy/loop = 3.4s (probes sleeping GPU/offline chaski, eats the wait). An Opus
  - PATH-VARIANT (confirm, likely not bugs): /api/a11oy/v1/{formula/sovereign,research/verify,ayni} show 404 but
  - After rebuild: python3 tools/szl_smoke_stress.py --mode smoke -> target PASS (all 200, latency<2s, joules honest).
  - ENERGY SPACE — confirmed live (SZLHOLDINGS/energy, static, 302). Keep it; verify it reads the live a11oy API.
  - JOULES HONESTY FIX — an Opus PR (fix/joules-honesty) is incoming: single-source joules_label helper, "measured"
  - LATENCY POSTURE — the 5 smoke latency flags (anatomy/loop, heart/pulse, /ayni, sovereign-compute, qbio ~3s) are
  - Re-run python3 tools/szl_smoke_stress.py --mode smoke after the rebuild; target PASS (all 200, latency<2s,
  - chaski-THE-GPU-NODE = the replit-chaski Repl at tailnet 100.76.58.50, currently POWERED OFF (tailscale rx 0,
  - chaski-THE-BRAIN (HF Space orchestrator) = separate: if it is still stub, run forge_hf_activate.py in the
  - VERIFY (real, no bandaid): curl http://100.76.58.50:11434/v1/models -> 200 + model list; then /compute-pool
  - ENERGY SPACE — SOURCE NOW DELIVERED: I placed it at replit-sync/hf_energy_space/ (index.html + assets/{data.js,
  - CHASKI — POWERED OFF (your honest finding: tailscale rx 0, ollama 000, ssh 502). You CANNOT wake it from the box
  - DISPATCH (the real throughput upgrade): dispatch_ok=False, dispatch_mode=none, forge_agent_url=none — you run
  - ZK (prove the OUTPUT without revealing inputs): "ZK proves correctness; TEEs protect execution." SZL already has
  - PROOF-OF-INFERENCE receipt: extend the existing marketplace/verify receipt so each inference job carries a
  - ATTESTATION ENVELOPE: where we run on our own metal, attach a hardware/runtime attestation (what ran, where);
  - The pitch payoff: verified inference is becoming table stakes for pharma/defense/finance buyers (the exact
  - Rebuild a11oy image FROM MAIN. Gate the swap on /api/a11oy/v1/health/ready==200 (K8s maxUnavailable:0 pattern);
  - Rebuild killinchu image FROM MAIN -> finance/* + realestate/* + /elite/wiring 200.
  - Verify: python3 tools/szl_smoke_stress.py smoke TWICE -> require ALL surfaces 200 AND STAY 200, compute-pool <1s,
  - Same rebuild flips: /ayni, /research/prereg, /research/verify, /harvest/datacenters. Wire szl-router live
  - Rebuild a11oy image FROM MAIN (COPY all hardening modules: szl_backend_hardening, szl_prod_hardening,
  - READINESS-GATED swap (K8s maxUnavailable:0): new image must pass /api/a11oy/v1/health/ready (200) BEFORE it
  - ONE canonical deploy path from main; kill any competing/older redeploy reverting surfaces.
  - After swap: run python3 tools/szl_smoke_stress.py smoke TWICE; require ALL surfaces 200 AND STAY 200 across both
  - Same rebuild flips the still-404s: /ayni, /research/prereg, /research/verify, /harvest/datacenters; + killinchu
  - New observability endpoints (when feat/observability lands): /api/a11oy/v1/observability/traces +
  - Mount the jackin-console as the "JACK IN" surface on killinchu (route /jackin and/or folded into
  - Wire it to the REAL existing endpoints (same-origin): /api/killinchu/v1/cuas/{plausibility,wta,
  - ADD the 5-modality FUSION + DroneID layer (JACKIN_GAP_ADDENDUM.md): per-track modality row
  - CONNECT transports must work in-browser over HTTPS (Web Serial + Web Bluetooth = Chrome/Edge +
- **Founder-gated, auto-skipped (1)** (Doctrine v11 — keys/secrets/major-bumps):
  - DISPATCH — wire FORGE_AGENT_URL / FORGE_DISPATCH_CMD in YOUR OWN secret store so you run hands-off (founder does
- Reachability snapshot: https://a11oy.net/healthz -> 200
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.

## Auto-loop pass — order `8a97ca9c` — 2026-06-13T20:07:25Z

- **Actionable items (61)** — handed to Forge agent (mode=`none`, ok=`False`):
  - **a11oy `main`** now serves `/cathedral` + `/cathedral/app.js` from `cathedral_genius.html` + `static/cathedral_app.js` (sha256-identical to the HF build), vendored Three.js reused at `/hero/vendor3d/`. 0 runtime CDN. The `/` front door is untouched.
  - **FORGE:** after #353 (already merged): rebuild the **a11oy** Docker image from `main` and the **killinchu** image from `main` (byte-identical mirror — respect the shared-source drift allow-list; cathedral.html/serve.py are intentionally per-repo divergent, do NOT force-converge them).
  - **FORGE:** re-push the canonical genius build to the **HF `SZLHOLDINGS/cathedral`** static space. The live HF cathedral space is STALE at locked=5 — the canonical build says locked-proven = **8**. Source is in `replit-sync/hf_spaces/cathedral_live_src/` (index.html + app.js + vendor/{three.module.min.js,OrbitControls.js,THREE_LICENSE.txt} + szl_verify_widget.js). FIXED this pass: the "Operator" capability was a second orange sun (violated single-sun doctrine) → now a violet capability orb; verify launcher repositioned to bottom-center (was overlapping the legend). Push the folder VERBATIM — keep all vendor/ files.
  - After: GET https://szlholdings-cathedral.static.hf.space/ and https://a11oy.net/cathedral → confirm 200, ONE gold a11oy sun, locked-proven = 8, app.js ~36KB.
  - **hatun-mcp `main`** now content-negotiates `/`: browsers (Accept: text/html) get the console; MCP/API clients (application/json) get the BYTE-IDENTICAL original JSON. Live 25-tool catalog from the real server-card, pubkey fingerprint, a11oy-fabric probe, honest SNAPSHOT fallback. 48 pytest pass.
  - **FORGE:** after #32 (already merged): rebuild the hatun-mcp image from `main` and publish to HF `SZLHOLDINGS/hatun-mcp` via the repo's `push_to_hf.py`:
  - After: `curl -H 'Accept: text/html' https://szlholdings-hatun-mcp.hf.space/` → HTML console; `curl -H 'Accept: application/json' .../` → original JSON; `/healthz` + `/mcp` initialize still 200.
  - `cathedral_live_src/` → SZLHOLDINGS/cathedral (see §1)
  - `hf_energy_space/` → SZLHOLDINGS/energy (also de-CDN'd: three.js now vendored, was unpkg)
  - `hf_khipu_space/` → SZLHOLDINGS/khipu-constellation (**de-CDN'd this pass: 3d-force-graph now vendored UMD under vendor/, was esm.sh — now 0 runtime CDN; render-verified**)
  - `hf_llmrouter_space/` → SZLHOLDINGS/llm-router-live (PUBLIC STATUS ONLY — router internals stay PRIVATE; honest SNAPSHOT because /router/* has no CORS)
  - `anatomy/` → SZLHOLDINGS/anatomy (additive widget only; the V8/V9 dual-body lens untouched. The two figures = a11oy decision-body + killinchu maritime/C2 body, INTENTIONAL dual-body design.)
  - **FORGE:** push each folder VERBATIM (all assets/vendor/lib + snapshots) to its HF static space. Confirm 200 + the verify widget present on each.
  - OPTIONAL (only if quick+safe): add `Access-Control-Allow-Origin: *` to the 3 read-only `/router/*` public-status endpoints so the llm-router page shows LIVE not SNAPSHOT (NEVER expose router internals). compute-pool already sends it. If not trivially safe, leave honest SNAPSHOT.
  - KNOWN follow-up (not blocking): anatomy has a minor label-overlap (RUWAY/CHAPAQ) in the dense dual-body lens — a future polish pass, not a deploy blocker.
  - Start the replit-chaski Repl (2nd SAMAY lung / ollama serve) — needs the Replit boot credential Forge lacks.
  - VAST_API_KEY flip (marketplace earning) — founder holds until ready.
  - a11oy: #351 (console honest skeletons + fail-fast KPI + investor copy) + #352 (organ tabs never-blank honest-degrade). Plus the still-pending-deploy #349 (joules honesty single-source) + #350 (anatomy/loop latency fix). Rebuild a11oy image FROM MAIN so all four land live. After deploy confirm: `/anatomy/loop` < 1s, `joules_label` honest, console shows skeletons not bare dots.
  - killinchu: #116 (/elite 48-view honest loading/context/degrade). Rebuild killinchu image FROM MAIN. Confirm /elite views show honest context strips + skeletons, no blank panels.
  - Start the replit-chaski Repl (2nd SAMAY lung / ollama serve) — needs the Replit boot credential you don't have.
  - VAST_API_KEY flip (marketplace earning) — held by founder until everything's ready.
  - a11oy: 12/13 surfaces 200 + fast (~0.46s). /formula/sovereign + /ayni confirmed 200 at ROOT path (path-variant,
  - STRESS: 15/15 concurrent on compute-pool = 200 (rate-limit + cache hold under load).
  - HF: ALL live — a11oy/killinchu/yarqa/hatun-mcp + all 5 static spaces incl the NEW energy space (302 serving).
  - CI: all 12 active repos main push-CI GREEN.
  - #350 anatomy/loop latency fix (4.56s -> 0.6s via circuit breaker + cache; honest gpu_state:sleeping degraded
  - #349 joules-honesty (single-source label; "measured" only with fresh real exporter + evidence fields). Verify
  - Full resilience/observability/prod-hardening stack (#345/#346/#347/#348) — security headers, rate limit,
  - The loop (#341), dark surfaces (#342), research infra (#344), YARQA consolidation, killinchu verticals (#115).
  - MERGED-BUT-NOT-LIVE: joules-honesty fix #349 is on main but NOT deployed (revenue/estimate joules_label=None =
  - ONE REAL CODE GAP: /api/a11oy/v1/anatomy/loop = 3.4s (probes sleeping GPU/offline chaski, eats the wait). An Opus
  - PATH-VARIANT (confirm, likely not bugs): /api/a11oy/v1/{formula/sovereign,research/verify,ayni} show 404 but
  - After rebuild: python3 tools/szl_smoke_stress.py --mode smoke -> target PASS (all 200, latency<2s, joules honest).
  - ENERGY SPACE — confirmed live (SZLHOLDINGS/energy, static, 302). Keep it; verify it reads the live a11oy API.
  - JOULES HONESTY FIX — an Opus PR (fix/joules-honesty) is incoming: single-source joules_label helper, "measured"
  - LATENCY POSTURE — the 5 smoke latency flags (anatomy/loop, heart/pulse, /ayni, sovereign-compute, qbio ~3s) are
  - Re-run python3 tools/szl_smoke_stress.py --mode smoke after the rebuild; target PASS (all 200, latency<2s,
  - chaski-THE-GPU-NODE = the replit-chaski Repl at tailnet 100.76.58.50, currently POWERED OFF (tailscale rx 0,
  - chaski-THE-BRAIN (HF Space orchestrator) = separate: if it is still stub, run forge_hf_activate.py in the
  - VERIFY (real, no bandaid): curl http://100.76.58.50:11434/v1/models -> 200 + model list; then /compute-pool
  - ENERGY SPACE — SOURCE NOW DELIVERED: I placed it at replit-sync/hf_energy_space/ (index.html + assets/{data.js,
  - CHASKI — POWERED OFF (your honest finding: tailscale rx 0, ollama 000, ssh 502). You CANNOT wake it from the box
  - DISPATCH (the real throughput upgrade): dispatch_ok=False, dispatch_mode=none, forge_agent_url=none — you run
  - ZK (prove the OUTPUT without revealing inputs): "ZK proves correctness; TEEs protect execution." SZL already has
  - PROOF-OF-INFERENCE receipt: extend the existing marketplace/verify receipt so each inference job carries a
  - ATTESTATION ENVELOPE: where we run on our own metal, attach a hardware/runtime attestation (what ran, where);
  - The pitch payoff: verified inference is becoming table stakes for pharma/defense/finance buyers (the exact
  - Rebuild a11oy image FROM MAIN. Gate the swap on /api/a11oy/v1/health/ready==200 (K8s maxUnavailable:0 pattern);
  - Rebuild killinchu image FROM MAIN -> finance/* + realestate/* + /elite/wiring 200.
  - Verify: python3 tools/szl_smoke_stress.py smoke TWICE -> require ALL surfaces 200 AND STAY 200, compute-pool <1s,
  - Same rebuild flips: /ayni, /research/prereg, /research/verify, /harvest/datacenters. Wire szl-router live
  - Rebuild a11oy image FROM MAIN (COPY all hardening modules: szl_backend_hardening, szl_prod_hardening,
  - READINESS-GATED swap (K8s maxUnavailable:0): new image must pass /api/a11oy/v1/health/ready (200) BEFORE it
  - ONE canonical deploy path from main; kill any competing/older redeploy reverting surfaces.
  - After swap: run python3 tools/szl_smoke_stress.py smoke TWICE; require ALL surfaces 200 AND STAY 200 across both
  - Same rebuild flips the still-404s: /ayni, /research/prereg, /research/verify, /harvest/datacenters; + killinchu
  - New observability endpoints (when feat/observability lands): /api/a11oy/v1/observability/traces +
  - Mount the jackin-console as the "JACK IN" surface on killinchu (route /jackin and/or folded into
  - Wire it to the REAL existing endpoints (same-origin): /api/killinchu/v1/cuas/{plausibility,wta,
  - ADD the 5-modality FUSION + DroneID layer (JACKIN_GAP_ADDENDUM.md): per-track modality row
  - CONNECT transports must work in-browser over HTTPS (Web Serial + Web Bluetooth = Chrome/Edge +
- **Founder-gated, auto-skipped (1)** (Doctrine v11 — keys/secrets/major-bumps):
  - DISPATCH — wire FORGE_AGENT_URL / FORGE_DISPATCH_CMD in YOUR OWN secret store so you run hands-off (founder does
- Reachability snapshot: https://a11oy.net/healthz -> 200
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.
