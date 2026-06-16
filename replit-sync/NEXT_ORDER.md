<!-- NEXT_ORDER updated 2026-06-16 12:24 ET by CTO. PRIORITY: OMEN Ollama is bound 0.0.0.0 + listening (founder-confirmed) but box->OMEN tailnet probe TIMES OUT (hardened pool). Diagnose+fix the box->OMEN path (likely tailnet ACL or OMEN firewall EdgeTraversal), then light OMEN as 3rd lung. Also confirm HF a11oy Space rebuild lands green. Hold stack on chaski. -->

# FORGE ORDER — LIGHT OMEN AS 3RD LUNG + HF a11oy REBUILD + HOLD — 2026-06-16 12:24 ET

Doctrine v11 (hard): reachable=REAL-PROBE-ONLY (never fabricate a node up); joules MEASURED only via real per-node NVML else honest label; never claim combined/fused VRAM (horizontal scale only); Lambda=Conjecture 1; never commit a key; never touch lutar-lean; honest BLOCKED beats fake green. FREEZE arms 2026-06-18 15:00 ET — monitor-only inside freeze, hotfix/* only.

## SITUATION (verified by founder screenshots + box probes, 12:24 ET)
The founder fixed OMEN's Ollama. CONFIRMED ON THE OMEN SIDE (screenshots, do not re-litigate):
- OMEN Ollama server log: `OLLAMA_HOST:http://0.0.0.0:11434` and `msg="Listening on [::]:11434 (version 0.30.8)"` — bound to ALL interfaces (NOT 127.0.0.1 anymore).
- GPU: NVIDIA GeForce RTX 4060 Ti, total 8.0 GiB / available 6.9 GiB, driver 596.36, CUDA 13.2.
- Local self-probes 200: GET/POST /api/tags, /api/ps, /api/pull. `ollama run llama3.1:8b "say ready"` -> READY. Model resident.
- `tailscale status` on OMEN: `100.70.130.45  betterwithage  stephenlutar2@  windows` (OMEN is UP on the tailnet; hostname = betterwithage).
- OMEN Windows firewall rule "Ollama tailnet" Inbound/TCP/11434/Allow exists, Enabled=True (NOTE: EdgeTraversalPolicy=Block on that rule).

BUT the box DISAGREES. GET /api/a11oy/v1/compute-pool-hardened shows:
  omen-betterwithage  http://100.70.130.45:11434  reachable=FALSE  detail=timeout
So Ollama IS bound and listening on OMEN, yet the BOX's outbound probe to 100.70.130.45:11434 TIMES OUT. This is now a BOX<->OMEN TAILNET PATH problem, NOT an Ollama bind problem. The plain /compute-pool node list doesn't even include OMEN (only the hardened resolver does) — so the energy operator never considers OMEN. Right now nodes_computing=['chaski'] only.

## TASK 1 — DIAGNOSE + FIX THE BOX->OMEN TAILNET PATH (priority)
From the Hetzner box (over tailnet), run a real layered probe to 100.70.130.45 and report each result honestly:
  a) `tailscale ping 100.70.130.45` (and `tailscale ping betterwithage`) — does the box see OMEN as a peer? direct vs DERP-relayed?
  b) `tailscale status | grep -i betterwithage` — is OMEN listed as a peer from the BOX's view (it may be in a different tailnet/tailnet-lock state, or not sharing the box's tailnet)?
  c) `nc -vz -w 5 100.70.130.45 11434` then `curl -m 8 http://100.70.130.45:11434/api/tags` — TCP open? HTTP 200?
Then resolve the most likely root causes IN ORDER, honest about which fixes it:
  - **Tailscale ACL**: if `tailscale ping` works but :11434 is refused/timeout, the tailnet ACL likely doesn't permit box->OMEN:11434. Check the policy; if the box's tailscale identity can't reach OMEN's tag/port, that is the fix (ACL grant). This may be FOUNDER-GATED (tailnet admin console) — if so, report the EXACT ACL stanza to add (src = box node/tag, dst = OMEN node, port = 11434) so the founder pastes it.
  - **OMEN firewall EdgeTraversal**: the inbound rule shows EdgeTraversalPolicy=Block. Tailscale traffic arrives on the Tailscale virtual adapter; confirm the rule applies to that adapter/profile (Any profile). If the rule is scoped to the wrong profile or blocks the tailscale interface, that's the miss — give the founder the corrected `New-NetFirewallRule` (Profile Any, InterfaceAlias Tailscale, EdgeTraversalPolicy Allow) as a FOUNDER step.
  - **Box resolver caching a stale dead state**: if path is actually open now, force the hardened resolver to re-probe (restart the resolver / clear its cache / redeploy) and re-check reachable flips true.
Do NOT mark OMEN reachable unless YOUR real box-side curl returns 200. Never fake it.

## TASK 2 — WHEN BOX REACHES OMEN: REGISTER IT AS A REAL ENERGY LUNG
Once box-side `curl http://100.70.130.45:11434/api/tags` == 200:
  - Confirm omen-betterwithage flips reachable:true,sovereign:true in BOTH /compute-pool and /compute-pool-hardened; gpu_nodes_reachable rises to >=2 (chaski + omen; rtx still travels).
  - Confirm the ENERGY operator picks OMEN up: /api/a11oy/v1/energy/operator/status nodes_computing INCLUDES 'omen-betterwithage', minting node=omen receipts. Honest joules: MEASURED only on a real per-job NVML reading from OMEN; else MODELED-from-fabric-coefficient, labeled. (chaski stays PENDING_EXPORTER until its own meter lands — do not fake.)
  - If the plain /compute-pool node list is what the energy loop reads (and it currently omits OMEN), wire the loop to read the hardened/resolved list so OMEN is a candidate lung. Open a normal PR for this BEFORE freeze; if it can't land clean by 06-18 15:00 ET, park it (chaski lung already carries the demo).
  - OMEN is the 24/7 ANCHOR (home, never travels). Prefer it as anchor worker; rtx (laptop) + chaski are additional horizontal workers; clean fallback if any drops. NEVER claim combined VRAM.

## TASK 3 — HF a11oy SPACE REBUILD (was BUILD_ERROR, now BUILDING)
The SZLHOLDINGS/a11oy HF Space hit BUILD_ERROR (docker build exit 1 on a COPY/runtime step) at ~15:01 UTC and is now BUILDING. CONFIRM it lands STAGE=RUNNING + serves 200 at https://szlholdings-a11oy.hf.space. If it BUILD_ERRORs again, read the build log, identify the failing COPY/RUN step, and fix it (likely a path that doesn't exist in the build context, or the cpu-basic constrained-builder llama path). This is the MIRROR Space — the demo runs off the box (a11oy.net, all 200), so this is NOT demo-critical, but get the mirror green. Report the failing step + fix honestly.

## TASK 4 — HOLD THE STACK (founder traveling, laptop off)
- chaski is the sole live lung carrying the demo — keep it 200 + in nodes_computing; its systemd unit auto-recovers (proven). rtx offline = EXPECTED (laptop travels) — do NOT alarm.
- Keep ALL served surfaces 200 (a11oy.net /healthz /frontier /orbital /holographic /energy-ops /pnt /pinn /fabric /governance /signature-is-not-proof + APIs + killinchu/elite). Route guard test catches drops.
- Ledger persistence: /data mount, chain.ok=true, survives_redeploy:true — do NOT trigger gratuitous prod redeploys; if one happens, confirm chain CONTINUES (no genesis reset).
- Energy loop running:true; if a redeploy leaves running:false WHILE a lung is reachable, POST /api/a11oy/v1/energy/operator/start.

## REPORT (append to replit-sync/forge-perplexity-update-20260616.md + AUTO_STATE.json mesh key)
Per item DONE vs FOUNDER-GATED: (1) box->OMEN layered probe results (ping/tcp/http) + root cause + fix applied or exact founder ACL/firewall stanza; (2) OMEN lung lit? gpu_nodes_reachable + nodes_computing truth; (3) HF a11oy Space stage (RUNNING?); (4) surfaces/chaski/ledger hold state. Founder is offline — only send_notification for: OMEN successfully lit as 3rd lung (good news) OR chaski down + not auto-recovering (emergency). Everything else: log; the watchdog cron alerts. Honest doctrine v11. Never fake a node up or a joule.
