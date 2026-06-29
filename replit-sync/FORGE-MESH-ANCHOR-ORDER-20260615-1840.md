# FORGE ORDER — 3-GPU MESH, OMEN-ANCHOR FOR TRAVEL (founder full machine control) — 2026-06-15 18:40 ET

Founder: "we have 3 gpus now ... mesh it ... use all the intel/whatever ... opus 4.8 ... he's got full control of my machines. laptop comes to Cali, OMEN stays home running 24/7." Doctrine v11: reachable=REAL-PROBE-ONLY (never fabricate up); sovereign=owned metal; NEVER claim combined/fused VRAM (horizontal scale only); joules MEASURED only via real per-node reading; never commit a key; never touch lutar-lean; honest BLOCKED beats fake green.

## TRAVEL REALITY (drives everything)
The RTX laptop (rtx-betterwithage, 100.125.77.31) TRAVELS to California tomorrow — its network/IP WILL change and it may drop. The OMEN desktop (omen-betterwithage, 100.70.130.45, RTX 4060 Ti 8GB + Ryzen 8700G APU) STAYS HOME 24/7. So OMEN must become the ALWAYS-ON ANCHOR LUNG: the energy loop + inference must keep breathing on OMEN (+ chaski cloud) even when the laptop is gone/roaming. The dynamic tailscale resolver (already shipped in szl_backend_hardening.py) will follow the laptop's new IP when it reconnects — but the loop must NOT depend on the laptop.

## LIVE STATE (verified 18:35 ET — do not re-block what's true)
- /compute-pool: chaski reachable @100.102.173.88 ✅ (8 models). Energy operator nodes_computing=['rtx-betterwithage','chaski'].
- BUG: /compute-pool-hardened uses STALE IPs (chaski 100.76.58.50=timeout, omen=timeout) — Opus 4.8 dev team D is fixing the hardened endpoint to use the dynamic resolver. After their PR merges + box redeploys, re-verify hardened shows chaski/omen at live IPs.
- OMEN is dark: 100.70.130.45:11434 timeout = its Ollama isn't serving.

## FORGE TASKS (you have full machine control — do all you can reach; only flag a step if a machine is genuinely unreachable over tailnet)
1. **Box on current main**: ensure a-11-oy.com redeploys to the latest main (incl. team D's hardened-pool resolver fix once merged). PROVE: GET /api/a11oy/v1/honest git_sha == GitHub HEAD; GET /compute-pool-hardened lists omen-betterwithage + chaski with resolver detail `via tailscale-*` at their LIVE IPs.
2. **OMEN as always-on anchor lung**: when OMEN's Ollama serves (GET http://100.70.130.45:11434/api/tags == 200 from the box over tailnet — resolve dynamically), confirm omen-betterwithage flips reachable:true,sovereign:true; gpu_nodes_reachable rises; and the ENERGY operator nodes_computing INCLUDES omen, minting node=omen receipts (honest joules: MEASURED only on a real per-job reading, else MODELED-from-fabric-coefficient). If you have shell on the OMEN desktop over tailnet, you MAY start/keep Ollama serving + install a durable restart (Windows: a Scheduled Task at logon running `ollama serve`, or NSSM service) so it survives reboot — it's the 24/7 anchor. If you genuinely cannot reach the OMEN desktop shell, that one start is founder-gated → give the exact commands (see FOUNDER STEPS).
3. **Routing anchor preference**: once team D's PR is live, confirm the box prefers OMEN (home, always-on) as anchor worker for szl-fast + embeddings (bge-large), laptop + chaski as additional horizontal workers, clean fallback if any drops. NEVER claim combined VRAM. Keep x_szl_provenance honest.
4. **Laptop-roaming resilience**: confirm the resolver re-finds rtx-betterwithage at its NEW California IP automatically when it reconnects (hostname-based, not hardcoded). Add/confirm a home-node uptime probe that honestly reports if OMEN or rtx drops (do NOT auto-restart a founder machine beyond the durable-serve in #2; just report).
5. **iGPU/APU (honest, optional)**: team D is assessing whether the Ryzen 8700G's Radeon 780M iGPU (and the laptop Intel iGPU) are worth wiring as extra Ollama workers. If team D's finding says it's safe + emits honest separate joules, you MAY add the 780M as an additional OMEN-local worker (ROCm/Vulkan). Otherwise DO NOT — keep the clean sovereign-discrete-GPU energy story. Never fake/merge iGPU joules.

## FOUNDER STEPS (only if Forge cannot reach the OMEN desktop shell — full copy-paste)
**OMEN (Windows, Administrator PowerShell) — start the 24/7 anchor + make it durable:**
```powershell
# start serving on all interfaces so the tailnet box can reach it
Get-Process *ollama* -ErrorAction SilentlyContinue | Stop-Process -Force
[System.Environment]::SetEnvironmentVariable("OLLAMA_HOST","0.0.0.0:11434","Machine")
Start-Process ollama -ArgumentList "serve"
ollama pull llama3.1:8b
ollama pull bge-large
ollama ps
# durable: auto-start ollama serve at every logon so the 24/7 anchor survives reboot
$action  = New-ScheduledTaskAction -Execute "ollama" -Argument "serve"
$trigger = New-ScheduledTaskTrigger -AtLogOn
Register-ScheduledTask -TaskName "OllamaAnchor" -Action $action -Trigger $trigger -RunLevel Highest -Force
# confirm tailscale is up so the box can reach 100.70.130.45
tailscale status
```

## PROVE-IT (Forge, real probe only)
- [ ] compute-pool-hardened lists omen + chaski at LIVE resolved IPs (after team D PR + redeploy).
- [ ] When OMEN serves: gpu_nodes_reachable >= 3 (rtx + omen + chaski), energy nodes_computing includes omen — REAL probe only.
- [ ] OMEN durable-serve installed (Scheduled Task/NSSM) OR honestly reported founder-gated with the exact commands.
- [ ] Routing prefers OMEN anchor; laptop drop does NOT stop the loop.
- [ ] iGPU/APU: wired (if team D says safe) or honestly deferred per finding.
Report DONE vs FOUNDER-GATED per item to replit-sync/forge-perplexity-update-20260615.md + AUTO_STATE.json (mesh key). Never fake a node up or a joule.
