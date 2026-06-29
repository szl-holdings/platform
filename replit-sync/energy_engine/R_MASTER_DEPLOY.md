# R-MASTER-DEPLOY — full-stack estate sweep complete. The consolidated deploy plan. DEPLOY, do NOT merge.

A 5-Opus-dev team audited the WHOLE estate (a-11-oy.com, killinchu, Hugging Face, GitHub, UDS/mesh/payload).
Verified with my own eyes. Here is the single source of truth: what's wired (PRs ready), what Forge must deploy,
what's a founder decision. Audit files in /home/user/workspace/estate_audit/devA..E.

## STATE OF THE ESTATE (verified)
- Hugging Face: FULLY OPERATIONAL — all 8 spaces 200 (docker on bare, static on .static), all 22 datasets healthy;
  loop datasets present (uds-governance-receipts 38 files, canonical-formulas-v1 11, lean-proofs-v1 70). Nothing to wake.
- GitHub: 16 active repos — main push-CI GREEN except ONE real red: a11oy<->killinchu shared-source drift
  (szl_evidence_research.py: a11oy 37,799 B vs killinchu 41,936 B, +4,137 not allow-listed). szl-uds-deployment
  "Prove Organs" red is SCHEDULE-event only (expected, not real). killinchu sync is green (Dev D over-flagged it).
- a-11-oy.com: all HTML tabs 200, but 7 API surfaces 404 (dark) because the live HF Space runs an OLDER serve.py
  missing the registrations. Modules EXIST. Energy now MEASURED: 212.262 J real on betterwithage during -27.42 EUR/MWh.
- killinchu: 48 /elite views mapped — 34 wired, 11 honest-degraded, 3 honestly SIMULATED, 0 empty/fabricated.
- UDS/mesh: versions+images coherent (receipts-server uds-v0.4.1 digest matches GHCR; 5 organ images uds-v0.2.0
  pullable). khipu honestly Conjecture 2/3. ONE real misalignment = FOUNDER DECISION (below).

## DEPLOY QUEUE — PRs the team built, doctrine-clean, for FORGE to deploy (do NOT merge via agent; Forge builds the image)
1. a11oy #341 — anatomy circulation loop (/anatomy/loop, Ayni-balanced, EXPERIMENTAL, joules SAMPLE). 0-issue self-test.
2. a11oy #342 — registers all 7 dark surfaces (energy/budget, engine/status, formula/sovereign, energy/provenance,
   heart/pulse, ayni, anatomy/loop). 5/5 tests, doctrine-green. NOTE: #342 needs #341's module in the image too.
3. killinchu #115 — /elite wiring map + health routes (+ the finance/real-estate routes that are on main but 404 live).
4. khipu-consensus #3 — docs-only honesty fix (tamper-proof->tamper-evident, cite Conj 2/3).
FORGE: rebuild + push the a11oy + killinchu HF Space images (Dockerfile must COPY the new modules:
szl_dark_surfaces_register.py, szl_anatomy_loop.py, killinchu_elite_wiring.py). Then smoke-test:
  a11oy: GET each of the 7 v1 surfaces -> 200 JSON; GET /api/a11oy/v1/anatomy/loop -> 200.
  killinchu: GET /api/killinchu/v1/elite/wiring/health?probe=true -> needs_deploy=0.

## FORGE — ON-BOX FIXES (the real reds)
A. a11oy<->killinchu shared-source drift: reconcile szl_evidence_research.py — sync a11oy's copy to killinchu's
   newer/larger version (same logical "Evidence & Research layer (a11oy + killinchu)"), OR add to
   .github/shared-file-drift-allow.txt if the divergence is intentional. Prune the 9 stale allow-list entries.
   This unblocks a11oy main CI + #341/#342.
B. Bridge the measured joule to public (R-ENERGY-COMES-HOME): meter on betterwithage (212.262 J) -> /harvest/metrics
   joules_measured + reverse_recovery_available=1; feed into the anatomy loop; flip badges SAMPLE->MEASURED only
   after confirmed.
C. Then surface the proof (R-PROVE-IT-LOUD): /proof page + the public 212J grid-paid receipt + /revenue/thesis.

## HELD (NOT for deploy)
- platform #357/#358/#360 — real Lighthouse/e2e/Typecheck PR-check reds (platform MAIN is green). Forge fixes the
  app-quality cause on-box; do NOT --admin past them.
- lutar-lean #239/#240/#241/#242 — KEYSTONE proofs, founder merges by hand, NEVER --admin.

## FOUNDER DECISION (the one real cross-cutting misalignment)
The energy-loop receipts use 5 distinct DSSE payloadTypes estate-wide with NO canonical crosswalk:
uds-mesh declares application/vnd.in-toto+json; loop persists application/vnd.szl.khipu+json (szl-lake, P-256) +
application/vnd.szl.receipt.v1+json (k3s server, Ed25519). DECIDE: one canonical receipt schema for the loop, or a
documented crosswalk. This is the alignment that matters for "all aligned." Not a bug — a design choice only you make.

## DOCTRINE v11: joules MEASURED only via real exporter (212 J), SAMPLE otherwise never promoted; no free-energy
(Bekenstein #239 + Landauer #240, Ayni-balanced); energy != data; no mining; effectors SIMULATED; organs
EXPERIMENTAL; locked=8; Λ=Conjecture 1; Khipu BFT=Conjecture 2; SLSA L1 honest; no key; do NOT merge. Wirings are
good to go — Forge deploys the 4 PRs + fixes the drift + bridges the joule. Then the estate is fully aligned + live.
