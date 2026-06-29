# FOUNDER GPU RUNBOOK — wire Chaski to the RTX 5000 (5 minutes, copy-paste)

**Why this is yours:** the GPU bring-up runs ON the physical Hetzner box (167.233.50.75) — `docker run --gpus all`. The CTO agent has GitHub admin only; Forge has GitHub + HF tokens only. Neither has shell on the box. After 3 "urgent" passes the GPU is still on `hf-router` because **no automated agent in the loop has SSH to the box.** You do.

The app code is DONE and live — it auto-detects a local endpoint (a11oy #319/#320 merged). You only (1) serve a model on the GPU and (2) set 2 env vars + restart. No code, no rebuild.

## Step 1 — SSH to the box and serve an open-weight coder (vLLM)
```bash
ssh <you>@167.233.50.75
nvidia-smi   # confirm the RTX 5000 + CUDA

docker run -d --restart=always --gpus all --name a11oy-vllm \
  -p 8000:8000 -v ~/.cache/huggingface:/root/.cache/huggingface \
  vllm/vllm-openai:latest \
  --model Qwen/Qwen2.5-Coder-32B-Instruct-AWQ --quantization awq \
  --max-model-len 16384 --gpu-memory-utilization 0.92 \
  --served-model-name Qwen/Qwen2.5-Coder-32B-Instruct
# If 32B-AWQ is tight on the RTX 5000's VRAM, fall back (no --quantization):
#   --model meta-llama/Llama-3.1-8B-Instruct
# OR the smaller coder:  --model Qwen/Qwen2.5-Coder-7B-Instruct

# wait ~2-5 min for the model to load, then smoke test:
curl -s http://localhost:8000/v1/models | jq '.data[].id'
```

## Step 2 — point a11oy at it + restart (same place HF_TOKEN is set today)
The a-11-oy.com deployment env lives on this host — the k8s `deploy/manifests/a11oy-deployment.yaml` env block, OR the container's `-e` / `.env`, wherever `HF_TOKEN` is set now. Add:
```
A11OY_MODEL_BASE_URL=http://127.0.0.1:8000/v1
A11OY_GPU_TOKEN=<the vLLM --api-key, if you set one; else omit>
A11OY_GPU_LABEL=NVIDIA RTX 5000 @ Hetzner
```
Then restart the a11oy container/deployment (factory rebuild also picks up the merged Python: #319/#320/#321/#322).

## Step 3 — verify (the proof)
```bash
curl -s https://a-11-oy.com/api/a11oy/v1/code/health | jq '.inference,.primary_model'
#   MUST become:  "self-hosted-gpu"  |  "Qwen/Qwen2.5-Coder-..."
curl -s https://a-11-oy.com/api/a11oy/v1/sovereign-compute | jq '.summary'
#   MUST become:  "PARTIAL SOVEREIGN..." or "SOVEREIGN-GPU LIVE"
```
When `inference: self-hosted-gpu` appears, the agent is running on YOUR GPU — screenshot the `/sovereign-compute` panel for the Day-3 headline.

## Optional, same box — live vertical embeddings (lights up legal/cyber/realestate/defense/finance semantic search)
```bash
docker run -d --restart=always --gpus all --name a11oy-tei \
  -p 8001:80 ghcr.io/huggingface/text-embeddings-inference:1.5 \
  --model-id BAAI/bge-large-en-v1.5
```
Then add to the a11oy env + restart:
```
A11OY_EMBED_BASE_URL=http://127.0.0.1:8001/v1
A11OY_EMBED_MODEL=BAAI/bge-large-en-v1.5
```
Verify: `curl -s https://a-11-oy.com/api/a11oy/v1/alloy-embed-fabric/health | jq '.backend.kind,.backend.reachable'` → `"self-hosted-gpu", true`.

## If you'd rather Forge do it
Grant Forge SSH to 167.233.50.75 (a deploy key / least-priv user that can `docker run` + edit the deployment env), then point it at `replit-sync/forge_gpu_bringup.py`. Until then, the box step can only be done by someone with shell on the box.

Doctrine v11: open-weight models only; never commit the key; nothing claims sovereign until `/code/health` returns `self-hosted-gpu`.
