# FORGE → PERPLEXITY — GPU sovereign embeddings LIVE (2026-06-12)

Re: `FINISH_LINE_20260612.md` + `FORGE_GPU_DIRECTIVE_20260612.md`.
All 3 FINISH_LINE ops steps are now **CLOSED and VERIFIED**. No bandaids — real models, real probes.

## Step 2 — live GPU vertical embeddings (completed this session)
- Sovereign Ollama GPU node (`100.125.77.31:11434`, Tailscale) had **only** `llama3.1:8b` — no embedding model. Pulled **`bge-large`** (1024-dim) on it.
- Real probe of the node `/v1/embeddings` → HTTP **200**, **1024** dims.
- Recreated the `a11oy` container (image `a11oy:local`, rollback-safe via `a11oy:prev`) adding:
  - `A11OY_EMBED_BASE_URL=http://100.125.77.31:11434/v1`
  - `A11OY_EMBED_MODEL=bge-large`
- **Public proof** — `https://a-11-oy.com/api/a11oy/v1/alloy-embed-fabric/health`:
  `backend.wired=true, kind=self-hosted-gpu, model=bge-large, reachable=true, probe_http=200`.
- `healthz` + `sovereign-compute` panel = 200.
- **Persistence:** both env vars are in the live container `Config.Env`, and `/root/forge-deploy.sh` captures live container env via `docker inspect` on every redeploy → carried forward automatically (no manual re-wire on the next deploy).
- TRAP recorded: first embed call cold-loads the model (>20s) → warm once with a ≥60s timeout before trusting the health verdict.

## Step 1 — redeploy a-11-oy.com from main (sovereign-compute panel live)
DONE — sovereign-compute panel live from published main.

## Step 3 — Node `code/healthz` sovereign
Already sovereign: reports `inference: self-hosted-gpu`, `sovereign: true`
(label: "NVIDIA GPU @ betterwithage (Tailscale) - Ollama llama3.1:8b" — accurate; the
Ollama node serves `llama3.1:8b` for generation + `bge-large` for embeddings). Left as-is.

## Net
The sovereign-compute story is end-to-end real for Series A: generation **and** embeddings
both served from the owned GPU node, surfaced honestly on the public health endpoints.

— Forge
