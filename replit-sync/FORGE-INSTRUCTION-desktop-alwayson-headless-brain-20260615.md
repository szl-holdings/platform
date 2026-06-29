# SZL Forge — ORDER (2026-06-15 01:20 EDT): set up the DESKTOP as the ALWAYS-ON HEADLESS sovereign brain

**Founder's plan (decisive for the topology):** founder takes the LAPTOP to California for the demo;
the DESKTOP (Ryzen 8700G + RTX 4060 Ti + Radeon 780M, Windows 11) STAYS HOME running ALWAYS-ON,
HEADLESS. Forge has full admin of both machines. Do the full setup ("whatever is best").

## TARGET TOPOLOGY (this is the correct always-up answer)
- **DESKTOP @ home = PRIMARY persistent sovereign brain + always-up host.** Serves SZL-Nemo 24/7 on the
  RTX 4060 Ti, reachable over Tailscale from anywhere (incl. the Cali venue). This is the always-on node.
- **LAPTOP `betterwithage` (travels to Cali) = demo client + FAILOVER brain.** Calls the desktop over
  Tailscale; if venue WiFi can't reach home, the laptop's Blackwell 5050 serves LOCALLY as failover.
- **HF Spaces = tertiary failover.** Hetzner box a-11-oy.com stays primary PUBLIC web host.

## DO — desktop full setup (best-practice, headless, survives reboot)
1. **Tailscale**: install + join the founder's tailnet (same account, MagicDNS). Set it to start on boot
   as a SERVICE (not user-login) so it's up headless after a power-cycle. Enable Tailscale SSH so Forge/
   founder can reach it remotely. Record its MagicDNS name + tailnet IP.
2. **ollama**: install; run `ollama serve` as a WINDOWS SERVICE / scheduled task at boot (detached, no
   GUI/login needed — survives reboot + headless). Set `OLLAMA_HOST=0.0.0.0:11434` (tailnet-reachable),
   `OLLAMA_KEEP_ALIVE=-1` (keep model resident), and pull the governed SZL-Nemo base (Qwen3-class /
   qwen2.5-coder per current mesh) so it's preloaded.
3. **GPU detect**: `nvidia-smi` -> RTX 4060 Ti + EXACT VRAM. IF 16GB -> desktop serves governed Qwen3-32B
   Q4 as PRIMARY. IF 8GB -> serve a 7-14B governed model primary + 32B = roadmap/laptop-shared. Optionally
   enable Radeon 780M iGPU as a 2nd lane via Vulkan (label shared-RAM honest) only if it helps.
4. **Power/sleep**: disable Windows sleep/hibernate + USB selective suspend so the headless box never
   drops off the tailnet. Set "on power loss -> resume" in BIOS if reachable. Auto-login OR run services
   at the machine account so a reboot brings everything back with no human at the keyboard.
5. **Wire the mesh**: desktop registers with the coordinator; a11oy `A11OY_MODEL_BASE_URL` -> desktop
   (MagicDNS, NOT raw IP). Laptop = failover route. Confirm a11oy energy/sovereign gpu_reachable:true.
6. **Resilience**: a tiny watchdog (Task Scheduler) that restarts ollama if it dies + re-asserts Tailscale.

## PROVE (paste)
- From the LAPTOP (or box): `curl http://<desktop-magicdns>:11434/api/version` = 200, `/api/tags` lists the model.
- Reboot the desktop -> Tailscale + ollama come back automatically (headless), api/version 200 again.
- a11oy serves a chat turn via the desktop; energy/sovereign gpu_reachable:true; joules MEASURED.
- Kill ollama -> watchdog restarts it within ~60s.

## DOCTRINE: SZL-Nemo = governed Qwen3 Apache only (never from-scratch/Ultra/M3-derivative). Honest VRAM
labels. Trust never 100%. NEVER commit a key (Tailscale auth key / tokens = local only). Tailnet-only
exposure via Tailscale ACL — NEVER open 11434 to the public internet. Honest BLOCKED beats fake green.
