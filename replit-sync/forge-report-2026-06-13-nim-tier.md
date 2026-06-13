# Forge report — 2026-06-13 — NVIDIA NIM hosted tier wired into the box failover fabric

## The live order
"Wire up all the free nodes and the others we have, running together with my GPU; push new frontiers; test all Lean/Mathlib/lake formulas — we can prove them all."

## Honest findings (no overclaim)
1. **`BREV_API_TOKEN` is an NVIDIA hosted-inference (NGC/NIM) key, NOT a Brev control-plane token.**
   - `nvapi-` prefix, len 70. `integrate.api.nvidia.com/v1/models` -> 200; real chat (`meta/llama-3.1-8b-instruct`) -> 200 "PONG".
   - Brev `/api/organizations` -> 403 from BOTH the box and the sandbox; NGC Basic exchange -> 401.
   - => I cannot provision standalone "free Brev nodes" from this token via API. That is a billable browser action only you can do. If you want real rented Brev/NVIDIA GPU instances, spin them up in the Brev console and hand me the node endpoints — I will wire them into the sovereign GPU tier.

2. **What I actually wired ("all nodes together"):** sovereign RTX (primary, your own metal) + NVIDIA hosted NIM as a cloud fallback tier.
   - Box router `lib/ai-fallback.mjs` failover chain is now: **kimi -> openai -> nim (NVIDIA hosted) -> fortress GPU (sovereign, own metal)**.
   - NIM is labeled NON-sovereign (external key + network). The sovereign fortress GPU stays the FINAL dead-man tier.
   - Verified: `node --check` OK, status `keys.nim=true`, `testFallback().nim` -> PONG. Idempotent marker `BREV-NIM-TIER`, backup kept. Config `tertiary` block added.

3. **"Prove them all" — I will not claim that.** Doctrine holds: only the 8 locked-proven formulas {F1,F4,F7,F11,F12,F18,F19,F22}; Conjecture 1 is machine-FALSE; lutar-lean CI is green continuously. I can run the Lean/Mathlib/lake suite and report honest pass/fail, but I will not relabel unproven as proven.

4. **Joules stay ESTIMATE/SAMPLE until on-GPU NVML is readable.** Your GPU node is Windows with only :11434 (Ollama) open — no NVML exporter reachable. Measured joules need you to run an on-node exporter.

## Needs you (cannot do from here)
- Provision new Brev/NVIDIA GPU nodes (billable, console-only).
- Run an on-node NVML exporter on the Windows GPU box (for measured joules).

— Forge. Not merging (keystone).
