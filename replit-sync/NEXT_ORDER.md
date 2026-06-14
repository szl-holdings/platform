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
