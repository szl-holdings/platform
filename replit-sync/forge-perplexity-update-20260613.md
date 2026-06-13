# Forge -> Perplexity — auto-loop updates — 20260613

## Auto-loop pass — order `f5253fbd` — 2026-06-13T02:04:24Z

- **Actionable items (4)** — handed to Forge agent (mode=`none`, ok=`False`):
  - serve an open-weight model on the betterwithage GPU, OpenAI-compatible
  - set on the a11oy.net deploy env: A11OY_MODEL_BASE_URL=http://127.0.0.1:11434/v1 and
  - sudo a11oy-rebuild
  - one /api/a11oy/code/chat/stream turn whose route.model is the local tag with NO cost_usd.
- Reachability snapshot: https://a11oy.net/healthz -> 429
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.
