# Forge → Stephen/Perplexity — "route all nodes through docker": unified LiteLLM gateway (ready to light up)

UTC 2026-06-13 · Doctrine v11 · Forge OPERATES/VERIFIES · no merge · no key committed · LIVE = real 200 only.

Founder: "I want all the nodes routed through docker — does that help? or make sure they are ready to light up."

## Does docker help? — honest answer
- **YES, as ONE unifying gateway.** A single self-hosted, OpenAI-compatible **LiteLLM** container fronts EVERY
  node behind one stable URL (`/v1/chat/completions`). This is exactly the standing Perplexity→Forge
  instruction ("stand up a LiteLLM proxy as the SINGLE stable endpoint; free tiers as zero-cost fallbacks").
- **NO for the hosted free tiers themselves** (GitHub Models / HF / Groq / NVIDIA NIM) — those are external
  SaaS APIs; there is nothing to containerize, they're already reachable + wired.
- **For YOUR GPU rigs:** the useful docker move is running **Ollama as a container** (`--gpus all
  --restart unless-stopped`) so a rig is always "ready to light up" + auto-restarts. That runs on your
  hardware (Windows/WSL), not the box.

## What I built + VERIFIED this turn
Unified gateway = `litellm.config.yaml` + `docker-compose.yml` + `litellm-up.sh`/`litellm-down.sh`
(committed here under `litellm-gateway/`, staged on box at `/opt/alloyscape/litellm/`).
- Routes, free-first (matches the fortress dead-man chain): unified alias **`szl-auto`** →
  github-models → hf → groq → nvidia-nim → sovereign-gpu → openai(paid). Plus **`szl-sovereign`**
  (sovereign GPU first, for governed a11oy turns) and every tier addressable by name.
- **Proven real round-trip** (ran the actual `ghcr.io/berriai/litellm` image, called the gateway):
  `model:"szl-auto"` → returned "GATEWAY OK"; `model:"groq"` → "PONG". All four free-tier keys present
  in the box `.env`.

## Ready to light up — ONE command (deliberately NOT auto-started)
```
/opt/alloyscape/litellm/litellm-up.sh        # → http://127.0.0.1:4000  (down: litellm-down.sh)
```
I did **not** start it on the box: it's memory-tight right now (~1.5 GB free, already swapping; a11oy +
killinchu + k3d are the priority). The container is hard-capped at 700 MB so it can never starve them.
Best home for it long-term: the always-on dedicated GPU/Tier-A box from the runbook, or run it on the box
once memory frees. Either way it's one command away and validated.

## Live node inventory (real `/api/a11oy/v1/compute-pool`, honest)
- hetzner-box-cpu — sovereign CPU (Lean verify/orchestration) — reachable.
- rtx-betterwithage (100.125.77.31) — **sovereign GPU, live** (qwen2.5-coder:7b, llama3.1:8b, bge-large).
- chaski (100.76.58.50) — tailnet GPU, **offline ~22h** (honest: not fabricated up; registers the moment Ollama starts).
- groq / nvidia-nim — hosted fallback (not owned, not sovereign).
=> nodes reachable 5/6, gpu reachable 1, sovereign_gpu_live=true.

## Still founder-gated (unchanged, your hardware)
- First MEASURED joule: one PowerShell line on betterwithage → `iwr -useb http://100.96.129.45:9471/exporter.ps1 | iex`.
- Brev free GPU nodes: need a Brev **CLI/login** token (the nvapi key is inference-only) — `brev login` then paste creds.

Doctrine: locked=8, Λ=Conjecture 1 (machine-FALSE), open-weight only, never commit a key. Not merging.
— Forge
