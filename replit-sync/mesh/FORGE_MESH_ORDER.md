# FORGE_MESH_ORDER — dispatch order to wire the Sovereign GPU Mesh on the real boxes

**To:** Forge (Replit build agent)
**From:** Mesh wiring lane, SZL Holdings
**Scope:** Wire the any-GPU, auto-detecting inference mesh over Tailscale on the REAL boxes.
**Doctrine gates (never violate):** SZL-Nemo = governed serving of OPEN `Qwen/Qwen3-32B`
(Apache-2.0) — never from-scratch / never 550B / never local-Ultra (Nemotron Ultra = cloud-NIM
verified tier only). Trust never 100%. Real data labeled LIVE/SAMPLE/MODELED. **Never commit a
key.** 0 runtime CDN.

> This order assumes the planning artifacts already exist in
> `team/AUDIT/mesh/`: `MESH_TOPOLOGY.md`, `mesh_join.sh`, `mesh_serve.py`,
> `A11OY_MESH_ROUTING.md`. Forge executes them on hardware; it does not redesign them.

---

## 0. Pre-flight (do once)

- [ ] Confirm a Tailscale tailnet exists anchored by `betterwithage` (`100.125.77.31`).
- [ ] Mint a **Tailscale auth key** (reusable, ephemeral if desired). Hold it in the secret
      store ONLY. Export as `TS_AUTHKEY` per node at join time. **Never** put it in a file.
- [ ] Pick the coordinator host. **Recommended: `a11oy` (always-on, CPU-only, public).**
- [ ] Mint a coordinator bearer token → `COORDINATOR_TOKEN` (secret store, env-only).
- [ ] Decide a shared `CAP_DIR` (default `/var/lib/szl-mesh/caps`). If nodes can't share a
      filesystem, the `/register` HTTP path carries the same JSON to the coordinator.

---

## 1. Stand up the coordinator (on `a11oy`)

- [ ] Place `mesh_serve.py` on `a11oy`.
- [ ] Set env (secret store): `CAP_DIR`, `COORDINATOR_TOKEN`, `HF_ROUTER_URL`, `HF_TOKEN`.
- [ ] Run `python3 mesh_serve.py --cap-dir "$CAP_DIR" --plan` once to confirm it loads (it will
      report "no capability JSONs" until nodes join — that's expected).
- [ ] Front the coordinator with the OpenAI-compatible `/v1` facade + `/register`, `/nodes`,
      `/plan`, `/healthz` routes (per `A11OY_MESH_ROUTING.md`). Bind to the **tailnet IP**, not
      `0.0.0.0` publicly.

---

## 2. Join every node (auto-detect probe)

Run on EACH node — laptop, the incoming RTX 4000, and all 6–7 extras — **in any order, any time**:

```bash
export TS_AUTHKEY="…"                 # secret store, env-only
export COORDINATOR_URL="http://<a11oy-tailnet-ip>:8080"
export COORDINATOR_TOKEN="…"          # secret store, env-only
export CAP_DIR="/var/lib/szl-mesh/caps"
sudo -E bash team/AUDIT/mesh/mesh_join.sh
```

What it does on each node (idempotent — safe to re-run after a GPU swap or reboot):
- [ ] installs/checks tailscale, joins the `betterwithage` tailnet (skips re-auth if already up);
- [ ] runs `nvidia-smi` probe → sums VRAM, reads compute capability; **no GPU → CPU role,
      handled gracefully** (writes `vram_mb: 0`);
- [ ] writes `${CAP_DIR}/<hostname>.json` (hostname, tailscale_ip, gpu_name, vram_mb,
      compute_capability, role, label=LIVE, reported_at) — **NO secrets**;
- [ ] best-effort POST to `${COORDINATOR_URL}/register`; if it fails, the local JSON is still
      authoritative for a shared `CAP_DIR`.

> The incoming "RTX 4000" needs NO special handling: if it's the **Ada 20GB** it auto-tiers to
> **T3** (shard-eligible); if it's the **Quadro 8GB** it auto-tiers to **T2** (single quantized
> model / embeddings). The probe decides. Verified in the planner (both branches tested).

---

## 3. Compute placement on the coordinator

- [ ] After nodes have joined, run:
      ```bash
      python3 mesh_serve.py --cap-dir "$CAP_DIR" --plan
      python3 mesh_serve.py --cap-dir "$CAP_DIR" --emit-commands   # serve plan, NOT executed
      python3 mesh_serve.py --cap-dir "$CAP_DIR" --json            # machine-readable plan
      ```
- [ ] Review the COMPUTED placement table. Tiers: `>=20GB` shard SZL-Nemo (Qwen3-32B Q4, TP=2;
      TP=4 if `>=4` T3 nodes); `8–16GB` one quantized model or embeddings; `<8GB`(`>=4GB`) tiny
      model/embeddings; CPU → coordinator/proxy/k3d-UDS/redundancy.
- [ ] The emitted commands are the **serve plan**. Forge runs them on the named nodes (Ray +
      vLLM for shards; single-node vLLM / llama.cpp otherwise). For llama.cpp/GGUF artifacts,
      stage local model files — **no runtime CDN fetch.**

---

## 4. Wire a11oy routing

- [ ] Set on `a11oy` (secret store / env-only):
      ```
      A11OY_MODEL_BASE_URL="http://<coordinator-tailnet-ip>:8080/v1"
      A11OY_MODEL_NAME="SZL-Nemo"
      A11OY_FAILOVER_BASE_URL="${HF_ROUTER_URL}"
      A11OY_MESH_TOKEN="…"
      ```
- [ ] Confirm a11oy resolves model calls through the coordinator first, HF failover second,
      and stamps `x-szl-serve-tier` on every response (per `A11OY_MESH_ROUTING.md`).

---

## 5. VERIFICATION CHECKLIST (must all pass before declaring the mesh wired)

- [ ] **Every node reports capability.** `ls $CAP_DIR/*.json` shows one JSON per joined node;
      each has a valid `tailscale_ip`, a `vram_mb` (0 for CPU nodes), and `label: LIVE`.
- [ ] **No-GPU nodes handled.** CPU nodes show `gpu_name: none`, `vram_mb: 0`, `role: cpu` —
      no crash, no fabricated GPU.
- [ ] **RTX 4000 auto-detected.** Its JSON shows the real variant: ~20480 MB (Ada → T3) OR
      ~8192 MB (Quadro → T2). The plan reflects the detected tier, not an assumption.
- [ ] **Coordinator computes placement.** `mesh_serve.py --plan` prints a table with at least
      one coordinator role and tiers matching detected VRAM; `>=2` T3 nodes → a `szl-nemo-shard`
      row with `tp` dividing 64; lone large T3 → `szl-nemo-single`.
- [ ] **Serve commands emitted, not launched.** `--emit-commands` prints ssh/ray/vllm strings;
      `mesh_serve.py` itself starts NO server (verify: no listening port opened by it).
- [ ] **a11oy routes to coordinator.** A model call to `a11oy` returns
      `x-szl-serve-tier: mesh-live` when a worker is up.
- [ ] **Failover works.** Stop the relevant worker → a11oy call returns
      `x-szl-serve-tier: hf-failover` (not an error, not a fabricated answer); restart → returns
      `mesh-live` again.
- [ ] **Heartbeat/health honest.** Kill a worker → coordinator `/healthz` flips it
      `degraded`→`down` and drops it from the next plan; no stale `LIVE`.
- [ ] **Doctrine clean.** SZL-Nemo labeled as governed Qwen3-32B Apache-2.0 everywhere; no
      from-scratch/550B/local-Ultra claim; no key in any committed file or capability JSON;
      0 runtime CDN on the a11oy surface.
- [ ] **Idempotency.** Re-run `mesh_join.sh` on a node → no duplicate registration, no re-auth
      churn, JSON cleanly overwritten.

---

## 6. What Forge must NOT do

- Do NOT hardcode any node count, GPU model, or VRAM number anywhere — the probe + planner own
  that.
- Do NOT push secrets to GitHub/HF; do NOT commit `TS_AUTHKEY`, `COORDINATOR_TOKEN`,
  `A11OY_MESH_TOKEN`, `HF_TOKEN`.
- Do NOT relabel SZL-Nemo as anything other than a governed serving of OPEN Qwen3-32B.
- Do NOT claim a placement is `LIVE` before a real health probe — `MODELED` until verified.

---

## ADDENDUM 2026-06-14 — FOUNDER LAPTOP HARDWARE TRUTH (verified from live `ollama serve` log)

The founder's laptop (`betterwithage`, Tailscale `100.125.77.31`) was confirmed via the live
Ollama startup log to have TWO usable compute devices. Wire BOTH; label honestly.

### Device 1 — NVIDIA GeForce RTX 5050 Laptop GPU (PRIMARY BRAIN)
- `library=CUDA`, `driver=13.3`, **`compute=12.0` → BLACKWELL generation** (confirmed working, not CPU-fallback).
- `total=8.0 GiB`, `available 6.9 GiB` (discrete VRAM).
- CUDA 13 + Blackwell ⇒ FP8/FP4 + flash-attn kernels available. Prefer low-precision quant
  (Q4_K_M / FP4) for SZL-Nemo so the largest feasible model fits in ~7 GiB.
- ROLE: primary inference lane / sovereign brain.

### Device 2 — Intel Arc 140T iGPU (Core Ultra 9) — SECOND LANE (NEW, was idle)
- Ollama log: `"dropping integrated GPU; to enable, set OLLAMA_IGPU_ENABLE=1"`, description
  `Intel(R) Arc(TM) 140T GPU (16GB)`, and `OLLAMA_VULKAN:true` already set.
- The "16 GB" is **SHARED system RAM, NOT dedicated VRAM** — label every surface honestly
  (MODELED/SHARED, never "16GB discrete"). Competes with host RAM; good for a small second
  model / offload, not a frontier model.
- ENABLE IT: set `OLLAMA_IGPU_ENABLE=1` (Vulkan backend already on). Re-run probe to confirm
  Ollama lists both devices.

### CRITICAL wiring change — expose to the tailnet
- Log shows `OLLAMA_HOST:http://127.0.0.1:11434` → **localhost only; mesh CANNOT reach it.**
- Set `OLLAMA_HOST=0.0.0.0:11434` so the brain is reachable at `100.125.77.31:11434` over
  Tailscale. (Tailscale ACL restricts exposure to the tailnet — never bind to the public iface.)

### PROBE FIX (important — mesh auto-detect must not be NVIDIA-only)
- `mesh_join.sh` currently probes `nvidia-smi` → it would MISS the Arc iGPU entirely.
- Extend the probe to ALSO read **`ollama` GPU discovery / Vulkan** (`vulkaninfo --summary` or
  parse `ollama serve` GPU lines) so non-NVIDIA compute (Intel Arc, AMD) is detected and
  capability JSON records `{gpu_name, vram_mb, backend: cuda|vulkan, shared_ram: true|false}`.
- Coordinator placement table must treat `shared_ram:true` lanes as lower-priority / small-model
  only (never shard a 32B onto shared-RAM iGPU).

### SECONDARY APP-HOST on the laptop (founder request 2026-06-14)
- In addition to inference, run a11oy + killinchu LOCALLY on the laptop as a SECONDARY host
  (docker compose or `serve.py` per app), reachable over the tailnet.
- KEEP HETZNER (`a-11-oy.com`, 167.233.50.75) AS PRIMARY PUBLIC HOST for the demo — the laptop
  secondary is for sovereignty/failover proof, NOT the primary public endpoint (laptop is not
  always-on and the demo must not depend on it). HF Spaces = tertiary failover.
- Use Task Scheduler (per founder's working notes) to own `ollama serve` directly so it survives
  SSH-session close (`ollama serve` detached, no GUI), per the founder's own fix note.

### Verification checklist (this addendum)
- [ ] `OLLAMA_HOST=0.0.0.0:11434` set; brain reachable at `100.125.77.31:11434` from another tailnet node.
- [ ] `OLLAMA_IGPU_ENABLE=1` set; `ollama` lists BOTH RTX 5050 (CUDA) and Arc 140T (Vulkan).
- [ ] `mesh_join.sh` probe records both devices in capability JSON with correct backend + shared_ram flags.
- [ ] Coordinator placement table puts SZL-Nemo (Q4/FP4) on the 5050, a small model on the Arc lane.
- [ ] Laptop secondary a11oy/killinchu reachable over tailnet; Hetzner remains primary public host.
- [ ] a11oy `A11OY_MODEL_BASE_URL` → coordinator; HF-router failover intact.
- [ ] All labels honest: 5050 = 8GB discrete Blackwell; Arc = shared-RAM; trust never 100%.
