# Forge — CODE DONE, BOX-ONLY remains: a-11-oy.com sovereign GPU flip

Status as of 2026-06-13 ~02:13 UTC (verified live by Perplexity agent).

## Live posture RIGHT NOW (the thing to fix)
`curl -s https://a-11-oy.com/api/a11oy/code/healthz` reports:
- `sovereign: false`
- `inference: hf-router`
- `key_resolution.base_url: https://router.huggingface.co/v1`
- `primary_model: Qwen/Qwen2.5-Coder-32B-Instruct` (open-weight — honest, no overclaim)

So Chaski is LIVE + open-weight but renting HF Router compute. The self-hosted GPU
brain is NOT serving. This is honest (app self-reports sovereign:false) but it is the
one-tier-down state. Goal: flip `inference` back to `self-hosted-gpu`.

## Why it hasn't flipped (root cause, not permission)
Founder approval for the box step is GRANTED (Stephen, repeated). The block is purely
mechanical: `replit-sync/AUTO_STATE.json` shows `dispatch_mode: none, dispatch_ok: false`.
The hourly box poll READS + classifies this order and hands the 4 box actions to
"Forge agent", but NO agent endpoint (`FORGE_DISPATCH_CMD` / `FORGE_AGENT_URL`) is wired in
`/etc/forge-perplexity.env`, so nothing executes. Forge's own report 20260613 says exactly
this. App code is DONE (#324, HEAD 730dc929) — no further code change is needed.

## The ONLY remaining action — run AS ROOT on the Hetzner box (167.233.50.75)
This is a single paste. `replit-sync/WIRE_IT_UP.sh` does steps 0+5 (wire dispatch + deploy
mesh-resilience). Steps 1-4 below are the GPU flip itself; once dispatch is wired, Forge
performs them autonomously on its next poll — OR run them directly now:

```bash
# 1) serve an open-weight model on the betterwithage GPU, OpenAI-compatible
ollama pull qwen2.5-coder:7b        # keep llama3.1:8b too
curl -s http://127.0.0.1:11434/v1/models   # MUST succeed BEFORE the rebuild

# 2) point a-11-oy.com's deploy env at the local server
#    (in the a-11-oy.com deploy environment, not committed):
#    A11OY_MODEL_BASE_URL=http://127.0.0.1:11434/v1
#    A11OY_GPU_LABEL="NVIDIA RTX 5000 @ Hetzner (betterwithage)"

# 3) rebuild
sudo a11oy-rebuild
```

## PROVE (report to platform#343, NOT the token)
```bash
curl -s https://a-11-oy.com/api/a11oy/code/healthz \
  | jq '.sovereign,.inference,.key_resolution.base_url,.key_resolution.env_used'
# WANT: true  "self-hosted-gpu"  "http://127.0.0.1:11434/v1"  (env_used != "HF_TOKEN")
```
Plus one `/api/a11oy/code/chat/stream` turn whose `route.model` is the local tag with NO
`cost_usd`.

## Honesty floor (v11)
If `/v1/models` is NOT reachable at rebuild time, the app CORRECTLY stays
`sovereign:false / hf-router` — make the model server succeed FIRST. The half-state
(env set but server down) is the only unacceptable outcome; if you can't serve the model,
run the honest revert (unset both envs + `sudo a11oy-rebuild` -> sovereign:false).
locked=8, Λ=Conjecture 1, BFT=Conjecture 2, open-weight only, never commit a key.
