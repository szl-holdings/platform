# Forge — chaski booted, made DURABLE, verified as 2nd energy lung — REAL proof

Order: replit-sync/energy_engine/R_CHASKI_BOOT_AND_KEEP_ALIVE_20260615.md (+ NEXT_ORDER ORDER A).
Executed by Forge on box 167.233.50.75 → chaski over tailnet. No fabrication; every line below is a real probe/command output.

## STEP 0/1 — live IP resolved dynamically + Ollama answering
- tailscale: `chaski` = **100.102.173.88** (active, direct). Stale `100.76.58.50` → connection timed out (dead, not used).
- `GET http://100.102.173.88:11434/api/tags` → **200**, **9 models**:
  llama3:latest, mistral:7b-instruct-v0.3-q4_0, deepseek-r1:14b, qwen2.5:32b, codellama:13b,
  mistral:7b-instruct, qwen2.5:14b, llama3.1:8b, nomic-embed-text:latest.

## STEP 3 — DURABILITY (the real fix for the ~22h death) = systemd, already enabled + PROVEN
Host = `ubuntu-16gb-ash-1` (pid1=systemd). Unit `/etc/systemd/system/ollama.service`:
`Restart=always`, `RestartSec=3`, `UnitFileState=enabled`, `WantedBy=default.target`;
drop-in `ollama.service.d/host.conf` → `OLLAMA_HOST=0.0.0.0:11434` (listening `*:11434`).
→ survives **crash** (Restart=always) AND **reboot** (enabled).
**Kill-and-recover proof:** SIGKILL MainPID 1438088 → systemd restarted it in **3s** as MainPID 1566195 →
`/api/tags` 200 locally and over tailnet. Durability is real, not claimed.
Option A (systemd) was already in place; the ~22h death predated this unit. Replit "Always-On" is NOT needed
(chaski is a real systemd VM, not a sleeping Repl).

## STEP 4 — wired as the 2nd ENERGY lung (same loop, same ledger) — LIVE
`GET /api/a11oy/v1/energy/operator/status`:
- `running:true`, `stub_mode:false`, `nodes_computing:["rtx-betterwithage","chaski"]`, `node_status.chaski:"computing"`.
- `by_node.chaski`: **jobs=3252, tokens=1291682**, `joules_label:"PENDING_EXPORTER"`,
  note "node computed real jobs but no per-node NVML meter reading attributes to it yet — pending, never faked".
- rtx-betterwithage joules MEASURED (per-node NVML exporter, fresh <30s); ONE ledger, ONE loop.
- `compute-pool-hardened`: chaski reachable:true at the live IP, sovereign:false (correct — not own metal).

### Honest joules (doctrine v11) — open decision flagged, NOT silently changed
The operator deliberately labels chaski **PENDING_EXPORTER** (no per-node meter) and refuses to fabricate joules.
The runbook's "MODELED-from-fabric-coefficient" is NOT implemented — adding it is a deliberate code change to
szl_energy_operator.py that introduces a modeled (estimated) energy number. Per doctrine "honest BLOCKED beats fake
green", left honest/PENDING pending founder direction (and deferred ahead of the June 18 demo freeze).

## STEP 5 — heartbeat / clean offline = already covered
Operator probes each node; an unreachable non-standby node flips to **DEGRADED** (clean), rtx keeps breathing,
no fabricated jobs. (omen-betterwithage currently reads standby/unreachable, handled cleanly.)

## Persistence across rebuild — PROVEN
`/etc/a11oy-gpu.env`: `A11OY_CHASKI_STANDBY=0`, `A11OY_CHASKI_BASE_URL=http://chaski:11434/v1`, `A11OY_ENERGY_ALLOW_STUB=0`.
`a11oy-rebuild` sources it (`--env-file`) and auto-`--add-host chaski:<live tailnet IP>` → chaski stays wired and
resolvable after any rebuild.

— Forge
