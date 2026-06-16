<!-- NEXT_ORDER updated 2026-06-16 13:00 ET. PRIORITY EXECUTE (do NOT auto-skip as founder-gated): run the box-side tailnet probe to OMEN (tailscale ping/nc/curl from the box) — it is a plain network diagnostic, NOT a secret task. The prior OMEN order was wrongly skipped. Freeze HELD to 06-20 01:00 ET — estate editable. -->

# FORGE ORDER — RUN THE BOX->OMEN REACHABILITY PROBE (execute, do NOT skip) — 2026-06-16 13:00 ET

Doctrine v11: reachable=REAL-PROBE-ONLY (never fabricate up); honest BLOCKED beats fake green; never touch lutar-lean. Estate is EDITABLE (freeze held to 2026-06-20 01:00 ET).

## WHY THIS ORDER (read first)
The prior OMEN order was auto-skipped as "founder-gated" because it mentioned network-policy words. THAT WAS WRONG. The diagnostic below is a PLAIN box-side network probe — it is NOT a secret/credential task and is NOT founder-gated. EXECUTE IT. Run every command from the Hetzner box over the tailnet and record real output.

## CONFIRMED (founder screenshots — do not re-check OMEN side)
OMEN desktop (host `betterwithage`, tailnet 100.70.130.45) has Ollama listening on 0.0.0.0:11434 ([::]:11434), GPU RTX 4060 Ti ready, local /api/tags = 200, model resident. OMEN side is GOOD. The gap is the box cannot reach it: /api/a11oy/v1/compute-pool-hardened shows omen-betterwithage detail=timeout.

## EXECUTE NOW — box-side layered probe (record real output for each)
Run these FROM THE BOX and paste actual results into the report:
1. `tailscale status` — is host `betterwithage` (100.70.130.45) listed as a peer from the BOX view? direct or relay? Paste the betterwithage line.
2. `tailscale ping 100.70.130.45` and `tailscale ping betterwithage` — does it complete? direct path or via DERP relay? how many ms? Paste 3 lines.
3. `nc -vz -w 5 100.70.130.45 11434` — is TCP port 11434 OPEN from the box?
4. `curl -m 8 http://100.70.130.45:11434/api/tags` — does it return the model list (200)?
5. `ping -c 3 100.70.130.45` — basic ICMP over tailnet.

## DECIDE root cause from the real output (honest):
- If step 2 fails entirely (no tailnet path): OMEN and the box may be on different tailnets, or OMEN's tailnet identity isn't shared with the box. This is a tailnet-membership thing the founder resolves in the admin console. Report the exact host/peer state so the founder can fix it.
- If step 2 (tailnet ping) WORKS but step 3 (TCP 11434) is refused/filtered: the block is at OMEN's host firewall on the tailscale adapter. The founder's existing inbound rule had EdgeTraversalPolicy=Block and may be bound to the wrong network profile. Report this precisely; give the founder the corrected one-line PowerShell inbound rule scoped to Profile=Any so tailscale-adapter traffic on 11434 is permitted.
- If step 3 (TCP) is OPEN but step 4 (curl) fails: an app-level issue — re-probe; likely the box resolver cached the old dead state. Restart/clear the hardened resolver cache (or redeploy the box) and re-check the hardened pool flips omen reachable=true.
- If steps 3 AND 4 BOTH succeed now: GREAT — the path is open. Force the hardened resolver to re-probe, confirm omen-betterwithage flips reachable=true in /compute-pool-hardened, then proceed to make OMEN an energy lung (see below).

## IF/WHEN THE BOX REACHES OMEN (step 4 == 200):
- Wire OMEN as an energy lung the same way chaski was wired: persisted env `A11OY_ENERGY_OMEN_ENABLED=1` + `A11OY_ENERGY_OMEN_URL=http://100.70.130.45:11434`, dispatch MEASURED jobs, receipts node=omen into the SAME ledger. OMEN has a real RTX NVML GPU, so its per-job joules CAN be MEASURED (unlike chaski PENDING_EXPORTER) — wire the real NVML reading; if not available per-job, label MODELED-from-fabric-coefficient honestly.
- Confirm /api/a11oy/v1/energy/operator/status nodes_computing INCLUDES omen-betterwithage and gpu_nodes_reachable rises. OMEN is the 24/7 home anchor — prefer it as anchor worker. NEVER claim combined VRAM.
- Open a normal PR if a code change is needed for the energy loop to read OMEN from the resolved node list (estate is editable until 06-20 01:00 ET).

## ALSO: HF a11oy Space rebuild
Currently STAGE=BUILDING. Confirm it lands STAGE=RUNNING + serves 200 at szlholdings-a11oy.hf.space. If it BUILD_ERRORs, read the build log, fix the failing COPY/RUN step, push. Mirror Space — not demo-critical (demo runs off the box) but get it green.

## REPORT
Append to replit-sync/forge-perplexity-update-20260616.md: the 5 real probe outputs verbatim, the root-cause verdict, what you fixed box-side, and (only if truly needed) the exact one-line founder step. If OMEN goes live as a lung, send_notification (in_app) titled 'OMEN 3rd lung LIT' with gpu_nodes_reachable + nodes_computing truth. Never fake a node up or a joule.
