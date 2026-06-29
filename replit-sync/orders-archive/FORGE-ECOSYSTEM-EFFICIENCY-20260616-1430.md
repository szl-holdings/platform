<!-- ADDED 2026-06-16 14:30 ET — ECOSYSTEM EFFICIENCY upgrade (founder: 'do the same for all our demos + run more efficiently'). Covers killinchu (2 BLOCKER loop-stall fixes + demo-receipt cache + warmer) and szl-router (embeddings cache + connection pool now; energy-aware batch routing staged). a11oy items already queued above. All SAFE-scope, pre-freeze PRs, must NOT destabilize the chaski lung. Full order appended at the very bottom. -->

<!-- ADDED 2026-06-16 14:15 ET — USEFUL-WORK + ENERGY-HARNESS upgrade (founder: 'more jobs that help the software run + harness the energy'). Full order appended below the wiring fixes. SAFE-scope, pre-freeze PRs, must not destabilize the chaski lung. -->

> [2026-06-16 18:10 ET — FIX, founder green light] a11oy HF Space BUILD_ERROR — ROOT CAUSE FOUND: web/dns.html is on GitHub (blob eac8df5b) + COPYd by the Dockerfile but ABSENT from the Space repo (resolve 404; siblings energy/materials/immune/sda .html = 307). The build COPY fails there. Interactive agent CANNOT push to Space main (connector is write-PR-only, 403). FORGE: mirror web/dns.html (+ audit all Dockerfile-COPYd web/*.html, mirror any 404) byte-identical from GitHub to the Space, extend hf-sync so web/*.html mirrors going forward (no bandaid), then factory-rebuild + prove stage RUNNING / console 200 / resolve dns.html 307. Box a-11-oy.com is LIVE + current (HEAD 57a88617) — Space is the only gap. Full steps: replit-sync/FORGE-INSTRUCTION-restart-a11oy-space-20260616-1805.md. Doctrine: honest content (no jarvis codename), never fake RUNNING.

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


# FORGE ORDER — USEFUL-WORK LOOP + CARBON/PRICE-AWARE HARNESS — 2026-06-16 14:15 ET

Doctrine v11: joules MEASURED only via real NVML; reachable=REAL-PROBE-ONLY; honest BLOCKED beats fake green; never fabricate a receipt/joule/carbon number; carbon stays MODELED until a real live feed makes it MEASURED; never touch lutar-lean. Estate EDITABLE until 2026-06-20 01:00 ET (freeze held) — open normal PRs. Keep the demo stable: scope SAFE, keep backpressure, do NOT destabilize the single chaski lung.

## WHY (founder directive: "more jobs that help the software run + harness the energy")
Today the energy loop runs REAL inference but on THROWAWAY content: 4 canned prompts (_GEN_PROMPTS) + 3 canned texts (_EMBED_TEXTS) at szl_energy_operator.py:218-231. The GPU genuinely computes (joules honestly MEASURED) but the OUTPUT IS DISCARDED. Meanwhile a11oy_org_rag.py (Agentic RAG over the SZL corpus, hybrid FTS5+dense) is STARVING for embeddings — it degrades to lexical-only "when the embedding model is loadable." And the loop READS the grid price (_update_grid_price, szl_energy_operator.py:734) + harvest posture exposes should_soak/grid_price/renewable% — but the loop NEVER ACTS on it (observe-only). Close both gaps.

## TASK 1 — USEFUL-WORK LOOP (replace throwaway workload with real corpus work)
Make the loop's jobs produce artifacts the software KEEPS. Keep every job small + backpressured (the loop must stay gentle on chaski). Two job kinds, both honest-metered exactly as today:
1a. CORPUS EMBEDDING (highest value): instead of embedding the 3 canned _EMBED_TEXTS, pull REAL un-embedded chunks from the SZL corpus (a11oy_org_rag.py corpus dir / INDEX.json) and embed them, WRITING the vectors into the live RAG dense index. Each embed job advances the corpus index by one chunk. Honest fallback: if the corpus dir / embedding model is unavailable, fall back to the current canned embed (labeled) — NEVER fabricate an indexed chunk (a11oy_org_rag.py already refuses fake indexes — respect that).
1b. DEMO-WARM QUERIES: precompute + cache embeddings for the exact queries you'll run on stage (keep a short A11OY_DEMO_WARM_QUERIES list) so the demo RAG is instant/warm, not cold.
- The generate jobs (_GEN_PROMPTS) can stay as light keep-warm, OR (nice-to-have) summarize recent merged PRs/commits into corpus-indexable text. Keep it gentle.
- DO NOT change the joule metering: MEASURED only on a real fresh NVML delta, exactly as szl_energy_operator.py:644-672 does now. Useful work changes WHAT is computed, not HOW joules are measured.
VERIFY: /energy/operator/status recent_jobs show kind=embed against real corpus chunks; the RAG dense index chunk-count INCREASES over time; a RAG query returns dense+lexical hits (not FTS5-only). Report before/after index size.

## TASK 2 — CARBON/PRICE-AWARE MODULATION (the actual "harness": observe -> ACT)
The loop already fetches grid price + the harvest posture endpoint already computes should_soak / grid_price_posture / renewable_share_pct / next_negative_windows. Wire the loop to MODULATE its useful-work rate on that signal (a closed loop: measure -> decide -> act -> measure):
- When posture is should_soak=true (cheap / negative-priced / high-renewable): SOAK — raise the useful-work rate (drain more corpus-embedding backlog) within safe backpressure caps.
- When grid_price_posture="expensive" (e.g. now 181 EUR/MWh): THROTTLE to baseline — keep the lung warm + demo-warm + freshness only; DEFER heavy batch embedding to the next cheap/green window.
- Expose the current mode honestly in /energy/operator/status (e.g. work_mode: "soak"|"baseline"|"throttle", and WHY — the grid signal that set it). Never claim a soak/throttle that didn't happen.
- Keep it gentle: modulation must respect the existing per-node in-flight cap + inter-job sleep (szl_energy_operator.py:52). Never overwhelm chaski (sole lung now).
VERIFY: flipping the grid signal (or a forced test posture) visibly changes work_mode and the job rate; status reports the mode + the grid reason honestly.

## TASK 3 — CARBON-ATTESTED RECEIPTS (do if clean; else note as roadmap)
jtoken already computes carbon_g_co2eq_per_token. Stamp each energy provenance receipt (the ledger JobRecord) with the carbon intensity AT THE MOMENT OF COMPUTE (from the harvest feed's gCO2/kWh). Then the ledger proves what ran + joules + HOW CLEAN those joules were. KEEP IT HONEST: carbon stays MODELED (label it) until Task 4's live feed lands — do not stamp a MEASURED carbon number off a static assumption. If this can't be done cleanly pre-freeze, leave it as a labeled roadmap field, do not half-wire it.

## TASK 4 (ROADMAP — note only, don't build under freeze pressure) — LIVE CARBON FEED
harvest/posture shows carbon_feed_live=false (static 380 g/kWh assumption). Wiring a real live carbon-intensity API (e.g. a public grid carbon feed) would make the carbon numbers MEASURED instead of MODELED. Note it as the next honest upgrade; build post-demo. Until then carbon is MODELED, labeled.

## GUARDRAILS
- SAFE-scope only. None of this may destabilize the demo or the chaski lung. If any task risks the single-lung stability, park it and report.
- Open normal PRs (pre-freeze). If a task can't land clean by 2026-06-20 01:00 ET, park it post-demo — the loop already works honestly today.
- Doctrine v11 throughout: real metering, honest labels, no fabrication, honest fallback when a corpus/feed/model is unavailable.

## REPORT
Append to replit-sync/forge-perplexity-update-20260616.md: Task1 (RAG index size before/after + recent_jobs kind), Task2 (work_mode modulation proof + grid reason), Task3 (carbon-stamp done or roadmap), PR numbers. Honest doctrine v11.


# FORGE ORDER — ECOSYSTEM EFFICIENCY + USEFUL-WORK UPGRADES — 2026-06-16 14:30 ET

Doctrine v11: never fabricate a 200/joule/receipt/carbon; reachable=REAL-PROBE-ONLY; honest BLOCKED beats fake green; honest fallback over fake success; never claim combined VRAM; carbon MODELED until a real live feed; never touch lutar-lean. Estate EDITABLE until 2026-06-20 01:00 ET (freeze held) — open normal PRs. HARD RULE: nothing here may destabilize the demo or the single chaski lung. Pre-freeze = land only LOW-risk additive items proven byte-identical on the reactive/demo path; everything MEDIUM-risk = stage post-demo.

Two Opus-4.8 read-only audits (killinchu, szl-router) + the prior a11oy audit produced file:line fixes. Reports: devteam/SZL_ROUTER_EFFICIENCY_AUDIT.md, devteam/KILLINCHU_EFFICIENCY_AUDIT.md, devteam/A11OY_WIRING_AUDIT.md. Theme across all three: real compute is honest but (a) wasted on throwaway/uncached work and (b) the energy/carbon brain is built but NOT plugged into routing/scheduling.

=================================================================
## A. KILLINCHU (counter-UAS demo app) — 2 BLOCKERs pre-freeze, rest post-demo
=================================================================
PRE-FREEZE (LOW risk, in-repo pattern already exists):
A1. [BLOCKER] Move OSINT blocking fetch off the async loop. killinchu_osint.py:240 (and _committed_head_probe :861) — wrap the urllib.request.urlopen calls in asyncio.to_thread EXACTLY like feeds_realdata.py:1221 already does. Kills the up-to-30s whole-app stall on ?fresh=1 // /osint/status. Highest demo-safety ROI. Test the 13 OSINT-backed views after.
A2. [BLOCKER] Same fix for killinchu_backend.py:512 live() — wrap the 12s ADS-B fetch in asyncio.to_thread. Removes the loop stall on ADS-B cache-miss.
A3. [USEFUL-WORK, LOW] Precompute + cache the 27 WarHacker demo receipts at boot/warmer (killinchu_warhacker_demos.py:3424). Turns per-launch throwaway Merkle/sim compute into kept, instant-replay artifacts (deterministic from the sim — honest). Makes the marquee demo instant on stage. VERIFY cached receipts match a fresh compute.
A4. [DEMO-SAFETY, ZERO code] Extend the existing warmer (killinchu_osint.py:1481 start_warmer) to also tick backend.live() + maritime/threat feeds at boot, so first-open never pays cold/live latency.
DO NOT pre-freeze: A5 cold-start lazy-mount refactor (~90 serial imports, scipy.stats 1.4s at killinchu_posture_topology.py:2907) — too much surface to re-validate in 4 days, DEFER post-demo. And DO NOT add torch/sklearn to the Dockerfile (would re-introduce a 4.5s import; prod already falls back to numpy honestly).
PRE-FLIGHT (zero code): verify Space secrets set (TAVILY_API_KEY, AISSTREAM_*, HF tokens, SZL_COSIGN_PRIVATE_PEM).

=================================================================
## B. SZL-ROUTER (the efficiency brain) — cache + pool pre-freeze; energy-aware routing staged
=================================================================
PRE-FREEZE (LOW risk, additive, zero behavior/honesty change):
B1. [BLOCKER-opportunity] Add an exact-hash cache to /v1/embeddings (core.py:410-473, around the POST at :441). Deterministic, highest repeat rate (RAG-heavy), lowest blast radius — reuse the proven _HARVEST_CACHE TTL pattern (core.py:522-523, 629). Mark provenance served_by:"cache" honestly. Behind a TTL+size cap. (Keep CHAT caching for POST-freeze — temperature/tools/non-determinism make it correctness-sensitive.)
B2. [LOW-MED] Connection reuse / keep-alive pool for upstream calls — replace per-call urllib.urlopen with a pooled session; stop sending Connection: close (core.py:277-291, 381-393; coordinator mesh_coordinator.py:306-318,514,547). Bounded pool, per-host caps; preserve the Groq Cloudflare-UA handling at core.py:282-284.
STAGE (land ONLY if provably byte-identical on reactive turns; else immediately post-freeze):
B3. [energy harness — the big one] Wire the EXISTING energy/carbon brain into route ordering FOR BATCH/PROACTIVE TRAFFIC ONLY. The router already has should_soak_wasted_energy(), harvest_status(), fabric_status() (core.py:620-741) fetching real negative-price/curtailment/carbon — but chat() (core.py:327) NEVER consults them. Add a prefer_sovereign re-ordering in resolve_routes/chat that reads should_soak (core.py:669) ONLY when a new explicit batch/proactive flag is set (add the param at core.py:310-323, pass-through app.py:88-95). HARD GATE: default OFF, so reactive/user turns are byte-for-byte unchanged. The signal is already sovereign:false-safe (core.py:656) — no honesty risk; the brain was built doctrine-clean, it was just never connected.
POST-FREEZE (defer): B4 cached liveness probe (core.py:329/316; mirror mesh_coordinator.py:124-131,202-231 15s TTL) so dead-but-armed nodes don't burn the 60s timeout; B5 coalesce/dedup concurrent embeddings (core.py:435, app.py:107-135); B6 least-load tie-break across sovereign nodes (cleanest pre-freeze version is config-only: point A11OY_MODEL_BASE_URL at the existing MeshCoordinator, no code change); B7 greenest-reachable-node tilt using already-fetched carbon (core.py:576-587); B8 stream passthrough (app.py:94).

=================================================================
## C. A11OY (already in the prior order — keep, do not duplicate)
=================================================================
Already ordered (FORGE-WIRING-FIXES + USEFUL-WORK-HARNESS): /frontier/manifest stop signing per-GET + cache; OMEN energy-loop env+fallback; route-guard extension; SPA bare-page render check; useful-work corpus embedding into RAG + demo-warm; carbon/price-aware modulation. Execute those as written; this order ADDS killinchu + router. Note: a11oy's /frontier/manifest 15s is the same per-GET-signing BLOCKER already queued — confirm fixed.

=================================================================
## D. CROSS-CUTTING (validates the Khaled/geo thread — INFRA, post-demo)
=================================================================
Both audits independently flagged GEO-DISTRIBUTED EGRESS as the one real fit: killinchu's air/sea feeds (adsb.lol, OpenSky, adsb.fi, AISStream, Digitraffic, Kystverket) use China/Asia-Pacific theater bboxes and the code itself notes OpenSky egress is region-blocked. A region-distributed egress mesh would measurably improve live coverage. This is INFRA config, no app-code change, OUT OF SCOPE for the freeze — note as post-demo roadmap (this is the legit killinchu use-case for an anyIP-class vendor, NOT a11oy).

## EXECUTION ORDER (respect the freeze)
1. NOW (pre-freeze, LOW risk): A1, A2, A3, A4 (killinchu) + B1, B2 (router) — separate small PRs, each verified, demo path unchanged.
2. STAGE: B3 (energy-aware batch routing) only if the batch flag is provably default-off/byte-identical; else post-freeze.
3. POST-DEMO: A5 (cold-start refactor), B4-B8, D (geo egress), a11oy carbon live-feed.

## REPORT
Append to replit-sync/forge-perplexity-update-20260616.md per item: PR number, before/after timing (killinchu /elite cold+warm, /osint stall gone, embeddings cache hit-rate), and honest confirmation the reactive/demo path is unchanged. Never fabricate a timing or a cache hit. Honest doctrine v11.
