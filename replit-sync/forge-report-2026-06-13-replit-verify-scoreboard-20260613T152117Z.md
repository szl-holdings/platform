# Forge → Perplexity / founder — Replit-side verify pass (freeze-aligned, READ-MOSTLY)

Date: 2026-06-13T15:21Z. Trigger: founder "check github + keep flying". Order read:
NEXT_ORDER.md (FREEZE HOLD) + FREEZE.json (active, activates 2026-06-16, lifts 2026-06-19).
Today is pre-freeze → normal work allowed, but order says prefer monitor + small safe items.
No merges, no box/deploy, no serve.py edits this pass (anti-collision). Doctrine v11. This file
is append-only and uniquely named (no collision with sibling reports).

## Live scoreboard (curl-verified THIS pass — supersedes the cached finish-it-all scoreboard)
a-11-oy.com **200:** /healthz, /api/a11oy/v1/energy/budget, engine/status, /proof,
formula/sovereign, formula/allodial, formula/entanglement, anatomy/loop (API), /anatomy/loop (HTML).
a-11-oy.com **404:** /api/a11oy/v1/research/prereg, research/verify, harvest/datacenters.
killinchu **200:** /healthz, /killinchu/healthz, /elite/wiring/health?probe=true.

NOTE: the earlier finish-it-all scoreboard listed formula/sovereign, allodial, entanglement and
anatomy/loop as 404 — they are now **200 live**. A sibling/founder landed + deployed them since
(serve.py commit e8e855f0 @14:41Z "verified research infrastructure"; HEAD 929779d5 @15:01Z =
doctrine-label edits only). The earlier "serve.py is HOT, don't race" condition has **settled**.

## Corrected root cause of the 3 remaining a11oy 404s (two distinct gaps, NOT one)
1. **research/prereg = DEPLOY GAP.** It IS on main (serve.py @main contains the route string;
   added by e8e855f0). Live a-11-oy.com is still 404 → the served image predates e8e855f0. An
   a-11-oy.com image rebuild flips it. Founder/Forge-deploy side (dispatch_mode deploy-branch);
   freeze cautions against box touches — pre-freeze a rebuild is permitted, founder's call.
2. **research/verify, research/trial, harvest/datacenters = CODE GAP.** 0 occurrences in
   serve.py @main → their route handlers are NOT yet registered on main (still in unmerged
   PR #344 / pending authoring). Need the route registration landed on main; I must not merge.

## Why a naive serve.py-string route guard would be WRONG (verified, useful for next actor)
formula/allodial + formula/entanglement are **200 live but have 0 literal occurrences in
serve.py @main** — their routes are registered dynamically INSIDE the imported modules
(szl_allodial.py / szl_entanglement.py, both on main, 200). Any future "assert route string in
serve.py" guard would false-negative on module-registered routes. A correct surface guard must be
a LIVE-PROBE (or import-and-introspect the app's route table), not a serve.py grep.

## Founder / gated action list (unblocks the rest — unchanged in substance, sharpened)
1. Rebuild a-11-oy.com image → flips research/prereg to 200 (code already on main).
2. Land research/verify + research/trial + harvest/datacenters route registration on main
   (PR #344), then rebuild → flips the remaining 2 routes.
3. Marketplace keys by presence (never commit/log): VAST_API_KEY, AKASH_WALLET (addr+funded flag
   only), IONET_API_KEY, RUNPOD_API_KEY.
4. chaski ollama serve (home) → 2nd sovereign backend.
5. HF energy Space SZLHOLDINGS/energy = 401 (exists/private) — confirm intended visibility.
6. lutar-lean #239–242 keystone — founder-merge only, never --admin.

## Honest non-claims
Forge deployed nothing, merged nothing, touched no keys, edited no serve.py/Dockerfile this pass.
Estate is verified-GO + idle. locked=8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17;
Λ=Conjecture 1; Khipu=Conjecture 2; joules MEASURED-only; revenue ESTIMATE.
Task #878 (Evidence-tab auto-refresh CI guard, both organs) is DONE and consistent with this state.
