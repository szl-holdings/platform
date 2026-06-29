# Forge report — sovereign brain restored (regression fix)

  **Date:** 2026-06-12
  **Author:** Forge (task agent)
  **Re:** FINISH_LINE_20260612.md step 3 ("brain sovereign") + sovereign-compute surface

  ## Correction of the record
  A prior sibling Forge completion report (12:02Z) stated "Step 3 — brain already sovereign." **That was inaccurate at the time I verified it.** Live curl showed the brain on `inference:hf-router`, `sovereign:false`. Embeddings were genuinely sovereign, but the brain had silently regressed. I treated this as a real regression and fixed it — no bandaid.

  ## Root cause (verified on box 167.233.50.75)
  - `/root/forge-deploy.sh` recreates the a11oy container by **capturing env from the LIVE container** (`docker inspect a11oy ... > /tmp/a11oy.env`) then `docker run --env-file`.
  - An earlier recreate (adding sovereign embeddings) built that env-file **without** the 3 brain vars. The live container therefore ran with EMBED vars but no `A11OY_MODEL_BASE_URL` → the brain fell back to hf-router.
  - `/etc/a11oy-gpu.env` still held the correct brain config the whole time — but capture-from-live ignored it, so the omission became sticky.

  ## Fix (verified live)
  1. Recreated the a11oy container from a complete `/tmp/a11oy.env` (image `a11oy:local` unchanged; rollback image tagged `a11oy:rollback-brainfix`; health-gated with auto-rollback).
  2. **Durability net** in `forge-deploy.sh` (idempotent, backup `.bak-brainfix`): append `/etc/a11oy-gpu.env` immediately after the docker-inspect capture. `docker --env-file` is last-dup-wins, so the persisted brain config can never again be dropped by a partial capture.

  ## Verification (no overclaims)
  - `GET /api/a11oy/v1/code/health` → `inference:self-hosted-gpu`, `mode:generative`, `token_source:A11OY_GPU_TOKEN`, `router_base:http://100.125.77.31:11434/v1`.
  - **Public** `GET https://a-11-oy.com/api/a11oy/v1/sovereign-compute` → `summary: "SOVEREIGN-GPU LIVE"`, brain `sovereign=true` + embeddings sovereign.
  - GPU node genuinely serves chat (direct probe 200; roster fallback `meta-llama/Llama-3.1-8B-Instruct` is present on the node — Qwen primary 404s then falls through). Real gen path = `_ac_hf_chat` (used by `/code/auto`,`/code/route`).

  ## Honest caveats
  - The box itself remains **CPU-only**; the GPU is a remote Tailscale node (real dependency/SPOF), not local sovereign hardware.
  - `/code/complete` and `/code/chat-deep` are advisory/router **stubs** (canned, ~0.1s, fabricated model id) — they are NOT the GPU path and should not be cited as generation proof.
  - `primary_model` displays the Qwen roster label; actual execution model surfaces in the generation meta. No relabeling.

  ## Founder-gated (untouched, per doctrine)
  Cosign keyed signing, RTX-5000/vLLM stronger node, cross-organ base envs — left for the founder.
  