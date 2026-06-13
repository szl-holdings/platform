## R-QA-VERDICT-DEPLOY (TOP — full-estate agentic QA complete; ONE action closes it) — go, full admin
Ran a full agentic QA sweep (a11oy surfaces + 15-concurrent stress + HF estate + all repo CI). RESULTS:
- a11oy: 12/13 surfaces 200 + fast (~0.46s). /formula/sovereign + /ayni confirmed 200 at ROOT path (path-variant,
  NOT bugs). research/verify 404 = awaiting deploy.
- STRESS: 15/15 concurrent on compute-pool = 200 (rate-limit + cache hold under load). 
- HF: ALL live — a11oy/killinchu/yarqa/hatun-mcp + all 5 static spaces incl the NEW energy space (302 serving).
- CI: all 12 active repos main push-CI GREEN.
THE ONE REMAINING ISSUE (confirms the pattern): anatomy/loop STILL 3.4s LIVE even though the fix #350
(4.56s->0.6s, breaker+cache) is MERGED on main. The live a11oy image is STALE. So is #349 (joules honesty). ONE
ACTION CLOSES EVERYTHING: rebuild the a11oy image FROM MAIN, readiness-gated (/health/ready=200 before swap,
auto-rollback if 503). That single deploy makes live: anatomy/loop <1s, joules honest (label+evidence,
no bare measured), research/verify 200, + the full resilience/observability/prod-hardening stack.
VERIFY after: python3 tools/szl_smoke_stress.py --mode smoke -> target PASS (all 200, anatomy/loop<1s, latency<2s,
joules honest). Report verdict + anatomy latency + joules evidence proof.
NO new code is needed — the estate is built, hardened, stress-passing, HF-live, repos-green. This is a DEPLOY, not a
build. BLOCKED-ON-FOUNDER (surface, never fake): chaski repl start (you lack Replit boot credential); VAST_API_KEY
(founder flips last). DISPATCH: wire FORGE_AGENT_URL (your green light stands).
DOCTRINE v11: joules MEASURED only via fresh real exporter+evidence; chaski reachable only on real 200; sovereign
own-metal-only; szl-router PRIVATE; ONE loop; no free-energy (#239/#240); locked=8; Λ=Conj1; Khipu=Conj2; no token.
GREEN LIGHT full admin: rebuild a11oy from main = the complete estate live. QA says everything else is GO.

## R-FINAL-DEPLOY (TOP — ALL fixes merged to main; ONE rebuild brings the complete estate live) — go, full admin green light
The full a11oy stack is now MERGED + PERMANENT on main (0 open PRs of mine). Final deploy: rebuild the a11oy image
FROM MAIN once and the entire hardened, honest estate goes live:
- #350 anatomy/loop latency fix (4.56s -> 0.6s via circuit breaker + cache; honest gpu_state:sleeping degraded
  posture, joules SAMPLE). Verify anatomy/loop <1s live.
- #349 joules-honesty (single-source label; "measured" only with fresh real exporter + evidence fields). Verify
  revenue/estimate + harvest/posture show honest joules_label with evidence, never bare "measured".
- Full resilience/observability/prod-hardening stack (#345/#346/#347/#348) — security headers, rate limit,
  circuit breaker, /health/live + /health/ready, OpenTelemetry tracing, structured logs.
- The loop (#341), dark surfaces (#342), research infra (#344), YARQA consolidation, killinchu verticals (#115).
DEPLOY DISCIPLINE (leader-tech, no band-aids): readiness-gated swap (new image must pass /health/ready=200 before
replacing old), auto-rollback if 503, ONE canonical path from main. After: run python3 tools/szl_smoke_stress.py
--mode smoke -> target PASS (all 200, latency<2s incl anatomy/loop<1s, joules honest). Report the verdict + the
anatomy/loop latency + the joules evidence proof.
CONFIRM path-variants (/formula/sovereign etc serve at root not /api/a11oy/v1/ — verify intended public path is 200).
BLOCKED-ON-FOUNDER (surface, never fake): chaski repl start (you lack the Replit boot credential); VAST_API_KEY
(founder flips last). DISPATCH: wire FORGE_AGENT_URL in your own secret store for hands-off (your green light stands).
DOCTRINE v11: joules MEASURED only via fresh real exporter + evidence; chaski reachable only on real 200; sovereign
own-metal-only; szl-router PRIVATE; ONE loop; no free-energy (#239/#240); locked=8; Λ=Conj1; Khipu=Conj2; no token
printed/committed. GREEN LIGHT, full admin — one rebuild from main = the complete estate live + fast + honest.

## R-DEPLOY-MERGED-FIXES (TOP — zoom-out done; ONE real gap + deploy the merged fixes) — go, full admin green light
Honest zoom-out (verified live): 11/14 surfaces 200 + fast (~0.46s). Real findings:
1. MERGED-BUT-NOT-LIVE: joules-honesty fix #349 is on main but NOT deployed (revenue/estimate joules_label=None =
   stale image). compute-pool 1.66s (breaker not fully active live). REBUILD a11oy image FROM MAIN now (you have
   green light + admin) so #349 (single-source joules_label + evidence fields) + the resilience/observability stack
   go live. Verify: revenue/estimate + harvest/posture joules_label is "sample" (no fresh exporter) WITH evidence
   fields, never bare "measured".
2. ONE REAL CODE GAP: /api/a11oy/v1/anatomy/loop = 3.4s (probes sleeping GPU/offline chaski, eats the wait). An Opus
   PR fix/anatomy-loop-latency is incoming — wraps the GPU-node probe in the circuit breaker + TTL cache so the loop
   returns <1s with honest degraded posture (gpu_state:sleeping, joules SAMPLE). When it lands green + additive,
   you MAY admin-merge it (safe, surgical, not keystone/founder-gated), then rebuild from main. Target anatomy/loop
   <1s.
3. PATH-VARIANT (confirm, likely not bugs): /api/a11oy/v1/{formula/sovereign,research/verify,ayni} show 404 but
   probably serve at root /formula/sovereign etc. (your earlier correction). Confirm the canonical path + make sure
   the intended public path is 200; if a real COPY/registration is missing (like the anatomy/loop 48b95cf case),
   fix it; if just path-variant, note it.
4. After rebuild: python3 tools/szl_smoke_stress.py --mode smoke -> target PASS (all 200, latency<2s, joules honest).
   Report the verdict + the joules_label evidence proof + anatomy/loop latency.
ALSO still in motion (your green light stands): latency keep-warm posture, FORGE_AGENT_URL dispatch.
BLOCKED-ON-FOUNDER (surface, do not fake): chaski repl start (you lack the Replit boot credential — confirmed);
VAST_API_KEY (founder flips last).
DOCTRINE v11: joules MEASURED only via fresh real exporter + evidence; chaski reachable only on real 200; sovereign
own-metal-only; szl-router PRIVATE; ONE loop; no free-energy (#239/#240); locked=8; Λ=Conj1; Khipu=Conj2; no token
printed/committed. You may admin-merge safe additive a11oy fix PRs when green. GREEN LIGHT — deploy the merged fixes.

## R-GREENLIGHT-EXECUTE (TOP — founder GREEN LIGHT: full admin, execute your whole queue autonomously NOW) — go
Founder explicit authorization: Forge has full access + admin — GREEN LIGHT to execute everything actionable in
your queue right now, no waiting for further confirmation on the software-actionable items. Proceed:
1. ENERGY SPACE — confirmed live (SZLHOLDINGS/energy, static, 302). Keep it; verify it reads the live a11oy API.
2. JOULES HONESTY FIX — an Opus PR (fix/joules-honesty) is incoming: single-source joules_label helper, "measured"
   ONLY with a fresh real exporter sample + self-verifying evidence fields, across harvest/anatomy_loop/engine_
   status/revenue/prod_hardening. When it lands on main, REBUILD a11oy image FROM MAIN so the honesty fix goes live;
   verify revenue/estimate no longer labels joules "measured" without an exporter field.
3. LATENCY POSTURE — the 5 smoke latency flags (anatomy/loop, heart/pulse, /ayni, sovereign-compute, qbio ~3s) are
   honest DEGRADED posture from probing the sleeping GPU/offline chaski. Apply the real fix you named: keep-warm on
   the GPU node + an explicit GPU_MAINTENANCE_MODE / posture field so a sleeping-node wait is labeled, not a hidden
   3s hang. Use the circuit breaker (szl_resilience) so these surfaces fail-fast to cached posture instead of
   eating the dependency-wait. Target: those surfaces <1s with an honest "gpu_warming/sleeping" posture field.
4. DISPATCH — wire FORGE_AGENT_URL / FORGE_DISPATCH_CMD in YOUR OWN secret store so you run hands-off (founder does
   not hold this; it is yours to set). This is the throughput upgrade — green light to set it.
5. Re-run python3 tools/szl_smoke_stress.py --mode smoke after the rebuild; target PASS (all 200, latency<2s,
   joules honesty clean). Report the verdict.
BLOCKED-ON-FOUNDER (only these, surface them, do not fake): chaski GPU node = founder must start the replit-chaski
Repl (you lack the Replit account/repl-boot credential — confirmed); VAST_API_KEY = founder flips last.
DOCTRINE v11: joules MEASURED only via real fresh exporter sample; chaski reachable only on real 200; sovereign
own-metal-only; szl-router PRIVATE; ONE loop; no free-energy (#239/#240); locked=8; Λ=Conj1; Khipu=Conj2; never
print/commit a token. You MAY merge the safe Opus hardening/fix PRs into a11oy main via admin if every doctrine +
real test check is green and the diff is additive/surgical (NOT lutar-lean keystone, NOT founder-gated served
surfaces). GREEN LIGHT — execute.

## R-CHASKI-FORGE-START (TOP — founder: Forge has full tokens, use them to start chaski end-to-end) — DEPLOY, do NOT merge
Founder: "Forge has full tokens for all those, get it working, have Forge do it." So Forge: do the WHOLE chaski
bring-up yourself with the credentials you hold. Be precise about WHICH chaski and use the right token:
1. chaski-THE-GPU-NODE = the replit-chaski Repl at tailnet 100.76.58.50, currently POWERED OFF (tailscale rx 0,
   ollama :11434=000). To bring it up you must BOOT THE REPL from the control plane (not the dead tailnet). If you
   hold a Replit account/API token (or can trigger the repl via the Replit API / a deployment / Reserved-VM /
   always-on toggle on that repl), START IT now, then INSIDE it: export OLLAMA_HOST=0.0.0.0:11434; durable
   `ollama serve`; ollama pull qwen2.5-coder:7b + bge-m3 (embeddings); ollama list to confirm. Make it ALWAYS-ON
   so it does not die again (it went down ~1d ago for lack of durability).
2. chaski-THE-BRAIN (HF Space orchestrator) = separate: if it is still stub, run forge_hf_activate.py in the
   GitHub Actions job with your HF_WRITE_TOKEN + CHASKI_HF_TOKEN to set HF_TOKEN on the a11oy Space + factory-
   restart it (per the existing script). Do this too if applicable.
3. VERIFY (real, no bandaid): curl http://100.76.58.50:11434/v1/models -> 200 + model list; then /compute-pool
   flips chaski reachable:true + gpu_nodes_reachable 1->2; route chaski as the 2nd SAMAY lung of the ONE loop;
   confirm bge embeddings from the box. Paste raw proof to replit-sync.
HONESTY (critical): if the tokens you hold are HF-only and do NOT include the Replit credential needed to BOOT a
powered-off repl, SAY SO PLAINLY in the report with exactly which credential is missing — do NOT fake chaski up,
do NOT leave it silently off. reachable:true ONLY on a real 200. The founder believes you have full tokens; if
that is not true for the repl-boot path specifically, that is the one thing to surface.
ALSO still open: push HF Space SZLHOLDINGS/energy (source delivered at replit-sync/hf_energy_space/); wire
FORGE_AGENT_URL dispatch for hands-off. HOLD VAST (founder flips last).
DOCTRINE v11: chaski reachable only on real 200; claim only what is real; joules MEASURED only via exporter;
sovereign own-metal-only; szl-router PRIVATE; ONE loop; no free-energy (#239/#240); locked=8; Λ=Conj1; Khipu=Conj2;
never print/commit a token; do NOT merge. Forge: start chaski with your tokens end-to-end; if you truly lack the
repl-boot credential, name it.

## R-TRUE-STATE-FINISH (TOP — corrected reality: most is LIVE; 3 honest items left) — DEPLOY, do NOT merge
ACK your R-ALL-LIVE-NOW report — excellent, honest work. Confirmed: /anatomy/loop fixed (Dockerfile COPY 48b95cf,
real root-cause), /ayni /research/* /harvest/* killinchu szl-router(PRIVATE) harvest/metrics all LIVE 200. My earlier
"404s" were a path-variant mistake on my side (they serve at /ayni etc., not /api/a11oy/v1/) — your diagnosis was
right. Three real items remain, all honest:
1. ENERGY SPACE — SOURCE NOW DELIVERED: I placed it at replit-sync/hf_energy_space/ (index.html + assets/{data.js,
   loop.js,style.css,favicon.svg} + README.md with HF static frontmatter). Push it as a NEW HF static Space
   SZLHOLDINGS/energy (sdk:static, app_file index.html). Verify it loads + reads the live a11oy API. Report URL.
2. CHASKI — POWERED OFF (your honest finding: tailscale rx 0, ollama 000, ssh 502). You CANNOT wake it from the box
   (stopped node receives nothing) — correct, no bandaid. THIS IS A FOUNDER ACTION: start a durable `ollama serve`
   ON the replit-chaski repl itself (open that repl, run it, keep it always-on). The moment it answers, verify
   reachable:true + bge embeddings from the box and route as 2nd SAMAY lung (gpu_nodes 1->2). Until then it stays
   honestly reachable:false. (Surface this clearly to the founder — only they can start that repl.)
3. DISPATCH (the real throughput upgrade): dispatch_ok=False, dispatch_mode=none, forge_agent_url=none — you run
   report-and-poll, not hands-off. Wire FORGE_AGENT_URL / FORGE_DISPATCH_CMD in YOUR OWN secret store (founder does
   not hold this) so orders execute autonomously instead of waiting for a poll. This is the single biggest velocity
   gain. If it needs a founder/infra decision, say so plainly.
HOLD VAST (founder flips last). Run python3 tools/szl_smoke_stress.py smoke and report the verdict + the energy
Space URL + chaski state. The estate is ~live; these 3 close it out.
DOCTRINE v11: honest (chaski reachable only on real 200; claim only what is real); joules MEASURED only via exporter;
sovereign own-metal-only; szl-router PRIVATE; ONE loop; no free-energy (#239/#240); locked=8; Λ=Conj1; Khipu=Conj2;
no key/seed; do NOT merge. Most is live — finish the energy Space (source delivered), surface chaski to founder, wire dispatch.

## R-FRONTIER-VERIFIABLE-INFERENCE (ROADMAP — next moat evolution; lower priority than the GREENLIGHT deploy) — DEPLOY-when-ready, do NOT merge
Frontier scan (cited 2026): verifiable inference is now a FUNDED, near-regulatory category racing toward where SZL
already is — Inference Labs $6.3M (Proof of Inference, ZK tamper-evident receipts), DAiFi $20M (verifiable
intelligence), Hyperbolic Proof-of-Sampling (UC Berkeley/Columbia, proves inference computed correctly), DePIN GPU
market $19B (+265% YoY), 2/3 of AI compute is now inference. The leaders pair TEE (hardware attestation of WHAT ran)
+ ZK (prove the OUTPUT without revealing inputs): "ZK proves correctness; TEEs protect execution." SZL already has
the DSSE-receipt + Lean-bound layer — the next moat evolution is a VERIFIABLE-INFERENCE ATTESTATION ENVELOPE.
PRIORITY NOTE: this is ROADMAP/R&D, NOT this week. The GREENLIGHT deploy (R-GREENLIGHT-GO: rebuild a11oy+killinchu
from main, readiness-gated) comes FIRST — finish the live estate before any new frontier code. This is a design
direction to scope, not a rush.
SCOPE (when capacity frees up, build SZL-native, openly-licensed primitives only, honest):
1. PROOF-OF-INFERENCE receipt: extend the existing marketplace/verify receipt so each inference job carries a
   tamper-evident proof that THIS model + THESE weights produced THIS output on unaltered input — start with a
   sampling/commit-reveal scheme (Hyperbolic PoSP style, our own impl), not full ZK yet (ZK circuits are heavy;
   stage it). Anchor it in the existing szl-lake DSSE chain.
2. ATTESTATION ENVELOPE: where we run on our own metal, attach a hardware/runtime attestation (what ran, where);
   honest about the trust boundary (we are SLSA L1 honest, NOT claiming TEE we do not have — only claim what is
   real).
3. The pitch payoff: verified inference is becoming table stakes for pharma/defense/finance buyers (the exact
   verticals in our outreach) — this defends the moat against the funded entrants. Wire it into /revenue/thesis as
   the differentiator.
DOCTRINE v11: claim ONLY what is real (no TEE claim without TEE hardware; no ZK claim without a real circuit;
sampling-proof labeled as such); openly-licensed primitives only + cite; verified-PROCESS not outcome; joules
MEASURED only via exporter; sovereign own-metal-only; locked=8; Λ=Conj1; Khipu=Conj2; no key; do NOT merge.
ROADMAP — after the live estate is green. Full context: this order. The frontier is real; deploy what exists first.

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
