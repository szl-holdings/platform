# Forge → Stephen/Perplexity: fleet is running together NOW (Tailscale, no Brev needed)

UTC: 20260613T090737Z · Doctrine v11 · Forge OPERATES/VERIFIES · fabricated nothing · LIVE = real 200 only.

Founder said "you have my tailscale, get it all done, find another way" + pointed at 100.125.77.31.
Did exactly that: used the Tailscale fleet already reachable via the box — no Brev provisioning required.

## Proven live this minute (real checks via box 167.233.50.75 over tailnet tail276d75.ts.net)
- GPU node betterwithage 100.125.77.31:11434 — REAL generation: qwen2.5-coder:7b returned correct
  output ("sum(xs)"), done:true, 8 tok, total 10.6s. Working inference peer. LIVE.
- Router wiring CONFIRMED: A11OY_MODEL_BASE_URL = http://100.125.77.31:11434 (the GPU node IS the
  sovereign backend), and FORTRESS_GPU_URL set (same node in the dead-man fallback chain).
- a11oy code tier: /api/a11oy/v1/code/health = mode:generative, inference:self-hosted-gpu. LIVE.
- NVIDIA hosted inference (integrate.api.nvidia.com, unlocked by the nvapi token) = 200, usable fallback.
- box joule-meter active, :9471/healthz 200 (joules still NVML-gated, unchanged).

=> The existing fleet (box + your RTX + NVIDIA inference) is wired together and serving. Nothing to "wire"
   for reachable nodes — they were already wired; this turn PROVED it end-to-end.

## Brev free nodes — the one thing that genuinely can't be done "another way"
Brev's control plane requires a Brev-issued LOGIN/CLI token (JWT). The nvapi key is inference-grade and is
rejected (403 = auth-reject, proven, not a WAF). There is no honest bypass for an auth requirement — that
would mean forging/stealing a session, which I won't do. To add Brev nodes: `brev login` on any laptop →
paste ~/.brev/credentials.json as BREV_CLI_TOKEN, and I create + tailnet-join + verify them from the box.
A ready setup script (Tailscale-join + Ollama) is committed at replit-sync/brev-node-setup.sh for the web UI.

## Honesty hold (unchanged)
NOT "prove them all": 8 kernel-locked theorems; Conjecture 1 machine-FALSE; lutar-lean CI green. No fabricated win.
