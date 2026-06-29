<!-- NEXT_ORDER updated 2026-06-16 11:07 ET by CTO. TRAVEL MODE: founder in flight, laptop OFF. Hold the stack autonomously; chaski is the sole lung — protect it. rtx offline is EXPECTED. -->

# FORGE TRAVEL-MODE ORDER — 2026-06-16 11:07 ET — FOUNDER IN FLIGHT, LAPTOP OFF

Doctrine v11 (hard): never fabricate a 200/joule/receipt/signature/digest/label; joules MEASURED only via real NVML else honest label; reachable=REAL-PROBE-ONLY (never fake a node up); never claim combined VRAM; Lambda=Conjecture 1; never commit a key; never touch lutar-lean; honest BLOCKED beats fake green; never weaken/bypass a doctrine/CI gate. FREEZE arms 2026-06-18 15:00 ET — monitor-only inside freeze, hotfix/* only.

## SITUATION
Founder is traveling to San Diego (WarHacker, founder demos June 18). LAPTOP IS OFF for the flight. That means:
- rtx-betterwithage (the laptop lung) is OFFLINE / will flap offline — this is EXPECTED AND HONEST. Do NOT alarm on rtx going offline. Do NOT try to revive it.
- OMEN (100.70.130.45) is still founder-side-unbound — leave as honest-down, do NOT mark reachable without a real /api/tags 200.
- chaski (real systemd VM, tailnet) is the SOLE LUNG keeping the energy loop breathing. THIS IS THE THING TO PROTECT.

The whole served stack (a-11-oy.com) runs on the Hetzner box (167.233.50.75), NOT the laptop — so it stays up regardless. Verified 11:07 ET: /healthz 200, energy running:true on chaski, loop actively minting (jobs 38804->38806 in 9s), ledger chain.ok=true, persistence survives_redeploy:true on /data.

## YOUR JOB WHILE FOUNDER IS DARK: KEEP IT UP, KEEP IT HONEST, DON'T BREAK IT
1. CHASKI IS THE PRIORITY. It is the only lung. Its systemd unit is already enabled + Restart=always (you proved kill-recover 06-16). Keep verifying every loop pass: box -> http://chaski:11434/v1/models == 200 AND /energy/operator/status shows chaski in nodes_computing. If chaski drops AND the unit does not auto-recover within ~2 min, that is the ONE thing worth escalating — try `systemctl restart ollama` on chaski via the offbox key, re-prove 200, and log it. If it still won't come back, send_notification (in_app) titled 'chaski lung down — stack on box only' with the honest state (loop will idle-honest, served surfaces stay 200).

2. KEEP ALL SERVED SURFACES 200. Probe each loop pass: a-11-oy.com /healthz /frontier /orbital /holographic /energy-ops /pnt /pinn /fabric /governance /console /elite /signature-is-not-proof + the energy/mesh/manifest APIs + killinchu.a-11-oy.com/elite. Any 200->non-200 on a demo-critical route is a real regression — the route guard test should catch it in CI; if a deploy drops a route, do NOT silently repair-and-hide: fix it AND log what dropped + the commit. Inside freeze (after 06-18 15:00 ET) do NOT push non-hotfix changes.

3. PROTECT PERSISTENCE. The ledger writes to /data (HF persistent mount). Do NOT trigger an unnecessary prod redeploy while founder is dark. If a redeploy happens (CI/auto), confirm the chain length CONTINUES (does not reset to genesis) and chain.ok stays true. If /data ever unmounts and the chain resets, report EPHEMERAL honestly — never fake continuity.

4. ENERGY LOOP MUST STAY running:true. If a redeploy leaves running:false WHILE chaski is reachable, POST /api/a11oy/v1/energy/operator/start to restart it (the #464 auto-start should handle this, but verify). If running:false AND no lung reachable, that is honest-idle — leave it, do not force.

5. CI HYGIENE (outside freeze only): if a push-event main run goes red on platform/a11oy/killinchu/szl-uds-deployment, file the standard 'FORGE: main CI red — <repo>' issue with the failing job + first error line. Do NOT auto-merge anything risky; do NOT --admin past a failing required DCO/Scorecard gate. The pre-existing non-blockers (a11oy 'Operator & reason endpoint tests', szl-uds 'Receipts cosign verify exact identity') are NOT alarms.

6. UDS BUNDLE stays published + keyless-signed (oci://ghcr.io/szl-holdings/szl-uds-bundle:uds-v0.3.0). If uds-bundle-publish.yml or prove-bundle-install.yml goes red, report ref+digest+failing step. No founder cosign step exists — do not invent one.

## DO NOT (while founder is dark)
- Do NOT alarm on rtx-betterwithage offline (laptop off — expected).
- Do NOT mark OMEN reachable without a real probe.
- Do NOT push non-hotfix changes inside the freeze.
- Do NOT trigger gratuitous prod redeploys.
- Do NOT fabricate any 200/joule/receipt/signature to make state look better than it is.

## REPORT
Append to replit-sync/forge-perplexity-update-20260616.md each pass: chaski lung state (200? recovered?), served-surface 200 truth, energy running flag, ledger chain.ok + continuity, any CI red filed. Founder is offline — only send_notification for the ONE escalation case: chaski down AND not auto-recovering (everything else: log silently, the watchdog cron covers alerting). Honest doctrine v11. Hold the line; keep the loop breathing on chaski.
