# SZL Forge — ORDER: HARD-CONFIRM the public box is current (no inference, prove with exact URLs)

The founder needs PROOF (not inference) that the always-up public box a11oy.net serves the FULL current estate
before the June 18 demo. Your last report confirmed /estate-hologram=200 on the box but did NOT explicitly confirm
the two paths the CTO audit found STALE (404) on the box.

DO THIS (box-side, you have on-box access; FREEZE-aware — this is verification + a deploy-to-current, demo-critical #1):
1. Rebuild/redeploy the a11oy container on Hetzner 167.233.50.75 (a11oy.net) to current GitHub main (d333b997 or newer)
   AND killinchu.a11oy.net to current killinchu main, byte-identical to GitHub==HF.
2. Then HARD-PROVE by curling these EXACT URLs from the box's public hostname and pasting the real HTTP codes + a content sniff:
   - https://a11oy.net/static/shared/szl_holo3d.js   -> MUST be 200, content-type application/javascript (was 404 stale)
   - https://a11oy.net/api/a11oy/v1/restraint/info     -> MUST be 200 JSON (was 404 stale)
   - https://a11oy.net/api/a11oy/v1/restraint/bench     -> MUST be 200 JSON (was 404 stale)
   - https://a11oy.net/estate-hologram                  -> 200
   - https://a11oy.net/nemo, /autoreview, /factory, /constitution, /quant, /grc, /restraint -> all 200
   - https://a11oy.net/api/a11oy/v1/honest -> 200 with locked=8 @ c7c0ba17, Λ=Conjecture 1, doctrine v11
   - https://killinchu.a11oy.net/elite, /elite/globe, /elite/restraint, /api/killinchu/v1/restraint/info -> all 200
   - sovereign probe: confirm sovereign:true ONLY if the 5050 (Tailscale 100.125.77.31) is live; else honest sovereign:false
3. Confirm restart-recovery: simulate a container restart, confirm both apps auto-recover <60s (systemd/restart:always).

NOTIFY with the actual pasted HTTP codes for EVERY URL above (this is the founder's hard proof), the box image sha/commit
it's running, and the sovereign-probe state. If any URL is NOT 200 after redeploy, say exactly which + why + the fix.
Do NOT claim done by inference — paste the real codes. Doctrine v11 unchanged; never weaken a gate; never commit a key.


---

## CTO ADDENDUM (2026-06-14 15:34 EDT) — INCLUDE the energy operator + holographic stack in this same box rebuild

The box rebuild above pulls "current main" — but the demo's press-play energy centerpiece + the 18-graph holographic
showcase are in OPEN, TESTED PRs not yet on main. MERGE these to main FIRST (CI green, additive, no gate weakened),
THEN the box rebuild serves them. Merge order:
1. #397 energy/06-holographic — bundles the szl3d toolkit + 18 live 3D graphs. THIS IS WHAT MAKES szl_holo3d.js / the
   holographic surfaces resolve. (If a different holo3d.js already exists on main, reconcile — keep both byte-identical
   GitHub==HF==box.)
2. #394 energy/01-operator, #391 energy/02-ledger, #393 energy/03-projection, #392 energy/04-dashboard — the press-play
   operator stack. After deploy, START the operator on the box (real jobs -> sovereign 5050 -> MEASURED joules ->
   signed JouleCharge receipts), leave it RUNNING, and HARD-PROVE these URLs (paste real codes):
   - https://a11oy.net/api/a11oy/v1/energy/operator/status  -> 200, jobs_done>0, joules_measured_total>0 (MEASURED)
   - https://a11oy.net/api/a11oy/v1/energy/ledger            -> 200, signed receipts + chain-integrity ok
   - https://a11oy.net/api/a11oy/v1/energy/projection?window=running -> 200, 1-day numbers (MODELED, math shown)
   - https://a11oy.net/energy-ops          -> 200 (press-play Today console)
   - https://a11oy.net/energy-holographic  -> 200 (18-graph showcase)
3. Then optional: #379 F1 (all 4 /pnt/limits pillars wired) + the other 3D surfaces #381-#390.

DEADLINE: demo-sound before June 16 (founder request). If any PR can't merge cleanly (conflict/CI red), say which + why +
fix; do NOT force-merge anything that weakens a gate or touches lutar-lean. Revenue stays DRY-RUN/MODELED (no Stripe key).
Report the actual measured 1-day number from the running operator — that is the figure the founder asked for.
