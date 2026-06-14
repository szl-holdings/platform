# SZL Forge — ORDER: onboard founder's RTX 4000 rig as a sovereign-GPU tailnet node

The founder is bringing up a personal rig (NVIDIA RTX 4000-series) as a 3rd sovereign GPU. It will join
the tailnet and run ollama on :11434, same pattern as rtx-betterwithage (100.125.77.31) and chaski.

## WHEN the rig appears on the tailnet (founder will share its Tailscale IP)
1. Add its Tailscale IP to the box env that arms tailnet GPUs:
   `SZL_TAILNET_GPU_ENDPOINTS` (append `http://<rig-tailscale-ip>:11434`), then restart the a11oy service.
2. Verify the box can reach it:
   ```bash
   curl -s http://<rig-tailscale-ip>:11434/api/tags   # 200 = ollama reachable on the rig
   ```
3. Confirm it shows in the pool:
   ```bash
   curl -s https://a11oy.net/api/a11oy/v1/compute-pool | python3 -c 'import sys,json;[print(n["name"],n["endpoint"],n["reachable"]) for n in json.load(sys.stdin)["nodes"]]'
   ```
   GATE: the rig appears with reachable=true; gpu_nodes_reachable increments to 3.
4. Honest posture: sovereign:true for the rig ONLY while its live probe is reachable; degrade honestly if
   the tailnet link flaps. Never report a GPU live without a live probe.

## [FOUNDER] action (cannot be done by agent — the founder is doing this now)
On the rig: install Tailscale + log in to the SAME tailnet; install ollama; `ollama serve` (+ pull a model);
open :11434 on the tailnet interface. Then share the rig's Tailscale 100.x IP so Forge arms it (step 1).
Docker is OPTIONAL on the rig — ollama native is enough for a GPU inference node.

## DOCTRINE v11
sovereign:true own-metal only, on a LIVE probe. No fabricated node/GPU state. Never commit a key.
— Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> · Doctrine v11 LOCKED
