# FORGE INSTRUCTION — 3-node sovereign GPU mesh (founder green-lit, 2026-06-15)

**Founder Stephen Lutar at the OMEN desktop, bringing all sovereign GPU nodes onto the mesh.** Doctrine v11 — never weaken. locked = EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17; Λ=Conjecture 1; Khipu=Conjecture 2; trust never 100%; reachable=REAL-PROBE-ONLY (never fabricate a node up); sovereign=owned-hardware passthrough; never commit a key; effectors SIMULATED. Honest BLOCKED beats fake green.

## WHAT JUST CHANGED (box, a11oy main — already pushed by founder session)
- Commit `f0145e11` to `szl-holdings/a11oy/szl_backend_hardening.py`: ADDITIVE.
  1. Added `omen-betterwithage` as a `sovereign-gpu` node (OMEN RTX 4060 Ti 8GB + Ryzen 8700G, always-on home brain) at tailnet `100.70.130.45:11434`.
  2. Added `_resolve_node_ip()` / `_tailscale_peers()`: the box now reads its OWN `tailscale status --json` and probes each GPU node at its CURRENT 100.x by hostname, falling back to the static IP if tailscale is unreadable (honest, never fabricates reachability). Env-pin `A11OY_GPU_NODE_<NAME>_IP` overrides.
- This is **a11oy-only** (`szl_backend_hardening.py` does not exist in killinchu — verified blob sha empty). Do NOT mirror to killinchu; not a shared module.

## HONEST NODE INVENTORY (3 sovereign GPUs + box CPU)
| node | machine | tailnet IP | GPU | state |
|---|---|---|---|---|
| hetzner-box-cpu | a11oy.net host | self | CPU | live (coordinator) |
| rtx-betterwithage | Blackwell laptop (traveling) | `100.125.77.31` | RTX 5050 8GB | computing |
| omen-betterwithage | OMEN desktop (always-on home) | `100.70.130.45` | RTX 4060 Ti 8GB | env+firewall set; founder restarting Ollama + loading llama3.1:8b |
| chaski | Replit cloud node | stale `100.76.58.50` / reported `100.102.173.88` | — | POWERED OFF ~1d |

## FORGE TASKS (each tick, token present, not frozen — freeze activates 2026-06-18 01:00 ET)
1. **Verify the box redeploys current a11oy main** so the f0145e11 node-table + resolver are live. PROVE: `GET https://a11oy.net/api/a11oy/v1/compute-pool-hardened` shows a node named `omen-betterwithage` in the list (even if reachable=false until founder's Ollama serves), AND the resolver is active (a reachable GPU node's `detail` contains `via tailscale-live` or `via static-fallback`). Distinguish a real 200-JSON from an SPA shell (content-type + body markers).
2. **When founder's OMEN Ollama is serving** (`100.70.130.45:11434/api/tags` == 200 from the box over tailnet), confirm `omen-betterwithage` flips `reachable:true, sovereign:true` and `gpu_nodes_reachable` rises to 2, and the energy operator `nodes_computing` includes it. Do NOT mark it up by any means other than a real probe.
3. **chaski (node 3) wake** is FOUNDER-GATED (Replit machine power-state — cannot be woken from the box). Leave the resolver to pick up its LIVE IP automatically once founder starts it (resolve dynamically; the stale `100.76.58.50` is just the fallback). Do NOT block the mesh on chaski; honest reachable=false while off.
4. **Offload routing (additive, honest):** once 2+ sovereign GPUs are LIVE, ensure szl-router/box prefers spreading `szl-fast` + embeddings (`bge-large`) across the home node (`omen-betterwithage`) so the traveling laptop is not the sole worker. Keep `x_szl_provenance` honest (served_by, sovereign true only for owned metal). Never claim VRAM fusion / "16GB combined" — nodes scale horizontally (placement + load-balance), they do NOT merge memory. Stating combined VRAM = the forbidden half-state.
5. **Add a home-node uptime probe** (additive): if `omen-betterwithage` or `rtx-betterwithage` was reachable and drops, surface it honestly (the existing uptime cron pattern). Do not auto-restart a founder machine; just report.

## FOUNDER STEPS (Forge: do NOT do these — founder hardware/account)
**OMEN (node 2) — finish serving:** in Administrator PowerShell:
```powershell
Get-Process *ollama* | Stop-Process -Force
Start-Process ollama -ArgumentList "serve"
ollama pull llama3.1:8b
ollama run llama3.1:8b "say ready"
ollama ps
```
**chaski (node 3) — wake the Replit:** open the chaski Repl, ensure it's on the tailnet (`tailscale up`), then:
```bash
OLLAMA_HOST=0.0.0.0:11434 ollama serve &
ollama pull llama3.1:8b
curl http://127.0.0.1:11434/api/tags   # expect 200
```
The box resolver will find chaski's CURRENT tailnet IP automatically — no hardcoded IP needed.

## PROVE-IT (Forge confirms, not founder-gated)
- [ ] `compute-pool-hardened` lists `omen-betterwithage`; resolver `detail` shows `via tailscale-*`.
- [ ] a11oy CI green after f0145e11 (doctrine/build/drift/security gates); GitHub↔HF in sync.
- [ ] When OMEN serves: `gpu_nodes_reachable` >= 2, energy `nodes_computing` includes the home node — by REAL probe only.
- [ ] Report DONE vs FOUNDER-GATED (chaski wake). Never fake a node up.
