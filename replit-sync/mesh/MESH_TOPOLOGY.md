# MESH_TOPOLOGY — SZL Sovereign GPU Mesh

**Status: DESIGN (PLANNING).** This document is the wiring design for an any-GPU,
auto-detecting inference mesh over Tailscale for SZL Holdings. Nothing here launches
servers; it specifies how `mesh_join.sh` (node side) and `mesh_serve.py` (coordinator)
behave once Forge wires the real boxes.

**Hard design constraint:** NO node count, GPU model, or VRAM size is hardcoded. Every
node is **PROBED on join** (`nvidia-smi` → VRAM + compute capability; absent → CPU role)
and the model-placement table is **COMPUTED from detected capability at plan time**, never
written in advance. The numbers in the worked example below are `MODELED` illustrations of
the algorithm, not asserted hardware.

---

## 0. Doctrine gates (this layer must honor)

- **SZL-Nemo = a *governed* serving of the OPEN `Qwen/Qwen3-32B` (Apache-2.0) model.**
  NEVER described as from-scratch, NEVER "550B", NEVER a local "Ultra" tier. Nemotron Ultra
  is a **cloud-NIM verified tier only** and never runs on these boxes.
- **Trust never 100%.** Every node's reported capability is *attested but not trusted*: the
  coordinator records who reported what and labels placement `MODELED` until a node passes a
  live health probe (then `LIVE`).
- **Data labels:** `LIVE` (probed this run), `SAMPLE` (cached/example), `MODELED` (computed
  but unverified). Capability JSONs carry a `label` field.
- **Never commit a key.** Tailscale auth keys come from env / `tailscale up` interactive, are
  never written to a capability JSON or to git. Coordinator API token is env-only.
- **0 runtime CDN.** Any served surface ships assets locally; no third-party CDN at runtime.
- This is the **physical inference layer** and is intentionally separate from the
  `szl-mesh` consensus/quorum layer (Khipu 3-of-4, DSSE receipts). The GPU mesh MAY emit a
  capability event into that layer later, but does not depend on it to route inference.

---

## 1. Overlay — one Tailscale tailnet

All nodes join the **same tailnet** anchored by the founder's laptop node
`betterwithage` (`100.125.77.31`). Tailscale gives every node a stable `100.x.y.z`
address and an encrypted WireGuard mesh, so the coordinator and workers address each
other by tailnet IP regardless of physical network/NAT.

| Plane | Address used | Notes |
|---|---|---|
| Control / capability registration | Tailscale IP (`100.x.y.z`) | private overlay, never public |
| Inference RPC (vLLM/llama.cpp) | Tailscale IP + port | private overlay only |
| Public ingress | `a11oy.net` `167.233.50.75` (CPU host) | the ONLY public face; reverse-proxies to coordinator over tailnet |
| Failover | HF Spaces (HF router) | when mesh unhealthy/empty |

Known fixed nodes (everything else is auto-discovered, not assumed):

| Node | Tailnet IP | Known fact | Role (computed, not fixed) |
|---|---|---|---|
| `betterwithage` (laptop, RTX 5050) | `100.125.77.31` | has a GPU, small VRAM | tailnet anchor; GPU worker if up |
| incoming "RTX 4000" | DHCP on join | **UNKNOWN variant** — Ada 20GB *or* Quadro 8GB | tier decided by probed VRAM |
| Hetzner `a11oy.net` | DHCP on join | CPU-only, always-on, public | coordinator/gateway + public proxy + failover broker |
| 6–7 additional nodes | DHCP on join | **UNKNOWN GPU/CPU mix** | each probed, each tiered |

> The "RTX 4000" ambiguity is the canonical reason the mesh probes instead of assumes:
> RTX 4000 Ada reports ~20 GB and SM 8.9; Quadro RTX 4000 reports ~8 GB and SM 7.5. Same
> name, different tier. Only `nvidia-smi` at join time resolves it.

---

## 2. Roles (assigned by the probe, not by hostname)

- **coordinator / gateway** — runs `mesh_serve.py`. Reads all capability JSONs, computes the
  placement table, emits serve commands, exposes `/register`, `/nodes`, `/plan`, `/healthz`.
  Preferred placement: the always-on CPU host (`a11oy`) so the brain survives any GPU node
  cycling. A backup coordinator may be elected on any always-up node.
- **GPU worker** — any node where `nvidia-smi` succeeds. Sub-tiered by VRAM (Section 3).
- **CPU node** — `nvidia-smi` absent/failed. Used for: orchestration, the public proxy,
  k3d / UDS (unix-domain-socket) workers, embeddings on CPU if needed, and redundancy.
- **public proxy** — CPU role bound to the public host; terminates TLS, forwards to the
  coordinator over the tailnet, applies the failover doctrine.
- **failover** — HF Spaces via HF router; engaged when the coordinator reports no healthy
  worker for a requested tier.

A node can hold multiple roles (e.g. `a11oy` = coordinator + public proxy + CPU worker).

---

## 3. Auto-tiering rule (the placement is COMPUTED here)

On each plan run the coordinator buckets every `LIVE`/`MODELED` node by detected `vram_mb`:

| Tier | Detected VRAM | What gets placed | Serve engine |
|---|---|---|---|
| **T0 / CPU** | no GPU | orchestration, public proxy, k3d-UDS workers, CPU embeddings, redundancy | n/a or `llama.cpp` CPU build |
| **T1 / small GPU** | `>=4 GB` and `<8 GB` | tiny quantized model **or** embeddings/RAG reranker | `llama.cpp` (GGUF) single-node |
| **T2 / mid GPU** | `>=8 GB` and `<20 GB` | ONE quantized chat model (e.g. SZL-Nemo Qwen3-32B at heavier quant, or a smaller Qwen) **or** embeddings/RAG | `vLLM` single-node or `llama.cpp` |
| **T3 / large GPU** | `>=20 GB` | **shard SZL-Nemo = Qwen3-32B Q4** across a **pair** of T3 nodes via tensor-parallel | `vLLM` TP=2 (or `llama.cpp --rpc`) |

Sharding rule for T3:
- T3 nodes are paired (2-way tensor parallel) for the Qwen3-32B Q4 shard. Qwen3-32B has 64
  attention heads → divisible by TP=2 and TP=4; the planner only forms groups whose size
  divides the head count.
- A lone T3 node with `vram_mb >= single_fit_q4` (≈ 22–24 GB headroom dependent) MAY host
  Qwen3-32B Q4 **single-node** instead of waiting for a pair.
- If `>=4` T3 nodes exist, the planner MAY form a TP=4 group for higher throughput; it never
  forms a group whose combined VRAM is below the model's quantized footprint + KV headroom.

Footprints the planner uses (all `MODELED`, recomputed from quant + context, never trusted blind):

| Artifact | Approx weight footprint | Min VRAM to consider |
|---|---|---|
| Qwen3-32B **Q4** (SZL-Nemo) sharded TP=2 | ~18–20 GB total → ~9–10 GB/GPU + KV | each shard GPU `>= 20 GB` for safe KV/context |
| Qwen3-32B **Q4** single-node | ~18–20 GB + KV | `>= 24 GB` recommended; `>= 20 GB` at short context |
| Mid quantized chat (e.g. 7–14B Q4/Q5) | ~5–10 GB | `>= 8 GB` |
| Embedding / reranker (e.g. bge-class) | ~1–3 GB | `>= 4 GB` (or CPU) |

> These thresholds live in `mesh_serve.py` as named constants and are applied to **detected**
> VRAM. Changing a node's GPU changes its tier automatically on the next plan run.

---

## 4. Placement table — COMPUTED, worked example (MODELED)

Illustration ONLY, to show the algorithm's output shape. Assume a hypothetical join result:

| Node | Detected GPU | vram_mb | Tier |
|---|---|---|---|
| `betterwithage` | RTX 5050 Laptop | 8192 | T2 |
| `rtx4000-incoming` | (Ada → 20480) | 20480 | T3 |
| `worker-a` | RTX 3090 | 24576 | T3 |
| `worker-b` | RTX 3060 | 12288 | T2 |
| `worker-c` | (no GPU) | 0 | CPU |
| `a11oy` | (no GPU) | 0 | CPU |

Planner output (what `mesh_serve.py --plan` emits — `MODELED` until health-verified):

| Placement | Nodes | Model / shard | Engine | Why |
|---|---|---|---|---|
| **SZL-Nemo shard** | `rtx4000-incoming` + `worker-a` | Qwen3-32B Q4, TP=2 | vLLM TP=2 | two T3 GPUs paired |
| Mid single | `worker-b` | smaller Qwen Q4 / chat | vLLM | one T2 GPU |
| Embeddings/RAG | `betterwithage` | bge-class embeddings | llama.cpp | T2, kept for RAG so laptop isn't a chat dependency |
| Coordinator + proxy + failover broker | `a11oy` | — | — | always-on CPU public host |
| Orchestration / k3d-UDS / redundancy | `worker-c` | — | — | spare CPU |

If the incoming RTX 4000 turns out to be the **Quadro 8GB** variant, it drops to **T2**, the
T3 pool has only `worker-a` (24 GB) → planner serves Qwen3-32B Q4 **single-node** on
`worker-a`, and the Quadro joins the mid/embeddings pool. **Same input script, different
computed plan — no edits.**

---

## 5. Health / heartbeat

- Each worker registers a capability JSON on join and then POSTs a heartbeat to the
  coordinator on an interval (default 30 s) carrying `{hostname, tailscale_ip, label,
  gpu_util, vram_free_mb, ts}`.
- A node is **healthy** if its last heartbeat is within `2 × interval`. Stale → marked
  `degraded`; missing for `>5 ×` → `down` and removed from the active placement on next plan.
- The coordinator's `/healthz` returns the live roster + each node's `label` and health.
- Placement label transitions: `MODELED` (computed) → `LIVE` (engine answered a probe
  request) → `degraded`/`down` (heartbeat lapse). The coordinator never reports a node as
  `LIVE` it has not actually round-tripped. **Trust never 100%.**

---

## 6. Failover to HF Spaces

The public proxy on `a11oy` follows this order per request tier:

1. **Tailnet mesh** — coordinator has a `LIVE` node for the tier → route there.
2. **Mesh degraded** — tier has only `MODELED`/`degraded` nodes → try once with short timeout.
3. **HF router failover** — no usable mesh node → forward to the HF Spaces endpoint
   (`HF_ROUTER_URL`) which serves the governed SZL-Nemo (Qwen3-32B) failover tier.
4. **Honest refusal** — both unavailable → return a labeled error, never a fabricated answer.

The response always carries a header/field stating which tier served it
(`x-szl-serve-tier: mesh-live | mesh-degraded | hf-failover`) so callers know the provenance.

---

## 7. Security & doctrine recap (this layer)

- Tailnet is the trust boundary for control + inference RPC; only `a11oy:443` is public.
- Auth keys / tokens are **env-only**, never serialized into capability JSON or committed.
- Capability JSONs contain no secrets — only hostname, tailnet IP, GPU name, vram_mb, role,
  label, timestamp.
- Models are **labeled**: SZL-Nemo is the governed Qwen3-32B Apache-2.0 serving; cloud-NIM
  Nemotron Ultra is a separate verified tier and is **not** part of this on-box mesh.
- 0 runtime CDN on any served surface; planning + scripts + orders only in this deliverable.

---

## File map (this deliverable)

| File | Purpose |
|---|---|
| `MESH_TOPOLOGY.md` | this design |
| `mesh_join.sh` | node-join: tailscale + nvidia-smi probe + capability JSON + register (idempotent) |
| `mesh_serve.py` | coordinator: read capability JSONs → compute placement → emit serve commands (no launch) |
| `A11OY_MESH_ROUTING.md` | how a11oy `A11OY_MODEL_BASE_URL` points at the coordinator + HF failover |
| `FORGE_MESH_ORDER.md` | dispatch order for Forge to wire real boxes + verification checklist |
