# FINISH LINE — 3 ops steps to close everything — 2026-06-12

The estate is sovereign and green. **All codeable work is merged.** What's left is 3 small ops actions on the box that's already wired (the GPU is live, so the hard part is done). Each is copy-paste; none needs new code.

> Verified now: Chaski brain `self-hosted-gpu` (Qwen2.5-Coder-32B on RTX 5000), probe SOVEREIGN-GPU ONE-OF-ONE LIVE, a-11-oy.com/killinchu/yarqa all 200, doctrine green, szl-uds-deployment main CI (push) green, release-please working.

## 1. Redeploy a-11-oy.com from main → ships 4 merged Python PRs at once
a-11-oy.com (Hetzner 167.233.50.75) is on a build between #320 and #322. A redeploy from `main` HEAD picks up:
- **#319** self-hosted-gpu health label (already live — confirms)
- **#320** embed-fabric backend probe (route already live)
- **#321** Operational Validation fix (Node strip-types + manifest)
- **#322** Sovereign Compute single-pane → `GET /api/a11oy/v1/sovereign-compute` + `/sovereign-compute` panel goes live (the outbrief screenshot)
```bash
# on 167.233.50.75, in the a11oy deploy dir:
git pull && <your-usual-restart>   # e.g. docker compose up -d --build  OR  kubectl rollout restart deploy/a11oy
curl -s https://a-11-oy.com/api/a11oy/v1/sovereign-compute | jq '.summary'   # → "PARTIAL SOVEREIGN..." or "SOVEREIGN-GPU LIVE"
```

## 2. Light up live vertical embeddings (Ollama is already on the box)
The GPU runs Ollama (:11434) which serves OpenAI-compatible `/v1/embeddings`. ~2 commands:
```bash
ollama pull bge-large            # or: nomic-embed-text
# add to a11oy deploy env, then restart:
#   A11OY_EMBED_BASE_URL=http://100.125.77.31:11434/v1
#   A11OY_EMBED_MODEL=bge-large
curl -s https://a-11-oy.com/api/a11oy/v1/alloy-embed-fabric/health | jq '.backend.kind,.backend.reachable'
#   → "self-hosted-gpu", true   (verticals now do real semantic retrieval)
```

## 3. Sync the Node layer to sovereign (cosmetic-but-honest)
`a-11-oy.com/api/a11oy/code/healthz` (Node `serve.ts`) still reports `inference:hf-router` / `sovereign:null` while the Python layer is sovereign. Set the same `A11OY_MODEL_BASE_URL` (+ `A11OY_GPU_LABEL=NVIDIA RTX 5000 @ Hetzner`) for the Node process so both layers agree. (Python `/v1/code/health` is authoritative + already sovereign; this just makes the Node healthz match.)

---

### Forge-toolchain only (low priority, does NOT gate main CI)
- **UDS real-cluster Test** (`Test Install`/`Test Upgrade`, manual-dispatch only — push-skipped, so main is green): the `zarf init` step hits a uds-cli v0.31.0 `"timed out after 0 seconds"`. #79 (init-pull+retry) + #80 (maxTotalSeconds) are in; the residual is a uds-cli quirk to debug with a local `uds run` — try a single-line `cmd:`, a `wait:` override, or pinning a known-good uds-cli in `.github/workflows/test.yaml`.

### Founder-gated (your approval)
- Cosign signing key (`SZL_COSIGN_PRIVATE_KEY_PEM` / `COSIGN_ECDSA_KEY`) → receipts non-repudiable. Inject as secret, never commit.
- Cross-organ base envs + scoped gh token (Tier-2 agent tools). Release PRs uds-mesh #86 / ouroboros #108 await your review.

Doctrine v11: locked=8, Λ=Conjecture 1, open-weight self-run, SLSA L1 honest, never commit a key, keep SAMPLE labels until the real feed is wired.
