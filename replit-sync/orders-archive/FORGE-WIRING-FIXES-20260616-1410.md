<!-- NEXT_ORDER updated 2026-06-16 14:10 ET. Opus-4.8 wiring audit found 2 BLOCKERs (precise file:line): (1) /frontier/manifest mints+signs a Khipu receipt per GET = 4s block + chain pollution -> cache it / stop signing per-view; (2) OMEN can't be an energy lung because the energy loop reads _default_nodes() not the hardened pool -> set A11OY_OMEN_BASE_URL + A11OY_OMEN_STANDBY=0 AND add a code fallback. Plus the box->OMEN tailnet probe + HF a11oy static conversion still stand. Estate EDITABLE (freeze held to 06-20 01:00 ET). -->

# FORGE ORDER — WIRING AUDIT FIXES (precise, file:line) — 2026-06-16 14:10 ET

Doctrine v11: never fabricate a 200/joule/receipt; reachable=REAL-PROBE-ONLY; honest BLOCKED beats fake green; never touch lutar-lean. Estate EDITABLE until 2026-06-20 01:00 ET (freeze held) — normal main work + PRs land now.

A read-only Opus-4.8 wiring audit booted the real app (918 routes) and found 2 BLOCKERs + WARNs. Exact locations below. Execute the fixes; open normal PRs (pre-freeze). Each fix has a verify step — prove it, never fake it.

## BLOCKER 1 — /frontier/manifest mints+signs a Khipu receipt on EVERY GET (4s block + chain pollution)
ROOT CAUSE (verified): `szl_frontier_manifest.py` handler `_frontier_manifest()` (~line 425) -> `build_manifest()` (~line 347) runs all tiles inline, synchronously, on a coroutine (blocks the event loop). The dominant cost is `_concept_tile_inference_provenance` (szl_frontier_manifest.py:275-292) which calls `szl_provenance_receipt.build_composite()` (~:288) on EVERY request — that MINTS + SIGNS a fresh composite Khipu receipt into the shared provenance chain (szl_provenance_receipt.py ~:323/:351). So a read endpoint signs + chain-appends per page view: ~4.2s each AND it pollutes the provenance chain with one signed receipt per view. The fabric tile is already cached (45s TTL) — NOT the culprit.

FIX (pick the clean combination; do not weaken honesty):
1. STOP signing per-GET. `_concept_tile_inference_provenance` must NOT call build_composite() on every request. Either (a) make the concept tile a static descriptor / last-known composite DIGEST (read the most recent composite from the chain, don't mint a new one), or (b) compute+sign a composite at most once per long interval (e.g. cache the composite for >=5 min) and serve the cached digest in between. The tile should DESCRIBE the provenance capability honestly (link to /energy/ledger, show chain.ok + length) without minting a receipt just because someone loaded the page.
2. CACHE build_manifest() with a short TTL (15-30s) so bursts don't each pay the full build.
3. Offload any remaining blocking work to a threadpool (run_in_executor) and add a per-tile timeout so one slow tile can't block the whole response.
VERIFY: time 5 sequential GETs to /api/a11oy/v1/frontier/manifest — each should return <500ms warm; and confirm the provenance chain length does NOT increment by one per manifest view (it should only grow from real energy jobs, not page loads). Labels stay honest (6 MEASURED / 1 MODELED orbital / 1 ROADMAP).

## BLOCKER 2 — OMEN cannot be an energy-loop lung under stock env (two divergent node lists)
ROOT CAUSE (verified): there are TWO independent node lists. The hardened pool `szl_backend_hardening.py:495 DEFAULT_FABRIC_NODES` hardcodes OMEN at the correct IP 100.70.130.45:11434 (that's why /compute-pool-hardened can show it). BUT the ENERGY LOOP reads a DIFFERENT list: `szl_energy_operator.py:127 _default_nodes()`. In that list OMEN (szl_energy_operator.py:201-214) defaults to (a) bare hostname `http://omen-betterwithage:11434/v1` (szl_energy_operator.py:165-169) which will NOT resolve on the box, and (b) `omen_standby=True` (szl_energy_operator.py:173-180) so it's skipped as standby. So even when the hardened pool shows OMEN green, the energy loop never breathes it. Same env-pin pattern as chaski.

FIX — do BOTH (this is an env/wiring fix, the safest path; THEN consider the code fallback):
1. PERSIST these env vars on the box service (same place chaski's are set), then restart the a11oy service so the energy operator re-reads:
   - `A11OY_OMEN_BASE_URL=http://100.70.130.45:11434`   (auto-normalized to /v1)
   - `A11OY_OMEN_STANDBY=0`                              (or alias `A11OY_ENERGY_OMEN_ENABLED=1`)
   NOTE: this only HELPS once the box can actually reach 100.70.130.45:11434 (the tailnet path — see the box->OMEN probe order). Setting the env does NOT fake reachability; if the path is still timing out, OMEN stays honestly unreachable. Set the env so the instant the path opens, OMEN breathes as a lung. Doctrine: reachable=REAL-PROBE-ONLY.
2. CODE FALLBACK (open a PR, pre-freeze): make `_default_nodes()` (szl_energy_operator.py:127) fall back to the hardened `DEFAULT_FABRIC_NODES` OMEN IP when `A11OY_OMEN_BASE_URL` is unset, so the two lists can't silently diverge again. Keep standby default honest (only flips live on real reachability). This closes the divergent-list regression class permanently.
VERIFY: once the tailnet path is open + env set, /api/a11oy/v1/energy/operator/status nodes_computing INCLUDES omen-betterwithage and gpu_nodes_reachable rises — REAL PROBE ONLY. OMEN has a real RTX NVML, so its per-job joules can be MEASURED (chaski stays PENDING_EXPORTER). Send the 'OMEN 3rd lung LIT' notification only on a real 200.

## WARN 3 — extend the demo-critical route guard
`tests/test_demo_critical_routes.py` (git-tracked) DEMO_CRITICAL_ROUTES guards 11 routes but OMITS demo-dependent API paths. ADD (exact match, not substring): `/api/a11oy/v1/honest`, `/api/a11oy/v1/compute-pool-hardened` (exact), `/api/a11oy/v1/harvest/posture`, `/api/a11oy/v1/energy/jtoken`. PR pre-freeze.

## WARN 4 — verify the SPA client renders the bare page paths (silent-failure risk)
These bare pages have NO server route and fall to the SPA catch-all (always 200, never 404): `/holographic /energy-ops /energy-holographic /pnt /pinn /elite /signature-is-not-proof /estate-hologram`. If the built JS bundle's client router is missing any one, it renders a blank shell (200) — a SILENT demo failure no route-table test catches. ACTION: from the BUILT bundle (Docker/static dir, not the sparse source), load each of these 8 pages headless and confirm real content renders (a known element/text per page), not an empty shell. Report any that render blank. This is the highest-value pre-demo check after the two BLOCKERs.

## WARN 5 — confirm plain /api/a11oy/v1/compute-pool
Only `/compute-pool-hardened` exists; there is no plain `/compute-pool` API route. The earlier CTO probes hit `/api/a11oy/v1/compute-pool` and got JSON — confirm whether that resolves via a router prefix or is actually the hardened handler. If the demo/client calls the plain path and it would 404, add an alias. Report what you find.

## HEALTHY (do NOT touch — audit confirmed live)
- Energy operator->ledger wire is present + live (serve.py:444-451, _ledger_wired=True, 1 subscriber on the same singleton). It's a subscribe() not a register(), so the route guard does NOT cover it — keep `test_energy_wire_operator_ledger.py` GREEN in CI (that's the silent-disconnect guard).
- No honest-label violations: MEASURED gated on a real fresh (<30s) NVML delta; stub/SAMPLE/ephemeral all honestly disclosed. Keep it that way.
- Ledger cross-redeploy durability needs `SZL_ENERGY_LEDGER_PATH` on a persistent volume (env/infra, not a code bug) — already handled via /data mount; just keep it set.

## REPORT
Append to replit-sync/forge-perplexity-update-20260616.md: BLOCKER1 manifest timing before/after + chain-length-stable proof; BLOCKER2 env set + (when path open) OMEN lung truth; WARN4 the 8 bare-page render results (the silent-failure check); PR numbers. Honest doctrine v11.
