#!/usr/bin/env python3
"""
forge_gpu_bringup.py — FORGE: stand up an open-weight LLM server on the RTX 5000
Hetzner GPU node and expose an OpenAI-compatible /v1 endpoint for Chaski.

WHO RUNS THIS: Forge (Replit), SSH'd into / running ON the Hetzner GPU box (it
holds the Hetzner credentials; the CTO agent does not). Run as a user that can
talk to Docker + the NVIDIA runtime.

WHAT IT DOES (idempotent):
  1. Detects the GPU + total VRAM via `nvidia-smi`.
  2. Picks a right-sized, OPEN-WEIGHT coder model for that VRAM (never a
     closed/gated model — doctrine: open-weight self-run only):
        >=40 GB : Qwen/Qwen2.5-Coder-32B-Instruct-AWQ   (matches current primary)
        >=22 GB : Qwen/Qwen2.5-Coder-14B-Instruct-AWQ
        >=14 GB : Qwen/Qwen2.5-Coder-7B-Instruct        (fits RTX 5000 Ada ~32GB easily;
                                                          also fits 16GB variants)
        < 14 GB : Qwen/Qwen2.5-Coder-3B-Instruct
     (Override with --model <hf_repo>.)
  3. Writes a docker-compose.yml that runs vLLM's OpenAI server with an API key
     and the model, GPU-enabled, restart=always.
  4. `docker compose up -d`, then polls http://127.0.0.1:8000/v1/models until the
     model is served (or reports honestly that it didn't come up).
  5. Prints the EXACT env values to set on the a11oy Space so Chaski uses this
     endpoint (A11OY_MODEL_BASE_URL + A11OY_GPU_TOKEN). Never prints the API key
     value — only the env-var NAMES and where to paste the key.

PREREQS on the box (the script checks + tells you if missing):
  - NVIDIA driver + nvidia-container-toolkit (so `docker run --gpus all` works)
  - Docker + docker compose v2
  - HF_TOKEN env if the chosen model repo is gated (Qwen coder models are NOT
    gated, so usually unnecessary)

ENV:
  - GPU_API_KEY : the API key to protect the local vLLM endpoint. If unset, the
    script GENERATES one and writes it to ./gpu_api_key.secret (chmod 600) and
    tells you to copy it into the a11oy Space secret A11OY_GPU_TOKEN. Never
    committed, never printed.

USAGE:
  python3 forge_gpu_bringup.py                 # detect + bring up
  python3 forge_gpu_bringup.py --model Qwen/Qwen2.5-Coder-14B-Instruct-AWQ
  python3 forge_gpu_bringup.py --port 8000 --max-model-len 16384

DOCTRINE v11: open-weight models ONLY; never prints secrets; honest status
(does not claim 'live' until /v1/models returns the model). locked=8,
Lambda=Conjecture 1.
"""
from __future__ import annotations
import argparse, json, os, re, secrets, shutil, subprocess, sys, time, urllib.request, urllib.error

COMPOSE_FILE = "docker-compose.gpu-llm.yml"
KEY_FILE = "gpu_api_key.secret"


def sh(cmd: list[str], check=False, **kw) -> subprocess.CompletedProcess:
    print("  $", " ".join(cmd))
    return subprocess.run(cmd, text=True, capture_output=True, check=check, **kw)


def detect_vram_gb() -> float:
    if not shutil.which("nvidia-smi"):
        sys.exit("ERROR: nvidia-smi not found. Install the NVIDIA driver on this box first.")
    cp = sh(["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader,nounits"])
    if cp.returncode != 0:
        sys.exit(f"ERROR: nvidia-smi failed: {cp.stderr.strip()}")
    line = (cp.stdout or "").strip().splitlines()[0]
    name, mem = [x.strip() for x in line.split(",")[:2]]
    gb = float(mem) / 1024.0
    print(f"[gpu] {name} — {gb:.1f} GB VRAM")
    return gb


def pick_model(vram_gb: float) -> str:
    if vram_gb >= 40:
        return "Qwen/Qwen2.5-Coder-32B-Instruct-AWQ"
    if vram_gb >= 22:
        return "Qwen/Qwen2.5-Coder-14B-Instruct-AWQ"
    if vram_gb >= 14:
        return "Qwen/Qwen2.5-Coder-7B-Instruct"
    return "Qwen/Qwen2.5-Coder-3B-Instruct"


def check_prereqs():
    ok = True
    if not shutil.which("docker"):
        print("::error:: docker not found — install Docker + docker compose v2."); ok = False
    else:
        cp = sh(["docker", "info"])
        if "nvidia" not in (cp.stdout + cp.stderr).lower():
            print("::warning:: NVIDIA Docker runtime not obviously present. Ensure "
                  "nvidia-container-toolkit is installed so `--gpus all` works.")
    if not ok:
        sys.exit(1)


def get_or_make_key() -> str:
    key = os.environ.get("GPU_API_KEY")
    if key:
        return key
    if os.path.exists(KEY_FILE):
        return open(KEY_FILE).read().strip()
    key = "vllm-" + secrets.token_urlsafe(32)
    with open(KEY_FILE, "w") as f:
        f.write(key)
    os.chmod(KEY_FILE, 0o600)
    print(f"[key] generated a new API key and wrote it to {KEY_FILE} (chmod 600). "
          f"NOT printed here. Copy its contents into the a11oy Space secret A11OY_GPU_TOKEN.")
    return key


def write_compose(model: str, port: int, api_key: str, max_len: int):
    # vLLM OpenAI server. API key passed via env (not committed). Model + KV cache
    # sized by --max-model-len; AWQ quant auto-detected from the repo name.
    quant = "\n      --quantization awq" if model.lower().endswith("awq") else ""
    compose = f"""# AUTO-GENERATED by forge_gpu_bringup.py — open-weight vLLM OpenAI server.
# Doctrine: open-weight model only. API key via VLLM_API_KEY env (never committed).
services:
  vllm:
    image: vllm/vllm-openai:latest
    restart: always
    runtime: nvidia
    environment:
      - VLLM_API_KEY=${{VLLM_API_KEY}}
      - HF_TOKEN=${{HF_TOKEN:-}}
    ports:
      - "{port}:8000"
    ipc: host
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    command: >
      --model {model}
      --served-model-name {model}{quant}
      --max-model-len {max_len}
      --api-key ${{VLLM_API_KEY}}
      --gpu-memory-utilization 0.92
"""
    with open(COMPOSE_FILE, "w") as f:
        f.write(compose)
    print(f"[compose] wrote {COMPOSE_FILE} for model {model} on port {port}")


def up_and_poll(port: int, api_key: str, model: str) -> bool:
    env = dict(os.environ, VLLM_API_KEY=api_key)
    cp = subprocess.run(["docker", "compose", "-f", COMPOSE_FILE, "up", "-d"],
                        text=True, capture_output=True, env=env)
    print("  compose up:", (cp.stdout or cp.stderr).strip()[:300])
    if cp.returncode != 0:
        print("::error:: docker compose up failed."); return False
    print("[poll] waiting for vLLM to load the model (first pull+load can take several minutes) ...")
    url = f"http://127.0.0.1:{port}/v1/models"
    deadline = time.time() + 20 * 60
    while time.time() < deadline:
        try:
            req = urllib.request.Request(url, headers={"Authorization": f"Bearer {api_key}"})
            with urllib.request.urlopen(req, timeout=15) as r:
                if r.status == 200:
                    data = json.loads(r.read().decode())
                    ids = [m.get("id") for m in data.get("data", [])]
                    if ids:
                        print(f"GPU LLM LIVE — /v1/models serves: {ids}")
                        return True
        except Exception as e:  # noqa: BLE001
            print(f"  not ready yet: {type(e).__name__}")
        time.sleep(20)
    print("::error:: model did not come up within timeout. Check `docker compose -f "
          f"{COMPOSE_FILE} logs vllm` — likely OOM (pick a smaller --model) or driver issue.")
    return False


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=None)
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--max-model-len", type=int, default=16384)
    args = ap.parse_args()

    check_prereqs()
    vram = detect_vram_gb()
    model = args.model or pick_model(vram)
    print(f"[model] using OPEN-WEIGHT model: {model}")
    api_key = get_or_make_key()
    write_compose(model, args.port, api_key, args.max_model_len)
    live = up_and_poll(args.port, api_key, model)

    print("\n================ WIRE CHASKI TO THIS GPU ================")
    print("Set these on the a11oy HF Space (Settings -> Variables/Secrets), then redeploy:")
    print(f"  A11OY_MODEL_BASE_URL = http://<this-box-public-ip-or-tailscale>:{args.port}/v1")
    print(f"  A11OY_GPU_TOKEN      = <contents of {KEY_FILE}>   (NEVER paste the key in chat/issues)")
    print("Then GET https://a-11-oy.com/api/a11oy/v1/code/health should report:")
    print("  inference: self-hosted-gpu   (PR #319 adds that honest label)")
    print(f"  primary_model: {model}")
    print("SECURITY: do NOT expose port", args.port, "to the public internet unauthenticated —")
    print("  front it with the a11oy Space over Tailscale/WireGuard or an authenticated reverse")
    print("  proxy. The vLLM --api-key is required, but network-restrict it too.")
    return 0 if live else 1


if __name__ == "__main__":
    raise SystemExit(main())
