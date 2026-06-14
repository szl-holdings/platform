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

## CTO ADDENDUM v2 (2026-06-14 16:05 EDT) — PRs ARE MERGED. NOW JUST REBUILD THE BOX.

UPDATE: The CTO merged the full energy + holographic stack to a11oy main himself (admin, all CI green). Main SHA
e24c8374 (or newer) now contains: static/shared/szl_holo3d.js (32412 B), szl_energy_operator.py, szl_energy_ledger.py,
szl_energy_projection.py, joule_billing.py, pages/energy-ops.html, static/3d/energy_showcase/showcase.js + the szl3d
toolkit. 36 energy tests green; serve.py registers operator+ledger+projection+dashboard routes. NO MERGE WORK LEFT.

YOUR ONE JOB NOW (demo-critical #1): REBUILD/REDEPLOY the a11oy container on Hetzner 167.233.50.75 from current main
(e24c8374+), byte-identical GitHub==box. Then START the energy operator on the box and leave it RUNNING. Then HARD-PROVE
by curling these EXACT URLs from a11oy.net and pasting the REAL HTTP codes (the box is currently STALE — all below are
404 right now and MUST become 200 after the rebuild):
   - https://a11oy.net/static/shared/szl_holo3d.js                    -> 200 (application/javascript) — fixes the 3D demo
   - https://a11oy.net/api/a11oy/v1/restraint/info  AND  /restraint/bench -> 200 JSON
   - https://a11oy.net/api/a11oy/v1/energy/operator/status            -> 200, jobs_done>0, joules_measured_total>0 (MEASURED)
   - https://a11oy.net/api/a11oy/v1/energy/ledger                     -> 200, signed receipts + chain integrity ok
   - https://a11oy.net/api/a11oy/v1/energy/projection?window=running  -> 200, 1-day numbers (MODELED, math shown)
   - https://a11oy.net/energy-ops  AND  /energy-holographic  AND  /holographic  AND  /estate-hologram -> all 200
REPORT the actual measured 1-day number from the running operator (the figure the founder asked for) + the box image
commit it's running. sovereign:true ONLY on a live 5050 probe; degrade honest if down. Revenue stays DRY-RUN/MODELED
(no Stripe key). Do NOT claim done by inference — paste the real codes. If any stays 404, say exactly which + why + fix.
Deadline: demo-sound before June 16.
