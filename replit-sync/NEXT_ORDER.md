## R-GREENLIGHT-GO (TOP — founder GREEN LIGHT: deploy everything from main NOW) — DEPLOY, do NOT merge
FULL HARDENING STACK NOW ON MAIN (all merged, permanent): szl_backend_hardening (#346 concurrent+cached+timeout),
szl_prod_hardening (#345 OWASP headers/ratelimit/reqid/error-envelope), szl_resilience (#347 Hystrix circuit
breaker + /health/live + /health/ready), szl_observability (#348 OpenTelemetry-style tracing + SLO summary),
szl_dark_surfaces_register (#342), szl_anatomy_loop (#341 + YARQA), szl_research_infra (#344). killinchu #115
(finance/realestate verticals) merged. khipu #3 merged. The Dockerfiles COPY these modules.
ONE ACTION UNLOCKS EVERYTHING: rebuild the a11oy + killinchu HF Space images FROM MAIN, readiness-gated. Live state
proves hardening partially landing (harvest/metrics 6.9s->0.45s, compute-pool ~1.7s) but /formula/sovereign +
/health/ready still 404 = image still behind main. Finish it:
1. Rebuild a11oy image FROM MAIN. Gate the swap on /api/a11oy/v1/health/ready==200 (K8s maxUnavailable:0 pattern);
   auto-rollback if 503 (ECS circuit-breaker pattern). This STOPS the flapping permanently.
2. Rebuild killinchu image FROM MAIN -> finance/* + realestate/* + /elite/wiring 200.
3. Verify: python3 tools/szl_smoke_stress.py smoke TWICE -> require ALL surfaces 200 AND STAY 200, compute-pool <1s,
   anatomy/loop <1s, harvest/metrics valid JSON, /health/ready 200, joules evidence fields present, observability
   /traces showing real spans. Use a trace to confirm where any remaining latency is.
4. Same rebuild flips: /ayni, /research/prereg, /research/verify, /harvest/datacenters. Wire szl-router live
   (PRIVATE, honest x_szl_provenance). chaski durable Ollama 2nd lung (real 200). Push HF SZLHOLDINGS/energy space.
   Tune smoke scanner (betterwithage IS own metal).
HOLD VAST (founder flips last, after all green). REPORT to replit-sync the smoke verdict (PASS=all 200+stay+
compute-pool<1s+ready 200) and chaski real-200-or-blocker.
DOCTRINE v11: readiness-gated deploy + circuit breaker = root-cause flapping fix (no band-aids); honest breaker/
readiness/joules-evidence; sovereign own-metal-only (betterwithage IS own metal); joules MEASURED only via real
exporter; ONE loop; no free-energy (#239/#240); locked=8; Λ=Conj1; Khipu=Conj2; no key; do NOT merge. GREEN LIGHT:
rebuild from main, gated, verify with the harness. This is the unlock.

## R-DEPLOY-THE-HARDENING (TOP — CRITICAL: the hardening is on main but NOT live; deploy it via the readiness gate) — DEPLOY, do NOT merge
THE REALITY: 3 hardening PRs are MERGED to main (#346 backend cache+timeout, #345 prod headers/ratelimit, #378
smoke harness) + 2 more incoming (feat/resilience circuit-breaker+live/ready, feat/observability tracing). BUT the
LIVE image is STALE — verified now: compute-pool STILL 7.3s, anatomy/loop 7.2s, /formula/sovereign STILL 404
flapping. NONE of the hardening is live. The single blocking action: rebuild the a11oy HF Space image FROM MAIN.
Everything else waits on this. DO IT NOW with the leader-tech deploy discipline:
1. Rebuild a11oy image FROM MAIN (COPY all hardening modules: szl_backend_hardening, szl_prod_hardening,
   szl_dark_surfaces_register, szl_anatomy_loop, szl_research_infra + szl_resilience + szl_observability when those
   PRs merge). 
2. READINESS-GATED swap (K8s maxUnavailable:0): new image must pass /api/a11oy/v1/health/ready (200) BEFORE it
   replaces the old — this STOPS the 404 flapping. If ready=503, do not swap; auto-rollback to last-good (ECS
   deployment-circuit-breaker pattern).
3. ONE canonical deploy path from main; kill any competing/older redeploy reverting surfaces.
4. After swap: run python3 tools/szl_smoke_stress.py smoke TWICE; require ALL surfaces 200 AND STAY 200 across both
   runs, compute-pool <1s (the breaker+cache must be live), harvest/metrics valid JSON, joules evidence fields
   present (joules_measured_total, exporter_node, exporter_last_seen_ts, power_w_sample).
5. Same rebuild flips the still-404s: /ayni, /research/prereg, /research/verify, /harvest/datacenters; + killinchu
   image from main for finance/realestate; + szl-router live PRIVATE w/ honest x_szl_provenance; + chaski 2nd lung
   durable; + push HF SZLHOLDINGS/energy space; + tune smoke scanner (betterwithage IS own metal, not a violation).
6. New observability endpoints (when feat/observability lands): /api/a11oy/v1/observability/traces +
   /health-summary — use a trace to CONFIRM where the compute-pool time went, prove the breaker fixed it.
HOLD VAST (founder flips last). REPORT to replit-sync: the szl_smoke_stress smoke verdict (PASS = all 200 + stay
200 + compute-pool <1s), /health/ready status, joules evidence present, chaski real-200-or-blocker.
DOCTRINE v11: no band-aids — readiness-gated deploy + circuit breaker = the root-cause flapping/latency fix; honest
breaker/readiness/joules-evidence; sovereign own-metal-only; joules MEASURED only via real exporter; ONE loop; no
free-energy (#239/#240); locked=8; Λ=Conj1; Khipu=Conj2; no key; do NOT merge. The rebuild-from-main IS the unlock.

# SZL Forge — ORDER: killinchu "JACK IN" Mission Console (build + the 5-modality/DroneID layer)

PRIORITY: high. Read `replit-sync/FREEZE.json` FIRST and obey it (see FREEZE RULE below).

## CONTEXT
Founder mission: at the demo, someone brings a drone — operator connects (USB/Serial, Bluetooth,
network, ADS-B/AIS, or SITL sample), and killinchu shows the full capability live: connect → live
telemetry → fuse/track → classify → governed decide → SIMULATED engage (human-on-the-loop) →
cryptographic receipts you can re-hash yourself. A 5-Opus-dev build is already done + integrated in
the workspace at /home/user/workspace/jackin-console/ (shell+CONNECT, LIVE FEED+TRACKS,
CLASSIFY+DECIDE, ENGAGE-sim+RECEIPTS), wired to REAL killinchu endpoints. Specs:
team/HARDENING/JACKIN_CONSOLE_SPEC.md + JACKIN_GAP_ADDENDUM.md.

## WHAT TO BUILD / FINISH (Replit/Forge)
1. Mount the jackin-console as the "JACK IN" surface on killinchu (route /jackin and/or folded into
   /elite). Serve it from killinchu's serve.py; static assets vendored (0 runtime CDN).
2. Wire it to the REAL existing endpoints (same-origin): /api/killinchu/v1/cuas/{plausibility,wta,
   consensus,fusion,pqbus}, /v1/drones/database, /v1/adsb, /v1/ais/live, /khipu/sign,
   /api/a11oy/v2/command-log, /api/a11oy/v1/ledger. No fabricated data — LIVE vs SAMPLE labeled.
3. ADD the 5-modality FUSION + DroneID layer (JACKIN_GAP_ADDENDUM.md): per-track modality row
   [RF][RADAR][EO/IR][ACOUSTIC][REMOTE-ID] with contributing/blind + the cross-verify narrative;
   a Remote ID / DJI-DroneID (ASTM F3411 / OpenDroneID, OcuSync2/3/4 hash-without-decode) decode
   panel in CLASSIFY; an honest blind-spot table per modality. SAMPLE-label any modality we don't
   physically have at the demo; never claim live hardware we don't have.
4. CONNECT transports must work in-browser over HTTPS (Web Serial + Web Bluetooth = Chrome/Edge +
   user gesture; show honest note on Firefox/Safari). SITL sample path must work with NO hardware so
   the demo never depends on a device. Vendor mavlink-browser (no CDN).

## DOCTRINE HARD GATE (never violate)
effector SIMULATED, human-on-the-loop, prominent — NO takeover/jam/spoof/real-command claims.
locked=8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17 · Λ=Conjecture 1 · Khipu=Conjecture 2 ·
trust never 100% · 0 runtime CDN · WCAG-AA · real receipts (DSSE via /khipu/sign), never fake a MATCH ·
GitHub↔HF byte-identical on shared modules · ast.parse/node --check before push · never commit a key.

## FREEZE RULE (critical)
FREEZE.json activates 2026-06-16. BEFORE then: you MAY build + push this to killinchu (GitHub + HF
byte-identical) and factory-restart — it's new, additive, behind its own route, and verified by QA.
FROM 06-16 to 06-19 (frozen): do NOT push/deploy/restart-for-change; if the console needs a fix in
that window it is a HOTFIX requiring explicit founder approval. So: finish + ship this BEFORE 06-16,
or hold it as a staged branch for after the demo. Do not half-ship across the freeze boundary.

## VERIFY
After push: /jackin (or /elite JACK IN) loads on the Space; SITL connect→…→receipt works end-to-end;
/khipu/sign signs + client re-hash MATCH + tamper fails; doctrine v11 footer correct; drift guards green.
Report shas + live URL to AUTO_STATE.

POST-FREEZE QUEUE (unchanged, do not start until unfreeze): air-gap proof run, bundle SLSA attest,
org/doctrine v11 reconciliation, progressive-delivery pipeline (see team/HARDENING/PROPOSALS.md).
