# FORGE_2GPU_ENERGY.md — 2-GPU Sovereign Serve + "Throttle Both" + NIM Cloud Tier (I4)

> **FOUNDER-APPROVAL-GATED.** The sovereign GPU box (a11oy.net + an **NVIDIA RTX 4000
> Ada ~20 GB** second card; behind Tailscale) is dispatched **ONLY via the Forge**.
> Integration Dev I4 does **NOT** ssh into or modify the box. This file is the exact,
> copy-pasteable command/config set the **CTO compiles into the Forge order**. Nothing
> here runs until the founder approves and the Forge applies it.
>
> **This order EXTENDS Dev C's `FORGE_BOX_ENERGY.md`** (single-GPU exporter, vLLM spec
> decode, LMCache, LiteLLM, RouteLLM, Carbon-Aware). It adds the **second GPU**: a
> 2-GPU serve mode (TP=2 **or** role-split), **per-GPU** power caps + concurrency
> sharing (MPS/MIG), a **per-GPU** energy exporter, and the **NVIDIA NIM cloud tier**
> (Nemotron Ultra) routed through the existing gateway.
>
> **Honesty contract (doctrine v11):** the app side (`szl_energy_sovereign.py` +
> `szl_gpu_quant.py` `tiers_panel`) reads these metrics **only via the live per-GPU
> `gpu_reachable` probe** and labels every tile `MEASURED` (fresh on-box sample) or
> `ROADMAP` (not emitting yet). `sovereign:true` is claimed **only** when a local
> non-router endpoint's `/models` actually answers. **Nemotron Ultra is CLOUD →
> `tier=cloud, sovereign=false` always.** Nothing is ever fabricated.

---

## 0. Honest constraint (carry forward — NEVER violate)

Nemotron 3 Ultra (550B-A55B) needs **~768 GB VRAM** (≈4×GB200-class). The box
(a11oy.net GPU + RTX 4000 Ada ~20 GB) **cannot** run it locally. **NEVER claim
local Ultra.** Ultra is reachable only as the **cloud NIM tier** below
(`sovereign:false`). Local sovereign tier = a model that fits the **combined** VRAM
(TP=2) or the **role-split** layout. (Verified: `NEMOTRON_AGENT_MODEL_RESEARCH.md`,
`NEMOTRON_TWO_GPU_PLAN.md`.)

---

## 1. Identify both GPUs (run first; informs every command below)

```bash
nvidia-smi --query-gpu=index,name,memory.total,power.default_limit,power.max_limit \
  --format=csv,noheader,nounits
# expect 2 rows, e.g.:
#   0, NVIDIA RTX 5000 ..., 32768, 230, 250        <- a11oy.net primary GPU
#   1, NVIDIA RTX 4000 Ada ..., 20475, 130, 140    <- governance/draft GPU
# Note each index; CUDA_VISIBLE_DEVICES uses these indices.
```

---

## 2. TIER 2 — Sovereign-LOCAL across BOTH GPUs (pick ONE config)

### Config A — Tensor parallelism (shard ONE larger model across both cards)

Use when you want a **bigger** sovereign-local model than either card alone (e.g.
Qwen3-32B, or a quantized Nemotron-3-Super that fits combined VRAM).

```bash
# vLLM tensor-parallel across GPU0 + GPU1. Both cards serve ONE model.
CUDA_VISIBLE_DEVICES=0,1 python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen3-32B-Instruct \
  --tensor-parallel-size 2 \
  --gpu-memory-utilization 0.90 \
  --max-model-len 32768 \
  --port 8000 \
  --disable-log-requests \
  --api-key "$A11OY_GPU_TOKEN"
# (If the two cards differ a lot in VRAM, prefer --pipeline-parallel-size 2 so each
#  stage sizes to its card instead of an even tensor shard.)
```

> TP=2 requires NCCL peer-to-peer across the two cards. If P2P is blocked, set
> `NCCL_P2P_DISABLE=1` (slower but correct) and re-measure tokens/s.

### Config B — Heterogeneous ROLE-SPLIT (recommended for the agent loop)

Main GPU = primary agent model. **RTX 4000 = dedicated governance/draft GPU**: it runs
the fast **Auto-Review classifier**, the **speculative-decoding draft model**
(Qwen2.5-Coder-1.5B), and **embeddings** — so the main GPU never stalls on inline
review/draft. Best fit for the Auto-Review + agent-loop architecture.

```bash
# --- GPU0 (primary agent model; spec-decode target) ---
CUDA_VISIBLE_DEVICES=0 python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-Coder-7B-Instruct \
  --gpu-memory-utilization 0.88 \
  --port 8000 --disable-log-requests --api-key "$A11OY_GPU_TOKEN" &

# --- GPU1 = RTX 4000: draft model (drives speculative decoding for GPU0) ---
CUDA_VISIBLE_DEVICES=1 python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-Coder-1.5B-Instruct \
  --gpu-memory-utilization 0.45 \
  --port 8001 --disable-log-requests --api-key "$A11OY_GPU_TOKEN" &

# --- GPU1 = RTX 4000: Auto-Review CLASSIFIER (Cursor pattern; small, fast) ---
CUDA_VISIBLE_DEVICES=1 python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-Coder-1.5B-Instruct \
  --gpu-memory-utilization 0.20 \
  --port 8002 --disable-log-requests --api-key "$A11OY_GPU_TOKEN" &

# --- GPU1 = RTX 4000: embeddings server ---
CUDA_VISIBLE_DEVICES=1 python -m vllm.entrypoints.openai.api_server \
  --model BAAI/bge-small-en-v1.5 --task embed \
  --gpu-memory-utilization 0.15 \
  --port 8003 --disable-log-requests --api-key "$A11OY_GPU_TOKEN" &
```

> Three processes share GPU1 → enable **MPS** (§4) so they coexist without serializing.

Set the a11oy Space secrets so the app maps roles to endpoints (role-split mode):

```
A11OY_MODEL_BASE_URL          = http://127.0.0.1:8000/v1     # primary agent (sovereign probe target)
A11OY_DRAFT_BASE_URL          = http://127.0.0.1:8001/v1     # RTX4000 draft (spec decode)
A11OY_AUTOREVIEW_BASE_URL     = http://127.0.0.1:8002/v1     # RTX4000 Auto-Review classifier
A11OY_EMBED_BASE_URL          = http://127.0.0.1:8003/v1     # RTX4000 embeddings
A11OY_GPU_LABEL_0             = RTX-5000-betterwithage
A11OY_GPU_LABEL_1             = RTX-4000-Ada-governance
A11OY_SERVE_MODE              = role-split                   # or: tp2
```

> The app claims `sovereign:true` only when `A11OY_MODEL_BASE_URL` is a non-router
> endpoint **and** its `/models` answers. The tier panel shows per-GPU tiles only when
> the per-GPU exporter (§5) is emitting; otherwise each tile is honest `ROADMAP`.

---

## 3. "THROTTLE BOTH" — per-GPU power caps (real thermal/energy governance)

```bash
sudo nvidia-smi -i 0 -pm 1            # enable persistence mode (both cards)
sudo nvidia-smi -i 1 -pm 1
sudo nvidia-smi -i 0 -pl 200          # cap GPU0 (RTX 5000) to 200 W  (<= its max_limit)
sudo nvidia-smi -i 1 -pl 110          # cap GPU1 (RTX 4000 Ada) to 110 W
# verify the caps took:
nvidia-smi --query-gpu=index,power.limit,power.draw --format=csv,noheader,nounits
# (optional) lock clocks for reproducible J/token measurement:
# sudo nvidia-smi -i 0 -lgc 300,1800
```

> "Throttle" is then a **governed, auditable knob**: lower the cap, watch tokens/s drop
> and per-GPU joules/token change in the **signed receipt**. The cap watts surface in
> the tier panel (`power_cap_w`) once the exporter reports `power.limit`.

---

## 4. Concurrency sharing on the RTX 4000 — MPS (or MIG)

Role-split runs **3 processes on GPU1**; without sharing they serialize.

```bash
# --- MPS (preferred for an Ada card; no partitioning, fine-grained sharing) ---
export CUDA_VISIBLE_DEVICES=1
sudo nvidia-smi -i 1 -c EXCLUSIVE_PROCESS    # required by MPS
nvidia-cuda-mps-control -d                   # start MPS daemon (background)
echo "start_server -uid $(id -u)" | nvidia-cuda-mps-control
# (start the GPU1 vLLM/classifier/embed processes AFTER MPS is up so they attach.)
# stop later: echo quit | nvidia-cuda-mps-control ; sudo nvidia-smi -i 1 -c DEFAULT

# --- MIG (only if the card supports it; RTX 4000 Ada does NOT — use MPS) ---
# sudo nvidia-smi -i 1 -mig 1
# sudo nvidia-smi mig -i 1 -cgi 1g.5gb,1g.5gb,1g.5gb -C
```

> RTX 4000 Ada does **not** support MIG → use **MPS**. MIG block kept for the future
> supercomputer (A100/H100/GB200-class) where partitioning the frontier card is useful.

---

## 5. Per-GPU energy exporter — extends Dev C's `gpu_energy_exporter.py` to 2 GPUs

Dev C's exporter summed power across all GPUs into one counter. The 2-GPU tier panel
needs **per-GPU** joules/watts/power-cap. Replace `/opt/a11oy/gpu_energy_exporter.py`
with this per-index version (still pure stdlib, still on `:9402/metrics`):

```python
#!/usr/bin/env python3
# /opt/a11oy/gpu_energy_exporter.py — PER-GPU cumulative joules + watts + power-cap on
# :9402/metrics. Integrates nvidia-smi power.draw (W) over wall-clock to joules per index.
# Back-compat: still emits the summed a11oy_gpu_energy_joules_total / _power_watts lines
# Dev C's single-GPU panel reads, PLUS per-index lines the 2-GPU tier panel reads.
import http.server, subprocess, threading, time

_g = {}                      # index -> {"joules":float,"watts":float,"cap":float,"name":str}
_last = {"t": time.time()}

def _poll():
    while True:
        try:
            out = subprocess.check_output(
                ["nvidia-smi",
                 "--query-gpu=index,name,power.draw,power.limit",
                 "--format=csv,noheader,nounits"], timeout=4).decode().strip().splitlines()
            now = time.time(); dt = max(0.0, now - _last["t"]); _last["t"] = now
            for row in out:
                idx, name, draw, lim = [c.strip() for c in row.split(",")]
                idx = int(idx); w = float(draw); cap = float(lim)
                st = _g.setdefault(idx, {"joules": 0.0, "watts": 0.0, "cap": 0.0, "name": name})
                st["joules"] += w * dt    # P·Δt = Joules (per GPU)
                st["watts"] = w; st["cap"] = cap; st["name"] = name
        except Exception:
            pass
        time.sleep(1.0)

class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        lines = []
        tot_j = sum(s["joules"] for s in _g.values())
        tot_w = sum(s["watts"] for s in _g.values())
        # back-compat summed lines (Dev C single-GPU panel):
        lines += ["# HELP a11oy_gpu_energy_joules_total Cumulative GPU energy (J), all GPUs.",
                  "# TYPE a11oy_gpu_energy_joules_total counter",
                  "a11oy_gpu_energy_joules_total %.3f" % tot_j,
                  "# HELP a11oy_gpu_power_watts Instantaneous GPU power (W), all GPUs.",
                  "# TYPE a11oy_gpu_power_watts gauge",
                  "a11oy_gpu_power_watts %.3f" % tot_w]
        # per-GPU lines (2-GPU tier panel):
        lines += ["# HELP a11oy_gpu_energy_joules Per-GPU cumulative energy (J).",
                  "# TYPE a11oy_gpu_energy_joules counter",
                  "# HELP a11oy_gpu_watts Per-GPU instantaneous power (W).",
                  "# TYPE a11oy_gpu_watts gauge",
                  "# HELP a11oy_gpu_power_cap_watts Per-GPU enforced power limit (W).",
                  "# TYPE a11oy_gpu_power_cap_watts gauge"]
        for idx, s in sorted(_g.items()):
            lbl = 'gpu="%d",name="%s"' % (idx, s["name"].replace('"', ""))
            lines.append('a11oy_gpu_energy_joules{%s} %.3f' % (lbl, s["joules"]))
            lines.append('a11oy_gpu_watts{%s} %.3f' % (lbl, s["watts"]))
            lines.append('a11oy_gpu_power_cap_watts{%s} %.3f' % (lbl, s["cap"]))
        body = ("\n".join(lines) + "\n").encode()
        self.send_response(200); self.send_header("Content-Type", "text/plain"); self.end_headers()
        self.wfile.write(body)
    def log_message(self, *a): pass

if __name__ == "__main__":
    threading.Thread(target=_poll, daemon=True).start()
    http.server.HTTPServer(("0.0.0.0", 9402), H).serve_forever()
```

Restart the existing service (same unit name as Dev C — no new unit needed):

```bash
sudo systemctl restart a11oy-gpu-energy.service
curl -s http://127.0.0.1:9402/metrics | grep -E 'a11oy_gpu_(energy_joules|watts|power_cap)'
# expect per-index lines, e.g. a11oy_gpu_watts{gpu="1",name="NVIDIA RTX 4000 Ada ..."} 87.4
```

Point the app at the merged metrics surface (reuse Dev C's merge proxy §1c so vLLM
token counters + per-GPU energy land on one URL):

```
A11OY_VLLM_METRICS_URL = http://127.0.0.1:9403/metrics   # vLLM tokens + per-GPU energy
```

**Result when applied:** the tier panel's per-GPU tiles flip `ROADMAP → MEASURED`
(per-GPU joules, watts, power-cap), and each signed turn receipt carries real
per-GPU `joules_consumed` (`energy_label:"MEASURED"`).

---

## 6. TIER 1 — NVIDIA NIM cloud tier (Nemotron Ultra) routed via the gateway

Register Nemotron Ultra as the **cloud "frontier/hard" tier** in the existing LiteLLM
config from Dev C (§4 of `FORGE_BOX_ENERGY.md`). **`sovereign:false` always** — this is
NVIDIA-hosted compute, never local.

```bash
# Append the NIM cloud tier to /opt/a11oy/litellm_config.yaml model_list:
cat >> /opt/a11oy/litellm_config.yaml <<'YAML'
  - model_name: cloud-frontier-nemotron        # NVIDIA NIM (build.nvidia.com) — CLOUD, sovereign:false
    litellm_params:
      model: openai/nvidia/llama-3.1-nemotron-ultra-253b-v1
      api_base: https://integrate.api.nvidia.com/v1
      api_key: os.environ/NVIDIA_NIM_API_KEY
YAML
# add Nemotron as the hard-tier fallback target (edit litellm_settings.fallbacks):
#   fallbacks: [{"local-coder": ["cloud-frontier-nemotron","cloud-fallback"]}, ...]
litellm --config /opt/a11oy/litellm_config.yaml --port 4000
```

NIM key + tier secrets (founder-set; **NEVER committed** — Space/box secret only):

```
NVIDIA_NIM_API_KEY        = nvapi-...            # from build.nvidia.com (founder issues)
A11OY_NIM_BASE_URL        = https://integrate.api.nvidia.com/v1
A11OY_NIM_MODEL           = nvidia/llama-3.1-nemotron-ultra-253b-v1
A11OY_NIM_TIER            = cloud                # app forces sovereign:false for this tier
```

> RouteLLM (Dev C §5) re-weights easy→local, hard→`cloud-frontier-nemotron`. Quick probe:
> ```bash
> curl -s https://integrate.api.nvidia.com/v1/models \
>   -H "Authorization: Bearer $NVIDIA_NIM_API_KEY" | python3 -m json.tool | head
> ```

---

## 7. VERIFY-THE-CLAIMS harness — SZL-MEASURED vs NVIDIA datasheet (signed)

Every NVIDIA marketing claim (5× speedup, 30% fewer tokens, τ-bench, 1M retrieval) is
**re-measured on OUR harness** and published as a **signed** number — never the datasheet
figure. Until a real measurement exists the verify-claims panel stays **empty/ROADMAP**
(honest), not pre-filled.

```bash
# Drive N governed turns through the gateway against BOTH tiers, capture tokens/s + J/token
# from the merged /metrics, then POST each outcome to the app so the signed verify-claims
# row goes ROADMAP -> MEASURED:
#   szl_gpu_quant.record_measured_claim(metric, datasheet_value, szl_measured_value, n, harness)
# (in-process; the app signs the row via szl_dsse. No measurement -> row stays ROADMAP.)
```

The panel renders three honest states per row: **MEASURED** (signed SZL number + n +
harness), **SAMPLE** (illustrative, labeled), **ROADMAP** (not measured yet — empty value).

---

## 8. Verification checklist (run after the Forge applies this order)

```bash
BASE=https://szlholdings-a11oy.hf.space

# 1. Two GPUs visible + sovereign honest:
curl -s "$BASE/api/a11oy/code/healthz" | python3 -m json.tool | grep -E 'sovereign|inference'

# 2. Per-GPU tier panel MEASURED (per-GPU joules + power cap + tokens/s):
curl -s "$BASE/api/a11oy/v1/quant/tiers" | python3 -m json.tool | grep -E 'gpu|joules|power_cap|tokens_per_s|sovereign|label'
#   expect 2 GPU tiles, label MEASURED once the per-GPU exporter emits; cloud tier sovereign:false.

# 3. Energy panels (Dev C) still MEASURED on the merged surface:
for p in jtoken throughput kvcache gateway router carbon sovereign; do
  echo "== $p =="; curl -s "$BASE/api/a11oy/v1/energy/$p" \
    | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("label") or d.get("summary"))'
done

# 4. NIM cloud tier reachable + labeled cloud/sovereign:false:
curl -s "$BASE/api/a11oy/v1/quant/tiers" | python3 -c 'import sys,json;d=json.load(sys.stdin);print([t for t in d.get("tiers",[]) if t.get("where")=="cloud"])'

# 5. Verify-claims rows MEASURED (signed) once driven; else honest ROADMAP:
curl -s "$BASE/api/a11oy/v1/quant/verify-claims" | python3 -m json.tool | head -40

# 6. A signed turn receipt carries per-GPU joules:
#    drive one governed turn, read the khipu energy.receipt -> joules_consumed != null.
```

---

## Honesty invariants this 2-GPU order MUST preserve (doctrine v11)

- **NEVER claim local Nemotron Ultra** — Ultra is the **cloud NIM tier**, `sovereign:false`, always.
- `sovereign:true` ONLY with a live local-endpoint `/models` probe — never a bare env flag, never the cloud tier.
- `joules_honesty:"measured"` ONLY with a fresh real per-GPU exporter sample (≤120 s) — `szl_joules_truth` decides.
- No meter → no number: every absent per-GPU/tier/claim metric stays `ROADMAP`/`None`, never fabricated.
- Verify-claims publishes **SZL-MEASURED signed** numbers, **never** the NVIDIA datasheet figure; empty until measured.
- Open-weight local models; **NEVER commit a key** (NIM key + GPU token are Space/box secrets / `os.environ`).
- Effectors stay SIMULATED · human-on-loop; 0 visible codenames; trust < 100%; 0 CDN; signed receipts.

---

### Sources
- Two-GPU plan + honest Ultra constraint: `NEMOTRON_TWO_GPU_PLAN.md`, `NEMOTRON_AGENT_MODEL_RESEARCH.md` (this repo)
- Single-GPU energy exporter / spec-decode / LMCache / LiteLLM / RouteLLM / Carbon-Aware (extended here): `FORGE_BOX_ENERGY.md` (Dev C, this repo)
- vLLM tensor/pipeline parallelism — https://docs.vllm.ai/en/latest/serving/distributed_serving.html
- vLLM speculative decoding — https://docs.vllm.ai/en/latest/features/spec_decode.html
- NVIDIA MPS (Multi-Process Service) — https://docs.nvidia.com/deploy/mps/index.html
- NVIDIA MIG — https://docs.nvidia.com/datacenter/tesla/mig-user-guide/
- `nvidia-smi` power management (`-pl`, `-pm`, `-lgc`) — https://developer.nvidia.com/nvidia-system-management-interface
- NVIDIA NIM / build.nvidia.com (Nemotron via OpenAI-compatible endpoint) — https://docs.nvidia.com/nim/large-language-models/latest/getting-started.html
- LiteLLM gateway — https://github.com/BerriAI/litellm ; RouteLLM — https://github.com/lm-sys/routellm
- J/token energy model: Watt-Counts — https://arxiv.org/abs/2604.09048
