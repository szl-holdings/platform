# FORGE_SZL_NEMO.md — Sovereign GPU box order (Lane I1: SZL-Nemo Core)

> **FOUNDER-APPROVAL-GATED.** The sovereign GPU box (a-11-oy.com main GPU + NVIDIA
> RTX 4000 Ada; vLLM behind Tailscale) is dispatched ONLY via the Forge. Integration
> Dev I1 does **NOT** ssh into or modify the box. This file is the exact,
> copy-pasteable set of commands/config the **CTO compiles into the Forge order**.
> Nothing here runs until the founder approves and the Forge applies it.
>
> **Honesty contract (doctrine v11):** the app side (`a11oy_nemo_core.py`,
> `szl_energy_sovereign.py`) reads sovereign/throughput/energy metrics **only via the
> live `gpu_reachable` / `_sovereign_state()` probe** and labels everything `MEASURED`
> (real fresh on-box sample) or `ROADMAP` (not emitting yet). It **never fabricates** a
> sovereign, speculative-decode, or τ-bench number. Applying this order is what flips the
> SZL-Nemo tier + MTP panels from `ROADMAP → MEASURED`.
>
> **Cross-references:** this order extends `FORGE_BOX_ENERGY.md` (Dev C — energy/J-token
> exporter, LiteLLM, RouteLLM, LMCache, carbon) and implements `NEMOTRON_TWO_GPU_PLAN.md`
> (two-GPU sovereign-local + cloud-NIM frontier tier). Apply `FORGE_BOX_ENERGY.md`
> sections 1–6 first; this file adds the SZL-Nemo-specific base/post-train, two-GPU serve,
> NIM cloud tier, and speculative-decode wiring on top.

---

## 0. What flips when this order is applied (the honest ROADMAP → MEASURED gates)

| App surface (live now, ROADMAP) | Flips to MEASURED when the box… |
|---|---|
| `GET /api/a11oy/v1/nemo/tiers` → `sovereign-local.sovereign:false` | …serves the base on the 2-GPU vLLM endpoint and `_gpu_reachable()` /models answers. |
| `GET /api/a11oy/v1/nemo/mtp` → `alpha_label:"ILLUSTRATIVE"` (α=0.8) | …exports `vllm:spec_decode_num_accepted_tokens_total` / `…_draft_tokens_total` so α is empirical. |
| `GET /api/a11oy/v1/nemo/tau` → already MEASURED 100% on `szl-tau-tool-rules` | (already MEASURED app-side; box adds real-model τ-bench once the served model answers.) |
| `cloud-NIM-frontier.sovereign:false` (always false — honest) | NIM key set; tier reports LIVE cloud endpoint (stays `sovereign:false` forever — cloud). |

> `sovereign:true` is claimed ONLY with a live `_local_endpoint_reachable()` /models
> probe per GPU. A bare env flag never flips it. This is the single honesty gate.

---

## 1. Base model + LoRA/QLoRA post-train (open base — NEVER from-scratch)

SZL-Nemo is built **ON an open base** (default **Qwen3-32B**, Apache-2.0). We do NOT
train a foundation model from scratch; there is no 550B SZL model and no local
Nemotron-Ultra. The Forge post-trains a thin LoRA/QLoRA adapter on the open base for the
domain-expert heads (counter-uas / maritime / governance / code / finance), then merges
or serves the adapter. Alternatives: GLM-4 (MIT), Qwen2.5-Coder-32B-Instruct (Apache-2.0).

### 1a. QLoRA fine-tune on the open base (fits the 2-GPU box; 4-bit)

```bash
# /opt/a11oy/nemo finetune — QLoRA on Qwen3-32B (4-bit) for the domain-expert heads.
pip install "peft>=0.11" "trl>=0.9" "bitsandbytes>=0.43" "transformers>=4.44" "datasets" "accelerate"

# Dataset: SZL domain-expert SFT mix (counter-uas / maritime / governance / code / finance),
# each example tagged with its expert id so the router's labels stay honest.
export NEMO_BASE=Qwen/Qwen3-32B            # Apache-2.0 open base
export NEMO_OUT=/var/lib/a11oy/nemo-lora

accelerate launch -m trl.scripts.sft \
  --model_name_or_path "$NEMO_BASE" \
  --dataset_name /var/lib/a11oy/szl_expert_sft.jsonl \
  --load_in_4bit True \
  --use_peft True --lora_r 16 --lora_alpha 32 --lora_dropout 0.05 \
  --lora_target_modules q_proj k_proj v_proj o_proj gate_proj up_proj down_proj \
  --bf16 True --gradient_checkpointing True \
  --per_device_train_batch_size 1 --gradient_accumulation_steps 16 \
  --learning_rate 1e-4 --num_train_epochs 1 --max_seq_length 4096 \
  --output_dir "$NEMO_OUT" --logging_steps 10 --save_steps 200
```

### 1b. (optional) Merge the adapter for faster serve (or serve adapter live with vLLM)

```bash
# Merge LoRA into base for a single-weights serve (skips per-request adapter apply):
python - <<'PY'
from peft import AutoPeftModelForCausalLM
import os
m = AutoPeftModelForCausalLM.from_pretrained(os.environ["NEMO_OUT"], device_map="cpu")
m = m.merge_and_unload()
m.save_pretrained("/var/lib/a11oy/nemo-merged")
PY
# OR keep the adapter and serve it live: vLLM --enable-lora --lora-modules nemo=$NEMO_OUT
```

> **Honesty:** the model card (`/api/a11oy/v1/nemo/card`) already states what is OURS
> (router + MTP default + self-improvement loop + signed receipts + Λ governance) vs
> NOT ours (the base weights). Post-training a LoRA does NOT change that framing — we
> still say "built ON Qwen3-32B", never "from scratch".

---

## 2. Two-GPU sovereign-local serve (NEMOTRON_TWO_GPU_PLAN.md — pick A or B)

The founder has the **a-11-oy.com main GPU + NVIDIA RTX 4000 (Ada, ~20 GB)**. Two legit
configs — Forge verifies VRAM fit on-box:

### 2a. Config A — TENSOR PARALLELISM (shard ONE bigger model across both GPUs)

```bash
# vLLM TP=2 shards Qwen3-32B (or merged nemo) across main GPU + RTX 4000 → a bigger
# sovereign-local model than either card alone. OpenAI-compatible on :8000.
CUDA_VISIBLE_DEVICES=0,1 python -m vllm.entrypoints.openai.api_server \
  --model /var/lib/a11oy/nemo-merged \
  --served-model-name szl-nemo-local \
  --tensor-parallel-size 2 \
  --gpu-memory-utilization 0.90 \
  --max-model-len 8192 \
  --speculative-model Qwen/Qwen2.5-Coder-1.5B-Instruct \
  --num-speculative-tokens 4 \
  --enable-prefix-caching \
  --port 8000 --disable-log-requests \
  --api-key "$A11OY_GPU_TOKEN"
```

### 2b. Config B — HETEROGENEOUS ROLE SPLIT (recommended for agent loops)

```bash
# Main GPU (device 0) = primary agent model (full Qwen3-32B / merged nemo).
CUDA_VISIBLE_DEVICES=0 python -m vllm.entrypoints.openai.api_server \
  --model /var/lib/a11oy/nemo-merged \
  --served-model-name szl-nemo-local \
  --gpu-memory-utilization 0.92 --max-model-len 8192 \
  --enable-prefix-caching \
  --port 8000 --disable-log-requests --api-key "$A11OY_GPU_TOKEN"

# RTX 4000 (device 1) = dedicated governance/draft GPU: Auto-Review classifier +
# speculative-decode DRAFT model (Qwen2.5-Coder-1.5B) + embeddings. Keeps the main GPU
# from stalling on inline review/draft (Cursor pattern). OpenAI-compatible on :8001.
CUDA_VISIBLE_DEVICES=1 python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-Coder-1.5B-Instruct \
  --served-model-name szl-nemo-draft \
  --gpu-memory-utilization 0.85 --max-model-len 4096 \
  --port 8001 --disable-log-requests --api-key "$A11OY_GPU_TOKEN"
```

> Config B is best for the SZL agent-loop + Auto-Review architecture: the RTX 4000 earns
> its keep as the draft/governance card while the main GPU never stalls. Either way the
> served-local endpoint is what flips `nemo/tiers → sovereign-local.sovereign:true`.

### 2c. a11oy Space secrets that flip the SZL-Nemo sovereign-local tier LIVE

```
A11OY_MODEL_BASE_URL    = http://127.0.0.1:8000/v1     # main vLLM (TP=2 or role-split primary)
A11OY_NEMO_LOCAL_MODEL  = szl-nemo-local
A11OY_NEMO_DRAFT_URL    = http://127.0.0.1:8001/v1     # Config B only (draft/governance GPU)
A11OY_GPU_LABEL         = a-11-oy.com-main + RTX-4000-Ada
A11OY_GPU_TOKEN         = <vllm-api-key>               # vLLM --api-key value
```

> The app claims `sovereign:true` for the local tier ONLY when `A11OY_MODEL_BASE_URL` is a
> non-router endpoint **and** its `/models` actually answers (live `_gpu_reachable` probe
> in `szl_energy_sovereign._sovereign_state()`). Same probe the energy panels key off.

---

## 3. Speculative decoding → flips `nemo/mtp` α from ILLUSTRATIVE → MEASURED

The serve commands in §2 already pass `--speculative-model Qwen/Qwen2.5-Coder-1.5B-Instruct
--num-speculative-tokens 4`. Once running, vLLM exports:

- `vllm:spec_decode_num_accepted_tokens_total` / `vllm:spec_decode_num_draft_tokens_total`
  → empirical acceptance rate **α = accepted / drafted**
- `vllm:avg_generation_throughput_toks_per_s` → real tokens/s WITH speculative decode

The app's `/api/a11oy/v1/nemo/mtp` derives the speedup from the research model
**S = (k+1) / (k·(1−α)+1)**; with k=4, α=0.8 → S ≈ 2.78× (ILLUSTRATIVE until α is real).
When the box emits the counters, the panel's `alpha_label` flips `ILLUSTRATIVE → MEASURED`
and S reflects the measured acceptance rate. Until then α stays the documented α=0.8
illustrative value — never presented as measured.

```bash
# Verify the spec-decode counters are flowing (after serve is up):
curl -s http://127.0.0.1:8000/metrics | grep -E 'spec_decode_num_(accepted|draft)_tokens_total|avg_generation_throughput'
```

---

## 4. Cloud-NIM frontier tier (Nemotron Ultra) — ALWAYS sovereign:false (cloud)

Nemotron 3 Ultra (550B-A55B) needs ~768 GB VRAM (4×GB200-class) — it **CANNOT** run on the
2-GPU box. NEVER claim local Ultra. It is wired as the **cloud "frontier/hard" tier** via
NVIDIA NIM (build.nvidia.com) behind the LiteLLM/RouteLLM gateway from
`FORGE_BOX_ENERGY.md §4–§5`. This tier reports `sovereign:false` forever (honest).

### 4a. NIM key + endpoint (founder-set Space/box secret — NEVER commit)

```
# a11oy Space secret (founder-set; never in code, never committed):
A11OY_NIM_API_KEY    = <nvapi-... from build.nvidia.com>
A11OY_NIM_BASE_URL   = https://integrate.api.nvidia.com/v1
A11OY_NIM_MODEL      = nvidia/llama-3.1-nemotron-ultra-253b-v1   # or current NIM Nemotron Ultra id
```

### 4b. Register the cloud tier in the LiteLLM gateway (extends FORGE_BOX_ENERGY §4)

```yaml
# Append to /opt/a11oy/litellm_config.yaml model_list:
  - model_name: cloud-frontier-nemotron        # the "hard/frontier" tier (sovereign:false)
    litellm_params:
      model: openai/nvidia/llama-3.1-nemotron-ultra-253b-v1
      api_base: os.environ/A11OY_NIM_BASE_URL
      api_key:  os.environ/A11OY_NIM_API_KEY
```

```yaml
# router_settings fallback so hard prompts escalate local → cloud frontier:
  fallbacks: [{"szl-nemo-local": ["cloud-frontier-nemotron"]}]
```

### 4c. Verify-the-claims demo (the differentiator)

Run NVIDIA's published Nemotron claims (5× throughput, 30% efficiency, 91% accuracy,
1M-token retrieval) through OUR τ-bench (`szl_tau_eval.run_suite`) + J/token harness, then
publish the **SZL-measured** numbers in SIGNED receipts — never the datasheet figure. Label
`tier=cloud, sovereign=false`. Side-by-side datasheet vs SZL-measured is the demo beat.

```bash
# After NIM is wired, drive the frontier tier through the SZL τ-bench and sign the result:
curl -s -X POST https://szlholdings-a11oy.hf.space/api/a11oy/v1/nemo/infer \
  -H 'Content-Type: application/json' \
  -d '{"query":"<eval scenario>","prefer_tier":"cloud-NIM-frontier"}'
# expect a signed receipt; compare the measured τ score to NVIDIA's datasheet number.
```

---

## 5. "Throttle both" — per-GPU power caps + concurrency sharing (governed, auditable)

Ties to Dev C energy (`FORGE_BOX_ENERGY.md §1`). Power-cap each card and share concurrency
so the draft/classifier coexists with the main model. Measuring + SIGNING per-GPU joules
turns "throttle" into a governed, auditable knob.

```bash
# Per-GPU power cap (watts) — set conservative caps; tune to thermal/power budget:
sudo nvidia-smi -i 0 -pl 300      # a-11-oy.com main GPU
sudo nvidia-smi -i 1 -pl 130      # RTX 4000 Ada (lower TDP)

# Concurrency sharing on a card (classifier/draft + embeddings coexist):
#   MPS (works on all recent NVIDIA):
sudo nvidia-cuda-mps-control -d
#   MIG (only on MIG-capable data-center GPUs; RTX 4000 Ada does NOT support MIG —
#   use MPS there). Enable MIG only on a supporting card:
# sudo nvidia-smi -i 0 -mig 1   # then create instances with: sudo nvidia-smi mig -cgi <profile> -C

# Verify caps + per-GPU power draw (feeds Dev C joules exporter, extended for 2 GPUs):
nvidia-smi --query-gpu=index,name,power.limit,power.draw,memory.used,memory.total --format=csv
```

> Extend Dev C's `gpu_energy_exporter.py` (`FORGE_BOX_ENERGY.md §1a`) to label joules
> **per GPU index** so the SZL-Nemo tier panel can show per-GPU power-cap watts + joules.
> The exporter already sums `power.draw` across GPUs; add an index label to split them.

---

## 6. Verification checklist (run after the Forge applies this order)

```bash
HOST=https://szlholdings-a11oy.hf.space

# 1. Sovereign-local tier flips to sovereign:true (live gpu_reachable probe):
curl -s "$HOST/api/a11oy/v1/nemo/tiers" | python3 -c \
  'import sys,json;d=json.load(sys.stdin);[print(t["id"],t.get("sovereign"),t.get("label")) for t in d["tiers"]]'
# expect: sovereign-local True MEASURED   ;   cloud-NIM-frontier False  (cloud, honest)

# 2. MTP α flips ILLUSTRATIVE → MEASURED:
curl -s "$HOST/api/a11oy/v1/nemo/mtp" | python3 -m json.tool | grep -E 'alpha|speedup|label'
# expect: alpha_label "MEASURED", a real measured alpha, S from the measured rate

# 3. Governed-MoE route still signs every selection (must stay true):
curl -s "$HOST/api/a11oy/v1/nemo/route?query=intercept+a+rogue+drone+over+the+port" \
  | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d["experts"],d["receipt"]["signatures"]!=[])'
# expect: experts list + receipt signed True (REAL ECDSA-P256)

# 4. τ-bench self-improve delta still signs the MEASURED delta:
curl -s -X POST "$HOST/api/a11oy/v1/nemo/selfimprove" -H 'Content-Type: application/json' -d '{}' \
  | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d["label"],d["baseline_score_pct"],"->",d["improved_score_pct"])'
# expect: MEASURED 42.86 -> 100.0   (label MEASURED, signed receipt present)

# 5. Cloud-frontier (NIM) answers through the gateway, sovereign:false:
curl -s "$HOST/api/a11oy/v1/nemo/_diag" | python3 -m json.tool | grep -E 'signer_present|reuse'
```

---

## Honesty invariants this box order MUST preserve (doctrine v11)

- **NEVER** claim from-scratch / 550B / local Nemotron-Ultra / any certification. SZL-Nemo =
  "built ON an open base (Qwen3-32B, Apache-2.0), governed & sovereign."
- `sovereign:true` ONLY with a live per-GPU `_gpu_reachable()` /models probe — never a bare
  env flag. Cloud-NIM tier is `sovereign:false` forever.
- MTP α stays `ILLUSTRATIVE` (α=0.8) until vLLM emits real spec-decode counters — then
  `MEASURED`. No meter → no number; every absent metric stays ROADMAP, never fabricated.
- τ-bench scores are always produced by the REAL `szl_tau_eval` suite — never invented.
- Λ (Conjecture 1) stays < 1.0; trust < 100%; SLSA reads L1 honest / L2 attested /
  L3 roadmap (never bare L3). Effectors stay SIMULATED, human-on-loop.
- 0 JS/3D CDN (Google Fonts is the documented sibling-page exception); 0 visible codenames.
- Open-weight base only; **NEVER commit a key** — NIM key + vLLM api-key are founder-set
  Space/box secrets / `os.environ` only. Devs DO NOT ssh the box.

---

### Sources
- Qwen3-32B (open base, Apache-2.0): https://huggingface.co/Qwen/Qwen3-32B
- Qwen2.5-Coder-1.5B-Instruct (spec-decode draft): https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct
- QLoRA: https://arxiv.org/abs/2305.14314 ; PEFT: https://github.com/huggingface/peft ; TRL: https://github.com/huggingface/trl
- vLLM tensor parallelism: https://docs.vllm.ai/en/latest/serving/distributed_serving.html
- vLLM speculative decoding: https://docs.vllm.ai/en/latest/features/spec_decode.html
- NVIDIA NIM (build.nvidia.com): https://build.nvidia.com/ ; NIM OpenAI-compatible API: https://docs.nvidia.com/nim/
- Reflexion: https://arxiv.org/abs/2303.11366 ; Voyager: https://arxiv.org/abs/2305.16291 ; τ-bench: https://arxiv.org/abs/2406.12045
- Cross-refs: FORGE_BOX_ENERGY.md (Dev C), NEMOTRON_TWO_GPU_PLAN.md, NEMOTRON_AGENT_MODEL_RESEARCH.md
